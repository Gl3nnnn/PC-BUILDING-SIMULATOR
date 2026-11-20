// Tests for the engines behind the numbers a player reads: power and thermal,
// the five benchmark workloads, the cable rules and the assembly steps.
//
// These modules have no browser dependency, so they run directly in node. A
// failure here means a figure or a rule shown on screen is wrong.
import test from 'node:test';
import assert from 'node:assert/strict';

import { HARDWARE, HARDWARE_BY_ID } from '../js/data/hardware.js';
import { PRESETS } from '../js/data/presets.js';
import { simulateThermals, FORMULA_NOTES } from '../js/core/thermal.js';
import { runBenchmarks, PROFILES } from '../js/core/benchmark.js';
import { neededCables, connectCable, cableState, acceptablePorts } from '../js/core/cables.js';
import { ASSEMBLY_STEPS, assemblyState } from '../js/core/assembly.js';

const item = (id) => HARDWARE_BY_ID[id];
const buildOf = (preset = PRESETS[0]) => ({ name: preset.name, items: preset.items });

/** A build with one part swapped, for the "what if it were smaller" checks. */
function withPart(build, category, id) {
  return { ...build, items: { ...build.items, [category]: [id] } };
}

const PSU_BY_WATTS = (watts) => HARDWARE.find(
  (entry) => entry.category === 'psu' && Number(entry.specs.wattage) === watts,
)?.id;

test('load power follows the documented formula', () => {
  for (const preset of PRESETS) {
    const build = buildOf(preset);
    const result = simulateThermals(build);
    assert.ok(Number.isFinite(result.power.loadWatts) && result.power.loadWatts > 0, `${preset.id}: load watts`);
    const cpu = item(build.items.cpu[0]);
    const gpu = item(build.items.gpu?.[0]);
    // CPU peak + GPU TDP + board overhead (45 W) plus ~2.5 W per fan.
    const expected = Number(cpu.specs.peakPower || Math.round(Number(cpu.specs.tdp) * 1.15))
      + (gpu ? Number(gpu.specs.tdp) : 0);
    assert.ok(result.power.loadWatts >= expected, `${preset.id}: load covers CPU and card`);
    assert.ok(result.power.loadWatts <= expected + 120, `${preset.id}: overhead stays modest`);
    assert.ok(result.thermals.cpuTemp === null || (result.thermals.cpuTemp > 20 && result.thermals.cpuTemp <= 105),
      `${preset.id}: CPU temperature is plausible`);
    assert.equal(result.throttle.any, result.throttle.cpuLossPct > 0 || result.throttle.gpuLossPct > 0);
  }
  assert.ok(FORMULA_NOTES.length >= 6, 'the formulas are written down for the reader');
});

test('a smaller power supply always has less headroom', () => {
  const build = buildOf(PRESETS.find((preset) => preset.items.gpu?.length) || PRESETS[0]);
  const big = PSU_BY_WATTS(1000);
  const small = PSU_BY_WATTS(550);
  assert.ok(big && small, 'the catalogue holds both supplies');
  const bigResult = simulateThermals(withPart(build, 'psu', big));
  const smallResult = simulateThermals(withPart(build, 'psu', small));
  assert.ok(smallResult.power.headroomPct < bigResult.power.headroomPct,
    'the 550 W unit has less headroom than the 1000 W one');
  assert.ok(smallResult.power.recommendedPsu >= smallResult.power.loadWatts,
    'the recommended supply covers the load');
});

test('each of the five workloads returns a complete report', () => {
  for (const preset of PRESETS) {
    const run = runBenchmarks(buildOf(preset));
    assert.ok(run.profiles.length === PROFILES.length, `${preset.id}: every profile ran`);
    assert.equal(run.profiles.length, 5);
    for (const profile of run.profiles) {
      assert.ok(Number.isFinite(profile.score) && profile.score > 0, `${preset.id}/${profile.id}: score`);
      assert.ok(profile.utilization.cpu >= 0 && profile.utilization.cpu <= 100, `${preset.id}/${profile.id}: CPU use`);
      assert.ok(profile.utilization.gpu >= 0 && profile.utilization.gpu <= 100, `${preset.id}/${profile.id}: GPU use`);
      assert.ok(profile.ram.used >= 0, `${preset.id}/${profile.id}: memory used`);
      assert.ok(profile.ram.used <= profile.ram.installed, `${preset.id}/${profile.id}: memory fits`);
      assert.ok(profile.limiter && profile.limiter.kind, `${preset.id}/${profile.id}: names a limiter`);
      assert.ok(Number.isFinite(profile.power.watts), `${preset.id}/${profile.id}: power`);
      // Frames only where frames make sense: esports and AAA gaming, and only
      // when the build actually has a chip and a card to run them with.
      const wantsFps = profile.id === 'esports' || profile.id === 'aaa';
      const capable = Boolean(preset.items.gpu?.length);
      assert.equal(Boolean(profile.fps), wantsFps && capable, `${preset.id}/${profile.id}: frame-rate presence`);
      if (wantsFps && capable) assert.ok(profile.fps.average > 0, `${preset.id}/${profile.id}: average frames`);
    }
    assert.ok(run.profiles.every((profile) => profile.id), 'profiles keep their ids');
  }
});

