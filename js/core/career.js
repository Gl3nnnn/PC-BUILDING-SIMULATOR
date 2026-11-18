/**
 * Career state: wallet, XP, level, reputation, completed jobs, daily challenge,
 * hall of fame and the job that is currently in progress.
 *
 * Kept in localStorage under one key so a save/load is a single object and
 * older versions of the file can be upgraded by `migrate()`.
 */

import { CATEGORIES } from '../data/hardware.js';
import { dailyChallenge, getJob } from '../data/jobs.js';
import { emptyBuild } from './build.js';

const KEY = 'pcbs.career.v1';
const START_WALLET = 6000;

const listeners = new Map();

function emit(event, payload) {
  const set = listeners.get(event);
  if (!set) return;
  set.forEach((handler) => {
    try {
      handler(payload);
    } catch (error) {
      console.error(error);
    }
  });
}

export function onCareer(event, handler) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(handler);
  return () => listeners.get(event)?.delete(handler);
}

function freshProfile() {
  return {
    name: 'New technician',
    xp: 0,
    wallet: START_WALLET,
    jobsDone: 0,
    starsTotal: 0,
    spent: 0,
    earned: 0,
    startedAt: new Date().toISOString(),
  };
}

function freshState() {
  return {
    v: 1,
    profile: freshProfile(),
    active: null,
    completed: {},
    daily: null,
    hall: [],
    repaired: {},
  };
}

function sanitize(raw) {
  const base = freshState();
  if (!raw || typeof raw !== 'object') return base;
  const profile = raw.profile && typeof raw.profile === 'object' ? raw.profile : {};
  base.profile = {
    ...base.profile,
    name: typeof profile.name === 'string' && profile.name.trim() ? profile.name.trim().slice(0, 24) : 'New technician',
    xp: Math.max(0, Math.round(Number(profile.xp) || 0)),
    wallet: Number.isFinite(Number(profile.wallet)) ? Math.round(Number(profile.wallet)) : START_WALLET,
    jobsDone: Math.max(0, Math.round(Number(profile.jobsDone) || 0)),
    starsTotal: Math.max(0, Math.round(Number(profile.starsTotal) || 0)),
    spent: Math.max(0, Math.round(Number(profile.spent) || 0)),
    earned: Math.max(0, Math.round(Number(profile.earned) || 0)),
    startedAt: typeof profile.startedAt === 'string' ? profile.startedAt : base.profile.startedAt,
  };

  if (raw.active && typeof raw.active === 'object' && raw.active.jobId) {
    const build = raw.active.build && typeof raw.active.build === 'object' ? raw.active.build : null;
    base.active = {
      jobId: String(raw.active.jobId),
      startedAt: Number(raw.active.startedAt) || Date.now(),
      mistakes: Math.max(0, Math.round(Number(raw.active.mistakes) || 0)),
      placed: Array.isArray(raw.active.placed) ? raw.active.placed.filter((id) => typeof id === 'string') : [],
      phase: ['build', 'assemble', 'boot', 'rate'].includes(raw.active.phase) ? raw.active.phase : 'build',
      build: build
        ? {
            name: String(build.name || 'Customer build').slice(0, 60),
            items: Object.fromEntries(CATEGORIES.map((category) => [
              category.id,
              Array.isArray(build.items?.[category.id]) ? build.items[category.id].filter((id) => typeof id === 'string') : [],
            ])),
            budget: Number.isFinite(Number(build.budget)) ? Number(build.budget) : null,
          }
        : null,
      daily: Boolean(raw.active.daily),
    };
  }

  if (raw.completed && typeof raw.completed === 'object') {
    base.completed = Object.fromEntries(Object.entries(raw.completed)
      .filter(([, value]) => value && typeof value === 'object')
      .map(([id, value]) => [id, {
        stars: Math.max(1, Math.min(5, Math.round(Number(value.stars) || 1))),
        payout: Math.round(Number(value.payout) || 0),
        at: typeof value.at === 'string' ? value.at : new Date().toISOString(),
      }]));
  }

  if (raw.daily && typeof raw.daily === 'object' && typeof raw.daily.key === 'string') {
    base.daily = {
      key: raw.daily.key,
      stars: Math.max(0, Math.min(5, Math.round(Number(raw.daily.stars) || 0))),
      score: Math.max(0, Math.round(Number(raw.daily.score) || 0)),
    };
  }

  if (Array.isArray(raw.hall)) {
    base.hall = raw.hall
      .filter((entry) => entry && typeof entry === 'object')
      .map((entry) => ({
        id: String(entry.id || Math.random().toString(36).slice(2)),
        name: String(entry.name || 'Anonymous tech').slice(0, 24),
        job: String(entry.job || 'Daily brief').slice(0, 40),
        stars: Math.max(1, Math.min(5, Math.round(Number(entry.stars) || 1))),
        score: Math.max(0, Math.round(Number(entry.score) || 0)),
        at: typeof entry.at === 'string' ? entry.at : new Date().toISOString(),
      }))
      .slice(0, 40);
  }

  if (raw.repaired && typeof raw.repaired === 'object') {
    base.repaired = Object.fromEntries(Object.entries(raw.repaired)
      .filter(([, value]) => Number.isFinite(Number(value)))
      .map(([id, value]) => [id, Math.round(Number(value))]));
  }

  return base;
}

