/**
 * BIOS and boot system.
 *
 * Everything here is a pure function of (build). It answers three questions:
 *   1. What does POST detect, and where does it stop?
 *   2. What can the machine boot from?
 *   3. What has to be installed before the machine is usable?
 *
 * The rules stay readable on purpose: a real board checks the same things in
 * the same order, and every failure below has a plain-language explanation.
 */

import { buildPowerDraw, buildTotal, getItems, recommendedPsu, selectedCount } from './build.js';
import { bootFaults } from './gameplay.js';
import { evaluateBuild } from './compat.js';

/** POST order, as a real board walks it. */
export const POST_STAGES = [
  { id: 'board', label: 'Motherboard startup', side: 'Board' },
  { id: 'cpu', label: 'CPU detection', side: 'CPU' },
  { id: 'memory', label: 'Memory detection and training', side: 'RAM' },
  { id: 'video', label: 'GPU initialization', side: 'GPU' },
  { id: 'storage', label: 'Storage detection', side: 'Storage' },
  { id: 'cooling', label: 'Cooling check', side: 'Cooling' },
  { id: 'selftest', label: 'Self-test and handover to BIOS', side: 'POST' },
];

function stage(id, status, headline, detail, fix = null) {
  const meta = POST_STAGES.find((entry) => entry.id === id);
  return { id, label: meta?.label || id, side: meta?.side || id, status, headline, detail, fix };
}

function fixFor(category, label) {
  return { category, label, href: `#/builder?cat=${category}` };
}

function findFault(faults, ids) {
  return faults.find((fault) => ids.includes(fault.id)) || null;
}

function cpuLabel(cpu) {
  return cpu ? `${cpu.name}` : 'no processor';
}

