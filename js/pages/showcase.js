import { HARDWARE_BY_ID } from '../data/hardware.js';
import { PRESETS } from '../data/presets.js';
import { store, on } from '../core/store.js';
import { evaluateBuild } from '../core/compat.js';
import { escapeHtml, peso } from '../core/format.js';
import { icon } from '../ui/icons.js';
import { statusBadge } from '../ui/summary.js';
import { presetTotal } from '../ui/preset.js';
import { productArt } from '../ui/art.js';
import { pageHeader } from '../ui/common.js';

const FILTERS = [
  { id: 'all', label: 'All builds' },
  { id: 'Gaming', label: 'Gaming' },
  { id: 'Creator', label: 'Creator' },
  { id: 'Workstation', label: 'Workstation' },
  { id: 'Office', label: 'Office' },
  { id: 'rated', label: 'Your top rated' },
];

function presetParts(preset) {
  return Object.values(preset.items).flat().map((id) => HARDWARE_BY_ID[id]).filter(Boolean);
}

function starsHTML(presetId) {
  const rating = store.getPresetRating(presetId);
  return `
    <div class="showcase-rating" aria-label="Your rating for this build">
      <span>Your rating</span>
      <div class="star-row">
        ${[1, 2, 3, 4, 5].map((value) => `
          <button class="star ${value <= rating ? 'is-filled' : ''}" type="button" data-showcase-rate="${value}" data-preset-id="${presetId}" aria-label="Rate ${value} out of 5" aria-pressed="${value === rating}">★</button>
        `).join('')}
      </div>
      <small>${rating ? `${rating}/5 · saved locally` : 'Not rated yet'}</small>
    </div>
  `;
}

function cardHTML(preset) {
  const items = presetParts(preset);
  const cpu = items.find((item) => item.category === 'cpu');
  const gpu = items.find((item) => item.category === 'gpu');
  const caseItem = items.find((item) => item.category === 'case');
  const result = evaluateBuild({ items: preset.items });
  return `
    <article class="showcase-card" style="--preset-accent:${preset.accent}">
      <div class="showcase-art">
        ${caseItem ? productArt(caseItem) : icon('cube', 48)}
        <span class="showcase-niche">${escapeHtml(preset.niche)}</span>
        ${statusBadge(result)}
      </div>
      <div class="showcase-body">
        <div class="showcase-title-row">
          <div>
            <h2>${escapeHtml(preset.name)}</h2>
            <p>${escapeHtml(preset.tagline)}</p>
          </div>
        </div>
        <div class="showcase-specs">
          <div><span>CPU</span><strong>${escapeHtml(cpu?.name || 'Not selected')}</strong></div>
          <div><span>Graphics</span><strong>${escapeHtml(gpu?.name || 'Integrated graphics')}</strong></div>
          <div><span>Memory</span><strong>${escapeHtml(items.find((item) => item.category === 'ram')?.name || 'Not selected')}</strong></div>
        </div>
        <div class="showcase-foot">
          <div class="showcase-price">
            <span>Estimated total</span>
            <strong>${peso(presetTotal(preset))}</strong>
          </div>
          <button class="btn btn--primary btn--sm" type="button" data-action="load-preset" data-id="${preset.id}">${icon('sparkles', 14)}<span>Load build</span></button>
        </div>
        ${starsHTML(preset.id)}
      </div>
    </article>
  `;
}

export function render(root) {
  let filter = 'all';

  root.innerHTML = `
    <div class="showcase-page">
      ${pageHeader({
        eyebrow: 'Curated showcase',
        title: 'Build gallery',
        text: 'A hand-picked set of complete, compatible starting points. Rate them locally to remember your favourites — no account or public upload is involved.',
        actions: `<button class="btn btn--primary" type="button" data-action="open-wizard">${icon('sparkles', 15)}<span>Guided setup</span></button>`,
      })}
      <div class="showcase-toolbar">
        <div class="showcase-filters" role="group" aria-label="Filter showcase builds">
          ${FILTERS.map((entry) => `<button class="showcase-filter ${entry.id === filter ? 'is-active' : ''}" type="button" data-showcase-filter="${entry.id}">${escapeHtml(entry.label)}</button>`).join('')}
        </div>
        <span class="showcase-local-note">${icon('lock', 13)} Ratings stay in this browser</span>
      </div>
      <div class="showcase-grid" id="showcase-grid"></div>
    </div>
  `;

  const grid = root.querySelector('#showcase-grid');

  function matches(preset) {
    if (filter === 'all') return true;
    if (filter === 'rated') return store.getPresetRating(preset.id) >= 4;
    return preset.niche === filter;
  }

  function renderGrid() {
    const builds = PRESETS.filter(matches);
    grid.innerHTML = builds.length
      ? builds.map(cardHTML).join('')
      : `<div class="showcase-empty">${icon('search', 22)}<h3>No builds in this filter yet</h3><p>${filter === 'rated' ? 'Rate a build four stars or higher to add it here.' : 'Try another category.'}</p></div>`;
  }

  const onFilter = (event) => {
    const button = event.target.closest('[data-showcase-filter]');
    if (!button) return;
    filter = button.dataset.showcaseFilter;
    root.querySelectorAll('[data-showcase-filter]').forEach((entry) => {
      entry.classList.toggle('is-active', entry.dataset.showcaseFilter === filter);
    });
    renderGrid();
  };

  const onRate = (event) => {
    const button = event.target.closest('[data-showcase-rate]');
    if (!button) return;
    store.ratePreset(button.dataset.presetId, Number(button.dataset.showcaseRate));
  };

  root.addEventListener('click', onFilter);
  root.addEventListener('click', onRate);
  const unsubscribe = on('ratings', renderGrid);

  renderGrid();

  return () => {
    root.removeEventListener('click', onFilter);
    root.removeEventListener('click', onRate);
    unsubscribe();
  };
}
