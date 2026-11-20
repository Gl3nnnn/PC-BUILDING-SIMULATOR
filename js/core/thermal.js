// Power and thermal simulation.
//
// Every formula here is a documented approximation of a real machine, not a
// benchmark. The goal is that changing one part moves the numbers in the
// direction a real PC would move, and that a player can read why.
//
// 1. POWER
//    idle     = board 15 W + CPU 6 W + GPU 12 W + 3 W per memory module
//               + 3 W per NVMe drive (8 W per hard disk) + 2.5 W per fan
//               + pump 8 W on a liquid cooler (1 W on air)
//    load     = CPU peak power (TDP when no boost figure) + GPU TDP
//               + 45 W for board, memory, drives, fans and lighting
//    The GPU is counted at its TDP, since a card's board power tracking keeps
//    it there; CPU chips are counted at peak power because a boost window
//    pulls well above TDP for a few seconds.
//
// 2. PSU HEADROOM
//    headroom = (PSU watts - load) / PSU watts
//    Below 25% headroom a supply runs hot and loud on peaks; below 0% it
//    cannot hold the load. Efficiency loss to the wall is not counted, because
//    the load figure is already what the parts draw from the supply.
//
// 3. AIRFLOW
//    Each fan moves its published CFM. A case's own fans are counted at
//    52 CFM (120 mm) or 62 CFM (140 mm) because makers do not publish them.
//    A front panel restricts what can pass through:
//    mesh 1.0, perforated 0.95, wood and mesh 0.9, glass 0.62, solid 0.5.
//    Effective airflow = total CFM * panel factor.
//
// 4. AIR TEMPERATURE RISE
//    Moving air heats up as it absorbs heat: 1.76 °C per watt per CFM is the
//    standard rule of thumb (air's heat capacity at case-flow speeds).
//    airRise = 1.76 * (load watts) / effective CFM
//
// 5. COMPONENT TEMPERATURE
//    Each cooler has a thermal resistance in °C per watt. It is derived from
//    its own rating: a cooler rated for X watts is expected to hold that load
//    42 °C above the air feeding it, so R = 42 / X. A graphics card's cooler
//    is treated the same way at 45 °C per its rated TDP. Those baselines come
//    from review data: a stock 65 W cooler sits in the low 40s above ambient,
//    and a reference card holds its TDP around 45 °C above case air.
//    T = room temperature (22 °C) + airRise + load watts * R
//    A cooler far too small for the chip would predict an impossible
//    temperature, so the reported figure is held at the silicon's own
//    protection point: 105 °C for a CPU, 92 °C for a card.
//    Poor airflow also slows heat leaving the cooler, so a starvation factor
//    (1.0 at 40+ CFM effective, rising to 1.45 at 10 CFM) multiplies R.
//
// 6. FAN SPEED
//    Fan curves are progressive: fans idle near 30% PWM and reach 100% when a
//    component passes 85 °C. Reported as one blended PWM figure.
//
// 7. THROTTLING
//    CPUs cut clocks from 95 °C and GPUs from 83 °C. Below that, a cooler
//    rated well under the CPU's peak power still limits sustained boost:
//    lost = clamp((over-ratio - 1.25) * 25, 0, 18)% plus clamp((T - limit) * 3, 0, 25)%.
//    The 1.25 allowance is there because a stock cooler is meant to hold a
//    stock chip right at its TDP; only pushing past that costs boost.
//
// 8. COOLING EFFICIENCY
//    A 0-100 score comparing the air a case can move with the heat it must
//    carry: 100 means airflow stays well ahead of the load.

import { getItems } from './build.js';

const AMBIENT_C = 22;

const PANEL_FACTOR = {
  Mesh: 1,
  Perforated: 0.95,
  'Wood & mesh': 0.9,
  Glass: 0.62,
  Solid: 0.5,
};

const num = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const round = (value) => Math.round(value);
const round1 = (value) => Math.round(value * 10) / 10;

function cpuLoadWatts(cpu) {
  if (!cpu) return 0;
  const s = cpu.specs || {};
  return num(s.peakPower) || round(num(s.tdp) * 1.15);
}

function gpuLoadWatts(gpu) {
  if (!gpu) return 0;
  return num(gpu.specs?.tdp);
}

function fanCount(caseItem, fanKits) {
  const included = num(caseItem?.specs?.includedFans);
  const kits = fanKits.reduce((sum, item) => sum + num(item.specs?.count), 0);
  return included + kits;
}

