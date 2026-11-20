/**
 * Local build library backed by IndexedDB.
 *
 * IndexedDB is the browser's own small database: it holds more than
 * localStorage and survives bigger saves, so the app keeps every build plus a
 * version history of each one here.
 *
 * Every record is written with the shape a cloud table would use
 * (owner / remoteId / syncedAt / deletedAt), so the day an account is added the
 * same object can be pushed to Supabase without a migration. Until then all
 * four fields stay null, which simply means "this record only exists here".
 *
 * localStorage is still the fallback: if a browser blocks IndexedDB the library
 * keeps working for the session and the older saved-builds key is left alone.
 */

const DB_NAME = 'pcbs.library.v1';
const DB_VERSION = 1;

export const STORE_BUILDS = 'builds';
export const STORE_VERSIONS = 'versions';
export const STORE_META = 'meta';

const LEGACY_SAVED_KEY = 'pcbs.saved.v1';
const MAX_VERSIONS_PER_BUILD = 12;

let dbPromise = null;
let available = typeof indexedDB !== 'undefined';

const listeners = new Set();

function emit(event, payload) {
  listeners.forEach((handler) => {
    try {
      handler(event, payload);
    } catch (error) {
      console.error(error);
    }
  });
}

/** Subscribe to library changes. Returns an unsubscribe function. */
export function onLibrary(handler) {
  listeners.add(handler);
  return () => listeners.delete(handler);
}

export function isDbAvailable() {
  return available;
}

function open() {
  if (!available) return Promise.reject(new Error('IndexedDB is not available in this browser.'));
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    let request;
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch (error) {
      available = false;
      reject(error);
      return;
    }
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_BUILDS)) {
        const builds = db.createObjectStore(STORE_BUILDS, { keyPath: 'id' });
        builds.createIndex('updatedAt', 'updatedAt');
        builds.createIndex('name', 'name');
      }
      if (!db.objectStoreNames.contains(STORE_VERSIONS)) {
        const versions = db.createObjectStore(STORE_VERSIONS, { keyPath: 'id' });
        versions.createIndex('buildId', 'buildId');
        versions.createIndex('at', 'at');
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
    request.onerror = () => {
      available = false;
      reject(request.error || new Error('The local build library could not be opened.'));
    };
    request.onblocked = () => {
      reject(new Error('The local build library is open in another tab. Close it and try again.'));
    };
  }).catch((error) => {
    dbPromise = null;
    throw error;
  });
  return dbPromise;
}

