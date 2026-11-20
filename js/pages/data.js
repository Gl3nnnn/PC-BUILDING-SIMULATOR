/**
 * Data & Storage page.
 *
 * One place for everything the app keeps on this device:
 *   - the build library (IndexedDB) with per-build version history,
 *   - achievements and their progress,
 *   - career and learning progression,
 *   - local preferences,
 *   - backup, restore and the cloud-ready export.
 *
 * The page owns its own click listener (`data-db-action`) so it can act on rows
 * it rendered without adding a dozen handlers to the global app dispatcher.
 */

import { store, on, initLibrary, isLibraryReady, restoreVersion, exportForSync } from '../core/store.js';
import * as library from '../core/db.js';
import { sanitizeBuild, buildTotal, selectedCount } from '../core/build.js';
import { evaluateBuild } from '../core/compat.js';
import { escapeHtml, formatDate, peso } from '../core/format.js';
import { getSummary, evaluate, makeContext, record, resetAchievements, GROUPS } from '../core/achievements.js';
import { getProfile, getLevelInfo, levelTitle, getReputation, jobsDoneCount, getState as getCareerState } from '../core/career.js';
import { getLearningStats } from '../core/learn.js';
import { LESSONS } from '../data/lessons.js';
import { getSettings, setSetting } from '../core/settings.js';
import { CURRENCIES, CURRENCY_CODES, currencyMeta } from '../core/currency.js';
import { icon } from '../ui/icons.js';
import { toast } from '../ui/toast.js';
import { confirmDialog, closeModal, openModal } from '../ui/modal.js';

