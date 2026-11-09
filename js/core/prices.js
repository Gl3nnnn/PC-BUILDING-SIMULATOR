import { HARDWARE_BY_ID } from '../data/hardware.js';
import { formatDate } from './format.js';

const PRICE_URL = new URL('../../data/prices.json', import.meta.url);
const AVAILABILITY = new Set(['in-stock', 'low-stock', 'preorder']);
const SOURCE_LABELS = {
  sample: 'Sample estimate',
  feed: 'Live price feed',
};

const state = {
  loaded: false,
  error: null,
  meta: {
    source: 'sample',
    provider: 'PC Build Studio sample catalog',
    generatedAt: null,
    currency: 'PHP',
  },
  updatedCount: 0,
};

let pending = null;

function safeUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

export function applyPriceDataset(dataset) {
  if (!dataset || typeof dataset !== 'object') throw new Error('Price data must be an object.');
  const items = dataset.items;
  if (!items || typeof items !== 'object') throw new Error('Price data is missing an items map.');

  const source = dataset.source === 'feed' ? 'feed' : 'sample';
  const generatedAt = dataset.generatedAt && !Number.isNaN(new Date(dataset.generatedAt).getTime())
    ? new Date(dataset.generatedAt).toISOString()
    : null;
  const provider = String(dataset.provider || (source === 'feed' ? 'Retailer feed' : 'PC Build Studio sample catalog')).slice(0, 120);
  let updatedCount = 0;

  Object.entries(items).forEach(([id, entry]) => {
    const item = HARDWARE_BY_ID[id];
    if (!item || !entry || typeof entry !== 'object') return;
    const price = Number(entry.price);
    if (!Number.isFinite(price) || price < 0) return;
    item.price = Math.round(price);
    if (AVAILABILITY.has(entry.availability)) item.availability = entry.availability;
    item.vendor = entry.vendor ? String(entry.vendor).slice(0, 80) : null;
    item.buyUrl = safeUrl(entry.url || entry.buyUrl);
    item.priceUpdatedAt = entry.updatedAt && !Number.isNaN(new Date(entry.updatedAt).getTime())
      ? new Date(entry.updatedAt).toISOString()
      : generatedAt;
    item.priceSource = source;
    updatedCount += 1;
  });

  state.meta = {
    source,
    provider,
    generatedAt,
    currency: String(dataset.currency || 'PHP').slice(0, 8),
  };
  state.updatedCount = updatedCount;
  state.loaded = true;
  return updatedCount;
}

export async function loadPrices() {
  if (pending) return pending;
  pending = (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(PRICE_URL, { cache: 'no-cache', signal: controller.signal });
      if (!response.ok) throw new Error(`Price request failed with ${response.status}.`);
      applyPriceDataset(await response.json());
    } catch (error) {
      state.error = error;
      state.loaded = true;
      state.meta.source = 'sample';
      state.meta.provider = 'PC Build Studio sample catalog';
    } finally {
      clearTimeout(timeout);
    }
  })();
  return pending;
}

export function getPriceState() {
  return {
    ...state,
    meta: { ...state.meta },
  };
}

export function getPriceSourceLabel(source = state.meta.source) {
  return SOURCE_LABELS[source] || SOURCE_LABELS.sample;
}

export function itemPriceIsLive(item) {
  return item?.priceSource === 'feed';
}

export function priceNote(item) {
  if (itemPriceIsLive(item)) {
    return item.vendor ? `Live · ${item.vendor}` : 'Live price';
  }
  return 'est. price';
}

export function priceSnapshotSummary() {
  const updated = state.meta.generatedAt ? formatDate(state.meta.generatedAt, true) : 'not dated';
  if (state.meta.source === 'feed') {
    return `Live prices from ${state.meta.provider} · updated ${updated}`;
  }
  return `Sample price estimates · snapshot ${updated}`;
}

export function priceTitle(item) {
  if (item?.priceUpdatedAt) {
    const source = itemPriceIsLive(item) ? 'Live retailer price' : 'Sample estimate';
    return `${source} · updated ${new Date(item.priceUpdatedAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}`;
  }
  return 'Estimated sample price in Philippine pesos';
}
