/**
 * Learning mode page.
 *
 * Left column: the six lessons with their pass state. Right column: the open
 * lesson - its guided steps, then a short assessment. An assessment only counts
 * as passed when every answer is right, and a wrong answer is explained rather
 * than just marked wrong.
 */

import { LESSONS, getLesson } from '../data/lessons.js';
import { getHardware } from '../data/hardware.js';
import {
  getLessonResult, getLearningStats, isLessonPassed, onLearning, recordLessonResult,
} from '../core/learn.js';
import { escapeHtml } from '../core/format.js';
import { icon } from '../ui/icons.js';
import { progressBar } from '../ui/common.js';
import { productArt } from '../ui/art.js';
import { sfx } from '../core/audio.js';
import { toast } from '../ui/toast.js';

const state = {
  lessonId: '',
  stepIndex: 0,
  answers: [],
  checked: false,
  scored: false,
};

function resetQuiz(lesson) {
  state.stepIndex = 0;
  state.answers = new Array(lesson.quiz.length).fill(-1);
  state.checked = false;
  state.scored = false;
}

function lessonListHTML(openId) {
  return LESSONS.map((lesson) => {
    const result = getLessonResult(lesson.id);
    const passed = Boolean(result?.passed);
    const isOpen = lesson.id === openId;
    const status = passed
      ? `<span class="learn-badge is-passed">${icon('check', 12)} Passed${result?.score ? ` ${result.score}/${result.total}` : ''}</span>`
      : result?.attempts
        ? `<span class="learn-badge is-tried">${result.attempts} attempt${result.attempts === 1 ? '' : 's'}</span>`
        : '<span class="learn-badge">Not started</span>';
    return `
      <button class="learn-row ${isOpen ? 'is-active' : ''} ${passed ? 'is-passed' : ''}" type="button" data-lesson="${lesson.id}">
        <span class="learn-row-num">${lesson.order}</span>
        <span class="learn-row-copy">
          <strong>${escapeHtml(lesson.title)}</strong>
          <span>${escapeHtml(lesson.blurb)}</span>
        </span>
        ${status}
      </button>
    `;
  }).join('');
}

function partsMarkup(lesson) {
  const parts = (lesson.partIds || []).map((id) => getHardware(id)).filter(Boolean);
  if (!parts.length) return '';
  return `
    <div class="learn-parts">
      ${parts.map((part) => `
        <a class="learn-part" href="#/database?category=${escapeHtml(part.category)}&id=${escapeHtml(part.id)}">
          <span class="learn-part-art">${productArt(part)}</span>
          <strong>${escapeHtml(part.name)}</strong>
          <span>${escapeHtml(part.brand)}</span>
        </a>
      `).join('')}
    </div>
  `;
}

function stepsHTML(lesson) {
  const idx = Math.min(state.stepIndex, lesson.steps.length - 1);
  const step = lesson.steps[idx];
  const dots = lesson.steps.map((_, i) => `
    <button class="learn-dot ${i === idx ? 'is-current' : ''} ${i < idx ? 'is-done' : ''}" type="button" data-step="${i}" aria-label="Step ${i + 1}">${i + 1}</button>
  `).join('');
  return `
    <div class="learn-steps">
      <div class="learn-step-head">
        <span class="learn-step-count">Step ${idx + 1} of ${lesson.steps.length}</span>
        <div class="learn-dots">${dots}</div>
      </div>
      <h3 class="learn-step-title">${escapeHtml(step.title)}</h3>
      <p class="learn-step-text">${escapeHtml(step.text)}</p>
      <div class="learn-step-nav">
        <button class="btn btn--ghost btn--sm" type="button" data-action="learn-prev" ${idx === 0 ? 'disabled' : ''}>${icon('arrowRight', 14, 'is-flipped')}<span>Previous</span></button>
        <button class="btn btn--primary btn--sm" type="button" data-action="learn-next">
          <span>${idx === lesson.steps.length - 1 ? 'Start the assessment' : 'Next step'}</span>${icon('arrowRight', 14)}
        </button>
      </div>
    </div>
  `;
}

