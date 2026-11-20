/**
 * Learning mode content.
 *
 * Every lesson is a guided sequence (the steps) followed by a short practical
 * assessment (the quiz). Nothing here touches the build: the page reads this
 * list, records progress locally and shows the result. Keeping the content in
 * one file means new lessons need no code changes.
 *
 * Shape of a lesson:
 *   id        unique key, also the storage key for progress
 *   order     position in the course (1 = first)
 *   title     short name shown in the list
 *   blurb     one line explaining what you will be able to do afterwards
 *   minutes   rough reading/practice time, for the "about N min" label
 *   icon      icon name from js/ui/icons.js
 *   partIds   real catalogue ids shown beside the lesson (missing ones are skipped)
 *   steps     [{ title, text }] the tutorial itself
 *   quiz      [{ q, options: [...], answer, why }] the practical assessment
 */

export const LESSONS = [
  {
    id: 'parts',
    order: 1,
    title: 'Know every part',
    blurb: 'Name the nine parts of a PC and what each one actually does.',
    minutes: 6,
    icon: 'cube',
    partIds: ['case-lianli-o11-evo', 'cpu-i5-12400f'],
    steps: [
      {
        title: 'The case holds everything',
        text: 'A case (also called a chassis) is the metal box. It decides what fits: how long a graphics card can be and how tall the CPU cooler can stand. A small case looks tidy but rejects big parts.',
      },
      {
        title: 'The motherboard is the city map',
        text: 'Every part plugs into the board. Its socket decides which CPU you can buy, its memory slots decide DDR4 or DDR5, and its form factor (ATX, micro-ATX, mini-ITX) decides which cases it fits.',
      },
      {
        title: 'The CPU is the brain',
        text: 'The processor does the thinking. Two numbers matter most: the socket (AM5, LGA1700 and so on) and the core count. The socket must match the board exactly — there is no adapter.',
      },
      {
        title: 'Memory and storage are different jobs',
        text: 'RAM is the desk you work on: fast, and wiped when the PC turns off. Storage is the filing cabinet: slower, and it keeps your files. You want enough RAM to hold your work and enough storage to keep it.',
      },
      {
        title: 'The graphics card draws the picture',
        text: 'A GPU is its own small computer with its own memory (VRAM). Games lean on it hardest, so a gaming PC spends the biggest slice of the budget here. Check its length against the case before you buy.',
      },
      {
        title: 'Power, cooling and drives finish the build',
        text: 'The power supply turns wall power into what the parts need. The cooler stops the CPU cooking itself. The drive (M.2 or SATA) stores the operating system. Missing any one of these means no boot.',
      },
    ],
    quiz: [
      {
        q: 'Which two parts must share the exact same socket?',
        options: ['CPU and graphics card', 'CPU and motherboard', 'Memory and storage', 'Case and power supply'],
        answer: 1,
        why: 'The CPU drops into the motherboard socket. AM5 chips only fit AM5 boards, LGA1700 only LGA1700 boards.',
      },
      {
        q: 'A game stutters at high settings. Which part is doing most of the drawing work?',
        options: ['The power supply', 'The storage drive', 'The graphics card', 'The case fans'],
        answer: 2,
        why: 'The graphics card renders each frame. Storage only loads the game; the PSU only feeds power.',
      },
      {
        q: 'What happens to the contents of RAM when you switch the PC off?',
        options: ['They are saved to the disk', 'They are erased', 'They move to the graphics card', 'They stay until you delete them'],
        answer: 1,
        why: 'RAM is temporary working space. Anything you want to keep must be saved to storage.',
      },
    ],
  },
  {
    id: 'cpu',
    order: 2,
    title: 'Seat the CPU',
    blurb: 'Install a processor without bending a single pin.',
    minutes: 5,
    icon: 'cpu',
    partIds: ['cpu-r7-9800x3d'],
    steps: [
      {
        title: 'Open the socket first',
        text: 'Lift the metal lever and swing the load plate back. On AM5 the lever lifts straight up; on Intel boards the plate hinges open. Never press a CPU in by force — it should drop in with no resistance.',
      },
      {
        title: 'Find the alignment marks',
        text: 'Every socket has a triangle in one corner, and every CPU has a matching triangle. Line them up. AMD chips also have a notched edge that only fits one way; Intel chips have two small notches on the sides.',
      },
      {
        title: 'Lower it flat, do not slide it',
        text: 'Hold the chip by its edges, keep it level, and lower it straight down. Do not touch the pins or the pads underneath — a finger grease smudge is enough to cause a bad contact.',
      },
      {
        title: 'Close the lever with light pressure',
        text: 'The lever should feel firm but never requiring your body weight. If it feels wrong, stop: the chip is probably not seated. A bent socket pin is not covered by warranty.',
      },
    ],
    quiz: [
      {
        q: 'What tells you which way a CPU goes into the socket?',
        options: ['The colour of the chip', 'A triangle mark and the notches', 'The number of cores', 'The cooler mounting holes'],
        answer: 1,
        why: 'The corner triangle and the edge notches only line up one way. Forcing any other orientation bends pins.',
      },
      {
        q: 'The lever feels like it needs real force to close. What should you do?',
        options: ['Push harder to close it', 'Stop and check the CPU is seated', 'Remove the lever', 'Add thermal paste first'],
        answer: 1,
        why: 'A correct seat closes with light pressure. Heavy force is a warning that the chip is crooked or the wrong way round.',
      },
    ],
  },
  {
    id: 'paste',
    order: 3,
    title: 'Thermal paste and the cooler',
    blurb: 'Apply paste and mount a cooler so the CPU stays cool.',
    minutes: 6,
    icon: 'cooler',
    partIds: ['cooler-noctua-nhd15'],
    steps: [
      {
        title: 'Paste fills the tiny gaps',
        text: 'Metal looks flat but is not. Paste fills the microscopic pits between the CPU and the cooler base so heat can pass through. Without it the CPU overheats in minutes.',
      },
      {
        title: 'One pea-sized dot is enough',
        text: 'Put a single dot about the size of a grain of rice in the middle of the CPU. Mounting pressure spreads it. More paste is not better — a thick layer insulates instead of conducting.',
      },
      {
        title: 'Tighten the cooler in a cross pattern',
        text: 'Fit the cooler straight down, then tighten screws diagonally (top-left, bottom-right, top-right, bottom-left) a little at a time. Even pressure gives an even paste spread and a level cold plate.',
      },
      {
        title: 'Point the fan at the back',
        text: 'On a tower cooler the fan should push air towards the rear exhaust. Fit it backwards and you fight the exhaust fan instead of helping it.',
      },
      {
        title: 'Plug the fan header in',
        text: 'The cooler fan plugs into CPU_FAN on the board, not a case-fan header. Many boards refuse to POST with an empty CPU fan header.',
      },
    ],
    quiz: [
      {
        q: 'How much thermal paste should you apply?',
        options: ['A pea-sized dot', 'A thick full layer', 'None, the cooler is flat', 'One dot per core'],
        answer: 0,
        why: 'Mounting pressure spreads a small dot across the whole chip. Excess paste thickens the layer and makes heat transfer worse.',
      },
      {
        q: 'Which header does the CPU cooler fan plug into?',
        options: ['SATA_PWR', 'CPU_FAN', 'USB', 'CHA_FAN 3'],
        answer: 1,
        why: 'CPU_FAN tells the board the cooler is present and lets it control the speed. Case fans go to CHA_FAN headers.',
      },
    ],
  },
  {
    id: 'memory',
    order: 4,
    title: 'Memory and storage',
    blurb: 'Click RAM into its slots and mount an NVMe drive correctly.',
    minutes: 5,
    icon: 'ram',
    partIds: ['ram-tridentz-rgb-32-3600'],
    steps: [
      {
        title: 'Open the latches',
        text: 'Push the plastic clips at the ends of the memory slots outward. On boards with a one-sided latch, only the latch on the far side opens.',
      },
      {
        title: 'Use the right slots for two sticks',
        text: 'With two sticks on a four-slot board, fit them in slots A2 and B2 (usually the second and fourth from the CPU). That is the pair the board is wired for and the only way to get dual-channel speed.',
      },
      {
        title: 'Push until both clips click',
        text: 'Line the notch in the stick up with the key in the slot, then press straight down with even thumb pressure on both ends. The clips should snap shut on their own. A half-seated stick gives boot errors or no picture.',
      },
      {
        title: 'M.2 drives go in at an angle',
        text: 'Slide the NVMe drive into its slot at about 30 degrees, then press the far end down flat and screw it to the standoff. Forgetting the screw lets the drive lift and drop out of the slot.',
      },
      {
        title: 'SATA drives need two cables',
        text: 'A 2.5-inch SSD or hard drive needs a SATA data cable to the board and a SATA power cable from the power supply. Missing either one means the drive never appears.',
      },
    ],
    quiz: [
      {
        q: 'Two memory sticks on a four-slot board: which slots?',
        options: ['The two nearest the CPU', 'The two farthest from the CPU', 'Slots A2 and B2 (second and fourth)', 'Any two — it does not matter'],
        answer: 2,
        why: 'A2 and B2 are the pair wired for dual channel. Other pairs work but run in single channel, which costs real performance.',
      },
      {
        q: 'How does an M.2 NVMe drive go into its slot?',
        options: ['Straight down like a battery', 'At an angle, then press flat and screw it down', 'Sideways then twist', 'Only after the GPU is removed'],
        answer: 1,
        why: 'The connector is angled. Slide in at roughly 30 degrees, press the far end down and secure it with the standoff screw.',
      },
    ],
  },
  {
    id: 'mounting',
    order: 5,
    title: 'Mount the board and wire power',
    blurb: 'Fit the board on its standoffs and connect the cables that matter.',
    minutes: 7,
    icon: 'motherboard',
    partIds: ['mb-msi-b650-tomahawk'],
    steps: [
      {
        title: 'Standoffs before the board',
        text: 'Screw the brass standoffs into the case holes that match your board size, then place the I/O shield (if your board does not have a built-in one). The board screws into the standoffs, never straight onto the metal tray.',
      },
      {
        title: 'Check the case cable labels',
        text: 'The thin front-panel wires are the fiddly ones: power switch, reset, power LED and HDD LED. The board manual gives the pin layout; the labels are printed on the plugs.',
      },
      {
        title: '24-pin first, then CPU power',
        text: 'The wide 24-pin ATX plug powers the board. The 8-pin (sometimes 4+4) CPU plug feeds the processor and must be connected — a PC with the 24-pin only will not POST.',
      },
      {
        title: 'GPU power comes from the PSU',
        text: 'A card with 8-pin sockets needs PCIe cables, or a single 12V-2x6 cable on the newest cards. Use the cables that came with the power supply, not adapters from another unit.',
      },
      {
        title: 'Tidy the cables before closing',
        text: 'Route the fat cables behind the board tray and use the velcro straps. Cables pressing on a fan or pulled across the CPU cooler are a common cause of noise and heat.',
      },
    ],
    quiz: [
      {
        q: 'What must go between the board and the metal case tray?',
        options: ['Thermal paste', 'Brass standoffs', 'A second layer of tape', 'Nothing'],
        answer: 1,
        why: 'Standoffs hold the board off the tray. Screwing it down directly can short the board against the metal and kill it.',
      },
      {
        q: 'The PC powers on for a second and dies, fans twitch. Most likely cause?',
        options: ['The GPU is too fast', 'The 8-pin CPU power is not connected', 'The case fans are missing', 'The drive is full'],
        answer: 1,
        why: 'A board with 24-pin power but no CPU power tries to start and shuts off immediately. It is the classic forgot-the-EPS symptom.',
      },
    ],
  },
  {
    id: 'diagnose',
    order: 6,
    title: 'Troubleshoot: no display',
    blurb: 'Work through a dead monitor like a technician, in the right order.',
    minutes: 8,
    icon: 'wrench',
    partIds: ['gpu-rtx-4070-super'],
    steps: [
      {
        title: 'Start with the cheapest checks',
        text: 'Is the monitor on the right input? Is the video cable plugged into the graphics card, not the board? On a PC with a graphics card, the board video ports are usually disabled.',
      },
      {
        title: 'Listen for the beep or read the LEDs',
        text: 'A single short beep means POST passed. Repeated beeps, or a light stuck on the DRAM or VGA LED on the board, point at the part that failed.',
      },
      {
        title: 'Reseat before replacing',
        text: 'Most no-display faults are a loose part. Power off, unplug the wall, then reseat the graphics card and the memory until the clips click. Half of all repairs end here.',
      },
      {
        title: 'Strip it down to the minimum',
        text: 'If it still shows nothing, remove everything except CPU, cooler, one memory stick and the power cables. A board that POSTs bare has a part problem, not a board problem.',
      },
      {
        title: 'Swap one part at a time',
        text: 'Test with a known-good stick of memory, then a known-good card. Change one part per test and note the result — swapping several at once hides which one was guilty.',
      },
    ],
    quiz: [
      {
        q: 'A new PC has no picture. Where do you plug the HDMI cable?',
        options: ['The motherboard video port', 'The graphics card port', 'Either one', 'The power supply'],
        answer: 1,
        why: 'With a graphics card fitted, the board ports are normally disabled. Cable goes into the card.',
      },
      {
        q: 'The board has a light stuck on VGA after power on. What failed?',
        options: ['Storage', 'Memory', 'The graphics card or its seating', 'The fans'],
        answer: 2,
        why: 'A VGA LED means the graphics step failed. Usually the card is not fully seated or its power cable is missing.',
      },
      {
        q: 'Why test one part at a time when swapping pieces?',
        options: ['It looks tidier', 'So you know which part caused the change', 'To save electricity', 'Because the board allows only one'],
        answer: 1,
        why: 'Swapping several parts at once means you cannot tell which one fixed the fault — or which one caused it.',
      },
    ],
  },
];

export const LESSONS_BY_ID = Object.fromEntries(LESSONS.map((lesson) => [lesson.id, lesson]));

export function getLesson(id) {
  return LESSONS_BY_ID[id] || null;
}
