export const CATEGORIES = [
  { id: 'cpu', label: 'CPU', singular: 'Processor', required: true, multi: false, icon: 'cpu', blurb: 'Intel & AMD processors' },
  { id: 'motherboard', label: 'Motherboard', singular: 'Motherboard', required: true, multi: false, icon: 'motherboard', blurb: 'Sockets, chipsets & form factors' },
  { id: 'gpu', label: 'Graphics Card', singular: 'Graphics card', required: false, multi: false, icon: 'gpu', blurb: 'NVIDIA GeForce & AMD Radeon' },
  { id: 'ram', label: 'Memory', singular: 'Memory kit', required: true, multi: true, icon: 'ram', blurb: 'DDR4 & DDR5 memory kits' },
  { id: 'storage', label: 'Storage', singular: 'Storage drive', required: true, multi: true, icon: 'storage', blurb: 'NVMe, SATA SSD & HDD' },
  { id: 'psu', label: 'Power Supply', singular: 'Power supply', required: true, multi: false, icon: 'psu', blurb: 'Wattage, efficiency & modularity' },
  { id: 'case', label: 'PC Case', singular: 'PC case', required: true, multi: false, icon: 'case', blurb: 'ATX, Micro-ATX & Mini-ITX' },
  { id: 'cooler', label: 'CPU Cooler', singular: 'CPU cooler', required: false, multi: false, icon: 'cooler', blurb: 'Air & liquid cooling' },
  { id: 'fans', label: 'Case Fans', singular: 'Fan kit', required: false, multi: true, icon: 'fan', blurb: 'Airflow, static pressure & RGB' },
];

