import { CATEGORIES } from '../data/hardware.js';
import { dailyChallenge, getJob } from '../data/jobs.js';
import { getItems, buildTotal } from '../core/build.js';
import { money } from '../core/currency.js';
import { t } from '../core/settings.js';
import { sfx } from '../core/audio.js';
import { icon } from './icons.js';
import { escapeHtml } from '../core/format.js';
import { baysFor, bootFaults, evaluateJob, gradeResult, trayFor } from '../core/gameplay.js';
import { addMistake, finishJob, getActive, getLevelInfo, getProfile, markPlaced, setActivePhase } from '../core/career.js';
import { closeModal, openModal } from './modal.js';
import { toast } from './toast.js';
import { downloadPoster } from '../core/poster.js';

const categoryIcon = (id) => (CATEGORIES.find((category) => category.id === id)?.icon) || 'dot';

function buildFromActive(active) {
  return { name: active.build?.name || 'Customer build', items: active.build?.items || {} };
}

function stepPips(current) {
  const steps = ['assemble', 'boot', 'rate'];
  return `
    <div class="wb-pips" aria-hidden="true">
      ${steps.map((step, index) => {
        const order = steps.indexOf(current);
        const state = index < order ? 'is-done' : index === order ? 'is-now' : '';
        return `<span class="wb-pip ${state}">${index + 1}</span>`;
      }).join('<span class="wb-pip-line"></span>')}
    </div>
  `;
}

function starsMarkup(count, max = 5) {
  return `<span class="wb-stars">${Array.from({ length: max }, (_, index) => `
    <span class="wb-star ${index < count ? 'is-on' : ''}" aria-hidden="true">★</span>
  `).join('')}</span>`;
}

