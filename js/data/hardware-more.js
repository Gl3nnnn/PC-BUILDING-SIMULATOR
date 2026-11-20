// Second half of the hardware catalogue. Kept in its own module so the main
// list stays readable; hardware.js merges the two into one array.

export const EXTRA_HARDWARE = [
  // ---------------------------------------------------------------- CPUs
  {
    id: 'cpu-i3-13100f', category: 'cpu', name: 'Intel Core i3-13100F', brand: 'Intel', price: 6100, availability: 'in-stock',
    specs: { socket: 'LGA1700', chipsets: ['H610', 'B660', 'B760', 'Z690', 'Z790'], cores: 4, threads: 8, baseClock: 3.4, boostClock: 4.5, tdp: 58, peakPower: 89, iGPU: null, igpuScore: 0, memoryTypes: ['DDR4', 'DDR5'], memorySpeed: 4800, includedCooler: true, unlocked: false, cache: '12 MB L3' },
    score: 39, tags: ['budget', 'entry gaming'],
  },
  {
    id: 'cpu-i5-12600kf', category: 'cpu', name: 'Intel Core i5-12600KF', brand: 'Intel', price: 13200, availability: 'in-stock',
    specs: { socket: 'LGA1700', chipsets: ['B660', 'B760', 'Z690', 'Z790'], cores: 10, threads: 16, baseClock: 3.7, boostClock: 4.9, tdp: 125, peakPower: 150, iGPU: null, igpuScore: 0, memoryTypes: ['DDR4', 'DDR5'], memorySpeed: 4800, includedCooler: false, unlocked: true, cache: '20 MB L3' },
    score: 70, tags: ['gaming', 'overclocking', 'value'],
  },
  {
    id: 'cpu-i5-14400f', category: 'cpu', name: 'Intel Core i5-14400F', brand: 'Intel', price: 12100, availability: 'in-stock',
    specs: { socket: 'LGA1700', chipsets: ['H610', 'B660', 'B760', 'Z690', 'Z790'], cores: 10, threads: 16, baseClock: 2.5, boostClock: 4.7, tdp: 65, peakPower: 148, iGPU: null, igpuScore: 0, memoryTypes: ['DDR4', 'DDR5'], memorySpeed: 4800, includedCooler: true, unlocked: false, cache: '20 MB L3' },
    score: 63, tags: ['gaming', 'value', 'quiet'],
  },
  {
    id: 'cpu-i7-12700f', category: 'cpu', name: 'Intel Core i7-12700F', brand: 'Intel', price: 18900, availability: 'in-stock',
    specs: { socket: 'LGA1700', chipsets: ['B660', 'B760', 'Z690', 'Z790'], cores: 12, threads: 20, baseClock: 2.1, boostClock: 4.9, tdp: 65, peakPower: 180, iGPU: null, igpuScore: 0, memoryTypes: ['DDR4', 'DDR5'], memorySpeed: 4800, includedCooler: true, unlocked: false, cache: '25 MB L3' },
    score: 78, tags: ['gaming', 'streaming', 'productivity'],
  },
  {
    id: 'cpu-r5-5600x3d', category: 'cpu', name: 'AMD Ryzen 5 5600X3D', brand: 'AMD', price: 13400, availability: 'low-stock',
    specs: { socket: 'AM4', chipsets: ['A520', 'B550', 'X570'], cores: 6, threads: 12, baseClock: 3.3, boostClock: 4.4, tdp: 105, peakPower: 118, iGPU: null, igpuScore: 0, memoryTypes: ['DDR4'], memorySpeed: 3200, includedCooler: false, unlocked: false, cache: '96 MB 3D V-Cache' },
    score: 66, tags: ['gaming', 'high refresh', 'cache'],
  },
  {
    id: 'cpu-r5-8400f', category: 'cpu', name: 'AMD Ryzen 5 8400F', brand: 'AMD', price: 10200, availability: 'in-stock',
    specs: { socket: 'AM5', chipsets: ['A620', 'B650', 'B650E', 'B850', 'X670', 'X670E', 'X870', 'X870E'], cores: 6, threads: 12, baseClock: 4.2, boostClock: 4.7, tdp: 65, peakPower: 88, iGPU: null, igpuScore: 0, memoryTypes: ['DDR5'], memorySpeed: 5200, includedCooler: true, unlocked: true, cache: '16 MB L3' },
    score: 58, tags: ['budget', 'gaming', 'value'],
  },
  {
    id: 'cpu-r5-9600x', category: 'cpu', name: 'AMD Ryzen 5 9600X', brand: 'AMD', price: 17800, availability: 'in-stock',
    specs: { socket: 'AM5', chipsets: ['A620', 'B650', 'B650E', 'B850', 'X670', 'X670E', 'X870', 'X870E'], cores: 6, threads: 12, baseClock: 3.9, boostClock: 5.4, tdp: 65, peakPower: 88, iGPU: 'AMD RDNA 2 (2 CU)', igpuScore: 8, memoryTypes: ['DDR5'], memorySpeed: 5600, includedCooler: false, unlocked: true, cache: '32 MB L3' },
    score: 78, tags: ['gaming', 'efficient', 'zen 5'],
  },
  {
    id: 'cpu-r7-7700', category: 'cpu', name: 'AMD Ryzen 7 7700', brand: 'AMD', price: 17600, availability: 'in-stock',
    specs: { socket: 'AM5', chipsets: ['A620', 'B650', 'B650E', 'B850', 'X670', 'X670E', 'X870', 'X870E'], cores: 8, threads: 16, baseClock: 3.8, boostClock: 5.3, tdp: 65, peakPower: 88, iGPU: 'AMD RDNA 2 (2 CU)', igpuScore: 8, memoryTypes: ['DDR5'], memorySpeed: 5200, includedCooler: true, unlocked: true, cache: '32 MB L3' },
    score: 82, tags: ['gaming', 'efficient', 'quiet'],
  },
  {
    id: 'cpu-r7-9700x', category: 'cpu', name: 'AMD Ryzen 7 9700X', brand: 'AMD', price: 24500, availability: 'in-stock',
    specs: { socket: 'AM5', chipsets: ['B650', 'B650E', 'B850', 'X670', 'X670E', 'X870', 'X870E'], cores: 8, threads: 16, baseClock: 3.8, boostClock: 5.5, tdp: 65, peakPower: 88, iGPU: 'AMD RDNA 2 (2 CU)', igpuScore: 8, memoryTypes: ['DDR5'], memorySpeed: 5600, includedCooler: false, unlocked: true, cache: '32 MB L3' },
    score: 88, tags: ['gaming', 'productivity', 'zen 5'],
  },
  {
    id: 'cpu-r9-7900x', category: 'cpu', name: 'AMD Ryzen 9 7900X', brand: 'AMD', price: 26500, availability: 'in-stock',
    specs: { socket: 'AM5', chipsets: ['B650', 'B650E', 'B850', 'X670', 'X670E', 'X870', 'X870E'], cores: 12, threads: 24, baseClock: 4.7, boostClock: 5.6, tdp: 170, peakPower: 230, iGPU: 'AMD RDNA 2 (2 CU)', igpuScore: 8, memoryTypes: ['DDR5'], memorySpeed: 5200, includedCooler: false, unlocked: true, cache: '64 MB L3' },
    score: 92, tags: ['productivity', 'rendering', 'streaming'],
  },
  {
    id: 'cpu-ultra5-245k', category: 'cpu', name: 'Intel Core Ultra 5 245K', brand: 'Intel', price: 21900, availability: 'in-stock',
    specs: { socket: 'LGA1851', chipsets: ['B860', 'Z890'], cores: 14, threads: 14, baseClock: 4.2, boostClock: 5.2, tdp: 125, peakPower: 159, iGPU: 'Intel Xe (4-core)', igpuScore: 7, memoryTypes: ['DDR5'], memorySpeed: 6400, includedCooler: false, unlocked: true, cache: '24 MB L3' },
    score: 82, tags: ['gaming', 'productivity', 'arrow lake'],
  },

  // -------------------------------------------------------- Motherboards
  {
    id: 'mb-asus-prime-b760m-a-d5', category: 'motherboard', name: 'ASUS Prime B760M-A D5', brand: 'ASUS', price: 8900, availability: 'in-stock',
    specs: { socket: 'LGA1700', chipset: 'B760', formFactor: 'Micro-ATX', memoryTypes: ['DDR5'], memorySlots: 4, maxMemory: 128, maxMemorySpeed: 7200, m2Slots: 3, m2Gen: 4, sataPorts: 4, wifi: false, pcieGen: 4, powerStages: '8+1 phase', audio: 'Realtek ALC897' },
  },
  {
    id: 'mb-asus-prime-h610m-e', category: 'motherboard', name: 'ASUS Prime H610M-E D4', brand: 'ASUS', price: 4200, availability: 'in-stock',
    specs: { socket: 'LGA1700', chipset: 'H610', formFactor: 'Micro-ATX', memoryTypes: ['DDR4'], memorySlots: 2, maxMemory: 64, maxMemorySpeed: 3200, m2Slots: 1, m2Gen: 3, sataPorts: 4, wifi: false, pcieGen: 4, powerStages: '4+1 phase', audio: 'Realtek ALC897' },
  },
  {
    id: 'mb-gigabyte-b760m-ds3h', category: 'motherboard', name: 'Gigabyte B760M DS3H AX', brand: 'Gigabyte', price: 7400, availability: 'in-stock',
    specs: { socket: 'LGA1700', chipset: 'B760', formFactor: 'Micro-ATX', memoryTypes: ['DDR5'], memorySlots: 4, maxMemory: 192, maxMemorySpeed: 7600, m2Slots: 2, m2Gen: 4, sataPorts: 4, wifi: true, pcieGen: 4, powerStages: '6+2+1 phase', audio: 'Realtek ALC897' },
  },
  {
    id: 'mb-msi-pro-h610m-e', category: 'motherboard', name: 'MSI PRO H610M-E DDR4', brand: 'MSI', price: 3950, availability: 'in-stock',
    specs: { socket: 'LGA1700', chipset: 'H610', formFactor: 'Micro-ATX', memoryTypes: ['DDR4'], memorySlots: 2, maxMemory: 64, maxMemorySpeed: 3200, m2Slots: 1, m2Gen: 3, sataPorts: 4, wifi: false, pcieGen: 4, powerStages: '4+1 phase', audio: 'Realtek ALC897' },
  },
  {
    id: 'mb-asrock-b650m-hdv', category: 'motherboard', name: 'ASRock B650M-HDV/M.2', brand: 'ASRock', price: 7450, availability: 'in-stock',
    specs: { socket: 'AM5', chipset: 'B650', formFactor: 'Micro-ATX', memoryTypes: ['DDR5'], memorySlots: 2, maxMemory: 96, maxMemorySpeed: 6400, m2Slots: 2, m2Gen: 4, sataPorts: 4, wifi: false, pcieGen: 4, powerStages: '8+2+1 phase', audio: 'Realtek ALC897' },
  },
  {
    id: 'mb-gigabyte-b650-aorus-elite', category: 'motherboard', name: 'Gigabyte B650 AORUS Elite AX', brand: 'Gigabyte', price: 12800, availability: 'in-stock',
    specs: { socket: 'AM5', chipset: 'B650', formFactor: 'ATX', memoryTypes: ['DDR5'], memorySlots: 4, maxMemory: 192, maxMemorySpeed: 7600, m2Slots: 3, m2Gen: 5, sataPorts: 4, wifi: true, pcieGen: 4, powerStages: '12+2+1 phase', audio: 'Realtek ALC1220' },
  },
  {
    id: 'mb-asus-tuf-b850-plus', category: 'motherboard', name: 'ASUS TUF Gaming B850-PLUS WIFI', brand: 'ASUS', price: 16500, availability: 'in-stock',
    specs: { socket: 'AM5', chipset: 'B850', formFactor: 'ATX', memoryTypes: ['DDR5'], memorySlots: 4, maxMemory: 192, maxMemorySpeed: 8000, m2Slots: 4, m2Gen: 5, sataPorts: 4, wifi: true, pcieGen: 5, powerStages: '14+2+2 phase', audio: 'Realtek ALC1220P' },
  },
  {
    id: 'mb-gigabyte-x870-aorus-elite', category: 'motherboard', name: 'Gigabyte X870 AORUS Elite WIFI7', brand: 'Gigabyte', price: 21500, availability: 'in-stock',
    specs: { socket: 'AM5', chipset: 'X870', formFactor: 'ATX', memoryTypes: ['DDR5'], memorySlots: 4, maxMemory: 192, maxMemorySpeed: 8200, m2Slots: 4, m2Gen: 5, sataPorts: 4, wifi: true, pcieGen: 5, powerStages: '16+2+2 phase', audio: 'Realtek ALC1220' },
  },
  {
    id: 'mb-msi-mag-x870e-carbon', category: 'motherboard', name: 'MSI MPG X870E Carbon WIFI', brand: 'MSI', price: 32500, availability: 'low-stock',
    specs: { socket: 'AM5', chipset: 'X870E', formFactor: 'ATX', memoryTypes: ['DDR5'], memorySlots: 4, maxMemory: 192, maxMemorySpeed: 8400, m2Slots: 5, m2Gen: 5, sataPorts: 4, wifi: true, pcieGen: 5, powerStages: '18+2+1 phase', audio: 'Realtek ALC4082' },
  },
  {
    id: 'mb-msi-z890-edge', category: 'motherboard', name: 'MSI MPG Z890 Edge TI WIFI', brand: 'MSI', price: 24500, availability: 'in-stock',
    specs: { socket: 'LGA1851', chipset: 'Z890', formFactor: 'ATX', memoryTypes: ['DDR5'], memorySlots: 4, maxMemory: 256, maxMemorySpeed: 8400, m2Slots: 4, m2Gen: 5, sataPorts: 4, wifi: true, pcieGen: 5, powerStages: '16+1+1 phase', audio: 'Realtek ALC1220P' },
  },
  {
    id: 'mb-asrock-b860m-pro', category: 'motherboard', name: 'ASRock B860M Pro-A WIFI', brand: 'ASRock', price: 11800, availability: 'in-stock',
    specs: { socket: 'LGA1851', chipset: 'B860', formFactor: 'Micro-ATX', memoryTypes: ['DDR5'], memorySlots: 4, maxMemory: 192, maxMemorySpeed: 7600, m2Slots: 3, m2Gen: 4, sataPorts: 4, wifi: true, pcieGen: 5, powerStages: '10+1+1 phase', audio: 'Realtek ALC897' },
  },

  // --------------------------------------------------------- Graphics cards
  {
    id: 'gpu-rtx-4050', category: 'gpu', name: 'NVIDIA GeForce RTX 4050 6GB', brand: 'NVIDIA', price: 12500, availability: 'in-stock',
    specs: { chip: 'AD107', vram: 6, memoryType: 'GDDR6', length: 190, tdp: 95, powerConnectors: '1A- 8-pin', boostClock: 2565, ports: '1A- HDMI 2.1, 3A- DP 1.4a' },
    score: 15, tags: ['entry', '1080p', 'efficient'],
  },
  {
    id: 'gpu-rtx-3070', category: 'gpu', name: 'NVIDIA GeForce RTX 3070 8GB', brand: 'NVIDIA', price: 21900, availability: 'low-stock',
    specs: { chip: 'GA104', vram: 8, memoryType: 'GDDR6', length: 242, tdp: 220, powerConnectors: '1A- 8-pin', boostClock: 1725, ports: '1A- HDMI 2.1, 3A- DP 1.4a' },
    score: 28, tags: ['1440p', 'gaming'],
  },
  {
    id: 'gpu-rtx-3080', category: 'gpu', name: 'NVIDIA GeForce RTX 3080 10GB', brand: 'NVIDIA', price: 31500, availability: 'low-stock',
    specs: { chip: 'GA102', vram: 10, memoryType: 'GDDR6X', length: 285, tdp: 320, powerConnectors: '2A- 8-pin', boostClock: 1710, ports: '1A- HDMI 2.1, 3A- DP 1.4a' },
    score: 35, tags: ['1440p', 'gaming', 'high refresh'],
  },
  {
    id: 'gpu-rtx-2080ti', category: 'gpu', name: 'NVIDIA GeForce RTX 2080 Ti 11GB', brand: 'NVIDIA', price: 19900, availability: 'low-stock',
    specs: { chip: 'TU102', vram: 11, memoryType: 'GDDR6', length: 267, tdp: 250, powerConnectors: '2A- 8-pin', boostClock: 1545, ports: '1A- HDMI 2.0b, 3A- DP 1.4' },
    score: 26, tags: ['1440p', 'used', 'value'],
  },
  {
    id: 'gpu-rtx-5090', category: 'gpu', name: 'NVIDIA GeForce RTX 5090 32GB', brand: 'NVIDIA', price: 129000, availability: 'preorder',
    specs: { chip: 'GB202', vram: 32, memoryType: 'GDDR7', length: 304, tdp: 575, powerConnectors: '1A- 16-pin (12V-2x6)', boostClock: 2407, ports: '1A- HDMI 2.1b, 3A- DP 2.1b' },
    score: 62, tags: ['4k', 'ai', 'flagship'],
  },
  {
    id: 'gpu-msi-suprim-5090', category: 'gpu', name: 'MSI GeForce RTX 5090 SUPRIM SOC', brand: 'MSI', price: 145000, availability: 'preorder',
    specs: { chip: 'GB202', vram: 32, memoryType: 'GDDR7', length: 340, tdp: 600, powerConnectors: '1A- 16-pin (12V-2x6)', boostClock: 2565, ports: '1A- HDMI 2.1b, 3A- DP 2.1b' },
    score: 63, tags: ['4k', 'flagship', 'premium'],
  },
  {
    id: 'gpu-asus-tuf-5080', category: 'gpu', name: 'ASUS TUF Gaming RTX 5080 OC 16GB', brand: 'ASUS', price: 76000, availability: 'preorder',
    specs: { chip: 'GB203', vram: 16, memoryType: 'GDDR7', length: 320, tdp: 360, powerConnectors: '1A- 16-pin (12V-2x6)', boostClock: 2730, ports: '1A- HDMI 2.1b, 3A- DP 2.1b' },
    score: 53, tags: ['4k', 'gaming', 'oc'],
  },
  {
    id: 'gpu-asus-prime-5070', category: 'gpu', name: 'ASUS Prime GeForce RTX 5070 12GB', brand: 'ASUS', price: 34500, availability: 'in-stock',
    specs: { chip: 'GB205', vram: 12, memoryType: 'GDDR7', length: 262, tdp: 250, powerConnectors: '1A- 16-pin (12V-2x6)', boostClock: 2512, ports: '1A- HDMI 2.1b, 3A- DP 2.1b' },
    score: 40, tags: ['1440p', 'gaming', 'value'],
  },
  {
    id: 'gpu-gigabyte-4060ti-eagle', category: 'gpu', name: 'Gigabyte RTX 4060 Ti Eagle OC 8GB', brand: 'Gigabyte', price: 25900, availability: 'in-stock',
    specs: { chip: 'AD106', vram: 8, memoryType: 'GDDR6', length: 281, tdp: 160, powerConnectors: '1A- 8-pin', boostClock: 2580, ports: '1A- HDMI 2.1, 3A- DP 1.4a' },
    score: 26, tags: ['1440p', 'entry', 'windforce'],
  },
  {
    id: 'gpu-zotac-4060ti', category: 'gpu', name: 'Zotac Gaming RTX 4060 Ti Twin Edge', brand: 'Zotac', price: 24500, availability: 'in-stock',
    specs: { chip: 'AD106', vram: 8, memoryType: 'GDDR6', length: 220, tdp: 160, powerConnectors: '1A- 8-pin', boostClock: 2535, ports: '1A- HDMI 2.1, 3A- DP 1.4a' },
    score: 26, tags: ['compact', '1440p', 'itx'],
  },
  {
    id: 'gpu-rx-6750xt', category: 'gpu', name: 'AMD Radeon RX 6750 XT 12GB', brand: 'AMD', price: 21900, availability: 'in-stock',
    specs: { chip: 'Navi 22', vram: 12, memoryType: 'GDDR6', length: 267, tdp: 250, powerConnectors: '2A- 8-pin', boostClock: 2600, ports: '1A- HDMI 2.1, 3A- DP 1.4a' },
    score: 27, tags: ['1440p', 'value', '16 gb class'],
  },
  {
    id: 'gpu-rx-9060xt', category: 'gpu', name: 'AMD Radeon RX 9060 XT 16GB', brand: 'AMD', price: 28500, availability: 'in-stock',
    specs: { chip: 'Navi 44', vram: 16, memoryType: 'GDDR6', length: 240, tdp: 182, powerConnectors: '1A- 8-pin', boostClock: 3130, ports: '1A- HDMI 2.1b, 2A- DP 2.1a' },
    score: 32, tags: ['1440p', 'gaming', 'new'],
  },
  {
    id: 'gpu-rx-9070', category: 'gpu', name: 'AMD Radeon RX 9070 16GB', brand: 'AMD', price: 42500, availability: 'in-stock',
    specs: { chip: 'Navi 48', vram: 16, memoryType: 'GDDR6', length: 280, tdp: 220, powerConnectors: '2A- 8-pin', boostClock: 2520, ports: '1A- HDMI 2.1b, 3A- DP 2.1a' },
    score: 42, tags: ['1440p', '4k', 'rdna 4'],
  },
  {
    id: 'gpu-rx-7900xt', category: 'gpu', name: 'AMD Radeon RX 7900 XT 20GB', brand: 'AMD', price: 52000, availability: 'low-stock',
    specs: { chip: 'Navi 31', vram: 20, memoryType: 'GDDR6', length: 288, tdp: 315, powerConnectors: '2A- 8-pin', boostClock: 2394, ports: '1A- HDMI 2.1, 3A- DP 2.1' },
    score: 44, tags: ['4k', 'gaming', '20 gb'],
  },
  {
    id: 'gpu-gigabyte-aorus-9070xt', category: 'gpu', name: 'Gigabyte AORUS RX 9070 XT Elite', brand: 'Gigabyte', price: 52500, availability: 'low-stock',
    specs: { chip: 'Navi 48', vram: 16, memoryType: 'GDDR6', length: 335, tdp: 330, powerConnectors: '2A- 8-pin', boostClock: 3100, ports: '1A- HDMI 2.1b, 3A- DP 2.1a' },
    score: 51, tags: ['4k', 'gaming', 'rgb'],
  },
  {
    id: 'gpu-sapphire-pure-9070xt', category: 'gpu', name: 'Sapphire Pure RX 9070 XT 16GB', brand: 'Sapphire', price: 48900, availability: 'in-stock',
    specs: { chip: 'Navi 48', vram: 16, memoryType: 'GDDR6', length: 300, tdp: 304, powerConnectors: '2A- 8-pin', boostClock: 3010, ports: '1A- HDMI 2.1b, 3A- DP 2.1a' },
    score: 50, tags: ['4k', 'gaming', 'quiet'],
  },
  {
    id: 'gpu-asrock-challenger-9070', category: 'gpu', name: 'ASRock Challenger RX 9070 16GB', brand: 'ASRock', price: 39900, availability: 'in-stock',
    specs: { chip: 'Navi 48', vram: 16, memoryType: 'GDDR6', length: 270, tdp: 220, powerConnectors: '2A- 8-pin', boostClock: 2500, ports: '1A- HDMI 2.1b, 3A- DP 2.1a' },
    score: 41, tags: ['1440p', 'value', 'rdna 4'],
  },
  {
    id: 'gpu-sapphire-pulse-7600', category: 'gpu', name: 'Sapphire Pulse RX 7600 8GB', brand: 'Sapphire', price: 15900, availability: 'in-stock',
    specs: { chip: 'Navi 33', vram: 8, memoryType: 'GDDR6', length: 240, tdp: 165, powerConnectors: '1A- 8-pin', boostClock: 2695, ports: '1A- HDMI 2.1, 3A- DP 1.4a' },
    score: 19, tags: ['1080p', 'gaming', 'value'],
  },
  {
    id: 'gpu-intel-arc-b580', category: 'gpu', name: 'Intel Arc B580 12GB', brand: 'Intel', price: 19500, availability: 'in-stock',
    specs: { chip: 'BMG-G21', vram: 12, memoryType: 'GDDR6', length: 272, tdp: 190, powerConnectors: '1A- 8-pin', boostClock: 2670, ports: '1A- HDMI 2.1, 3A- DP 2.1' },
    score: 24, tags: ['1440p', 'value', '12 gb'],
  },
  {
    id: 'gpu-intel-arc-b570', category: 'gpu', name: 'Intel Arc B570 10GB', brand: 'Intel', price: 14900, availability: 'in-stock',
    specs: { chip: 'BMG-G21', vram: 10, memoryType: 'GDDR6', length: 249, tdp: 150, powerConnectors: '1A- 8-pin', boostClock: 2500, ports: '1A- HDMI 2.1, 3A- DP 2.1' },
    score: 19, tags: ['1080p', 'entry', 'value'],
  },

  // --------------------------------------------------------------- Memory
  {
    id: 'ram-fury-8-3200', category: 'ram', name: 'Kingston Fury Beast 8GB DDR4-3200', brand: 'Kingston', price: 1350, availability: 'in-stock',
    specs: { type: 'DDR4', capacity: 8, modules: 1, speed: 3200, cl: 16, height: 34, rgb: false, voltage: '1.35 V' },
  },
  {
    id: 'ram-vengeance-16-3600', category: 'ram', name: 'Corsair Vengeance RGB RS 16GB DDR4-3600', brand: 'Corsair', price: 3250, availability: 'in-stock',
    specs: { type: 'DDR4', capacity: 16, modules: 2, speed: 3600, cl: 18, height: 45, rgb: true, voltage: '1.35 V' },
  },
  {
    id: 'ram-samsung-16-4800', category: 'ram', name: 'Samsung DDR5-4800 16GB UDIMM', brand: 'Samsung', price: 2950, availability: 'in-stock',
    specs: { type: 'DDR5', capacity: 16, modules: 2, speed: 4800, cl: 40, height: 32, rgb: false, voltage: '1.1 V' },
  },
  {
    id: 'ram-corsair-dominator-32-6000', category: 'ram', name: 'Corsair Dominator Titanium 32GB DDR5-6000', brand: 'Corsair', price: 8900, availability: 'in-stock',
    specs: { type: 'DDR5', capacity: 32, modules: 2, speed: 6000, cl: 30, height: 45, rgb: true, voltage: '1.35 V' },
  },
  {
    id: 'ram-fury-32-6000', category: 'ram', name: 'Kingston Fury Beast 32GB DDR5-6000', brand: 'Kingston', price: 5400, availability: 'in-stock',
    specs: { type: 'DDR5', capacity: 32, modules: 2, speed: 6000, cl: 36, height: 35, rgb: false, voltage: '1.35 V' },
  },
  {
    id: 'ram-klevv-crb-16-6000', category: 'ram', name: 'Klevv CRAS V RGB 16GB DDR5-6000', brand: 'Klevv', price: 3650, availability: 'in-stock',
    specs: { type: 'DDR5', capacity: 16, modules: 2, speed: 6000, cl: 30, height: 44, rgb: true, voltage: '1.35 V' },
  },
  {
    id: 'ram-klevv-64-5600', category: 'ram', name: 'Klevv CRAS V 64GB DDR5-5600', brand: 'Klevv', price: 11500, availability: 'low-stock',
    specs: { type: 'DDR5', capacity: 64, modules: 2, speed: 5600, cl: 46, height: 34, rgb: false, voltage: '1.25 V' },
  },
  {
    id: 'ram-crucial-pro-64-5600', category: 'ram', name: 'Crucial Pro 64GB DDR5-5600', brand: 'Crucial', price: 9800, availability: 'in-stock',
    specs: { type: 'DDR5', capacity: 64, modules: 2, speed: 5600, cl: 46, height: 32, rgb: false, voltage: '1.1 V' },
  },
  {
    id: 'ram-gskill-flare-x5-32-6000', category: 'ram', name: 'G.Skill Flare X5 32GB DDR5-6000', brand: 'G.Skill', price: 5100, availability: 'in-stock',
    specs: { type: 'DDR5', capacity: 32, modules: 2, speed: 6000, cl: 30, height: 35, rgb: false, voltage: '1.35 V' },
  },
  {
    id: 'ram-gskill-ripjaws-32-3600', category: 'ram', name: 'G.Skill Ripjaws V 32GB DDR4-3600', brand: 'G.Skill', price: 4650, availability: 'in-stock',
    specs: { type: 'DDR4', capacity: 32, modules: 2, speed: 3600, cl: 18, height: 42, rgb: false, voltage: '1.35 V' },
  },
  {
    id: 'ram-teamgroup-tcreate-32-7000', category: 'ram', name: 'TeamGroup T-Force Delta 32GB DDR5-7000', brand: 'TeamGroup', price: 6200, availability: 'low-stock',
    specs: { type: 'DDR5', capacity: 32, modules: 2, speed: 7000, cl: 34, height: 46, rgb: true, voltage: '1.4 V' },
  },
  {
    id: 'ram-lexar-ares-32-6000', category: 'ram', name: 'Lexar Ares RGB 32GB DDR5-6000', brand: 'Lexar', price: 4900, availability: 'in-stock',
    specs: { type: 'DDR5', capacity: 32, modules: 2, speed: 6000, cl: 32, height: 44, rgb: true, voltage: '1.35 V' },
  },
  {
    id: 'ram-patriot-viper-32-6000', category: 'ram', name: 'Patriot Viper Venom 32GB DDR5-6000', brand: 'Patriot', price: 4950, availability: 'in-stock',
    specs: { type: 'DDR5', capacity: 32, modules: 2, speed: 6000, cl: 36, height: 42, rgb: true, voltage: '1.35 V' },
  },
  {
    id: 'ram-xpg-lancer-32-6000', category: 'ram', name: 'ADATA XPG Lancer 32GB DDR5-6000', brand: 'ADATA', price: 4700, availability: 'in-stock',
    specs: { type: 'DDR5', capacity: 32, modules: 2, speed: 6000, cl: 30, height: 40, rgb: false, voltage: '1.35 V' },
  },

  // -------------------------------------------------------------- Storage
  {
    id: 'ssd-samsung-9100pro-2tb', category: 'storage', name: 'Samsung 9100 PRO 2TB PCIe 5.0 NVMe', brand: 'Samsung', price: 12900, availability: 'in-stock',
    specs: { type: 'NVMe SSD', interface: 'PCIe 5.0 x4', form: 'M.2 2280', capacityGB: 2000, read: 14800, write: 13400, pcieGen: 5, rpm: null },
  },
  {
    id: 'ssd-samsung-990evo-1tb', category: 'storage', name: 'Samsung 990 EVO 1TB NVMe', brand: 'Samsung', price: 4350, availability: 'in-stock',
    specs: { type: 'NVMe SSD', interface: 'PCIe 4.0 x4', form: 'M.2 2280', capacityGB: 1000, read: 5000, write: 4200, pcieGen: 4, rpm: null },
  },
  {
    id: 'ssd-samsung-870evo-1tb', category: 'storage', name: 'Samsung 870 EVO 1TB SATA SSD', brand: 'Samsung', price: 4250, availability: 'in-stock',
    specs: { type: 'SATA SSD', interface: 'SATA', form: '2.5-inch', capacityGB: 1000, read: 560, write: 530, pcieGen: null, rpm: null },
  },
  {
    id: 'ssd-crucial-p310-1tb', category: 'storage', name: 'Crucial P310 1TB PCIe 4.0 NVMe', brand: 'Crucial', price: 3450, availability: 'in-stock',
    specs: { type: 'NVMe SSD', interface: 'PCIe 4.0 x4', form: 'M.2 2280', capacityGB: 1000, read: 7100, write: 6300, pcieGen: 4, rpm: null },
  },
  {
    id: 'ssd-crucial-mx500-2tb', category: 'storage', name: 'Crucial MX500 2TB SATA SSD', brand: 'Crucial', price: 6450, availability: 'in-stock',
    specs: { type: 'SATA SSD', interface: 'SATA', form: '2.5-inch', capacityGB: 2000, read: 560, write: 510, pcieGen: null, rpm: null },
  },
  {
    id: 'ssd-kingston-kc3000-2tb', category: 'storage', name: 'Kingston KC3000 2TB PCIe 4.0 NVMe', brand: 'Kingston', price: 7900, availability: 'in-stock',
    specs: { type: 'NVMe SSD', interface: 'PCIe 4.0 x4', form: 'M.2 2280', capacityGB: 2000, read: 7000, write: 7000, pcieGen: 4, rpm: null },
  },
  {
    id: 'ssd-kingston-nv2-500gb', category: 'storage', name: 'Kingston NV2 500GB PCIe 4.0 NVMe', brand: 'Kingston', price: 1850, availability: 'in-stock',
    specs: { type: 'NVMe SSD', interface: 'PCIe 4.0 x4', form: 'M.2 2280', capacityGB: 500, read: 3500, write: 2100, pcieGen: 4, rpm: null },
  },
  {
    id: 'ssd-wd-sn770-1tb', category: 'storage', name: 'WD Black SN770 1TB PCIe 4.0 NVMe', brand: 'Western Digital', price: 4150, availability: 'in-stock',
    specs: { type: 'NVMe SSD', interface: 'PCIe 4.0 x4', form: 'M.2 2280', capacityGB: 1000, read: 5150, write: 4900, pcieGen: 4, rpm: null },
  },
  {
    id: 'ssd-lexar-nm790-2tb', category: 'storage', name: 'Lexar NM790 2TB PCIe 4.0 NVMe', brand: 'Lexar', price: 6350, availability: 'in-stock',
    specs: { type: 'NVMe SSD', interface: 'PCIe 4.0 x4', form: 'M.2 2280', capacityGB: 2000, read: 7400, write: 6500, pcieGen: 4, rpm: null },
  },
  {
    id: 'ssd-adata-legend-800-1tb', category: 'storage', name: 'ADATA Legend 800 1TB PCIe 4.0 NVMe', brand: 'ADATA', price: 3250, availability: 'in-stock',
    specs: { type: 'NVMe SSD', interface: 'PCIe 4.0 x4', form: 'M.2 2280', capacityGB: 1000, read: 5000, write: 4500, pcieGen: 4, rpm: null },
  },
  {
    id: 'ssd-teamgroup-mp44-1tb', category: 'storage', name: 'TeamGroup MP44 1TB PCIe 4.0 NVMe', brand: 'TeamGroup', price: 3100, availability: 'in-stock',
    specs: { type: 'NVMe SSD', interface: 'PCIe 4.0 x4', form: 'M.2 2280', capacityGB: 1000, read: 7400, write: 6300, pcieGen: 4, rpm: null },
  },
  {
    id: 'ssd-fanxiang-s101-480gb', category: 'storage', name: 'Fanxiang S101 480GB SATA SSD', brand: 'Fanxiang', price: 1250, availability: 'in-stock',
    specs: { type: 'SATA SSD', interface: 'SATA', form: '2.5-inch', capacityGB: 480, read: 520, write: 460, pcieGen: null, rpm: null },
  },
  {
    id: 'hdd-wd-red-2tb', category: 'storage', name: 'WD Red Plus 2TB NAS HDD', brand: 'Western Digital', price: 4250, availability: 'in-stock',
    specs: { type: 'HDD', interface: 'SATA', form: '3.5-inch', capacityGB: 2000, read: 180, write: 180, pcieGen: null, rpm: 5400 },
  },
  {
    id: 'hdd-seagate-ironwolf-4tb', category: 'storage', name: 'Seagate IronWolf 4TB NAS HDD', brand: 'Seagate', price: 5950, availability: 'in-stock',
    specs: { type: 'HDD', interface: 'SATA', form: '3.5-inch', capacityGB: 4000, read: 202, write: 202, pcieGen: null, rpm: 5400 },
  },
  {
    id: 'hdd-seagate-ironwolf-8tb', category: 'storage', name: 'Seagate IronWolf 8TB NAS HDD', brand: 'Seagate', price: 11900, availability: 'low-stock',
    specs: { type: 'HDD', interface: 'SATA', form: '3.5-inch', capacityGB: 8000, read: 210, write: 210, pcieGen: null, rpm: 7200 },
  },
  {
    id: 'hdd-toshiba-n300-4tb', category: 'storage', name: 'Toshiba N300 4TB NAS HDD', brand: 'Toshiba', price: 5650, availability: 'in-stock',
    specs: { type: 'HDD', interface: 'SATA', form: '3.5-inch', capacityGB: 4000, read: 200, write: 200, pcieGen: null, rpm: 7200 },
  },

  // -------------------------------------------------------- Power supplies
  {
    id: 'psu-msi-a650bn', category: 'psu', name: 'MSI MAG A650BN 650W Bronze', brand: 'MSI', price: 3150, availability: 'in-stock',
    specs: { wattage: 650, efficiency: '80+ Bronze', modular: 'Non-modular', formFactor: 'ATX', length: 140, pcie8pin: 2, twelveVHPWR: false, warranty: '5 years' },
  },
  {
    id: 'psu-nzxt-c750', category: 'psu', name: 'NZXT C750 750W Gold', brand: 'NZXT', price: 6250, availability: 'in-stock',
    specs: { wattage: 750, efficiency: '80+ Gold', modular: 'Fully modular', formFactor: 'ATX', length: 150, pcie8pin: 4, twelveVHPWR: true, warranty: '10 years' },
  },
  {
    id: 'psu-seasonic-focus-gx750', category: 'psu', name: 'Seasonic Focus GX-750 750W Gold', brand: 'Seasonic', price: 6350, availability: 'in-stock',
    specs: { wattage: 750, efficiency: '80+ Gold', modular: 'Fully modular', formFactor: 'ATX', length: 140, pcie8pin: 4, twelveVHPWR: false, warranty: '10 years' },
  },
  {
    id: 'psu-corsair-rm1000e', category: 'psu', name: 'Corsair RM1000e 1000W Gold', brand: 'Corsair', price: 9850, availability: 'in-stock',
    specs: { wattage: 1000, efficiency: '80+ Gold', modular: 'Fully modular', formFactor: 'ATX', length: 140, pcie8pin: 4, twelveVHPWR: true, warranty: '7 years' },
  },
  {
    id: 'psu-asus-prime-750', category: 'psu', name: 'ASUS Prime 750W Gold', brand: 'ASUS', price: 6150, availability: 'in-stock',
    specs: { wattage: 750, efficiency: '80+ Gold', modular: 'Fully modular', formFactor: 'ATX', length: 140, pcie8pin: 3, twelveVHPWR: true, warranty: '10 years' },
  },
  {
    id: 'psu-gigabyte-ud750gm', category: 'psu', name: 'Gigabyte UD750GM 750W Gold', brand: 'Gigabyte', price: 5850, availability: 'in-stock',
    specs: { wattage: 750, efficiency: '80+ Gold', modular: 'Fully modular', formFactor: 'ATX', length: 140, pcie8pin: 3, twelveVHPWR: false, warranty: '5 years' },
  },
  {
    id: 'psu-fsp-hydro-gt-850', category: 'psu', name: 'FSP Hydro GT Pro 850W Gold', brand: 'FSP', price: 6450, availability: 'in-stock',
    specs: { wattage: 850, efficiency: '80+ Gold', modular: 'Fully modular', formFactor: 'ATX', length: 150, pcie8pin: 4, twelveVHPWR: true, warranty: '10 years' },
  },
  {
    id: 'psu-superflower-leadex-750', category: 'psu', name: 'Super Flower Leadex III 750W Gold', brand: 'Super Flower', price: 6150, availability: 'in-stock',
    specs: { wattage: 750, efficiency: '80+ Gold', modular: 'Fully modular', formFactor: 'ATX', length: 160, pcie8pin: 4, twelveVHPWR: false, warranty: '10 years' },
  },
  {
    id: 'psu-thermaltake-toughpower-1000', category: 'psu', name: 'Thermaltake Toughpower GF3 1000W Gold', brand: 'Thermaltake', price: 9950, availability: 'in-stock',
    specs: { wattage: 1000, efficiency: '80+ Gold', modular: 'Fully modular', formFactor: 'ATX', length: 160, pcie8pin: 4, twelveVHPWR: true, warranty: '10 years' },
  },
  {
    id: 'psu-bequiet-pure-power-12', category: 'psu', name: 'be quiet! Pure Power 12 M 850W Gold', brand: 'be quiet!', price: 7150, availability: 'in-stock',
    specs: { wattage: 850, efficiency: '80+ Gold', modular: 'Fully modular', formFactor: 'ATX', length: 150, pcie8pin: 4, twelveVHPWR: true, warranty: '10 years' },
  },
  {
    id: 'psu-corsair-sf600', category: 'psu', name: 'Corsair SF600 600W Platinum (SFX)', brand: 'Corsair', price: 7950, availability: 'low-stock',
    specs: { wattage: 600, efficiency: '80+ Platinum', modular: 'Fully modular', formFactor: 'SFX', length: 100, pcie8pin: 2, twelveVHPWR: false, warranty: '7 years' },
  },
  {
    id: 'psu-thermaltake-smart-bm-700', category: 'psu', name: 'Thermaltake Smart BM3 700W Bronze', brand: 'Thermaltake', price: 3650, availability: 'in-stock',
    specs: { wattage: 700, efficiency: '80+ Bronze', modular: 'Semi-modular', formFactor: 'ATX', length: 140, pcie8pin: 2, twelveVHPWR: false, warranty: '5 years' },
  },

  // ----------------------------------------------------------------- Cases
  {
    id: 'case-corsair-5000d', category: 'case', name: 'Corsair 5000D Airflow', brand: 'Corsair', price: 7450, availability: 'in-stock',
    accent: '#3b82f6',
    specs: { supportedFormFactors: ['ATX', 'Micro-ATX', 'Mini-ITX'], size: 'Mid Tower', maxGpuLength: 420, maxCoolerHeight: 170, radiatorSupport: [240, 280, 360], fanSlots: 10, fanSizes: [120, 140], includedFans: 2, psuSupport: ['ATX', 'SFX'], maxPsuLength: 225, sidePanel: 'Tempered glass', frontPanel: 'Mesh' },
  },
  {
    id: 'case-nzxt-h7-flow', category: 'case', name: 'NZXT H7 Flow (2024)', brand: 'NZXT', price: 6850, availability: 'in-stock',
    accent: '#818cf8',
    specs: { supportedFormFactors: ['ATX', 'Micro-ATX', 'Mini-ITX'], size: 'Mid Tower', maxGpuLength: 410, maxCoolerHeight: 180, radiatorSupport: [240, 280, 360], fanSlots: 8, fanSizes: [120, 140], includedFans: 3, psuSupport: ['ATX'], maxPsuLength: 200, sidePanel: 'Tempered glass', frontPanel: 'Mesh' },
  },
  {
    id: 'case-fractal-pop-air', category: 'case', name: 'Fractal Design Pop Air RGB', brand: 'Fractal Design', price: 4250, availability: 'in-stock',
    accent: '#38bdf8',
    specs: { supportedFormFactors: ['ATX', 'Micro-ATX', 'Mini-ITX'], size: 'Mid Tower', maxGpuLength: 405, maxCoolerHeight: 170, radiatorSupport: [240, 280], fanSlots: 6, fanSizes: [120, 140], includedFans: 3, psuSupport: ['ATX'], maxPsuLength: 170, sidePanel: 'Tempered glass', frontPanel: 'Mesh' },
  },
  {
    id: 'case-lianli-o11d-evo-xl', category: 'case', name: 'Lian Li O11 Dynamic EVO XL', brand: 'Lian Li', price: 12900, availability: 'low-stock',
    accent: '#94a3b8',
    specs: { supportedFormFactors: ['E-ATX', 'ATX', 'Micro-ATX', 'Mini-ITX'], size: 'Full Tower', maxGpuLength: 460, maxCoolerHeight: 167, radiatorSupport: [280, 360, 420], fanSlots: 12, fanSizes: [120, 140], includedFans: 0, psuSupport: ['ATX'], maxPsuLength: 220, sidePanel: 'Tempered glass', frontPanel: 'Glass' },
  },
  {
    id: 'case-montech-nx600', category: 'case', name: 'Montech NX600 Mesh', brand: 'Montech', price: 2850, availability: 'in-stock',
    accent: '#22d3ee',
    specs: { supportedFormFactors: ['ATX', 'Micro-ATX', 'Mini-ITX'], size: 'Mid Tower', maxGpuLength: 400, maxCoolerHeight: 170, radiatorSupport: [240, 360], fanSlots: 7, fanSizes: [120, 140], includedFans: 4, psuSupport: ['ATX'], maxPsuLength: 180, sidePanel: 'Tempered glass', frontPanel: 'Mesh' },
  },
  {
    id: 'case-montech-air-903', category: 'case', name: 'Montech AIR 903 MAX', brand: 'Montech', price: 2950, availability: 'in-stock',
    accent: '#34d399',
    specs: { supportedFormFactors: ['ATX', 'Micro-ATX', 'Mini-ITX'], size: 'Mid Tower', maxGpuLength: 390, maxCoolerHeight: 175, radiatorSupport: [240, 360], fanSlots: 8, fanSizes: [120, 140], includedFans: 4, psuSupport: ['ATX'], maxPsuLength: 200, sidePanel: 'Tempered glass', frontPanel: 'Mesh' },
  },
  {
    id: 'case-montech-sky-one', category: 'case', name: 'Montech Sky One Mini', brand: 'Montech', price: 2450, availability: 'in-stock',
    accent: '#f472b6',
    specs: { supportedFormFactors: ['Micro-ATX', 'Mini-ITX'], size: 'Mid Tower', maxGpuLength: 330, maxCoolerHeight: 160, radiatorSupport: [120, 240], fanSlots: 5, fanSizes: [120], includedFans: 3, psuSupport: ['ATX'], maxPsuLength: 160, sidePanel: 'Tempered glass', frontPanel: 'Mesh' },
  },
  {
    id: 'case-tecware-vista', category: 'case', name: 'Tecware Vista TG ATX', brand: 'Tecware', price: 2350, availability: 'in-stock',
    accent: '#38bdf8',
    specs: { supportedFormFactors: ['ATX', 'Micro-ATX', 'Mini-ITX'], size: 'Mid Tower', maxGpuLength: 340, maxCoolerHeight: 160, radiatorSupport: [120, 240], fanSlots: 6, fanSizes: [120], includedFans: 3, psuSupport: ['ATX'], maxPsuLength: 160, sidePanel: 'Tempered glass', frontPanel: 'Glass' },
  },
  {
    id: 'case-darkflash-atx-gam', category: 'case', name: 'DarkFlash DK352 Gaming ATX', brand: 'DarkFlash', price: 2750, availability: 'in-stock',
    accent: '#a855f7',
    specs: { supportedFormFactors: ['ATX', 'Micro-ATX', 'Mini-ITX'], size: 'Mid Tower', maxGpuLength: 350, maxCoolerHeight: 165, radiatorSupport: [120, 240, 360], fanSlots: 7, fanSizes: [120], includedFans: 4, psuSupport: ['ATX'], maxPsuLength: 160, sidePanel: 'Tempered glass', frontPanel: 'Mesh' },
  },
  {
    id: 'case-cm-masterbox-td500', category: 'case', name: 'Cooler Master MasterBox TD500 Mesh V2', brand: 'Cooler Master', price: 5450, availability: 'in-stock',
    accent: '#f59e0b',
    specs: { supportedFormFactors: ['ATX', 'Micro-ATX', 'Mini-ITX'], size: 'Mid Tower', maxGpuLength: 410, maxCoolerHeight: 165, radiatorSupport: [240, 280, 360], fanSlots: 7, fanSizes: [120, 140], includedFans: 3, psuSupport: ['ATX'], maxPsuLength: 200, sidePanel: 'Tempered glass', frontPanel: 'Mesh' },
  },
  {
    id: 'case-antec-nx416', category: 'case', name: 'Antec NX416L Mesh ARGB', brand: 'Antec', price: 2650, availability: 'in-stock',
    accent: '#ef4444',
    specs: { supportedFormFactors: ['ATX', 'Micro-ATX', 'Mini-ITX'], size: 'Mid Tower', maxGpuLength: 360, maxCoolerHeight: 165, radiatorSupport: [120, 240, 360], fanSlots: 7, fanSizes: [120, 140], includedFans: 4, psuSupport: ['ATX'], maxPsuLength: 170, sidePanel: 'Tempered glass', frontPanel: 'Mesh' },
  },
  {
    id: 'case-silverstone-fara-h1', category: 'case', name: 'SilverStone FARA H1M Micro-ATX', brand: 'SilverStone', price: 3350, availability: 'in-stock',
    accent: '#64748b',
    specs: { supportedFormFactors: ['Micro-ATX', 'Mini-ITX'], size: 'Mid Tower', maxGpuLength: 320, maxCoolerHeight: 165, radiatorSupport: [120, 240], fanSlots: 5, fanSizes: [120], includedFans: 2, psuSupport: ['ATX'], maxPsuLength: 160, sidePanel: 'Tempered glass', frontPanel: 'Mesh' },
  },
  {
    id: 'case-lianli-a3-matx', category: 'case', name: 'Lian Li A3-mATX Wood Edition', brand: 'Lian Li', price: 5450, availability: 'in-stock',
    accent: '#b45309',
    specs: { supportedFormFactors: ['Micro-ATX', 'Mini-ITX'], size: 'Small Form Factor', maxGpuLength: 415, maxCoolerHeight: 158, radiatorSupport: [240, 280], fanSlots: 6, fanSizes: [120], includedFans: 0, psuSupport: ['SFX', 'ATX'], maxPsuLength: 170, sidePanel: 'Tempered glass', frontPanel: 'Wood' },
  },

  // ---------------------------------------------------------- CPU coolers
  {
    id: 'cooler-noctua-nhu12s', category: 'cooler', name: 'Noctua NH-U12S redux', brand: 'Noctua', price: 3350, availability: 'in-stock',
    specs: { type: 'Air', sockets: ['AM4', 'AM5', 'LGA1700', 'LGA1851'], height: 158, radiatorSize: null, tdp: 180, ramClearance: 45, fans: 1, rgb: false, noise: 'Up to 22.6 dBA' },
  },
  {
    id: 'cooler-bequiet-pure-rock-2', category: 'cooler', name: 'be quiet! Pure Rock 2 Black', brand: 'be quiet!', price: 2450, availability: 'in-stock',
    specs: { type: 'Air', sockets: ['AM4', 'AM5', 'LGA1700', 'LGA1851'], height: 155, radiatorSize: null, tdp: 150, ramClearance: 38, fans: 1, rgb: false, noise: 'Up to 26.8 dBA' },
  },
  {
    id: 'cooler-thermalright-ax120-r-se', category: 'cooler', name: 'Thermalright Assassin X 120 R SE', brand: 'Thermalright', price: 1250, availability: 'in-stock',
    specs: { type: 'Air', sockets: ['AM4', 'AM5', 'LGA1700', 'LGA1851'], height: 150, radiatorSize: null, tdp: 210, ramClearance: 34, fans: 1, rgb: false, noise: 'Up to 25.6 dBA' },
  },
  {
    id: 'cooler-idcooling-se226', category: 'cooler', name: 'ID-COOLING SE-226-XT Black', brand: 'ID-COOLING', price: 1850, availability: 'in-stock',
    specs: { type: 'Air', sockets: ['AM4', 'AM5', 'LGA1700', 'LGA1851'], height: 154, radiatorSize: null, tdp: 250, ramClearance: 36, fans: 1, rgb: false, noise: 'Up to 29 dBA' },
  },
  {
    id: 'cooler-jonsbo-cr1000', category: 'cooler', name: 'Jonsbo CR-1000 EVO Black', brand: 'Jonsbo', price: 1350, availability: 'in-stock',
    specs: { type: 'Air', sockets: ['AM4', 'AM5', 'LGA1700'], height: 155, radiatorSize: null, tdp: 160, ramClearance: 40, fans: 1, rgb: true, noise: 'Up to 28 dBA' },
  },
  {
    id: 'cooler-cm-hyper-212-black', category: 'cooler', name: 'Cooler Master Hyper 212 Black Edition', brand: 'Cooler Master', price: 1850, availability: 'in-stock',
    specs: { type: 'Air', sockets: ['AM4', 'AM5', 'LGA1700', 'LGA1851'], height: 159, radiatorSize: null, tdp: 180, ramClearance: 37, fans: 1, rgb: false, noise: 'Up to 26 dBA' },
  },
  {
    id: 'cooler-arctic-lf3-240', category: 'cooler', name: 'Arctic Liquid Freezer III 240 A-RGB', brand: 'Arctic', price: 5250, availability: 'in-stock',
    specs: { type: 'Liquid', sockets: ['AM4', 'AM5', 'LGA1700', 'LGA1851'], height: 63, radiatorSize: 240, tdp: 300, ramClearance: 60, fans: 2, rgb: true, noise: 'Up to 30 dBA' },
  },
  {
    id: 'cooler-corsair-h100i', category: 'cooler', name: 'Corsair iCUE H100i ELITE CAPELLIX XT', brand: 'Corsair', price: 7950, availability: 'in-stock',
    specs: { type: 'Liquid', sockets: ['AM4', 'AM5', 'LGA1700', 'LGA1851'], height: 55, radiatorSize: 240, tdp: 280, ramClearance: 60, fans: 2, rgb: true, noise: 'Up to 32 dBA' },
  },
  {
    id: 'cooler-deepcool-ls520', category: 'cooler', name: 'DeepCool LS520 SE 240 A-RGB', brand: 'DeepCool', price: 4450, availability: 'in-stock',
    specs: { type: 'Liquid', sockets: ['AM4', 'AM5', 'LGA1700', 'LGA1851'], height: 57, radiatorSize: 240, tdp: 260, ramClearance: 58, fans: 2, rgb: true, noise: 'Up to 34 dBA' },
  },
  {
    id: 'cooler-lianli-galahad2-360', category: 'cooler', name: 'Lian Li Galahad II Trinity 360', brand: 'Lian Li', price: 8950, availability: 'low-stock',
    specs: { type: 'Liquid', sockets: ['AM4', 'AM5', 'LGA1700', 'LGA1851'], height: 60, radiatorSize: 360, tdp: 350, ramClearance: 62, fans: 3, rgb: true, noise: 'Up to 33 dBA' },
  },

  // ------------------------------------------------------------ Case fans
  {
    id: 'fans-noctua-a14-2', category: 'fans', name: 'Noctua NF-A14 PWM 140mm (2-Pack)', brand: 'Noctua', price: 4450, availability: 'in-stock',
    specs: { size: 140, count: 2, airflow: 82.5, noise: 24.6, rgb: false, connector: '4-pin PWM' },
  },
  {
    id: 'fans-bequiet-silent-wings-3', category: 'fans', name: 'be quiet! Silent Wings 4 120mm (3-Pack)', brand: 'be quiet!', price: 3950, availability: 'in-stock',
    specs: { size: 120, count: 3, airflow: 50.5, noise: 18.9, rgb: false, connector: '4-pin PWM' },
  },
  {
    id: 'fans-arctic-p8-4', category: 'fans', name: 'Arctic P8 PWM 80mm (4-Pack)', brand: 'Arctic', price: 1450, availability: 'in-stock',
    specs: { size: 80, count: 4, airflow: 23.4, noise: 18, rgb: false, connector: '4-pin PWM' },
  },
  {
    id: 'fans-cm-prism-3', category: 'fans', name: 'Cooler Master MasterFan MF120 Prismatic (3-Pack)', brand: 'Cooler Master', price: 2450, availability: 'in-stock',
    specs: { size: 120, count: 3, airflow: 46.2, noise: 30, rgb: true, connector: '4-pin PWM + ARGB' },
  },
  {
    id: 'fans-deepcool-fc140-2', category: 'fans', name: 'DeepCool FC140 ARGB 140mm (2-Pack)', brand: 'DeepCool', price: 1850, availability: 'in-stock',
    specs: { size: 140, count: 2, airflow: 76, noise: 32.5, rgb: true, connector: '4-pin PWM + ARGB' },
  },
  {
    id: 'fans-corsair-af120-3', category: 'fans', name: 'Corsair AF120 ELITE 120mm (3-Pack)', brand: 'Corsair', price: 3250, availability: 'in-stock',
    specs: { size: 120, count: 3, airflow: 65.6, noise: 31, rgb: false, connector: '4-pin PWM' },
  },
  {
    id: 'fans-thermalright-tl-c14-3', category: 'fans', name: 'Thermalright TL-C14C 140mm (3-Pack)', brand: 'Thermalright', price: 1650, availability: 'in-stock',
    specs: { size: 140, count: 3, airflow: 78, noise: 25, rgb: false, connector: '4-pin PWM' },
  },
  {
    id: 'fans-lianli-sl140-2', category: 'fans', name: 'Lian Li UNI Fan SL140 V2 (2-Pack)', brand: 'Lian Li', price: 4450, availability: 'low-stock',
    specs: { size: 140, count: 2, airflow: 72.7, noise: 29, rgb: true, connector: '4-pin PWM + ARGB' },
  },
  {
    id: 'fans-nzxt-f140-2', category: 'fans', name: 'NZXT F140 RGB Duo 140mm (2-Pack)', brand: 'NZXT', price: 3850, availability: 'in-stock',
    specs: { size: 140, count: 2, airflow: 84, noise: 28, rgb: true, connector: '4-pin PWM + ARGB' },
  },
  {
    id: 'fans-asus-rog-120-3', category: 'fans', name: 'ASUS ROG Strix XF120 120mm (3-Pack)', brand: 'ASUS', price: 3250, availability: 'in-stock',
    specs: { size: 120, count: 3, airflow: 62, noise: 27, rgb: false, connector: '4-pin PWM' },
  },

  // ------------------------------------------------- Cables and accessories
  {
    id: 'cable-cm-sata-power-3', category: 'cables', name: 'Cooler Master SATA Power Cable (3-pack, 500mm)', brand: 'Cooler Master', price: 450, availability: 'in-stock',
    specs: { type: 'SATA power', length: 500, gauge: '18 AWG', connectorA: 'SATA power', connectorB: 'SATA power', rating: '54 W', sleeved: false },
  },
  {
    id: 'cable-startech-eps-8pin', category: 'cables', name: 'StarTech 8-pin EPS Extension (300mm)', brand: 'StarTech', price: 550, availability: 'in-stock',
    specs: { type: 'CPU EPS extension', length: 300, gauge: '18 AWG', connectorA: '8-pin EPS', connectorB: '8-pin EPS', rating: '235 W', sleeved: true },
  },
  {
    id: 'cable-corsair-type4-eps', category: 'cables', name: 'Corsair Type-4 CPU EPS 8-pin Cable (650mm)', brand: 'Corsair', price: 850, availability: 'in-stock',
    specs: { type: 'CPU EPS', length: 650, gauge: '16 AWG', connectorA: '8-pin EPS', connectorB: 'Corsair Type-4', rating: '300 W', sleeved: true },
  },
  {
    id: 'cable-corsair-type4-12v6', category: 'cables', name: 'Corsair Type-5 12V-2x6 Cable (700mm)', brand: 'Corsair', price: 1750, availability: 'in-stock',
    specs: { type: 'GPU 16-pin', length: 700, gauge: '16 AWG', connectorA: '16-pin (12V-2x6)', connectorB: 'Corsair Type-5', rating: '600 W', sleeved: true },
  },
  {
    id: 'cable-noctua-na-sxc', category: 'cables', name: 'Noctua NA-SYC1 4-pin Y-cable (2-pack)', brand: 'Noctua', price: 380, availability: 'in-stock',
    specs: { type: 'Fan splitter', length: 240, gauge: '22 AWG', connectorA: '4-pin PWM', connectorB: '2A- 4-pin PWM', rating: '2 A total', sleeved: false },
  },
  {
    id: 'cable-cm-argb-extension', category: 'cables', name: 'Cooler Master ARGB Extension Cable (500mm)', brand: 'Cooler Master', price: 320, availability: 'in-stock',
    specs: { type: 'ARGB extension', length: 500, gauge: '22 AWG', connectorA: '3-pin 5V ARGB', connectorB: '3-pin 5V ARGB', rating: '3 A', sleeved: false, rgb: true },
  },
  {
    id: 'cable-startech-pci-riser', category: 'cables', name: 'StarTech PCIe x16 Riser Cable (250mm)', brand: 'StarTech', price: 1550, availability: 'low-stock',
    specs: { type: 'PCIe riser', length: 250, gauge: '28 AWG', connectorA: 'PCIe x16 slot', connectorB: 'PCIe x16 slot', rating: 'PCIe 4.0 x16', sleeved: false },
  },
  {
    id: 'cable-deepcool-fan-hub', category: 'cables', name: 'DeepCool FH-04 4-port Fan Hub', brand: 'DeepCool', price: 650, availability: 'in-stock',
    specs: { type: 'Fan hub', length: 400, gauge: '22 AWG', connectorA: 'SATA power + 4-pin PWM', connectorB: '4A- 4-pin PWM', rating: '4 A total', sleeved: false },
  },
  {
    id: 'cable-nzxt-24pin', category: 'cables', name: 'NZXT 24-pin ATX Sleeved Cable (600mm)', brand: 'NZXT', price: 1950, availability: 'in-stock',
    specs: { type: 'PSU 24-pin', length: 600, gauge: '16 AWG', connectorA: '24-pin ATX', connectorB: 'NZXT 24-pin', rating: '300 W', sleeved: true },
  },
  {
    id: 'cable-lianli-strimer-v2-24', category: 'cables', name: 'Lian Li Strimer Plus V2 RGB 24-pin', brand: 'Lian Li', price: 3950, availability: 'low-stock',
    specs: { type: 'RGB extension', length: 320, gauge: '18 AWG', connectorA: '24-pin ATX', connectorB: '24-pin ATX', rating: '300 W', sleeved: false, rgb: true },
  },
];
