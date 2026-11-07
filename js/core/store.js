import { CATEGORIES, getHardware } from '../data/hardware.js';
import { PRESETS_BY_ID } from '../data/presets.js';
import { emptyBuild, sanitizeBuild, cloneBuild, getIds, selectedCount, buildTotal } from './build.js';
import { uid } from './format.js';

const CURRENT_KEY = 'pcbs.current.v1';
const SAVED_KEY = 'pcbs.saved.v1';
const MAX_SAVED = 60;

const listeners = new Map();
let storageAvailable = true;

function emit(event, payload) {
  const handlers = listeners.get(event);
  if (!handlers) return;
  handlers.forEach((handler) => {
    try {
      handler(payload);
    } catch (error) {
      console.error(error);
    }
  });
}

export function on(event, handler) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(handler);
  return () => listeners.get(event)?.delete(handler);
}

function readJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    storageAvailable = false;
    return null;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    storageAvailable = true;
  } catch {
    storageAvailable = false;
    emit('storage-error');
  }
}

function loadSaved() {
  const raw = readJSON(SAVED_KEY);
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const build = sanitizeBuild(entry, 'Saved Build');
      return {
        id: typeof entry.id === 'string' ? entry.id : uid('build'),
        name: build.name,
        items: build.items,
        budget: build.budget,
        createdAt: build.createdAt,
        updatedAt: build.updatedAt,
      };
    })
    .filter(Boolean)
    .slice(0, MAX_SAVED);
}

let current = sanitizeBuild(readJSON(CURRENT_KEY) || emptyBuild(), 'Untitled Build');
let saved = loadSaved();

if (current.sourceId && !saved.some((entry) => entry.id === current.sourceId)) {
  current.sourceId = null;
}

function persistCurrent() {
  current.updatedAt = new Date().toISOString();
  writeJSON(CURRENT_KEY, current);
}

function persistSaved() {
  writeJSON(SAVED_KEY, saved);
}

function commit(reason, meta = {}) {
  persistCurrent();
  emit('build', { reason, ...meta });
}

