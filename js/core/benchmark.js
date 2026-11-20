// Benchmark simulation.
//
// This is a planning model, not a measurement. Nothing here runs a real
// workload: every figure comes from the parts you picked and the same thermal
// simulation the Performance page uses. The page says so on every card, and the
// notes at the bottom repeat it.
//
// 1. HOW "ABILITY" IS EXPRESSED
//    Each CPU and GPU carries a performance score (0-100 scale) from the part
//    catalogue. To keep benchmark numbers readable those scores are scaled into
//    index points:
//    cpuIndex = cpu score * 60        (a 4-core office chip lands near 2,000)
//    gpuIndex = gpu score * 75        (an entry card lands near 1,000)
//    These are relative, so a chip twice as fast gets roughly twice the index.
//
// 2. WORKLOAD DEMAND
//    Every profile asks for a fixed number of index points from the CPU and the
//    GPU. Utilisation is demand against ability:
//    utilisation = min(100, demand / ability * 100)
//    So the same job leaves a strong part cool and a weak one pinned near 100%.
//    The part closest to 100% is the limiter for that workload.
//
// 3. SCORE
//    A profile's score is a weighted mixture of the two index figures:
//    score = cpuIndex * wCpu + gpuIndex * wGpu
//    multiplied by the share of clock speed the thermal simulation says is
//    lost. A build that throttles scores lower in the profile that heats it.
//    Stress testing scores differently on purpose: it rewards sustain (cooling
//    and power headroom), not raw speed, so a fast chip with a small cooler
//    loses points there.
//
// 4. MEMORY
//    Each profile states the memory it needs (demand) plus 3 GB for the
//    operating system. Used memory is the lower of that and the installed
//    capacity, so an 8 GB machine running a 20 GB job shows 100% used and a
//    pressure warning. Capacity pressure above 85% costs up to 15% of the score.
//
// 5. TEMPERATURES AND POWER
//    Taken straight from simulateThermals() at full load, then nudged per
//    profile: sustained renders and stress runs add heat because they hold the
//    load far longer than a game frame does. Power is the simulated load watts
//    scaled by each profile's own duty cycle.
//
// 6. FRAME RATE
//    Only the two gaming profiles report FPS, and they use the existing
//    estimatePerformance() model at that profile's own resolution and quality:
//    esports at 1080p high, triple-A at 1440p ultra. The 1% low figure is the
//    average minus that model's spread, so it moves the way a real low would.

import { getItems, buildTotal } from './build.js';
import { simulateThermals } from './thermal.js';
import { estimatePerformance } from './perf.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const round = (value) => Math.round(value);
const round1 = (value) => Math.round(value * 10) / 10;
const num = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const CPU_INDEX_SCALE = 60;
const GPU_INDEX_SCALE = 75;
const OS_MEMORY_GB = 3;

export const PROFILES = [
  {
    id: 'esports',
    label: 'Esports',
    icon: 'gamepad',
    blurb: 'Competitive shooters at 1080p, frames first',
    work: '600 frames of a competitive shooter caption loop',
    cpuDemand: 1500,
    gpuDemand: 1400,
    wCpu: 0.45,
    wGpu: 0.55,
    ramDemandGb: 8,
    powerFactor: 0.5,
    extraHeatC: 0,
    gaming: { resolution: '1080p', quality: 'high' },
  },
  {
    id: 'aaa',
    label: 'AAA gaming',
    icon: 'cube',
    blurb: 'Modern open-world titles at 1440p ultra',
    work: 'a 1440p ultra scene pass with heavy shadows',
    cpuDemand: 2600,
    gpuDemand: 4200,
    wCpu: 0.3,
    wGpu: 0.7,
    ramDemandGb: 12,
    powerFactor: 0.85,
    extraHeatC: 1,
    gaming: { resolution: '1440p', quality: 'ultra' },
  },
  {
    id: 'productivity',
    label: 'Productivity',
    icon: 'monitor',
    blurb: 'Office work, browsing, light editing',
    work: 'a mixed office trace: documents, video calls, browser tabs',
    cpuDemand: 3200,
    gpuDemand: 1800,
    wCpu: 0.65,
    wGpu: 0.35,
    ramDemandGb: 10,
    powerFactor: 0.75,
    extraHeatC: 2,
    gaming: null,
  },
  {
    id: 'rendering',
    label: 'Rendering',
    icon: 'sparkles',
    blurb: '3D renders and video exports',
    work: 'a sustained multi-frame render and an H.265 export',
    cpuDemand: 5200,
    gpuDemand: 5000,
    wCpu: 0.5,
    wGpu: 0.5,
    ramDemandGb: 20,
    powerFactor: 1,
    extraHeatC: 4,
    gaming: null,
  },
  {
    id: 'stress',
    label: 'Stress test',
    icon: 'bolt',
    blurb: 'Both chips pinned at 100% for 30 minutes',
    work: 'a synthetic all-core burn plus a GPU burn loop',
    cpuDemand: 6000,
    gpuDemand: 6000,
    wCpu: 0.5,
    wGpu: 0.5,
    ramDemandGb: 16,
    powerFactor: 1.05,
    extraHeatC: 7,
    gaming: null,
    stress: true,
  },
];

