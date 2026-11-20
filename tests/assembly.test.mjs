// Assembly sequence and orientation tests.
//
// The workshop must stop a part going in before it is that part's turn, allow
// it when it is, and never block a swap of a part already fitted. Orientation
// matters most for the chip and the memory: the written steps have to say so,
// and a part that only fits one way must not be reported as a free choice.
import test from 'node:test';
import assert from 'node:assert/strict';

import { emptyBuild } from '../js/core/build.js';
import {
  ASSEMBLY_STEPS, assemblyState, canInstall, explainMismatch,
} from '../js/core/assembly.js';
import { PRESETS } from '../js/data/presets.js';
import { getHardware } from '../js/data/hardware.js';

function buildWith(items) {
  const build = emptyBuild('Bench build');
  Object.assign(build.items, items);
  return build;
}

const STEP_IDS = ASSEMBLY_STEPS.map((step) => step.id);

test('the sequence runs in the order a real build follows', () => {
  assert.ok(ASSEMBLY_STEPS.length >= 12, `expected the full guided sequence, got ${ASSEMBLY_STEPS.length}`);
  // Ordering that must not drift: case, then chip, then paste, then cooler,
  // then board, then card, then power, then the walk round.
  const order = ['case', 'cpu', 'paste', 'cooler', 'mount', 'gpu', 'psu', 'power', 'inspect'];
  let cursor = -1;
  for (const id of order) {
    const at = STEP_IDS.indexOf(id);
    assert.ok(at > cursor, `step "${id}" is out of order`);
    cursor = at;
  }
  assert.equal(STEP_IDS[STEP_IDS.length - 1], 'inspect', 'the last step is the final inspection');
});

test('every step explains itself and knows when it is done', () => {
  for (const step of ASSEMBLY_STEPS) {
    assert.ok(step.title && step.title.length > 5, `${step.id}: needs a title`);
    assert.ok(step.ask && step.ask.length > 20, `${step.id}: needs an instruction`);
    assert.ok(step.why && step.why.length > 20, `${step.id}: needs the reason`);
    assert.equal(typeof step.done, 'function', `${step.id}: needs a done test`);
  }
  const ids = new Set(STEP_IDS);
  assert.equal(ids.size, STEP_IDS.length, 'no step appears twice');
});

test('an empty bench sits on step one and reports nothing done', () => {
  const state = assemblyState(emptyBuild());
  assert.equal(state.currentIndex, 0);
  assert.equal(state.doneCount, 0);
  assert.equal(state.complete, false);
  assert.equal(state.steps[0].id, 'case', 'the case comes first');
});

test('a whole preset is complete, and every step reports done', () => {
  for (const preset of PRESETS) {
    const state = assemblyState(buildWith(preset.items));
    assert.equal(state.complete, true, `${preset.id} is a finished build`);
    assert.equal(state.doneCount, ASSEMBLY_STEPS.length, `${preset.id} ticks every step`);
    assert.equal(state.steps.filter((step) => !step.done).length, 0);
  }
});

test('a build with no card or extra fans is still complete when the parts cover it', () => {
  // A chip with its own graphics needs no card to work, and a case that ships
  // with fans needs nothing added. Those two steps must not hold a complete
  // build open forever.
  const office = PRESETS.find((preset) => preset.id === 'budget-office');
  assert.ok(office, 'the office preset should exist');
  const state = assemblyState(buildWith(office.items));
  assert.equal(state.complete, true, 'the office machine is a finished build');
  const gpuStep = state.steps.find((step) => step.id === 'gpu');
  assert.equal(gpuStep.done, true, 'onboard graphics close the card step');
  const fanStep = state.steps.find((step) => step.id === 'fans');
  assert.equal(fanStep.done, true, 'the fans in the case close the fan step');
});

test('a part from a later step is blocked, and the refusal names the current step', () => {
  const state = assemblyState(emptyBuild());
  const blocked = canInstall(emptyBuild(), 'gpu-rtx-3060');
  assert.equal(blocked.ok, false, 'a card cannot go in before the case');
  assert.match(blocked.reason, /Prepare the case/, 'the reason names the step to do first');
  assert.ok(blocked.reason.length > 40, 'and explains why in a sentence');
  assert.equal(state.currentIndex, 0);
});

