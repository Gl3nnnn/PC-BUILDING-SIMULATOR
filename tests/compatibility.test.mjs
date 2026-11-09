import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyBuild, encodeBuild, decodeBuild, sanitizeBuild } from '../js/core/build.js';
import { evaluateBuild, parseGpuPower } from '../js/core/compat.js';

function makeBuild(items, name = 'Test build') {
  const build = emptyBuild(name);
  Object.assign(build.items, items);
  return build;
}

const balancedBuild = makeBuild({
  cpu: ['cpu-i5-12400f'],
  motherboard: ['mb-msi-b760m-a-ddr4'],
  gpu: ['gpu-rtx-3060'],
  ram: ['ram-fury-16-3200'],
  storage: ['ssd-samsung-980-1tb'],
  psu: ['psu-seasonic-gx650'],
  case: ['case-corsair-4000d'],
  cooler: ['cooler-deepcool-ak400'],
});

test('a matched LGA1700 DDR4 build has no hard compatibility errors', () => {
  const result = evaluateBuild(balancedBuild);
  assert.equal(result.errors.length, 0);
  assert.notEqual(result.status, 'incompatible');
  assert.ok(result.checks.some((check) => check.title === 'CPU socket matches'));
});

test('CPU and motherboard socket mismatch is an error', () => {
  const result = evaluateBuild(makeBuild({
    cpu: ['cpu-i5-12400f'],
    motherboard: ['mb-msi-b550m-pro-vdh'],
  }));
  assert.equal(result.status, 'incompatible');
  assert.ok(result.errors.some((check) => check.title === 'CPU socket mismatch'));
});

test('high-power CPU on a budget VRM produces a warning', () => {
  const result = evaluateBuild(makeBuild({
    cpu: ['cpu-i9-14900k'],
    motherboard: ['mb-asus-h610m-e-d4'],
  }));
  assert.ok(result.warnings.some((check) => check.title === 'Motherboard power delivery is modest for this CPU'));
});

test('GPU power connector parsing handles 8-pin and 16-pin cards', () => {
  assert.deepEqual(parseGpuPower('1x 8-pin', 170), { kind: '8pin', count: 1, eightPinEquivalent: 1, label: '1× 8-pin' });
  assert.deepEqual(parseGpuPower('2x 8-pin', 250), { kind: '8pin', count: 2, eightPinEquivalent: 2, label: '2× 8-pin' });
  assert.equal(parseGpuPower('1x 16-pin (12VHPWR)', 450).eightPinEquivalent, 4);
  assert.equal(parseGpuPower('None (slot powered)', 70).kind, 'none');
});

test('16-pin GPU on a PSU without enough adapter cables is flagged', () => {
  const result = evaluateBuild(makeBuild({
    cpu: ['cpu-i5-12400f'],
    gpu: ['gpu-rtx-4090'],
    psu: ['psu-corsair-cv450'],
  }));
  assert.ok(result.errors.some((check) => check.title === 'Not enough PSU cables for the GPU power adapter'));
});

test('build links round-trip and reject invalid or empty payloads', () => {
  const encoded = encodeBuild(balancedBuild);
  const decoded = decodeBuild(encoded);
  assert.equal(decoded.name, balancedBuild.name);
  assert.deepEqual(decoded.items.cpu, balancedBuild.items.cpu);
  assert.throws(() => decodeBuild('not-valid-data'), /invalid or corrupted/i);
  assert.throws(() => decodeBuild(''), /No build data/i);
});

test('import sanitization removes unknown IDs and enforces category limits', () => {
  const build = sanitizeBuild({
    name: 'Imported',
    items: {
      cpu: ['cpu-i5-12400f', 'gpu-rtx-3060', 'does-not-exist'],
      gpu: ['gpu-rtx-3060', 'gpu-rtx-4090'],
    },
  });
  assert.deepEqual(build.items.cpu, ['cpu-i5-12400f']);
  assert.deepEqual(build.items.gpu, ['gpu-rtx-3060']);
});
