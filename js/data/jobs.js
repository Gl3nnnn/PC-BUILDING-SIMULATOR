/**
 * Customer jobs for career mode.
 *
 * A job is a brief plus the rules a build must satisfy. Everything is checked
 * with the existing hardware data (compatibility, FPS model, noise specs), so
 * adding a job never requires new parts - just new wishes.
 *
 * budget / fee / xp are in Philippine pesos and XP points.
 * `need` flags are read by js/core/gameplay.js.
 */

export const JOBS = [
  {
    id: 'job-school-pc',
    title: 'School PC for Aira',
    customer: 'Aira · Grade 11 student',
    level: 1,
    budget: 22000,
    fee: 2600,
    xp: 60,
    timeLimit: 240,
    brief: 'Online classes, Canva, and light Minecraft. It just needs to turn on every morning and not sound like a jet.',
    need: { gpu: false, quiet: true, minRam: 16, storageGb: 480, wifi: true },
    tips: ['Integrated graphics are fine here.', 'A quiet air cooler keeps the cost down.'],
  },
  {
    id: 'job-barangay-office',
    title: 'Barangay office desktop',
    customer: 'Kap. Delia · barangay hall',
    level: 1,
    budget: 26000,
    fee: 3200,
    xp: 70,
    timeLimit: 260,
    brief: 'Three staff share one PC for documents and printing. It must survive brownouts, so a decent power supply matters.',
    need: { gpu: false, minRam: 16, storageGb: 480, wifi: false },
    tips: ['Skip the GPU, spend on a quality PSU.', 'SSD only - an HDD will feel ancient.'],
  },
  {
    id: 'job-esports-1080p',
    title: 'Valorant machine',
    customer: 'Miguel · student athlete',
    level: 2,
    budget: 42000,
    fee: 5200,
    xp: 110,
    timeLimit: 300,
    brief: 'Valorant and Dota 2 at 144 FPS on a 1080p 144 Hz monitor. Cheap-looking parts are fine, low FPS is not.',
    need: { gpu: true, minFps: { resolution: '1080p', quality: 'low', value: 144 }, minRam: 16, minVram: 8 },
    tips: ['CPU matters as much as the GPU in esports titles.', 'Check the FPS page before you order.'],
  },
  {
    id: 'job-streamer',
    title: 'First-time streamer',
    customer: 'Joyce · content creator',
    level: 3,
    budget: 65000,
    fee: 7800,
    xp: 150,
    timeLimit: 320,
    brief: 'Streams Valorant while editing clips in Premiere. Wants RGB because "it should look expensive on camera".',
    need: { gpu: true, rgb: true, minRam: 32, minCores: 8, minFps: { resolution: '1080p', quality: 'high', value: 120 } },
    tips: ['32 GB helps when the encoder is running.', 'An RGB fan kit is the cheapest way to look expensive.'],
  },
  {
    id: 'job-architect',
    title: 'Architect workstation',
    customer: 'Studio Uno · drafting team',
    level: 4,
    budget: 90000,
    fee: 11000,
    xp: 200,
    timeLimit: 340,
    brief: 'SketchUp, Lumion and 3ds Max all day. Renders must not sit there "thinking" for an hour.',
    need: { gpu: true, minRam: 32, minVram: 12, minCores: 12, storageGb: 2000 },
    tips: ['VRAM matters more than clock speed in Lumion.', 'Large NVMe storage keeps renders loading fast.'],
  },
  {
    id: 'job-silent-studio',
    title: 'Silent recording studio',
    customer: 'Reyes Audio · home studio',
    level: 5,
    budget: 78000,
    fee: 12500,
    xp: 220,
    timeLimit: 340,
    brief: 'Records vocals next to the PC. It must be as close to silent as possible, with big storage for session files.',
    need: { gpu: true, quiet: true, minRam: 32, storageGb: 2000, maxNoise: 25 },
    tips: ['Air coolers from Noctua and be quiet! are the quietest.', 'Look at the dBA numbers in the specs.'],
  },
  {
    id: 'job-esports-1440p',
    title: '1440p high-refresh rig',
    customer: 'Coach Ben · esports team',
    level: 6,
    budget: 120000,
    fee: 16000,
    xp: 280,
    timeLimit: 360,
    brief: 'A practice station: 1440p, 165 FPS in competitive titles, and it cannot thermal throttle after three hours.',
    need: { gpu: true, minFps: { resolution: '1440p', quality: 'high', value: 165 }, minVram: 12, minCores: 8, headroom: 20 },
    tips: ['Leave PSU headroom for boost spikes.', 'A 240/360 mm liquid cooler wins long sessions.'],
  },
  {
    id: 'job-4k-editor',
    title: '4K video editor',
    customer: 'Marisol · freelance editor',
    level: 8,
    budget: 160000,
    fee: 21000,
    xp: 380,
    timeLimit: 400,
    brief: 'Cuts 4K multicam footage, exports while working. Needs 4K gaming when the day is done.',
    need: { gpu: true, minFps: { resolution: '4k', quality: 'high', value: 90 }, minRam: 64, minVram: 16, storageGb: 2000 },
    tips: ['16 GB of VRAM is the floor for 4K timelines.', '64 GB RAM is not overkill here.'],
  },
  {
    id: 'job-flagship',
    title: 'No-limits flagship',
    customer: 'Mr. Tan · collection build',
    level: 10,
    budget: 260000,
    fee: 34000,
    xp: 550,
    timeLimit: 420,
    brief: '"Money is not the problem. Make it look like it costs this much, and make it silent."',
    need: { gpu: true, rgb: true, quiet: true, maxNoise: 26, minRam: 64, minVram: 24, minCores: 16, headroom: 25 },
    tips: ['Top-tier CPU, top-tier GPU, and a 360 mm AIO.', 'RGB plus silence is the hard combination.'],
  },
  {
    id: 'job-repair-shop',
    title: 'Repair shop partner',
    customer: 'Tito Noli · computer shop',
    level: 2,
    budget: 30000,
    fee: 4200,
    xp: 95,
    timeLimit: 280,
    brief: 'A reliable shop demo unit - boots fast, quiet, and has room for another drive later.',
    need: { gpu: false, quiet: true, minRam: 16, storageGb: 480, wifi: true },
    tips: ['A board with two NVMe slots leaves room to grow.', 'Included case fans keep it quiet and cheap.'],
  },
];

export const JOBS_BY_ID = Object.fromEntries(JOBS.map((job) => [job.id, job]));

export function getJob(id) {
  return JOBS_BY_ID[id] || null;
}

/** Jobs a player at `level` may take. */
export function jobsForLevel(level) {
  return JOBS.filter((job) => job.level <= level);
}

/** Deterministic daily challenge - same brief for the same calendar day. */
export function dailyChallenge(date = new Date()) {
  const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) % 100000;
  }
  const budget = 30000 + (hash % 9) * 5000;
  const fpsTarget = 60 + (hash % 4) * 30;
  return {
    key,
    title: `Daily brief #${(hash % 900) + 100}`,
    customer: 'Walk-in customer',
    budget,
    fee: Math.round(budget * 0.14 / 100) * 100,
    xp: 90,
    timeLimit: 300,
    brief: `Any PC that hits ${fpsTarget} FPS at 1080p high inside a ${budget.toLocaleString('en-PH')} peso budget. One attempt today.`,
    need: { gpu: true, minFps: { resolution: '1080p', quality: 'high', value: fpsTarget }, minRam: 16 },
    tips: ['Same parts prices for everyone today.', 'Stars decide your spot on the hall of fame.'],
    daily: true,
  };
}
