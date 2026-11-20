/**
 * Achievements and progression.
 *
 * Two things are kept: counters (how many times something happened) and the
 * date each achievement was unlocked. Every achievement also reports progress,
 * so a locked one can show "3 / 5" instead of being a mystery badge.
 *
 * Nothing here is derived from storage directly: the caller passes a snapshot
 * of the library, the career profile and the learning results, and the rules
 * below are plain functions of that snapshot. That keeps the rules testable
 * and stops two parts of the app from disagreeing about a number.
 */

import { CATEGORIES } from '../data/hardware.js';
import { getIds } from './build.js';

const KEY = 'pcbs.achv.v1';

const listeners = new Set();

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== 'object') return { counters: {}, unlocked: {} };
    const counters = {};
    Object.entries(parsed.counters || {}).forEach(([key, value]) => {
      if (Number.isFinite(Number(value))) counters[key] = Math.max(0, Math.round(Number(value)));
    });
    const unlocked = {};
    Object.entries(parsed.unlocked || {}).forEach(([key, value]) => {
      if (typeof value === 'string') unlocked[key] = value;
    });
    return { counters, unlocked };
  } catch {
    return { counters: {}, unlocked: {} };
  }
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* achievements simply do not stick in a browser that blocks storage */
  }
}

function emit(payload) {
  listeners.forEach((handler) => {
    try {
      handler(payload);
    } catch (error) {
      console.error(error);
    }
  });
}

export function onAchievements(handler) {
  listeners.add(handler);
  return () => listeners.delete(handler);
}

/* ------------------------------------------------------------------ */
/* The list                                                            */
/* ------------------------------------------------------------------ */

/**
 * `measure` returns the current number, `goal` is the target.
 * A rule reading `build` looks at the build open in the builder right now.
 */
