import { getItems } from './build.js';
import { parseGpuPower } from './compat.js';

/**
 * Cable management.
 *
 * Every cable in a real build is a plug that only fits one socket. This module
 * holds that list: which cables a given build actually needs, which socket each
 * one lands in, and — when someone plugs into the wrong place — the sentence
 * that explains why it will not fit.
 *
 * Connected cables live on the bench (not in the saved build), because they are
 * something you do with your hands rather than a part you buy.
 */

const lower = (value) => String(value || '').toLowerCase();

const number = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/** Does this build contain a part that needs this cable? */
function hasGpu(build) {
  return getItems(build, 'gpu').length > 0;
}

function gpuPowerKind(build) {
  const gpu = getItems(build, 'gpu')[0];
  if (!gpu) return 'gpu-pcie';
  // The same parser the compatibility engine uses, so the cable a build needs
  // and the connector the checker reasons about can never disagree.
  const parsed = parseGpuPower(gpu.specs?.powerConnectors, gpu.specs?.tdp);
  return parsed.kind === '16pin' ? 'gpu-12v' : 'gpu-pcie';
}

function hasAio(build) {
  const cooler = getItems(build, 'cooler')[0];
  return lower(cooler?.specs?.type).includes('liquid');
}

function hasSataDrive(build) {
  return getItems(build, 'storage').some((drive) => !lower(drive?.specs?.type).includes('m.2') && !lower(drive?.specs?.type).includes('nvme'));
}

/**
 * The eleven cable kinds, in the order you would plug them on a real bench.
 * `ports` names the two ends (the first is where the plug starts, the second is
 * the socket it must reach). `needs` decides whether the build needs it at all.
 */
export const CABLE_KINDS = [
  {
    id: 'atx24',
    label: '24-pin ATX',
    short: '24-pin',
    from: 'Power supply',
    to: 'Board 24-pin socket',
    fromPort: 'psu-24pin',
    toPort: 'board-24pin',
    needs: (build) => getItems(build, 'psu').length > 0 && getItems(build, 'motherboard').length > 0,
    why: 'It is the main feed. Without it the board gets no power at all and nothing happens when you press the button.',
  },
  {
    id: 'eps8',
    label: '8-pin CPU EPS',
    short: 'EPS',
    from: 'Power supply',
    to: 'Board CPU power at the top corner',
    fromPort: 'psu-eps',
    toPort: 'board-eps',
    needs: (build) => getItems(build, 'psu').length > 0 && getItems(build, 'motherboard').length > 0,
    why: 'The chip draws its own power through this one. Missing it, the fans spin but the machine will not post.',
  },
  {
    id: 'gpu-pcie',
    label: 'PCIe GPU power',
    short: 'PCIe',
    from: 'Power supply',
    to: 'Graphics card power sockets',
    fromPort: 'psu-pcie',
    toPort: 'gpu-pcie',
    needs: (build) => hasGpu(build) && gpuPowerKind(build) === 'gpu-pcie',
    why: 'A card in the slot with no cable has no power and the screen stays dark. It takes one 8-pin per 150 W the card pulls.',
  },
  {
    id: 'gpu-12v',
    label: '12V-2x6 GPU power',
    short: '12V-2x6',
    from: 'Power supply',
    to: 'Graphics card 16-pin socket',
    fromPort: 'psu-12v',
    toPort: 'gpu-12v',
    needs: (build) => hasGpu(build) && gpuPowerKind(build) === 'gpu-12v',
    why: 'The big cards use the newer 16-pin plug. Force an old PCIe cable into it and the pins bend — the cable has to match.',
  },
  {
    id: 'sata-power',
    label: 'SATA power',
    short: 'SATA power',
    from: 'Power supply',
    to: 'Drive',
    fromPort: 'psu-sata',
    toPort: 'drive-sata-power',
    needs: hasSataDrive,
    why: 'A 2.5-inch or 3.5-inch drive needs power of its own. The data cable alone leaves it dead.',
  },
  {
    id: 'sata-data',
    label: 'SATA data',
    short: 'SATA data',
    from: 'Board SATA port',
    to: 'Drive',
    fromPort: 'board-sata',
    toPort: 'drive-sata-data',
    needs: hasSataDrive,
    why: 'This is the cable the drive talks over. Power without data spins it up and the board never sees it.',
  },
  {
    id: 'front-panel',
    label: 'Front-panel connectors',
    short: 'Front panel',
    from: 'Case front panel',
    to: 'Board header at the bottom edge',
    fromPort: 'case-front',
    toPort: 'board-front',
    needs: (build) => getItems(build, 'case').length > 0 && getItems(build, 'motherboard').length > 0,
    why: 'The power button runs through these tiny pins. Get them wrong and the case button does nothing.',
  },
  {
    id: 'cpu-fan',
    label: 'CPU fan',
    short: 'CPU fan',
    from: 'Cooler fan',
    to: 'Board CPU_FAN header',
    fromPort: 'cooler-fan',
    toPort: 'board-cpu-fan',
    // An air cooler's fan plugs into CPU_FAN. A liquid cooler is wired by its
    // own pump and radiator cables instead, so the two never both appear.
    needs: (build) => getItems(build, 'cooler').length > 0 && !hasAio(build),
    why: 'The board watches this header. With nothing plugged in it refuses to start, as a guard against a chip cooking itself.',
  },
  {
    id: 'case-fan',
    label: 'Case fan',
    short: 'Case fan',
    from: 'Case fans',
    to: 'Board fan header',
    fromPort: 'fans-hub',
    toPort: 'board-fan-header',
    needs: (build) => getItems(build, 'fans').length > 0,
    why: 'Fans wired straight to the supply run flat out and roar. On a header the board can slow them when the machine is idle.',
  },
  {
    id: 'aio-pump',
    label: 'AIO pump',
    short: 'Pump',
    from: 'Cooler pump block',
    to: 'Board pump header',
    fromPort: 'cooler-pump',
    toPort: 'board-pump',
    needs: hasAio,
    why: 'No pump power means no water moving. The radiator fans still spin, so it looks fine right until the chip throttles.',
  },
  {
    id: 'aio-radiator',
    label: 'AIO radiator connections',
    short: 'Radiator',
    from: 'Radiator fans',
    to: 'Board fan header',
    fromPort: 'radiator-fans',
    toPort: 'board-fan-header',
    needs: hasAio,
    why: 'The radiator fans are the only thing removing heat from the loop. Unplugged, the loop heats itself.',
  },
];

