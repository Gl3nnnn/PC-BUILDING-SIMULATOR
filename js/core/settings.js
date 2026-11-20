import { getCurrency, setCurrency } from './currency.js';

const KEY = 'pcbs.settings.v1';
const listeners = new Set();

const DEFAULTS = {
  lang: 'en',
  sound: true,
  currency: 'PHP',
  name: '',
  quality: 'high',
};

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULTS };
    return {
      lang: parsed.lang === 'fil' ? 'fil' : 'en',
      sound: parsed.sound !== false,
      currency: typeof parsed.currency === 'string' ? parsed.currency : 'PHP',
      name: typeof parsed.name === 'string' ? parsed.name.slice(0, 24) : '',
      quality: parsed.quality === 'simple' ? 'simple' : 'high',
    };
  } catch {
    return { ...DEFAULTS };
  }
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage may be unavailable - settings simply do not stick */
  }
}

function emit() {
  listeners.forEach((handler) => {
    try {
      handler({ ...state });
    } catch (error) {
      console.error(error);
    }
  });
}

export function getSettings() {
  return { ...state };
}

export function onSettings(handler) {
  listeners.add(handler);
  return () => listeners.delete(handler);
}

export function setSetting(patch = {}) {
  if (typeof patch.lang === 'string') state.lang = patch.lang === 'fil' ? 'fil' : 'en';
  if (typeof patch.sound === 'boolean') state.sound = patch.sound;
  if (typeof patch.name === 'string') state.name = patch.name.trim().slice(0, 24);
  if (typeof patch.currency === 'string') {
    state.currency = patch.currency;
    setCurrency(patch.currency, { emit: false });
  }
  if (patch.quality === 'simple' || patch.quality === 'high') state.quality = patch.quality;
  persist();
  emit();
  return getSettings();
}

export function toggleSound() {
  return setSetting({ sound: !state.sound }).sound;
}

export function isSoundOn() {
  return state.sound;
}

export function applyStoredCurrency() {
  setCurrency(state.currency, { emit: false });
}

/* ------------------------------------------------------------------ */
/* Tiny translator. Only the game surfaces use keys; the rest of the  */
/* studio keeps its original English copy.                            */
/* ------------------------------------------------------------------ */