function tx(storeName, mode, run) {
  return open().then((db) => new Promise((resolve, reject) => {
    let result;
    let transaction;
    try {
      transaction = db.transaction(storeName, mode);
    } catch (error) {
      reject(error);
      return;
    }
    const store = transaction.objectStore(storeName);
    try {
      result = run(store);
    } catch (error) {
      reject(error);
      return;
    }
    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () => reject(transaction.error || new Error('The library write failed.'));
    transaction.onabort = () => reject(transaction.error || new Error('The library write was aborted.'));
  }));
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Write every record of a run in one transaction (used by bulk restore). */
function bulkWrite(storeName, records) {
  return tx(storeName, 'readwrite', (store) => {
    records.forEach((record) => store.put(record));
  });
}

/* ------------------------------------------------------------------ */
/* Cloud-ready record shape                                            */
/* ------------------------------------------------------------------ */

/**
 * Reads a saved build and returns the record the library stores.
 * The cloud fields are deliberately kept: a future sync only has to update
 * them, never to change the record's shape.
 */
export function toRecord(build, options = {}) {
  const now = new Date().toISOString();
  // A build with no budget has none: Number(null) is 0, so a plain
  // Number.isFinite check would store a phantom zero-peso budget.
  const rawBudget = build.budget;
  const budget = rawBudget === null || rawBudget === undefined || rawBudget === ''
    ? null
    : Number(rawBudget);
  return {
    id: String(build.id),
    name: String(build.name || 'Untitled Build').slice(0, 60),
    items: build.items && typeof build.items === 'object' ? build.items : {},
    budget: Number.isFinite(budget) ? budget : null,
    createdAt: build.createdAt || now,
    updatedAt: build.updatedAt || now,
    sourceId: build.sourceId || null,
    savedAt: build.savedAt || now,
    owner: options.owner ?? build.owner ?? null,
    remoteId: build.remoteId ?? null,
    syncedAt: build.syncedAt ?? null,
    deletedAt: null,
  };
}

function toEntry(record) {
  return {
    id: record.id,
    name: record.name,
    items: record.items || {},
    budget: record.budget ?? null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    historyCount: record.historyCount || 0,
  };
}

/* ------------------------------------------------------------------ */
/* Reads                                                               */
/* ------------------------------------------------------------------ */

export async function listBuilds() {
  const records = await tx(STORE_BUILDS, 'readonly', (store) => requestToPromise(store.getAll()));
  return records
    .filter((record) => record && !record.deletedAt)
    .map(toEntry)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function getBuild(id) {
  const record = await tx(STORE_BUILDS, 'readonly', (store) => requestToPromise(store.get(String(id))));
  return record && !record.deletedAt ? toEntry(record) : null;
}

export async function listVersions(buildId) {
  if (!buildId) return [];
  const records = await tx(STORE_VERSIONS, 'readonly', (store) => requestToPromise(store.getAll()));
  return records
    .filter((record) => record && record.buildId === String(buildId))
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .reverse()
    .slice(0, MAX_VERSIONS_PER_BUILD);
}

/* ------------------------------------------------------------------ */
/* Writes                                                              */
/* ------------------------------------------------------------------ */

export async function putBuild(build, options = {}) {
  const record = toRecord(build, options);
  await tx(STORE_BUILDS, 'readwrite', (store) => store.put(record));
  emit('build', { action: options.action || 'put', id: record.id });
  return toEntry(record);
}

/**
 * Save a snapshot of a build's parts into its history, so a later edit can be
 * rolled back. The newest 12 versions per build are kept; older ones are pruned
 * in the same transaction.
 */
export async function addVersion(buildId, snapshot, note = '') {
  if (!buildId) return null;
  const at = new Date().toISOString();
  const version = {
    id: `${buildId}:${at}:${Math.random().toString(36).slice(2, 7)}`,
    buildId: String(buildId),
    at,
    note: String(note).slice(0, 80),
    name: String(snapshot.name || '').slice(0, 60),
    items: snapshot.items || {},
    budget: snapshot.budget ?? null,
    total: Number.isFinite(Number(snapshot.total)) ? Number(snapshot.total) : null,
    owner: null,
    remoteId: null,
    syncedAt: null,
  };
  await tx(STORE_VERSIONS, 'readwrite', (store) => store.put(version));
  await pruneVersions(buildId);
  emit('version', { buildId: version.buildId, at });
  return version;
}

async function pruneVersions(buildId) {
  const records = await tx(STORE_VERSIONS, 'readonly', (store) => requestToPromise(store.getAll()));
  const mine = records
    .filter((record) => record.buildId === String(buildId))
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  const extra = mine.slice(MAX_VERSIONS_PER_BUILD);
  if (!extra.length) return;
  await tx(STORE_VERSIONS, 'readwrite', (store) => {
    extra.forEach((record) => store.delete(record.id));
  });
}

export async function deleteBuild(id) {
  await tx(STORE_BUILDS, 'readwrite', (store) => store.delete(String(id)));
  await tx(STORE_VERSIONS, 'readwrite', (store) => {
    store.delete(IDBKeyRange.bound(`${id}:`, `${id}:\uffff`));
  });
  emit('build', { action: 'deleted', id });
}

export async function clearBuilds() {
  await tx(STORE_BUILDS, 'readwrite', (store) => store.clear());
  await tx(STORE_VERSIONS, 'readwrite', (store) => store.clear());
  emit('build', { action: 'cleared' });
}

/* ------------------------------------------------------------------ */
/* Migration from the old localStorage key                             */
/* ------------------------------------------------------------------ */

let migrated = false;

/**
 * Move builds saved by the older localStorage version into the library, once.
 * Nothing is deleted from localStorage: if the migration fails halfway the old
 * data is still there, and the flag only flips after a full success.
 */
export async function migrateLegacy() {
  if (migrated || !available) return { moved: 0, skipped: true };
  migrated = true;
  let raw;
  try {
    raw = localStorage.getItem(LEGACY_SAVED_KEY);
  } catch {
    return { moved: 0, skipped: true };
  }
  if (!raw) return { moved: 0, skipped: true };
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { moved: 0, skipped: true, error: 'The old saved list was not readable.' };
  }
  if (!Array.isArray(parsed) || !parsed.length) return { moved: 0, skipped: true };

  const existing = await tx(STORE_BUILDS, 'readonly', (store) => requestToPromise(store.getAll()));
  const known = new Set(existing.map((record) => record.id));
  const fresh = [];
  parsed.forEach((entry) => {
    if (!entry || typeof entry !== 'object' || !entry.id || known.has(String(entry.id))) return;
    fresh.push(toRecord({
      id: String(entry.id),
      name: entry.name,
      items: entry.items,
      budget: entry.budget,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }, { action: 'migrated' }));
  });
  if (!fresh.length) return { moved: 0, skipped: true };
  await bulkWrite(STORE_BUILDS, fresh);
  emit('build', { action: 'migrated', count: fresh.length });
  return { moved: fresh.length, skipped: false };
}

/* ------------------------------------------------------------------ */
/* Export / import                                                     */
/* ------------------------------------------------------------------ */

/** A single file holding every build and its history: the manual backup. */
export async function exportAll() {
  const [builds, versions] = await Promise.all([
    tx(STORE_BUILDS, 'readonly', (store) => requestToPromise(store.getAll())),
    tx(STORE_VERSIONS, 'readonly', (store) => requestToPromise(store.getAll())),
  ]);
  return {
    format: 'pcbs.library.v1',
    exportedAt: new Date().toISOString(),
    builds: builds.filter((record) => !record.deletedAt),
    versions,
  };
}

export async function importAll(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('That file is not a build library.');
  if (!Array.isArray(payload.builds)) throw new Error('That file has no builds in it.');
  const builds = payload.builds
    .filter((entry) => entry && typeof entry === 'object' && entry.items)
    .map((entry) => toRecord({
      id: entry.id || `build-${Math.random().toString(36).slice(2, 10)}`,
      name: entry.name,
      items: entry.items,
      budget: entry.budget,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }, { action: 'imported' }));
  if (!builds.length) throw new Error('No readable builds were found in that file.');
  await bulkWrite(STORE_BUILDS, builds);
  const versions = Array.isArray(payload.versions)
    ? payload.versions.filter((entry) => entry && entry.buildId && entry.items)
    : [];
  if (versions.length) await bulkWrite(STORE_VERSIONS, versions);
  emit('build', { action: 'imported', count: builds.length });
  return { builds: builds.length, versions: versions.length };
}

/* ------------------------------------------------------------------ */
/* Meta: settings that belong to the library, not the build            */
/* ------------------------------------------------------------------ */

export async function getMeta(key, fallback = null) {
  const record = await tx(STORE_META, 'readonly', (store) => requestToPromise(store.get(String(key))));
  return record ? record.value : fallback;
}

export async function setMeta(key, value) {
  await tx(STORE_META, 'readwrite', (store) => store.put({ key: String(key), value, at: new Date().toISOString() }));
  return value;
}

/** Rough usage numbers for the storage panel, when the browser reports them. */
export async function usage() {
  try {
    if (navigator.storage?.estimate) {
      const estimate = await navigator.storage.estimate();
      return { used: estimate.usage || 0, quota: estimate.quota || 0, persisted: await persisted() };
    }
  } catch {
    /* plain browsers without the estimate API */
  }
  return null;
}

async function persisted() {
  try {
    if (navigator.storage?.persisted) return Boolean(await navigator.storage.persisted());
  } catch {
    /* not supported */
  }
  return false;
}

/** Ask the browser not to evict this site's data when the phone runs low. */
export async function requestPersist() {
  try {
    if (navigator.storage?.persist) return Boolean(await navigator.storage.persist());
  } catch {
    /* not supported */
  }
  return false;
}
