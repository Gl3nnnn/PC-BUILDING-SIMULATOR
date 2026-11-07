import { AVAILABILITY, categoryMeta } from '../data/hardware.js';
import { byteSizeLabel, escapeHtml } from '../core/format.js';

const list = (value) => (Array.isArray(value) ? value.join(', ') : value);
const orUnknown = (value) => (value === null || value === undefined || value === '' ? 'Not listed' : value);
const memory = (item) => item?.specs?.memoryTypes || [];

export const SPEC_SCHEMA = {
  cpu: [
    { label: 'Socket', value: (s) => s.socket },
    { label: 'Cores / Threads', value: (s) => `${s.cores} / ${s.threads}` },
    { label: 'Base / Boost clock', value: (s) => `${s.baseClock} / ${s.boostClock} GHz` },
    { label: 'Base TDP', value: (s) => `${s.tdp} W` },
    { label: 'Max boost power', value: (s) => `${s.peakPower} W` },
    { label: 'Integrated graphics', value: (s) => s.iGPU || 'None' },
    { label: 'Memory support', value: (s) => `${list(s.memoryTypes)} up to ${s.memorySpeed} MT/s` },
    { label: 'Cache', value: (s) => s.cache },
    { label: 'Included cooler', value: (s) => (s.includedCooler ? 'Yes' : 'No') },
    { label: 'Unlocked multiplier', value: (s) => (s.unlocked ? 'Yes' : 'No') },
  ],
  motherboard: [
    { label: 'Socket', value: (s) => s.socket },
    { label: 'Chipset', value: (s) => s.chipset },
    { label: 'Form factor', value: (s) => s.formFactor },
    { label: 'Memory type', value: (s) => list(memory({ specs: s })) },
    { label: 'DIMM slots', value: (s) => s.memorySlots },
    { label: 'Max memory', value: (s) => `${s.maxMemory} GB` },
    { label: 'Max memory speed', value: (s) => `${s.maxMemorySpeed} MT/s` },
    { label: 'M.2 slots', value: (s) => `${s.m2Slots} (PCIe Gen ${s.m2Gen})` },
    { label: 'SATA ports', value: (s) => s.sataPorts },
    { label: 'Wi-Fi', value: (s) => (s.wifi ? 'Yes' : 'No') },
    { label: 'PCIe generation', value: (s) => `Gen ${s.pcieGen}` },
    { label: 'Power stages', value: (s) => s.powerStages },
    { label: 'Audio', value: (s) => s.audio },
  ],
  gpu: [
    { label: 'GPU chip', value: (s) => s.chip },
    { label: 'VRAM', value: (s) => `${s.vram} GB` },
    { label: 'Memory type', value: (s) => s.memoryType },
    { label: 'Card length', value: (s) => `${s.length} mm` },
    { label: 'TDP', value: (s) => `${s.tdp} W` },
    { label: 'Power connectors', value: (s) => s.powerConnectors },
    { label: 'Boost clock', value: (s) => `${s.boostClock} MHz` },
    { label: 'Display outputs', value: (s) => s.ports },
  ],
  ram: [
    { label: 'Memory type', value: (s) => s.type },
    { label: 'Kit capacity', value: (s) => `${s.capacity} GB` },
    { label: 'Modules', value: (s) => `${s.modules} × ${Math.round(s.capacity / s.modules)} GB` },
    { label: 'Speed', value: (s) => `${s.speed} MT/s` },
    { label: 'CAS latency', value: (s) => `CL${s.cl}` },
    { label: 'Module height', value: (s) => `${s.height} mm` },
    { label: 'RGB lighting', value: (s) => (s.rgb ? 'Yes' : 'No') },
    { label: 'Voltage', value: (s) => s.voltage },
  ],
  storage: [
    { label: 'Drive type', value: (s) => s.type },
    { label: 'Capacity', value: (s) => byteSizeLabel(s.capacityGB) },
    { label: 'Interface', value: (s) => s.interface },
    { label: 'Form factor', value: (s) => s.form },
    { label: 'Sequential read', value: (s) => `${s.read} MB/s` },
    { label: 'Sequential write', value: (s) => `${s.write} MB/s` },
    { label: 'PCIe generation', value: (s) => (s.pcieGen ? `Gen ${s.pcieGen}` : 'N/A') },
    { label: 'Spindle speed', value: (s) => (s.rpm ? `${s.rpm} RPM` : 'N/A') },
  ],
  psu: [
    { label: 'Wattage', value: (s) => `${s.wattage} W` },
    { label: 'Efficiency', value: (s) => s.efficiency },
    { label: 'Modularity', value: (s) => s.modular },
    { label: 'Form factor', value: (s) => s.formFactor },
    { label: 'Length', value: (s) => `${s.length} mm` },
    { label: 'PCIe 8-pin cables', value: (s) => s.pcie8pin },
    { label: 'Native 16-pin', value: (s) => (s.twelveVHPWR ? 'Yes' : 'No') },
    { label: 'Warranty', value: (s) => s.warranty },
  ],
  case: [
    { label: 'Supported motherboards', value: (s) => list(s.supportedFormFactors) },
    { label: 'Case size', value: (s) => s.size },
    { label: 'Max GPU length', value: (s) => `${s.maxGpuLength} mm` },
    { label: 'Max cooler height', value: (s) => `${s.maxCoolerHeight} mm` },
    { label: 'Radiator support', value: (s) => s.radiatorSupport.map((size) => `${size} mm`).join(', ') },
    { label: 'Fan mounts', value: (s) => `${s.fanSlots} positions (${s.fanSizes.join('/')} mm)` },
    { label: 'Included fans', value: (s) => s.includedFans },
    { label: 'PSU support', value: (s) => list(s.psuSupport) },
    { label: 'Max PSU length', value: (s) => `${s.maxPsuLength} mm` },
    { label: 'Side panel', value: (s) => s.sidePanel },
    { label: 'Front panel', value: (s) => s.frontPanel },
  ],
  cooler: [
    { label: 'Cooler type', value: (s) => s.type },
    { label: 'Supported sockets', value: (s) => list(s.sockets) },
    { label: 'Height', value: (s) => (s.type === 'Air' ? `${s.height} mm` : 'N/A (liquid)') },
    { label: 'Radiator size', value: (s) => (s.radiatorSize ? `${s.radiatorSize} mm` : 'N/A') },
    { label: 'TDP rating', value: (s) => `${s.tdp} W` },
    { label: 'Memory clearance', value: (s) => (s.ramClearance ? `${s.ramClearance} mm` : 'N/A') },
    { label: 'Fans included', value: (s) => s.fans },
    { label: 'RGB lighting', value: (s) => (s.rgb ? 'Yes' : 'No') },
    { label: 'Noise level', value: (s) => s.noise },
  ],
  fans: [
    { label: 'Fan size', value: (s) => `${s.size} mm` },
    { label: 'Fans per pack', value: (s) => s.count },
    { label: 'Airflow', value: (s) => `${s.airflow} CFM` },
    { label: 'Noise level', value: (s) => `${s.noise} dBA` },
    { label: 'RGB lighting', value: (s) => (s.rgb ? 'Yes' : 'No') },
    { label: 'Connector', value: (s) => s.connector },
  ],
};

