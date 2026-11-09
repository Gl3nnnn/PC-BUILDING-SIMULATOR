import { readFile, writeFile } from 'node:fs/promises';
import { HARDWARE_BY_ID } from '../js/data/hardware.js';

const PRICE_PATH = new URL('../data/prices.json', import.meta.url);
const AVAILABILITY = new Set(['in-stock', 'low-stock', 'preorder']);

function safeUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

function normalizeTimestamp(value, fallback) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : fallback;
}

function feedEntries(feed) {
  if (Array.isArray(feed)) return feed;
  if (Array.isArray(feed?.items)) return feed.items;
  if (feed?.items && typeof feed.items === 'object') {
    return Object.entries(feed.items).map(([id, entry]) => ({ id, ...entry }));
  }
  if (Array.isArray(feed?.products)) return feed.products;
  throw new Error('Feed must contain an items array, items map, or products array.');
}

function normalizeFeed(feed, now, previous) {
  const entries = feedEntries(feed);
  const source = feed?.source === 'sample' ? 'sample' : 'feed';
  const provider = String(feed?.provider || feed?.sourceName || feed?.retailer || 'Retailer feed').slice(0, 120);
  const items = { ...(previous?.items || {}) };
  let updated = 0;
  const skipped = [];

  entries.forEach((entry) => {
    const id = String(entry?.id || entry?.sku || '').trim();
    const item = HARDWARE_BY_ID[id];
    const price = Number(entry?.price ?? entry?.amount);
    if (!item) {
      skipped.push(`${id || '(missing id)'}: unknown product`);
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      skipped.push(`${id}: invalid price`);
      return;
    }
    items[id] = {
      price: Math.round(price),
      availability: AVAILABILITY.has(entry.availability) ? entry.availability : (items[id]?.availability || item.availability),
      vendor: entry.vendor ? String(entry.vendor).slice(0, 80) : (items[id]?.vendor || null),
      url: safeUrl(entry.url || entry.buyUrl) || items[id]?.url || null,
      updatedAt: normalizeTimestamp(entry.updatedAt, now),
    };
    updated += 1;
  });

  return {
    version: 1,
    currency: 'PHP',
    source,
    provider,
    generatedAt: now,
    items,
  };
}

async function readCurrent() {
  try {
    return JSON.parse(await readFile(PRICE_PATH, 'utf8'));
  } catch {
    return null;
  }
}

async function main() {
  const checkOnly = process.argv.includes('--check');
  const current = await readCurrent();
  if (checkOnly) {
    if (!current) throw new Error('data/prices.json is missing.');
    const invalid = Object.entries(current.items || {}).filter(([id, entry]) => !HARDWARE_BY_ID[id] || !Number.isFinite(Number(entry?.price)));
    if (invalid.length) throw new Error(`Invalid price entries: ${invalid.map(([id]) => id).join(', ')}`);
    console.log(`Price file valid: ${Object.keys(current.items || {}).length} entries, source=${current.source || 'unknown'}.`);
    return;
  }

  const feedUrl = process.env.PRICE_FEED_URL;
  if (!feedUrl) {
    console.log('PRICE_FEED_URL is not set. Keeping the existing price snapshot.');
    return;
  }

  const headers = { accept: 'application/json' };
  if (process.env.PRICE_FEED_TOKEN) {
    headers.authorization = `Bearer ${process.env.PRICE_FEED_TOKEN}`;
  }

  const response = await fetch(feedUrl, { headers });
  if (!response.ok) throw new Error(`Price feed request failed with ${response.status}.`);
  const feed = await response.json();
  const previous = current || { items: {} };
  const next = normalizeFeed(feed, new Date().toISOString(), previous);
  await writeFile(PRICE_PATH, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  console.log(`Updated ${Object.keys(next.items).length} price entries from ${next.provider}.`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
