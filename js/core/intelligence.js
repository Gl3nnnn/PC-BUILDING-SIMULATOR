import { getItems, buildPowerDraw, buildTotal, recommendedPsu } from './build.js';
import { evaluateBuild } from './compat.js';
import { estimatePerformance, RESOLUTIONS } from './perf.js';
import { itemsByCategory } from '../data/hardware.js';

function resolutionValue(id) {
  return RESOLUTIONS.some((entry) => entry.id === id) ? id : '1080p';
}

function summarizeBottleneck(performance) {
  if (!performance?.ready) return null;
  const cpuLimited = performance.games.filter((game) => game.bottleneck === 'CPU').length;
  const gpuLimited = performance.games.filter((game) => game.bottleneck === 'GPU').length;
  const balanced = performance.games.length - cpuLimited - gpuLimited;
  if (performance.integrated) {
    return {
      limiter: 'GPU',
      label: 'Integrated graphics limited',
      detail: 'The CPU is doing graphics work. A dedicated GPU is the single biggest performance upgrade.',
      counts: { cpuLimited, gpuLimited, balanced },
    };
  }
  if (cpuLimited > gpuLimited * 1.25) {
    return {
      limiter: 'CPU',
      label: 'CPU-limited',
      detail: `${cpuLimited} of ${performance.games.length} tested titles are held back by the processor at these settings. A faster CPU or lower CPU-heavy settings will help most.`,
      counts: { cpuLimited, gpuLimited, balanced },
    };
  }
  if (gpuLimited > cpuLimited * 1.25) {
    return {
      limiter: 'GPU',
      label: 'GPU-limited',
      detail: `${gpuLimited} of ${performance.games.length} tested titles are held back by the graphics card. A GPU upgrade has the largest impact at this resolution.`,
      counts: { cpuLimited, gpuLimited, balanced },
    };
  }
  return {
    limiter: 'Balanced',
    label: 'Balanced load',
    detail: 'The CPU and GPU are reasonably matched across the tested games. No single component is severely bottlenecking the other.',
    counts: { cpuLimited, gpuLimited, balanced },
  };
}

function valueRating(costPerFrame) {
  if (!Number.isFinite(costPerFrame) || costPerFrame <= 0) return null;
  if (costPerFrame <= 260) return { label: 'Excellent value', tone: 'excellent' };
  if (costPerFrame <= 460) return { label: 'Good value', tone: 'good' };
  if (costPerFrame <= 760) return { label: 'Fair value', tone: 'fair' };
  return { label: 'Premium cost per frame', tone: 'low' };
}

function upgradeCandidate(item, nextPerformance, currentPerformance, extra = {}) {
  const currentAverage = currentPerformance?.average || 0;
  const nextAverage = nextPerformance?.average || 0;
  return {
    item,
    estimatedAverage: nextAverage,
    deltaFps: Math.max(0, nextAverage - currentAverage),
    price: Number(item.price) || 0,
    ...extra,
  };
}

function cpuUpgrades({ build, cpu, gpu, cooler, motherboard, performance, resolution, quality }) {
  if (!cpu || !motherboard || !performance?.ready) return [];
  const socket = motherboard.specs.socket;
  const chipset = motherboard.specs.chipset;
  const candidates = itemsByCategory('cpu')
    .filter((item) => item.id !== cpu.id)
    .filter((item) => item.specs.socket === socket)
    .filter((item) => Array.isArray(item.specs.chipsets) && item.specs.chipsets.includes(chipset))
    .filter((item) => !cooler || !Array.isArray(cooler.specs.sockets) || cooler.specs.sockets.includes(socket))
    .filter((item) => Number(item.score) > Number(cpu.score));

  return candidates
    .map((item) => {
      const next = estimatePerformance({ cpu: item, gpu, resolution, quality });
      return upgradeCandidate(item, next, performance, {
        reason: `Same ${socket} socket and ${chipset} chipset support; no motherboard swap required.`,
      });
    })
    .filter((entry) => entry.deltaFps >= 2)
    .sort((a, b) => (b.deltaFps / Math.max(b.price, 1)) - (a.deltaFps / Math.max(a.price, 1)))
    .slice(0, 3);
}

