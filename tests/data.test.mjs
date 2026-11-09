import test from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORIES, HARDWARE, HARDWARE_BY_ID } from '../js/data/hardware.js';

test('catalog contains 100 unique products across every category', () => {
  assert.equal(HARDWARE.length, 100);
  assert.equal(Object.keys(HARDWARE_BY_ID).length, HARDWARE.length);
  for (const category of CATEGORIES) {
    assert.ok(HARDWARE.some((item) => item.category === category.id), `${category.id} should not be empty`);
  }
});

test('every product has valid pricing, availability, and metadata', () => {
  for (const item of HARDWARE) {
    assert.ok(item.id && item.name && item.brand, `${item.id || '(unknown)'} needs identity fields`);
    assert.ok(Number.isFinite(item.price) && item.price >= 0, `${item.id} needs a valid price`);
    assert.ok(['in-stock', 'low-stock', 'preorder'].includes(item.availability), `${item.id} has invalid availability`);
    assert.ok(item.specs && typeof item.specs === 'object', `${item.id} needs specs`);
    if (['cpu', 'gpu'].includes(item.category)) {
      assert.ok(Number.isFinite(item.score) && item.score > 0, `${item.id} needs a performance score`);
    }
  }
});

test('critical compatibility specifications are present', () => {
  for (const item of HARDWARE.filter((entry) => entry.category === 'gpu')) {
    assert.ok(Number.isFinite(item.specs.length), `${item.id} needs GPU length`);
    assert.ok(Number.isFinite(item.specs.tdp), `${item.id} needs GPU TDP`);
  }
  for (const item of HARDWARE.filter((entry) => entry.category === 'motherboard')) {
    assert.ok(item.specs.socket && item.specs.chipset && item.specs.formFactor, `${item.id} needs socket, chipset, and form factor`);
  }
  for (const item of HARDWARE.filter((entry) => entry.category === 'case')) {
    assert.ok(Number.isFinite(item.specs.maxGpuLength), `${item.id} needs maximum GPU length`);
  }
  for (const item of HARDWARE.filter((entry) => entry.category === 'psu')) {
    assert.ok(Number.isFinite(item.specs.wattage), `${item.id} needs wattage`);
  }
});
