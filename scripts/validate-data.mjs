import { readFile } from 'node:fs/promises';
import { CATEGORIES, HARDWARE, HARDWARE_BY_ID } from '../js/data/hardware.js';

const PRICE_PATH = new URL('../data/prices.json', import.meta.url);
const AVAILABILITY = new Set(['in-stock', 'low-stock', 'preorder']);
const errors = [];

if (HARDWARE.length !== 100) errors.push(`Expected 100 hardware items, found ${HARDWARE.length}.`);
if (Object.keys(HARDWARE_BY_ID).length !== HARDWARE.length) errors.push('Duplicate hardware IDs found.');

const categories = new Set(CATEGORIES.map((category) => category.id));
for (const item of HARDWARE) {
  if (!item.id || !String(item.id).trim()) errors.push('Hardware item has no ID.');
  if (!categories.has(item.category)) errors.push(`${item.id}: unknown category "${item.category}".`);
  if (!item.name || !item.brand) errors.push(`${item.id}: missing name or brand.`);
  if (!Number.isFinite(Number(item.price)) || Number(item.price) < 0) errors.push(`${item.id}: invalid price.`);
  if (!AVAILABILITY.has(item.availability)) errors.push(`${item.id}: invalid availability "${item.availability}".`);
  if (!item.specs || typeof item.specs !== 'object') errors.push(`${item.id}: missing specs object.`);
  if (['cpu', 'gpu'].includes(item.category) && (!Number.isFinite(Number(item.score)) || Number(item.score) <= 0)) {
    errors.push(`${item.id}: invalid performance score.`);
  }
}

for (const category of CATEGORIES) {
  const count = HARDWARE.filter((item) => item.category === category.id).length;
  if (!count) errors.push(`Category "${category.id}" has no hardware.`);
}

const gpuMissing = HARDWARE.filter((item) => item.category === 'gpu' && (!Number.isFinite(Number(item.specs?.length)) || !Number.isFinite(Number(item.specs?.tdp))));
if (gpuMissing.length) errors.push(`GPUs missing length or TDP: ${gpuMissing.map((item) => item.id).join(', ')}`);

const boardMissing = HARDWARE.filter((item) => item.category === 'motherboard' && (!item.specs?.socket || !item.specs?.chipset || !item.specs?.formFactor));
if (boardMissing.length) errors.push(`Motherboards missing socket/chipset/form factor: ${boardMissing.map((item) => item.id).join(', ')}`);

const caseMissing = HARDWARE.filter((item) => item.category === 'case' && !Number.isFinite(Number(item.specs?.maxGpuLength)));
if (caseMissing.length) errors.push(`Cases missing maximum GPU length: ${caseMissing.map((item) => item.id).join(', ')}`);

const psuMissing = HARDWARE.filter((item) => item.category === 'psu' && !Number.isFinite(Number(item.specs?.wattage)));
if (psuMissing.length) errors.push(`PSUs missing wattage: ${psuMissing.map((item) => item.id).join(', ')}`);

const priceFile = JSON.parse(await readFile(PRICE_PATH, 'utf8'));
if (priceFile.currency !== 'PHP') errors.push('Price snapshot must use PHP.');
if (!['sample', 'feed'].includes(priceFile.source)) errors.push('Price snapshot source must be "sample" or "feed".');
if (!priceFile.generatedAt || Number.isNaN(new Date(priceFile.generatedAt).getTime())) errors.push('Price snapshot has an invalid generatedAt timestamp.');
if (!priceFile.items || typeof priceFile.items !== 'object') errors.push('Price snapshot has no items map.');

const priceEntries = Object.entries(priceFile.items || {});
if (priceEntries.length !== HARDWARE.length) errors.push(`Price snapshot has ${priceEntries.length} entries; expected ${HARDWARE.length}.`);
for (const [id, entry] of priceEntries) {
  if (!HARDWARE_BY_ID[id]) errors.push(`Price snapshot contains unknown product "${id}".`);
  if (!Number.isFinite(Number(entry?.price)) || Number(entry.price) < 0) errors.push(`${id}: invalid snapshot price.`);
  if (entry?.availability && !AVAILABILITY.has(entry.availability)) errors.push(`${id}: invalid snapshot availability.`);
  if (entry?.url) {
    try {
      const url = new URL(entry.url);
      if (!['http:', 'https:'].includes(url.protocol)) errors.push(`${id}: snapshot URL must use HTTP(S).`);
    } catch {
      errors.push(`${id}: snapshot URL is invalid.`);
    }
  }
}

if (errors.length) {
  console.error(`Data validation failed with ${errors.length} problem${errors.length === 1 ? '' : 's'}:`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Data valid: ${HARDWARE.length} products across ${CATEGORIES.length} categories; ${priceEntries.length} price entries.`);
}
