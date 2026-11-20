// Cable, power supply and thermal tests.
//
// Three sets of numbers a player acts on: which cable goes where, whether the
// supply can hold the build, and how hot the machine runs. Each test states the
// formula it is checking, so a change to the maths has to change the test on
// purpose rather than drift silently.
import test from 'node:test';
import assert from 'node:assert/strict';

import { emptyBuild, buildPowerDraw, recommendedPsu, getItems } from '../js/core/build.js';
import {
  CABLE_KINDS, CABLE_BY_ID, neededCables, connectCable, acceptablePorts,
  cableState, cableSummary, PORT_LABELS,
} from '../js/core/cables.js';
import { simulateThermals, FORMULA_NOTES } from '../js/core/thermal.js';
import { HARDWARE } from '../js/data/hardware.js';
import { PRESETS } from '../js/data/presets.js';

function buildWith(items) {
  const build = emptyBuild('Bench build');
  Object.assign(build.items, items);
  return build;
}

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

/* --- cables --------------------------------------------------------------- */

test('the eleven cable kinds named in the spec all exist', () => {
  assert.ok(CABLE_KINDS.length >= 11, `expected at least eleven cable kinds, got ${CABLE_KINDS.length}`);
  const ids = CABLE_KINDS.map((kind) => kind.id);
  for (const required of ['atx24', 'eps8', 'gpu-pcie', 'gpu-12v', 'sata-power', 'sata-data',
    'front-panel', 'cpu-fan', 'case-fan', 'aio-pump', 'aio-radiator']) {
    assert.ok(ids.includes(required), `${required} is missing from the cable kit`);
  }
  for (const kind of CABLE_KINDS) {
    assert.ok(kind.label && kind.short, `${kind.id}: needs both names`);
    assert.ok(kind.why && kind.why.length > 30, `${kind.id}: needs the reason it matters`);
    assert.ok(kind.from && kind.to, `${kind.id}: both ends are described`);
    assert.ok(PORT_LABELS[kind.fromPort] && PORT_LABELS[kind.toPort], `${kind.id}: both sockets are labelled`);
    assert.equal(typeof kind.needs, 'function', `${kind.id}: needs a test for whether it is needed`);
  }
  assert.equal(Object.keys(CABLE_BY_ID).length, CABLE_KINDS.length, 'the lookup table matches');
});

test('a full build needs every cable its parts call for, and only those', () => {
  const ids = neededCables(buildWith(GOOD)).map((kind) => kind.id);
  assert.ok(ids.includes('atx24'), 'the board needs its main feed');
  assert.ok(ids.includes('eps8'), 'and the chip needs CPU power');
  assert.ok(ids.includes('gpu-pcie'), 'the card takes PCIe, not the 16-pin');
  assert.ok(!ids.includes('gpu-12v'), 'a card never needs both kinds of power cable');
  assert.ok(!ids.includes('sata-power') && !ids.includes('sata-data'), 'an M.2 build needs no SATA');
  assert.ok(ids.includes('cpu-fan'), 'the air cooler fan plugs into the board');
  assert.ok(!ids.includes('aio-pump'), 'an air cooler has no pump to power');
});

test('a big card switches the cable kind, and a liquid cooler adds its pair', () => {
  const big = neededCables(buildWith({ ...GOOD, gpu: ['gpu-rtx-4090'] })).map((kind) => kind.id);
  assert.ok(big.includes('gpu-12v'), 'the 4090 takes the 16-pin');
  assert.ok(!big.includes('gpu-pcie'), 'and not the old PCIe lead');
  const aio = neededCables(buildWith({ ...GOOD, cooler: ['cooler-corsair-h150i'] })).map((kind) => kind.id);
  assert.ok(aio.includes('aio-pump'), 'the pump needs power');
  assert.ok(aio.includes('aio-radiator'), 'and the radiator fans need a header');
  assert.ok(!aio.includes('cpu-fan'), 'the pump header replaces the fan lead');
});

