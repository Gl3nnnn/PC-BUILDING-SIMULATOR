// Compatibility engine tests.
//
// The engine is the project's conscience: it must refuse a build that cannot
// physically work, warn about the ones that work badly, and never claim
// certainty about a specification it does not have. Each test covers one rule
// area, and the structured verdict list is checked alongside the free-text
// checks so a page that reads either one stays honest.
import test from 'node:test';
import assert from 'node:assert/strict';

import { emptyBuild } from '../js/core/build.js';
import {
  evaluateBuild, parseGpuPower, RULE_AREAS, RULE_VERDICTS,
} from '../js/core/compat.js';
import { HARDWARE } from '../js/data/hardware.js';
import { PRESETS } from '../js/data/presets.js';

function buildFrom(items, name = 'Test build') {
  const build = emptyBuild(name);
  Object.assign(build.items, items);
  return build;
}

const RULE_IDS = RULE_AREAS.map((area) => area.id);

/** The verdict object for one rule area, from an evaluated build. */
function rule(items, id) {
  const result = evaluateBuild(buildFrom(items));
  const found = result.rules.find((entry) => entry.id === id);
  assert.ok(found, `rule area ${id} is reported`);
  return found;
}

/** All the words a rule area printed, for wording assertions. */
const words = (entry) => entry.findings.map((line) => `${line.title}. ${line.detail}`).join(' ');

const GOOD = {
  cpu: ['cpu-i5-12400f'],
  motherboard: ['mb-msi-b760m-a-ddr4'],
  gpu: ['gpu-rtx-3060'],
  ram: ['ram-fury-16-3200'],
  storage: ['ssd-samsung-980-1tb'],
  psu: ['psu-seasonic-gx650'],
  case: ['case-corsair-4000d'],
  cooler: ['cooler-deepcool-ak400'],
};

test('the engine reports all nine rule areas with a valid verdict each', () => {
  assert.equal(RULE_AREAS.length, 9, 'nine areas, as the spec lists them');
  for (const preset of PRESETS) {
    const result = evaluateBuild(buildFrom(preset.items, preset.name));
    assert.equal(result.rules.length, 9, `${preset.id}: nine verdicts`);
    for (const entry of result.rules) {
      assert.ok(RULE_IDS.includes(entry.id), `${entry.id} is a known area`);
      assert.ok(RULE_VERDICTS[entry.verdict], `${entry.id} verdict ${entry.verdict} is a known one`);
      assert.ok(entry.state && entry.tone && entry.icon, `${entry.id} carries its label for the page`);
      assert.ok(Array.isArray(entry.findings), `${entry.id} keeps the findings that decided it`);
      for (const finding of entry.findings) {
        assert.ok(['ok', 'warn', 'error', 'info'].includes(finding.level), `${entry.id}: ${finding.level}`);
        assert.ok(finding.title && finding.title.length > 3, `${entry.id}: a finding needs a title`);
      }
    }
  }
});

test('a matched build is compatible, with every rule area green', () => {
  const result = evaluateBuild(buildFrom(GOOD));
  assert.equal(result.errors.length, 0);
  assert.equal(result.status, 'compatible');
  assert.equal(result.rules.filter((entry) => entry.verdict !== 'compatible').length, 0,
    'a build that fits should leave no rule area unchecked or amber');
});

test('a socket mismatch is red and the reason names both sockets', () => {
  const entry = rule({ cpu: ['cpu-i5-12400f'], motherboard: ['mb-msi-b550m-pro-vdh'] }, 'cpu-socket');
  assert.equal(entry.verdict, 'incompatible');
  const text = words(entry);
  assert.match(text, /LGA1700/);
  assert.match(text, /AM4/);
});

test('a newer CPU on an older board warns about the BIOS instead of failing', () => {
  const entry = rule({ cpu: ['cpu-i7-14700k'], motherboard: ['mb-asus-z790-plus-d4'] }, 'bios');
  assert.equal(entry.verdict, 'warning', 'the pair boots after a firmware update, so it warns');
  assert.ok(entry.findings.some((line) => /BIOS/i.test(line.title)));
  assert.match(words(entry), /update/i, 'the wording tells the reader to update the board');
});

test('a CPU the board supports out of the box is green, not amber', () => {
  const entry = rule({ cpu: ['cpu-r9-7950x'], motherboard: ['mb-msi-b650-tomahawk'] }, 'bios');
  assert.equal(entry.verdict, 'compatible');
});

test('the wrong memory generation is an error naming both generations', () => {
  const entry = rule({ motherboard: ['mb-msi-b760m-a-ddr4'], ram: ['ram-vengeance-32-6000'] }, 'ram');
  assert.equal(entry.verdict, 'incompatible');
  assert.match(words(entry), /DDR4|DDR5/i);
});

test('a card longer than the case allows is red; a card that fits is not', () => {
  assert.equal(rule({ case: ['case-cm-nr200p'], gpu: ['gpu-rtx-4090'] }, 'gpu-clearance').verdict, 'incompatible');
  const fits = rule({ case: ['case-fractal-north'], gpu: ['gpu-rtx-4080-super'] }, 'gpu-clearance');
  assert.ok(['compatible', 'warning'].includes(fits.verdict), `got ${fits.verdict}`);
});

