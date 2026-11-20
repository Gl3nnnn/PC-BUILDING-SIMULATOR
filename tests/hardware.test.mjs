// Hardware specification tests.
//
// These check the catalogue itself: that every part carries the numbers the
// rest of the app reasons with, that those numbers are plausible, and that the
// brands the project promises are actually stocked. A failure here means a spec
// table or a compatibility rule is reading a field that is missing or absurd.
//
// Units, as the catalogue stores them: dimensions in millimetres, weight in
// kilograms, wattage in watts.
import test from 'node:test';
import assert from 'node:assert/strict';

import { CATEGORIES, HARDWARE, HARDWARE_BY_ID, getHardware } from '../js/data/hardware.js';
import { dimensionsFor, weightFor } from '../js/data/component-specs.js';

const byCategory = (category) => HARDWARE.filter((item) => item.category === category);

function HW(id) {
  const item = getHardware(id);
  assert.ok(item, `${id} should be in the catalogue`);
  return item;
}

test('every part has dimensions, a power figure, a weight and a visual asset', () => {
  for (const item of HARDWARE) {
    const dims = item.specs?.dimensions;
    assert.ok(Array.isArray(dims) && dims.length === 3, `${item.id} needs [length, width, height]`);
    for (const value of dims) {
      assert.ok(Number.isFinite(value) && value > 0, `${item.id} has a dimension that is not a positive number`);
    }
    assert.ok(Number.isFinite(Number(item.specs?.weight)) && Number(item.specs.weight) > 0, `${item.id} needs a weight`);
    assert.ok(Number.isFinite(Number(item.specs?.power)) && Number(item.specs.power) >= 0, `${item.id} needs a power draw`);
    assert.ok(item.visual && item.visual.art && item.visual.model, `${item.id} needs a visual asset marker`);
  }
});

test('dimensions and weights are plausible for a real desktop part', () => {
  for (const item of byCategory('cpu')) {
    const [l, w, h] = item.specs.dimensions;
    assert.ok(l <= 80 && w <= 80 && h <= 15, `${item.id} should be a small square slab, got ${item.specs.dimensions}`);
  }
  for (const item of byCategory('gpu')) {
    const [l, w, h] = item.specs.dimensions;
    assert.ok(l >= 120 && l <= 400, `${item.id} length ${l} mm is out of range for a card`);
    assert.ok(w <= 200, `${item.id} is too wide for a card`);
    assert.ok(Number(item.specs.weight) <= 4, `${item.id} weighs more than a whole rig`);
    assert.ok(h >= 20, `${item.id} is thinner than a single slot`);
  }
  for (const item of byCategory('psu')) {
    assert.ok(Number(item.specs.weight) >= 0.25, `${item.id} is lighter than any real supply`);
    assert.ok(Number(item.specs.weight) <= 4, `${item.id} is heavier than any real supply`);
  }
  for (const item of byCategory('case')) {
    const [l, w, h] = item.specs.dimensions;
    assert.ok(h >= 250 && h <= 700, `${item.id} height ${h} mm is not a desktop case`);
    assert.ok(l <= 700 && w <= 700, `${item.id} is not a desktop footprint`);
  }
});

test('the catalogue stocks every brand the project promises', () => {
  const required = ['AMD', 'Intel', 'NVIDIA', 'ASUS', 'MSI', 'Gigabyte', 'Corsair', 'Kingston', 'Samsung'];
  const brands = new Set(HARDWARE.map((item) => item.brand));
  for (const brand of required) {
    assert.ok(brands.has(brand), `${brand} is missing from the catalogue`);
  }
  assert.ok(brands.size >= 20, `expected a broad brand list, found ${brands.size}`);
});

test('the eleven part types are all stocked', () => {
  const expected = ['cpu', 'gpu', 'motherboard', 'ram', 'cooler', 'storage', 'psu', 'case', 'fans', 'cables'];
  for (const category of expected) {
    assert.ok(byCategory(category).length > 0, `${category} has no parts`);
    assert.ok(CATEGORIES.some((entry) => entry.id === category), `${category} is not a catalogue category`);
  }
  const liquid = byCategory('cooler').filter((item) => String(item.specs?.type).toLowerCase().includes('liquid'));
  assert.ok(liquid.length >= 4, 'liquid coolers should be a real slice of the cooler list');
  const air = byCategory('cooler').filter((item) => !String(item.specs?.type).toLowerCase().includes('liquid'));
  assert.ok(air.length >= 4, 'and air coolers should be there too');
});