export const CABLE_BY_ID = Object.fromEntries(CABLE_KINDS.map((kind) => [kind.id, kind]));

/** The cables this build actually needs, in the order they get plugged in. */
export function neededCables(build) {
  return CABLE_KINDS.filter((kind) => kind.needs(build));
}

/**
 * Plug a cable in. Returns { ok, kind, reason }.
 * `connected` is the array of already-plugged cable ids held by the workshop.
 */
export function connectCable(build, connected, cableId, portId) {
  const kind = CABLE_BY_ID[cableId];
  if (!kind) return { ok: false, reason: 'That is not a cable in the kit.' };

  if (!neededCables(build).some((entry) => entry.id === kind.id)) {
    return { ok: false, kind, reason: `This build has nothing for the ${kind.label} to feed.` };
  }

  if (connected.includes(kind.id)) {
    return { ok: false, kind, reason: `The ${kind.label} is already plugged in.` };
  }

  // Clicking a socket in the scene: it must be the socket this cable ends on.
  if (portId && !acceptablePorts(build, kind).some((port) => port.id === portId)) {
    const target = portLabel(portId);
    return {
      ok: false,
      kind,
      reason: `The ${kind.label} does not go into ${target}. It ends at ${PORT_LABELS[kind.toPort] || kind.to.toLowerCase()}.`,
    };
  }

  return { ok: true, kind, reason: '' };
}

/** The sockets this cable may be clicked into (there can be two ends). */
export function acceptablePorts(build, kind) {
  const ports = [{ id: kind.toPort, label: PORT_LABELS[kind.toPort] || kind.to }, { id: kind.fromPort, label: PORT_LABELS[kind.fromPort] || kind.from }];
  return ports.filter((port) => port.id);
}

export const PORT_LABELS = {
  'psu-24pin': 'the supply 24-pin socket',
  'psu-eps': 'the supply EPS socket',
  'psu-pcie': 'the supply PCIe socket',
  'psu-12v': 'the supply 12V-2x6 socket',
  'psu-sata': 'the supply SATA socket',
  'board-24pin': 'the board 24-pin socket',
  'board-eps': 'the board CPU power socket',
  'gpu-pcie': 'the card PCIe socket',
  'gpu-12v': 'the card 16-pin socket',
  'drive-sata-power': 'the drive power socket',
  'drive-sata-data': 'the drive data socket',
  'board-sata': 'the board SATA port',
  'board-front': 'the board front-panel header',
  'case-front': 'the case front-panel leads',
  'board-cpu-fan': 'the CPU_FAN header',
  'board-fan-header': 'the board fan header',
  'board-pump': 'the pump header',
  'cooler-fan': 'the cooler fan lead',
  'cooler-pump': 'the pump lead',
  'fans-hub': 'the fan hub lead',
  'radiator-fans': 'the radiator fan leads',
};

function portLabel(portId) {
  return PORT_LABELS[portId] || (portId ? `the ${portId.replace(/-/g, ' ')} socket` : 'that socket');
}

/**
 * The whole picture: every needed cable, whether it is in, and what is left.
 * The rail, the bench and the boot test all read this.
 */
export function cableState(build, connected = []) {
  const needed = neededCables(build);
  const entries = needed.map((kind) => ({
    ...kind,
    connected: connected.includes(kind.id),
  }));
  const plugged = entries.filter((entry) => entry.connected).length;
  return {
    entries,
    plugged,
    total: entries.length,
    complete: entries.length > 0 && plugged === entries.length,
    missing: entries.filter((entry) => !entry.connected),
  };
}

/** What is still unplugged, in one sentence for a boot test or a toast. */
export function cableSummary(build, connected = []) {
  const state = cableState(build, connected);
  if (!state.total) return 'This build has no cables to plug in yet.';
  if (state.complete) return 'Every cable is plugged into the right socket.';
  const names = state.missing.map((entry) => entry.label);
  const listed = names.length > 3 ? `${names.slice(0, 3).join(', ')} and ${names.length - 3} more` : names.join(', ');
  return `Still unplugged: ${listed}.`;
}