function quizHTML(lesson) {
  const result = getLessonResult(lesson.id);
  const correct = state.answers.reduce((sum, answer, i) => sum + (answer === lesson.quiz[i].answer ? 1 : 0), 0);
  const rows = lesson.quiz.map((question, qi) => {
    const chosen = state.answers[qi];
    const right = chosen === question.answer;
    const options = question.options.map((option, oi) => {
      const picked = chosen === oi;
      const isRight = question.answer === oi;
      const tone = state.checked ? (isRight ? 'is-right' : picked ? 'is-wrong' : '') : picked ? 'is-picked' : '';
      return `
        <button class="learn-option ${tone}" type="button" data-answer="${qi}:${oi}" ${state.checked ? 'disabled' : ''}>
          <span class="learn-option-mark">${state.checked && isRight ? icon('check', 12) : state.checked && picked ? icon('x', 12) : String.fromCharCode(65 + oi)}</span>
          <span>${escapeHtml(option)}</span>
        </button>
      `;
    }).join('');
    return `
      <div class="learn-question">
        <p class="learn-question-text"><span>Q${qi + 1}.</span> ${escapeHtml(question.q)}</p>
        <div class="learn-options">${options}</div>
        ${state.checked && !right ? `<p class="learn-why">${icon('info', 13)} ${escapeHtml(question.why)}</p>` : ''}
      </div>
    `;
  }).join('');

  return `
    <div class="learn-quiz">
      <div class="learn-quiz-head">
        <h3>Practical assessment</h3>
        <span class="learn-quiz-meta">${lesson.quiz.length} questions · all must be right to pass</span>
      </div>
      ${rows}
      <div class="learn-quiz-foot">
        ${state.checked
          ? `<span class="learn-score ${correct === lesson.quiz.length ? 'is-good' : 'is-bad'}">${icon(correct === lesson.quiz.length ? 'check' : 'alert', 14)} ${correct} of ${lesson.quiz.length} correct</span>
             <button class="btn btn--ghost btn--sm" type="button" data-action="learn-retry">${icon('refresh', 14)}<span>${correct === lesson.quiz.length ? 'Try again' : 'Retry the questions'}</span></button>`
          : `<span class="learn-quiz-hint">${state.answers.every((answer) => answer >= 0) ? 'Ready when you are.' : 'Answer every question to finish.'}</span>
             <button class="btn btn--primary btn--sm" type="button" data-action="learn-check" ${state.answers.every((answer) => answer >= 0) ? '' : 'disabled'}>${icon('check', 14)}<span>Check answers</span></button>`}
        ${result?.passed ? `<span class="learn-passed-note">${icon('sparkles', 13)} Passed</span>` : ''}
      </div>
    </div>
  `;
}

function lessonPanelHTML(lesson) {
  if (!lesson) {
    return `
      <div class="learn-empty">
        ${icon('bookmark', 30)}
        <h2>Pick a lesson</h2>
        <p>Six lessons take you from naming the parts to fixing a PC with no display. Each one ends with a short assessment.</p>
      </div>
    `;
  }
  const showQuiz = state.stepIndex >= lesson.steps.length;
  return `
    <div class="learn-panel">
      <div class="learn-panel-head">
        <div>
          <p class="eyebrow">${escapeHtml(`Lesson ${lesson.order}`)}</p>
          <h2>${escapeHtml(lesson.title)}</h2>
          <p class="learn-panel-blurb">${escapeHtml(lesson.blurb)}</p>
        </div>
        <span class="learn-time">${icon('info', 13)} about ${lesson.minutes} min</span>
      </div>
      ${partsMarkup(lesson)}
      ${showQuiz ? quizHTML(lesson) : stepsHTML(lesson)}
    </div>
  `;
}