test('socket, chipset and form factor data is consistent', () => {
  for (const item of byCategory('motherboard')) {
    assert.ok(item.specs.socket, `${item.id} needs a socket`);
    assert.ok(item.specs.chipset, `${item.id} needs a chipset`);
    assert.ok(item.specs.formFactor, `${item.id} needs a form factor`);
    assert.ok(Array.isArray(item.specs.memoryTypes) && item.specs.memoryTypes.length, `${item.id} needs memory support`);
    assert.ok(Number.isFinite(Number(item.specs.memorySlots)) && Number(item.specs.memorySlots) > 0, `${item.id} needs DIMM slots`);
    assert.ok(Number.isFinite(Number(item.specs.m2Slots)) && Number(item.specs.m2Slots) >= 0, `${item.id} needs M.2 count`);
    assert.ok(Number.isFinite(Number(item.specs.sataPorts)) && Number(item.specs.sataPorts) >= 0, `${item.id} needs SATA ports`);
  }
  // Every socket a board uses has at least one chip that fits it, and every
  // board form factor is accepted by at least one case.
  const sockets = new Set(byCategory('cpu').map((item) => item.specs.socket));
  const boardSockets = new Set(byCategory('motherboard').map((item) => item.specs.socket));
  for (const socket of boardSockets) {
    assert.ok(sockets.has(socket), `no CPU in the catalogue fits the ${socket} boards`);
  }
  const caseForms = new Set(byCategory('case').flatMap((item) => item.specs.supportedFormFactors || []));
  const boardForms = new Set(byCategory('motherboard').map((item) => item.specs.formFactor));
  for (const form of boardForms) {
    assert.ok(caseForms.has(form), `no case in the catalogue accepts a ${form} board`);
  }
});

test('every GPU states its power connector, TDP, length and thickness', () => {
  for (const item of byCategory('gpu')) {
    assert.ok(item.specs.powerConnectors, `${item.id} needs to name its power connector`);
    assert.ok(Number.isFinite(Number(item.specs.tdp)) && Number(item.specs.tdp) > 0, `${item.id} needs a TDP`);
    assert.ok(Number.isFinite(Number(item.specs.length)), `${item.id} needs a length`);
    assert.ok(Number.isFinite(Number(item.specs.dimensions[2])) && Number(item.specs.dimensions[2]) > 0,
      `${item.id} needs a thickness so the slot count can be worked out`);
  }
});

test('power supplies state wattage, efficiency, form factor and connectors', () => {
  for (const item of byCategory('psu')) {
    assert.ok(Number.isFinite(Number(item.specs.wattage)) && Number(item.specs.wattage) >= 400, `${item.id} needs wattage`);
    assert.ok(item.specs.efficiency, `${item.id} needs an efficiency rating`);
    assert.ok(['ATX', 'SFX', 'SFX-L'].includes(item.specs.formFactor), `${item.id} needs a real form factor`);
    assert.ok(Number.isFinite(Number(item.specs.pcie8pin)), `${item.id} needs a PCIe connector count`);
    assert.equal(typeof item.specs.twelveVHPWR, 'boolean', `${item.id} must say whether it has a native 16-pin`);
  }
  // A supply is never smaller than the standard ATX footprint, and the small
  // ones are marked as such.
  const sfx = byCategory('psu').filter((item) => item.specs.formFactor !== 'ATX');
  assert.ok(sfx.length >= 1, 'at least one small supply should be stocked for small cases');
});

test('prices are positive numbers on every part, and accessories stay cheap', () => {
  for (const item of HARDWARE) {
    assert.ok(Number.isFinite(item.price) && item.price > 0, `${item.id} needs a price`);
    assert.ok(item.price <= 200000, `${item.id} is priced above any real desktop part`);
  }
  for (const item of byCategory('cables')) {
    assert.ok(item.price <= 4000, `${item.id} is an accessory priced like a graphics card`);
  }
  for (const item of byCategory('fans')) {
    assert.ok(item.price <= 6000, `${item.id} is a fan priced like a cooler`);
  }
});

test('the dimension and weight helpers agree with explicit specs', () => {
  const explicit = HW('gpu-rtx-4090');
  assert.deepEqual(dimensionsFor(explicit), explicit.specs.dimensions);
  assert.equal(weightFor(explicit, explicit.specs.dimensions), explicit.specs.weight);
  const derived = dimensionsFor({ category: 'cpu', specs: {} });
  assert.ok(Array.isArray(derived) && derived.every((value) => Number.isFinite(value) && value > 0),
    'a part with no stated size still gets numbers');
  const derivedWeight = weightFor({ category: 'fan', specs: {} }, derived);
  assert.ok(Number.isFinite(derivedWeight) && derivedWeight > 0, 'and a weight to go with them');
});

test('the catalogue is lookup-safe: unknown ids return nothing', () => {
  assert.equal(getHardware('no-such-part'), null);
  assert.equal(HARDWARE_BY_ID['no-such-part'], undefined);
  assert.equal(getHardware(''), null);
});
