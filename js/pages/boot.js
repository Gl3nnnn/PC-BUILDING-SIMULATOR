/**
 * BIOS and boot system page.
 *
 * Four states, in the order a real machine walks them:
 *   power  - press the power button
 *   post   - watch POST detect the parts, checkpoint by checkpoint
 *   uefi   - the firmware screen: what it found, and what to boot from
 *   os     - install the operating system, then the drivers
 */

import { store, on } from '../core/store.js';
import { getItems, selectedCount } from '../core/build.js';
import { bootCheck, bootDevices, installPlan, driverList } from '../core/boot.js';
import { escapeHtml } from '../core/format.js';
import { icon } from '../ui/icons.js';
import { sfx } from '../core/audio.js';

const STATE = {
  phase: 'power',
  visible: 0,
  device: null,
  osStep: 0,
  osDone: false,
  driversDone: [],
};

let timer = null;
let bodyRef = null;

/** The sound engine is a set of named sounds, not one call. */
function play(name) {
  sfx[name]?.();
}

function stopTimer() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

function reset() {
  stopTimer();
  STATE.phase = 'power';
  STATE.visible = 0;
  STATE.device = null;
  STATE.osStep = 0;
  STATE.osDone = false;
  STATE.driversDone = [];
}

function memoryTotal(result) {
  return result.kits.reduce((sum, kit) => sum + (Number(kit.specs?.capacity) || 0), 0);
}

function storageTotal(result) {
  return result.drives.reduce((sum, drive) => sum + (Number(drive.specs?.capacityGB) || 0), 0);
}

/* ------------------------------------------------------------------ POST */

function stageRow(entry) {
  const glyph = entry.status === 'ok' ? 'check' : entry.status === 'warn' ? 'alert' : 'x';
  return `
    <li class="boot-line boot-line--${entry.status}">
      <span class="boot-line-light"></span>
      <span class="boot-line-side">${escapeHtml(entry.side)}</span>
      <div class="boot-line-copy">
        <strong>${icon(glyph, 13)}<span>${escapeHtml(entry.headline)}</span></strong>
        <p>${escapeHtml(entry.detail)}</p>
        ${entry.fix ? `<a class="boot-line-fix" href="${entry.fix.href}">${icon('wrench', 12)}<span>${escapeHtml(entry.fix.label)}</span></a>` : ''}
      </div>
    </li>
  `;
}

function postPanel(result) {
  const shown = result.stages.slice(0, STATE.visible);
  const done = STATE.visible >= result.stages.length;
  const next = result.stages[STATE.visible];
  return `
    <section class="boot-card boot-console">
      <div class="boot-console-head">
        <span class="boot-console-led boot-console-led--${result.ok ? 'ok' : 'error'}"></span>
        <span class="boot-console-title">POST · ${escapeHtml(result.board?.brand || 'firmware')}</span>
        <span class="boot-console-count">${Math.min(STATE.visible, result.stages.length)} / ${result.stages.length} checkpoints</span>
      </div>
      <ul class="boot-lines">${shown.map(stageRow).join('')}</ul>
      ${!done && next ? `<p class="boot-console-wait"><span class="boot-dots"></span> Checking ${escapeHtml(next.label)}…</p>` : ''}
      ${done ? `
        <div class="boot-console-foot">
          <div class="boot-beep">
            <span class="boot-beep-label">${icon('bolt', 13)}<span>Beep code</span></span>
            <strong>${escapeHtml(result.beep.label)}</strong>
            <p>${escapeHtml(result.beep.detail)}</p>
          </div>
          <div class="boot-foot-actions">
            ${result.ok
              ? `<button class="btn btn--primary" type="button" data-boot="uefi">${icon('arrowRight', 15)}<span>Enter BIOS</span></button>`
              : `<button class="btn btn--ghost" type="button" data-boot="retry">${icon('refresh', 15)}<span>Run POST again</span></button>`}
          </div>
        </div>
      ` : ''}
    </section>
    ${done && !result.ok ? failPanel(result) : ''}
  `;
}

