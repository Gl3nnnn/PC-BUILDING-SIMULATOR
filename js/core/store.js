import { CATEGORIES, getHardware } from '../data/hardware.js';
import { PRESETS_BY_ID } from '../data/presets.js';
import { emptyBuild, sanitizeBuild, cloneBuild, getIds, selectedCount, buildTotal } from './build.js';
import { uid } from './format.js';
import * as library from './db.js';

const CURRENT_KEY = 'pcbs.current.v1';
const SAVED_KEY = 'pcbs.saved.v1';
const RATINGS_KEY = 'pcbs.ratings.v1';
const MAX_SAVED = 60;

/* True once IndexedDB has handed us the library. Until then the old
 * localStorage list is what the page shows, so the first paint is never blank. */
let libraryReady = false;

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

function loadRatings() {
  const raw = readJSON(RATINGS_KEY);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  return Object.fromEntries(
    Object.entries(raw)
      .filter(([, value]) => Number.isFinite(Number(value)) && Number(value) >= 1 && Number(value) <= 5)
      .map(([id, value]) => [id, Math.round(Number(value))]),
  );
}

let current = sanitizeBuild(readJSON(CURRENT_KEY) || emptyBuild(), 'Untitled Build');
let saved = loadSaved();
let ratings = loadRatings();

if (current.sourceId && !saved.some((entry) => entry.id === current.sourceId)) {
  current.sourceId = null;
}

function persistCurrent() {
  current.updatedAt = new Date().toISOString();
  writeJSON(CURRENT_KEY, current);
}

function persistSaved() {
  /* While the IndexedDB library is in charge the records live there; the
   * localStorage copy is kept only for browsers that block the database. */
  if (libraryReady && library.isDbAvailable()) return;
  writeJSON(SAVED_KEY, saved);
}

/** Write one build into the library, best effort: a failure toasts but never
 * stops the edit the user just made from showing on screen. */
function mirrorSaved(entry, action) {
  if (!library.isDbAvailable()) return;
  library.putBuild(entry, { action }).catch((error) => emit('library-error', error));
}

function mirrorDeleted(id) {
  if (!library.isDbAvailable()) return;
  library.deleteBuild(id).catch((error) => emit('library-error', error));
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
  getPresetRating(id) {
    return ratings[id] || 0;
  },
  ratePreset(id, value) {
    const rating = Math.round(Number(value));
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) return false;
    ratings = { ...ratings, [id]: rating };
    writeJSON(RATINGS_KEY, ratings);
    emit('ratings', { id, rating });
    return true;
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
      const previousItems = Object.fromEntries(CATEGORIES.map((category) => [category.id, [...getIds(existing, category.id)]]));
      existing.name = clean;
      existing.items = Object.fromEntries(CATEGORIES.map((category) => [category.id, [...getIds(current, category.id)]]));
      existing.budget = current.budget;
      existing.updatedAt = now;
      current.sourceId = existing.id;
      persistSaved();
      mirrorSaved(existing, 'updated');
      if (libraryReady) {
        library.addVersion(existing.id, { name: existing.name, items: previousItems, budget: existing.budget, total: null }, 'Before update')
          .then(() => library.addVersion(existing.id, { name: existing.name, items: existing.items, budget: existing.budget, total: buildTotal(current) }, 'Updated'))
          .catch(() => {});
      }
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
    mirrorSaved(entry, 'created');
    if (libraryReady) {
      library.addVersion(entry.id, { name: entry.name, items: entry.items, budget: entry.budget, total: buildTotal(current) }, 'First save')
        .catch(() => {});
    }
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
    mirrorSaved(entry, 'renamed');
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
    mirrorDeleted(id);
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
    mirrorSaved(copy, 'duplicated');
    emit('saved', { action: 'created', entry: copy });
    return copy;
  },
  clearSaved() {
    saved = [];
    if (current.sourceId) current.sourceId = null;
    persistSaved();
    if (library.isDbAvailable()) library.clearBuilds().catch((error) => emit('library-error', error));
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

/* ------------------------------------------------------------------ */
/* Library boot, rollback and the cloud-ready hand-off                 */
/* ------------------------------------------------------------------ */

/**
 * Open the IndexedDB library, move any older localStorage builds into it, and
 * hand the records to the store. Safe to call more than once.
 * Resolves with a small report, never rejects: a browser that blocks IndexedDB
 * simply keeps the localStorage list it already loaded.
 */
export async function initLibrary() {
  if (!library.isDbAvailable()) return { ready: false, reason: 'IndexedDB is not available' };
  try {
    const migration = await library.migrateLegacy();
    const records = await library.listBuilds();
    if (records.length || migration.moved) {
      saved = records.slice(0, MAX_SAVED);
      if (current.sourceId && !saved.some((entry) => entry.id === current.sourceId)) current.sourceId = null;
    }
    libraryReady = true;
    emit('saved', { reason: 'library-ready', migrated: migration.moved });
    emit('build', { reason: 'library-ready' });
    return { ready: true, count: saved.length, migrated: migration.moved };
  } catch (error) {
    libraryReady = false;
    emit('library-error', error);
    return { ready: false, reason: error?.message || 'The library could not be opened.' };
  }
}

export function isLibraryReady() {
  return libraryReady;
}

/** Rewrite a saved build from one of its stored versions. */
export async function restoreVersion(buildId, versionId) {
  const versions = await library.listVersions(buildId);
  const version = versions.find((entry) => entry.id === versionId);
  if (!version) throw new Error('That version is no longer in this build’s history.');
  const entry = saved.find((build) => build.id === buildId);
  if (!entry) throw new Error('That saved build has been deleted.');
  const restored = sanitizeBuild({ items: version.items, name: entry.name, budget: version.budget }, entry.name);
  entry.items = Object.fromEntries(CATEGORIES.map((category) => [category.id, [...getIds(restored, category.id)]]));
  entry.budget = version.budget ?? null;
  entry.updatedAt = new Date().toISOString();
  persistSaved();
  mirrorSaved(entry, 'restored');
  if (libraryReady) {
    await library.addVersion(entry.id, { name: entry.name, items: entry.items, budget: entry.budget, total: null }, `Rolled back to ${new Date(version.at).toLocaleString()}`).catch(() => {});
  }
  if (current.sourceId === buildId) {
    current = sanitizeBuild(entry, entry.name);
    current.sourceId = buildId;
    commit('restore-version');
  }
  emit('saved', { action: 'restored', entry });
  return entry;
}

/**
 * The record shape a future account would upload. Every record already carries
 * the cloud fields (owner / remoteId / syncedAt), so syncing is a matter of
 * sending these objects, not reshaping them.
 */
export function exportForSync() {
  const now = new Date().toISOString();
  return {
    format: 'pcbs.sync.v1',
    exportedAt: now,
    cloud: { enabled: false, provider: null, note: 'Local-only records. Add accounts later without changing this shape.' },
    builds: saved.map((entry) => ({
      id: entry.id,
      name: entry.name,
      items: entry.items,
      budget: entry.budget,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      owner: null,
      remoteId: null,
      syncedAt: null,
      deletedAt: null,
    })),
  };
}

export function makeBuildFromSaved(entry) {
  const build = cloneBuild({ ...entry, items: cloneSavedItems(entry) });
  build.sourceId = entry.id;
  return build;
}