test('the part the bench is waiting for is accepted', () => {
  const allowed = canInstall(emptyBuild(), 'case-corsair-4000d');
  assert.equal(allowed.ok, true);
  assert.equal(allowed.item.category, 'case');
});

test('once the case is on, the next step is the board, and the card is still refused', () => {
  const bench = buildWith({ case: ['case-corsair-4000d'] });
  const state = assemblyState(bench);
  assert.equal(state.steps[state.currentIndex].id, 'standoffs', 'standoffs and the board come next');
  assert.equal(canInstall(bench, 'mb-msi-b760m-a-ddr4').ok, true, 'the board is accepted next');
  assert.equal(canInstall(bench, 'gpu-rtx-3060').ok, false, 'the card is still refused');
});

test('a part already fitted can always be swapped', () => {
  const bench = buildWith({ case: ['case-corsair-4000d'] });
  const swap = canInstall(bench, 'case-fractal-north');
  assert.equal(swap.ok, true, 'swapping a fitted part is never blocked by the sequence');
});

test('cables and accessories never block the bench', () => {
  for (const part of ['cable-corsair-type4-24pin', 'cable-startech-sata-3', 'cable-cm-fan-splitter']) {
    assert.ok(getHardware(part), `${part} should be in the catalogue`);
    assert.equal(canInstall(emptyBuild(), part).ok, true, `${part} can be added at any time`);
  }
});

test('an unknown part id is refused with a plain sentence', () => {
  const result = canInstall(emptyBuild(), 'not-a-real-part');
  assert.equal(result.ok, false);
  assert.match(result.reason, /catalogue/i);
});

test('orientation is written down for the parts that only fit one way', () => {
  // The chip and the memory are the two parts where forcing it wrecks hardware:
  // each step must mention the keyed corner or the latch, not just "install it".
  const cpu = ASSEMBLY_STEPS.find((step) => step.id === 'cpu');
  assert.match(`${cpu.ask} ${cpu.why}`, /triangle|lever|latch/i, 'the chip step explains the keyed fit');
  const ram = ASSEMBLY_STEPS.find((step) => step.id === 'ram');
  assert.match(`${ram.ask} ${ram.why}`, /latch|click|slot/i, 'the memory step explains the slots and latches');
  const paste = ASSEMBLY_STEPS.find((step) => step.id === 'paste');
  assert.match(`${paste.ask} ${paste.why}`, /dot|paste|spread/i, 'the paste step explains the amount and spreading');
  const gpu = ASSEMBLY_STEPS.find((step) => step.id === 'gpu');
  assert.match(`${gpu.ask} ${gpu.why}`, /slot|latch|bracket/i, 'the card step explains the slot and bracket');
});

test('the mismatch explanation tells the reader which step comes first', () => {
  const text = explainMismatch(emptyBuild(), 'gpu-rtx-3060');
  assert.ok(text.length > 20, 'the explanation is a whole sentence');
  assert.match(text, /Prepare the case|case/i);
});

test('detail rows on each step are label/value pairs', () => {
  for (const preset of PRESETS) {
    const bench = buildWith(preset.items);
    const state = assemblyState(bench);
    for (const step of state.steps) {
      if (!step.detail) continue;
      const rows = step.detail(bench);
      assert.ok(Array.isArray(rows), `${step.id}: detail should be a list of rows`);
      for (const row of rows) {
        assert.equal(row.length, 2, `${step.id}: a row is a label and a value`);
        assert.ok(String(row[0]).length > 2, `${step.id}: a row needs a label`);
        assert.ok(String(row[1]).length > 0 || String(row[1]) === '—', `${step.id}: a row needs a value`);
      }
    }
  }
});

test('every step that names a part category names a real catalogue category', () => {
  const categories = new Set(['case', 'motherboard', 'cpu', 'ram', 'cooler', 'storage', 'gpu', 'psu', 'fans', 'cables']);
  for (const step of ASSEMBLY_STEPS) {
    if (step.category === null) continue;
    assert.ok(categories.has(step.category), `${step.id} names ${step.category}, which is not a catalogue category`);
  }
});