function airflowCfm(caseItem, fanKits) {
  const included = num(caseItem?.specs?.includedFans);
  const includedCfm = included * 52;
  const kitCfm = fanKits.reduce(
    (sum, item) => sum + num(item.specs?.count) * num(item.specs?.airflow, 55),
    0,
  );
  return round1(includedCfm + kitCfm);
}

export function simulateThermals(build) {
  const cpu = getItems(build, 'cpu')[0] || null;
  const gpu = getItems(build, 'gpu')[0] || null;
  const cooler = getItems(build, 'cooler')[0] || null;
  const caseItem = getItems(build, 'case')[0] || null;
  const psu = getItems(build, 'psu')[0] || null;
  const fans = getItems(build, 'fans');
  const ram = getItems(build, 'ram');
  const storage = getItems(build, 'storage');

  const missing = [];
  if (!cpu) missing.push('CPU');
  if (!cooler) missing.push('cooler');
  if (!caseItem) missing.push('case');
  if (!psu) missing.push('power supply');

  const ramModules = ram.reduce((sum, item) => sum + num(item.specs?.modules, 1), 0);
  const nvme = storage.filter((item) => String(item.specs?.form || '').startsWith('M.2')).length;
  const sata = storage.length - nvme;
  const fanTotal = fanCount(caseItem, fans);
  const pumpW = cooler && cooler.specs?.type === 'Liquid' ? 8 : 1;

  const idleWatts = round(
    15 + 6 + 12 + ramModules * 3 + nvme * 3 + sata * 8 + fanTotal * 2.5 + pumpW,
  );

  const cpuW = cpuLoadWatts(cpu);
  const gpuW = gpuLoadWatts(gpu);
  const overheadW = 45 + fanTotal * 2.5;
  const loadWatts = round(cpuW + gpuW + overheadW);

  const psuWatts = num(psu?.specs?.wattage);
  const headroomPct = psuWatts ? round(((psuWatts - loadWatts) / psuWatts) * 100) : null;
  const recommendedPsu = Math.ceil((loadWatts * 1.35) / 50) * 50;

  const rawCfm = airflowCfm(caseItem, fans);
  const panelFactor = PANEL_FACTOR[caseItem?.specs?.frontPanel] ?? 0.85;
  const effectiveCfm = round1(rawCfm * panelFactor);

  const airRiseC = effectiveCfm > 0 ? round1((1.76 * loadWatts) / effectiveCfm) : null;

  // A cooler starved of air cannot shed its heat no matter how big it is.
  const starvation = effectiveCfm >= 40 ? 1 : 1 + (40 - effectiveCfm) / 40 * 0.45;

  const coolerRated = num(cooler?.specs?.tdp) || 200;
  const cpuResistance = (42 / coolerRated) * starvation;
  const gpuResistance = (45 / Math.max(num(gpu?.specs?.tdp), 120)) * starvation;

  // A real chip never reaches the raw prediction: it drops clocks until the
  // temperature settles. So the reported figure is capped where the silicon's
  // own protection would hold it, and the throttle loss carries the rest.
  const cpuTempRaw = airRiseC === null ? null : AMBIENT_C + airRiseC + cpuW * cpuResistance;
  const gpuTempRaw = airRiseC === null || !gpu ? null : AMBIENT_C + airRiseC + gpuW * gpuResistance;
  const cpuTemp = cpuTempRaw === null ? null : round1(Math.min(cpuTempRaw, 105));
  const gpuTemp = gpuTempRaw === null ? null : round1(Math.min(gpuTempRaw, 92));
  const cpuTempCapped = cpuTempRaw !== null && cpuTempRaw > 105;
  const gpuTempCapped = gpuTempRaw !== null && gpuTempRaw > 92;

  const cpuThrottleC = 95;
  const gpuThrottleC = 83;

  const overRatio = cpuW > 0 ? cpuW / coolerRated : 0;
  const cpuThermalLoss = cpuTemp === null ? 0 : clamp((cpuTemp - cpuThrottleC) * 3, 0, 25);
  const cpuSustainedLoss = clamp((overRatio - 1.25) * 25, 0, 18);
  const cpuLossPct = round(Math.max(cpuThermalLoss, cpuSustainedLoss));

  const gpuThermalLoss = gpuTemp === null ? 0 : clamp((gpuTemp - gpuThrottleC) * 3.5, 0, 25);
  const gpuLossPct = round(gpuThermalLoss);

  const hotSide = Math.max(cpuTemp || 0, gpuTemp || 0);
  const fanPwm = clamp(round(30 + ((hotSide - 40) / 45) * 70), 25, 100);
  const fanRpmLow = round(fanPwm * 18);
  const fanRpmHigh = round(fanPwm * 22);

  const airflowPerWatt = loadWatts > 0 && effectiveCfm ? effectiveCfm / loadWatts : 0;
  const efficiencyScore = clamp(round(airflowPerWatt * 250), 0, 100);

  const noiseDba = cooler
    ? round1(Math.max(num(String(cooler.specs?.noise || '').replace(/[^0-9.]/g, ''), 24), fanPwm * 0.32))
    : null;

  const bottleneck = [];
  if (headroomPct !== null && headroomPct < 0) bottleneck.push('psu');
  else if (headroomPct !== null && headroomPct < 20) bottleneck.push('psu-tight');
  if (cpuLossPct >= 5) bottleneck.push('cpu-cooling');
  if (gpuLossPct >= 5) bottleneck.push('gpu-cooling');
  if (effectiveCfm < 30) bottleneck.push('airflow');

  const verdict = bottleneck.includes('psu')
    ? { tone: 'error', title: 'Power supply too small', detail: `This build pulls about ${loadWatts} W at full load but the supply delivers ${psuWatts} W.` }
    : bottleneck.includes('cpu-cooling')
      ? { tone: 'warn', title: 'CPU cooling limits boost', detail: `The cooler is rated ${coolerRated} W against a ${cpuW} W CPU, so clocks come down under long loads.` }
      : bottleneck.includes('airflow')
        ? { tone: 'warn', title: 'Case airflow is thin', detail: `${effectiveCfm} CFM effective is low for ${loadWatts} W of heat. Add intake fans or open the front panel.` }
        : bottleneck.includes('gpu-cooling')
          ? { tone: 'warn', title: 'Graphics card runs hot', detail: `At ${gpuTemp} °C the card is at its thermal limit and will cut clocks.` }
          : { tone: 'ok', title: 'Cooling keeps up', detail: 'Temperatures sit below the throttle limits at full load.' };

  return {
    ready: missing.length === 0,
    missing,
    power: {
      idleWatts,
      loadWatts,
      cpuWatts: cpuW,
      gpuWatts: gpuW,
      overheadWatts: round(overheadW),
      psuWatts: psuWatts || null,
      headroomPct,
      recommendedPsu,
      efficiency: psu ? psu.specs?.efficiency || null : null,
    },
    airflow: {
      rawCfm,
      effectiveCfm,
      panelFactor,
      frontPanel: caseItem?.specs?.frontPanel || null,
      fanCount: fanTotal,
      fanSlots: caseItem?.specs?.fanSlots || null,
      perWatt: round1(airflowPerWatt),
      score: efficiencyScore,
    },
    thermals: {
      ambientC: AMBIENT_C,
      airRiseC,
      cpuTemp,
      gpuTemp,
      cpuLimit: cpuThrottleC,
      gpuLimit: gpuThrottleC,
      cpuCapped: cpuTempCapped,
      gpuCapped: gpuTempCapped,
      coolerRated,
      cpuResistance: round1(cpuResistance * 1000) / 1000,
      gpuResistance: round1(gpuResistance * 1000) / 1000,
      fanPwm,
      fanRpmLow,
      fanRpmHigh,
      noiseDba,
    },
    throttle: {
      cpuLossPct,
      gpuLossPct,
      any: cpuLossPct > 0 || gpuLossPct > 0,
    },
    bottleneck,
    verdict,
  };
}

export const FORMULA_NOTES = [
  ['Power at load', 'CPU peak power + GPU TDP + 45 W for board, memory, drives and fans.'],
  ['PSU headroom', '(PSU watts − load watts) / PSU watts. Under 20% runs hot; under 0% will not hold.'],
  ['Effective airflow', 'Fan CFM × front-panel factor: mesh 1.0, perforated 0.95, wood 0.9, glass 0.62, solid 0.5.'],
  ['Air temperature rise', '1.76 °C per watt per CFM — how much the moving air heats up carrying the load.'],
  ['CPU temperature', '22 °C room + air rise + CPU watts × cooler resistance (42 °C per its rated watts).'],
  ['GPU temperature', '22 °C room + air rise + GPU watts × card resistance (45 °C per its rated TDP).'],
  ['Fan speed', 'Fans hold 30% PWM and climb to 100% as the hottest part passes 85 °C.'],
  ['Throttling', 'CPUs cut clocks from 95 °C, cards from 83 °C, at about 3% of performance per degree. A cooler rated well under the chip also costs boost.'],
];
