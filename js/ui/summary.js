import { CATEGORIES } from '../data/hardware.js';
import { buildTotal, getItems } from '../core/build.js';
import { COMPATIBILITY_LABELS } from '../core/compat.js';
import { getPriceState } from '../core/prices.js';
import { analyzeBuild } from '../core/intelligence.js';
import { escapeHtml, peso } from '../core/format.js';
import { icon } from './icons.js';

export function statusBadge(result, options = {}) {
  const meta = COMPATIBILITY_LABELS[result?.status] || COMPATIBILITY_LABELS.empty;
  const label = options.label || meta.label;
  return `<span class="status-pill status-pill--${meta.tone}">${icon(meta.icon, 14)}<span>${escapeHtml(label)}</span></span>`;
}

export function buildRowsHTML(build, options = {}) {
  const interactive = options.interactive !== false;
  return CATEGORIES.map((category) => {
    const items = getItems(build, category.id);
    const iconMarkup = `<span class="build-row-icon">${icon(category.icon, 16)}</span>`;
    if (!items.length) {
      const label = category.required ? 'Not selected' : 'Optional — not selected';
      return `
        <div class="build-row is-empty ${category.required ? 'is-required' : ''}">
          ${iconMarkup}
          <div class="build-row-main">
            <span class="build-row-category">${escapeHtml(category.label)}</span>
            <span class="build-row-name muted">${escapeHtml(label)}</span>
          </div>
          ${interactive ? `<button class="mini-action" type="button" data-action="focus-category" data-category="${category.id}" aria-label="Choose ${escapeHtml(category.label)}">${icon('plus', 13)}<span>Choose</span></button>` : ''}
        </div>
      `;
    }
    return items.map((item) => `
      <div class="build-row">
        ${iconMarkup}
        <div class="build-row-main">
          <span class="build-row-category">${escapeHtml(category.label)}</span>
          <span class="build-row-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>
        </div>
        <span class="build-row-price">${peso(item.price)}</span>
        ${interactive ? `<button class="build-row-remove" type="button" data-action="remove-component" data-category="${category.id}" data-id="${item.id}" aria-label="Remove ${escapeHtml(item.name)}">${icon('close', 13)}</button>` : ''}
      </div>
    `).join('');
  }).join('');
}

export function budgetHTML(build) {
  const total = buildTotal(build);
  const hasBudget = Number(build.budget) > 0;
  const budget = Number(build.budget) || 0;
  const remaining = budget - total;
  const percent = hasBudget ? Math.min(100, Math.round((total / budget) * 100)) : 0;
  const tone = hasBudget ? (total > budget ? 'over' : percent >= 90 ? 'close' : 'ok') : 'none';
  return `
    <div class="budget-box">
      <div class="budget-head">
        <label for="budget-input">Build budget <span>optional</span></label>
        ${hasBudget ? `<span class="budget-remaining ${remaining < 0 ? 'is-over' : ''}">${remaining >= 0 ? `${peso(remaining)} left` : `${peso(Math.abs(remaining))} over`}</span>` : ''}
      </div>
      <div class="budget-input-wrap">
        <span class="budget-currency">₱</span>
        <input id="budget-input" type="number" inputmode="numeric" min="0" step="500" placeholder="e.g. 60000"
          value="${hasBudget ? budget : ''}" data-budget-input autocomplete="off">
      </div>
      ${hasBudget ? `
        <div class="budget-track">
          <div class="budget-fill budget-fill--${tone}" style="width:${percent}%"></div>
        </div>
        <div class="budget-meta">
          <span>${peso(total)} spent</span>
          <span>${peso(budget)} budget</span>
        </div>
      ` : `<p class="budget-hint">Set a target and we will track your spend and remaining budget.</p>`}
    </div>
  `;
}

export function buildStatsHTML(result) {
  return `
    <div class="summary-stats">
      <div class="summary-stat">
        <span class="summary-stat-icon">${icon('bolt', 15)}</span>
        <div><span class="summary-stat-label">Est. peak draw</span><strong>${result.estimatedWattage} W</strong></div>
      </div>
      <div class="summary-stat">
        <span class="summary-stat-icon">${icon('psu', 15)}</span>
        <div><span class="summary-stat-label">Recommended PSU</span><strong>${result.recommendedPsu} W</strong></div>
      </div>
      <div class="summary-stat">
        <span class="summary-stat-icon">${icon('check', 15)}</span>
        <div><span class="summary-stat-label">Checks passed</span><strong>${result.passes.length}</strong></div>
      </div>
    </div>
  `;
}

export function buildIntelligenceHTML(build, options = {}) {
  const intel = analyzeBuild(build, {
    resolution: options.resolution || '1080p',
    quality: options.quality || 'ultra',
  });
  return intelligenceCardsHTML(intel);
}

export function intelligenceCardsHTML(intel) {
  if (!intel.averageFps && !intel.psuWattage) return '';
  const cards = [];
  if (intel.bottleneck) {
    cards.push(`
      <div class="intel-card intel-card--bottleneck">
        <span class="intel-label">${icon('chart', 13)} Bottleneck</span>
        <strong>${escapeHtml(intel.bottleneck.label)}</strong>
        <p>${escapeHtml(intel.bottleneck.detail)}</p>
      </div>
    `);
  }
  if (intel.costPerFrame) {
    cards.push(`
      <div class="intel-card">
        <span class="intel-label">${icon('money', 13)} Cost per frame</span>
        <strong>${peso(intel.costPerFrame)}<small>/fps</small></strong>
        <p>${intel.value ? escapeHtml(intel.value.label) : 'Based on selected resolution'} at ${escapeHtml(intel.performance.resolution.label)} ${escapeHtml(intel.performance.quality.label.toLowerCase())}.</p>
      </div>
    `);
  }
  if (intel.psuWattage) {
    cards.push(`
      <div class="intel-card">
        <span class="intel-label">${icon('bolt', 13)} PSU load</span>
        <strong>${intel.psuUtilization}%</strong>
        <p>${intel.headroom >= 0 ? `${intel.headroom} W headroom above the estimated ${intel.power} W peak.` : `${Math.abs(intel.headroom)} W above the PSU rating — reduce load or upgrade.`}</p>
      </div>
    `);
  }
  return `<div class="intel-strip">${cards.join('')}</div>`;
}

export function totalsHTML(build) {
  const total = buildTotal(build);
  return `
    <div class="totals-row">
      <div>
        <span class="totals-label">Estimated total</span>
        <span class="totals-note">${getPriceState().meta.source === 'feed' ? 'Live feed prices · PHP' : 'Sample prices · PHP'}</span>
      </div>
      <strong class="totals-value">${peso(total)}</strong>
    </div>
  `;
}

export function miniBuildChips(build, limit = 14) {
  const items = CATEGORIES.flatMap((category) => getItems(build, category.id));
  if (!items.length) return '<p class="muted small">No components selected yet.</p>';
  const visible = items.slice(0, limit);
  return `
    <div class="mini-chips">
      ${visible.map((item) => `<span class="mini-chip" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>`).join('')}
      ${items.length > limit ? `<span class="mini-chip mini-chip--more">+${items.length - limit} more</span>` : ''}
    </div>
  `;
}