export const ACHIEVEMENTS = [
  {
    id: 'first-save', title: 'First build on the shelf', group: 'Saving', tier: 'bronze', points: 10,
    text: 'Save one build to the library.',
    goal: 1, measure: (ctx) => ctx.library.total,
  },
  {
    id: 'five-saves', title: 'Collector', group: 'Saving', tier: 'silver', points: 30,
    text: 'Keep five builds in the library.',
    goal: 5, measure: (ctx) => ctx.library.total,
  },
  {
    id: 'named-build', title: 'It has a name', group: 'Saving', tier: 'bronze', points: 10,
    text: 'Save a build with a name you chose yourself.',
    goal: 1, measure: (ctx) => ctx.library.clientNamed,
  },
  {
    id: 'first-load', title: 'Back on the bench', group: 'Saving', tier: 'bronze', points: 10,
    text: 'Load a saved build back into the builder.',
    goal: 1, measure: (ctx) => ctx.counters.loads,
  },
  {
    id: 'duplicate', title: 'Remix', group: 'Saving', tier: 'bronze', points: 15,
    text: 'Duplicate a saved build and keep both.',
    goal: 1, measure: (ctx) => ctx.counters.duplicates,
  },
  {
    id: 'export-json', title: 'Written down', group: 'Backup', tier: 'bronze', points: 15,
    text: 'Export a build as a JSON file.',
    goal: 1, measure: (ctx) => ctx.counters.exportsJson,
  },
  {
    id: 'export-report', title: 'Paper trail', group: 'Backup', tier: 'bronze', points: 15,
    text: 'Print or export a build report.',
    goal: 1, measure: (ctx) => ctx.counters.exportsReport,
  },
  {
    id: 'share-link', title: 'Show it off', group: 'Backup', tier: 'silver', points: 20,
    text: 'Share a build through a link.',
    goal: 1, measure: (ctx) => ctx.counters.shares,
  },
  {
    id: 'import-build', title: 'From another desk', group: 'Backup', tier: 'silver', points: 20,
    text: 'Import a build from a file.',
    goal: 1, measure: (ctx) => ctx.counters.imports,
  },
  {
    id: 'backup-all', title: 'Whole library', group: 'Backup', tier: 'silver', points: 25,
    text: 'Export every build in one file.',
    goal: 1, measure: (ctx) => ctx.counters.backups,
  },
  {
    id: 'restore-all', title: 'Restored', group: 'Backup', tier: 'silver', points: 25,
    text: 'Restore a library from a backup file.',
    goal: 1, measure: (ctx) => ctx.counters.restores,
  },
  {
    id: 'rollback', title: 'Roll it back', group: 'Saving', tier: 'silver', points: 20,
    text: 'Restore an earlier version from a build’s history.',
    goal: 1, measure: (ctx) => ctx.counters.rollbacks,
  },
  {
    id: 'full-build', title: 'Nothing missing', group: 'Building', tier: 'gold', points: 40,
    text: 'Fill every core part of a build.',
    goal: 1, measure: (ctx) => (ctx.build && ctx.build.coreFilled >= ctx.build.coreTotal ? 1 : 0),
  },
  {
    id: 'clean-build', title: 'No red flags', group: 'Building', tier: 'silver', points: 30,
    text: 'Save a build with no compatibility errors.',
    goal: 1, measure: (ctx) => ctx.library.cleanSaved,
  },
  {
    id: 'under-budget', title: 'On the money', group: 'Building', tier: 'silver', points: 30,
    text: 'Save a build that fits inside its own budget.',
    goal: 1, measure: (ctx) => ctx.library.budgetSaved,
  },
  {
    id: 'tinkerer', title: 'Tinkerer', group: 'Building', tier: 'bronze', points: 20,
    text: 'Swap twenty components.',
    goal: 20, measure: (ctx) => ctx.counters.swaps,
  },
  {
    id: 'first-job', title: 'Paid work', group: 'Career', tier: 'bronze', points: 20,
    text: 'Deliver your first customer PC.',
    goal: 1, measure: (ctx) => ctx.career.jobsDone,
  },
  {
    id: 'five-jobs', title: 'Word gets round', group: 'Career', tier: 'gold', points: 45,
    text: 'Deliver five customer PCs.',
    goal: 5, measure: (ctx) => ctx.career.jobsDone,
  },
  {
    id: 'repair-three', title: 'Bench detective', group: 'Career', tier: 'silver', points: 30,
    text: 'Fix three broken PCs on the repair bench.',
    goal: 3, measure: (ctx) => ctx.career.repaired,
  },
  {
    id: 'level-five', title: 'System builder', group: 'Career', tier: 'gold', points: 40,
    text: 'Reach career level 5.',
    goal: 5, measure: (ctx) => ctx.career.level,
  },
  {
    id: 'student', title: 'Student', group: 'Learning', tier: 'bronze', points: 20,
    text: 'Pass three lessons.',
    goal: 3, measure: (ctx) => ctx.learn.passed,
  },
  {
    id: 'graduate', title: 'Graduate', group: 'Learning', tier: 'gold', points: 50,
    text: 'Pass every lesson.',
    goal: 6, measure: (ctx) => ctx.learn.passed,
  },
];

export const ACHIEVEMENTS_BY_ID = Object.fromEntries(ACHIEVEMENTS.map((entry) => [entry.id, entry]));

export const GROUPS = ['Saving', 'Building', 'Backup', 'Career', 'Learning'];

const TIER_POINTS = { bronze: 1, silver: 2, gold: 3 };

/* ------------------------------------------------------------------ */
/* Reading                                                             */
/* ------------------------------------------------------------------ */

export function getUnlockedAt(id) {
  return state.unlocked[id] || null;
}

export function isUnlocked(id) {
  return Boolean(state.unlocked[id]);
}

export function getCounters() {
  return { ...state.counters };
}

/** Add one or more ticks to a counter. Returns the new value. */
export function record(counter, amount = 1) {
  if (!counter) return 0;
  state.counters[counter] = Math.max(0, Math.round((state.counters[counter] || 0) + amount));
  persist();
  emit({ type: 'counter', counter, value: state.counters[counter] });
  return state.counters[counter];
}