let state = sanitize(readRaw());

function readRaw() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* localStorage may be blocked - the game then lives for this session only */
  }
  emit('career', getState());
}

/* ------------------------------------------------------------------ */
/* Levels                                                             */
/* ------------------------------------------------------------------ */

/** XP needed to reach a given level (level 1 = 0 XP). */
export function xpForLevel(level) {
  if (level <= 1) return 0;
  let total = 0;
  for (let i = 1; i < level; i += 1) total += 80 + i * 60;
  return total;
}

export function levelFromXp(xp) {
  let level = 1;
  while (level < 30 && xp >= xpForLevel(level + 1)) level += 1;
  return level;
}

export const LEVEL_TITLES = [
  'Apprentice', 'Bench trainee', 'Junior technician', 'Repair assistant', 'Build technician',
  'System builder', 'Senior builder', 'Workshop lead', 'Master technician', 'Shop owner',
];

export function levelTitle(level) {
  return LEVEL_TITLES[Math.min(LEVEL_TITLES.length - 1, Math.max(0, level - 1))];
}

/* ------------------------------------------------------------------ */
/* Reads                                                              */
/* ------------------------------------------------------------------ */

export function getState() {
  return JSON.parse(JSON.stringify(state));
}

export function getProfile() {
  return { ...state.profile };
}

export function getLevelInfo() {
  const level = levelFromXp(state.profile.xp);
  const current = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const progress = next > current ? (state.profile.xp - current) / (next - current) : 1;
  return {
    level,
    title: levelTitle(level),
    xp: state.profile.xp,
    intoLevel: state.profile.xp - current,
    needed: next - current,
    progress: Math.max(0, Math.min(1, progress)),
  };
}

export function getReputation() {
  return state.profile.jobsDone ? state.profile.starsTotal / state.profile.jobsDone : 0;
}

export function getActive() {
  return state.active ? JSON.parse(JSON.stringify(state.active)) : null;
}

export function getCompleted(jobId) {
  return state.completed[jobId] || null;
}

export function getDailyAttempt() {
  return state.daily;
}

export function getHallOfFame() {
  return [...state.hall].sort((a, b) => b.score - a.score || b.stars - a.stars);
}

export function isDailyDone() {
  const today = dailyChallenge();
  return Boolean(state.daily && state.daily.key === today.key);
}

/* ------------------------------------------------------------------ */
/* Writes                                                             */
/* ------------------------------------------------------------------ */

export function renameTech(name) {
  const clean = String(name || '').trim().slice(0, 24) || 'New technician';
  state.profile.name = clean;
  persist();
}

/** Start a job with an empty order. The player then fills the builder. */
export function beginJob(jobId, options = {}) {
  const job = getJob(jobId);
  if (!job && !options.daily) return { ok: false, reason: 'Unknown job.' };
  const emptyItems = Object.fromEntries(CATEGORIES.map((category) => [category.id, []]));
  state.active = {
    jobId,
    daily: Boolean(options.daily),
    startedAt: Date.now(),
    mistakes: 0,
    placed: [],
    phase: 'build',
    build: { name: job ? job.title : 'Daily build', items: emptyItems, budget: job ? job.budget : null },
  };
  persist();
  emit('active', state.active);
  return { ok: true, active: getActive() };
}

/** Send the current builder build to the customer as this job's order. */
export function orderParts(build) {
  if (!state.active) return { ok: false, reason: 'No job in progress.' };
  const items = Object.fromEntries(CATEGORIES.map((category) => [
    category.id,
    [...(build?.items?.[category.id] || [])],
  ]));
  const count = CATEGORIES.reduce((sum, category) => sum + items[category.id].length, 0);
  if (count === 0) return { ok: false, reason: 'Add parts to the build first.' };
  state.active.build = { ...state.active.build, items };
  state.active.phase = 'assemble';
  state.active.startedAt = Date.now();
  persist();
  emit('active', state.active);
  return { ok: true, active: getActive() };
}

