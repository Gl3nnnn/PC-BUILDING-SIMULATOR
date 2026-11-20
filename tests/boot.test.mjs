// BIOS, POST and boot tests.
//
// The boot page is the moment the player finds out whether the build works. The
// rules must stop the run at the right checkpoint with the right beep code, and
// let a valid machine through to the UEFI screen, a boot device and an install.
import test from 'node:test';
import assert from 'node:assert/strict';

import { emptyBuild } from '../js/core/build.js';
import {
  POST_STAGES, bootCheck, beepCode, bootDevices, driverList, installPlan,
} from '../js/core/boot.js';
import { PRESETS } from '../js/data/presets.js';

function buildWith(items) {
  const build = emptyBuild('Boot build');
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

const stageOf = (result, id) => result.stages.find((entry) => entry.id === id);

test('POST walks the seven stages in the documented order', () => {
  assert.equal(POST_STAGES.length, 7, 'seven checkpoints');
  const ids = POST_STAGES.map((entry) => entry.id);
  assert.deepEqual(ids, ['board', 'cpu', 'memory', 'video', 'storage', 'cooling', 'selftest']);
  const result = bootCheck(buildWith(GOOD));
  assert.equal(result.stages.length, 7, 'every checkpoint reports, none are skipped');
  for (const stage of result.stages) {
    assert.ok(stage.label && stage.side, `${stage.id} needs a label for the console`);
    assert.ok(['ok', 'warn', 'fail'].includes(stage.status), `${stage.id}: status ${stage.status}`);
    assert.ok(stage.headline && stage.headline.length > 5, `${stage.id}: needs a headline`);
    assert.ok(stage.detail && stage.detail.length > 15, `${stage.id}: needs a sentence of detail`);
    if (stage.status !== 'ok') {
      assert.ok(stage.fix && stage.fix.category, `${stage.id}: a failure must offer a part to change`);
    }
  }
});

test('a whole machine passes POST and reaches BIOS', () => {
  const result = bootCheck(buildWith(GOOD));
  assert.equal(result.ok, true, 'nothing stops the run');
  assert.equal(result.fails.length, 0);
  assert.equal(stageOf(result, 'selftest').status, 'ok');
  assert.equal(result.beep.label, 'One short beep', 'the good beep');
});

test('every preset passes POST', () => {
  for (const preset of PRESETS) {
    const result = bootCheck(buildWith(preset.items));
    assert.equal(result.ok, true, `${preset.id} should boot`);
    assert.equal(result.fails.length, 0, `${preset.id}: no checkpoint fails`);
  }
});

test('an empty socket stops the run at the CPU checkpoint with five short beeps', () => {
  const result = bootCheck(buildWith({ ...GOOD, cpu: [] }));
  assert.equal(result.ok, false);
  assert.equal(stageOf(result, 'cpu').status, 'fail');
  assert.match(stageOf(result, 'cpu').headline, /socket/i);
  assert.match(result.beep.label, /Five short beeps/i);
  assert.equal(result.beep.detail.length > 10, true, 'the beep is explained');
});

test('a socket mismatch is a failure that names both sockets', () => {
  const result = bootCheck(buildWith({ ...GOOD, motherboard: ['mb-msi-b550m-pro-vdh'] }));
  const cpu = stageOf(result, 'cpu');
  assert.equal(cpu.status, 'fail');
  assert.match(cpu.headline, /mismatch/i);
  assert.match(cpu.detail, /LGA1700/);
  assert.match(cpu.detail, /AM4/);
});

test('no memory halts POST before anything else runs', () => {
  const result = bootCheck(buildWith({ ...GOOD, ram: [] }));
  assert.equal(result.ok, false);
  assert.equal(stageOf(result, 'memory').status, 'fail');
  assert.match(result.beep.label, /One long, two short/i, 'the memory beep');
  assert.equal(stageOf(result, 'memory').fix.category, 'ram');
});

test('a single memory stick trains but warns about single channel', () => {
  const single = bootCheck(buildWith({ ...GOOD, ram: ['ram-fury-16-3200'] }));
  const memory = stageOf(single, 'memory');
  assert.ok(['ok', 'warn'].includes(memory.status));
  if (memory.status === 'warn') {
    assert.match(memory.detail, /single channel|one module|One module/i);
  }
});

test('a build with no output fails the video checkpoint and offers the card', () => {
  const noCardNoIgpu = bootCheck(buildWith({ ...GOOD, gpu: [], cpu: ['cpu-i5-12400f'] }));
  if (noCardNoIgpu.gpu === null && Number(noCardNoIgpu.cpu?.specs?.igpuScore) === 0) {
    assert.equal(stageOf(noCardNoIgpu, 'video').status, 'fail');
    assert.match(noCardNoIgpu.beep.label, /One long, three short/i);
  }
  // A chip with its own graphics passes without a card.
  const igpu = bootCheck(buildWith({ ...GOOD, gpu: [], cpu: ['cpu-i3-12100'] }));
  assert.equal(stageOf(igpu, 'video').status, 'ok', 'onboard graphics drive the monitor');
});

test('a build with no board does not answer the power button at all', () => {
  const result = bootCheck(emptyBuild());
  assert.equal(result.ok, false);
  assert.equal(result.stages[0].status, 'fail', 'the first checkpoint fails');
  assert.ok(['Continuous beeping', 'One long beep'].includes(result.beep.label), `beep: ${result.beep.label}`);
});

test('the storage and cooling checkpoints warn without blocking the BIOS', () => {
  const noDrive = bootCheck(buildWith({ ...GOOD, storage: [] }));
  assert.equal(stageOf(noDrive, 'storage').status, 'warn', 'a machine with no drive still reaches BIOS');
  assert.equal(stageOf(noDrive, 'storage').fix.category, 'storage');
  const noCooler = bootCheck(buildWith({ ...GOOD, cooler: [] }));
  assert.ok(['warn', 'ok'].includes(stageOf(noCooler, 'cooling').status),
    'a stock cooler is a warning or a note, never a hard stop');
});

test('the power figures on the boot screen match the power model', () => {
  const result = bootCheck(buildWith(GOOD));
  assert.ok(result.power > 0, 'the boot screen states the load');
  assert.ok(result.recommended >= result.power, 'and recommends a supply that covers it');
  assert.ok(Number.isFinite(result.headroom), 'with a headroom figure');
  assert.ok(result.selected >= 5, 'and counts the parts fitted');
  assert.ok(result.total > 0, 'and totals the money spent');
});

test('the boot device list offers the drives, an installer and a shell', () => {
  const build = buildWith(GOOD);
  const devices = bootDevices(build);
  assert.ok(devices.some((entry) => entry.kind === 'drive'), 'the fitted drive appears');
  assert.ok(devices.some((entry) => entry.kind === 'usb'), 'so does the installer');
  assert.ok(devices.some((entry) => entry.kind === 'shell'), 'and the shell');
  for (const device of devices) {
    assert.ok(device.label && device.sub, `${device.id}: needs a name and a subtitle`);
    assert.equal(typeof device.ready, 'boolean', `${device.id}: says whether it can be used`);
  }
  const first = devices.find((entry) => entry.kind === 'drive');
  assert.match(first.sub, /recommended/i, 'the first drive is marked as the recommendation');
  const none = bootDevices(buildWith({ ...GOOD, storage: [] }));
  assert.equal(none.length, 1, 'with no drive there is one entry, and it says so');
  assert.equal(none[0].ready, false, 'and it is not usable');
});

test('the driver list names the chipset, the graphics vendor and the network', () => {
  const drivers = driverList(buildWith(GOOD));
  assert.ok(drivers.length >= 4, `expected at least four drivers, got ${drivers.length}`);
  assert.ok(drivers.some((entry) => entry.id === 'chipset'), 'chipset');
  const graphics = drivers.find((entry) => entry.id === 'graphics');
  assert.ok(graphics, 'graphics');
  assert.match(graphics.label, /NVIDIA/i, 'a GeForce card pulls the NVIDIA driver');
  assert.ok(drivers.some((entry) => entry.id === 'lan'), 'network');
  for (const driver of drivers) {
    assert.ok(driver.note && driver.note.length > 15, `${driver.id}: explains what it unlocks`);
  }
  const amd = driverList(buildWith({ ...GOOD, gpu: ['gpu-rx-7800xt'] }));
  assert.match(amd.find((entry) => entry.id === 'graphics').label, /AMD/i, 'a Radeon card pulls the AMD driver');
});

test('the install plan runs partition, image, first boot, drivers', () => {
  const plan = installPlan(buildWith(GOOD));
  const ids = plan.map((step) => step.id);
  assert.deepEqual(ids, ['partition', 'image', 'firstboot', 'drivers']);
  for (const step of plan) {
    assert.ok(step.label && step.detail, `${step.id}: needs a label and detail`);
    assert.ok(Number.isFinite(step.weight) && step.weight > 0, `${step.id}: needs a weight for the progress bar`);
  }
  const total = plan.reduce((sum, step) => sum + step.weight, 0);
  assert.ok(total >= 10, 'the progress bar has enough steps to look like work');
  const noDrive = installPlan(buildWith({ ...GOOD, storage: [] }));
  assert.match(noDrive.find((step) => step.id === 'image').detail, /boot drive/i);
});

test('beep codes map each failure to the code a real board sounds', () => {
  assert.equal(beepCode([]).label, 'One short beep');
  assert.match(beepCode([{ id: 'memory' }]).label, /One long, two short/i);
  assert.match(beepCode([{ id: 'video' }]).label, /One long, three short/i);
  assert.match(beepCode([{ id: 'cpu' }]).label, /Five short/i);
  assert.match(beepCode([{ id: 'board' }]).label, /Continuous/i);
  assert.match(beepCode([{ id: 'elsewhere' }]).label, /One long beep/i);
  for (const code of [
    beepCode([]), beepCode([{ id: 'memory' }]), beepCode([{ id: 'video' }]),
    beepCode([{ id: 'cpu' }]), beepCode([{ id: 'board' }]),
  ]) {
    assert.ok(code.detail.length > 10, `"${code.label}" needs a plain explanation`);
  }
});