function failPanel(result) {
  const first = result.fails[0];
  if (!first) return '';
  return `
    <section class="boot-card boot-stop">
      <div class="boot-stop-head">
        <span class="boot-stop-icon">${icon('x', 18)}</span>
        <div>
          <h2>POST halted: ${escapeHtml(first.headline)}</h2>
          <p>${escapeHtml(first.detail)}</p>
        </div>
      </div>
      ${result.fails.length > 1 ? `<ul class="boot-stop-list">${result.fails.slice(1).map((fault) => `<li><strong>${escapeHtml(fault.headline)}</strong><p>${escapeHtml(fault.detail)}</p></li>`).join('')}</ul>` : ''}
      <div class="boot-stop-actions">
        ${first.fix ? `<a class="btn btn--primary" href="${first.fix.href}">${icon('wrench', 15)}<span>${escapeHtml(first.fix.label)}</span></a>` : ''}
        <button class="btn btn--ghost" type="button" data-boot="retry">${icon('refresh', 15)}<span>Run POST again</span></button>
      </div>
    </section>
  `;
}

/* ------------------------------------------------------------------ UEFI */

function metric(label, tone, text) {
  return `<div class="uefi-metric uefi-metric--${tone}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(text)}</strong></div>`;
}

function uefiPanel(result, build) {
  const devices = bootDevices(build);
  const fallback = devices.find((device) => device.ready && device.kind === 'drive')?.id || null;
  const chosen = STATE.device || fallback;
  const power = result.psu ? `${result.psu.specs?.wattage} W` : '—';
  return `
    <section class="boot-card boot-uefi">
      <div class="uefi-bar">
        <span class="uefi-brand">${icon('shield', 15)}<span>UEFI Setup</span></span>
        <nav class="uefi-tabs">
          <span class="uefi-tab is-active">Main</span>
          <span class="uefi-tab">Boot</span>
          <span class="uefi-tab">Advanced</span>
        </nav>
        <span class="uefi-version">BIOS 1.24 · ${escapeHtml(result.board?.specs?.chipset || 'firmware')}</span>
      </div>
      <div class="uefi-metrics">
        ${metric('CPU', result.cpu ? 'ok' : 'warn', result.cpu?.name || 'Not detected')}
        ${metric('Memory', result.kits.length >= 2 ? 'ok' : 'warn', result.kits.length ? `${memoryTotal(result)} GB ${result.kits[0]?.specs?.type || ''}` : 'Not detected')}
        ${metric('Graphics', result.gpu ? 'ok' : 'info', result.gpu?.name || 'Integrated graphics')}
        ${metric('Storage', storageTotal(result) ? 'ok' : 'warn', storageTotal(result) ? `${bigStorage(storageTotal(result))} total` : 'None detected')}
        ${metric('Cooling', result.cooler ? 'ok' : 'info', result.cooler?.name || 'Stock cooler')}
        ${metric('Power', result.headroom !== null && result.headroom < 15 ? 'warn' : 'ok', `${power} · ${result.power} W draw`)}
      </div>
      <div class="uefi-bootlist">
        <h3>${icon('storage', 15)}<span>Boot device priority</span></h3>
        <ul>
          ${devices.map((device) => `
            <li class="uefi-device ${chosen === device.id ? 'is-chosen' : ''} ${device.ready ? '' : 'is-empty'}">
              <button type="button" data-device="${escapeHtml(device.id)}" ${device.ready ? '' : 'disabled'}>
                <span class="uefi-radio"></span>
                <span class="uefi-device-copy"><strong>${escapeHtml(device.label)}</strong><em>${escapeHtml(device.sub)}</em></span>
              </button>
            </li>
          `).join('')}
        </ul>
      </div>
      <div class="uefi-foot">
        <p>${icon('info', 13)}<span>${result.warns.length
          ? `${result.warns.length} POST note${result.warns.length === 1 ? '' : 's'} carry forward — the machine boots, but read the notes first.`
          : 'Every checkpoint clean. Pick a boot device and continue.'}</span></p>
        <button class="btn btn--primary" type="button" data-boot="install" ${chosen ? '' : 'disabled'}>${icon('arrowRight', 15)}<span>Save, exit and boot</span></button>
      </div>
    </section>
    ${result.warns.length ? warnStrip(result, 'Notes carried into BIOS') : ''}
  `;
}