const bytes = (value) => {
  if (!Number.isFinite(value) || value <= 0) return '—';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

function contextFor(savedBuilds) {
  const profile = getProfile();
  const level = getLevelInfo();
  const career = getCareerState();
  const learn = getLearningStats(LESSONS.length);
  return makeContext({
    savedBuilds,
    career: {
      level: level.level,
      jobsDone: jobsDoneCount(),
      repaired: Object.keys(career.repaired || {}).length,
      starsTotal: profile.starsTotal,
    },
    learn,
    build: store.getCurrent(),
    evaluateBuild,
  });
}

function tierDot(tier) {
  return `<span class="ach-tier ach-tier--${tier}" aria-label="${tier}"></span>`;
}

function achievementCard(entry) {
  const pct = entry.goal > 0 ? Math.min(100, Math.round((entry.value / entry.goal) * 100)) : 0;
  return `
    <article class="ach-card ${entry.unlocked ? 'is-unlocked' : ''}">
      <div class="ach-head">
        ${tierDot(entry.tier)}
        <h3>${escapeHtml(entry.title)}</h3>
        ${entry.unlocked ? `<span class="ach-check">${icon('check', 13)}</span>` : `<span class="ach-points">${entry.points} pt</span>`}
      </div>
      <p class="ach-text">${escapeHtml(entry.text)}</p>
      ${entry.unlocked
    ? `<p class="ach-date">Unlocked ${escapeHtml(formatDate(entry.unlockedAt, true))}</p>`
    : `<div class="ach-bar"><span style="width:${pct}%"></span></div><p class="ach-progress">${entry.value} / ${entry.goal}</p>`}
    </article>
  `;
}

function buildRow(entry, versions) {
  const build = sanitizeBuild(entry, entry.name);
  const total = buildTotal(build);
  const count = selectedCount(build);
  const result = evaluateBuild(build);
  const errors = result.errors?.length || 0;
  return `
    <article class="lib-row" data-build="${entry.id}">
      <div class="lib-main">
        <h3>${escapeHtml(entry.name)}</h3>
        <p class="lib-meta">
          <span>${count} part${count === 1 ? '' : 's'}</span>
          <span>${peso(total)}</span>
          <span>${errors ? `${errors} issue${errors === 1 ? '' : 's'}` : 'Compatible'}</span>
          <span>${escapeHtml(formatDate(entry.updatedAt, true))}</span>
        </p>
      </div>
      <div class="lib-actions">
        <button class="btn btn--ghost btn--sm" type="button" data-db-action="history" data-id="${entry.id}">
          ${icon('refresh', 14)}<span>History</span>${versions ? `<b class="lib-badge">${versions}</b>` : ''}
        </button>
        <button class="icon-btn" type="button" data-db-action="load" data-id="${entry.id}" title="Load" aria-label="Load ${escapeHtml(entry.name)}">${icon('wrench', 15)}</button>
        <button class="icon-btn" type="button" data-db-action="export-one" data-id="${entry.id}" title="Export JSON" aria-label="Export ${escapeHtml(entry.name)}">${icon('download', 15)}</button>
        <button class="icon-btn icon-btn--danger" type="button" data-db-action="delete" data-id="${entry.id}" title="Delete" aria-label="Delete ${escapeHtml(entry.name)}">${icon('trash', 15)}</button>
      </div>
    </article>
  `;
}

export function render(root) {
  const unsubList = [];

  root.innerHTML = `
    <div class="data-page">
      <header class="page-head">
        <div>
          <p class="eyebrow">${icon('database', 13)} On this device</p>
          <h1 class="page-title">Settings</h1>
          <p class="page-subtitle">Your build library, version history, achievements and preferences. Everything is local — no account needed, and a backup is one button away.</p>
        </div>
        <div class="page-actions">
          <button class="btn btn--ghost" type="button" data-db-action="import-library">${icon('upload', 15)}<span>Restore backup</span></button>
          <button class="btn btn--primary" type="button" data-db-action="export-library">${icon('download', 15)}<span>Back up everything</span></button>
        </div>
      </header>
      <div id="data-body"></div>
    </div>
  `;

  const body = root.querySelector('#data-body');

  async function draw() {
    const saved = store.getSaved();
    const versionCounts = {};
    if (isLibraryReady()) {
      const counts = await Promise.all(saved.map(async (entry) => {
        try {
          const versions = await library.listVersions(entry.id);
          return [entry.id, versions.length];
        } catch {
          return [entry.id, 0];
        }
      }));
      counts.forEach(([id, count]) => {
        versionCounts[id] = count;
      });
    }
    const ctx = contextFor(saved);
    const fresh = evaluate(ctx);
    fresh.forEach((entry) => toast(`Achievement unlocked: ${entry.title}`, 'success', { duration: 3200 }));
    const summary = getSummary(ctx);
    const level = getLevelInfo();
    const profile = getProfile();
    const reputation = getReputation();
    const learn = getLearningStats(LESSONS.length);
    const settings = getSettings();
    const usageInfo = await library.usage().catch(() => null);
    const careerState = getCareerState();
    const repairs = Object.keys(careerState.repaired || {}).length;

    body.innerHTML = `
      <section class="data-stats">
        <div class="data-stat">
          <span>${icon('bookmark', 14)} Saved builds</span>
          <strong>${saved.length}</strong>
        </div>
        <div class="data-stat">
          <span>${icon('refresh', 14)} Versions kept</span>
          <strong>${Object.values(versionCounts).reduce((sum, count) => sum + count, 0)}</strong>
        </div>
        <div class="data-stat">
          <span>${icon('shield', 14)} Achievements</span>
          <strong>${summary.unlocked}<em>/${summary.total}</em></strong>
        </div>
        <div class="data-stat">
          <span>${icon('database', 14)} Library storage</span>
          <strong>${usageInfo ? bytes(usageInfo.used) : 'local'}</strong>
        </div>
      </section>

      <div class="data-grid">
        <section class="data-card data-card--wide">
          <div class="data-card-head">
            <h2>${icon('database', 16)} Build library</h2>
            <span class="data-chip ${isLibraryReady() ? 'is-ok' : ''}">
              ${isLibraryReady() ? 'IndexedDB' : 'LocalStorage fallback'}
            </span>
          </div>
          <p class="data-note">${isLibraryReady()
    ? 'Builds are kept in IndexedDB with a version history, so a later edit can be rolled back.'
    : 'This browser is using the older storage. Builds still save, but version history needs IndexedDB.'}</p>
          ${saved.length
    ? `<div class="lib-list">${saved.map((entry) => buildRow(entry, versionCounts[entry.id])).join('')}</div>`
    : `<div class="data-empty">${icon('bookmark', 22)}<p>No saved builds yet. Save one from the builder and it appears here with its history.</p><a class="btn btn--primary btn--sm" href="#/builder">${icon('wrench', 14)}<span>Open the builder</span></a></div>`}
        </section>

        <section class="data-card">
          <div class="data-card-head"><h2>${icon('gamepad', 16)} Progression</h2></div>
          <div class="prog-level">
            <div class="prog-badge">Lv ${level.level}</div>
            <div class="prog-info">
              <strong>${escapeHtml(levelTitle(level.level))}</strong>
              <span>${escapeHtml(settings.name || profile.name || 'New technician')}</span>
            </div>
          </div>
          <div class="prog-bar"><span style="width:${Math.round((level.progress || 0) * 100)}%"></span></div>
          <p class="prog-xp">${level.intoLevel || 0} / ${level.needed || 0} XP to level ${Math.min(30, level.level + 1)}</p>
          <div class="prog-rows">
            <div><span>Jobs delivered</span><strong>${jobsDoneCount()}</strong></div>
            <div><span>Repairs fixed</span><strong>${repairs}</strong></div>
            <div><span>Reputation</span><strong>${(Number(reputation) || 0).toFixed(1)}★</strong></div>
            <div><span>Lessons passed</span><strong>${learn.passed}/${LESSONS.length}</strong></div>
            <div><span>Wallet</span><strong>${peso(profile.wallet)}</strong></div>
          </div>
        </section>

        <section class="data-card">
          <div class="data-card-head"><h2>${icon('palette', 16)} Preferences</h2></div>
          <div class="pref-grid">
            <label class="pref-field">
              <span>Technician name</span>
              <input type="text" id="pref-name" maxlength="24" value="${escapeHtml(settings.name)}" placeholder="Your name">
            </label>
            <label class="pref-field">
              <span>Language</span>
              <select id="pref-lang">
                <option value="en" ${settings.lang === 'en' ? 'selected' : ''}>English</option>
                <option value="fil" ${settings.lang === 'fil' ? 'selected' : ''}>Filipino</option>
              </select>
            </label>
            <label class="pref-field">
              <span>Currency</span>
              <select id="pref-currency">
                ${CURRENCY_CODES.map((code) => `<option value="${code}" ${settings.currency === code ? 'selected' : ''}>${escapeHtml(CURRENCIES[code].name || code)} (${escapeHtml(currencyMeta(code).symbol || code)})</option>`).join('')}
              </select>
            </label>
            <label class="pref-field pref-field--switch">
              <span>Sound effects</span>
              <input type="checkbox" id="pref-sound" ${settings.sound ? 'checked' : ''}>
            </label>
            <label class="pref-field">
              <span>Graphics</span>
              <select id="pref-quality">
                <option value="high" ${settings.quality !== 'simple' ? 'selected' : ''}>Standard - full detail, shadows</option>
                <option value="simple" ${settings.quality === 'simple' ? 'selected' : ''}>Simplified - faster, lighter 3D</option>
              </select>
            </label>
          </div>
          <p class="data-note">Prices are stored in pesos and converted for display, so switching currency never changes a value. Graphics changes apply the next time a 3D view opens.</p>
        </section>

        <section class="data-card">
          <div class="data-card-head"><h2>${icon('lock', 16)} Backup &amp; accounts</h2></div>
          <p class="data-note">Clearing browser data wipes this library. A backup file keeps it safe, and the records already carry the fields an account would use — so cloud sync can be added later without moving anything.</p>
          <div class="backup-actions">
            <button class="btn btn--ghost btn--sm" type="button" data-db-action="export-library">${icon('download', 14)}<span>Back up all</span></button>
            <button class="btn btn--ghost btn--sm" type="button" data-db-action="import-library">${icon('upload', 14)}<span>Restore</span></button>
            <button class="btn btn--ghost btn--sm" type="button" data-db-action="sync-payload">${icon('copy', 14)}<span>Copy sync payload</span></button>
            <button class="btn btn--ghost btn--sm" type="button" data-db-action="persist">${icon('shield', 14)}<span>Protect storage</span></button>
          </div>
          <p class="data-note data-note--small">
            ${usageInfo ? `Using ${bytes(usageInfo.used)} of ${bytes(usageInfo.quota)} the browser allows · ${usageInfo.persisted ? 'protected from automatic clearing' : 'may be cleared by the browser when space runs low'}` : 'This browser does not report storage usage.'}
          </p>
        </section>
      </div>

      <section class="ach-section">
        <div class="ach-section-head">
          <h2>${icon('sparkles', 16)} Achievements</h2>
          <span class="ach-score">${summary.points} / ${summary.maxPoints} points</span>
        </div>
        <div class="ach-tiers">
          <span class="ach-tier-pill ach-tier--bronze">${summary.tiers.bronze} bronze</span>
          <span class="ach-tier-pill ach-tier--silver">${summary.tiers.silver} silver</span>
          <span class="ach-tier-pill ach-tier--gold">${summary.tiers.gold} gold</span>
          <button class="btn btn--danger-ghost btn--sm" type="button" data-db-action="reset-achievements">${icon('reset', 13)}<span>Reset</span></button>
        </div>
        ${GROUPS.map((group) => {
    const items = summary.items.filter((entry) => entry.group === group);
    if (!items.length) return '';
    return `
            <div class="ach-group">
              <h3 class="ach-group-title">${escapeHtml(group)} <span>${items.filter((entry) => entry.unlocked).length}/${items.length}</span></h3>
              <div class="ach-grid">${items.map(achievementCard).join('')}</div>
            </div>
          `;
  }).join('')}
      </section>
    `;
  }

  async function showHistory(id) {
    const entry = store.getSavedById(id);
    if (!entry) return;
    if (!isLibraryReady()) {
      toast('Version history needs IndexedDB, which this browser is not using.', 'warn');
      return;
    }
    let versions = [];
    try {
      versions = await library.listVersions(id);
    } catch (error) {
      toast(error?.message || 'The history could not be read.', 'error');
      return;
    }
    const overlay = openModal({
      title: `History · ${entry.name}`,
      eyebrow: 'Saved versions',
      size: 'md',
      body: versions.length
        ? `<div class="hist-list">${versions.map((version) => {
            const parts = Object.values(version.items || {}).reduce((sum, ids) => sum + (Array.isArray(ids) ? ids.length : 0), 0);
            return `
            <article class="hist-row">
              <div>
                <strong>${escapeHtml(version.note || 'Saved version')}</strong>
                <p>${escapeHtml(formatDate(version.at, true))} · ${parts} part${parts === 1 ? '' : 's'}${version.total ? ` · ${peso(version.total)}` : ''}</p>
              </div>
              <button class="btn btn--ghost btn--sm" type="button" data-db-action="restore" data-id="${entry.id}" data-version="${version.id}">
                ${icon('refresh', 13)}<span>Restore</span>
              </button>
            </article>
          `;}).join('')}</div>`
        : `<p class="data-note">No versions stored for this build yet. Save it again after changing parts and each save adds a version.</p>`,
      footer: `<button class="btn btn--ghost" type="button" data-modal-close>Close</button>`,
    });

    // The dialog lives outside the page root, so its own buttons are wired here.
    overlay?.addEventListener('click', async (event) => {
      const button = event.target.closest('[data-db-action="restore"]');
      if (!button) return;
      try {
        await restoreVersion(button.dataset.id, button.dataset.version);
        record('rollbacks');
        closeModal();
        toast('Build rolled back to that version.', 'success');
        draw();
      } catch (error) {
        toast(error?.message || 'That version could not be restored.', 'error');
      }
    });
  }

  function downloadJSON(payload, filename) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 800);
  }

  async function backupAll() {
    try {
      const payload = isLibraryReady() ? await library.exportAll() : {
        format: 'pcbs.library.v1',
        exportedAt: new Date().toISOString(),
        builds: store.getSaved(),
        versions: [],
      };
      downloadJSON(payload, `pc-build-library-${new Date().toISOString().slice(0, 10)}.json`);
      record('backups');
      toast(`Backed up ${payload.builds.length} build${payload.builds.length === 1 ? '' : 's'}.`, 'success');
      draw();
    } catch (error) {
      toast(error?.message || 'The backup could not be written.', 'error');
    }
  }

  function pickBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const payload = JSON.parse(text);
        if (!isLibraryReady()) {
          toast('Restoring a full library needs IndexedDB, which this browser is not using.', 'warn');
          return;
        }
        const confirmed = await confirmDialog({
          title: 'Restore this backup?',
          message: 'Builds in the file are added to your library. Builds with the same id are replaced by the file’s copy.',
          confirmLabel: 'Restore builds',
        });
        if (!confirmed) return;
        const result = await library.importAll(payload);
        await initLibrary();
        record('restores');
        toast(`Restored ${result.builds} build${result.builds === 1 ? '' : 's'} and ${result.versions} version${result.versions === 1 ? '' : 's'}.`, 'success');
        draw();
      } catch (error) {
        toast(error?.message || 'That file could not be restored.', 'error');
      }
    });
    input.click();
  }

  async function copySyncPayload() {
    try {
      const payload = JSON.stringify(exportForSync(), null, 2);
      await navigator.clipboard.writeText(payload);
      record('syncPayload');
      toast('Sync payload copied. An account can upload this as-is.', 'success');
      draw();
    } catch {
      toast('The clipboard was blocked. Use “Back up everything” instead.', 'warn');
    }
  }

  root.addEventListener('click', async (event) => {
    const target = event.target.closest('[data-db-action]');
    if (!target) return;
    const action = target.dataset.dbAction;
    const id = target.dataset.id;
    if (action === 'history') {
      showHistory(id);
      return;
    }
    if (action === 'load') {
      if (store.loadSavedBuild(id)) {
        const entry = store.getSavedById(id);
        record('loads');
        toast(`${entry?.name || 'Build'} loaded into the builder.`, 'success');
        location.hash = '#/builder';
      }
      return;
    }
    if (action === 'export-one') {
      const entry = store.getSavedById(id);
      if (!entry) return;
      downloadJSON({ format: 'pcbs.build.v1', build: sanitizeBuild(entry, entry.name) }, `${entry.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.json`);
      record('exportsJson');
      toast('Build exported as JSON.', 'success');
      draw();
      return;
    }
    if (action === 'delete') {
      const entry = store.getSavedById(id);
      if (!entry) return;
      const confirmed = await confirmDialog({
        title: `Delete “${entry.name}”?`,
        message: 'This removes the build and its history from this browser. It cannot be undone.',
        confirmLabel: 'Delete build',
        danger: true,
      });
      if (!confirmed) return;
      store.deleteSaved(id);
      toast('Saved build deleted.', 'info');
      draw();
      return;
    }
    if (action === 'restore') {
      return;
    }
    if (action === 'export-library') {
      backupAll();
      return;
    }
    if (action === 'import-library') {
      pickBackup();
      return;
    }
    if (action === 'sync-payload') {
      copySyncPayload();
      return;
    }
    if (action === 'persist') {
      const granted = await library.requestPersist();
      toast(granted ? 'Storage is now protected from automatic clearing.' : 'The browser did not grant protection. Keep a backup file.', granted ? 'success' : 'warn');
      draw();
      return;
    }
    if (action === 'reset-achievements') {
      const confirmed = await confirmDialog({
        title: 'Reset achievements?',
        message: 'Counters and unlocked achievements are cleared. Saved builds, career and lessons are untouched.',
        confirmLabel: 'Reset achievements',
        danger: true,
      });
      if (!confirmed) return;
      resetAchievements();
      toast('Achievements reset.', 'info');
      draw();
    }
  });

  root.addEventListener('change', (event) => {
    const target = event.target;
    if (target.id === 'pref-lang') {
      setSetting({ lang: target.value });
      toast('Language changed.', 'success', { duration: 1600 });
      draw();
    } else if (target.id === 'pref-currency') {
      setSetting({ currency: target.value });
      toast(`Prices now shown in ${currencyMeta(target.value).code || target.value}.`, 'success', { duration: 1800 });
      draw();
    } else if (target.id === 'pref-sound') {
      setSetting({ sound: target.checked });
      toast(target.checked ? 'Sound effects on.' : 'Sound effects off.', 'info', { duration: 1600 });
    } else if (target.id === 'pref-quality') {
      setSetting({ quality: target.value });
      toast(target.value === 'simple' ? 'Simplified graphics on - reopen a 3D view to apply.' : 'Standard graphics on - reopen a 3D view to apply.', 'info', { duration: 2200 });
    }
  });

  root.addEventListener('blur', (event) => {
    const target = event.target;
    if (target.id === 'pref-name') {
      setSetting({ name: target.value });
      toast('Name saved.', 'success', { duration: 1600 });
    }
  }, true);

  draw();

  unsubList.push(on('saved', () => draw()));
  unsubList.push(on('library-error', (error) => toast(error?.message || 'The library hit a problem.', 'error')));

  return () => {
    unsubList.forEach((unsub) => unsub());
  };
}