export const HARDWARE = [
  {
    id: 'cpu-i3-12100', category: 'cpu', name: 'Intel Core i3-12100', brand: 'Intel', price: 5450, availability: 'in-stock',
    specs: { socket: 'LGA1700', chipsets: ['H610', 'B660', 'B760', 'Z690', 'Z790'], cores: 4, threads: 8, baseClock: 3.3, boostClock: 4.3, tdp: 60, peakPower: 89, iGPU: 'Intel UHD 730', igpuScore: 5, memoryTypes: ['DDR4', 'DDR5'], memorySpeed: 4800, includedCooler: true, unlocked: false, cache: '12 MB L3' },
    score: 33, tags: ['office', 'budget', 'integrated graphics'],
  },
  {
    id: 'cpu-i3-12100f', category: 'cpu', name: 'Intel Core i3-12100F', brand: 'Intel', price: 4650, availability: 'in-stock',
    specs: { socket: 'LGA1700', chipsets: ['H610', 'B660', 'B760', 'Z690', 'Z790'], cores: 4, threads: 8, baseClock: 3.3, boostClock: 4.3, tdp: 58, peakPower: 89, iGPU: null, igpuScore: 0, memoryTypes: ['DDR4', 'DDR5'], memorySpeed: 4800, includedCooler: true, unlocked: false, cache: '12 MB L3' },
    score: 36, tags: ['budget', 'entry gaming'],
  },
  {
    id: 'cpu-i5-12400f', category: 'cpu', name: 'Intel Core i5-12400F', brand: 'Intel', price: 8250, availability: 'in-stock',
    specs: { socket: 'LGA1700', chipsets: ['H610', 'B660', 'B760', 'Z690', 'Z790'], cores: 6, threads: 12, baseClock: 2.5, boostClock: 4.4, tdp: 65, peakPower: 117, iGPU: null, igpuScore: 0, memoryTypes: ['DDR4', 'DDR5'], memorySpeed: 4800, includedCooler: true, unlocked: false, cache: '18 MB L3' },
    score: 52, tags: ['budget', 'gaming', 'value'],
  },
  {
    id: 'cpu-i5-13400f', category: 'cpu', name: 'Intel Core i5-13400F', brand: 'Intel', price: 11200, availability: 'in-stock',
    specs: { socket: 'LGA1700', chipsets: ['H610', 'B660', 'B760', 'Z690', 'Z790'], cores: 10, threads: 16, baseClock: 2.5, boostClock: 4.6, tdp: 65, peakPower: 148, iGPU: null, igpuScore: 0, memoryTypes: ['DDR4', 'DDR5'], memorySpeed: 4800, includedCooler: true, unlocked: false, cache: '20 MB L3' },
    score: 60, tags: ['gaming', 'value', 'streaming'],
  },
  {
    id: 'cpu-i5-14600kf', category: 'cpu', name: 'Intel Core i5-14600KF', brand: 'Intel', price: 16900, availability: 'in-stock',
    specs: { socket: 'LGA1700', chipsets: ['B660', 'B760', 'Z690', 'Z790'], cores: 14, threads: 20, baseClock: 3.5, boostClock: 5.3, tdp: 125, peakPower: 181, iGPU: null, igpuScore: 0, memoryTypes: ['DDR4', 'DDR5'], memorySpeed: 5600, includedCooler: false, unlocked: true, cache: '24 MB L3' },
    score: 76, tags: ['gaming', 'high refresh', 'overclocking'],
  },
  {
    id: 'cpu-i7-14700k', category: 'cpu', name: 'Intel Core i7-14700K', brand: 'Intel', price: 24900, availability: 'in-stock',
    specs: { socket: 'LGA1700', chipsets: ['B660', 'B760', 'Z690', 'Z790'], cores: 20, threads: 28, baseClock: 3.4, boostClock: 5.6, tdp: 125, peakPower: 253, iGPU: 'Intel UHD 770', igpuScore: 6, memoryTypes: ['DDR4', 'DDR5'], memorySpeed: 5600, includedCooler: false, unlocked: true, cache: '33 MB L3' },
    score: 86, tags: ['streaming', 'productivity', 'high-end'],
  },
  {
    id: 'cpu-i9-14900k', category: 'cpu', name: 'Intel Core i9-14900K', brand: 'Intel', price: 33500, availability: 'low-stock',
    specs: { socket: 'LGA1700', chipsets: ['B660', 'B760', 'Z690', 'Z790'], cores: 24, threads: 32, baseClock: 3.2, boostClock: 6.0, tdp: 125, peakPower: 253, iGPU: 'Intel UHD 770', igpuScore: 6, memoryTypes: ['DDR4', 'DDR5'], memorySpeed: 5600, includedCooler: false, unlocked: true, cache: '36 MB L3' },
    score: 91, tags: ['flagship', 'productivity', 'workstation'],
  },
  {
    id: 'cpu-ultra7-265k', category: 'cpu', name: 'Intel Core Ultra 7 265K', brand: 'Intel', price: 23900, availability: 'in-stock',
    specs: { socket: 'LGA1851', chipsets: ['B860', 'Z890'], cores: 20, threads: 20, baseClock: 3.9, boostClock: 5.5, tdp: 125, peakPower: 250, iGPU: 'Intel Xe (4-core)', igpuScore: 7, memoryTypes: ['DDR5'], memorySpeed: 6400, includedCooler: false, unlocked: true, cache: '30 MB L3' },
    score: 88, tags: ['high-end', 'productivity', 'new platform'],
  },
  {
    id: 'cpu-r5-5600', category: 'cpu', name: 'AMD Ryzen 5 5600', brand: 'AMD', price: 6450, availability: 'in-stock',
    specs: { socket: 'AM4', chipsets: ['A520', 'B550', 'X570'], cores: 6, threads: 12, baseClock: 3.5, boostClock: 4.4, tdp: 65, peakPower: 88, iGPU: null, igpuScore: 0, memoryTypes: ['DDR4'], memorySpeed: 3200, includedCooler: true, unlocked: true, cache: '32 MB L3' },
    score: 47, tags: ['budget', 'gaming', 'value'],
  },
  {
    id: 'cpu-r7-5700x3d', category: 'cpu', name: 'AMD Ryzen 7 5700X3D', brand: 'AMD', price: 11800, availability: 'in-stock',
    specs: { socket: 'AM4', chipsets: ['A520', 'B550', 'X570'], cores: 8, threads: 16, baseClock: 3.0, boostClock: 4.1, tdp: 105, peakPower: 142, iGPU: null, igpuScore: 0, memoryTypes: ['DDR4'], memorySpeed: 3200, includedCooler: false, unlocked: false, cache: '96 MB 3D V-Cache' },
    score: 67, tags: ['gaming', 'AM4 upgrade', 'cache'],
  },
  {
    id: 'cpu-r5-7600', category: 'cpu', name: 'AMD Ryzen 5 7600', brand: 'AMD', price: 11500, availability: 'in-stock',
    specs: { socket: 'AM5', chipsets: ['A620', 'B650', 'B650E', 'X670', 'X670E'], cores: 6, threads: 12, baseClock: 3.8, boostClock: 5.1, tdp: 65, peakPower: 88, iGPU: 'AMD RDNA 2 (2 CU)', igpuScore: 8, memoryTypes: ['DDR5'], memorySpeed: 5200, includedCooler: true, unlocked: true, cache: '32 MB L3' },
    score: 65, tags: ['gaming', 'mid-range', 'AM5'],
  },
  {
    id: 'cpu-r7-7800x3d', category: 'cpu', name: 'AMD Ryzen 7 7800X3D', brand: 'AMD', price: 21500, availability: 'in-stock',
    specs: { socket: 'AM5', chipsets: ['A620', 'B650', 'B650E', 'X670', 'X670E'], cores: 8, threads: 16, baseClock: 4.2, boostClock: 5.0, tdp: 120, peakPower: 162, iGPU: 'AMD RDNA 2 (2 CU)', igpuScore: 8, memoryTypes: ['DDR5'], memorySpeed: 5200, includedCooler: false, unlocked: false, cache: '96 MB 3D V-Cache' },
    score: 94, tags: ['gaming', 'high-end', 'best gaming CPU'],
  },
  {
    id: 'cpu-r9-7950x', category: 'cpu', name: 'AMD Ryzen 9 7950X', brand: 'AMD', price: 29800, availability: 'in-stock',
    specs: { socket: 'AM5', chipsets: ['B650', 'B650E', 'X670', 'X670E'], cores: 16, threads: 32, baseClock: 4.5, boostClock: 5.7, tdp: 170, peakPower: 230, iGPU: 'AMD RDNA 2 (2 CU)', igpuScore: 8, memoryTypes: ['DDR5'], memorySpeed: 5200, includedCooler: false, unlocked: true, cache: '64 MB L3' },
    score: 88, tags: ['workstation', 'productivity', 'render'],
  },
  {
    id: 'cpu-r7-9800x3d', category: 'cpu', name: 'AMD Ryzen 7 9800X3D', brand: 'AMD', price: 32000, availability: 'low-stock',
    specs: { socket: 'AM5', chipsets: ['A620', 'B650', 'B650E', 'X670', 'X670E'], cores: 8, threads: 16, baseClock: 4.7, boostClock: 5.2, tdp: 120, peakPower: 162, iGPU: 'AMD RDNA 2 (2 CU)', igpuScore: 8, memoryTypes: ['DDR5'], memorySpeed: 5600, includedCooler: false, unlocked: true, cache: '96 MB 3D V-Cache', bios: 'B650/X670 boards may need a recent BIOS update for Ryzen 9000 support.' },
    score: 100, tags: ['flagship gaming', 'high-end'],
  },

  {
    id: 'mb-gigabyte-a520m-k', category: 'motherboard', name: 'Gigabyte A520M K V2', brand: 'Gigabyte', price: 3450, availability: 'in-stock',
    specs: { socket: 'AM4', chipset: 'A520', formFactor: 'Micro-ATX', memoryTypes: ['DDR4'], memorySlots: 2, maxMemory: 64, maxMemorySpeed: 3200, m2Slots: 1, m2Gen: 3, sataPorts: 4, wifi: false, pcieGen: 3, powerStages: '5+3 phase', audio: 'Realtek ALC887' },
  },
  {
    id: 'mb-msi-b550m-pro-vdh', category: 'motherboard', name: 'MSI B550M PRO-VDH WIFI', brand: 'MSI', price: 5450, availability: 'in-stock',
    specs: { socket: 'AM4', chipset: 'B550', formFactor: 'Micro-ATX', memoryTypes: ['DDR4'], memorySlots: 4, maxMemory: 128, maxMemorySpeed: 4400, m2Slots: 1, m2Gen: 4, sataPorts: 4, wifi: true, pcieGen: 4, powerStages: '8+2+1 phase', audio: 'Realtek ALC892' },
  },
  {
    id: 'mb-asus-x570e', category: 'motherboard', name: 'ASUS ROG Strix X570-E Gaming II', brand: 'ASUS', price: 16500, availability: 'in-stock',
    specs: { socket: 'AM4', chipset: 'X570', formFactor: 'ATX', memoryTypes: ['DDR4'], memorySlots: 4, maxMemory: 128, maxMemorySpeed: 4800, m2Slots: 2, m2Gen: 4, sataPorts: 8, wifi: true, pcieGen: 4, powerStages: '12+4 phase', audio: 'SupremeFX S1220A' },
  },
  {
    id: 'mb-asrock-b650m-pro-rs', category: 'motherboard', name: 'ASRock B650M Pro RS', brand: 'ASRock', price: 10800, availability: 'in-stock',
    specs: { socket: 'AM5', chipset: 'B650', formFactor: 'Micro-ATX', memoryTypes: ['DDR5'], memorySlots: 4, maxMemory: 128, maxMemorySpeed: 7200, m2Slots: 2, m2Gen: 5, sataPorts: 4, wifi: false, pcieGen: 4, powerStages: '8+2+1 phase', audio: 'Realtek ALC897' },
  },
  {
    id: 'mb-msi-b650-tomahawk', category: 'motherboard', name: 'MSI MAG B650 Tomahawk WiFi', brand: 'MSI', price: 14900, availability: 'in-stock',
    specs: { socket: 'AM5', chipset: 'B650', formFactor: 'ATX', memoryTypes: ['DDR5'], memorySlots: 4, maxMemory: 128, maxMemorySpeed: 7200, m2Slots: 2, m2Gen: 4, sataPorts: 6, wifi: true, pcieGen: 4, powerStages: '14+2+1 phase', audio: 'Realtek ALC4080' },
  },
  {
    id: 'mb-asus-x670e-e', category: 'motherboard', name: 'ASUS ROG Strix X670E-E Gaming WiFi', brand: 'ASUS', price: 28500, availability: 'in-stock',
    specs: { socket: 'AM5', chipset: 'X670E', formFactor: 'ATX', memoryTypes: ['DDR5'], memorySlots: 4, maxMemory: 192, maxMemorySpeed: 7800, m2Slots: 4, m2Gen: 5, sataPorts: 6, wifi: true, pcieGen: 5, powerStages: '18+2 phase', audio: 'SupremeFX ALC4080' },
  },
  {
    id: 'mb-asus-b650e-i', category: 'motherboard', name: 'ASUS ROG Strix B650E-I Gaming WiFi', brand: 'ASUS', price: 19500, availability: 'in-stock',
    specs: { socket: 'AM5', chipset: 'B650E', formFactor: 'Mini-ITX', memoryTypes: ['DDR5'], memorySlots: 2, maxMemory: 64, maxMemorySpeed: 6400, m2Slots: 2, m2Gen: 5, sataPorts: 2, wifi: true, pcieGen: 5, powerStages: '10+2 phase', audio: 'SupremeFX ALC4080' },
  },
  {
    id: 'mb-asus-h610m-e-d4', category: 'motherboard', name: 'ASUS Prime H610M-E D4', brand: 'ASUS', price: 4900, availability: 'in-stock',
    specs: { socket: 'LGA1700', chipset: 'H610', formFactor: 'Micro-ATX', memoryTypes: ['DDR4'], memorySlots: 2, maxMemory: 64, maxMemorySpeed: 3200, m2Slots: 1, m2Gen: 3, sataPorts: 4, wifi: false, pcieGen: 4, powerStages: '6+1 phase', audio: 'Realtek ALC897' },
  },
  {
    id: 'mb-msi-b760m-a-ddr4', category: 'motherboard', name: 'MSI PRO B760M-A WIFI DDR4', brand: 'MSI', price: 8900, availability: 'in-stock',
    specs: { socket: 'LGA1700', chipset: 'B760', formFactor: 'Micro-ATX', memoryTypes: ['DDR4'], memorySlots: 4, maxMemory: 128, maxMemorySpeed: 5333, m2Slots: 2, m2Gen: 4, sataPorts: 4, wifi: true, pcieGen: 4, powerStages: '12+1 phase', audio: 'Realtek ALC897' },
  },
  {
    id: 'mb-asus-z790-plus-d4', category: 'motherboard', name: 'ASUS TUF Gaming Z790-Plus WiFi D4', brand: 'ASUS', price: 16200, availability: 'in-stock',
    specs: { socket: 'LGA1700', chipset: 'Z790', formFactor: 'ATX', memoryTypes: ['DDR4'], memorySlots: 4, maxMemory: 128, maxMemorySpeed: 5333, m2Slots: 4, m2Gen: 4, sataPorts: 4, wifi: true, pcieGen: 5, powerStages: '16+1 phase', audio: 'Realtek ALC1220' },
  },
  {
    id: 'mb-msi-b760m-a-ddr5', category: 'motherboard', name: 'MSI PRO B760M-A WIFI', brand: 'MSI', price: 9600, availability: 'in-stock',
    specs: { socket: 'LGA1700', chipset: 'B760', formFactor: 'Micro-ATX', memoryTypes: ['DDR5'], memorySlots: 4, maxMemory: 128, maxMemorySpeed: 6800, m2Slots: 2, m2Gen: 4, sataPorts: 4, wifi: true, pcieGen: 4, powerStages: '12+1 phase', audio: 'Realtek ALC897' },
  },
  {
    id: 'mb-asus-z890-p', category: 'motherboard', name: 'ASUS Prime Z890-P WiFi', brand: 'ASUS', price: 19800, availability: 'in-stock',
    specs: { socket: 'LGA1851', chipset: 'Z890', formFactor: 'ATX', memoryTypes: ['DDR5'], memorySlots: 4, maxMemory: 192, maxMemorySpeed: 7600, m2Slots: 4, m2Gen: 5, sataPorts: 4, wifi: true, pcieGen: 5, powerStages: '16+1+2 phase', audio: 'Realtek ALC1220P' },
  },
  {
    id: 'mb-msi-b860-tomahawk', category: 'motherboard', name: 'MSI MAG B860 Tomahawk WiFi', brand: 'MSI', price: 15400, availability: 'preorder',
    specs: { socket: 'LGA1851', chipset: 'B860', formFactor: 'ATX', memoryTypes: ['DDR5'], memorySlots: 4, maxMemory: 256, maxMemorySpeed: 7600, m2Slots: 3, m2Gen: 5, sataPorts: 4, wifi: true, pcieGen: 5, powerStages: '14+1+1 phase', audio: 'Realtek ALC4080' },
  },

  {
    id: 'gpu-rtx-3050', category: 'gpu', name: 'NVIDIA GeForce RTX 3050 6GB', brand: 'NVIDIA', price: 10500, availability: 'in-stock',
    specs: { chip: 'GA107', vram: 6, memoryType: 'GDDR6', length: 200, tdp: 70, powerConnectors: 'None (slot powered)', boostClock: 1470, ports: '1× HDMI 2.1, 2× DP 1.4a' },
    score: 13, tags: ['entry', '1080p'],
  },
  {
    id: 'gpu-rtx-3060', category: 'gpu', name: 'NVIDIA GeForce RTX 3060 12GB', brand: 'NVIDIA', price: 16500, availability: 'in-stock',
    specs: { chip: 'GA106', vram: 12, memoryType: 'GDDR6', length: 242, tdp: 170, powerConnectors: '1× 8-pin', boostClock: 1777, ports: '1× HDMI 2.1, 3× DP 1.4a' },
    score: 19, tags: ['entry gaming', '1080p', '12GB VRAM'],
  },
  {
    id: 'gpu-rtx-4060', category: 'gpu', name: 'NVIDIA GeForce RTX 4060 8GB', brand: 'NVIDIA', price: 19800, availability: 'in-stock',
    specs: { chip: 'AD107', vram: 8, memoryType: 'GDDR6', length: 244, tdp: 115, powerConnectors: '1× 8-pin', boostClock: 2460, ports: '1× HDMI 2.1a, 3× DP 1.4a' },
    score: 26, tags: ['gaming', '1080p', 'DLSS 3'],
  },
  {
    id: 'gpu-rtx-4060ti', category: 'gpu', name: 'NVIDIA GeForce RTX 4060 Ti 8GB', brand: 'NVIDIA', price: 26500, availability: 'in-stock',
    specs: { chip: 'AD106', vram: 8, memoryType: 'GDDR6', length: 244, tdp: 160, powerConnectors: '1× 8-pin', boostClock: 2535, ports: '1× HDMI 2.1a, 3× DP 1.4a' },
    score: 32, tags: ['gaming', '1080p', '1440p'],
  },
  {
    id: 'gpu-rtx-4070-super', category: 'gpu', name: 'NVIDIA GeForce RTX 4070 Super 12GB', brand: 'NVIDIA', price: 42900, availability: 'in-stock',
    specs: { chip: 'AD104', vram: 12, memoryType: 'GDDR6X', length: 285, tdp: 220, powerConnectors: '1× 16-pin (12VHPWR)', boostClock: 2475, ports: '1× HDMI 2.1a, 3× DP 1.4a' },
    score: 47, tags: ['1440p', 'high-end', 'DLSS 3'],
  },
  {
    id: 'gpu-rtx-4070ti-super', category: 'gpu', name: 'NVIDIA GeForce RTX 4070 Ti Super 16GB', brand: 'NVIDIA', price: 58500, availability: 'in-stock',
    specs: { chip: 'AD103', vram: 16, memoryType: 'GDDR6X', length: 305, tdp: 285, powerConnectors: '1× 16-pin (12VHPWR)', boostClock: 2610, ports: '1× HDMI 2.1a, 3× DP 1.4a' },
    score: 58, tags: ['1440p', '4K', 'creator'],
  },
  {
    id: 'gpu-rtx-4080-super', category: 'gpu', name: 'NVIDIA GeForce RTX 4080 Super 16GB', brand: 'NVIDIA', price: 79900, availability: 'low-stock',
    specs: { chip: 'AD103', vram: 16, memoryType: 'GDDR6X', length: 310, tdp: 320, powerConnectors: '1× 16-pin (12VHPWR)', boostClock: 2550, ports: '1× HDMI 2.1a, 3× DP 1.4a' },
    score: 74, tags: ['4K', 'high-end', 'creator'],
  },
  {
    id: 'gpu-rtx-4090', category: 'gpu', name: 'NVIDIA GeForce RTX 4090 24GB', brand: 'NVIDIA', price: 129000, availability: 'low-stock',
    specs: { chip: 'AD102', vram: 24, memoryType: 'GDDR6X', length: 336, tdp: 450, powerConnectors: '1× 16-pin (12VHPWR)', boostClock: 2520, ports: '1× HDMI 2.1a, 3× DP 1.4a' },
    score: 100, tags: ['4K', 'flagship', 'AI'],
  },
  {
    id: 'gpu-rtx-5070', category: 'gpu', name: 'NVIDIA GeForce RTX 5070 12GB', brand: 'NVIDIA', price: 38900, availability: 'in-stock',
    specs: { chip: 'GB205', vram: 12, memoryType: 'GDDR7', length: 242, tdp: 250, powerConnectors: '1× 16-pin (12V-2x6)', boostClock: 2510, ports: '1× HDMI 2.1b, 3× DP 2.1b' },
    score: 48, tags: ['1440p', 'DLSS 4', 'new'],
  },
  {
    id: 'gpu-rtx-5080', category: 'gpu', name: 'NVIDIA GeForce RTX 5080 16GB', brand: 'NVIDIA', price: 69900, availability: 'preorder',
    specs: { chip: 'GB203', vram: 16, memoryType: 'GDDR7', length: 304, tdp: 360, powerConnectors: '1× 16-pin (12V-2x6)', boostClock: 2617, ports: '1× HDMI 2.1b, 3× DP 2.1b' },
    score: 72, tags: ['4K', 'DLSS 4', 'high-end'],
  },
  {
    id: 'gpu-rx-6600', category: 'gpu', name: 'AMD Radeon RX 6600 8GB', brand: 'AMD', price: 12900, availability: 'in-stock',
    specs: { chip: 'Navi 23', vram: 8, memoryType: 'GDDR6', length: 200, tdp: 132, powerConnectors: '1× 8-pin', boostClock: 2491, ports: '1× HDMI 2.1, 3× DP 1.4a' },
    score: 16, tags: ['entry gaming', '1080p', 'value'],
  },
  {
    id: 'gpu-rx-7600', category: 'gpu', name: 'AMD Radeon RX 7600 8GB', brand: 'AMD', price: 18500, availability: 'in-stock',
    specs: { chip: 'Navi 33', vram: 8, memoryType: 'GDDR6', length: 204, tdp: 165, powerConnectors: '1× 8-pin', boostClock: 2655, ports: '1× HDMI 2.1, 3× DP 2.1' },
    score: 23, tags: ['gaming', '1080p', 'FSR 3'],
  },
  {
    id: 'gpu-rx-7700xt', category: 'gpu', name: 'AMD Radeon RX 7700 XT 12GB', brand: 'AMD', price: 29900, availability: 'in-stock',
    specs: { chip: 'Navi 32', vram: 12, memoryType: 'GDDR6', length: 267, tdp: 245, powerConnectors: '2× 8-pin', boostClock: 2544, ports: '1× HDMI 2.1, 3× DP 2.1' },
    score: 33, tags: ['1440p', 'gaming', 'FSR 3'],
  },
  {
    id: 'gpu-rx-7800xt', category: 'gpu', name: 'AMD Radeon RX 7800 XT 16GB', brand: 'AMD', price: 36500, availability: 'in-stock',
    specs: { chip: 'Navi 32', vram: 16, memoryType: 'GDDR6', length: 267, tdp: 263, powerConnectors: '2× 8-pin', boostClock: 2430, ports: '1× HDMI 2.1, 3× DP 2.1' },
    score: 41, tags: ['1440p', 'gaming', '16GB VRAM'],
  },
  {
    id: 'gpu-rx-7900xtx', category: 'gpu', name: 'AMD Radeon RX 7900 XTX 24GB', brand: 'AMD', price: 69900, availability: 'in-stock',
    specs: { chip: 'Navi 31', vram: 24, memoryType: 'GDDR6', length: 287, tdp: 355, powerConnectors: '2× 8-pin', boostClock: 2500, ports: '1× HDMI 2.1, 3× DP 2.1' },
    score: 70, tags: ['4K', 'high-end', '24GB VRAM'],
  },
  {
    id: 'gpu-rx-9070xt', category: 'gpu', name: 'AMD Radeon RX 9070 XT 16GB', brand: 'AMD', price: 52900, availability: 'preorder',
    specs: { chip: 'Navi 48', vram: 16, memoryType: 'GDDR6', length: 267, tdp: 304, powerConnectors: '2× 8-pin', boostClock: 2970, ports: '1× HDMI 2.1b, 3× DP 2.1b' },
    score: 62, tags: ['1440p', '4K', 'FSR 4'],
  },

  {
    id: 'ram-fury-16-3200', category: 'ram', name: 'Kingston Fury Beast 16GB DDR4-3200', brand: 'Kingston', price: 2450, availability: 'in-stock',
    specs: { type: 'DDR4', capacity: 16, modules: 2, speed: 3200, cl: 16, height: 34, rgb: false, voltage: '1.35 V' },
  },
  {
    id: 'ram-vulcan-16-3600', category: 'ram', name: 'TeamGroup T-Force Vulcan 16GB DDR4-3600', brand: 'TeamGroup', price: 2750, availability: 'in-stock',
    specs: { type: 'DDR4', capacity: 16, modules: 2, speed: 3600, cl: 18, height: 32, rgb: false, voltage: '1.35 V' },
  },
  {
    id: 'ram-lpx-32-3600', category: 'ram', name: 'Corsair Vengeance LPX 32GB DDR4-3600', brand: 'Corsair', price: 4850, availability: 'in-stock',
    specs: { type: 'DDR4', capacity: 32, modules: 2, speed: 3600, cl: 18, height: 34, rgb: false, voltage: '1.35 V' },
  },
  {
    id: 'ram-tridentz-rgb-32-3600', category: 'ram', name: 'G.Skill Trident Z RGB 32GB DDR4-3600', brand: 'G.Skill', price: 5400, availability: 'low-stock',
    specs: { type: 'DDR4', capacity: 32, modules: 2, speed: 3600, cl: 18, height: 44, rgb: true, voltage: '1.35 V' },
  },
  {
    id: 'ram-fury-16-5600', category: 'ram', name: 'Kingston Fury Beast 16GB DDR5-5600', brand: 'Kingston', price: 3650, availability: 'in-stock',
    specs: { type: 'DDR5', capacity: 16, modules: 2, speed: 5600, cl: 36, height: 34, rgb: false, voltage: '1.25 V' },
  },
  {
    id: 'ram-crucial-pro-16-5600', category: 'ram', name: 'Crucial Pro 16GB DDR5-5600', brand: 'Crucial', price: 3100, availability: 'in-stock',
    specs: { type: 'DDR5', capacity: 16, modules: 1, speed: 5600, cl: 46, height: 32, rgb: false, voltage: '1.1 V' },
  },
  {
    id: 'ram-vengeance-32-6000', category: 'ram', name: 'Corsair Vengeance 32GB DDR5-6000', brand: 'Corsair', price: 6450, availability: 'in-stock',
    specs: { type: 'DDR5', capacity: 32, modules: 2, speed: 6000, cl: 36, height: 35, rgb: false, voltage: '1.35 V' },
  },
  {
    id: 'ram-delta-32-6000', category: 'ram', name: 'TeamGroup T-Force Delta RGB 32GB DDR5-6000', brand: 'TeamGroup', price: 7200, availability: 'in-stock',
    specs: { type: 'DDR5', capacity: 32, modules: 2, speed: 6000, cl: 30, height: 44, rgb: true, voltage: '1.35 V' },
  },
  {
    id: 'ram-tridentz5-32-6400', category: 'ram', name: 'G.Skill Trident Z5 RGB 32GB DDR5-6400', brand: 'G.Skill', price: 8900, availability: 'in-stock',
    specs: { type: 'DDR5', capacity: 32, modules: 2, speed: 6400, cl: 32, height: 42, rgb: true, voltage: '1.40 V' },
  },
  {
    id: 'ram-fury-renegade-64-6000', category: 'ram', name: 'Kingston Fury Renegade 64GB DDR5-6000', brand: 'Kingston', price: 13500, availability: 'preorder',
    specs: { type: 'DDR5', capacity: 64, modules: 2, speed: 6000, cl: 32, height: 34, rgb: false, voltage: '1.35 V' },
  },

  {
    id: 'ssd-kingston-a400-480', category: 'storage', name: 'Kingston A400 480GB SATA SSD', brand: 'Kingston', price: 1750, availability: 'in-stock',
    specs: { type: 'SATA SSD', interface: 'SATA', form: '2.5-inch', capacityGB: 480, read: 500, write: 450, pcieGen: null, rpm: null },
  },
  {
    id: 'ssd-crucial-bx500-1tb', category: 'storage', name: 'Crucial BX500 1TB SATA SSD', brand: 'Crucial', price: 3250, availability: 'in-stock',
    specs: { type: 'SATA SSD', interface: 'SATA', form: '2.5-inch', capacityGB: 1000, read: 540, write: 500, pcieGen: null, rpm: null },
  },
  {
    id: 'hdd-seagate-2tb', category: 'storage', name: 'Seagate Barracuda 2TB HDD', brand: 'Seagate', price: 3050, availability: 'in-stock',
    specs: { type: 'HDD', interface: 'SATA', form: '3.5-inch', capacityGB: 2000, read: 190, write: 190, pcieGen: null, rpm: 7200 },
  },
  {
    id: 'hdd-wd-blue-4tb', category: 'storage', name: 'WD Blue 4TB HDD', brand: 'Western Digital', price: 4950, availability: 'in-stock',
    specs: { type: 'HDD', interface: 'SATA', form: '3.5-inch', capacityGB: 4000, read: 180, write: 180, pcieGen: null, rpm: 5400 },
  },
  {
    id: 'ssd-samsung-980-1tb', category: 'storage', name: 'Samsung 980 1TB NVMe SSD', brand: 'Samsung', price: 4250, availability: 'in-stock',
    specs: { type: 'NVMe SSD', interface: 'NVMe', form: 'M.2 2280', capacityGB: 1000, read: 3500, write: 3000, pcieGen: 3, rpm: null },
  },
  {
    id: 'ssd-crucial-p3-plus-1tb', category: 'storage', name: 'Crucial P3 Plus 1TB NVMe SSD', brand: 'Crucial', price: 3950, availability: 'in-stock',
    specs: { type: 'NVMe SSD', interface: 'NVMe', form: 'M.2 2280', capacityGB: 1000, read: 5000, write: 3600, pcieGen: 4, rpm: null },
  },
  {
    id: 'ssd-kingston-nv3-1tb', category: 'storage', name: 'Kingston NV3 1TB NVMe SSD', brand: 'Kingston', price: 3400, availability: 'in-stock',
    specs: { type: 'NVMe SSD', interface: 'NVMe', form: 'M.2 2280', capacityGB: 1000, read: 6000, write: 4000, pcieGen: 4, rpm: null },
  },
  {
    id: 'ssd-wd-sn850x-2tb', category: 'storage', name: 'WD Black SN850X 2TB NVMe SSD', brand: 'Western Digital', price: 9850, availability: 'in-stock',
    specs: { type: 'NVMe SSD', interface: 'NVMe', form: 'M.2 2280', capacityGB: 2000, read: 7300, write: 6600, pcieGen: 4, rpm: null },
  },
  {
    id: 'ssd-samsung-990pro-2tb', category: 'storage', name: 'Samsung 990 Pro 2TB NVMe SSD', brand: 'Samsung', price: 12500, availability: 'in-stock',
    specs: { type: 'NVMe SSD', interface: 'NVMe', form: 'M.2 2280', capacityGB: 2000, read: 7450, write: 6900, pcieGen: 4, rpm: null },
  },
  {
    id: 'ssd-crucial-t705-2tb', category: 'storage', name: 'Crucial T705 2TB NVMe SSD', brand: 'Crucial', price: 18900, availability: 'low-stock',
    specs: { type: 'NVMe SSD', interface: 'NVMe', form: 'M.2 2280', capacityGB: 2000, read: 13600, write: 12700, pcieGen: 5, rpm: null },
  },

  {
    id: 'psu-corsair-cv450', category: 'psu', name: 'Corsair CV450 450W 80+ Bronze', brand: 'Corsair', price: 2050, availability: 'in-stock',
    specs: { wattage: 450, efficiency: '80+ Bronze', modular: 'Non-modular', formFactor: 'ATX', length: 125, pcie8pin: 1, twelveVHPWR: false, warranty: '3 years' },
  },
  {
    id: 'psu-cm-mwe550', category: 'psu', name: 'Cooler Master MWE 550 V2 Bronze', brand: 'Cooler Master', price: 2650, availability: 'in-stock',
    specs: { wattage: 550, efficiency: '80+ Bronze', modular: 'Non-modular', formFactor: 'ATX', length: 140, pcie8pin: 2, twelveVHPWR: false, warranty: '5 years' },
  },
  {
    id: 'psu-seasonic-gx650', category: 'psu', name: 'Seasonic Focus GX-650 650W Gold', brand: 'Seasonic', price: 4950, availability: 'in-stock',
    specs: { wattage: 650, efficiency: '80+ Gold', modular: 'Fully modular', formFactor: 'ATX', length: 140, pcie8pin: 3, twelveVHPWR: false, warranty: '10 years' },
  },
  {
    id: 'psu-msi-a750gl', category: 'psu', name: 'MSI MAG A750GL 750W Gold', brand: 'MSI', price: 5850, availability: 'in-stock',
    specs: { wattage: 750, efficiency: '80+ Gold', modular: 'Fully modular', formFactor: 'ATX', length: 140, pcie8pin: 3, twelveVHPWR: true, warranty: '10 years' },
  },
  {
    id: 'psu-corsair-rm850e', category: 'psu', name: 'Corsair RM850e 850W Gold', brand: 'Corsair', price: 7450, availability: 'in-stock',
    specs: { wattage: 850, efficiency: '80+ Gold', modular: 'Fully modular', formFactor: 'ATX', length: 140, pcie8pin: 4, twelveVHPWR: true, warranty: '10 years' },
  },
  {
    id: 'psu-seasonic-vertex-1000', category: 'psu', name: 'Seasonic Vertex GX-1000 1000W Gold', brand: 'Seasonic', price: 11900, availability: 'in-stock',
    specs: { wattage: 1000, efficiency: '80+ Gold', modular: 'Fully modular', formFactor: 'ATX', length: 160, pcie8pin: 6, twelveVHPWR: true, warranty: '12 years' },
  },
  {
    id: 'psu-fsp-dagger-650', category: 'psu', name: 'FSP Dagger Pro 650W SFX Gold', brand: 'FSP', price: 4650, availability: 'in-stock',
    specs: { wattage: 650, efficiency: '80+ Gold', modular: 'Fully modular', formFactor: 'SFX', length: 100, pcie8pin: 2, twelveVHPWR: false, warranty: '7 years' },
  },
  {
    id: 'psu-bequiet-1200', category: 'psu', name: 'be quiet! Pure Power 12 M 1200W', brand: 'be quiet!', price: 13500, availability: 'preorder',
    specs: { wattage: 1200, efficiency: '80+ Gold', modular: 'Fully modular', formFactor: 'ATX', length: 160, pcie8pin: 6, twelveVHPWR: true, warranty: '10 years' },
  },

  {
    id: 'case-deepcool-matrexx40', category: 'case', name: 'Deepcool MATREXX 40 3FS', brand: 'DeepCool', price: 2350, availability: 'in-stock',
    accent: '#3b82f6',
    specs: { supportedFormFactors: ['Micro-ATX', 'Mini-ITX'], size: 'Mid Tower', maxGpuLength: 320, maxCoolerHeight: 165, radiatorSupport: [120, 240], fanSlots: 4, fanSizes: [120], includedFans: 3, psuSupport: ['ATX'], maxPsuLength: 160, sidePanel: 'Tempered glass', frontPanel: 'Mesh' },
  },
  {
    id: 'case-tecware-forge-m2', category: 'case', name: 'Tecware Forge M2', brand: 'Tecware', price: 2150, availability: 'in-stock',
    accent: '#22d3ee',
    specs: { supportedFormFactors: ['Micro-ATX', 'Mini-ITX'], size: 'Mid Tower', maxGpuLength: 330, maxCoolerHeight: 160, radiatorSupport: [120, 240], fanSlots: 4, fanSizes: [120], includedFans: 2, psuSupport: ['ATX'], maxPsuLength: 160, sidePanel: 'Tempered glass', frontPanel: 'Mesh' },
  },
  {
    id: 'case-jonsbo-d31', category: 'case', name: 'Jonsbo D31 Mesh', brand: 'Jonsbo', price: 3750, availability: 'in-stock',
    accent: '#a855f7',
    specs: { supportedFormFactors: ['Micro-ATX', 'Mini-ITX'], size: 'Mid Tower', maxGpuLength: 330, maxCoolerHeight: 168, radiatorSupport: [120, 240, 280, 360], fanSlots: 5, fanSizes: [120, 140], includedFans: 0, psuSupport: ['ATX', 'SFX'], maxPsuLength: 200, sidePanel: 'Tempered glass', frontPanel: 'Mesh' },
  },
  {
    id: 'case-lianli-lancool216', category: 'case', name: 'Lian Li Lancool 216', brand: 'Lian Li', price: 5950, availability: 'in-stock',
    accent: '#60a5fa',
    specs: { supportedFormFactors: ['ATX', 'Micro-ATX', 'Mini-ITX'], size: 'Mid Tower', maxGpuLength: 392, maxCoolerHeight: 180, radiatorSupport: [120, 240, 280, 360], fanSlots: 6, fanSizes: [120, 140, 160], includedFans: 3, psuSupport: ['ATX'], maxPsuLength: 210, sidePanel: 'Tempered glass', frontPanel: 'Mesh' },
  },
  {
    id: 'case-nzxt-h5-flow', category: 'case', name: 'NZXT H5 Flow', brand: 'NZXT', price: 5450, availability: 'in-stock',
    accent: '#6366f1',
    specs: { supportedFormFactors: ['ATX', 'Micro-ATX', 'Mini-ITX'], size: 'Mid Tower', maxGpuLength: 365, maxCoolerHeight: 165, radiatorSupport: [120, 240, 280], fanSlots: 4, fanSizes: [120, 140], includedFans: 2, psuSupport: ['ATX'], maxPsuLength: 200, sidePanel: 'Tempered glass', frontPanel: 'Perforated' },
  },
  {
    id: 'case-corsair-4000d', category: 'case', name: 'Corsair 4000D Airflow', brand: 'Corsair', price: 5850, availability: 'in-stock',
    accent: '#f59e0b',
    specs: { supportedFormFactors: ['ATX', 'Micro-ATX', 'Mini-ITX'], size: 'Mid Tower', maxGpuLength: 360, maxCoolerHeight: 170, radiatorSupport: [120, 240, 280, 360], fanSlots: 6, fanSizes: [120, 140], includedFans: 2, psuSupport: ['ATX'], maxPsuLength: 180, sidePanel: 'Tempered glass', frontPanel: 'Mesh' },
  },
  {
    id: 'case-fractal-north', category: 'case', name: 'Fractal Design North', brand: 'Fractal Design', price: 8900, availability: 'in-stock',
    accent: '#d6c7a1',
    specs: { supportedFormFactors: ['ATX', 'Micro-ATX', 'Mini-ITX'], size: 'Mid Tower', maxGpuLength: 355, maxCoolerHeight: 170, radiatorSupport: [120, 240, 280], fanSlots: 5, fanSizes: [120, 140], includedFans: 2, psuSupport: ['ATX'], maxPsuLength: 170, sidePanel: 'Tempered glass', frontPanel: 'Wood & mesh' },
  },
  {
    id: 'case-cm-nr200p', category: 'case', name: 'Cooler Master NR200P', brand: 'Cooler Master', price: 4850, availability: 'in-stock',
    accent: '#f43f5e',
    specs: { supportedFormFactors: ['Mini-ITX'], size: 'SFF', maxGpuLength: 330, maxCoolerHeight: 155, radiatorSupport: [120, 240, 280], fanSlots: 4, fanSizes: [120, 140], includedFans: 2, psuSupport: ['SFX', 'SFX-L'], maxPsuLength: 130, sidePanel: 'Tempered glass', frontPanel: 'Mesh' },
  },
  {
    id: 'case-lianli-o11-evo', category: 'case', name: 'Lian Li O11 Dynamic EVO', brand: 'Lian Li', price: 9500, availability: 'in-stock',
    accent: '#8b5cf6',
    specs: { supportedFormFactors: ['ATX', 'Micro-ATX', 'Mini-ITX'], size: 'Mid Tower', maxGpuLength: 420, maxCoolerHeight: 167, radiatorSupport: [120, 240, 280, 360], fanSlots: 10, fanSizes: [120, 140], includedFans: 0, psuSupport: ['ATX'], maxPsuLength: 200, sidePanel: 'Tempered glass', frontPanel: 'Glass' },
  },
  {
    id: 'case-asus-hyperion', category: 'case', name: 'ASUS ROG Hyperion GR701', brand: 'ASUS', price: 22900, availability: 'low-stock',
    accent: '#ef4444',
    specs: { supportedFormFactors: ['E-ATX', 'ATX', 'Micro-ATX', 'Mini-ITX'], size: 'Full Tower', maxGpuLength: 460, maxCoolerHeight: 190, radiatorSupport: [120, 240, 280, 360, 420], fanSlots: 10, fanSizes: [120, 140], includedFans: 4, psuSupport: ['ATX'], maxPsuLength: 240, sidePanel: 'Tempered glass', frontPanel: 'Aluminium & mesh' },
  },

  {
    id: 'cooler-amd-stock', category: 'cooler', name: 'AMD Wraith Stealth (Stock)', brand: 'AMD', price: 950, availability: 'in-stock',
    specs: { type: 'Air', sockets: ['AM4', 'AM5'], height: 65, radiatorSize: null, tdp: 65, ramClearance: 45, fans: 1, rgb: false, noise: 'Up to 36 dBA' },
  },
  {
    id: 'cooler-intel-stock', category: 'cooler', name: 'Intel Laminar RM1 (Stock)', brand: 'Intel', price: 850, availability: 'in-stock',
    specs: { type: 'Air', sockets: ['LGA1700', 'LGA1851'], height: 60, radiatorSize: null, tdp: 65, ramClearance: 45, fans: 1, rgb: false, noise: 'Up to 35 dBA' },
  },
  {
    id: 'cooler-idcooling-se214', category: 'cooler', name: 'ID-COOLING SE-214-XT', brand: 'ID-COOLING', price: 1150, availability: 'in-stock',
    specs: { type: 'Air', sockets: ['AM4', 'AM5', 'LGA1700', 'LGA1851'], height: 150, radiatorSize: null, tdp: 180, ramClearance: 40, fans: 1, rgb: true, noise: 'Up to 32 dBA' },
  },
  {
    id: 'cooler-deepcool-ak400', category: 'cooler', name: 'DeepCool AK400', brand: 'DeepCool', price: 1650, availability: 'in-stock',
    specs: { type: 'Air', sockets: ['AM4', 'AM5', 'LGA1700', 'LGA1851'], height: 155, radiatorSize: null, tdp: 220, ramClearance: 42, fans: 1, rgb: false, noise: 'Up to 29 dBA' },
  },
  {
    id: 'cooler-thermalright-pa120', category: 'cooler', name: 'Thermalright Peerless Assassin 120 SE', brand: 'Thermalright', price: 2150, availability: 'in-stock',
    specs: { type: 'Air', sockets: ['AM4', 'AM5', 'LGA1700', 'LGA1851'], height: 155, radiatorSize: null, tdp: 265, ramClearance: 38, fans: 2, rgb: false, noise: 'Up to 25.6 dBA' },
  },
  {
    id: 'cooler-noctua-nhd15', category: 'cooler', name: 'Noctua NH-D15', brand: 'Noctua', price: 5950, availability: 'in-stock',
    specs: { type: 'Air', sockets: ['AM4', 'AM5', 'LGA1700', 'LGA1851'], height: 165, radiatorSize: null, tdp: 250, ramClearance: 36, fans: 2, rgb: false, noise: 'Up to 24.6 dBA' },
  },
  {
    id: 'cooler-bequiet-darkrock5', category: 'cooler', name: 'be quiet! Dark Rock Pro 5', brand: 'be quiet!', price: 6850, availability: 'in-stock',
    specs: { type: 'Air', sockets: ['AM4', 'AM5', 'LGA1700', 'LGA1851'], height: 168, radiatorSize: null, tdp: 270, ramClearance: 42, fans: 2, rgb: false, noise: 'Up to 23.9 dBA' },
  },
  {
    id: 'cooler-nzxt-kraken240', category: 'cooler', name: 'NZXT Kraken 240', brand: 'NZXT', price: 7450, availability: 'in-stock',
    specs: { type: 'Liquid', sockets: ['AM4', 'AM5', 'LGA1700', 'LGA1851'], height: 60, radiatorSize: 240, tdp: 280, ramClearance: null, fans: 2, rgb: true, noise: 'Up to 30 dBA' },
  },
  {
    id: 'cooler-deepcool-lt720', category: 'cooler', name: 'DeepCool LT720 360', brand: 'DeepCool', price: 6950, availability: 'in-stock',
    specs: { type: 'Liquid', sockets: ['AM4', 'AM5', 'LGA1700', 'LGA1851'], height: 60, radiatorSize: 360, tdp: 300, ramClearance: null, fans: 3, rgb: true, noise: 'Up to 32 dBA' },
  },
  {
    id: 'cooler-lianli-galahad280', category: 'cooler', name: 'Lian Li Galahad II 280', brand: 'Lian Li', price: 8200, availability: 'in-stock',
    specs: { type: 'Liquid', sockets: ['AM4', 'AM5', 'LGA1700', 'LGA1851'], height: 60, radiatorSize: 280, tdp: 300, ramClearance: null, fans: 2, rgb: true, noise: 'Up to 30 dBA' },
  },
  {
    id: 'cooler-corsair-h150i', category: 'cooler', name: 'Corsair iCUE H150i Elite 360', brand: 'Corsair', price: 11500, availability: 'in-stock',
    specs: { type: 'Liquid', sockets: ['AM4', 'AM5', 'LGA1700', 'LGA1851'], height: 60, radiatorSize: 360, tdp: 350, ramClearance: null, fans: 3, rgb: true, noise: 'Up to 34 dBA' },
  },
  {
    id: 'cooler-arctic-lf3-420', category: 'cooler', name: 'Arctic Liquid Freezer III 420', brand: 'Arctic', price: 9900, availability: 'preorder',
    specs: { type: 'Liquid', sockets: ['AM4', 'AM5', 'LGA1700', 'LGA1851'], height: 60, radiatorSize: 420, tdp: 400, ramClearance: null, fans: 3, rgb: true, noise: 'Up to 33 dBA' },
  },

  {
    id: 'fans-arctic-p12-3', category: 'fans', name: 'Arctic P12 PWM 120mm (3-Pack)', brand: 'Arctic', price: 1450, availability: 'in-stock',
    specs: { size: 120, count: 3, airflow: 56.3, noise: 22.5, rgb: false, connector: '4-pin PWM' },
  },
  {
    id: 'fans-thermalright-c12c-3', category: 'fans', name: 'Thermalright TL-C12C 120mm (3-Pack)', brand: 'Thermalright', price: 1050, availability: 'in-stock',
    specs: { size: 120, count: 3, airflow: 66, noise: 25.6, rgb: false, connector: '4-pin PWM' },
  },
  {
    id: 'fans-cm-sickleflow-3', category: 'fans', name: 'Cooler Master SickleFlow ARGB 120mm (3-Pack)', brand: 'Cooler Master', price: 1650, availability: 'in-stock',
    specs: { size: 120, count: 3, airflow: 62, noise: 27, rgb: true, connector: '4-pin PWM + ARGB' },
  },
  {
    id: 'fans-corsair-ql140-2', category: 'fans', name: 'Corsair QL140 RGB 140mm (2-Pack)', brand: 'Corsair', price: 3950, availability: 'in-stock',
    specs: { size: 140, count: 2, airflow: 50.2, noise: 26, rgb: true, connector: '4-pin PWM + ARGB' },
  },
  {
    id: 'fans-arctic-p14-5', category: 'fans', name: 'Arctic P14 PWM 140mm (5-Pack)', brand: 'Arctic', price: 2650, availability: 'in-stock',
    specs: { size: 140, count: 5, airflow: 72.8, noise: 22.5, rgb: false, connector: '4-pin PWM' },
  },
  {
    id: 'fans-lianli-sl120-3', category: 'fans', name: 'Lian Li UNI Fan SL120 V2 (3-Pack)', brand: 'Lian Li', price: 4850, availability: 'low-stock',
    specs: { size: 120, count: 3, airflow: 64, noise: 28.5, rgb: true, connector: '4-pin PWM + ARGB' },
  },
  {
    id: 'fans-noctua-a12x25-2', category: 'fans', name: 'Noctua NF-A12x25 PWM (2-Pack)', brand: 'Noctua', price: 4650, availability: 'in-stock',
    specs: { size: 120, count: 2, airflow: 60.1, noise: 22.6, rgb: false, connector: '4-pin PWM' },
  },
];

export const HARDWARE_BY_ID = Object.fromEntries(HARDWARE.map((item) => [item.id, item]));

export const BRANDS = [...new Set(HARDWARE.map((item) => item.brand))].sort((a, b) => a.localeCompare(b));

export const AVAILABILITY = {
  'in-stock': { label: 'In stock', tone: 'ok' },
  'low-stock': { label: 'Low stock', tone: 'warn' },
  preorder: { label: 'Pre-order', tone: 'info' },
};

export function getHardware(id) {
  return HARDWARE_BY_ID[id] || null;
}

export function itemsByCategory(category) {
  return HARDWARE.filter((item) => item.category === category);
}

export function categoryMeta(category) {
  return CATEGORIES.find((c) => c.id === category) || null;
}

export const TOTAL_COMPONENTS = HARDWARE.length;
export const TOTAL_BRANDS = BRANDS.length;
