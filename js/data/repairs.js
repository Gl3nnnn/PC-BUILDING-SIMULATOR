/**
 * Broken PCs for the repair bench.
 *
 * Each case lists the exact parts inside the machine and which of them are
 * faulty. The player reads the reported symptom, runs quick tests, then swaps
 * the part they think is dead. Every wrong replacement costs time and money.
 *
 * Part ids must exist in js/data/hardware.js.
 */

export const REPAIRS = [
  {
    id: 'repair-no-display',
    title: 'No display, fans spin',
    customer: 'Aling Mila · home office',
    level: 1,
    payout: 2400,
    budgeted: 3200,
    symptom: 'The fans start, the lights come on, but the monitor never wakes up. It worked yesterday.',
    clues: ['The GPU is a very old card pulled from a drawer.', 'The CPU has no integrated graphics, so a dead card means a black screen.'],
    parts: ['cpu-i5-12400f', 'mb-asus-h610m-e-d4', 'gpu-rx-6600', 'ram-fury-16-3200', 'ssd-kingston-a400-480', 'psu-cm-mwe550', 'case-tecware-forge-m2'],
    faults: ['gpu-rx-6600'],
    test: 'A known-good card in the same slot gives a picture instantly, so the old card is dead.',
  },
  {
    id: 'repair-wont-post',
    title: 'Two beeps, then it shuts off',
    customer: 'Jomar · first-time builder',
    level: 2,
    payout: 2800,
    budgeted: 3800,
    symptom: 'It beeps twice and restarts in a loop. He bought the parts from a "bundled" online listing.',
    clues: ['The two memory kits look physically different from each other.', 'The board is a DDR4 model.'],
    parts: ['cpu-r5-5600', 'mb-msi-b550m-pro-vdh', 'ram-fury-16-5600', 'ram-vulcan-16-3600', 'ssd-kingston-a400-480', 'psu-cm-mwe550', 'case-tecware-forge-m2'],
    faults: ['ram-fury-16-5600'],
    test: 'Pulling the DDR5 kit lets the system POST with the DDR4 kit installed.',
  },
  {
    id: 'repair-shutdown-load',
    title: 'Shuts down under load',
    customer: 'Kuya Dennis · gaming rig',
    level: 3,
    payout: 3400,
    budgeted: 4400,
    symptom: 'Fine while browsing, dies after 20 minutes of Valorant. Then it needs a full power cycle.',
    clues: ['The GPU peaks at 220 W plus the CPU at 148 W.', 'The power supply is a 450 W Bronze unit that is six years old.'],
    parts: ['cpu-i5-13400f', 'mb-msi-b760m-a-ddr4', 'gpu-rtx-4070-super', 'ram-vengeance-32-6000', 'ssd-samsung-980-1tb', 'psu-corsair-cv450', 'case-tecware-forge-m2'],
    faults: ['psu-corsair-cv450'],
    test: 'The 12 V rail sags to 10.4 V under load. This build wants about 700 W.',
  },
  {
    id: 'repair-thermal',
    title: 'Throttles to 20% speed',
    customer: 'Bea · architecture student',
    level: 4,
    payout: 3900,
    budgeted: 5200,
    symptom: 'Renders that used to take ten minutes now take an hour. The case is warm to the touch.',
    clues: ['The CPU boosts to 253 W.', 'The cooler is a 180 W air tower on a 253 W chip.'],
    parts: ['cpu-i7-14700k', 'mb-msi-b760m-a-ddr5', 'gpu-rtx-4060ti', 'ram-delta-32-6000', 'ssd-samsung-980-1tb', 'psu-msi-a750gl', 'cooler-idcooling-se214'],
    faults: ['cooler-idcooling-se214'],
    test: 'Cores hit 100 °C within 40 seconds and clock down to 1.2 GHz. A bigger cooler fixes it.',
  },
  {
    id: 'repair-no-boot-power',
    title: 'Dead on arrival',
    customer: 'Sir Paul · office upgrade',
    level: 3,
    payout: 3100,
    budgeted: 3900,
    symptom: 'Nothing happens at all. No fans, no lights, no beep. The wall outlet is fine.',
    clues: ['The 24-pin and 8-pin cables are seated properly.', 'A known-good power supply boots this board on the bench.'],
    parts: ['cpu-i5-12400f', 'mb-asus-h610m-e-d4', 'ram-fury-16-3200', 'ssd-kingston-a400-480', 'psu-cm-mwe550', 'case-tecware-forge-m2'],
    faults: ['mb-asus-h610m-e-d4'],
    test: 'The board has no standby LED and the standby rail reads 0 V at the header.',
  },
  {
    id: 'repair-bad-ram',
    title: 'Bluescreens every hour',
    customer: 'Tin · student',
    level: 3,
    payout: 2900,
    budgeted: 3600,
    symptom: 'Random restarts and "memory management" blue screens, worst when two apps are open.',
    clues: ['A memory test fails on this single 16 GB stick.', 'Two different boards show the same failures.'],
    parts: ['cpu-r5-7600', 'mb-asrock-b650m-pro-rs', 'ram-crucial-pro-16-5600', 'ssd-kingston-a400-480', 'psu-cm-mwe550', 'case-tecware-forge-m2'],
    faults: ['ram-crucial-pro-16-5600'],
    test: 'MemTest86 flags thousands of failing addresses on that module.',
  },
  {
    id: 'repair-ssd-dead',
    title: 'Windows missing',
    customer: 'Nurse Gia · clinic',
    level: 2,
    payout: 2700,
    budgeted: 3400,
    symptom: '"Reboot and select proper boot device" on every restart. The files were there last night.',
    clues: ['The drive does not appear in the BIOS list at all.', 'A new SATA cable and a different port change nothing.'],
    parts: ['cpu-i3-12100', 'mb-asus-h610m-e-d4', 'ram-fury-16-3200', 'ssd-kingston-a400-480', 'psu-cm-mwe550', 'case-tecware-forge-m2'],
    faults: ['ssd-kingston-a400-480'],
    test: 'The drive stays cold and silent and never shows up in the SATA list.',
  },
  {
    id: 'repair-mixed-platform',
    title: 'New CPU in the old board',
    customer: 'Mang Tony · "upgrade"',
    level: 5,
    payout: 4200,
    budgeted: 5600,
    symptom: 'He swapped a Ryzen 9 9800X3D into his B550 board to save money. It now halts at the memory check.',
    clues: ['The board is AM4/B550, the CPU is an AM5 Ryzen 9000 part.', 'Four debug beeps and no video.'],
    parts: ['cpu-r7-9800x3d', 'mb-msi-b550m-pro-vdh', 'ram-fury-16-3200', 'ssd-samsung-980-1tb', 'psu-seasonic-gx650', 'case-tecware-forge-m2'],
    faults: ['cpu-r7-9800x3d'],
    test: 'A Ryzen 5 5600 boots on this board, so the board is fine - the new CPU is the wrong platform.',
  },
];

export const REPAIRS_BY_ID = Object.fromEntries(REPAIRS.map((entry) => [entry.id, entry]));

export function getRepair(id) {
  return REPAIRS_BY_ID[id] || null;
}

export function repairsForLevel(level) {
  return REPAIRS.filter((entry) => entry.level <= level);
}