export const store = {
  getCurrent() {
    return current;
  },
  getSaved() {
    return [...saved]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },
  getSavedById(id) {
    return saved.find((entry) => entry.id === id) || null;
  },
  isStorageAvailable() {
    return storageAvailable;
  },
  getTotals() {
    return {
      total: buildTotal(current),
      count: selectedCount(current),
    };
  },
  addComponent(categoryId, itemId) {
    const category = CATEGORIES.find((entry) => entry.id === categoryId);
    const item = getHardware(itemId);
    if (!category || !item || item.category !== categoryId) {
      return { action: 'invalid' };
    }
    const existing = getIds(current, categoryId);
    if (existing.includes(itemId)) {
      current.items[categoryId] = existing.filter((id) => id !== itemId);
      commit('remove', { categoryId, itemId });
      return { action: 'removed', item };
    }
    if (!category.multi) {
      const previousId = existing[0] || null;
      current.items[categoryId] = [itemId];
      current.sourceId = null;
      commit('add', { categoryId, itemId });
      return {
        action: previousId ? 'replaced' : 'added',
        item,
        previous: previousId ? getHardware(previousId) : null,
      };
    }
    if (existing.length >= 12) return { action: 'limit', item };
    current.items[categoryId] = [...existing, itemId];
    current.sourceId = null;
    commit('add', { categoryId, itemId });
    return { action: 'added', item };
  },
  removeComponent(categoryId, itemId) {
    const existing = getIds(current, categoryId);
    if (!existing.includes(itemId)) return false;
    current.items[categoryId] = existing.filter((id) => id !== itemId);
    current.sourceId = null;
    commit('remove', { categoryId, itemId });
    return true;
  },
  clearBuild(options = {}) {
    const name = options.keepName ? current.name : 'Untitled Build';
    current = emptyBuild(name);
    if (options.keepBudget && current.budget) current.budget = options.keepBudget;
    commit('clear');
    return current;
  },
  setBudget(value) {
    if (value === null || value === '') {
      current.budget = null;
    } else {
      const budget = Number(value);
      if (!Number.isFinite(budget) || budget < 0) return false;
      current.budget = Math.min(Math.round(budget), 10000000);
    }
    commit('budget');
    return true;
  },
  renameCurrent(name) {
    const clean = String(name || '').trim().slice(0, 60);
    if (!clean) return false;
    current.name = clean;
    commit('rename');
    return true;
  },
  loadPreset(presetId) {
    const preset = PRESETS_BY_ID[presetId];
    if (!preset) return false;
    const budget = current.budget;
    current = emptyBuild(preset.name);
    CATEGORIES.forEach((category) => {
      current.items[category.id] = [...(preset.items[category.id] || [])];
    });
    current.budget = budget;
    commit('preset', { preset });
    return true;
  },
  replaceBuild(build, options = {}) {
    const sanitized = sanitizeBuild(build, options.name || 'Imported Build');
    if (options.keepBudget && current.budget) sanitized.budget = current.budget;
    sanitized.sourceId = options.sourceId || null;
    current = sanitized;
    commit(options.reason || 'replace');
    return current;
  },
  saveSnapshot(name, options = {}) {
    const clean = String(name || '').trim().slice(0, 60);
    if (!clean) throw new Error('Give your build a name before saving.');
    const now = new Date().toISOString();
    const existing = options.updateId ? saved.find((entry) => entry.id === options.updateId) : null;
    current.name = clean;
    if (existing) {
      existing.name = clean;
      existing.items = Object.fromEntries(CATEGORIES.map((category) => [category.id, [...getIds(current, category.id)]]));
      existing.budget = current.budget;
      existing.updatedAt = now;
      current.sourceId = existing.id;
      persistSaved();
      commit('save');
      emit('saved', { action: 'updated', entry: existing });
      return { action: 'updated', entry: existing };
    }
    const entry = {
      id: uid('build'),
      name: clean,
      items: Object.fromEntries(CATEGORIES.map((category) => [category.id, [...getIds(current, category.id)]])),
      budget: current.budget,
      createdAt: now,
      updatedAt: now,
    };
    saved = [entry, ...saved].slice(0, MAX_SAVED);
    current.sourceId = entry.id;
    persistSaved();
    commit('save');
    emit('saved', { action: 'created', entry });
    return { action: 'created', entry };
  },
  loadSavedBuild(id) {
    const entry = saved.find((build) => build.id === id);
    if (!entry) return false;
    current = sanitizeBuild(entry, 'Saved Build');
    current.sourceId = entry.id;
    current.name = entry.name;
    current.createdAt = entry.createdAt;
    commit('load-saved', { entry });
    return true;
  },
  updateSaved(id, patch) {
    const entry = saved.find((build) => build.id === id);
    if (!entry) return false;
    if (typeof patch.name === 'string') {
      const clean = patch.name.trim().slice(0, 60);
      if (!clean) return false;
      entry.name = clean;
      if (current.sourceId === id) current.name = clean;
    }
    if (patch.budget === null || Number.isFinite(Number(patch.budget))) {
      entry.budget = patch.budget === null ? null : Math.max(0, Math.round(Number(patch.budget)));
    }
    entry.updatedAt = new Date().toISOString();
    persistSaved();
    if (current.sourceId === id) commit('saved-rename');
    emit('saved', { action: 'updated', entry });
    return true;
  },
  deleteSaved(id) {
    const before = saved.length;
    saved = saved.filter((entry) => entry.id !== id);
    if (saved.length === before) return false;
    if (current.sourceId === id) current.sourceId = null;
    persistSaved();
    persistCurrent();
    emit('saved', { action: 'deleted', id });
    emit('build', { reason: 'saved-deleted' });
    return true;
  },
  duplicateSaved(id) {
    const entry = saved.find((build) => build.id === id);
    if (!entry) return false;
    const now = new Date().toISOString();
    const copy = {
      id: uid('build'),
      name: `${entry.name} Copy`.slice(0, 60),
      items: Object.fromEntries(CATEGORIES.map((category) => [category.id, [...(entry.items[category.id] || [])]])),
      budget: entry.budget,
      createdAt: now,
      updatedAt: now,
    };
    saved = [copy, ...saved].slice(0, MAX_SAVED);
    persistSaved();
    emit('saved', { action: 'created', entry: copy });
    return copy;
  },
  clearSaved() {
    saved = [];
    if (current.sourceId) current.sourceId = null;
    persistSaved();
    persistCurrent();
    emit('saved', { action: 'cleared' });
    emit('build', { reason: 'saved-cleared' });
  },
  /** Revert the in-memory build from storage (used after external changes). */
  reload() {
    current = sanitizeBuild(readJSON(CURRENT_KEY) || emptyBuild(), 'Untitled Build');
    saved = loadSaved();
    emit('build', { reason: 'reload' });
    emit('saved', { reason: 'reload' });
  },
};

export function cloneSavedItems(entry) {
  return CATEGORIES.reduce((items, category) => {
    items[category.id] = [...(entry.items?.[category.id] || [])];
    return items;
  }, {});
}

export function makeBuildFromSaved(entry) {
  const build = cloneBuild({ ...entry, items: cloneSavedItems(entry) });
  build.sourceId = entry.id;
  return build;
}