export function specRows(item) {
  if (!item) return [];
  const schema = SPEC_SCHEMA[item.category] || [];
  return schema.map((row) => {
    let value;
    try {
      value = row.value(item.specs || {});
    } catch {
      value = null;
    }
    const display = orUnknown(value);
    return { label: row.label, value: display, missing: display === 'Not listed' };
  });
}

export function keySpecs(item) {
  if (!item) return [];
  const s = item.specs || {};
  switch (item.category) {
    case 'cpu':
      return [s.socket, `${s.cores}C / ${s.threads}T`, `${s.boostClock} GHz boost`].filter(Boolean);
    case 'motherboard':
      return [s.chipset, s.formFactor, list(memory({ specs: s }))].filter(Boolean);
    case 'gpu':
      return [`${s.vram} GB ${s.memoryType}`, `${s.length} mm`, `${s.tdp} W`].filter(Boolean);
    case 'ram':
      return [`${s.capacity} GB ${s.type}`, `${s.speed} MT/s`, `CL${s.cl}`].filter(Boolean);
    case 'storage':
      return [s.type, byteSizeLabel(s.capacityGB), `${s.read} MB/s`].filter(Boolean);
    case 'psu':
      return [`${s.wattage} W`, s.efficiency, s.modular].filter(Boolean);
    case 'case':
      return [s.size, `${list(s.supportedFormFactors)} max`, `GPU ${s.maxGpuLength} mm`].filter(Boolean);
    case 'cooler':
      return [s.type, s.type === 'Liquid' ? `${s.radiatorSize} mm radiator` : `${s.height} mm tall`, `${s.tdp} W rated`].filter(Boolean);
    case 'fans':
      return [`${s.size} mm × ${s.count}`, `${s.airflow} CFM`, s.rgb ? 'ARGB' : 'No RGB'].filter(Boolean);
    default:
      return [];
  }
}

export function specChips(item, limit = 3) {
  return keySpecs(item).slice(0, limit).map((value) => `<span class="spec-chip">${escapeHtml(value)}</span>`).join('');
}

export function availabilityBadge(item) {
  const meta = AVAILABILITY[item?.availability] || AVAILABILITY['in-stock'];
  return `<span class="badge badge--${meta.tone}"><span class="badge-dot"></span>${escapeHtml(meta.label)}</span>`;
}

export function categoryLabel(categoryId) {
  return categoryMeta(categoryId)?.label || 'Component';
}

export function categoryIcon(categoryId) {
  return categoryMeta(categoryId)?.icon || 'cpu';
}

export function machineReadableName(item) {
  return `${item.brand} ${item.name}`;
}