export function render(root) {
  const draw = () => {
    const stats = getLearningStats(LESSONS.length);
    if (!state.lessonId && LESSONS.length) state.lessonId = LESSONS[0].id;
    const lesson = getLesson(state.lessonId);
    if (lesson && state.answers.length !== lesson.quiz.length) resetQuiz(lesson);

    root.innerHTML = `
      <div class="page page--learn">
        <section class="learn-hero">
          <div class="learn-hero-copy">
            <p class="eyebrow">Learning mode</p>
            <h1>Learn the machine before you build it.</h1>
            <p class="learn-hero-sub">Short guided lessons on every part, then an assessment that has to be fully right. Wrong answers are explained, so a mistake teaches instead of just costing a point.</p>
            <div class="learn-hero-stats">
              <div class="learn-stat"><strong>${stats.passed}/${stats.total}</strong><span>lessons passed</span></div>
              <div class="learn-stat"><strong>${LESSONS.reduce((sum, item) => sum + item.steps.length, 0)}</strong><span>guided steps</span></div>
              <div class="learn-stat"><strong>${LESSONS.reduce((sum, item) => sum + item.quiz.length, 0)}</strong><span>assessment questions</span></div>
            </div>
            ${progressBar(stats.passed, stats.total, 'accent')}
          </div>
          <div class="learn-hero-actions">
            <a class="btn btn--ghost btn--sm" href="#/workshop">${icon('wrench', 14)}<span>Try it in the workshop</span></a>
            <a class="btn btn--ghost btn--sm" href="#/repair">${icon('wrench', 14)}<span>Troubleshooting bench</span></a>
          </div>
        </section>

        <section class="learn-grid">
          <div class="learn-list">
            <h2>Lessons</h2>
            ${lessonListHTML(state.lessonId)}
          </div>
          <div class="learn-stage">
            ${lessonPanelHTML(lesson)}
          </div>
        </section>
      </div>
    `;
  };

  const selectLesson = (id) => {
    const lesson = getLesson(id);
    if (!lesson) return;
    state.lessonId = id;
    resetQuiz(lesson);
    draw();
  };

  const clickHandler = (event) => {
    const lessonBtn = event.target.closest('[data-lesson]');
    if (lessonBtn) {
      selectLesson(lessonBtn.dataset.lesson);
      return;
    }
    const stepBtn = event.target.closest('[data-step]');
    if (stepBtn) {
      state.stepIndex = Number(stepBtn.dataset.step) || 0;
      draw();
      return;
    }
    const optionBtn = event.target.closest('[data-answer]');
    if (optionBtn && !state.checked) {
      const [qi, oi] = optionBtn.dataset.answer.split(':').map(Number);
      const lesson = getLesson(state.lessonId);
      state.answers[qi] = oi;
      state.checked = false;
      draw();
      if (state.answers.every((answer) => answer >= 0)) {
        toast('All answered — press Check answers.', 'info', { duration: 1800 });
      } else if (lesson) {
        sfx.click();
      }
      return;
    }
    const action = event.target.closest('[data-action]')?.dataset.action;
    const lesson = getLesson(state.lessonId);
    if (!lesson) return;
    if (action === 'learn-next') {
      if (state.stepIndex >= lesson.steps.length - 1) {
        state.stepIndex = lesson.steps.length;
      } else {
        state.stepIndex += 1;
      }
      draw();
    } else if (action === 'learn-prev') {
      state.stepIndex = Math.max(0, Math.min(state.stepIndex, lesson.steps.length) - 1);
      draw();
    } else if (action === 'learn-check') {
      const correct = state.answers.reduce((sum, answer, i) => sum + (answer === lesson.quiz[i].answer ? 1 : 0), 0);
      state.checked = true;
      if (!state.scored) {
        state.scored = true;
        const entry = recordLessonResult(lesson.id, correct, lesson.quiz.length);
        if (correct === lesson.quiz.length) {
          toast(`Lesson passed — ${lesson.title}.`, 'success');
        } else {
          toast(`${correct} of ${lesson.quiz.length}. Read the notes and try again.`, 'warn');
        }
        if (entry) sfx.click();
      }
      draw();
    } else if (action === 'learn-retry') {
      resetQuiz(lesson);
      draw();
    }
  };

  root.addEventListener('click', clickHandler);
  draw();
  const off = onLearning(() => draw());
  return () => {
    root.removeEventListener('click', clickHandler);
    off();
  };
}
