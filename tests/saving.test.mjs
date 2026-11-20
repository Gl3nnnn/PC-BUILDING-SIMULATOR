// Build saving and loading tests.
//
// The library, the store and the build records are the part a player trusts
// most: a build must survive a round trip, a duplicate must be independent of
// its original, and a shared link must carry the parts and nothing else. The
// record shape matters because a future account will upload exactly these
// objects.
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  emptyBuild, cloneBuild, sanitizeBuild, encodeBuild, decodeBuild,
  buildToFile, buildFromFile, getIds, buildTotal, selectedCount,
} from '../js/core/build.js';
import { toRecord } from '../js/core/db.js';
import { PRESETS } from '../js/data/presets.js';
import { CATEGORIES } from '../js/data/hardware.js';

function buildWith(items, name = 'Saved build') {
  const build = emptyBuild(name);
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

test('a new build starts empty, named, and with every category slot present', () => {
  const build = emptyBuild('My first rig');
  assert.equal(build.name, 'My first rig');
  assert.equal(selectedCount(build), 0);
  assert.equal(buildTotal(build), 0);
  for (const category of CATEGORIES) {
    assert.ok(Array.isArray(build.items[category.id] || []), `${category.id} should have a slot`);
    assert.equal(getIds(build, category.id).length, 0, `${category.id} should start empty`);
  }
  assert.equal(build.budget, null, 'a fresh build has no budget');
});

test('a clone is independent of the build it came from', () => {
  const original = buildWith(GOOD, 'Original');
  const copy = cloneBuild(original);
  assert.deepEqual(copy.items, original.items, 'it holds the same parts');
  copy.items.cpu = ['cpu-i9-14900k'];
  assert.deepEqual(original.items.cpu, GOOD.cpu, 'changing the copy leaves the original alone');
  assert.notEqual(copy, original, 'they are different objects');
});

test('a saved build round-trips through its own file format', () => {
  const build = buildWith(GOOD, 'Round trip');
  const text = buildToFile(build);
  assert.ok(text.length > 20, 'the file has content');
  const back = buildFromFile(text);
  assert.equal(back.name, build.name, 'the name survives');
  for (const category of ['cpu', 'gpu', 'motherboard', 'ram', 'psu', 'case', 'cooler', 'storage']) {
    assert.deepEqual(back.items[category], build.items[category], `${category} survives`);
  }
  assert.equal(buildTotal(back), buildTotal(build), 'and so does the price');
});

test('every preset survives a file round trip', () => {
  for (const preset of PRESETS) {
    const build = buildWith(preset.items, preset.name);
    const back = buildFromFile(buildToFile(build));
    assert.deepEqual(back.items, build.items, `${preset.id} keeps its exact parts`);
    assert.equal(back.name, build.name, `${preset.id} keeps its name`);
  }
});

test('a share link encodes the parts and decodes back to the same build', () => {
  const build = buildWith(GOOD, 'Shared rig');
  const encoded = encodeBuild(build);
  assert.ok(encoded.length > 20, 'the link payload is real data');
  assert.equal(/%20|%2F|%3D/.test(encoded), false, 'and it is URL-safe, with no escaping to trip over');
  const back = decodeBuild(encoded);
  assert.equal(back.name, build.name);
  assert.deepEqual(back.items.cpu, build.items.cpu);
  assert.deepEqual(back.items.gpu, build.items.gpu);
});

test('a broken or empty link is refused rather than half-loaded', () => {
  assert.throws(() => decodeBuild(''), /no build data/i);
  assert.throws(() => decodeBuild('not-valid-data'), /invalid|corrupt/i);
  assert.throws(() => decodeBuild('%%%'), /invalid|corrupt/i);
  assert.throws(() => buildFromFile('{"nope":true}'), /not a build|not contain|invalid|corrupt/i);
  assert.throws(() => buildFromFile('not json at all'), /not valid json|invalid|corrupt/i);
  assert.throws(() => buildFromFile(''), /not valid json|invalid|corrupt/i);
});

test('importing a build strips parts that do not exist and caps each category', () => {
  const build = sanitizeBuild({
    name: 'Imported',
    items: {
      cpu: ['cpu-i5-12400f', 'does-not-exist', 'gpu-rtx-3060'],
      gpu: ['gpu-rtx-3060', 'gpu-rtx-4090', 'gpu-rtx-5080'],
      ram: ['ram-fury-16-3200', 'ram-fury-16-3200'],
    },
  });
  assert.deepEqual(build.items.cpu, ['cpu-i5-12400f'], 'the real chip stays, the fake and the misfiled card go');
  assert.equal(build.items.gpu.length, 1, 'only one card is kept');
  assert.equal(build.items.ram.length, 1, 'a repeated stick is not counted twice');
});

test('an imported build with nothing usable still loads as an empty, named build', () => {
  const build = sanitizeBuild({ name: 'Nothing', items: { cpu: ['fake-part'] } }, 'Fallback name');
  assert.equal(build.name, 'Nothing', 'the name is kept');
  assert.equal(selectedCount(build), 0, 'and nothing is loaded');
  const unnamed = sanitizeBuild({ items: {} }, 'Fallback name');
  assert.equal(unnamed.name, 'Fallback name', 'a build with no name gets the fallback');
});

test('the stored record carries the shape a future account would upload', () => {
  const build = buildWith(GOOD, 'Library build');
  build.id = 'build-test-1';
  const record = toRecord(build);
  assert.equal(record.id, 'build-test-1', 'the id is kept');
  assert.equal(record.name, 'Library build');
  assert.deepEqual(record.items, build.items, 'the parts are stored as they are');
  assert.ok(record.createdAt && record.updatedAt && record.savedAt, 'the timestamps are set');
  assert.equal(new Date(record.createdAt).toISOString(), record.createdAt, 'in ISO form');
  for (const field of ['owner', 'remoteId', 'syncedAt']) {
    assert.ok(field in record, `${field} exists so a sync can fill it later`);
    assert.equal(record[field], null, `${field} starts empty on a local-only build`);
  }
  assert.equal(record.deletedAt, null, 'nothing is soft-deleted on save');
});

test('a record with an owner already set keeps it, so a cloud push is not a rewrite', () => {
  const record = toRecord({ id: 'b', name: 'Owned', items: {}, owner: 'user-1', remoteId: 'remote-9' });
  assert.equal(record.owner, 'user-1');
  assert.equal(record.remoteId, 'remote-9');
  const override = toRecord({ id: 'b', name: 'Owned', items: {} }, { owner: 'user-2' });
  assert.equal(override.owner, 'user-2', 'a caller can set the owner explicitly');
});

test('long names are trimmed to a length the library can hold', () => {
  const long = 'x'.repeat(200);
  const record = toRecord({ id: 'b', name: long, items: {} });
  assert.equal(record.name.length, 60, 'the stored name is capped');
  assert.ok(record.name.startsWith('xxx'), 'and it keeps the start of the name');
});

test('a build with no name still saves under a readable default', () => {
  const record = toRecord({ id: 'b', name: '', items: GOOD });
  assert.equal(record.name, 'Untitled Build');
  assert.deepEqual(record.items, GOOD);
});

test('a damaged record cannot smuggle a non-object into the parts list', () => {
  const record = toRecord({ id: 'b', name: 'Odd', items: 'not-an-object' });
  assert.deepEqual(record.items, {}, 'the parts fall back to an empty map');
  const nullItems = toRecord({ id: 'b', name: 'Odd', items: null });
  assert.deepEqual(nullItems.items, {});
});

test('the budget survives a save when it is a number and drops out when it is not', () => {
  assert.equal(toRecord({ id: 'b', name: 'n', items: {}, budget: 45000 }).budget, 45000);
  assert.equal(toRecord({ id: 'b', name: 'n', items: {}, budget: '45000' }).budget, 45000);
  assert.equal(toRecord({ id: 'b', name: 'n', items: {}, budget: null }).budget, null);
  assert.equal(toRecord({ id: 'b', name: 'n', items: {}, budget: 'lots' }).budget, null,
    'a nonsense budget is dropped rather than stored as NaN');
});

test('a saved build keeps every part a duplicate would need', () => {
  for (const preset of PRESETS) {
    const build = buildWith(preset.items, preset.name);
    const record = toRecord({ ...build, id: `build-${preset.id}` });
    const copy = cloneBuild({ items: record.items, name: `${record.name} (copy)` });
    for (const category of Object.keys(preset.items)) {
      assert.deepEqual(getIds(copy, category), getIds(build, category), `${preset.id}: ${category} copied`);
    }
    assert.match(copy.name, /copy/i, 'the duplicate is named as one');
  }
});