/** The full POST run for a build. */
export function bootCheck(build) {
  const stages = [];
  const faults = bootFaults(build);
  const compat = evaluateBuild(build);
  const board = getItems(build, 'motherboard')[0] || null;
  const cpu = getItems(build, 'cpu')[0] || null;
  const gpu = getItems(build, 'gpu')[0] || null;
  const psu = getItems(build, 'psu')[0] || null;
  const cooler = getItems(build, 'cooler')[0] || null;
  const kits = getItems(build, 'ram');
  const drives = getItems(build, 'storage');

  // 1. Board power and firmware.
  const boardFault = findFault(faults, ['empty', 'no-board']);
  if (!board || boardFault) {
    stages.push(stage('board', 'fail', 'No firmware response', boardFault?.detail || 'There is no motherboard installed, so nothing answers the power button.', fixFor('motherboard', 'Add a motherboard')));
  } else {
    const firmware = compat.errors.some((error) => /bios|chipset|socket/i.test(error.title));
    stages.push(stage('board', firmware ? 'warn' : 'ok', `${board.brand} ${board.specs?.chipset || 'chipset'} firmware started`,
      firmware ? 'The board answers, but its firmware may need to be updated before it accepts this chip.' : 'Power is stable and the firmware has posted the first checkpoint.',
      firmware ? fixFor('motherboard', 'Check the board') : null));
  }

  // 2. CPU detection.
  const cpuFault = findFault(faults, ['no-cpu']);
  if (!cpu) {
    stages.push(stage('cpu', 'fail', 'Empty socket', cpuFault?.detail || 'The socket is empty.', fixFor('cpu', 'Add a CPU')));
  } else if (board && cpu.specs?.socket && board.specs?.socket && cpu.specs.socket !== board.specs.socket) {
    stages.push(stage('cpu', 'fail', 'Socket mismatch',
      `${cpu.name} is built for ${cpu.specs.socket}, but the board has ${/^[AEIOU]/.test(String(board.specs.socket)) ? 'an' : 'a'} ${board.specs.socket} socket. The chip cannot sit in it.`,
      fixFor('cpu', 'Fit the socket')));
  } else {
    stages.push(stage('cpu', 'ok', `${cpu.name} detected`,
      `Socket ${cpu.specs?.socket || 'matched'}, ${cpu.specs?.peakPower || cpu.specs?.tdp || '?'} W peak. Microcode loaded from firmware.`));
  }

  // 3. Memory detection.
  if (!kits.length) {
    stages.push(stage('memory', 'fail', 'No memory found',
      'POST stops at the memory checkpoint. A board cannot hand over to BIOS without at least one working stick.',
      fixFor('ram', 'Add memory')));
  } else {
    const capacity = kits.reduce((sum, kit) => sum + (Number(kit.specs?.capacity) || 0), 0);
    const modules = kits.reduce((sum, kit) => sum + (Number(kit.specs?.modules) || 1), 0);
    const type = kits[0]?.specs?.type || 'DDR';
    const speed = Math.min(...kits.map((kit) => Number(kit.specs?.speed) || 0));
    if (modules < 2) {
      stages.push(stage('memory', 'warn', `${capacity} GB ${type} trained`,
        `Only ${modules} module detected, so the machine runs in single channel and loses memory bandwidth. Pair it with an identical stick.`,
        fixFor('ram', 'Fill both slots')));
    } else {
      stages.push(stage('memory', 'ok', `${capacity} GB ${type}-${speed || '?'} trained`,
        `${modules} modules detected in dual channel. Training complete, XMP/EXPO profile reported to the firmware.`));
    }
  }

  // 4. Video.
  const videoFault = findFault(faults, ['no-output']);
  if (gpu) {
    stages.push(stage('video', 'ok', `${gpu.name} initialized`,
      `${gpu.specs?.tdp || '?'} W card, output detected on the first DisplayPort.`));
  } else if (cpu && Number(cpu.specs?.igpuScore) > 0) {
    stages.push(stage('video', 'ok', 'Integrated graphics initialized',
      `${cpu.name} has onboard graphics, so the monitor runs from the board's video output. Shared memory reported to the firmware.`));
  } else {
    stages.push(stage('video', 'fail', 'No display output',
      videoFault?.detail || 'No graphics card is fitted and this processor has no integrated graphics, so nothing can drive a monitor.',
      fixFor('gpu', 'Add a graphics card')));
  }

  // 5. Storage.
  if (!drives.length) {
    stages.push(stage('storage', 'warn', 'No storage detected',
      'The board will still reach BIOS, but there is nothing to install an operating system on or boot from.',
      fixFor('storage', 'Add a drive')));
  } else {
    const total = drives.reduce((sum, drive) => sum + (Number(drive.specs?.capacityGB) || 0), 0);
    const first = drives[0];
    stages.push(stage('storage', 'ok', `${drives.length} drive${drives.length === 1 ? '' : 's'} detected`,
      `${first.name} reports ${Math.round(total / (total >= 1000 ? 1000 : 1))}${total >= 1000 ? ' TB' : ' GB'} across the bus as ${first.specs?.interface || 'a storage device'}.`));
  }

  // 6. Cooling.
  const coolFaults = faults.filter((fault) => fault.id === 'no-cooler' || fault.id === 'cooler-tight');
  if (coolFaults.length) {
    stages.push(stage('cooling', 'warn', coolFaults[0].title, coolFaults[0].detail, fixFor('cooler', 'Check cooling')));
  } else if (cooler) {
    stages.push(stage('cooling', 'ok', `${cooler.name} responding`,
      `Fan header reports ${cooler.specs?.type === 'Liquid' ? 'pump and radiator fans' : 'a fan'} turning, ${cooler.specs?.tdp || '?'} W rated.`));
  } else {
    stages.push(stage('cooling', 'ok', 'Stock cooler running', 'The bundled cooler answers on the CPU fan header.'));
  }

  // 7. Self-test and handover.
  const blocking = compat.errors || [];
  if (blocking.length) {
    stages.push(stage('selftest', 'fail', blocking[0].title, blocking[0].detail));
  } else {
    const warns = compat.warnings || [];
    stages.push(stage('selftest', warns.length ? 'warn' : 'ok', 'POST complete',
      warns.length
        ? `${warns.length} note${warns.length === 1 ? '' : 's'} carried into BIOS. The system can boot, but read them before trusting the build.`
        : 'All checkpoints passed. Handing control to the BIOS screen.', null));
  }

  const fails = stages.filter((entry) => entry.status === 'fail');
  const warns = stages.filter((entry) => entry.status === 'warn');
  const power = buildPowerDraw(build);
  const headroom = psu ? Math.round(((Number(psu.specs?.wattage) - power) / Number(psu.specs?.wattage)) * 100) : null;

  return {
    stages,
    fails,
    warns,
    ok: fails.length === 0,
    power,
    recommended: recommendedPsu(build),
    headroom,
    total: buildTotal(build),
    selected: selectedCount(build),
    board,
    cpu,
    gpu,
    psu,
    cooler,
    kits,
    drives,
    beep: beepCode(fails),
  };
}