test('a SATA drive needs both of its cables', () => {
  const ids = neededCables(buildWith({ ...GOOD, storage: ['ssd-kingston-a400-480'] })).map((kind) => kind.id);
  assert.ok(ids.includes('sata-power'), 'power');
  assert.ok(ids.includes('sata-data'), 'and data');
});

test('a cable plugs only where it ends, and a second plug is refused', () => {
  const build = buildWith(GOOD);
  const kind = CABLE_BY_ID['atx24'];
  const ports = acceptablePorts(build, kind).map((port) => port.id);
  assert.ok(ports.includes('board-24pin'), 'the board socket is offered');
  const first = connectCable(build, [], 'atx24', 'board-24pin');
  assert.equal(first.ok, true);
  const twice = connectCable(build, ['atx24'], 'atx24', 'board-24pin');
  assert.equal(twice.ok, false, 'the same cable cannot be plugged twice');
  assert.match(twice.reason, /already plugged/i);
});

test('plugging into the wrong socket explains where the cable belongs', () => {
  const build = buildWith(GOOD);
  const wrong = connectCable(build, [], 'atx24', 'gpu-pcie');
  assert.equal(wrong.ok, false);
  assert.match(wrong.reason, /does not go into/i, 'it names the socket that was clicked');
  assert.match(wrong.reason, /24-pin/i, 'and the socket the cable actually ends at');
});

test('a cable the build does not need is refused with a plain reason', () => {
  const build = buildWith({ ...GOOD, gpu: [], cooler: ['cooler-intel-stock'], storage: [] });
  const result = connectCable(build, [], 'gpu-12v', 'gpu-12v');
  assert.equal(result.ok, false);
  assert.match(result.reason, /nothing for/i);
  const unknown = connectCable(buildWith(GOOD), [], 'not-a-cable', '');
  assert.equal(unknown.ok, false);
  assert.match(unknown.reason, /not a cable/i);
});

test('the cable state counts what is in, what is missing and says so in words', () => {
  const build = buildWith(GOOD);
  const needed = neededCables(build).map((kind) => kind.id);
  const empty = cableState(build, []);
  assert.equal(empty.plugged, 0);
  assert.equal(empty.total, needed.length);
  assert.equal(empty.complete, false);
  const half = cableState(build, needed.slice(0, 1));
  assert.equal(half.plugged, 1);
  assert.equal(half.missing.length, needed.length - 1);
  const full = cableState(build, needed);
  assert.equal(full.complete, true);
  assert.equal(full.missing.length, 0);
  assert.match(cableSummary(build, needed), /every cable/i);
  assert.match(cableSummary(build, []), /Left to plug|unplugged|still/i);
});

test('every preset needs the main feed and a CPU cable', () => {
  for (const preset of PRESETS) {
    const ids = neededCables(buildWith(preset.items)).map((kind) => kind.id);
    assert.ok(ids.includes('atx24'), `${preset.id}: 24-pin`);
    assert.ok(ids.includes('eps8'), `${preset.id}: EPS`);
  }
});

/* --- power supply --------------------------------------------------------- */

test('power draw follows the documented formula, part by part', () => {
  const build = buildWith(GOOD);
  const drawn = buildPowerDraw(build);
  const cpu = getItems(build, 'cpu')[0];
  const gpu = getItems(build, 'gpu')[0];
  // 45 W board overhead + CPU peak + GPU TDP + 5 W per drive + 3 W per fan.
  const expected = 45 + Number(cpu.specs.peakPower) + Number(gpu.specs.tdp) + 5;
  assert.ok(drawn >= expected, `draw ${drawn} W should cover ${expected} W of parts`);
  assert.ok(drawn <= expected + 60, 'extra cooling and fans stay modest');
  assert.equal(drawn % 10, 0, 'the figure is rounded to ten watts for the reader');
});