export const PROFILE_BY_ID = Object.fromEntries(PROFILES.map((profile) => [profile.id, profile]));

function throttleLoss(temp, limit) {
  if (temp === null || temp === undefined) return 0;
  return clamp((temp - limit) * 3, 0, 25);
}

function runProfile(profile, ctx) {
  const { cpu, gpu, cpuIndex, gpuIndex, installedRam, baseThermal, psuWatts } = ctx;

  // Ability after the clock loss the thermal model predicts for this profile.
  const cpuTemp = baseThermal.thermals.cpuTemp === null
    ? null
    : round1(Math.min(baseThermal.thermals.cpuTemp + profile.extraHeatC, 105));
  const gpuTemp = baseThermal.thermals.gpuTemp === null
    ? null
    : round1(Math.min(baseThermal.thermals.gpuTemp + profile.extraHeatC, 92));

  const cpuLoss = throttleLoss(cpuTemp, baseThermal.thermals.cpuLimit);
  const gpuLoss = gpu ? throttleLoss(gpuTemp, baseThermal.thermals.gpuLimit) : 0;

  const cpuUtil = clamp(round((profile.cpuDemand / Math.max(cpuIndex, 1)) * 100), 3, 100);
  const gpuUtil = gpu ? clamp(round((profile.gpuDemand / Math.max(gpuIndex, 1)) * 100), 3, 100) : 0;

  // Memory: what the job wants, plus the OS, against what is installed.
  const ramNeeded = profile.ramDemandGb + OS_MEMORY_GB;
  const ramUsed = Math.min(ramNeeded, installedRam);
  const ramPercent = installedRam > 0 ? clamp(round((ramUsed / installedRam) * 100), 0, 100) : 0;
  const ramPressure = ramPercent > 85;
  const ramPenalty = ramPercentagePenalty(ramPercent);

  const watts = round(baseThermal.power.loadWatts * profile.powerFactor);
  const loadPct = psuWatts ? round((watts / psuWatts) * 100) : null;
  const overPsu = loadPct !== null && loadPct > 100;

  const weighting = cpuIndex * profile.wCpu + gpuIndex * profile.wGpu;
  const clockShare = 1 - Math.max(cpuLoss, gpuLoss) / 100;
  let score = weighting * clockShare * (1 - ramPenalty);
  if (overPsu) score *= 0.85;
  if (!gpu) score *= 0.6;
  score = round(score);

  // The limiter is the part running closest to full, which is the part that
  // would have to be upgraded before the workload gets faster.
  let limiter = { kind: 'Balanced', detail: 'Neither chip is close to full, so both have room.' };
  if (overPsu) {
    limiter = { kind: 'Power supply', detail: `This profile pulls ${watts} W from a ${psuWatts} W supply, so the system would shut down or throttle.` };
  } else if (!gpu && profile.gaming) {
    limiter = { kind: 'Graphics card', detail: 'No dedicated card: the integrated graphics carry the whole workload.' };
  } else if (cpuLoss >= 5 || gpuLoss >= 5) {
    limiter = {
      kind: 'Cooling',
      detail: `${cpuLoss >= 5 ? `The CPU loses ${round(cpuLoss)}%` : ''}${cpuLoss >= 5 && gpuLoss >= 5 ? ' and ' : ''}${gpuLoss >= 5 ? `the card loses ${round(gpuLoss)}%` : ''} of clock speed under this sustained load.`,
    };
  } else if (cpuUtil >= 90 && gpuUtil >= 90) {
    limiter = { kind: 'Both chips', detail: `The processor and the card both run at ${cpuUtil}% here, so this workload is limited by the pair — a faster part on its own would barely help.` };
  } else if (cpuUtil >= 90 && cpuUtil >= gpuUtil) {
    limiter = { kind: 'CPU', detail: `The processor runs at ${cpuUtil}% while the card sits at ${gpuUtil}%, so a faster CPU would add frames here.` };
  } else if (gpuUtil >= 90 && gpuUtil > cpuUtil) {
    limiter = { kind: 'GPU', detail: `The card is pinned at ${gpuUtil}% while the processor sits at ${cpuUtil}%, so a faster card is the next upgrade.` };
  } else if (cpuUtil >= 80) {
    limiter = { kind: 'CPU', detail: 'The processor carries most of this workload.' };
  } else if (gpuUtil >= 80) {
    limiter = { kind: 'GPU', detail: 'The card carries most of this workload.' };
  }

  let fps = null;
  if (profile.gaming && cpu && gpuIndex > 0) {
    const estimate = estimatePerformance({
      cpu,
      gpu,
      resolution: profile.gaming.resolution,
      quality: profile.gaming.quality,
    });
    if (estimate.ready) {
      const average = estimate.average;
      const spread = average < 50 ? 0.15 : 0.09;
      fps = {
        average,
        onePercent: Math.max(1, round(average * (1 - spread))),
        resolution: estimate.resolution.label,
        quality: estimate.quality.label,
        titles: estimate.hitRate,
        total: estimate.games.length,
      };
    }
  }

  return {
    id: profile.id,
    label: profile.label,
    icon: profile.icon,
    blurb: profile.blurb,
    work: profile.work,
    score,
    cpuIndex,
    gpuIndex,
    utilization: { cpu: cpuUtil, gpu: gpuUtil },
    ram: { needed: ramNeeded, used: ramUsed, installed: installedRam, percent: ramPercent, pressure: ramPressure },
    temps: { cpu: cpuTemp, gpu: gpuTemp, cpuLimit: baseThermal.thermals.cpuLimit, gpuLimit: baseThermal.thermals.gpuLimit, lost: { cpu: round(cpuLoss), gpu: round(gpuLoss) } },
    power: { watts, psuWatts: psuWatts || null, loadPct, overPsu },
    fps,
    limiter,
    throttled: cpuLoss >= 1 || gpuLoss >= 1,
  };
}

