import { getItems } from '../core/build.js';
import { store } from '../core/store.js';
import {
  beginJob, getActive, getCompleted, getHallOfFame, getLevelInfo, getProfile,
  getReputation, abandonJob, orderParts, isDailyDone, getDailyAttempt,
} from '../core/career.js';
import { dailyChallenge, getJob, JOBS } from '../data/jobs.js';
import { money } from '../core/currency.js';
import { broadcastLanguage, initialiseLanguage, onLanguage, setSetting, getSettings, t } from '../core/settings.js';
import { sfx } from '../core/audio.js';
import { escapeHtml } from '../core/format.js';
import { icon } from '../ui/icons.js';
import { pageHeader, progressBar } from '../ui/common.js';
import { toast } from '../ui/toast.js';
import { openWorkbench } from '../ui/workbench.js';
import { openTutorial } from '../ui/tutorial.js';
import { openModal, closeModal } from '../ui/modal.js';
import { downloadPoster } from '../core/poster.js';

function starsMarkup(count, size = 14) {
  return `<span class="career-stars" aria-label="${count} out of 5 stars">${Array.from({ length: 5 }, (_, index) => `<span class="career-star ${index < count ? 'is-on' : ''}" style="font-size:${size}px">★</span>`).join('')}</span>`;
}

function requirementList(job) {
  const need = job.need || {};
  const rows = [];
  if (need.gpu) rows.push('Dedicated graphics card');
  if (need.minFps) rows.push(`${need.minFps.value} FPS at ${need.minFps.resolution} ${need.minFps.quality}`);
  if (need.minRam) rows.push(`${need.minRam} GB RAM or more`);
  if (need.minVram) rows.push(`${need.minVram} GB VRAM or more`);
  if (need.minCores) rows.push(`${need.minCores} CPU cores or more`);
  if (need.storageGb) rows.push(`${need.storageGb} GB storage`);
  if (need.rgb) rows.push('Some RGB lighting');
  if (need.quiet) rows.push('Quiet build');
  if (need.maxNoise) rows.push(`Under ${need.maxNoise} dBA`);
  if (need.wifi) rows.push('Wi-Fi on the motherboard');
  if (need.headroom) rows.push(`${need.headroom}% PSU headroom`);
  if (!rows.length) rows.push('Any working, compatible PC');
  return rows;
}

function jobCard(job, { level, active, completed, poster }) {
  const locked = job.level > level;
  const isActive = active && active.jobId === job.id && !active.daily;
  return `
    <article class="job-card ${locked ? 'is-locked' : ''} ${isActive ? 'is-active' : ''} ${completed ? 'is-completed' : ''}">
      <div class="job-head">
        <span class="job-level">Level ${job.level}</span>
        ${completed ? starsMarkup(completed.stars) : ''}
        <span class="job-budget">${icon('money', 13)} ${money(job.budget)}</span>
      </div>
      <h3>${escapeHtml(job.title)}</h3>
      <p class="job-customer">${escapeHtml(job.customer)}</p>
      <p class="job-brief">${escapeHtml(job.brief)}</p>
      <ul class="job-needs">${requirementList(job).map((row) => `<li>${icon('check', 12)} ${escapeHtml(row)}</li>`).join('')}</ul>
      <div class="job-foot">
        <span>${icon('money', 13)} Fee ${money(job.fee)} · ${job.xp} XP</span>
        ${locked
          ? `<span class="job-locked-note">${icon('lock', 13)} ${escapeHtml(t('unlockAt'))} ${job.level}</span>`
          : isActive
            ? `<button class="btn btn--primary btn--sm" type="button" data-action="continue-job">${icon('arrowRight', 14)}<span>Continue</span></button>`
            : `<button class="btn ${completed ? 'btn--ghost' : 'btn--primary'} btn--sm" type="button" data-take="${escapeHtml(job.id)}">${icon(completed ? 'refresh' : 'wrench', 14)}<span>${completed ? 'Rebuild' : escapeHtml(t('takeJob'))}</span></button>`}
      </div>
      ${job.tips?.length ? `<p class="job-tip">${icon('info', 12)} ${escapeHtml(job.tips[0])}</p>` : ''}
      ${completed && poster
        ? `<button class="icon-btn job-poster" type="button" data-action="poster" title="Save a share poster">${icon('download', 13)}</button>`
        : ''}
    </article>
  `;
}

