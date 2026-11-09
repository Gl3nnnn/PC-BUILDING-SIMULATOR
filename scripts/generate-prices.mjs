import { writeFile } from 'node:fs/promises';
import { HARDWARE } from '../js/data/hardware.js';

const generatedAt = new Date().toISOString();
const payload = {
  version: 1,
  currency: 'PHP',
  source: 'sample',
  provider: 'PC Build Studio sample catalog',
  generatedAt,
  items: Object.fromEntries(HARDWARE.map((item) => [
    item.id,
    {
      price: item.price,
      availability: item.availability,
      vendor: null,
      url: null,
      updatedAt: generatedAt,
    },
  ])),
};

await writeFile(new URL('../data/prices.json', import.meta.url), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(`Wrote ${HARDWARE.length} sample prices.`);
