import { compareTableHTML } from './product.js';
import { getHardware, categoryMeta } from '../data/hardware.js';
import { escapeHtml } from '../core/format.js';
import { icon } from './icons.js';
import { openModal } from './modal.js';
import { toast } from './toast.js';

let ids = [];
let initialized = false;
let dock = null;

function categoryName(categoryId) {
  return categoryMeta(categoryId)?.label || 'components';
}

function notify() {
  renderDock();
  document.dispatchEvent(new CustomEvent('compare:changed', { detail: { ids: [...ids] } }));
}

function ensureDock() {
  if (dock?.isConnected) return dock;
  dock = document.createElement('div');
  dock.className = 'compare-dock';
  dock.id = 'compare-dock';
  dock.hidden = true;
  dock.innerHTML = `
    <div class="compare-dock-inner">
      <div class="compare-dock-heading">${icon('compare', 17)}<span>Compare</span></div>
      <div class="compare-chips"></div>
      <div class="compare-dock-actions">
        <button class="btn btn--ghost btn--sm" type="button" data-compare-clear>Clear</button>
        <button class="btn btn--primary btn--sm" type="button" data-compare-open>${icon('compare', 15)}<span data-compare-open-label>Compare</span></button>
      </div>
    </div>
  `;
  dock.addEventListener('click', (event) => {
    const remove = event.target.closest('[data-compare-remove]');
    if (remove) {
      ids = ids.filter((id) => id !== remove.dataset.compareRemove);
      notify();
      return;
    }
    if (event.target.closest('[data-compare-clear]')) {
      compare.clear();
      return;
    }
    if (event.target.closest('[data-compare-open]')) {
      openCompareModal();
    }
  });
  document.body.appendChild(dock);
  return dock;
}

function renderDock() {
  if (!initialized) return;
  ensureDock();
  const items = ids.map(getHardware).filter(Boolean);
  dock.hidden = items.length === 0;
  document.body.classList.toggle('has-compare-dock', items.length > 0);
  if (!items.length) return;
  dock.querySelector('.compare-chips').innerHTML = items.map((item) => `
    <span class="compare-chip">
      <span class="compare-chip-dot" style="--chip-color:${item.accent || 'var(--accent)'}"></span>
      <span class="compare-chip-name">${escapeHtml(item.name)}</span>
      <button type="button" data-compare-remove="${item.id}" aria-label="Remove ${escapeHtml(item.name)} from comparison">${icon('close', 12)}</button>
    </span>
  `).join('');
  dock.querySelector('[data-compare-open-label]').textContent = `Compare ${items.length}`;
}

export function openCompareModal() {
  const items = ids.map(getHardware).filter(Boolean);
  if (items.length < 2) {
    toast('Add at least two components of the same type to compare.', 'info');
    return;
  }
  openModal({
    title: `Compare ${categoryName(items[0].category)}`,
    eyebrow: 'Side by side',
    subtitle: 'Specifications, price, and availability from the sample hardware catalog.',
    size: 'xl',
    body: compareTableHTML(items),
    footer: `<button class="btn btn--ghost" type="button" data-modal-close>Close comparison</button>`,
  });
}

export const compare = {
  init() {
    if (initialized) return;
    initialized = true;
    ensureDock();
    renderDock();
  },
  toggle(id) {
    const item = getHardware(id);
    if (!item) return { action: 'invalid' };
    if (ids.includes(id)) {
      ids = ids.filter((entry) => entry !== id);
      notify();
      return { action: 'removed', item };
    }
    const currentItems = ids.map(getHardware).filter(Boolean);
    if (currentItems.length && currentItems[0].category !== item.category) {
      ids = [id];
      notify();
      toast(`Comparison reset to ${categoryName(item.category)}. Only same-category parts can be compared.`, 'info');
      return { action: 'reset', item };
    }
    if (ids.length >= 4) {
      toast('You can compare up to 4 components at a time.', 'warn');
      return { action: 'limit', item };
    }
    ids = [...ids, id];
    notify();
    return { action: 'added', item };
  },
  clear() {
    ids = [];
    notify();
  },
  getIds() {
    return [...ids];
  },
  has(id) {
    return ids.includes(id);
  },
  count() {
    return ids.length;
  },
  getCategory() {
    return ids.length ? getHardware(ids[0])?.category || null : null;
  },
  open: openCompareModal,
};