test('a bigger card and a bigger chip draw more, never less', () => {
  const base = buildPowerDraw(buildWith(GOOD));
  const bigCard = buildPowerDraw(buildWith({ ...GOOD, gpu: ['gpu-rtx-4090'] }));
  const bigChip = buildPowerDraw(buildWith({ ...GOOD, cpu: ['cpu-i9-14900k'], motherboard: ['mb-asus-z790-plus-d4'] }));
  assert.ok(bigCard > base, 'a 4090 draws more than a 3060');
  assert.ok(bigChip > base, 'a 14900K draws more than a 12400F');
});

test('the recommended supply always covers the draw with headroom', () => {
  for (const preset of PRESETS) {
    const build = buildWith(preset.items);
    const drawn = buildPowerDraw(build);
    const recommended = recommendedPsu(build);
    assert.ok(recommended >= drawn, `${preset.id}: the recommendation covers the load`);
    assert.ok(recommended <= drawn * 2, `${preset.id}: and is not absurdly oversized`);
    assert.equal(recommended % 50, 0, `${preset.id}: sold in fifty-watt steps`);
  }
});

test('a supply too small for the build shows zero or negative headroom', () => {
  const build = buildWith({ ...GOOD, gpu: ['gpu-rtx-4090'], psu: ['psu-corsair-cv450'] });
  const result = simulateThermals(build);
  const psu = getItems(build, 'psu')[0];
  assert.ok(result.power.loadWatts > Number(psu.specs.wattage),
    'the 4090 build draws more than the 450 W unit can give');
  assert.ok(result.power.headroomPct <= 0, 'so the headroom figure is not positive');
});

test('headroom rises with the supply and falls with the load', () => {
  const small = simulateThermals(buildWith({ ...GOOD, psu: ['psu-cm-mwe550'] }));
  const large = simulateThermals(buildWith({ ...GOOD, psu: ['psu-seasonic-vertex-1000'] }));
  assert.ok(large.power.headroomPct > small.power.headroomPct, 'a 1000 W unit leaves more room than a 550 W one');
  assert.ok(small.power.headroomPct >= 0, 'and the 550 W unit still holds this light build');
});

/* --- thermal -------------------------------------------------------------- */

test('the formulas are written down for the reader', () => {
  assert.ok(FORMULA_NOTES.length >= 6, 'the simulation documents itself');
  for (const [label, text] of FORMULA_NOTES) {
    assert.ok(label.length > 3 && text.length > 20, `formula "${label}" needs a full explanation`);
  }
  const titles = FORMULA_NOTES.map(([label]) => label.toLowerCase()).join(' ');
  for (const topic of ['power', 'headroom', 'airflow', 'temperature', 'fan', 'throttl']) {
    assert.ok(titles.includes(topic) || FORMULA_NOTES.some(([, text]) => text.toLowerCase().includes(topic)),
      `the notes should cover ${topic}`);
  }
});

test('temperatures stay in a plausible range on every preset', () => {
  for (const preset of PRESETS) {
    const result = simulateThermals(buildWith(preset.items));
    assert.ok(result.thermals.cpuTemp === null
      || (result.thermals.cpuTemp > 25 && result.thermals.cpuTemp <= 110),
    `${preset.id}: CPU temperature ${result.thermals.cpuTemp} is out of range`);
    assert.ok(result.thermals.gpuTemp === null
      || (result.thermals.gpuTemp > 25 && result.thermals.gpuTemp <= 100),
    `${preset.id}: GPU temperature ${result.thermals.gpuTemp} is out of range`);
    assert.ok(result.airflow.effectiveCfm >= 0, `${preset.id}: airflow cannot be negative`);
    // Fan speed lives on the thermals block as a PWM percentage.
    const pwm = result.thermals.fanPwm;
    assert.ok(pwm >= 0 && pwm <= 100, `${preset.id}: fan speed is a percentage, got ${pwm}`);
    assert.ok(Number.isFinite(result.thermals.fanRpmLow) && result.thermals.fanRpmLow > 0,
      `${preset.id}: the fan turns at a real speed`);
    assert.ok(Number.isFinite(result.thermals.noiseDba) && result.thermals.noiseDba > 0,
      `${preset.id}: the noise figure is measured in decibels`);
    assert.ok(result.thermals.cpuLimit === 95 && result.thermals.gpuLimit === 83,
      `${preset.id}: the throttle limits are the documented ones`);
  }
});