const DICT = {
  en: {
    career: 'Career',
    repair: 'Repair Bench',
    careerEyebrow: 'Career mode',
    careerTitle: 'Your workshop',
    careerIntro: 'Take customer jobs, buy the parts, assemble the PC, pass the boot test and collect your fee.',
    wallet: 'Wallet',
    level: 'Level',
    xp: 'XP',
    reputation: 'Reputation',
    jobsDone: 'Jobs completed',
    openJobs: 'Available jobs',
    locked: 'Locked',
    unlockAt: 'Unlocks at level',
    takeJob: 'Take this job',
    brief: 'Customer brief',
    budget: 'Budget',
    fee: 'Service fee',
    targetFps: 'Target FPS',
    quiet: 'Quiet build',
    rgb: 'Wants RGB',
    risk: 'Risk',
    startBuild: 'Open builder',
    orderParts: 'Order parts and start',
    orderHint: 'Pick parts in the builder, then come back here to order them with the customer budget.',
    overBudget: 'This order is over the customer budget.',
    assembly: 'Assembly',
    assemblyHint: 'Click the part in the tray that belongs in the highlighted bay.',
    bootTest: 'Boot test',
    runBoot: 'Press the power button',
    booting: 'POST running',
    bootPass: 'System booted',
    bootFail: 'Boot failed',
    grade: 'Customer rating',
    payout: 'Payout',
    collect: 'Collect fee',
    restart: 'Try another build',
    daily: 'Daily build challenge',
    dailyHint: 'One attempt per day. Same brief for everyone.',
    dailyDone: 'Today is done - come back tomorrow.',
    hallOfFame: 'Hall of fame',
    poster: 'Save poster',
    share: 'Share',
    settings: 'Preferences',
    language: 'Language',
    currency: 'Currency',
    sound: 'Sound effects',
    tutorial: 'How it works',
    tutorialStep1: 'Take a job',
    tutorialStep2: 'Buy parts within budget',
    tutorialStep3: 'Assemble every part',
    tutorialStep4: 'Boot and get rated',
    next: 'Next',
    finish: 'Got it',
    mistakes: 'Mistakes',
    time: 'Time',
    quality: 'Build quality',
    partsCost: 'Parts cost',
    profit: 'Profit',
    repairs: 'Diagnose and repair',
    repairsIntro: 'Sick PCs with real symptoms. Inspect them, find the faulty part and charge for the fix.',
    symptom: 'Reported symptom',
    inspect: 'Inspect',
    diagnose: 'Replace',
    fixed: 'Fixed',
    wrongPart: 'That part is fine - the fault is elsewhere.',
    repairDone: 'All faults fixed',
    close: 'Close',
    emptyCareer: 'No jobs yet',
    spend: 'Spent',
    earn: 'Earned',
  },
  fil: {
    career: 'Karera',
    repair: 'Repair Bench',
    careerEyebrow: 'Career mode',
    careerTitle: 'Ang workshop mo',
    careerIntro: 'Tumanggap ng trabaho, bumili ng parts, i-assemble ang PC, ipasa ang boot test at kunin ang bayad.',
    wallet: 'Pera',
    level: 'Level',
    xp: 'XP',
    reputation: 'Reputasyon',
    jobsDone: 'Natapos na trabaho',
    openJobs: 'Mga trabahong bukas',
    locked: 'Naka-lock',
    unlockAt: 'Bukas sa level',
    takeJob: 'Kunin ang trabaho',
    brief: 'Hiling ng customer',
    budget: 'Badyet',
    fee: 'Bayad sa serbisyo',
    targetFps: 'Target FPS',
    quiet: 'Tahimik na build',
    rgb: 'Gusto ng RGB',
    risk: 'Panganib',
    startBuild: 'Buksan ang builder',
    orderParts: 'I-order ang parts at magsimula',
    orderHint: 'Pumili ng parts sa builder, tapos bumalik dito para i-order gamit ang badyet.',
    overBudget: 'Lampas na ito sa badyet ng customer.',
    assembly: 'Pag-assemble',
    assemblyHint: 'I-click ang part sa tray na bagay sa naka-highlight na bay.',
    bootTest: 'Boot test',
    runBoot: 'Pindutin ang power button',
    booting: 'Tumakbo ang POST',
    bootPass: 'Nag-boot ang system',
    bootFail: 'Bigo ang boot',
    grade: 'Rating ng customer',
    payout: 'Bayad',
    collect: 'Kunin ang bayad',
    restart: 'Subukan ang ibang build',
    daily: 'Arawang build challenge',
    dailyHint: 'Isang subok bawat araw. Pareho ang brief para sa lahat.',
    dailyDone: 'Tapos na ngayon - balik bukas.',
    hallOfFame: 'Hall of fame',
    poster: 'I-save ang poster',
    share: 'I-share',
    settings: 'Mga setting',
    language: 'Wika',
    currency: 'Pera',
    sound: 'Tunog',
    tutorial: 'Paano ito gumagana',
    tutorialStep1: 'Tumanggap ng trabaho',
    tutorialStep2: 'Bumili ng parts sa badyet',
    tutorialStep3: 'I-assemble lahat',
    tutorialStep4: 'I-boot at makuha ang rating',
    next: 'Susunod',
    finish: 'Naintindihan ko',
    mistakes: 'Pagkakamali',
    time: 'Oras',
    quality: 'Kalidad ng build',
    partsCost: 'Gastos sa parts',
    profit: 'Kita',
    repairs: 'Mag-diagnose at mag-repair',
    repairsIntro: 'May sakit na PC na may totoong sintomas. Suriin, hanapin ang sira at maningil.',
    symptom: 'Reklamo ng customer',
    inspect: 'Suriin',
    diagnose: 'Palitan',
    fixed: 'Naayos',
    wrongPart: 'Maayos ang part na iyon - sa iba ang sira.',
    repairDone: 'Naayos lahat ng sira',
    close: 'Isara',
    emptyCareer: 'Wala pang trabaho',
    spend: 'Nagastos',
    earn: 'Kinita',
  },
};

export function t(key, fallback = '') {
  const table = DICT[state.lang] || DICT.en;
  return table[key] || DICT.en[key] || fallback || key;
}

export function currentLang() {
  return state.lang;
}

export function currentCurrencyCode() {
  return getCurrency();
}

const langListeners = new Set();

/** Subscribe to language changes. Returns an unsubscribe function. */
export function onLanguage(handler) {
  langListeners.add(handler);
  return () => langListeners.delete(handler);
}

/**
 * Called once at boot and by every page that renders translated copy: it sets
 * the document language and the root data attribute used by CSS, and returns
 * the active language code. Safe to call repeatedly.
 */
export function initialiseLanguage() {
  applyStoredCurrency();
  document.documentElement.lang = state.lang === 'fil' ? 'fil' : 'en';
  document.documentElement.dataset.lang = state.lang;
  document.documentElement.dataset.sound = state.sound ? 'on' : 'off';
  document.documentElement.dataset.quality = state.quality;
  return state.lang;
}

/** Notify every listener after a language change so pages can re-render. */
export function broadcastLanguage() {
  initialiseLanguage();
  langListeners.forEach((handler) => {
    try {
      handler(state.lang);
    } catch (error) {
      console.error(error);
    }
  });
}

export { DICT };