test('the cable list matches the parts that are fitted', () => {
  for (const preset of PRESETS) {
    const build = buildOf(preset);
    const needed = neededCables(build);
    const ids = needed.map((kind) => kind.id);
    assert.ok(ids.includes('atx24'), `${preset.id}: needs the 24-pin`);
    assert.ok(ids.includes('eps8'), `${preset.id}: needs CPU power`);
    for (const kind of needed) {
      assert.ok(kind.label && kind.why, `${preset.id}/${kind.id}: the cable explains itself`);
      assert.ok(kind.fromPort && kind.toPort, `${preset.id}/${kind.id}: both ends are named`);
    }
    // Never both cable kinds for one card.
    assert.ok(!(ids.includes('gpu-pcie') && ids.includes('gpu-12v')), `${preset.id}: one card cable only`);
    const gpu = item(build.items.gpu?.[0]);
    if (gpu) assert.ok(ids.includes('gpu-pcie') || ids.includes('gpu-12v'), `${preset.id}: the card is fed`);
  }
});

test('a cable only plugs into a socket that accepts it', () => {
  const build = buildOf(PRESETS.find((preset) => preset.items.gpu?.length) || PRESETS[0]);
  const needed = neededCables(build);
  const kind = needed[0];
  const ports = acceptablePorts(build, kind).map((port) => port.id);
  assert.ok(ports.length >= 1, 'the cable has somewhere to go');
  const right = connectCable(build, [], kind.id, ports[0]);
  assert.equal(right.ok, true, 'the correct socket accepts the plug');
  const other = needed.find((entry) => entry.id !== kind.id);
  // Two refusals worth explaining: a plugged cable cannot be plugged again, and
  // a cable cannot go into a connector that belongs to a different one.
  const twice = connectCable(build, [kind.id], kind.id, ports[0]);
  assert.equal(twice.ok, false, 'a plugged cable is not plugged twice');
  assert.ok(twice.reason.length > 10, 'the refusal explains why');
  const wrong = connectCable(build, [], kind.id, other.toPort);
  assert.equal(wrong.ok, false, 'another socket is refused');
  assert.match(wrong.reason, /ends at/, 'and that one says where the cable goes');
  const state = cableState(build, [kind.id]);
  assert.equal(state.plugged, 1, 'the plugged cable is counted');
  assert.equal(state.total, needed.length, 'the count matches what the build needs');
  assert.ok(Array.isArray(state.missing), 'the missing list names the rest');
});

test('the assembly sequence is ordered and every step is explained', () => {
  assert.ok(ASSEMBLY_STEPS.length >= 12, 'the guided sequence has its steps');
  for (const step of ASSEMBLY_STEPS) {
    assert.ok(step.id && step.title, `${step.id}: named`);
    assert.ok(step.ask || step.why, `${step.id}: explained`);
    assert.ok(step.done !== undefined, `${step.id}: knows when it is done`);
  }
  const ids = ASSEMBLY_STEPS.map((step) => step.id);
  assert.equal(new Set(ids).size, ids.length, 'no step appears twice');
  for (const preset of PRESETS) {
    const state = assemblyState(buildOf(preset));
    assert.equal(state.steps.length, ASSEMBLY_STEPS.length, `${preset.id}: same step count`);
    assert.ok(state.currentIndex >= 0 && state.currentIndex <= ASSEMBLY_STEPS.length, `${preset.id}: current step in range`);
    assert.equal(state.complete, state.doneCount === ASSEMBLY_STEPS.length, `${preset.id}: complete flag is honest`);
  }
});

test('presets reference real catalogue parts', () => {
  for (const preset of PRESETS) {
    const ids = Object.values(preset.items).flat();
    assert.ok(ids.length >= 5, `${preset.id} holds a whole machine`);
    for (const id of ids) {
      assert.ok(HARDWARE_BY_ID[id], `${preset.id} references a real part: ${id}`);
    }
  }
});
