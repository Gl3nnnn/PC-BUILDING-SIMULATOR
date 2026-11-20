/**
 * The three game modes.
 *
 * Free build, Career and Learning are three ways into the same workshop. The
 * chosen mode is only a preference: it decides which page the game opens on and
 * which surface the header highlights. No mode is ever locked away, because a
 * player who wants to build a PC should not have to finish a quiz first.
 */

const KEY = 'pcbs.mode.v1';

export const MODES = [
  {
    id: 'free',
    title: 'Free build',
    icon: 'wrench',
    tagline: 'Any part, any budget',
    blurb: 'The whole catalogue with no limits. Pick anything, watch the price, the compatibility checks and the 3D preview, then save or share the build.',
    route: '#/builder',
    cta: 'Open builder',
  },
  {
    id: 'career',
    title: 'Career',
    icon: 'money',
    tagline: 'Customers, budgets, ratings',
    blurb: 'Real briefs with a peso budget and a performance target. Order the parts, assemble them, pass the boot test, then collect the fee and your star rating.',
    route: '#/career',
    cta: 'See the job board',
  },
  {
    id: 'learn',
    title: 'Learn',
    icon: 'bookmark',
    tagline: 'Lessons and assessments',
    blurb: 'Six guided lessons from part identification to troubleshooting, each ending in a short assessment that has to be answered correctly to count as passed.',
    route: '#/learn',
    cta: 'Start learning',
  },
];

export const MODES_BY_ID = Object.fromEntries(MODES.map((mode) => [mode.id, mode]));

const listeners = new Set();
let active = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    const stored = raw ? JSON.parse(raw) : null;
    if (stored && MODES_BY_ID[stored.active]) return stored.active;
  } catch {
    /* a broken or unavailable store just means the default */
  }
  return 'career';
}

function emit() {
  listeners.forEach((handler) => {
    try {
      handler(active);
    } catch (error) {
      console.error(error);
    }
  });
}

export function getActiveModeId() {
  return active;
}

export function getActiveMode() {
  return MODES_BY_ID[active] || MODES[0];
}

export function setActiveMode(id) {
  if (!MODES_BY_ID[id]) return getActiveModeId();
  active = id;
  try {
    localStorage.setItem(KEY, JSON.stringify({ active }));
  } catch {
    /* preference simply does not stick */
  }
  emit();
  return active;
}

export function onMode(handler) {
  listeners.add(handler);
  return () => listeners.delete(handler);
}

/** The mode a route belongs to, used to keep the header pill honest. */
export function modeForRoute(route) {
  if (route === 'learn') return 'learn';
  if (['career', 'repair'].includes(route)) return 'career';
  return null;
}