/**
 * Recompute every rule against a snapshot and unlock what is now true.
 * Returns the achievements unlocked by this call, so the caller can toast them.
 */
export function evaluate(ctx) {
  const fresh = [];
  ACHIEVEMENTS.forEach((entry) => {
    if (state.unlocked[entry.id]) return;
    let value = 0;
    try {
      value = Number(entry.measure(ctx)) || 0;
    } catch {
      value = 0;
    }
    if (value >= entry.goal) {
      state.unlocked[entry.id] = new Date().toISOString();
      fresh.push(entry);
    }
  });
  if (fresh.length) {
    persist();
    fresh.forEach((entry) => emit({ type: 'unlocked', achievement: entry }));
  }
  return fresh;
}

/** Full list with progress, for the achievements grid. */
export function listAchievements(ctx) {
  return ACHIEVEMENTS.map((entry) => {
    let value = 0;
    try {
      value = Math.max(0, Number(entry.measure(ctx)) || 0);
    } catch {
      value = 0;
    }
    return {
      ...entry,
      value: Math.min(value, entry.goal),
      unlockedAt: state.unlocked[entry.id] || null,
      unlocked: Boolean(state.unlocked[entry.id]),
    };
  });
}

export function getSummary(ctx) {
  const items = listAchievements(ctx);
  const unlocked = items.filter((entry) => entry.unlocked);
  const points = unlocked.reduce((sum, entry) => sum + entry.points, 0);
  const maxPoints = ACHIEVEMENTS.reduce((sum, entry) => sum + entry.points, 0);
  return {
    unlocked: unlocked.length,
    total: items.length,
    points,
    maxPoints,
    tiers: {
      bronze: unlocked.filter((entry) => entry.tier === 'bronze').length,
      silver: unlocked.filter((entry) => entry.tier === 'silver').length,
      gold: unlocked.filter((entry) => entry.tier === 'gold').length,
    },
    items,
  };
}

export function resetAchievements() {
  state = { counters: {}, unlocked: {} };
  persist();
  emit({ type: 'reset' });
}

/* ------------------------------------------------------------------ */
/* Snapshot helper                                                     */
/* ------------------------------------------------------------------ */

/**
 * Builds the context object the rules read. Layout and career/learn state are
 * passed in rather than imported so this module stays free of cycles.
 */
export function makeContext({ savedBuilds = [], career = {}, learn = {}, build = null, evaluateBuild = null }) {
  const named = savedBuilds.filter((entry) => {
    const name = String(entry.name || '').trim();
    return name && !/^(untitled|customer|imported) build$/i.test(name);
  }).length;

  let cleanSaved = 0;
  let budgetSaved = 0;
  if (evaluateBuild) {
    savedBuilds.forEach((entry) => {
      try {
        const result = evaluateBuild(entry);
        if (!result.errors?.length) cleanSaved += 1;
        if (entry.budget && result.total <= entry.budget) budgetSaved += 1;
      } catch {
        /* a broken saved entry should not break the whole list */
      }
    });
  }

  const filled = build ? CATEGORIES.filter((category) => category.required).filter((category) => getIds(build, category.id).length > 0).length : 0;

  return {
    counters: getCounters(),
    library: {
      total: savedBuilds.length,
      clientNamed: named,
      cleanSaved,
      budgetSaved,
    },
    career: {
      level: Number(career.level) || 1,
      jobsDone: Number(career.jobsDone) || 0,
      repaired: Number(career.repaired) || 0,
      starsTotal: Number(career.starsTotal) || 0,
    },
    learn: { passed: Number(learn.passed) || 0 },
    build: build ? { coreFilled: filled, coreTotal: CATEGORIES.filter((category) => category.required).length } : null,
  };
}

export function tierOf(points) {
  if (points >= 3) return 'gold';
  if (points === 2) return 'silver';
  if (points === 1) return 'bronze';
  return 'none';
}

export { TIER_POINTS };