/** The beeps a real board would play for this failure. */
export function beepCode(fails) {
  if (!fails.length) return { label: 'One short beep', detail: 'POST passed. This is the good beep.' };
  const ids = fails.map((fault) => fault.id);
  // The earliest checkpoint that fails is the one the board sounds: without a
  // board there is nothing to beep at all, and a chip that is not detected
  // never reaches the memory test.
  if (ids.includes('board')) return { label: 'Continuous beeping', detail: 'Board power or firmware failure.' };
  if (ids.includes('cpu')) return { label: 'Five short beeps', detail: 'Processor not detected or not supported.' };
  if (ids.includes('memory')) return { label: 'One long, two short beeps', detail: 'No usable memory detected.' };
  if (ids.includes('video')) return { label: 'One long, three short beeps', detail: 'No display adapter initialized.' };
  return { label: 'One long beep', detail: 'POST halted before the firmware handed over.' };
}

/** What the BIOS offers in the boot menu. */
export function bootDevices(build) {
  const drives = getItems(build, 'storage');
  const devices = drives.map((drive, index) => ({
    id: `drive-${drive.id}`,
    label: `${drive.name}`,
    sub: `${drive.specs?.interface || 'Storage'} · ${Number(drive.specs?.capacityGB) || 0} GB${index === 0 ? ' · recommended' : ''}`,
    kind: 'drive',
    ready: true,
  }));
  if (!devices.length) {
    return [{ id: 'none', label: 'No boot device available', sub: 'Fit a storage drive to continue', kind: 'empty', ready: false }];
  }
  devices.push({ id: 'usb-installer', label: 'USB: Windows 11 installer', sub: 'Bootable USB drive · setup media', kind: 'usb', ready: true });
  devices.push({ id: 'uefi-shell', label: 'UEFI Shell', sub: 'Firmware diagnostics only', kind: 'shell', ready: true });
  return devices;
}

/** Drivers a real install would pull for these parts. */
export function driverList(build) {
  const cpu = getItems(build, 'cpu')[0] || null;
  const board = getItems(build, 'motherboard')[0] || null;
  const gpu = getItems(build, 'gpu')[0] || null;
  const drivers = [];

  if (cpu?.brand) {
    drivers.push({
      id: 'chipset',
      label: `${cpu.brand} chipset driver`,
      note: `Schedules the ${cpu.specs?.socket || 'CPU'} platform: power states, PCIe lanes and USB controllers.`,
    });
  }
  if (gpu?.brand) {
    const vendor = /nvidia|geforce|rtx|gtx/i.test(`${gpu.brand} ${gpu.name}`) ? 'NVIDIA' : /intel|arc/i.test(`${gpu.brand} ${gpu.name}`) ? 'Intel' : 'AMD';
    drivers.push({
      id: 'graphics',
      label: `${vendor} graphics driver`,
      note: `Unlocks the ${gpu.name} beyond the basic display driver the installer falls back to.`,
    });
  }
  drivers.push({ id: 'audio', label: 'Realtek HD audio driver', note: 'Front-panel headphone and microphone jacks.' });
  drivers.push({ id: 'lan', label: `${board?.brand || 'Onboard'} LAN driver`, note: 'Wired network adapter — needed to download everything else.' });
  if (build?.items?.fans?.length || getItems(build, 'cooler')[0]?.specs?.rgb) {
    drivers.push({ id: 'rgb', label: 'Lighting and fan control utility', note: 'Drives the addressable RGB headers and the fan curves.' });
  }
  return drivers;
}

/** The install sequence shown on the operating system screen. */
export function installPlan(build) {
  const drivers = driverList(build);
  const capacity = getItems(build, 'storage').reduce((sum, drive) => sum + (Number(drive.specs?.capacityGB) || 0), 0);
  return [
    { id: 'partition', label: 'Partition the drive', detail: 'GPT partition table, EFI system partition, reserved space', weight: 2 },
    { id: 'image', label: 'Write the system image', detail: `Copying the operating system onto ${capacity ? `${capacity} GB of storage` : 'the boot drive'}`, weight: 6 },
    { id: 'firstboot', label: 'First boot into setup', detail: 'Out-of-box experience, account and updates', weight: 3 },
    { id: 'drivers', label: `Install ${drivers.length} drivers`, detail: drivers.map((driver) => driver.label).join(', '), weight: 4 },
  ];
}
