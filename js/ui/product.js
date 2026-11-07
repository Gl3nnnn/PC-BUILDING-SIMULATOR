import { escapeHtml, peso } from '../core/format.js';
import { getIds } from '../core/build.js';
import { productArt } from './art.js';
import { icon } from './icons.js';
import { availabilityBadge, categoryLabel, keySpecs, specRows } from './specs.js';

export function productCard(item, options = {}) {
  const selected = Boolean(options.selected);
  const compared = Boolean(options.compared);
  const category = categoryLabel(item.category);
  return `
    <article class="product-card ${selected ? 'is-selected' : ''}" data-component-card="${item.id}">
      <div class="product-art-wrap">
        ${productArt(item)}
        <div class="product-float-badges">${availabilityBadge(item)}</div>
        <button class="compare-toggle ${compared ? 'is-active' : ''}" type="button"
          data-action="toggle-compare" data-id="${item.id}"
          aria-pressed="${compared}" aria-label="Compare ${escapeHtml(item.name)}"
          title="Add to comparison">
          ${icon('compare', 15)}<span>Compare</span>
        </button>
      </div>
      <div class="product-card-body">
        <div class="product-meta">
          <span class="brand-tag">${escapeHtml(item.brand)}</span>
          <span class="category-tag">${escapeHtml(category)}</span>
        </div>
        <h3 class="product-name">
          <button class="product-name-btn" type="button" data-action="details" data-id="${item.id}">${escapeHtml(item.name)}</button>
        </h3>
        <div class="spec-chips">${keySpecs(item).map((spec) => `<span class="spec-chip">${escapeHtml(spec)}</span>`).join('')}</div>
      </div>
      <footer class="product-card-foot">
        <div class="price-block">
          <span class="price">${peso(item.price)}</span>
          <span class="price-note" title="Estimated sample price in Philippine pesos">est. price</span>
        </div>
        <div class="card-actions">
          <button class="icon-btn" type="button" data-action="details" data-id="${item.id}" aria-label="View full specifications for ${escapeHtml(item.name)}" title="Full specifications">${icon('info', 16)}</button>
          <button class="btn btn--sm ${selected ? 'btn--selected' : 'btn--primary'}" type="button"
            data-action="add-component" data-category="${item.category}" data-id="${item.id}"
            aria-pressed="${selected}">
            ${selected ? icon('check', 14) : icon('plus', 14)}<span data-add-label>${selected ? 'Remove' : 'Add'}</span>
          </button>
        </div>
      </footer>
    </article>
  `;
}

export function syncProductButtons(root, build) {
  root.querySelectorAll('[data-action="add-component"]').forEach((button) => {
    const { category, id } = button.dataset;
    const selected = getIds(build, category).includes(id);
    button.classList.toggle('btn--selected', selected);
    button.classList.toggle('btn--primary', !selected);
    button.setAttribute('aria-pressed', String(selected));
    const label = button.querySelector('[data-add-label]');
    if (label) label.textContent = selected ? 'Remove' : 'Add';
    const card = button.closest('[data-component-card]');
    if (card) card.classList.toggle('is-selected', selected);
  });
}

export function syncCompareButtons(root, compareIds) {
  root.querySelectorAll('[data-action="toggle-compare"]').forEach((button) => {
    const active = compareIds.includes(button.dataset.id);
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

export function specTableHTML(item, options = {}) {
  const rows = specRows(item);
  return `
    <div class="spec-table ${options.compact ? 'spec-table--compact' : ''}">
      ${rows.map((row) => `
        <div class="spec-row">
          <span class="spec-label">${escapeHtml(row.label)}</span>
          <span class="spec-value ${row.missing ? 'is-missing' : ''}">${escapeHtml(row.value)}</span>
        </div>
      `).join('')}
    </div>
  `;
}

export function componentDetailsHTML(item, options = {}) {
  const selected = Boolean(options.selected);
  return `
    <div class="detail-sheet">
      <div class="detail-hero">
        <div class="detail-art">${productArt(item)}</div>
        <div class="detail-summary">
          <div class="product-meta">
            <span class="brand-tag">${escapeHtml(item.brand)}</span>
            <span class="category-tag">${escapeHtml(categoryLabel(item.category))}</span>
          </div>
          <div class="detail-badges">
            ${availabilityBadge(item)}
            <span class="badge badge--neutral">Sample catalog</span>
          </div>
          <div class="detail-price">
            <span class="price price--lg">${peso(item.price)}</span>
            <span class="price-note">Estimated sample price · PHP</span>
          </div>
          <div class="spec-chips">${keySpecs(item).map((spec) => `<span class="spec-chip">${escapeHtml(spec)}</span>`).join('')}</div>
        </div>
      </div>
      <div class="detail-body">
        <h4 class="detail-heading">${icon('list', 16)} Specifications</h4>
        ${specTableHTML(item)}
        <p class="detail-note">${icon('info', 14)} Specifications and availability are realistic sample data for demonstration. Prices are estimates in Philippine pesos and are not live retailer quotes.</p>
      </div>
      <footer class="detail-actions">
        <button class="btn btn--ghost" type="button" data-modal-close>Close</button>
        <button class="btn ${selected ? 'btn--selected' : 'btn--primary'}" type="button"
          data-action="add-component" data-category="${item.category}" data-id="${item.id}" aria-pressed="${selected}">
          ${selected ? icon('check', 15) : icon('plus', 15)}<span data-add-label>${selected ? 'Remove' : 'Add'}</span>
        </button>
      </footer>
    </div>
  `;
}

export function compareTableHTML(items) {
  if (!items.length) return '';
  const labels = [];
  const seen = new Set();
  items.forEach((item) => {
    specRows(item).forEach((row) => {
      if (!seen.has(row.label)) {
        seen.add(row.label);
        labels.push(row.label);
      }
    });
  });
  const lookup = new Map();
  items.forEach((item) => {
    lookup.set(item.id, new Map(specRows(item).map((row) => [row.label, row])));
  });
  const lowest = Math.min(...items.map((item) => item.price));
  return `
    <div class="compare-scroll">
      <table class="compare-table">
        <thead>
          <tr>
            <th class="compare-label-cell">Specification</th>
            ${items.map((item) => `
              <th>
                <div class="compare-head">
                  <div class="compare-art">${productArt(item)}</div>
                  <span class="brand-tag">${escapeHtml(item.brand)}</span>
                  <strong>${escapeHtml(item.name)}</strong>
                  <span class="compare-price ${item.price === lowest ? 'is-best' : ''}">${peso(item.price)}</span>
                  ${item.price === lowest ? '<span class="badge badge--ok">Lowest price</span>' : ''}
                </div>
              </th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          ${labels.map((label) => `
            <tr>
              <th class="compare-label-cell">${escapeHtml(label)}</th>
              ${items.map((item) => {
                const row = lookup.get(item.id)?.get(label);
                return `<td class="${row?.missing ? 'is-missing' : ''}">${escapeHtml(row?.value || '—')}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}
