import { CATEGORIES, getHardware } from '../data/hardware.js';
import { buildPowerDraw, buildTotal, coreProgress, getItems, recommendedPsu, selectedCount } from './build.js';

const isKnown = (value) => value !== undefined && value !== null && value !== '' && !(Array.isArray(value) && value.length === 0);

export const COMPATIBILITY_LABELS = {
  compatible: { label: 'Compatible', tone: 'ok', icon: 'check' },
  warning: { label: 'Warnings', tone: 'warn', icon: 'alert' },
  incompatible: { label: 'Incompatible', tone: 'error', icon: 'x' },
  incomplete: { label: 'Incomplete', tone: 'info', icon: 'dot' },
  empty: { label: 'Empty build', tone: 'neutral', icon: 'dot' },
};

export function evaluateBuild(build) {
  const items = {};
  CATEGORIES.forEach((category) => {
    items[category.id] = getItems(build, category.id);
  });

  const cpu = items.cpu[0] || null;
  const motherboard = items.motherboard[0] || null;
  const gpu = items.gpu[0] || null;
  const psu = items.psu[0] || null;
  const pcCase = items.case[0] || null;
  const cooler = items.cooler[0] || null;
  const memories = items.ram;
  const storages = items.storage;
  const fans = items.fans;

  const checks = [];
  const add = (level, title, detail, parts = []) => {
    checks.push({ level, title, detail, parts: [...new Set(parts)] });
  };
  const unknown = (topic, detail, parts = []) => {
    add('warn', `${topic} cannot be verified`, detail || 'A required specification is missing from the catalog data, so compatibility cannot be confirmed. Verify this detail with the manufacturer before buying.', parts);
  };
  const ids = (...entries) => entries.filter(Boolean).map((entry) => entry.id);

  if (cpu && motherboard) {
    const cpuSocket = cpu.specs.socket;
    const boardSocket = motherboard.specs.socket;
    if (isKnown(cpuSocket) && isKnown(boardSocket)) {
      if (cpuSocket === boardSocket) {
        add('ok', 'CPU socket matches', `${cpu.name} and ${motherboard.name} both use the ${cpuSocket} socket.`, ids(cpu, motherboard));
      } else {
        add('error', 'CPU socket mismatch', `${cpu.name} uses ${cpuSocket}, but ${motherboard.name} is built for ${boardSocket}. The CPU physically will not fit — choose a motherboard with the same socket.`, ids(cpu, motherboard));
      }
    } else {
      unknown('CPU socket compatibility', 'The socket for the selected CPU or motherboard is not listed.', ids(cpu, motherboard));
    }

    const chipset = motherboard.specs.chipset;
    const supportedChipsets = cpu.specs.chipsets;
    if (isKnown(chipset) && Array.isArray(supportedChipsets) && supportedChipsets.length) {
      if (supportedChipsets.includes(chipset)) {
        add('ok', 'Chipset supports this CPU', `${motherboard.name} uses the ${chipset} chipset, which supports ${cpu.name}.`, ids(cpu, motherboard));
      } else {
        add('error', 'Motherboard chipset not supported by CPU', `${cpu.name} is supported by ${supportedChipsets.join(', ')} chipsets, but this motherboard uses ${chipset}. Pick a different board or CPU.`, ids(cpu, motherboard));
      }
    } else if (isKnown(chipset)) {
      unknown('Chipset support', `We know the board uses ${chipset}, but the CPU's supported chipset list is unavailable.`, ids(cpu, motherboard));
    }

    if (cpu.specs.bios && cpuSocket === boardSocket) {
      add('info', 'BIOS update may be required', cpu.specs.bios, ids(cpu, motherboard));
    }
  }

  if (memories.length && (cpu || motherboard)) {
    const types = [...new Set(memories.map((memory) => memory.specs.type).filter(Boolean))];
    const cpuTypes = cpu?.specs.memoryTypes;
    const boardTypes = motherboard?.specs.memoryTypes;
    const memoryNames = memories.map((memory) => `${memory.specs.type} (${memory.name})`).join(', ');
    let hasError = false;
    let unverified = false;
    const problems = [];

    if (cpu && Array.isArray(cpuTypes) && cpuTypes.length) {
      const bad = types.filter((type) => !cpuTypes.includes(type));
      if (bad.length) {
        hasError = true;
        problems.push(`${cpu.name} supports ${cpuTypes.join('/')} memory only`);
      }
    } else if (cpu) {
      unverified = true;
    }

    if (motherboard && Array.isArray(boardTypes) && boardTypes.length) {
      const bad = types.filter((type) => !boardTypes.includes(type));
      if (bad.length) {
        hasError = true;
        problems.push(`${motherboard.name} accepts ${boardTypes.join('/')} memory only`);
      }
    } else if (motherboard) {
      unverified = true;
    }

    if (hasError) {
      add('error', 'Memory generation mismatch', `Selected ${memoryNames} cannot be used: ${problems.join('; ')}. DDR4 and DDR5 are physically different and are not interchangeable.`, [cpu, motherboard, ...memories].filter(Boolean).map((item) => item.id));
    } else if (unverified) {
      unknown('Memory generation compatibility', `Selected ${memoryNames} could not be matched against the CPU or motherboard memory type.`, [cpu, motherboard, ...memories].filter(Boolean).map((item) => item.id));
    } else {
      add('ok', 'Memory generation matches', `${memoryNames} ${memories.length > 1 ? 'are' : 'is'} supported by the selected CPU and motherboard.`, [cpu, motherboard, ...memories].filter(Boolean).map((item) => item.id));
    }

    if (motherboard) {
      const slots = motherboard.specs.memorySlots;
      const modules = memories.reduce((sum, memory) => sum + (Number(memory.specs.modules) || 0), 0);
      if (Number.isFinite(slots)) {
        if (modules > slots) {
          add('error', 'Not enough memory slots', `The selected kits need ${modules} DIMM slots, but ${motherboard.name} has ${slots}. Remove a kit or choose a motherboard with more slots.`, ids(motherboard, ...memories));
        } else {
          add('ok', 'Memory slots available', `${modules} of ${slots} DIMM slots will be used by the selected memory.`, ids(motherboard, ...memories));
        }
        if (modules === 1) {
          add('warn', 'Single-channel memory configuration', 'Only one memory module is installed. A matched pair runs in dual-channel mode and can meaningfully improve gaming and multitasking performance.', ids(...memories));
        }
      } else {
        unknown('Memory slot capacity', 'The motherboard memory slot count is not listed.', ids(motherboard, ...memories));
      }

      const maxMemory = motherboard.specs.maxMemory;
      const totalCapacity = memories.reduce((sum, memory) => sum + (Number(memory.specs.capacity) || 0), 0);
      if (Number.isFinite(maxMemory)) {
        if (totalCapacity > maxMemory) {
          add('error', 'Memory capacity exceeds motherboard limit', `The selected kits total ${totalCapacity} GB, but ${motherboard.name} supports up to ${maxMemory} GB.`, ids(motherboard, ...memories));
        } else {
          add('ok', 'Memory capacity within limits', `Total capacity is ${totalCapacity} GB; the motherboard supports up to ${maxMemory} GB.`, ids(motherboard, ...memories));
        }
      } else {
        unknown('Maximum memory capacity', 'The motherboard maximum memory capacity is not listed.', ids(motherboard, ...memories));
      }

      const maxSpeed = motherboard.specs.maxMemorySpeed;
      const fastest = Math.max(...memories.map((memory) => Number(memory.specs.speed) || 0));
      if (Number.isFinite(maxSpeed) && fastest > 0) {
        if (fastest > maxSpeed) {
          add('warn', 'Memory rated faster than the board officially supports', `The fastest kit is rated ${fastest} MT/s, while ${motherboard.name} lists support up to ${maxSpeed} MT/s. It should still work, but it will likely run at a lower speed unless the board validates that profile.`, ids(motherboard, ...memories));
        } else {
          add('ok', 'Memory speed within board support', `The fastest kit is rated ${fastest} MT/s; the board supports up to ${maxSpeed} MT/s. Enable EXPO/XMP in the BIOS to reach the rated profile.`, ids(motherboard, ...memories));
        }
      } else {
        unknown('Memory speed compatibility', 'The memory speed or the motherboard\'s rated memory speed is not listed.', ids(motherboard, ...memories));
      }
    }
  }

  if (motherboard && pcCase) {
    const formFactor = motherboard.specs.formFactor;
    const supported = pcCase.specs.supportedFormFactors;
    if (isKnown(formFactor) && Array.isArray(supported) && supported.length) {
      if (supported.includes(formFactor)) {
        add('ok', 'Motherboard fits the case', `${pcCase.name} supports ${supported.join(', ')} motherboards, including the selected ${formFactor} board.`, ids(motherboard, pcCase));
      } else {
        add('error', 'Motherboard does not fit the case', `${motherboard.name} is ${formFactor}, but ${pcCase.name} supports ${supported.join(', ')}. Choose a compatible case or a smaller motherboard.`, ids(motherboard, pcCase));
      }
    } else {
      unknown('Motherboard form factor fit', 'The motherboard form factor or the case\'s supported form factors are not listed.', ids(motherboard, pcCase));
    }
  }

  if (gpu && pcCase) {
    const length = Number(gpu.specs.length);
    const clearance = Number(pcCase.specs.maxGpuLength);
    if (Number.isFinite(length) && Number.isFinite(clearance)) {
      if (length > clearance) {
        add('error', 'Graphics card is too long for the case', `${gpu.name} is ${length} mm long, but ${pcCase.name} supports cards up to ${clearance} mm. Choose a shorter card or a roomier case.`, ids(gpu, pcCase));
      } else if (clearance - length <= 15) {
        add('warn', 'Tight graphics card fit', `${gpu.name} is ${length} mm long and the case allows ${clearance} mm. It should fit, but front fans or cables may reduce clearance — verify before buying.`, ids(gpu, pcCase));
      } else {
        add('ok', 'Graphics card fits the case', `${gpu.name} is ${length} mm long; ${pcCase.name} supports up to ${clearance} mm.`, ids(gpu, pcCase));
      }
    } else {
      unknown('Graphics card length clearance', 'The graphics card length or case clearance is not listed.', ids(gpu, pcCase));
    }
  }

  if (gpu && psu) {
    const connectors = gpu.specs.powerConnectors || '';
    if (connectors.includes('16-pin')) {
      if (psu.specs.twelveVHPWR === true) {
        add('ok', 'Native 16-pin GPU power available', `${psu.name} has a native 16-pin GPU connector for ${gpu.name}.`, ids(gpu, psu));
      } else if (psu.specs.twelveVHPWR === false) {
        add('warn', 'GPU power adapter may be required', `${gpu.name} uses a 16-pin power connector, while ${psu.name} does not list a native 16-pin cable. Use the adapter supplied with the card and seat it fully.`, ids(gpu, psu));
      } else {
        unknown('GPU power connector compatibility', 'The PSU 16-pin support is not listed.', ids(gpu, psu));
      }
    }
  }

  if (cpu && !cooler) {
    if (cpu.specs.includedCooler) {
      add('warn', 'Using the bundled CPU cooler', `${cpu.name} includes a stock cooler in the box. It is adequate for stock operation, but a tower or liquid cooler will run cooler and quieter.`, ids(cpu));
    } else {
      add('warn', 'No CPU cooler selected', `${cpu.name} does not include a cooler. Add an aftermarket cooler before building — the system should not be run without one.`, ids(cpu));
    }
  }

  if (cpu && cooler) {
    const sockets = cooler.specs.sockets;
    if (Array.isArray(sockets) && sockets.length && isKnown(cpu.specs.socket)) {
      if (sockets.includes(cpu.specs.socket)) {
        add('ok', 'Cooler supports the CPU socket', `${cooler.name} supports ${cpu.specs.socket}, which matches ${cpu.name}.`, ids(cpu, cooler));
      } else {
        add('error', 'Cooler does not support this CPU socket', `${cooler.name} supports ${sockets.join(', ')}, but ${cpu.name} uses ${cpu.specs.socket}. Choose a cooler with the matching mounting kit.`, ids(cpu, cooler));
      }
    } else {
      unknown('CPU cooler socket compatibility', 'The cooler mounting sockets are not listed.', ids(cpu, cooler));
    }

    const rated = Number(cooler.specs.tdp);
    const peak = Number(cpu.specs.peakPower);
    const base = Number(cpu.specs.tdp);
    const isStock = cooler.id.includes('stock');
    if (isStock && cpu.specs.includedCooler) {
      add('ok', 'Bundled cooler is matched to the CPU', `${cpu.name} ships with this cooler, which is intended for stock operation.`, ids(cpu, cooler));
    } else if (Number.isFinite(rated) && Number.isFinite(peak)) {
      if (rated >= peak) {
        add('ok', 'Cooler capacity is sufficient', `${cooler.name} is rated for ${rated} W, above the CPU's ${peak} W maximum boost power.`, ids(cpu, cooler));
      } else if (Number.isFinite(base) && rated >= base) {
        add('warn', 'Cooler may limit sustained boost', `${cooler.name} is rated for ${rated} W. ${cpu.name} has a ${base} W base TDP but can draw up to ${peak} W in boost, which may push temperatures and fan noise higher.`, ids(cpu, cooler));
      } else {
        add('warn', 'Cooler is likely underpowered', `${cooler.name} is rated for ${rated} W but ${cpu.name} can draw up to ${peak} W. Expect thermal throttling under heavy loads; a larger cooler is recommended.`, ids(cpu, cooler));
      }
    } else {
      unknown('CPU cooler thermal capacity', 'The cooler TDP rating or CPU power figures are not listed.', ids(cpu, cooler));
    }

    if (cooler.specs.type === 'Air' && Number.isFinite(Number(cooler.specs.ramClearance)) && memories.length) {
      const clearance = Number(cooler.specs.ramClearance);
      const tall = memories.filter((memory) => Number(memory.specs.height) > clearance);
      if (tall.length) {
        add('warn', 'CPU cooler may overlap tall memory', `${cooler.name} lists ${clearance} mm of memory clearance. ${tall.map((memory) => memory.name).join(', ')} ${tall.length > 1 ? 'are' : 'is'} taller. The cooler fan can often be raised, but verify clearance inside your case.`, [cooler, ...tall].map((item) => item.id));
      } else {
        add('ok', 'CPU cooler clears the memory', `Selected memory is within the ${clearance} mm clearance listed for ${cooler.name}.`, [cooler, ...memories].map((item) => item.id));
      }
    }
  }

  if (cooler && pcCase) {
    if (cooler.specs.type === 'Air') {
      const height = Number(cooler.specs.height);
      const maxHeight = Number(pcCase.specs.maxCoolerHeight);
      if (Number.isFinite(height) && Number.isFinite(maxHeight)) {
        if (height > maxHeight) {
          add('error', 'CPU cooler is too tall for the case', `${cooler.name} is ${height} mm tall, but ${pcCase.name} supports coolers up to ${maxHeight} mm. The side panel would not close.`, ids(cooler, pcCase));
        } else if (maxHeight - height <= 5) {
          add('warn', 'Tight CPU cooler clearance', `${cooler.name} is ${height} mm tall and the case supports ${maxHeight} mm. It fits on paper, but cable routing or side-panel design may interfere.`, ids(cooler, pcCase));
        } else {
          add('ok', 'CPU cooler fits the case', `${cooler.name} is ${height} mm tall; ${pcCase.name} supports up to ${maxHeight} mm.`, ids(cooler, pcCase));
        }
      } else {
        unknown('CPU cooler height clearance', 'The cooler height or case clearance is not listed.', ids(cooler, pcCase));
      }
    } else if (cooler.specs.type === 'Liquid') {
      const radiator = Number(cooler.specs.radiatorSize);
      const supported = pcCase.specs.radiatorSupport;
      if (Number.isFinite(radiator) && Array.isArray(supported) && supported.length) {
        if (supported.includes(radiator)) {
          add('ok', 'Liquid cooler radiator fits', `${cooler.name} uses a ${radiator} mm radiator, which ${pcCase.name} can mount.`, ids(cooler, pcCase));
        } else {
          add('error', 'Liquid cooler radiator does not fit', `${cooler.name} needs a ${radiator} mm radiator mount, but ${pcCase.name} supports ${supported.join(', ')} mm radiators. Choose a smaller AIO or a larger case.`, ids(cooler, pcCase));
        }
      } else {
        unknown('Liquid cooler radiator fit', 'The radiator size or the case\'s radiator support list is not listed.', ids(cooler, pcCase));
      }
    }
  }

  if (psu && (cpu || gpu)) {
    const wattage = Number(psu.specs.wattage);
    const load = buildPowerDraw(build);
    const recommended = recommendedPsu(build);
    if (Number.isFinite(wattage)) {
      if (wattage < load) {
        add('error', 'Power supply wattage is too low', `Estimated peak system draw is about ${load} W, but ${psu.name} is rated for ${wattage} W. The system could shut down or trip protection under load. Choose at least a ${recommended} W unit.`, [psu, cpu, gpu].filter(Boolean).map((item) => item.id));
      } else if (wattage < recommended) {
        add('warn', 'Power supply headroom is tight', `Estimated peak draw is about ${load} W. ${psu.name} meets that, but ${wattage} W leaves little headroom for transient spikes and future upgrades — ${recommended} W is recommended.`, [psu, cpu, gpu].filter(Boolean).map((item) => item.id));
      } else {
        add('ok', 'Power supply has healthy headroom', `Estimated peak draw is about ${load} W. ${psu.name} provides ${wattage} W, meeting the recommended ${recommended} W.`, [psu, cpu, gpu].filter(Boolean).map((item) => item.id));
      }
    } else {
      unknown('Power supply capacity', 'The PSU wattage rating is not listed.', ids(psu));
    }
  }

  if (psu && pcCase) {
    const psuForm = psu.specs.formFactor;
    const supported = pcCase.specs.psuSupport;
    if (isKnown(psuForm) && Array.isArray(supported) && supported.length) {
      if (supported.includes(psuForm)) {
        add('ok', 'Power supply form factor fits', `${psu.name} is ${psuForm}; ${pcCase.name} supports ${supported.join(', ')} power supplies.`, ids(psu, pcCase));
      } else {
        add('error', 'Power supply form factor does not fit', `${psu.name} is ${psuForm}, but ${pcCase.name} accepts ${supported.join(', ')} units. Choose a matching PSU or case.`, ids(psu, pcCase));
      }
    } else {
      unknown('Power supply form factor fit', 'The PSU form factor or the case\'s supported PSU types are not listed.', ids(psu, pcCase));
    }

    const psuLength = Number(psu.specs.length);
    const maxLength = Number(pcCase.specs.maxPsuLength);
    if (Number.isFinite(psuLength) && Number.isFinite(maxLength) && psuLength > maxLength) {
      add('warn', 'Power supply may be too long', `${psu.name} is ${psuLength} mm deep, while ${pcCase.name} lists ${maxLength} mm of PSU clearance. Cable space may be tight.`, ids(psu, pcCase));
    }
  }

  if (motherboard && storages.length) {
    const nvme = storages.filter((drive) => drive.specs.interface === 'NVMe');
    const sata = storages.filter((drive) => drive.specs.interface === 'SATA');
    const unknownInterface = storages.filter((drive) => !['NVMe', 'SATA'].includes(drive.specs.interface));

    if (unknownInterface.length) {
      unknown('Storage interface compatibility', `The interface for ${unknownInterface.map((drive) => drive.name).join(', ')} is not listed.`, [motherboard, ...unknownInterface].map((item) => item.id));
    }

    if (nvme.length) {
      const m2Slots = Number(motherboard.specs.m2Slots);
      if (Number.isFinite(m2Slots)) {
        if (nvme.length > m2Slots) {
          add('error', 'Not enough M.2 slots', `${nvme.length} NVMe drives were selected, but ${motherboard.name} has ${m2Slots} M.2 slot${m2Slots === 1 ? '' : 's'}. Remove a drive or choose a board with more slots.`, [motherboard, ...nvme].map((item) => item.id));
        } else {
          add('ok', 'M.2 slots available', `${nvme.length} NVMe drive${nvme.length === 1 ? '' : 's'} will use ${nvme.length} of ${m2Slots} M.2 slot${m2Slots === 1 ? '' : 's'} on ${motherboard.name}.`, [motherboard, ...nvme].map((item) => item.id));
        }
      } else {
        unknown('M.2 slot availability', 'The motherboard M.2 slot count is not listed.', [motherboard, ...nvme].map((item) => item.id));
      }

      const boardGen = Number(motherboard.specs.m2Gen);
      const slower = nvme.filter((drive) => Number(drive.specs.pcieGen) > boardGen);
      if (Number.isFinite(boardGen) && nvme.every((drive) => Number.isFinite(Number(drive.specs.pcieGen)))) {
        if (slower.length) {
          add('warn', 'NVMe drive will run below its rated speed', `${slower.map((drive) => drive.name).join(', ')} ${slower.length > 1 ? 'are' : 'is'} faster than the board's PCIe Gen ${boardGen} M.2 link. The drive is compatible but will be limited to Gen ${boardGen} bandwidth.`, [motherboard, ...slower].map((item) => item.id));
        } else {
          add('ok', 'NVMe link speed is supported', `The selected NVMe drive${nvme.length === 1 ? '' : 's'} will run at the board's PCIe Gen ${boardGen} M.2 speed or better.`, [motherboard, ...nvme].map((item) => item.id));
        }
      } else if (slower.length) {
        unknown('NVMe generation compatibility', 'The M.2 PCIe generation for the board or drive is not listed.', [motherboard, ...nvme].map((item) => item.id));
      }
    }

    if (sata.length) {
      const sataPorts = Number(motherboard.specs.sataPorts);
      if (Number.isFinite(sataPorts)) {
        if (sata.length > sataPorts) {
          add('error', 'Not enough SATA ports', `${sata.length} SATA drives were selected, but ${motherboard.name} has ${sataPorts} SATA port${sataPorts === 1 ? '' : 's'}. Remove a drive or add a SATA expansion card.`, [motherboard, ...sata].map((item) => item.id));
        } else {
          add('ok', 'SATA ports available', `${sata.length} SATA drive${sata.length === 1 ? '' : 's'} will use ${sata.length} of ${sataPorts} ports on ${motherboard.name}.`, [motherboard, ...sata].map((item) => item.id));
        }
      } else {
        unknown('SATA port availability', 'The motherboard SATA port count is not listed.', [motherboard, ...sata].map((item) => item.id));
      }
    }
  }

  if (pcCase && fans.length) {
    const fanCount = fans.reduce((sum, fan) => sum + (Number(fan.specs.count) || 0), 0);
    const fanSlots = Number(pcCase.specs.fanSlots);
    const fanSizes = pcCase.specs.fanSizes;
    if (Number.isFinite(fanSlots)) {
      if (fanCount > fanSlots) {
        add('warn', 'More case fans than mounting positions', `The selected kits include ${fanCount} fans, while ${pcCase.name} lists ${fanSlots} mounting positions. Some fans may need another location or a different case.`, [pcCase, ...fans].map((item) => item.id));
      } else {
        add('ok', 'Case fan mounts available', `${fanCount} fan${fanCount === 1 ? '' : 's'} selected; ${pcCase.name} has ${fanSlots} mounting positions.`, [pcCase, ...fans].map((item) => item.id));
      }
    } else {
      unknown('Case fan mounting capacity', 'The case fan mount count is not listed.', [pcCase, ...fans].map((item) => item.id));
    }

    if (Array.isArray(fanSizes) && fanSizes.length) {
      const badSizes = fans.filter((fan) => isKnown(fan.specs.size) && !fanSizes.includes(Number(fan.specs.size)));
      if (badSizes.length) {
        add('warn', 'Fan size may not fit the case', `${badSizes.map((fan) => `${fan.name} (${fan.specs.size} mm)`).join(', ')} may not fit — ${pcCase.name} lists support for ${fanSizes.join(', ')} mm fans. Verify the exact mount.`, [pcCase, ...badSizes].map((item) => item.id));
      }
    } else if (fans.some((fan) => !isKnown(fan.specs.size))) {
      unknown('Case fan size compatibility', 'A selected fan kit does not list its size.', [pcCase, ...fans].map((item) => item.id));
    }
  }

  if (!gpu && cpu) {
    if (Number(cpu.specs.igpuScore) > 0 && cpu.specs.iGPU) {
      add('info', 'Integrated graphics will drive the display', `${cpu.name} has ${cpu.specs.iGPU}. The PC will output video without a graphics card, but gaming performance will be far below a dedicated GPU.`, ids(cpu));
    } else {
      add('error', 'No graphics output', `${cpu.name} has no integrated graphics and no graphics card is selected. Add a GPU — otherwise the system cannot display an image.`, ids(cpu));
    }
  }

  const lowStock = [...new Set([...items.cpu, ...items.motherboard, ...items.gpu, ...items.ram, ...items.storage, ...items.psu, ...items.case, ...items.cooler, ...items.fans])].filter((item) => item.availability === 'low-stock');
  const preorder = [...new Set([...items.cpu, ...items.motherboard, ...items.gpu, ...items.ram, ...items.storage, ...items.psu, ...items.case, ...items.cooler, ...items.fans])].filter((item) => item.availability === 'preorder');
  if (lowStock.length) {
    add('info', 'Limited availability', `Sample availability is low for: ${lowStock.map((item) => item.name).join(', ')}. Confirm stock with your retailer.`, lowStock.map((item) => item.id));
  }
  if (preorder.length) {
    add('info', 'Pre-order items included', `Sample availability marks these as pre-order: ${preorder.map((item) => item.name).join(', ')}. Delivery timing will vary.`, preorder.map((item) => item.id));
  }

  const progress = coreProgress(build);
  const count = selectedCount(build);
  const errors = checks.filter((check) => check.level === 'error');
  const warnings = checks.filter((check) => check.level === 'warn');
  const passes = checks.filter((check) => check.level === 'ok');
  const infos = checks.filter((check) => check.level === 'info');

  let status = 'compatible';
  if (count === 0) status = 'empty';
  else if (errors.length) status = 'incompatible';
  else if (progress.missing.length) status = 'incomplete';
  else if (warnings.length) status = 'warning';

  return {
    status,
    checks,
    errors,
    warnings,
    passes,
    infos,
    estimatedWattage: buildPowerDraw(build),
    recommendedPsu: recommendedPsu(build),
    progress,
    missing: progress.missing,
    selectedCount: count,
    total: buildTotal(build),
    componentPrices: Object.fromEntries(CATEGORIES.map((category) => [category.id, items[category.id].reduce((sum, item) => sum + item.price, 0)])),
  };
}

export function getCompatibilitySummary(result) {
  if (!result) return COMPATIBILITY_LABELS.empty;
  return COMPATIBILITY_LABELS[result.status] || COMPATIBILITY_LABELS.empty;
}