function ramPercentagePenalty(percent) {
  if (percent <= 85) return 0;
  return clamp((percent - 85) / 15 * 0.15, 0, 0.15);
}

export function runBenchmarks(build) {
  const cpu = getItems(build, 'cpu')[0] || null;
  const gpu = getItems(build, 'gpu')[0] || null;
  const ram = getItems(build, 'ram');
  const storage = getItems(build, 'storage');

  const base = {
    ready: false,
    reason: '',
    cpu: null,
    gpu: null,
    cpuIndex: null,
    gpuIndex: null,
    memoryGb: 0,
    storageGb: 0,
    profiles: [],
    best: null,
    weakest: null,
    thermal: null,
    buildTotal: buildTotal(build),
  };

  if (!cpu) {
    return { ...base, reason: 'Add a CPU to your build first — the benchmark needs a processor to measure against.' };
  }

  const cpuScore = num(cpu.score);
  if (cpuScore <= 0) {
    return { ...base, reason: 'This CPU does not have a performance score yet.' };
  }

  const baseThermal = simulateThermals(build);
  if (!baseThermal.ready) {
    return { ...base, reason: `Add ${baseThermal.missing.join(', ')} before running a benchmark: the thermal model needs a complete machine.` };
  }

  const installedRam = ram.reduce((sum, item) => sum + num(item.specs?.capacity), 0);
  const storageGb = storage.reduce((sum, item) => {
    // The catalogue keeps drive size as a number in GB (capacityGB).
    const gigabytes = num(item.specs?.capacityGB);
    return sum + gigabytes;
  }, 0);

  const cpuIndex = round(cpuScore * CPU_INDEX_SCALE);
  const gpuIndex = gpu ? round(num(gpu.score) * GPU_INDEX_SCALE) : 0;

  const ctx = {
    cpu,
    gpu,
    cpuIndex,
    gpuIndex,
    installedRam,
    baseThermal,
    psuWatts: baseThermal.power.psuWatts,
  };

  const profiles = PROFILES.map((profile) => runProfile(profile, ctx));
  const scored = profiles.slice().sort((a, b) => b.score - a.score);
  const weakest = profiles
    .slice()
    .sort((a, b) => (a.throttled === b.throttled ? a.score - b.score : a.throttled ? -1 : 1))[0];

  return {
    ...base,
    ready: true,
    cpu,
    gpu,
    cpuIndex,
    gpuIndex,
    memoryGb: installedRam,
    storageGb,
    profiles,
    best: scored[0] || null,
    weakest: weakest || null,
    thermal: baseThermal,
  };
}

export const BENCHMARK_NOTES = [
  ['Not a measurement', 'Nothing here runs the parts. Every number is calculated from the catalogue scores you picked and the same thermal model as the Performance page, so treat it as a plan, not a result.'],
  ['Index points', 'CPU score × 60 and GPU score × 75 put both on one readable scale. Double the score means roughly double the index.'],
  ['Utilisation', 'Each profile asks for a fixed amount of work. Utilisation = demand ÷ ability, capped at 100%, so weaker parts run pinned and stronger parts idle lower.'],
  ['Score', 'Weighted mix of the CPU and GPU index (heavier on the GPU for gaming, on the CPU for office work) × the share of clock speed the thermal model says survives × memory pressure penalty.'],
  ['Temperatures', 'Full-load temperatures from the thermal simulation plus this profile\'s extra heat (a burn loop holds far longer than a game frame). Throttling starts at 95 °C for the CPU and 83 °C for the card.'],
  ['Power', 'Simulated full-load watts × this profile\'s duty cycle. Over 100% of the supply wattage the score is cut and the run is marked as a failure risk.'],
  ['Frame rates', 'Only for the two gaming profiles, from the existing FPS model at that profile\'s resolution and quality. The 1% low is the average minus that model\'s own spread.'],
  ['Memory', 'Job demand plus 3 GB for the system, against installed capacity. Above 85% used the score loses up to 15%, which is what a machine that starts swapping feels like.'],
];