function warnStrip(result, title = 'Notes from POST') {
  return `
    <section class="boot-card boot-notes">
      <h3>${icon('alert', 15)}<span>${escapeHtml(title)}</span></h3>
      <ul>${result.warns.map((entry) => `<li><strong>${escapeHtml(entry.headline)}</strong><p>${escapeHtml(entry.detail)}</p></li>`).join('')}</ul>
    </section>
  `;
}

/* -------------------------------------------------------------------- OS */

function driverRows(build) {
  const drivers = driverList(build);
  return drivers.map((driver) => {
    const done = STATE.driversDone.includes(driver.id);
    return `
      <li class="boot-driver ${done ? 'is-done' : ''}">
        <span class="boot-driver-dot">${icon(done ? 'check' : 'download', 12)}</span>
        <div><strong>${escapeHtml(driver.label)}</strong><em>${escapeHtml(driver.note)}</em></div>
        <span class="boot-driver-state">${done ? 'Installed' : 'Waiting'}</span>
      </li>
    `;
  }).join('');
}

function bigStorage(gigabytes) {
  if (!gigabytes) return 'no storage';
  return gigabytes >= 1000 ? `${Number((gigabytes / 1000).toFixed(2))} TB` : `${gigabytes} GB`;
}

function osPanel(result, build) {
  const plan = installPlan(build);
  const setupSteps = plan.slice(0, -1).map((step) => (step.id === 'image'
    ? { ...step, detail: `Copying the operating system onto ${bigStorage(storageTotal(result))} of storage` }
    : step));
  const drivers = driverList(build);
  const progress = STATE.osDone ? 100 : Math.round((STATE.osStep / setupSteps.length) * 100);
  const driversDone = STATE.driversDone.length === drivers.length;
  return `
    <section class="boot-card boot-os">
      <div class="boot-os-head">
        <span class="boot-os-icon">${icon('monitor', 18)}</span>
        <div>
          <h2>${STATE.osDone ? 'Windows 11 is installed' : 'Installing Windows 11'}</h2>
          <p>${STATE.osDone ? 'Setup finished. The machine reboots into its new desktop.' : 'Setup media found. Writing the system image to the boot drive.'}</p>
        </div>
        <span class="boot-os-pct">${progress}%</span>
      </div>
      <div class="boot-progress"><span style="width:${progress}%"></span></div>
      <ul class="boot-os-steps">
        ${setupSteps.map((step, index) => {
          const state = STATE.osDone || index < STATE.osStep ? 'done' : index === STATE.osStep ? 'live' : 'wait';
          return `
            <li class="boot-os-step boot-os-step--${state}">
              <span class="boot-os-dot">${state === 'done' ? icon('check', 11) : ''}</span>
              <div><strong>${escapeHtml(step.label)}</strong><em>${escapeHtml(step.detail)}</em></div>
            </li>
          `;
        }).join('')}
      </ul>
      ${STATE.osDone ? `
        <div class="boot-drivers">
          <div class="boot-drivers-head">
            <h3>${icon('wrench', 15)}<span>Drivers</span></h3>
            <span class="boot-drivers-count">${STATE.driversDone.length} / ${drivers.length} installed</span>
          </div>
          <ul class="boot-driver-list">${driverRows(build)}</ul>
          ${driversDone
            ? `<div class="boot-ready">
                 <span>${icon('check', 15)}<span>Ready to use</span></span>
                 <p>Every device has a driver. This machine now boots straight to the desktop.</p>
                 <div class="boot-ready-actions">
                   <a class="btn btn--ghost" href="#/performance">${icon('chart', 14)}<span>Check performance</span></a>
                   <a class="btn btn--ghost" href="#/compatibility">${icon('shield', 14)}<span>Compatibility report</span></a>
                 </div>
               </div>`
            : `<button class="btn btn--primary" type="button" data-boot="drivers">${icon('download', 15)}<span>Install all drivers</span></button>`}
        </div>
      ` : `
        <div class="boot-os-foot">
          <button class="btn btn--ghost" type="button" data-boot="skip-os">${icon('x', 14)}<span>Cancel setup</span></button>
        </div>
      `}
    </section>
  `;
}

