import { store, on } from '../core/store.js';
import { sanitizeBuild, buildTotal, selectedCount } from '../core/build.js';
import { evaluateBuild } from '../core/compat.js';
import { escapeHtml, peso, formatDate } from '../core/format.js';
import { icon } from '../ui/icons.js';
import { statusBadge, miniBuildChips } from '../ui/summary.js';
import { emptyState } from '../ui/common.js';

function savedCard(entry, currentBuild) {
  const build = sanitizeBuild(entry, entry.name);
  const result = evaluateBuild(build);
  const total = buildTotal(build);
  const count = selectedCount(build);
  const isCurrent = currentBuild.sourceId === entry.id;
  return `
    <article class="saved-card ${isCurrent ? 'is-current' : ''}" data-saved-card="${entry.id}">
      <div class="saved-card-top">
        <div>
          <div class="saved-card-meta">
            ${isCurrent ? '<span class="badge badge--accent"><span class="badge-dot"></span>Editing</span>' : ''}
            <span>${formatDate(entry.updatedAt, true)}</span>
          </div>
          <h3>${escapeHtml(entry.name)}</h3>
        </div>
        ${statusBadge(result)}
      </div>
      <div class="saved-metrics">
        <span>${icon('cpu', 13)} ${count} part${count === 1 ? '' : 's'}</span>
        <span>${icon('bolt', 13)} ${result.estimatedWattage} W est.</span>
        <span>${icon('psu', 13)} ${result.recommendedPsu} W PSU</span>
        ${entry.budget ? `<span>${icon('download', 13)} Budget ${peso(entry.budget)}</span>` : ''}
      </div>
      ${miniBuildChips(build, 8)}
      <div class="saved-foot">
        <div class="saved-total">
          <span>Estimated total</span>
          <strong>${peso(total)}</strong>
        </div>
        <div class="saved-actions">
          <button class="btn btn--primary btn--sm" type="button" data-action="load-saved" data-id="${entry.id}">${icon('wrench', 14)}<span>Load</span></button>
          <button class="icon-btn" type="button" data-action="rename-saved" data-id="${entry.id}" aria-label="Rename ${escapeHtml(entry.name)}" title="Rename">${icon('edit', 15)}</button>
          <button class="icon-btn" type="button" data-action="duplicate-saved" data-id="${entry.id}" aria-label="Duplicate ${escapeHtml(entry.name)}" title="Duplicate">${icon('copy', 15)}</button>
          <button class="icon-btn" type="button" data-action="share-saved" data-id="${entry.id}" aria-label="Share ${escapeHtml(entry.name)}" title="Share link">${icon('share', 15)}</button>
          <button class="icon-btn" type="button" data-action="pdf-saved" data-id="${entry.id}" aria-label="Export ${escapeHtml(entry.name)} as PDF" title="Export PDF">${icon('print', 15)}</button>
          <button class="icon-btn" type="button" data-action="export-saved" data-id="${entry.id}" aria-label="Export ${escapeHtml(entry.name)} as JSON" title="Export JSON">${icon('download', 15)}</button>
          <button class="icon-btn icon-btn--danger" type="button" data-action="delete-saved" data-id="${entry.id}" aria-label="Delete ${escapeHtml(entry.name)}" title="Delete">${icon('trash', 15)}</button>
        </div>
      </div>
    </article>
  `;
}

export function render(root) {
  root.innerHTML = `
    <div class="saved-page">
      <header class="page-head">
        <div>
          <p class="eyebrow">Local to this browser</p>
          <h1 class="page-title">Saved Builds</h1>
          <p class="page-subtitle">Save configurations, rename them, export a shopping summary, or share an encoded build link. No account needed.</p>
        </div>
        <div class="page-actions">
          <button class="btn btn--ghost" type="button" data-action="import-json">${icon('upload', 15)}<span>Import JSON</span></button>
          <button class="btn btn--primary" type="button" data-action="save-build">${icon('save', 15)}<span>Save current build</span></button>
        </div>
      </header>
      <div id="saved-content"></div>
    </div>
  `;

  const content = root.querySelector('#saved-content');

  function renderContent() {
    const saved = store.getSaved();
    const current = store.getCurrent();
    if (!saved.length) {
      content.innerHTML = `
        ${!store.isStorageAvailable() ? `<div class="storage-warning">${icon('alert', 16)} Local storage is unavailable in this browser. Builds cannot be saved between sessions.</div>` : ''}
        ${emptyState({
          iconName: 'bookmark',
          title: 'No saved builds yet',
          text: 'Save your current configuration or load a preset, then come back to manage your collection.',
          action: `<a class="btn btn--primary" href="#/builder">${icon('wrench', 16)}<span>Open the builder</span></a>
            <button class="btn btn--ghost" type="button" data-action="open-presets">${icon('sparkles', 16)}<span>Browse presets</span></button>
            <button class="btn btn--ghost" type="button" data-action="import-json">${icon('upload', 16)}<span>Import a build</span></button>`,
        })}
      `;
      return;
    }
    const totalValue = saved.reduce((sum, entry) => sum + buildTotal(sanitizeBuild(entry)), 0);
    content.innerHTML = `
      ${!store.isStorageAvailable() ? `<div class="storage-warning">${icon('alert', 16)} Local storage is unavailable in this browser. Saved builds may not persist.</div>` : ''}
      <div class="saved-summary">
        <div class="saved-summary-stat"><span>${icon('bookmark', 15)} Saved builds</span><strong>${saved.length}</strong></div>
        <div class="saved-summary-stat"><span>${icon('download', 15)} Combined value</span><strong>${peso(totalValue)}</strong></div>
        <div class="saved-summary-stat"><span>${icon('lock', 15)} Privacy</span><strong>Stored on this device</strong></div>
        <div class="saved-summary-actions">
          <button class="btn btn--danger-ghost btn--sm" type="button" data-action="clear-saved">${icon('trash', 14)}<span>Clear all</span></button>
        </div>
      </div>
      <div class="saved-grid">${saved.map((entry) => savedCard(entry, current)).join('')}</div>
      <p class="saved-note">${icon('info', 13)} Saved locally with <code>localStorage</code>. Clearing browser data removes saved builds. Export any build you want to keep long-term.</p>
    `;
  }

  renderContent();
  const unsubSaved = on('saved', renderContent);
  const unsubBuild = on('build', renderContent);
  return () => {
    unsubSaved();
    unsubBuild();
  };
}
