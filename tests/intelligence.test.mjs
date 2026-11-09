import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyBuild } from '../js/core/build.js';
import { estimatePerformance, fpsTier } from '../js/core/perf.js';
import { analyzeBuild } from '../js/core/intelligence.js';
import { HARDWARE_BY_ID } from '../js/data/hardware.js';

function makeBuild(items, name = 'Intelligence build') {
  const build = emptyBuild(name);
  Object.assign(build.items, items);
  return build;
}

const gamingBuild = makeBuild({
  cpu: ['cpu-i5-12400f'],
  motherboard: ['mb-msi-b760m-a-ddr4'],
  gpu: ['gpu-rtx-4070-super'],
  ram: ['ram-vengeance-32-6000'],
  storage: ['ssd-samsung-980-1tb'],
  psu: ['psu-msi-a750gl'],
  case: ['case-corsair-4000d'],
  cooler: ['cooler-deepcool-ak400'],
});

test('performance estimates are deterministic and resolution-aware', () => {
  const cpu = HARDWARE_BY_ID['cpu-i5-12400f'];
  const gpu = HARDWARE_BY_ID['gpu-rtx-4070-super'];
  const fullHd = estimatePerformance({ cpu, gpu, resolution: '1080p', quality: 'ultra' });
  const fourK = estimatePerformance({ cpu, gpu, resolution: '4k', quality: 'ultra' });
  assert.equal(fullHd.ready, true);
  assert.ok(fullHd.average > fourK.average, '1080p should estimate more frames than 4K');
  assert.equal(fullHd.games.length, 10);
  assert.ok(fullHd.games.every((game) => game.fps >= 1 && game.tier));
  assert.equal(fpsTier(165).label, 'Competitive');
});

test('build intelligence exposes bottleneck, value, PSU load, and upgrades', () => {
  const analysis = analyzeBuild(gamingBuild, { resolution: '1080p', quality: 'ultra' });
  assert.equal(analysis.ready, true);
  assert.ok(analysis.averageFps > 0);
  assert.ok(analysis.costPerFrame > 0);
  assert.ok(analysis.psuUtilization > 0 && analysis.psuUtilization < 100);
  assert.ok(analysis.bottleneck && ['CPU', 'GPU', 'Balanced'].includes(analysis.bottleneck.limiter));
  assert.ok(analysis.upgrades.gpu.every((entry) => entry.item.id !== 'gpu-rtx-4070-super'));
  assert.ok(analysis.upgrades.all.every((entry) => Number.isFinite(entry.price)));
});

test('integrated graphics builds are identified as GPU-limited', () => {
  const analysis = analyzeBuild(makeBuild({
    cpu: ['cpu-i5-12400f'],
    motherboard: ['mb-msi-b760m-a-ddr4'],
    ram: ['ram-fury-16-3200'],
    storage: ['ssd-samsung-980-1tb'],
    psu: ['psu-seasonic-gx650'],
    case: ['case-corsair-4000d'],
    cooler: ['cooler-deepcool-ak400'],
  }));
  assert.equal(analysis.ready, false);
  assert.ok(analysis.bottleneck === null);
});