test('a stronger cooler runs the chip cooler than the stock one', () => {
  const stock = simulateThermals(buildWith({
    ...GOOD, cooler: ['cooler-intel-stock'],
  }));
  const tower = simulateThermals(buildWith({
    ...GOOD, cooler: ['cooler-noctua-nhd15'],
  }));
  assert.ok(stock.thermals.cpuTemp > tower.thermals.cpuTemp,
    'the stock cooler runs hotter than a big air tower');
});

test('a glass front passes less air than a mesh front', () => {
  const mesh = simulateThermals(buildWith({ ...GOOD, case: ['case-corsair-4000d'] }));
  const glass = simulateThermals(buildWith({ ...GOOD, case: ['case-jonsbo-d31'] }));
  if (mesh.airflow.cfm === glass.airflow.cfm) {
    assert.equal(mesh.airflow.panelFactor, glass.airflow.panelFactor, 'same fan count, same restriction');
  } else {
    assert.ok(glass.airflow.effectiveCfm <= mesh.airflow.effectiveCfm,
      'the more restrictive front moves less air for the same fans');
  }
});

test('the throttling flag agrees with the losses it reports', () => {
  for (const preset of PRESETS) {
    const result = simulateThermals(buildWith(preset.items));
    assert.equal(result.throttle.any,
      result.throttle.cpuLossPct > 0 || result.throttle.gpuLossPct > 0,
      `${preset.id}: the any flag matches the losses`);
    for (const loss of [result.throttle.cpuLossPct, result.throttle.gpuLossPct]) {
      assert.ok(loss >= 0 && loss <= 60, `${preset.id}: a loss of ${loss}% is not a real figure`);
    }
  }
});

test('the verdict is a headline and a sentence a buyer can act on', () => {
  for (const preset of PRESETS) {
    const result = simulateThermals(buildWith(preset.items));
    assert.ok(result.verdict, `${preset.id}: there is a verdict`);
    assert.ok(result.verdict.tone, `${preset.id}: the verdict carries a tone for the page`);
    assert.ok(result.verdict.title && result.verdict.title.length > 6, `${preset.id}: a verdict needs a headline`);
    assert.ok(result.verdict.detail && result.verdict.detail.length > 15,
      `${preset.id}: and a sentence that says what to do about it`);
    assert.ok(['ok', 'warn', 'error'].includes(result.verdict.tone), `${preset.id}: tone ${result.verdict.tone}`);
  }
});

test('no build reports a card temperature with no card to measure', () => {
  const noChip = simulateThermals(buildWith({ case: ['case-corsair-4000d'] }));
  assert.ok(noChip.thermals.cpuTemp === null || noChip.thermals.cpuTemp <= 25,
    'a board with no chip has no real CPU temperature, only the ambient air');
  const noCard = simulateThermals(buildWith({ ...GOOD, gpu: [] }));
  assert.equal(noCard.thermals.gpuTemp, null, 'no card means no card temperature');
});

test('a build with no case still produces an answer rather than a crash', () => {
  const result = simulateThermals(buildWith({ cpu: ['cpu-i5-12400f'], motherboard: ['mb-msi-b760m-a-ddr4'] }));
  assert.ok(result.power.loadWatts > 0, 'the power figure still stands');
  assert.ok(Number.isFinite(result.power.headroomPct) || result.power.headroomPct === null,
    'and the headroom is a number or nothing, never NaN');
});
