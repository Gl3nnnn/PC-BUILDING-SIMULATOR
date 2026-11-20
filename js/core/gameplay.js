/**
 * Job grading and hands-on assembly rules.
 *
 * Everything here is a pure function of (job, build). No DOM, no state: the
 * career page, the workbench and the tests can all call the same graders.
 */

import { CATEGORIES, getHardware } from '../data/hardware.js';
import { buildPowerDraw, getItems, recommendedPsu, selectedCount } from './build.js';
import { evaluateBuild } from './compat.js';
import { estimatePerformance } from './perf.js';

const RES_LABEL = { '1080p': '1080p', '1440p': '1440p', '4k': '4K' };
const QUAL_LABEL = { low: 'low', medium: 'medium', high: 'high', ultra: 'ultra' };

/** "Up to 25.6 dBA" -> 25.6 */
export function parseDb(value) {
  const match = String(value ?? '').match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

export function ramCapacity(build) {
  return getItems(build, 'ram').reduce((sum, kit) => sum + (Number(kit.specs.capacity) || 0), 0);
}

export function storageCapacity(build) {
  return getItems(build, 'storage').reduce((sum, drive) => sum + (Number(drive.specs.capacity) || 0), 0);
}

export function hasRgb(build) {
  return [build.items?.ram ? getItems(build, 'ram') : [], getItems(build, 'cooler'), getItems(build, 'fans'), getItems(build, 'case'), getItems(build, 'gpu')]
    .flat()
    .some((item) => item?.specs?.rgb === true);
}

/** Loudest part in the build, in dBA. */
export function noiseLevel(build) {
  const readings = [];
  const cooler = getItems(build, 'cooler')[0];
  if (cooler) {
    const db = parseDb(cooler.specs.noise);
    if (db !== null) readings.push(db);
  }
  getItems(build, 'fans').forEach((kit) => {
    const db = Number(kit.specs.noise);
    if (Number.isFinite(db)) readings.push(db);
  });
  const pcCase = getItems(build, 'case')[0];
  if (pcCase && Number(pcCase.specs.includedFans) > 0) {
    const db = parseDb(pcCase.specs.noise);
    if (db !== null) readings.push(db);
  }
  if (!readings.length) return null;
  return Math.max(...readings);
}

export function fpsFor(build, resolution = '1080p', quality = 'high') {
  const cpu = getItems(build, 'cpu')[0] || null;
  const gpu = getItems(build, 'gpu')[0] || null;
  const result = estimatePerformance({ cpu, gpu, resolution, quality });
  if (!result.ready) return null;
  return result.average;
}

/** Critical faults that stop a PC from POSTing. */
export function bootFaults(build) {
  const faults = [];
  if (selectedCount(build) === 0) {
    faults.push({ id: 'empty', title: 'No parts installed', detail: 'There is nothing inside the case to boot.', severity: 'critical' });
    return faults;
  }
  const compat = evaluateBuild(build);
  compat.errors.forEach((error) => {
    faults.push({ id: `compat-${error.title}`, title: error.title, detail: error.detail, severity: 'critical' });
  });

  const cpu = getItems(build, 'cpu')[0];
  const gpu = getItems(build, 'gpu')[0];
  const psu = getItems(build, 'psu')[0];
  const motherboard = getItems(build, 'motherboard')[0];

  if (!cpu) faults.push({ id: 'no-cpu', title: 'No processor', detail: 'The socket is empty, so the board has nothing to boot with.', severity: 'critical' });
  if (!motherboard) faults.push({ id: 'no-board', title: 'No motherboard', detail: 'Parts have nowhere to sit without a motherboard.', severity: 'critical' });
  if (!psu) faults.push({ id: 'no-psu', title: 'No power supply', detail: 'Nothing supplies electricity to the system.', severity: 'critical' });
  if (!gpu && cpu && Number(cpu.specs.igpuScore) === 0) {
    faults.push({ id: 'no-output', title: 'No display output', detail: 'This CPU has no integrated graphics and no GPU is installed, so the monitor stays black.', severity: 'critical' });
  }
  if (psu && Number(psu.specs.wattage) < recommendedPsu(build)) {
    faults.push({
      id: 'psu-weak',
      title: 'Power supply too small',
      detail: `The system wants about ${recommendedPsu(build)} W under load; this unit delivers ${psu.specs.wattage} W. Expect shutdowns under stress.`,
      severity: 'warning',
    });
  }
  const cooler = getItems(build, 'cooler')[0];
  if (!cooler && cpu && !cpu.specs.includedCooler) {
    faults.push({ id: 'no-cooler', title: 'CPU has no cooler', detail: `${cpu.name} ships without a stock cooler. It will thermal throttle within minutes.`, severity: 'warning' });
  }
  if (cooler && cpu && Number(cooler.specs.tdp) && Number(cooler.specs.tdp) < Number(cpu.specs.peakPower)) {
    faults.push({ id: 'cooler-tight', title: 'Cooler undersized', detail: `${cooler.name} is rated for ${cooler.specs.tdp} W, while ${cpu.name} can boost to ${cpu.specs.peakPower} W.`, severity: 'warning' });
  }
  return faults;
}

/** The customer scorecard: every requirement becomes a weighted check. */
export function evaluateJob(job, build) {
  if (!job) return null;
  const need = job.need || {};
  const checks = [];
  const add = (id, label, weight, ok, detail) => checks.push({ id, label, weight, ok: Boolean(ok), detail });

  const evaluation = evaluateBuild(build);
  const cost = evaluation.total;
  add('budget', 'Fits the customer budget', 2, cost <= (job.budget || 0), cost === 0 ? 'Nothing selected yet.' : `${cost.toLocaleString('en-PH')} of ${Number(job.budget || 0).toLocaleString('en-PH')} pesos used.`);

  const required = CATEGORIES.filter((category) => category.required);
  const missing = required.filter((category) => getItems(build, category.id).length === 0).map((category) => category.label);
  add('complete', 'Every essential part is installed', 2, missing.length === 0, missing.length ? `Missing: ${missing.join(', ')}.` : 'All core parts are in the case.');

  const compatible = evaluation;
  add('compat', 'Parts are compatible', 3, compatible.errors.length === 0, compatible.errors.length ? compatible.errors[0].title : 'No blocking compatibility errors.');

  if (need.gpu) {
    add('gpu', 'Has a dedicated graphics card', 2, getItems(build, 'gpu').length > 0, getItems(build, 'gpu').length ? '' : 'Integrated graphics will not reach the target.');
  }

  if (need.minRam) {
    const ram = ramCapacity(build);
    add('ram', `${need.minRam} GB memory or more`, 1, ram >= need.minRam, `${ram} GB installed.`);
  }

  if (need.storageGb) {
    const total = storageCapacity(build);
    add('storage', `${need.storageGb} GB storage or more`, 1, total >= need.storageGb, `${total} GB installed.`);
  }

  if (need.minVram) {
    const gpu = getItems(build, 'gpu')[0];
    const vram = gpu ? Number(gpu.specs.vram) || 0 : 0;
    add('vram', `${need.minVram} GB VRAM or more`, 1, vram >= need.minVram, gpu ? `${vram} GB on ${gpu.name}.` : 'No GPU installed.');
  }

  if (need.minCores) {
    const cpu = getItems(build, 'cpu')[0];
    const cores = cpu ? Number(cpu.specs.cores) || 0 : 0;
    add('cores', `${need.minCores} cores or more`, 1, cores >= need.minCores, cpu ? `${cores} cores on ${cpu.name}.` : 'No CPU installed.');
  }

  if (need.minFps) {
    const target = need.minFps;
    const fps = fpsFor(build, target.resolution, target.quality);
    add(
      'fps',
      `${target.value} FPS at ${RES_LABEL[target.resolution] || target.resolution} ${QUAL_LABEL[target.quality] || target.quality}`,
      3,
      fps !== null && fps >= target.value,
      fps === null ? 'Performance could not be estimated yet.' : `Estimated ${fps} FPS average.`,
    );
  }

  if (need.rgb) {
    add('rgb', 'Has RGB lighting', 1, hasRgb(build), hasRgb(build) ? 'Some parts light up.' : 'Nothing in this build is RGB.');
  }

  if (need.quiet || need.maxNoise) {
    const noise = noiseLevel(build);
    const limit = need.maxNoise || 26;
    const ok = noise !== null && noise <= limit;
    add('quiet', 'Quiet enough for the room', 2, ok, noise === null ? 'No noise figures on these parts - riskier than it looks.' : `Loudest part is rated ${noise} dBA (limit ${limit} dBA).`);
  }

  if (need.wifi) {
    const board = getItems(build, 'motherboard')[0];
    add('wifi', 'Wi-Fi on the board', 1, Boolean(board?.specs?.wifi), board ? (board.specs.wifi ? 'Board has Wi-Fi.' : 'Board needs a separate Wi-Fi card.') : 'No motherboard installed.');
  }

  if (need.headroom) {
    const psu = getItems(build, 'psu')[0];
    const load = buildPowerDraw(build);
    const wanted = Math.ceil((load * (1 + need.headroom / 100)) / 50) * 50;
    add('headroom', `${need.headroom}% power supply headroom`, 1, Boolean(psu) && Number(psu.specs.wattage) >= wanted, psu ? `Needs a ${wanted} W unit, fitted ${psu.specs.wattage} W.` : 'No power supply installed.');
  }

  // Unknown check id (job data typo) should never happen - keep it visible rather than silent.
  const totalWeight = checks.reduce((sum, check) => sum + check.weight, 0);
  const earned = checks.reduce((sum, check) => sum + (check.ok ? check.weight : 0), 0);
  const score = totalWeight ? Math.round((earned / totalWeight) * 100) : 0;
  const failed = checks.filter((check) => !check.ok);

  return {
    checks,
    failed,
    score,
    stars: starsFor(score, failed),
    pass: failed.length === 0,
    cost,
    warnings: compatible.warnings.length,
  };
}

function unusedRequireStorage() {}

export function starsFor(score, failed = []) {
  if (failed.some((check) => check.id === 'compat')) return 1;
  if (score >= 100) return 5;
  if (score >= 88) return 4;
  if (score >= 72) return 3;
  if (score >= 50) return 2;
  return 1;
}

/** Final money + XP for a finished job, including penalties. */
export function gradeResult({ job, build, mistakes = 0, seconds = 0, isDaily = false }) {
  const evaluation = evaluateJob(job, build);
  const faults = bootFaults(build);
  const critical = faults.filter((fault) => fault.severity === 'critical');
  const stars = critical.length ? 1 : evaluation.stars;
  const timeTarget = job.timeLimit || 300;
  const timePenalty = seconds > timeTarget * 1.5 ? 1 : 0;
  const adjustedStars = Math.max(1, stars - (mistakes > 4 ? 1 : 0) - timePenalty);
  const fee = Number(job.fee) || 0;
  const payout = Math.round((fee * (adjustedStars / 5)) / 50) * 50;
  const xp = Math.round((Number(job.xp) || 40) * (adjustedStars / 5));
  return {
    evaluation,
    faults,
    stars: adjustedStars,
    rawStars: stars,
    payout,
    xp,
    pass: critical.length === 0,
    mistakes,
    seconds,
    isDaily,
    summary: summarize(adjustedStars, critical, evaluation, mistakes),
  };
}

function summarize(stars, critical, evaluation, mistakes) {
  if (critical.length) return `It did not boot: ${critical[0].title.toLowerCase()}.`;
  if (stars >= 5) return 'The customer is thrilled - everything met the brief.';
  if (stars === 4) return 'Great build. One or two details were not exactly what they asked for.';
  if (stars === 3) return 'It works. The customer noticed a few corners were cut.';
  if (mistakes > 3) return 'It boots, but the messy assembly cost you stars.';
  return evaluation.failed.length ? `It runs, but "${evaluation.failed[0].label}" was missed.` : 'It runs, but the customer is not impressed.';
}

/* ------------------------------------------------------------------ */
/* Hands-on assembly                                                   */
/* ------------------------------------------------------------------ */

export const BAYS = [
  { id: 'case', label: 'Case shell', accepts: ['case'], hint: 'The empty case goes on the bench first.' },
  { id: 'motherboard', label: 'Motherboard', accepts: ['motherboard'], hint: 'Motherboard goes in before anything sits on it.' },
  { id: 'cpu', label: 'CPU socket', accepts: ['cpu'], hint: 'The processor goes into the socket.' },
  { id: 'cooler', label: 'Cooler mount', accepts: ['cooler'], hint: 'Thermal paste, then the cooler.' },
  { id: 'ram', label: 'Memory slots', accepts: ['ram'], hint: 'Both sticks, in the right slots.' },
  { id: 'storage', label: 'Drive bays', accepts: ['storage'], hint: 'NVMe sits straight into the board.' },
  { id: 'psu', label: 'PSU bay', accepts: ['psu'], hint: 'Power supply and its cables.' },
  { id: 'gpu', label: 'PCIe slot', accepts: ['gpu'], hint: 'Longest card, seated until it clicks.' },
  { id: 'fans', label: 'Fan mounts', accepts: ['fans'], hint: 'Front intake, rear exhaust.' },
  { id: 'cables', label: 'Cable routing', accepts: [], hint: 'Route the cables behind the board, then press Check.', check: true },
];

/** Which bays this specific build actually needs, in the right order. */
export function baysFor(build) {
  return BAYS.filter((bay) => bay.check || getItems(build, bay.accepts[0]).length > 0);
}

/** Parts still to be installed, as tray entries. */
export function trayFor(build) {
  return CATEGORIES
    .flatMap((category) => getItems(build, category.id).map((item) => ({ category: category.id, item })))
    // Accessories such as cables have no bay to go into, so they stay off the tray.
    .filter((entry) => bayForCategory(entry.category));
}

export function bayForCategory(categoryId) {
  return BAYS.find((bay) => bay.accepts.includes(categoryId)) || null;
}

export function partPrice(id) {
  const item = getHardware(id);
  return item ? Number(item.price) || 0 : 0;
}
