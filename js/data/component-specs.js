// Physical and electrical data every catalogue item needs, derived from its own
// specifications so the numbers stay consistent with what the part already lists.

const num = (value) => (Number.isFinite(Number(value)) ? Number(value) : null);

const round2 = (value) => Math.round(value * 100) / 100;

const round1 = (value) => Math.round(value * 10) / 10;

// Millimetres: [length, width, height] — how the part measures on a desk.
const CASE_SIZES = {
  'case-deepcool-matrexx40': [400, 205, 420],
  'case-tecware-forge-m2': [390, 210, 450],
  'case-jonsbo-d31': [440, 205, 405],
  'case-lianli-lancool216': [480, 235, 455],
  'case-nzxt-h5-flow': [446, 210, 455],
  'case-corsair-4000d': [453, 230, 466],
  'case-fractal-north': [447, 215, 469],
  'case-cm-nr200p': [292, 185, 303],
  'case-lianli-o11-evo': [465, 285, 459],
  'case-asus-hyperion': [608, 255, 626],
};

const BOARD_SIZES = {
  'ATX': [305, 244, 30],
  'Micro-ATX': [244, 244, 30],
  'Mini-ITX': [170, 170, 30],
  'E-ATX': [330, 305, 30],
};

const DRIVE_SIZES = {
  'M.2 2280': [80, 22, 3.5],
  '2.5-inch': [100, 70, 7],
  '3.5-inch': [147, 102, 26],
};

// Watts drawn from the power supply at full load.
const IDLE_POWER = { cpu: 6, gpu: 12, motherboard: 12, ram: 2, storage: 1, cooler: 1, case: 1, fans: 1, cables: 0, psu: 0 };

export function dimensionsFor(item) {
  const s = item?.specs || {};
  if (s.dimensions) return s.dimensions;
  const category = item?.category;

  if (category === 'cpu') {
    const socket = String(s.socket || '');
    return socket.startsWith('AM') ? [40, 40, 4] : [45, 37.5, 4];
  }
  if (category === 'motherboard') {
    return BOARD_SIZES[s.formFactor] || BOARD_SIZES['Micro-ATX'];
  }
  if (category === 'gpu') {
    const length = num(s.length) || 240;
    const slotWidth = num(s.tdp) >= 250 ? 60 : num(s.tdp) >= 180 ? 50 : 40;
    return [length, 120, slotWidth];
  }
  if (category === 'ram') {
    const modules = num(s.modules) || 1;
    return [133, num(s.height) || 34, round1(8 * modules)];
  }
  if (category === 'storage') {
    return DRIVE_SIZES[s.form] || DRIVE_SIZES['M.2 2280'];
  }
  if (category === 'psu') {
    const length = num(s.length) || 140;
    return s.formFactor === 'SFX' ? [125, length, 64] : [150, length, 86];
  }
  if (category === 'case') {
    return CASE_SIZES[item.id] || [450, 215, 450];
  }
  if (category === 'cooler') {
    if (s.type === 'Liquid') {
      const radiator = num(s.radiatorSize) || 240;
      return [radiator, 120, 52];
    }
    return [125, round1(num(s.height) || 150), 130];
  }
  if (category === 'fans') {
    const size = num(s.size) || 120;
    return [size, size, 25];
  }
  if (category === 'cables') {
    return [num(s.length) || 300, 18, 8];
  }
  return [200, 120, 30];
}

export function powerFor(item) {
  const s = item?.specs || {};
  switch (item?.category) {
    case 'cpu':
      return num(s.peakPower) || num(s.tdp) || 65;
    case 'gpu':
      return num(s.tdp) || 0;
    case 'motherboard':
      return 40;
    case 'ram':
      return 3 * (num(s.modules) || 1);
    case 'storage':
      return s.type === 'HDD' ? 7 : s.pcieGen ? 8 : 3;
    case 'psu':
      return 0;
    case 'case':
      return 2 * (num(s.includedFans) || 0);
    case 'cooler':
      return (s.type === 'Liquid' ? 8 : 1) + 2 * (num(s.fans) || 1);
    case 'fans':
      return 2 * (num(s.count) || 1);
    case 'cables':
      return 0;
    default:
      return 0;
  }
}

export function weightFor(item, dimensions) {
  const s = item?.specs || {};
  if (Number.isFinite(Number(s.weight))) return Number(s.weight);
  const [l = 0, w = 0, h = 0] = dimensions || [];
  const volumeLitres = (l * w * h) / 1000000;
  const density = item?.category === 'case' ? 0.5 : item?.category === 'psu' ? 0.45 : 0.28;
  return round2(Math.max(volumeLitres * density, 0.02));
}

// Adds dimensions, power draw, weight and a visual-asset marker to every item.
export function attachPhysicalSpecs(items) {
  for (const item of items) {
    const specs = item.specs || (item.specs = {});
    if (!specs.dimensions) specs.dimensions = dimensionsFor(item);
    if (!Number.isFinite(Number(specs.power))) specs.power = powerFor(item);
    if (!Number.isFinite(Number(specs.idlePower))) specs.idlePower = IDLE_POWER[item.category] || 0;
    if (!Number.isFinite(Number(specs.weight))) specs.weight = weightFor(item, specs.dimensions);
    if (!item.visual) item.visual = { art: 'vector', model: '3d', accent: item.accent || null };
  }
  return items;
}