function gpuUpgrades({ build, cpu, gpu, psu, pcCase, performance, resolution, quality }) {
  if (!cpu || !performance?.ready) return [];
  const currentTdp = Number(gpu?.specs.tdp) || 0;
  const baseLoad = Math.max(0, buildPowerDraw(build) - currentTdp);
  const psuWattage = Number(psu?.specs.wattage);
  const maxLength = Number(pcCase?.specs.maxGpuLength);
  const currentScore = Number(gpu?.score) || 0;

  return itemsByCategory('gpu')
    .filter((item) => item.id !== gpu?.id)
    .filter((item) => Number(item.score) > currentScore)
    .filter((item) => !Number.isFinite(maxLength) || Number(item.specs.length) <= maxLength)
    .filter((item) => !Number.isFinite(psuWattage) || baseLoad + Number(item.specs.tdp) <= psuWattage * 0.92)
    .map((item) => {
      const next = estimatePerformance({ cpu, gpu: item, resolution, quality });
      return upgradeCandidate(item, next, performance, {
        reason: `Fits the selected case${Number.isFinite(maxLength) ? ` (≤ ${maxLength} mm)` : ''} and stays within the PSU's estimated capacity.`,
      });
    })
    .filter((entry) => entry.deltaFps >= 2)
    .sort((a, b) => (b.deltaFps / Math.max(b.price, 1)) - (a.deltaFps / Math.max(a.price, 1)))
    .slice(0, 3);
}

function ramUpgrades({ build, cpu, motherboard, performance }) {
  if (!motherboard) return [];
  const kits = getItems(build, 'ram');
  const totalCapacity = kits.reduce((sum, kit) => sum + (Number(kit.specs.capacity) || 0), 0);
  const modules = kits.reduce((sum, kit) => sum + (Number(kit.specs.modules) || 0), 0);
  if (totalCapacity >= 32 && modules >= 2) return [];
  const type = motherboard.specs.memoryTypes?.[0];
  const slots = Number(motherboard.specs.memorySlots) || 4;
  return itemsByCategory('ram')
    .filter((item) => !type || item.specs.type === type)
    .filter((item) => (Number(item.specs.modules) || 1) <= slots)
    .filter((item) => Number(item.specs.capacity) >= 32)
    .sort((a, b) => Number(a.price) - Number(b.price))
    .slice(0, 2)
    .map((item) => upgradeCandidate(item, performance, performance, {
      reason: `${item.specs.capacity} GB ${item.specs.type} kit improves multitasking and 1% low frame times${modules < 2 ? '; it also restores dual-channel operation' : ''}.`,
    }));
}

function storageUpgrades({ build }) {
  const drives = getItems(build, 'storage');
  const capacity = drives.reduce((sum, drive) => sum + (Number(drive.specs.capacityGB) || 0), 0);
  if (capacity >= 1000) return [];
  return itemsByCategory('storage')
    .filter((item) => item.specs.interface === 'NVMe' && Number(item.specs.capacityGB) >= 1000)
    .sort((a, b) => Number(a.price) - Number(b.price))
    .slice(0, 1)
    .map((item) => upgradeCandidate(item, null, null, {
      reason: 'At least 1 TB of NVMe storage is a practical minimum for modern games and projects.',
    }));
}

export function analyzeBuild(build, options = {}) {
  const resolution = resolutionValue(options.resolution);
  const quality = options.quality || 'ultra';
  const cpu = getItems(build, 'cpu')[0] || null;
  const gpu = getItems(build, 'gpu')[0] || null;
  const motherboard = getItems(build, 'motherboard')[0] || null;
  const cooler = getItems(build, 'cooler')[0] || null;
  const psu = getItems(build, 'psu')[0] || null;
  const pcCase = getItems(build, 'case')[0] || null;
  const total = buildTotal(build);
  const power = buildPowerDraw(build);
  const recommended = recommendedPsu(build);
  const psuWattage = Number(psu?.specs.wattage);
  const psuUtilization = Number.isFinite(psuWattage) && psuWattage > 0 ? Math.round((power / psuWattage) * 100) : null;
  const headroom = Number.isFinite(psuWattage) ? psuWattage - power : null;
  const performance = estimatePerformance({ cpu, gpu, resolution, quality });
  const bottleneck = summarizeBottleneck(performance);
  const average = performance.ready ? performance.average : null;
  const costPerFrame = average ? total / average : null;
  const compatibility = evaluateBuild(build);

  const cpuOptions = cpuUpgrades({ build, cpu, gpu, cooler, motherboard, performance, resolution, quality });
  const gpuOptions = gpuUpgrades({ build, cpu, gpu, psu, pcCase, performance, resolution, quality });
  const ramOptions = ramUpgrades({ build, cpu, motherboard, performance });
  const storageOptions = storageUpgrades({ build });

  return {
    ready: performance.ready,
    performance,
    compatibility,
    total,
    power,
    recommendedPsu: recommended,
    psuWattage: Number.isFinite(psuWattage) ? psuWattage : null,
    psuUtilization,
    headroom,
    bottleneck,
    averageFps: average,
    costPerFrame,
    value: valueRating(costPerFrame),
    upgrades: {
      cpu: cpuOptions,
      gpu: gpuOptions,
      ram: ramOptions,
      storage: storageOptions,
      all: [...cpuOptions, ...gpuOptions, ...ramOptions, ...storageOptions].sort((a, b) => b.deltaFps / Math.max(b.price, 1) - a.deltaFps / Math.max(a.price, 1)),
    },
  };
}
