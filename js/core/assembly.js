import { getHardware } from '../data/hardware.js';
import { getItems, getIds } from './build.js';
import { PRESETS_BY_ID } from '../data/presets.js';
import { evaluateBuild } from './compat.js';

/**
 * Guided physical assembly.
 *
 * The workshop used to let anyone drop any part anywhere. This module holds the
 * order a real build actually follows, and for each step: what counts as done,
 * what the bench is waiting for, and — when a part cannot go in — the sentence
 * that says why. Nothing here touches the store; it reads the current build and
 * reports.
 */

const isLiquid = (cooler) => String(cooler?.specs?.type || '').toLowerCase().includes('liquid');

/** The chip can drive a monitor on its own, so no card is needed. */
const hasIntegratedGraphics = (build) => {
  const cpu = getItems(build, 'cpu')[0];
  if (!cpu) return false;
  return Number(cpu.specs?.igpuScore) > 0 || Boolean(cpu.specs?.iGPU);
};

/** The case arrived with fans of its own. */
const caseHasFans = (build) => {
  const pcCase = getItems(build, 'case')[0];
  return Number(pcCase?.specs?.includedFans) > 0;
};

const num = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/* --- step definitions ----------------------------------------------------- */

export const ASSEMBLY_STEPS = [
  {
    id: 'case',
    title: 'Prepare the case',
    category: 'case',
    ask: 'A case has to be on the bench before anything can go into it.',
    why: 'Every later step is measured against the case: what board fits, how long the card may be, how tall the cooler can be.',
    done: (build) => getItems(build, 'case').length > 0,
    detail: (build) => {
      const pcCase = getItems(build, 'case')[0];
      if (!pcCase) return [];
      return [
        ['Form factor', pcCase.specs?.formFactor || '—'],
        ['Max card', pcCase.specs?.maxGpuLength ? `${pcCase.specs.maxGpuLength} mm` : '—'],
        ['Max cooler', pcCase.specs?.maxCoolerHeight ? `${pcCase.specs.maxCoolerHeight} mm` : '—'],
      ];
    },
  },
  {
    id: 'standoffs',
    title: 'Install motherboard standoffs',
    category: 'motherboard',
    ask: 'Mount the standoffs in the pattern that matches your board, then screw the board down onto them.',
    why: 'A board screwed straight to the tray shorts out on the metal. Standoffs hold it off the steel and set its height.',
    done: (build) => getItems(build, 'motherboard').length > 0,
    detail: (build) => {
      const board = getItems(build, 'motherboard')[0];
      if (!board) return [];
      const holes = { ATX: 9, MicroATX: 9, 'Mini-ITX': 4, EATX: 9 }[board.specs?.formFactor] ?? 9;
      return [
        ['Board form', board.specs?.formFactor || '—'],
        ['Standoffs needed', String(holes)],
        ['Socket', board.specs?.socket || '—'],
      ];
    },
  },
  {
    id: 'cpu',
    title: 'Install the CPU',
    category: 'cpu',
    ask: 'Lift the socket lever, line the triangle on the chip up with the one on the socket, then close the latch.',
    why: 'The pins only fit one way. Forcing it the other way bends them, and the board is then scrap.',
    done: (build) => getItems(build, 'cpu').length > 0,
    detail: (build) => {
      const cpu = getItems(build, 'cpu')[0];
      if (!cpu) return [];
      return [
        ['Socket', cpu.specs?.socket || '—'],
        ['Cores / threads', `${cpu.specs?.cores ?? '—'} / ${cpu.specs?.threads ?? '—'}`],
        ['Draw', cpu.specs?.tdp ? `${cpu.specs.tdp} W` : '—'],
      ];
    },
  },
  {
    id: 'ram',
    title: 'Install the RAM',
    category: 'ram',
    ask: 'Open the latches, seat the stick until both click, and fill slots 2 and 4 first on a four-slot board.',
    why: 'Dual channel only pays off when the sticks sit in the right pair of slots. One stick in the wrong slot halves the bandwidth.',
    done: (build) => getItems(build, 'ram').length > 0,
    detail: (build) => {
      const sticks = getItems(build, 'ram');
      if (!sticks.length) return [];
      return [
        ['Type', sticks[0].specs?.type || '—'],
        ['Sticks', String(sticks.length)],
        ['Speed', sticks[0].specs?.speed ? `${sticks[0].specs.speed} MHz` : '—'],
      ];
    },
  },
  {
    id: 'paste',
    title: 'Apply thermal paste',
    category: 'cooler',
    ask: 'A pea-sized dot in the middle of the heatspreader. The cooler spreads it when you press down.',
    why: 'Paste fills the microscopic gaps between the chip and the cooler base. Too little leaves hot spots, too much spills over the socket.',
    done: (build) => getItems(build, 'cpu').length > 0 && getItems(build, 'cooler').length > 0,
    detail: (build) => {
      const cooler = getItems(build, 'cooler')[0];
      if (!cooler) return [];
      return [
        ['Cooler', isLiquid(cooler) ? 'Liquid, pump plate' : 'Air, cold plate'],
        ['Paste', isLiquid(cooler) ? 'Already applied on the pump' : 'Dot, about 4 mm'],
        ['Tighten', 'Diagonally, a little at a time'],
      ];
    },
  },
  {
    id: 'cooler',
    title: 'Install the CPU cooler',
    category: 'cooler',
    ask: 'Fit the mounting bracket, then press the cooler down evenly until it is snug.',
    why: 'A cooler that does not clear the case side panel cannot be closed inside it, and a loose cooler lets the chip throttle.',
    done: (build) => getItems(build, 'cooler').length > 0,
    detail: (build) => {
      const cooler = getItems(build, 'cooler')[0];
      const pcCase = getItems(build, 'case')[0];
      if (!cooler) return [];
      const height = num(cooler.specs?.height);
      const limit = num(pcCase?.specs?.maxCoolerHeight);
      return [
        ['Socket support', cooler.specs?.socket || '—'],
        ['Height', height ? `${height} mm` : '—'],
        ['Case limit', limit ? `${limit} mm` : '—'],
      ];
    },
  },
  {
    id: 'mount',
    title: 'Mount the motherboard',
    category: 'motherboard',
    ask: 'Slide the board onto the standoffs and fit the I/O shield, then screw it down.',
    why: 'The board has to line up with the rear openings. Off by one standoff and the ports do not come through the back panel.',
    done: (build) => getItems(build, 'motherboard').length > 0,
    detail: (build) => {
      const board = getItems(build, 'motherboard')[0];
      const pcCase = getItems(build, 'case')[0];
      if (!board) return [];
      return [
        ['Board form', board.specs?.formFactor || '—'],
        ['Case support', pcCase?.specs?.formFactor || '—'],
        ['Screws', 'Fit all of them, hand tight'],
      ];
    },
  },
  {
    id: 'storage',
    title: 'Install the drives',
    category: 'storage',
    ask: 'M.2 goes on at an angle, then down flat. A SATA drive needs its tray and two cables.',
    why: 'An M.2 drive takes a slot straight off the board. A SATA drive needs a data cable to the board and power from the supply.',
    done: (build) => getItems(build, 'storage').length > 0,
    detail: (build) => {
      const drives = getItems(build, 'storage');
      if (!drives.length) return [];
      return [
        ['Drives', String(drives.length)],
        ['Type', drives[0].specs?.type || '—'],
        ['Capacity', drives[0].specs?.capacity ? `${drives[0].specs.capacity} GB` : '—'],
      ];
    },
  },
  {
    id: 'gpu',
    title: 'Install the graphics card',
    category: 'gpu',
    ask: 'Release the slot latch, press the card in until it clicks, then screw the bracket to the case.',
    why: 'The card only fits one way round, and a long card can run into the front fans or the drive cage.',
    // A chip with graphics of its own needs no card for the machine to work,
    // so the step is done either way. A dedicated card is still better where
    // frames matter, which the why above says.
    done: (build) => getItems(build, 'gpu').length > 0 || hasIntegratedGraphics(build),
    detail: (build) => {
      const gpu = getItems(build, 'gpu')[0];
      const pcCase = getItems(build, 'case')[0];
      if (!gpu && hasIntegratedGraphics(build)) {
        return [
          ['Graphics', 'Onboard, no card needed'],
          ['Output', 'Board video ports'],
          ['Upgrade', 'Add a card for gaming'],
        ];
      }
      if (!gpu) return [];
      const length = num(gpu.specs?.length);
      const limit = num(pcCase?.specs?.maxGpuLength);
      return [
        ['Length', length ? `${length} mm` : '—'],
        ['Case limit', limit ? `${limit} mm` : '—'],
        ['Power', gpu.specs?.wattage ? `${gpu.specs.wattage} W` : '—'],
      ];
    },
  },
  {
    id: 'psu',
    title: 'Install the power supply',
    category: 'psu',
    ask: 'Fan side down in the bottom bay, then four screws at the back.',
    why: 'The supply has to cover the whole build at peak with headroom. A tight supply shuts the machine down under load.',
    done: (build) => getItems(build, 'psu').length > 0,
    detail: (build) => {
      const psu = getItems(build, 'psu')[0];
      if (!psu) return [];
      return [
        ['Wattage', psu.specs?.wattage ? `${psu.specs.wattage} W` : '—'],
        ['Rating', psu.specs?.efficiency || '—'],
        ['Modular', psu.specs?.modular || '—'],
      ];
    },
  },
  {
    id: 'power',
    title: 'Connect the power cables',
    category: 'psu',
    ask: '24-pin to the board, 8-pin EPS to the top of the board, PCIe to the card, SATA to the drives.',
    why: 'The board needs the 24-pin and the EPS. A card with no PCIe cable will not post, even though it sits in the slot.',
    done: (build) => getItems(build, 'psu').length > 0 && getItems(build, 'motherboard').length > 0,
    detail: () => [
      ['Board', '24-pin + 8-pin EPS'],
      ['Card', 'PCIe or 12VHPWR'],
      ['Drives', 'SATA power'],
    ],
  },
  {
    id: 'front',
    title: 'Connect the front panel',
    category: 'case',
    ask: 'Power switch, reset, power LED, HDD LED and the front audio and USB headers.',
    why: 'No power switch means the machine never starts, even when everything else is right. The pins are tiny and easy to miss.',
    done: (build) => getItems(build, 'case').length > 0 && getItems(build, 'motherboard').length > 0,
    detail: () => [
      ['Power switch', 'PWR_SW pins'],
      ['LEDs', 'PLED + / -'],
      ['Front panel', 'USB + HD audio'],
    ],
  },
  {
    id: 'fans',
    title: 'Connect the case fans',
    category: 'fans',
    ask: 'Front fans push air in, rear fan pulls it out. Plug each one into a board header.',
    why: 'Fans blowing against each other trap hot air inside. Intake front, exhaust rear, is what keeps the card cool.',
    // A case that ships with fans already has airflow, so buying more is an
    // upgrade rather than a step you must complete.
    done: (build) => getItems(build, 'fans').length > 0 || caseHasFans(build),
    detail: (build) => {
      const fans = getItems(build, 'fans');
      const pcCase = getItems(build, 'case')[0];
      if (!fans.length && caseHasFans(build)) {
        return [
          ['Fans', `${Number(pcCase.specs.includedFans)} with the case`],
          ['Airflow', 'Front in, rear out'],
          ['Upgrade', 'Add fans for lower noise'],
        ];
      }
      if (!fans.length) return [];
      return [
        ['Fans', String(fans.length)],
        ['Airflow', 'Front in, rear out'],
        ['Control', 'PWM header or hub'],
      ];
    },
  },
  {
    id: 'inspect',
    title: 'Final inspection',
    category: null,
    ask: 'Check every connector, then the panel. Nothing should stand in a fan or rest on a cable.',
    why: 'A cable resting in a fan blade is the most common first-boot failure. Walk round the build before you power it.',
    done: (build) => {
      const result = evaluateBuild(build);
      return result.errors.length === 0 && result.missing.length === 0;
    },
    detail: (build) => {
      const result = evaluateBuild(build);
      const rows = [];
      rows.push(['Problems', String(result.errors.length)]);
      rows.push(['Missing', String(result.missing.length)]);
      rows.push(['Power draw', result.estimatedWattage ? `${result.estimatedWattage} W` : '—']);
      return rows;
    },
  },
];

