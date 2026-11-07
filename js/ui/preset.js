import { HARDWARE_BY_ID } from '../data/hardware.js';
import { escapeHtml, peso } from '../core/format.js';
import { icon } from './icons.js';

function presetParts(preset) {
  return Object.values(preset.items).flat().map((id) => HARDWARE_BY_ID[id]).filter(Boolean);
}

export function presetTotal(preset) {
  return presetParts(preset).reduce((sum, item) => sum + item.price, 0);
}

export function presetCard(preset, options = {}) {
  const items = presetParts(preset);
  const cpu = items.find((item) => item.category === 'cpu');
  const gpu = items.find((item) => item.category === 'gpu');
  const memory = items.find((item) => item.category === 'ram');
  const storage = items.find((item) => item.category === 'storage');
  const featured = [cpu, gpu, memory, storage].filter(Boolean);
  return `
    <article class="preset-card" style="--preset-accent:${preset.accent}">
      <div class="preset-card-glow"></div>
      <div class="preset-top">
        <span class="preset-niche">${escapeHtml(preset.niche)}</span>
        <span class="preset-parts-count">${items.length} parts</span>
      </div>
      <h3 class="preset-name">${escapeHtml(preset.name)}</h3>
      <p class="preset-tagline">${escapeHtml(preset.tagline)}</p>
      <div class="preset-part-list">
        ${featured.map((item) => `
          <div class="preset-part">
            <span class="preset-part-cat">${escapeHtml(item.category === 'motherboard' ? 'Board' : item.category === 'cpu' ? 'CPU' : item.category === 'gpu' ? 'GPU' : item.category === 'ram' ? 'RAM' : item.category === 'storage' ? 'SSD' : item.category)}</span>
            <span>${escapeHtml(item.name)}</span>
          </div>
        `).join('')}
      </div>
      <div class="preset-foot">
        <div class="preset-price">
          <span>Estimated total</span>
          <strong>${peso(presetTotal(preset))}</strong>
        </div>
        <div class="preset-actions">
          <button class="icon-btn" type="button" data-action="preset-details" data-id="${preset.id}" aria-label="Preview ${escapeHtml(preset.name)}" title="Preview parts">${icon('eye', 16)}</button>
          <button class="btn btn--primary btn--sm" type="button" data-action="load-preset" data-id="${preset.id}">${icon('sparkles', 14)}<span>${escapeHtml(options.actionLabel || 'Load build')}</span></button>
        </div>
      </div>
    </article>
  `;
}

export function presetDetailsHTML(preset) {
  const items = presetParts(preset);
  return `
    <div class="preset-detail">
      <div class="preset-detail-banner" style="--preset-accent:${preset.accent}">
        <span class="preset-niche">${escapeHtml(preset.niche)}</span>
        <h3>${escapeHtml(preset.name)}</h3>
        <p>${escapeHtml(preset.description)}</p>
        <div class="preset-highlights">
          ${preset.highlights.map((highlight) => `<span class="mini-chip">${escapeHtml(highlight)}</span>`).join('')}
        </div>
      </div>
      <div class="preset-detail-list">
        ${items.map((item) => `
          <div class="preset-detail-row">
            <span class="build-row-category">${escapeHtml(item.category)}</span>
            <span class="preset-detail-name">${escapeHtml(item.name)}</span>
            <span>${peso(item.price)}</span>
          </div>
        `).join('')}
      </div>
      <div class="preset-detail-total">
        <span>Estimated total</span>
        <strong>${peso(presetTotal(preset))}</strong>
      </div>
      <p class="detail-note">${icon('info', 14)} Loading this preset replaces the components in your current build. You can customise every part afterwards.</p>
      <div class="detail-actions">
        <button class="btn btn--ghost" type="button" data-modal-close>Cancel</button>
        <button class="btn btn--primary" type="button" data-action="load-preset" data-id="${preset.id}">${icon('sparkles', 15)}<span>Load this build</span></button>
      </div>
    </div>
  `;
}