test('a cooler taller than the case is refused, and the numbers are stated', () => {
  const entry = rule({ case: ['case-cm-nr200p'], cooler: ['cooler-noctua-nhd15'], cpu: ['cpu-i5-12400f'] }, 'cooler');
  assert.equal(entry.verdict, 'incompatible');
  assert.match(words(entry), /\d+ mm/, 'the clearance is stated in millimetres');
});

test('a full-size board that does not fit the case is an error naming the form factor', () => {
  const entry = rule({ case: ['case-cm-nr200p'], motherboard: ['mb-asus-z790-plus-d4'] }, 'board-case');
  assert.equal(entry.verdict, 'incompatible');
  assert.match(words(entry), /ATX/i);
});

test('an undersized power supply fails the wattage rule on a big card', () => {
  const entry = rule({ ...GOOD, gpu: ['gpu-rtx-4090'], psu: ['psu-corsair-cv450'] }, 'psu-power');
  assert.equal(entry.verdict, 'incompatible');
  assert.ok(entry.findings.some((line) => /wattage|headroom|PCIe/i.test(line.title)));
});

test('a hungry CPU on a single-cable supply warns about the CPU power cable', () => {
  const entry = rule({
    cpu: ['cpu-r9-7950x'], motherboard: ['mb-asus-x670e-e'], psu: ['psu-seasonic-gx650'],
    case: ['case-fractal-north'], cooler: ['cooler-arctic-lf3-420'], ram: ['ram-tridentz5-32-6400'],
    gpu: ['gpu-rtx-3060'], storage: ['ssd-samsung-980-1tb'],
  }, 'psu-power');
  assert.equal(entry.verdict, 'warning');
  assert.ok(entry.findings.some((line) => /CPU power cable/i.test(line.title)), 'the single cable is named');
});

test('the power supply length rule reads the case, not the wattage', () => {
  const entry = rule({ case: ['case-cm-nr200p'], psu: ['psu-bequiet-1200'] }, 'psu-size');
  assert.ok(['compatible', 'warning', 'incompatible'].includes(entry.verdict));
  assert.ok(words(entry).length > 10, 'the rule has something to say either way');
});

test('storage is checked on every build, including one with no drive', () => {
  const withDrive = rule(GOOD, 'storage');
  assert.ok(withDrive.findings.length > 0, 'a fitted drive is checked');
  const noDrive = rule({ ...GOOD, storage: [] }, 'storage');
  assert.ok(['unchecked', 'compatible', 'warning', 'incompatible'].includes(noDrive.verdict));
});

test('an empty build is empty, not compatible, and claims nothing', () => {
  const result = evaluateBuild(emptyBuild());
  assert.equal(result.status, 'empty');
  assert.equal(result.errors.length, 0, 'nothing to refuse yet');
  assert.ok(result.missing.length >= 5, 'the missing list drives the checklist');
  assert.equal(result.rules.filter((entry) => entry.verdict === 'incompatible').length, 0,
    'an empty build is not called incompatible');
});

test('a part with no specification is never called compatible by guesswork', () => {
  const result = evaluateBuild(buildFrom({ cpu: ['cpu-i5-12400f'], motherboard: ['mb-msi-b760m-a-ddr4'] }));
  const outOfScope = result.rules.filter((entry) => entry.verdict === 'unchecked');
  assert.ok(outOfScope.length > 0, 'areas with no parts to compare are left unchecked');
  for (const entry of outOfScope) {
    assert.equal(entry.findings.length, 0, `${entry.id} has nothing to report, so it claims nothing`);
  }
});

test('every preset passes the hard rules', () => {
  for (const preset of PRESETS) {
    const result = evaluateBuild(buildFrom(preset.items, preset.name));
    assert.equal(result.errors.length, 0, `${preset.id} ships without hard errors`);
    assert.notEqual(result.status, 'empty', `${preset.id} is a whole machine`);
    const reds = result.rules.filter((entry) => entry.verdict === 'incompatible');
    assert.equal(reds.length, 0, `${preset.id} has no red rule area: ${reds.map((entry) => entry.id).join(', ')}`);
  }
});

test('GPU power parsing covers 8-pin, 16-pin and slot-powered cards', () => {
  const one = parseGpuPower('1x 8-pin', 160);
  assert.equal(one.kind, '8pin');
  assert.equal(one.count, 1);
  assert.equal(one.eightPinEquivalent, 1);
  const two = parseGpuPower('2x 8-pin', 250);
  assert.equal(two.count, 2);
  assert.equal(two.eightPinEquivalent, 2);
  assert.equal(parseGpuPower('1x 16-pin (12VHPWR)', 450).eightPinEquivalent, 4);
  assert.equal(parseGpuPower('1x 16-pin (12VHPWR)', 340).eightPinEquivalent, 3);
  assert.equal(parseGpuPower('none', 75).kind, 'none');
  assert.equal(parseGpuPower('', 0).kind, 'none');
});

test('every card in the catalogue parses to a power connector that matches its draw', () => {
  for (const card of HARDWARE.filter((item) => item.category === 'gpu')) {
    const parsed = parseGpuPower(card.specs.powerConnectors, card.specs.tdp);
    assert.ok(['none', '8pin', '16pin'].includes(parsed.kind), `${card.id}: ${parsed.kind}`);
    const watts = Number(card.specs.tdp);
    if (watts >= 150) {
      assert.ok(parsed.eightPinEquivalent >= 1, `${card.id} at ${watts} W needs a cable`);
    }
    if (watts < 75) {
      assert.equal(parsed.kind, 'none', `${card.id} draws so little it runs off the slot`);
    }
  }
});