/** Snapshot the current builder build as the job order (legacy one-step path). */
export function takeJob(jobId, build, options = {}) {
  const job = getJob(jobId);
  if (!job && !options.daily) return { ok: false, reason: 'Unknown job.' };
  const items = Object.fromEntries(CATEGORIES.map((category) => [
    category.id,
    [...(build?.items?.[category.id] || [])],
  ]));
  const total = CATEGORIES.reduce((sum, category) => sum + items[category.id].length, 0);
  if (total === 0) return { ok: false, reason: 'Add parts to the build first.' };
  state.active = {
    jobId,
    daily: Boolean(options.daily),
    startedAt: Date.now(),
    mistakes: 0,
    placed: [],
    phase: 'assemble',
    build: { name: job ? job.title : 'Daily build', items, budget: job ? job.budget : null },
  };
  persist();
  emit('active', state.active);
  return { ok: true, active: getActive() };
}

export function setActivePhase(phase) {
  if (!state.active) return;
  state.active.phase = phase;
  persist();
}

export function addMistake() {
  if (!state.active) return 0;
  state.active.mistakes += 1;
  persist();
  return state.active.mistakes;
}

export function markPlaced(categoryId) {
  if (!state.active) return;
  if (!state.active.placed.includes(categoryId)) state.active.placed.push(categoryId);
  persist();
}

export function resetAssembly() {
  if (!state.active) return;
  state.active.placed = [];
  state.active.mistakes = 0;
  state.active.phase = 'assemble';
  persist();
}

export function abandonJob() {
  state.active = null;
  persist();
  emit('active', null);
}

export function startBuildPhase() {
  if (!state.active) return;
  state.active.phase = 'build';
  persist();
}

/**
 * Finish a job. Charges nothing for parts (the customer budget pays for those),
 * credits the fee, XP and stars, records the rating and updates the hall of fame.
 */
export function finishJob(result) {
  const active = state.active;
  if (!active || !result) return null;
  const job = getJob(active.jobId);
  const title = job ? job.title : 'Daily brief';
  const stars = Math.max(1, Math.min(5, Number(result.stars) || 1));
  const payout = Math.max(0, Math.round(Number(result.payout) || 0));
  const xp = Math.max(0, Math.round(Number(result.xp) || 0));

  state.profile.wallet += payout;
  state.profile.earned += payout;
  state.profile.xp += xp;
  state.profile.jobsDone += 1;
  state.profile.starsTotal += stars;

  const previous = state.completed[active.jobId];
  if (!previous || stars >= previous.stars) {
    state.completed[active.jobId] = { stars, payout, at: new Date().toISOString() };
  }

  if (active.daily) {
    const today = dailyChallenge();
    state.daily = { key: today.key, stars, score: Math.round((result.evaluation?.score || 0) * stars) };
  }

  state.hall = [
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: state.profile.name,
      job: active.daily ? 'Daily brief' : title,
      stars,
      score: Math.round((result.evaluation?.score || 0) * stars),
      at: new Date().toISOString(),
    },
    ...state.hall,
  ].slice(0, 40);

  state.active = null;
  persist();
  emit('finished', { stars, payout, xp, jobId: active.jobId });
  emit('active', null);
  return { stars, payout, xp };
}

/**
 * Repair jobs pay a flat amount and mark the case solved.
 * `earned` is the money actually charged; `stars` feeds the reputation.
 */
export function finishRepair({ id, payout, stars = 5 }) {
  if (!id) return null;
  const already = state.repaired[id];
  if (already) return { payout: 0, duplicate: true };
  state.repaired[id] = stars;
  state.profile.wallet += Math.round(payout);
  state.profile.earned += Math.round(payout);
  state.profile.xp += 120 * stars;
  persist();
  emit('repair', { id, payout });
  return { payout: Math.round(payout), duplicate: false };
}

export function getRepaired(id) {
  return state.repaired[id] || 0;
}

export function addXp(amount) {
  state.profile.xp += Math.max(0, Math.round(amount));
  persist();
}

export function spend(amount) {
  const value = Math.max(0, Math.round(Number(amount) || 0));
  if (value > state.profile.wallet) return false;
  state.profile.wallet -= value;
  state.profile.spent += value;
  persist();
  return true;
}

export function setTechNameIfEmpty(name) {
  if (state.profile.name !== 'New technician') return;
  const clean = String(name || '').trim().slice(0, 24);
  if (!clean) return;
  state.profile.name = clean;
  persist();
}

export function resetCareer() {
  state = freshState();
  persist();
  emit('active', null);
}

export function emptyJobBuild(name = 'Customer build', budget = null) {
  const build = emptyBuild(name);
  build.budget = budget;
  return build;
}

export function jobsDoneCount() {
  return state.profile.jobsDone;
}
