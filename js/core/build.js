import { CATEGORIES, HARDWARE_BY_ID, getHardware } from '../data/hardware.js';
import { base64UrlDecode, base64UrlEncode } from './format.js';

export function emptyBuild(name = 'Untitled Build') {
  const items = {};
  CATEGORIES.forEach((category) => {
    items[category.id] = [];
  });
  return {
    name,
    items,
    budget: null,
    sourceId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function cloneBuild(build) {
  return {
    ...emptyBuild(build.name),
    items: Object.fromEntries(CATEGORIES.map((category) => [category.id, [...(build.items?.[category.id] || [])]])),
    budget: build.budget ?? null,
    sourceId: build.sourceId ?? null,
    createdAt: build.createdAt || new Date().toISOString(),
    updatedAt: build.updatedAt || new Date().toISOString(),
  };
}

export function getIds(build, category) {
  const ids = build?.items?.[category];
  return Array.isArray(ids) ? ids : [];
}

export function getItems(build, category) {
  return getIds(build, category).map((id) => HARDWARE_BY_ID[id]).filter(Boolean);
}

export function getAllItems(build) {
  return CATEGORIES.flatMap((category) => getItems(build, category.id));
}

export function selectedCount(build) {
  return CATEGORIES.reduce((sum, category) => sum + getIds(build, category.id).length, 0);
}

export function buildTotal(build) {
  return getAllItems(build).reduce((sum, item) => sum + (Number(item.price) || 0), 0);
}

export function buildPowerDraw(build) {
  const cpu = getItems(build, 'cpu')[0];
  const gpu = getItems(build, 'gpu')[0];
  const cooler = getItems(build, 'cooler')[0];
  const storages = getItems(build, 'storage');
  const fans = getItems(build, 'fans');
  const fanCount = fans.reduce((sum, fan) => sum + (Number(fan.specs.count) || 0), 0);
  const load = 45
    + (cpu ? Number(cpu.specs.peakPower || cpu.specs.tdp) || 0 : 0)
    + (gpu ? Number(gpu.specs.tdp) || 0 : 0)
    + storages.length * 5
    + fanCount * 3
    + (cooler?.specs.type === 'Liquid' ? 15 : 0);
  return Math.round(load / 10) * 10;
}

export function recommendedPsu(build) {
  const load = buildPowerDraw(build);
  return Math.ceil((load * 1.35) / 50) * 50;
}

export function coreProgress(build) {
  const required = CATEGORIES.filter((category) => category.required);
  const missing = required.filter((category) => getIds(build, category.id).length === 0);
  return {
    selected: required.length - missing.length,
    total: required.length,
    missing,
  };
}

export function sanitizeBuild(raw, fallbackName = 'Untitled Build') {
  const build = emptyBuild();
  if (!raw || typeof raw !== 'object') return build;

  if (typeof raw.name === 'string' && raw.name.trim()) {
    build.name = raw.name.trim().slice(0, 60);
  } else {
    build.name = fallbackName;
  }

  const sourceItems = raw.items && typeof raw.items === 'object' ? raw.items : raw.i && typeof raw.i === 'object' ? raw.i : {};

  CATEGORIES.forEach((category) => {
    let source = sourceItems[category.id];
    if (typeof source === 'string') source = [source];
    if (!Array.isArray(source)) source = [];
    const seen = new Set();
    const valid = source
      .filter((id) => typeof id === 'string')
      .filter((id) => {
        const item = HARDWARE_BY_ID[id];
        if (!item || item.category !== category.id || seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    build.items[category.id] = category.multi ? valid.slice(0, 12) : valid.slice(0, 1);
  });

  if (raw.budget !== null && raw.budget !== undefined && raw.budget !== '') {
    const budget = Number(raw.budget);
    if (Number.isFinite(budget) && budget >= 0) build.budget = Math.min(Math.round(budget), 10000000);
  }

  if (typeof raw.sourceId === 'string') build.sourceId = raw.sourceId;

  const created = raw.createdAt ? new Date(raw.createdAt) : null;
  build.createdAt = created && !Number.isNaN(created.getTime()) ? created.toISOString() : new Date().toISOString();
  const updated = raw.updatedAt ? new Date(raw.updatedAt) : null;
  build.updatedAt = updated && !Number.isNaN(updated.getTime()) ? updated.toISOString() : new Date().toISOString();

  return build;
}

export function encodeBuild(build) {
  const compact = { v: 1, n: build.name || 'Shared Build', i: {} };
  CATEGORIES.forEach((category) => {
    const ids = getIds(build, category.id);
    if (ids.length) compact.i[category.id] = ids;
  });
  if (build.budget) compact.b = build.budget;
  return base64UrlEncode(JSON.stringify(compact));
}

export function decodeBuild(encoded) {
  if (!encoded) throw new Error('No build data was provided.');
  let payload;
  try {
    payload = JSON.parse(base64UrlDecode(encoded));
  } catch {
    throw new Error('This build link is invalid or corrupted.');
  }
  if (!payload || typeof payload !== 'object' || !payload.i) {
    throw new Error('This build link does not contain a valid configuration.');
  }
  const build = sanitizeBuild({
    name: payload.n || 'Shared Build',
    items: payload.i,
    budget: payload.b,
    sourceId: null,
  });
  if (selectedCount(build) === 0) throw new Error('This build link does not contain any recognizable components.');
  return build;
}

export function buildToFile(build) {
  return JSON.stringify({
    app: 'PC Build Studio',
    version: 1,
    exportedAt: new Date().toISOString(),
    build: {
      name: build.name,
      items: build.items,
      budget: build.budget,
    },
  }, null, 2);
}

export function buildFromFile(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('The selected file is not valid JSON.');
  }
  const raw = parsed?.build || parsed;
  const build = sanitizeBuild(raw, 'Imported Build');
  if (selectedCount(build) === 0) throw new Error('The file did not contain a recognizable PC build.');
  return build;
}