export function render(root) {
  initialiseLanguage();
  const draw = () => renderPage(root, draw);
  draw();
  const off = onLanguage(draw);
  return () => off();
}

function renderPage(root, redraw) {
  const levelInfo = getLevelInfo();
  const profile = getProfile();
  const active = getActive();
  const completed = Object.fromEntries(JOBS.map((job) => [job.id, getCompleted(job.id)]));
  const daily = dailyChallenge();
  const dailyDone = isDailyDone();
  const dailyAttempt = getDailyAttempt();
  const reputation = getReputation();
  const hall = getHallOfFame().slice(0, 6);
  const settings = getSettings();
  const activeJob = active ? getJob(active.jobId) : null;
  const orderedCount = active ? ['cpu', 'motherboard', 'gpu', 'ram', 'storage', 'psu', 'case', 'cooler', 'fans']
    .reduce((sum, category) => sum + getItems({ items: active.build?.items || {} }, category).length, 0) : 0;

  root.innerHTML = `
    <div class="page page--career">
      <section class="career-hero">
        <div class="career-hero-glow" aria-hidden="true"></div>
        <div class="career-hero-body">
          <p class="eyebrow">${escapeHtml(t('careerEyebrow'))}</p>
          <h1>${escapeHtml(t('careerTitle'))}</h1>
          <p class="career-intro">${escapeHtml(t('careerIntro'))}</p>
          <div class="career-hero-stats">
            <div class="career-stat"><span>${escapeHtml(t('wallet'))}</span><strong>${money(profile.wallet)}</strong></div>
            <div class="career-stat"><span>${escapeHtml(t('level'))}</span><strong>${levelInfo.level} · ${escapeHtml(levelInfo.title)}</strong></div>
            <div class="career-stat"><span>${escapeHtml(t('reputation'))}</span><strong>${reputation.toFixed(1)} ★</strong></div>
            <div class="career-stat"><span>${escapeHtml(t('jobsDone'))}</span><strong>${profile.jobsDone}</strong></div>
          </div>
          ${progressBar(levelInfo.intoLevel, levelInfo.needed, 'accent')}
          <p class="career-xp">${icon('sparkles', 13)} ${levelInfo.intoLevel} / ${levelInfo.needed} ${escapeHtml(t('xp'))} to level ${levelInfo.level + 1}</p>
        </div>
        <div class="career-hero-actions">
          <button class="btn btn--ghost btn--sm" type="button" data-action="tutorial">${icon('info', 14)}<span>${escapeHtml(t('tutorial'))}</span></button>
          <button class="btn btn--ghost btn--sm" type="button" data-action="preferences">${icon('palette', 14)}<span>${escapeHtml(t('settings'))}</span></button>
          <a class="btn btn--ghost btn--sm" href="#/repair">${icon('wrench', 14)}<span>${escapeHtml(t('repair'))}</span></a>
        </div>
      </section>

      ${active ? `
        <section class="career-active">
          <div class="career-active-copy">
            <p class="eyebrow">Job in progress</p>
            <h2>${escapeHtml(activeJob ? activeJob.title : daily.title)}</h2>
            <p>${activeJob ? escapeHtml(activeJob.brief) : escapeHtml(daily.brief)}</p>
            <div class="career-active-meta">
              <span>${icon('money', 13)} Budget ${money(active.build?.budget || activeJob?.budget || daily.budget)}</span>
              <span>${icon('grid', 13)} ${orderedCount} parts ordered</span>
              <span>${icon('alert', 13)} ${active.mistakes} mistakes</span>
            </div>
          </div>
          <div class="career-active-actions">
            ${active.phase === 'build' || orderedCount === 0
              ? `<a class="btn btn--primary" href="#/builder">${icon('plus', 15)}<span>${escapeHtml(t('startBuild'))}</span></a>
                 <button class="btn btn--ghost" type="button" data-action="order-parts">${icon('check', 15)}<span>${escapeHtml(t('orderParts'))}</span></button>`
              : `<button class="btn btn--primary" type="button" data-action="continue-job">${icon('bolt', 15)}<span>Open the bench</span></button>
                 <a class="btn btn--ghost" href="#/builder">${icon('edit', 15)}<span>Change parts</span></a>`}
            <button class="btn btn--danger btn--sm" type="button" data-action="abandon-job">${icon('trash', 14)}<span>Give up</span></button>
          </div>
        </section>
      ` : ''}

      <section class="career-daily">
        <div class="career-daily-head">
          <h2>${icon('sparkles', 16)} ${escapeHtml(t('daily'))}</h2>
          <span>${dailyDone ? escapeHtml(t('dailyDone')) : escapeHtml(t('dailyHint'))}</span>
        </div>
        <p class="career-daily-brief">${escapeHtml(daily.brief)}</p>
        <div class="career-daily-foot">
          <span>${icon('money', 13)} Budget ${money(daily.budget)} · Fee ${money(daily.fee)} · ${daily.xp} XP</span>
          ${dailyDone
            ? starsMarkup(dailyAttempt?.stars || 0, 16)
            : `<button class="btn btn--primary btn--sm" type="button" data-action="daily-start">${icon('gamepad', 14)}<span>Start today's build</span></button>`}
        </div>
      </section>

      <section class="career-jobs">
        <div class="career-jobs-head">
          <h2>${escapeHtml(t('openJobs'))}</h2>
          <span>${icon('shield', 13)} Customers pay more as your reputation grows</span>
        </div>
        <div class="job-grid">
          ${JOBS.map((job) => jobCard(job, { level: levelInfo.level, active, completed: completed[job.id], poster: true })).join('')}
        </div>
      </section>

      <section class="career-hall">
        <div class="career-jobs-head">
          <h2>${icon('chart', 16)} ${escapeHtml(t('hallOfFame'))}</h2>
          <span>Saved on this device · highest score first</span>
        </div>
        ${hall.length ? `
          <div class="hall-table">
            ${hall.map((entry, index) => `
              <div class="hall-row">
                <span class="hall-rank">#${index + 1}</span>
                <span class="hall-name">${escapeHtml(entry.name)}</span>
                <span class="hall-job">${escapeHtml(entry.job)}</span>
                ${starsMarkup(entry.stars)}
                <span class="hall-score">${entry.score}</span>
              </div>
            `).join('')}
          </div>
        ` : `<p class="career-empty">${icon('dot', 13)} ${escapeHtml(t('hallOfFame'))} is empty - finish a job to enter it.</p>`}
      </section>

      <p class="career-lang-note">${escapeHtml(t('language'))}: ${settings.lang === 'fil' ? 'Filipino' : 'English'} · ${escapeHtml(t('currency'))}: ${settings.currency}</p>
    </div>
  `;

  wire(root, redraw);
}

function wire(root, redraw) {
  root.querySelectorAll('[data-take]').forEach((button) => {
    button.addEventListener('click', () => {
      const jobId = button.dataset.take;
      const job = getJob(jobId);
      if (!job) return;
      sfx.click();
      const result = beginJob(jobId);
      if (!result.ok) {
        toast(result.reason, 'warn');
        return;
      }
      toast(`${job.title} accepted. Pick the parts in the builder.`, 'success');
      location.hash = '#/builder';
    });
  });

  const handlers = {
    'daily-start'() {
      if (isDailyDone()) {
        toast(t('dailyDone'), 'warn');
        return;
      }
      const started = beginJob('daily', { daily: true });
      if (!started.ok) {
        toast(started.reason, 'warn');
        return;
      }
      toast('Daily brief accepted. Build inside the budget!', 'success');
      location.hash = '#/builder';
    },
    'continue-job'() {
      openWorkbench((done) => {
        toast(`${money(done.payout)} collected.`, 'success');
        redraw();
      });
    },
    'order-parts'() {
      const build = { items: activeBuildItems() };
      const result = orderParts(build);
      if (!result.ok) {
        toast(result.reason, 'warn');
        return;
      }
      sfx.pick();
      openWorkbench((done) => {
        toast(`${money(done.payout)} collected.`, 'success');
        redraw();
      });
    },
    'abandon-job'() {
      abandonJob();
      toast('Job given up. Nothing was charged.', 'info');
      redraw();
    },
    tutorial() {
      openTutorial();
    },
    preferences() {
      openPreferences(redraw);
    },
    poster() {
      const levelInfo = getLevelInfo();
      const me = getProfile();
      downloadPoster({
        build: { name: 'My build', items: store.getCurrent().items || {} },
        jobTitle: 'My build',
        stars: Math.round(getReputation()),
        techName: me.name,
        levelLabel: `Level ${levelInfo.level} ${levelInfo.title}`,
      });
    },
  };

  Object.entries(handlers).forEach(([action, handler]) => {
    root.querySelectorAll(`[data-action="${action}"]`).forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        handler();
      });
    });
  });
}

/**
 * "Order parts" snapshots whatever the player has picked in the builder, so the
 * tray on the bench matches the order they just placed.
 */
function activeBuildItems() {
  return store.getCurrent().items || {};
}


function openPreferences(redraw) {
  const settings = getSettings();
  const overlay = openModal({
    title: t('settings'),
    eyebrow: 'Applies to every page',
    size: 'sm',
    body: `
      <form class="stack-form" id="prefs-form">
        <label class="field-label" for="prefs-lang">${escapeHtml(t('language'))}</label>
        <select class="text-input" id="prefs-lang" name="lang">
          <option value="en" ${settings.lang === 'en' ? 'selected' : ''}>English</option>
          <option value="fil" ${settings.lang === 'fil' ? 'selected' : ''}>Filipino</option>
        </select>
        <label class="field-label" for="prefs-money">${escapeHtml(t('currency'))}</label>
        <select class="text-input" id="prefs-money" name="currency">
          ${['PHP', 'USD', 'EUR', 'GBP', 'AUD', 'SGD', 'JPY', 'INR'].map((code) => `<option value="${code}" ${settings.currency === code ? 'selected' : ''}>${code}</option>`).join('')}
        </select>
        <label class="switch-row">
          <input type="checkbox" id="prefs-sound" ${settings.sound ? 'checked' : ''}>
          <span>${escapeHtml(t('sound'))}</span>
        </label>
        <p class="form-hint">Prices are stored in pesos and converted for display only.</p>
      </form>
    `,
    footer: `
      <button class="btn btn--ghost" type="button" data-modal-close>${escapeHtml(t('close'))}</button>
      <button class="btn btn--primary" type="button" id="prefs-save">Save</button>
    `,
  });

  overlay.querySelector('#prefs-save').addEventListener('click', () => {
    const lang = overlay.querySelector('#prefs-lang').value;
    const currency = overlay.querySelector('#prefs-money').value;
    const sound = overlay.querySelector('#prefs-sound').checked;
    setSetting({ lang, currency, sound });
    broadcastLanguage();
    closeModal();
    sfx.click();
    if (typeof redraw === 'function') redraw();
    toast('Preferences saved.', 'success');
  });
}

export { orderParts };