function elapsedLabel(startedAt) {
  const seconds = Math.max(0, Math.round((Date.now() - startedAt) / 1000));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

export function openWorkbench(onDone) {
  const active = getActive();
  if (!active) {
    toast('Take a job from the career page first.', 'warn');
    return null;
  }
  const job = getJob(active.jobId) || (active.daily ? dailyChallenge() : null);
  const build = buildFromActive(active);
  const bays = baysFor(build);
  const tray = trayFor(build);
  const placed = new Set(active.placed);
  const ui = {
    phase: active.phase === 'build' ? 'assemble' : active.phase,
    selectedBay: null,
    mistakes: active.mistakes,
    bootLines: [],
    faultList: null,
    result: null,
    timer: null,
  };

  const overlay = openModal({
    title: job ? job.title : 'Customer build',
    eyebrow: 'Workbench',
    subtitle: job ? job.customer : 'Walk-in customer',
    size: 'xl',
    className: 'modal--workbench',
    body: '<div id="wb-root"></div>',
    footer: '<button class="btn btn--ghost" type="button" data-modal-close>Leave bench</button>',
    onClose: () => {
      if (ui.timer) clearInterval(ui.timer);
      sfx.fanStop();
    },
  });

  const root = overlay.querySelector('#wb-root');
  const startedAt = active.startedAt || Date.now();

  function nextBay() {
    const open = bays.filter((bay) => bay.check ? !placed.has('cables') : !placed.has(bay.accepts[0]));
    return open[0] || null;
  }

  function headerStrip(extra = '') {
    const used = buildTotal(build);
    const budget = job?.budget || 0;
    return `
      <div class="wb-strip">
        <div class="wb-strip-stat"><span>Parts cost</span><strong>${money(used)}</strong></div>
        <div class="wb-strip-stat"><span>Budget</span><strong class="${used > budget ? 'is-over' : ''}">${money(budget)}</strong></div>
        <div class="wb-strip-stat"><span>Mistakes</span><strong class="${ui.mistakes > 2 ? 'is-over' : ''}">${ui.mistakes}</strong></div>
        <div class="wb-strip-stat"><span>Time</span><strong id="wb-timer">${elapsedLabel(startedAt)}</strong></div>
        ${extra}
      </div>
    `;
  }

  function renderAssembly() {
    const target = nextBay();
    root.innerHTML = `
      ${stepPips('assemble')}
      ${headerStrip()}
      <div class="wb-layout">
        <section class="wb-rack" aria-label="Case bays">
          <div class="wb-case">
            <div class="wb-case-fan" aria-hidden="true"></div>
            ${bays.map((bay) => {
              const installed = bay.check ? placed.has('cables') : placed.has(bay.accepts[0]);
              const isNext = target && target.id === bay.id;
              const selected = ui.selectedBay === bay.id;
              const part = bay.check ? null : getItems(build, bay.accepts[0])[0];
              return `
                <button class="wb-bay ${installed ? 'is-filled' : ''} ${isNext ? 'is-next' : ''} ${selected ? 'is-selected' : ''}"
                        type="button" data-bay="${bay.id}" ${installed ? 'disabled' : ''}>
                  <span class="wb-bay-icon">${icon(bay.check ? 'bolt' : categoryIcon(bay.accepts[0]), 16)}</span>
                  <span class="wb-bay-text">
                    <strong>${escapeHtml(bay.check ? 'Cable routing' : bay.label)}</strong>
                    <small>${escapeHtml(installed ? (bay.check ? 'Cables tidy' : part?.name || 'Installed') : bay.hint)}</small>
                  </span>
                  ${installed ? `<span class="wb-bay-check">${icon('check', 14)}</span>` : ''}
                </button>
              `;
            }).join('')}
          </div>
        </section>

        <section class="wb-tray" aria-label="Parts tray">
          <div class="wb-tray-head">
            <h3>${icon('grid', 15)} Parts tray</h3>
            <span>${tray.filter((entry) => !placed.has(entry.category)).length} left</span>
          </div>
          <div class="wb-parts">
            ${tray.map(({ category, item }) => {
              const used = placed.has(category);
              return `
                <button class="wb-part ${used ? 'is-used' : ''}" type="button" data-part="${escapeHtml(item.id)}" ${used ? 'disabled' : ''}>
                  <span class="wb-part-icon">${icon(categoryIcon(category), 15)}</span>
                  <span class="wb-part-text">
                    <strong>${escapeHtml(item.name)}</strong>
                    <small>${escapeHtml(CATEGORIES.find((entry) => entry.id === category)?.label || category)}</small>
                  </span>
                  ${used ? `<span class="wb-part-tick">${icon('check', 13)}</span>` : ''}
                </button>
              `;
            }).join('')}
          </div>
          <p class="wb-hint">${icon('info', 13)} ${escapeHtml(t('assemblyHint'))}</p>
          ${target && target.check ? `<button class="btn btn--primary wb-wide" type="button" data-action="route-cables">${icon('bolt', 15)}<span>Route the cables</span></button>` : ''}
          <button class="btn btn--ghost wb-wide" type="button" data-action="wb-skip" title="Installs everything automatically at the cost of stars">${icon('sparkles', 15)}<span>Let the shop assistant do it (−1★)</span></button>
        </section>
      </div>
    `;
  }

  function renderBoot() {
    const running = ui.bootLines.length > 0 && !ui.faultList;
    root.innerHTML = `
      ${stepPips('boot')}
      ${headerStrip()}
      <div class="wb-boot">
        <button class="wb-power ${running ? 'is-on' : ''}" type="button" data-action="wb-power" aria-label="${escapeHtml(t('runBoot'))}">
          <span class="wb-power-ring"></span>
          <span class="wb-power-glyph">${icon('bolt', 30)}</span>
        </button>
        <div class="wb-post">
          <h3>POST screen</h3>
          <pre id="wb-post-log">${ui.bootLines.map((line) => escapeHtml(line)).join('\n')}</pre>
          ${ui.faultList ? faultMarkup(ui.faultList) : `<p class="wb-hint">${icon('info', 13)} ${escapeHtml(t('runBoot'))}</p>`}
        </div>
      </div>
      ${ui.faultList ? `
        <div class="wb-actions">
          <button class="btn btn--ghost" type="button" data-action="wb-back-assemble">${icon('reset', 15)}<span>Back to the bench</span></button>
          ${ui.faultList.some((fault) => fault.severity === 'critical')
            ? ''
            : `<button class="btn btn--primary" type="button" data-action="wb-rate">${icon('arrowRight', 15)}<span>Show the customer</span></button>`}
        </div>
      ` : ''}
    `;
  }

  function faultMarkup(faults) {
    const critical = faults.filter((fault) => fault.severity === 'critical');
    return `
      <div class="wb-faults ${critical.length ? 'is-bad' : 'is-warn'}">
        <h4>${icon(critical.length ? 'x' : 'alert', 15)} ${escapeHtml(critical.length ? t('bootFail') : 'Booted with warnings')}</h4>
        <ul>
          ${faults.map((fault) => `<li><strong>${escapeHtml(fault.title)}</strong><span>${escapeHtml(fault.detail)}</span></li>`).join('')}
        </ul>
      </div>
    `;
  }

  function renderRate() {
    const seconds = Math.round((Date.now() - startedAt) / 1000);
    const result = ui.result || gradeResult({
      job: job || { fee: 3000, xp: 60, timeLimit: 300, need: {} },
      build,
      mistakes: ui.mistakes,
      seconds,
      isDaily: Boolean(active.daily),
    });
    ui.result = result;
    root.innerHTML = `
      ${stepPips('rate')}
      ${headerStrip()}
      <div class="wb-rate">
        <div class="wb-rate-head">
          <h3>${escapeHtml(t('grade'))}</h3>
          ${starsMarkup(result.stars)}
          <p>${escapeHtml(result.summary)}</p>
        </div>
        <div class="wb-checks">
          ${result.evaluation.checks.map((check) => `
            <div class="wb-check ${check.ok ? 'is-ok' : 'is-bad'}">
              <span class="wb-check-icon">${icon(check.ok ? 'check' : 'x', 13)}</span>
              <span class="wb-check-text"><strong>${escapeHtml(check.label)}</strong><small>${escapeHtml(check.detail)}</small></span>
            </div>
          `).join('')}
        </div>
        <div class="wb-payout">
          <div><span>${escapeHtml(t('payout'))}</span><strong>${money(result.payout)}</strong></div>
          <div><span>${escapeHtml(t('xp'))}</span><strong>+${result.xp}</strong></div>
          <div><span>${escapeHtml(t('quality'))}</span><strong>${result.evaluation.score}%</strong></div>
        </div>
        <div class="wb-actions">
          <button class="btn btn--primary" type="button" data-action="wb-collect">${icon('check', 15)}<span>${escapeHtml(t('collect'))}</span></button>
          <button class="btn btn--ghost" type="button" data-action="wb-poster">${icon('download', 15)}<span>${escapeHtml(t('poster'))}</span></button>
          <a class="btn btn--ghost" href="#/career" data-modal-close>${icon('arrowRight', 15)}<span>Back to workshop</span></a>
        </div>
      </div>
    `;
  }

  function render() {
    if (ui.phase === 'boot') renderBoot();
    else if (ui.phase === 'rate') renderRate();
    else renderAssembly();
  }

  function startTimer() {
    if (ui.timer) clearInterval(ui.timer);
    ui.timer = setInterval(() => {
      const el = overlay.querySelector('#wb-timer');
      if (el) el.textContent = elapsedLabel(startedAt);
    }, 1000);
  }

  function placePart(partId) {
    const entry = tray.find((item) => item.item.id === partId);
    if (!entry) return;
    const bay = bays.find((candidate) => candidate.accepts.includes(entry.category));
    if (!bay) return;
    const selected = ui.selectedBay ? bays.find((candidate) => candidate.id === ui.selectedBay) : null;
    const effective = selected && selected.accepts.includes(entry.category) ? selected : bay;

    if (!effective.accepts.includes(entry.category)) {
      ui.mistakes = addMistake();
      sfx.error();
      toast(`${entry.item.name} does not go there.`, 'error', { duration: 2200 });
      render();
      return;
    }
    placed.add(entry.category);
    markPlaced(entry.category);
    sfx.pick();
    ui.selectedBay = null;
    const next = nextBay();
    if (!next) {
      ui.phase = 'boot';
      setActivePhase('boot');
    }
    render();
  }

  function routeCables() {
    placed.add('cables');
    markPlaced('cables');
    sfx.click();
    const next = nextBay();
    if (!next) {
      ui.phase = 'boot';
      setActivePhase('boot');
    }
    render();
  }

  function skipAssembly() {
    bays.forEach((bay) => placed.add(bay.check ? 'cables' : bay.accepts[0]));
    markPlaced('cables');
    CATEGORIES.forEach((category) => markPlaced(category.id));
    ui.mistakes = addMistake();
    ui.phase = 'boot';
    setActivePhase('boot');
    render();
  }

  function runBoot() {
    ui.bootLines = [];
    ui.faultList = null;
    render();
    const log = () => overlay.querySelector('#wb-post-log');
    const lines = [
      'BIOS v2.1 · checking hardware',
      'CPU detected',
      'Memory training…',
      'Storage detected',
      'Fan headers spinning up',
    ];
    sfx.fanStart();
    let index = 0;
    const timer = setInterval(() => {
      if (ui.bootLines.length < lines.length) {
        ui.bootLines.push(lines[index]);
        index += 1;
        const pre = log();
        if (pre) pre.textContent = ui.bootLines.join('\n');
        sfx.click();
        return;
      }
      clearInterval(timer);
      sfx.fanStop();
      const faults = bootFaults(build);
      ui.faultList = faults;
      if (faults.some((fault) => fault.severity === 'critical')) {
        sfx.error();
      } else {
        sfx.boot();
      }
      render();
    }, 620);
  }

  overlay.addEventListener('click', (event) => {
    const bayEl = event.target.closest('[data-bay]');
    if (bayEl) {
      ui.selectedBay = bayEl.dataset.bay;
      sfx.click();
      render();
      return;
    }
    const partEl = event.target.closest('[data-part]');
    if (partEl) {
      placePart(partEl.dataset.part);
      return;
    }
    const actionEl = event.target.closest('[data-action]');
    if (!actionEl) return;
    const action = actionEl.dataset.action;
    if (action === 'route-cables') routeCables();
    else if (action === 'wb-skip') skipAssembly();
    else if (action === 'wb-power') runBoot();
    else if (action === 'wb-rate') {
      ui.phase = 'rate';
      setActivePhase('rate');
      sfx.success();
      render();
    } else if (action === 'wb-back-assemble') {
      ui.phase = 'assemble';
      setActivePhase('assemble');
      render();
    } else if (action === 'wb-poster') {
      const levelInfo = getLevelInfo();
      const profile = getProfile();
      downloadPoster({
        build,
        jobTitle: job ? job.title : 'Daily build',
        stars: ui.result ? ui.result.stars : 0,
        techName: profile.name,
        levelLabel: `Level ${levelInfo.level} ${levelInfo.title}`,
      });
      sfx.click();
    } else if (action === 'wb-collect') {
      const saved = finishJob(ui.result);
      if (saved) {
        sfx.coin();
        toast(`${money(saved.payout)} collected · ${saved.stars}★`, 'success', { duration: 3600 });
        if (typeof onDone === 'function') onDone(saved);
      }
      closeModal();
    }
  });

  startTimer();
  render();
  return overlay;
}
