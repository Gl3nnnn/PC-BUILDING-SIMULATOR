/**
 * Learning mode progress.
 *
 * Only results are stored: which lessons were passed, the score, and when.
 * The lesson text itself lives in js/data/lessons.js, so a lesson can be edited
 * without losing anyone's progress.
 */

const KEY = 'pcbs.learn.v1';
const listeners = new Set();

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== 'object' || typeof parsed.lessons !== 'object') {
      return { lessons: {} };
    }
    const lessons = {};
    Object.entries(parsed.lessons).forEach(([id, entry]) => {
      if (!entry || typeof entry !== 'object') return;
      lessons[id] = {
        passed: Boolean(entry.passed),
        score: Number.isFinite(entry.score) ? entry.score : 0,
        total: Number.isFinite(entry.total) ? entry.total : 0,
        attempts: Number.isFinite(entry.attempts) ? entry.attempts : 0,
        at: typeof entry.at === 'string' ? entry.at : '',
      };
    });
    return { lessons };
  } catch {
    return { lessons: {} };
  }
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* progress simply does not stick */
  }
}

function emit() {
  listeners.forEach((handler) => {
    try {
      handler(getLearningState());
    } catch (error) {
      console.error(error);
    }
  });
}

export function getLearningState() {
  return { lessons: { ...state.lessons } };
}

export function getLessonResult(id) {
  return state.lessons[id] || null;
}

export function isLessonPassed(id) {
  return Boolean(state.lessons[id]?.passed);
}

export function getLearningStats(total) {
  const passed = Object.values(state.lessons).filter((entry) => entry.passed).length;
  const attempts = Object.values(state.lessons).reduce((sum, entry) => sum + (entry.attempts || 0), 0);
  return { passed, total: total || 0, attempts };
}

/**
 * Record an assessment attempt. A result only counts as passed when every
 * question is right; the attempt count keeps rising either way, so a page can
 * show "two attempts" without calling it progress.
 */
export function recordLessonResult(id, score, total) {
  if (!id) return null;
  const previous = state.lessons[id] || { attempts: 0, score: 0, total: 0, passed: false };
  const passed = total > 0 && score === total;
  state.lessons[id] = {
    passed: previous.passed || passed,
    score: Math.max(previous.score, score),
    total: total || previous.total,
    attempts: previous.attempts + 1,
    at: new Date().toISOString(),
  };
  persist();
  emit();
  return state.lessons[id];
}

export function resetLearning() {
  state = { lessons: {} };
  persist();
  emit();
}

export function onLearning(handler) {
  listeners.add(handler);
  return () => listeners.delete(handler);
}