/* --------------------------------------------------------------- power on */

function powerPanel(result) {
  return `
    <section class="boot-card boot-power">
      <div class="boot-power-art">
        <span class="boot-power-ring"></span>
        <button class="boot-power-btn" type="button" data-boot="power" aria-label="Power on">
          <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true"><path d="M12 3v9" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M6.5 7.5a8 8 0 1 0 11 0" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>
        </button>
      </div>
      <h2>Press the power button</h2>
      <p>${escapeHtml(result.board ? result.board.name : 'The rig')} is wired up. Power on and watch POST check every part in order.</p>
      <div class="boot-power-facts">
        <div><span>Power draw</span><strong>${result.power} W</strong></div>
        <div><span>Recommended PSU</span><strong>${result.recommended} W</strong></div>
        <div><span>Parts fitted</span><strong>${result.selected}</strong></div>
      </div>
    </section>
  `;
}

/* -------------------------------------------------------------- painting */

function sideCard(result) {
  const steps = [
    { id: 'post', label: 'POST', hint: 'Power-on self test' },
    { id: 'uefi', label: 'BIOS screen', hint: 'Firmware setup and boot order' },
    { id: 'os', label: 'Operating system', hint: 'Install, then drivers' },
  ];
  const at = STATE.phase === 'os' ? 2 : STATE.phase === 'uefi' ? 1 : 0;
  const reached = (index) => {
    if (index === 0) return STATE.visible > 0;
    if (index === 1) return STATE.phase === 'uefi' || STATE.phase === 'os';
    return STATE.phase === 'os';
  };
  return `
    <div class="boot-side-card">
      <h3>${icon('shield', 15)}<span>Boot stages</span></h3>
      <ul class="boot-stage-list">
        ${steps.map((step, index) => `
          <li class="boot-stage ${reached(index) ? 'is-on' : ''} ${index === at ? 'is-now' : ''}">
            <span class="boot-stage-dot">${reached(index) && index !== at ? icon('check', 11) : ''}</span>
            <div><strong>${escapeHtml(step.label)}</strong><em>${escapeHtml(step.hint)}</em></div>
          </li>
        `).join('')}
      </ul>
    </div>
    <div class="boot-side-card">
      <h3>${icon('cpu', 15)}<span>Detected hardware</span></h3>
      <dl class="boot-side-list">
        ${[
          ['Board', result.board?.name],
          ['CPU', result.cpu?.name],
          ['Memory', result.kits.length ? `${memoryTotal(result)} GB` : null],
          ['Graphics', result.gpu?.name || 'Integrated'],
          ['Drives', result.drives.length ? `${result.drives.length} fitted` : null],
          ['Cooling', result.cooler?.name || 'Stock'],
        ].map(([key, value]) => `<div><dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value || 'None')}</dd></div>`).join('')}
      </dl>
    </div>
  `;
}

function mainMarkup(result, build) {
  if (!selectedCount(build)) {
    return `
      <section class="boot-card boot-stop">
        <div class="boot-stop-head">
          <span class="boot-stop-icon">${icon('wrench', 18)}</span>
          <div><h2>Nothing to power on</h2><p>Fit a case, board, processor, memory and power supply in the builder, then come back and press the power button.</p></div>
        </div>
        <div class="boot-stop-actions">
          <a class="btn btn--primary" href="#/builder">${icon('wrench', 15)}<span>Open the builder</span></a>
          <a class="btn btn--ghost" href="#/showcase">${icon('sparkles', 15)}<span>Load a preset build</span></a>
        </div>
      </section>
    `;
  }
  if (STATE.phase === 'os') return osPanel(result, build);
  if (STATE.phase === 'uefi') return uefiPanel(result, build);
  if (STATE.visible === 0) return powerPanel(result);
  return postPanel(result);
}