/* --- reading the current step --------------------------------------------- */

/**
 * Where the build stands. Returns the first step that is not done, plus the
 * state of every step, so the rail can paint all fourteen at once.
 */
export function assemblyState(build) {
  const steps = ASSEMBLY_STEPS.map((step, index) => {
    const missing = [];
    if (step.category && !getItems(build, step.category).length) missing.push(step.category);
    // A step that needs more than one bay: the cooler step also needs a chip.
    if (step.id === 'paste' && !getItems(build, 'cooler').length) missing.push('cooler');
    if (step.id === 'power' && !getItems(build, 'motherboard').length) missing.push('motherboard');
    if (step.id === 'front' && !getItems(build, 'case').length) missing.push('case');
    return {
      ...step,
      index,
      missing,
      done: Boolean(step.done(build)),
    };
  });
  const currentIndex = steps.findIndex((step) => !step.done);
  return {
    steps,
    currentIndex: currentIndex === -1 ? steps.length - 1 : currentIndex,
    complete: currentIndex === -1,
    doneCount: steps.filter((step) => step.done).length,
  };
}

/**
 * Can this part go anywhere right now? Returns { ok, reason, step }.
 * The reason is written for the person at the bench, not for a log file.
 */
export function canInstall(build, itemId) {
  const item = getHardware(itemId);
  if (!item) return { ok: false, reason: 'That part is not in the catalogue.' };

  const state = assemblyState(build);
  const step = state.steps.find((entry) => entry.id !== 'inspect' && !entry.done);

  // Cables and accessories are not fitted to the rig itself: they belong to the
  // build's list, so they are never blocked by where the bench is.
  if (item.category === 'cables') {
    return { ok: true, item, step: null, reason: '' };
  }

  if (!step) return { ok: true, item, step: null, reason: '' };

  // A part that is already fitted can always be swapped.
  if (getIds(build, item.category).length) return { ok: true, item, step, reason: '' };

  if (item.category === step.category) return { ok: true, item, step, reason: '' };

  // Two steps accept a helper part: the paste step needs the cooler, and the
  // power step needs the board it plugs into.
  const helperFor = { paste: 'cooler', power: 'motherboard', front: 'case' }[step.id];
  if (helperFor && item.category === helperFor) return { ok: true, item, step, reason: '' };

  // The cooler step is also where the paste step's own part lands.
  if (['paste', 'cooler'].includes(step.id) && item.category === 'cooler') {
    return { ok: true, item, step, reason: '' };
  }

  return {
    ok: false,
    item,
    step,
    reason: `Next step is "${step.title}". ${step.why}`,
  };
}

/** Brands that make the part, for the "wrong socket" style explanations. */
export function explainMismatch(build, itemId) {
  const item = getHardware(itemId);
  if (!item) return '';
  const state = assemblyState(build);
  const step = state.steps.find((entry) => entry.id !== 'inspect' && !entry.done);
  if (!step) return '';
  return `${step.title} comes first. ${step.ask}`;
}

export function presetItems(presetId) {
  const preset = PRESETS_BY_ID[presetId];
  return preset ? preset.items : null;
}

/** A short preset list, so the bench can offer "load a build and skip ahead". */
export function presetOptions() {
  return PRESETS_BY_ID
    ? Object.values(PRESETS_BY_ID).map((preset) => ({ id: preset.id, name: preset.name }))
    : [];
}