function paint() {
  if (!bodyRef) return;
  const build = store.getCurrent();
  const result = bootCheck(build);
  bodyRef.innerHTML = `
    <div class="boot-layout">
      <div class="boot-main">${mainMarkup(result, build)}</div>
      <aside class="boot-side">${sideCard(result)}</aside>
    </div>
  `;
}

/* --------------------------------------------------------------- running */

function runPost() {
  const result = bootCheck(store.getCurrent());
  if (STATE.visible >= result.stages.length) return;
  STATE.visible += 1;
  play(STATE.visible >= result.stages.length ? (result.ok ? 'boot' : 'error') : 'click');
  paint();
  if (STATE.visible < result.stages.length) {
    stopTimer();
    timer = setTimeout(runPost, 520);
  }
}

function startOs() {
  const result = bootCheck(store.getCurrent());
  if (!result.ok) {
    STATE.phase = 'post';
    STATE.visible = result.stages.length;
    play('error');
    paint();
    return;
  }
  STATE.phase = 'os';
  STATE.osStep = 0;
  STATE.osDone = false;
  play('boot');
  paint();
  stopTimer();
  timer = setTimeout(stepOs, 700);
}

function stepOs() {
  const plan = installPlan(store.getCurrent());
  const setupSteps = plan.slice(0, -1);
  STATE.osStep += 1;
  if (STATE.osStep >= setupSteps.length) {
    STATE.osDone = true;
    play('success');
    paint();
    return;
  }
  play('click');
  paint();
  stopTimer();
  timer = setTimeout(stepOs, 760);
}

function onAction(event) {
  const button = event.target.closest('[data-boot]');
  const deviceButton = event.target.closest('[data-device]');
  if (deviceButton) {
    STATE.device = deviceButton.dataset.device;
    play('pick');
    paint();
    return;
  }
  if (!button) return;
  const action = button.dataset.boot;
  if (action === 'power' || action === 'retry') {
    reset();
    play('pick');
    STATE.visible = 0;
    paint();
    stopTimer();
    timer = setTimeout(runPost, 500);
    return;
  }
  if (action === 'uefi') {
    const result = bootCheck(store.getCurrent());
    if (!result.ok) {
      play('error');
      return;
    }
    STATE.phase = 'uefi';
    STATE.device = null;
    play('boot');
    paint();
    return;
  }
  if (action === 'install') {
    startOs();
    return;
  }
  if (action === 'skip-os') {
    stopTimer();
    reset();
    STATE.phase = 'uefi';
    paint();
    return;
  }
  if (action === 'drivers') {
    const drivers = driverList(store.getCurrent());
    STATE.driversDone = drivers.map((driver) => driver.id);
    play('levelUp');
    paint();
  }
}

export function render(root) {
  root.innerHTML = `
    <div class="boot-page">
      <header class="page-head">
        <div>
          <p class="eyebrow">Power, POST and software</p>
          <h1 class="page-title">BIOS &amp; Boot System</h1>
          <p class="page-subtitle">Power on, watch every checkpoint, set the boot order, then install the system and its drivers.</p>
        </div>
        <div class="page-actions">
          <button class="btn btn--ghost" type="button" data-boot="retry">${icon('refresh', 15)}<span>Restart POST</span></button>
          <a class="btn btn--primary" href="#/workshop">${icon('wrench', 15)}<span>Back to workshop</span></a>
        </div>
      </header>
      <div id="boot-body"></div>
    </div>
  `;
  bodyRef = root.querySelector('#boot-body');
  reset();
  paint();

  const unsubscribe = on('build', () => {
    stopTimer();
    reset();
    paint();
  });
  root.addEventListener('click', onAction);

  return () => {
    stopTimer();
    unsubscribe();
    root.removeEventListener('click', onAction);
    bodyRef = null;
  };
}
