import { CATEGORIES, itemsByCategory, categoryMeta } from '../data/hardware.js';
import { store, on } from '../core/store.js';
import { buildTotal, coreProgress, getIds, getItems, selectedCount } from '../core/build.js';
import { evaluateBuild } from '../core/compat.js';
import { escapeHtml, peso } from '../core/format.js';
import { icon } from '../ui/icons.js';
import { productCard } from '../ui/product.js';
import { compare } from '../ui/compare.js';
import { statusBadge, buildRowsHTML, budgetHTML, buildStatsHTML, totalsHTML } from '../ui/summary.js';
import { emptyState, progressBar } from '../ui/common.js';

const CATEGORY_HINTS = {
  cpu: 'Match the socket to your motherboard. Faster single-core helps gaming; more cores help streaming and rendering.',
  motherboard: 'Check the socket, chipset, memory generation, and form factor. The board ties the whole build together.',
  gpu: 'The biggest gaming upgrade. Check card length, power connectors, and PSU headroom before choosing.',
  ram: 'DDR4 and DDR5 are not interchangeable. Aim for a matched pair and enable EXPO/XMP for rated speed.',
  storage: 'NVMe drives need an M.2 slot; SATA drives need a free SATA port. Faster Gen4/Gen5 drives help large transfers.',
  psu: 'Aim for 30–40% headroom above estimated peak draw. Efficiency and warranty matter as much as wattage.',
  case: 'The case must fit your motherboard, GPU, cooler, and PSU. Check clearance before falling in love with a design.',
  cooler: 'Air coolers need height clearance; liquid coolers need radiator mounts. Match the socket and CPU heat output.',
  fans: 'Check fan size and how many mounting positions your case has. More airflow helps, but noise matters too.',
};

const SORTS = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
  { id: 'name-asc', label: 'Name: A to Z' },
  { id: 'name-desc', label: 'Name: Z to A' },
];

const STOCK_OPTIONS = [
  { id: 'all', label: 'All availability' },
  { id: 'in-stock', label: 'In stock' },
  { id: 'low-stock', label: 'Low stock' },
  { id: 'preorder', label: 'Pre-order' },
];

function searchText(item) {
  const specs = Object.values(item.specs || {}).flat().filter((value) => value !== null && value !== undefined).join(' ');
  return `${item.name} ${item.brand} ${item.category} ${(item.tags || []).join(' ')} ${specs}`.toLowerCase();
}

export function render(root, context = {}) {
  const initialCategory = context.params?.get('cat');
  const state = {
    category: CATEGORIES.some((category) => category.id === initialCategory) ? initialCategory : 'cpu',
    search: '',
    sort: 'recommended',
    brand: 'all',
    stock: 'all',
  };

  root.innerHTML = `
    <div class="builder-page">
      <div class="builder-top">
        <div>
          <p class="eyebrow">Configurator</p>
          <h1 class="page-title">PC Builder</h1>
          <p class="page-subtitle">Assemble your parts. Compatibility, price, and power draw update instantly.</p>
        </div>
        <div class="builder-top-actions">
          <button class="btn btn--ghost" type="button" data-action="open-presets">${icon('sparkles', 16)}<span>Presets</span></button>
          <button class="btn btn--primary" type="button" data-action="save-build">${icon('save', 16)}<span>Save build</span></button>
        </div>
      </div>

      <div class="builder-layout">
        <aside class="builder-side">
          <div class="side-head">
            <span>Components</span>
            <span id="side-progress" class="side-progress"></span>
          </div>
          <nav class="category-nav" id="category-nav" aria-label="Hardware categories"></nav>
          <div class="side-tip">
            <span class="side-tip-icon">${icon('shield', 15)}</span>
            <p>Checks run automatically on every change. Yellow means verify, red means a real conflict.</p>
          </div>
        </aside>

        <section class="builder-content">
          <div class="catalog-tools">
            <label class="search-field">
              <span class="search-icon">${icon('search', 16)}</span>
              <input id="search-input" type="search" placeholder="Search processors, brands, specs…" autocomplete="off" aria-label="Search components">
            </label>
            <div class="tool-selects">
              <label class="mini-select">
                <span>Sort</span>
                <select id="sort-select" aria-label="Sort components">
                  ${SORTS.map((sort) => `<option value="${sort.id}">${escapeHtml(sort.label)}</option>`).join('')}
                </select>
              </label>
              <label class="mini-select">
                <span>Brand</span>
                <select id="brand-select" aria-label="Filter by brand"></select>
              </label>
              <label class="mini-select">
                <span>Stock</span>
                <select id="stock-select" aria-label="Filter by availability">
                  ${STOCK_OPTIONS.map((option) => `<option value="${option.id}">${escapeHtml(option.label)}</option>`).join('')}
                </select>
              </label>
            </div>
          </div>
          <div id="filter-line" class="filter-line"></div>
          <div id="catalog-head" class="catalog-head"></div>
          <div id="product-grid" class="product-grid"></div>
        </section>

        <aside class="build-panel" id="build-summary" aria-label="Build summary"></aside>
      </div>

      <div class="mobile-build-bar" id="mobile-build-bar"></div>
    </div>
  `;

  const page = root.querySelector('.builder-page');
  const sideProgress = page.querySelector('#side-progress');
  const categoryNav = page.querySelector('#category-nav');
  const searchInput = page.querySelector('#search-input');
  const sortSelect = page.querySelector('#sort-select');
  const brandSelect = page.querySelector('#brand-select');
  const stockSelect = page.querySelector('#stock-select');
  const filterLine = page.querySelector('#filter-line');
  const catalogHead = page.querySelector('#catalog-head');
  const grid = page.querySelector('#product-grid');
  const summary = page.querySelector('#build-summary');
  const mobileBar = page.querySelector('#mobile-build-bar');

  function category() {
    return categoryMeta(state.category);
  }

  function categoryBrands() {
    return [...new Set(itemsByCategory(state.category).map((item) => item.brand))].sort((a, b) => a.localeCompare(b));
  }

  function renderBrandOptions() {
    brandSelect.innerHTML = `<option value="all">All brands</option>${categoryBrands().map((brand) => `<option value="${escapeHtml(brand)}">${escapeHtml(brand)}</option>`).join('')}`;
    brandSelect.value = state.brand;
  }

  function visibleItems() {
    const query = state.search.trim().toLowerCase();
    let items = itemsByCategory(state.category);
    if (query) items = items.filter((item) => searchText(item).includes(query));
    if (state.brand !== 'all') items = items.filter((item) => item.brand === state.brand);
    if (state.stock !== 'all') items = items.filter((item) => item.availability === state.stock);
    if (state.sort === 'price-asc') items = [...items].sort((a, b) => a.price - b.price);
    else if (state.sort === 'price-desc') items = [...items].sort((a, b) => b.price - a.price);
    else if (state.sort === 'name-asc') items = [...items].sort((a, b) => a.name.localeCompare(b.name));
    else if (state.sort === 'name-desc') items = [...items].sort((a, b) => b.name.localeCompare(a.name));
    return items;
  }

  function renderSidebar() {
    const build = store.getCurrent();
    const progress = coreProgress(build);
    sideProgress.textContent = `${progress.selected}/${progress.total} core`;
    categoryNav.innerHTML = CATEGORIES.map((category) => {
      const count = getItems(build, category.id).length;
      const active = category.id === state.category;
      return `
        <button class="category-nav-item ${active ? 'is-active' : ''}" type="button"
          data-action="select-category" data-category="${category.id}" ${active ? 'aria-current="true"' : ''}>
          <span class="cat-icon">${icon(category.icon, 17)}</span>
          <span class="cat-label">${escapeHtml(category.label)}</span>
          ${count ? `<span class="cat-count">${count}</span>` : category.required ? '<span class="cat-required" title="Required component"></span>' : ''}
        </button>
      `;
    }).join('');
  }

  function renderFilterLine() {
    const active = [];
    if (state.search.trim()) active.push(`Search: “${escapeHtml(state.search.trim())}”`);
    if (state.brand !== 'all') active.push(`Brand: ${escapeHtml(state.brand)}`);
    if (state.stock !== 'all') active.push(`Availability: ${escapeHtml(STOCK_OPTIONS.find((option) => option.id === state.stock)?.label || state.stock)}`);
    if (!active.length) {
      filterLine.innerHTML = '';
      return;
    }
    filterLine.innerHTML = `
      <div class="filter-info">
        <span>${active.join(' · ')}</span>
        <button class="mini-action" type="button" data-action="clear-filters">${icon('close', 12)}<span>Clear filters</span></button>
      </div>
    `;
  }

  function renderCatalogHead() {
    const meta = category();
    const results = visibleItems().length;
    const selected = getItems(store.getCurrent(), state.category).length;
    catalogHead.innerHTML = `
      <div class="catalog-title-wrap">
        <span class="catalog-icon">${icon(meta.icon, 20)}</span>
        <div>
          <h2>${escapeHtml(meta.label)}</h2>
          <p>${escapeHtml(CATEGORY_HINTS[meta.id] || meta.blurb)}</p>
        </div>
      </div>
      <div class="catalog-meta">
        <span class="result-count">${results} result${results === 1 ? '' : 's'}</span>
        <span class="selected-count">${selected} selected</span>
      </div>
    `;
  }

  function renderGrid() {
    const items = visibleItems();
    if (!items.length) {
      grid.innerHTML = emptyState({
        iconName: 'search',
        title: 'No components match',
        text: 'Try a different search, brand, or availability filter.',
        action: `<button class="btn btn--ghost" type="button" data-action="clear-filters">${icon('refresh', 15)}<span>Clear filters</span></button>`,
      });
      return;
    }
    const build = store.getCurrent();
    const compareIds = compare.getIds();
    grid.innerHTML = items.map((item) => productCard(item, {
      selected: getIds(build, item.category).includes(item.id),
      compared: compareIds.includes(item.id),
    })).join('');
  }

  function issuePreview(result) {
    const issues = [...result.errors, ...result.warnings].slice(0, 2);
    if (!issues.length) return '';
    return `
      <div class="summary-issues">
        ${issues.map((issue) => `
          <div class="summary-issue summary-issue--${issue.level}">
            ${icon(issue.level === 'error' ? 'x' : 'alert', 14)}
            <span>${escapeHtml(issue.title)}</span>
          </div>
        `).join('')}
        <a class="summary-issues-link" href="#/compatibility">View full compatibility report ${icon('arrowRight', 13)}</a>
      </div>
    `;
  }

  function renderSummary() {
    const build = store.getCurrent();
    const result = evaluateBuild(build);
    const total = buildTotal(build);
    summary.innerHTML = `
      <div class="summary-glow"></div>
      <div class="summary-head">
        <div>
          <p class="eyebrow">Your build</p>
          <h2 class="summary-title" title="${escapeHtml(build.name)}">${escapeHtml(build.name)}</h2>
        </div>
        <div class="summary-head-actions">
          <button class="icon-btn" type="button" data-action="save-build" aria-label="Save build" title="Save build">${icon('save', 16)}</button>
          <button class="icon-btn" type="button" data-action="share-build" aria-label="Share build" title="Share build">${icon('share', 16)}</button>
        </div>
      </div>
      <div class="summary-status-row">
        ${statusBadge(result)}
        <span class="summary-issue-count">${result.errors.length} issue${result.errors.length === 1 ? '' : 's'} · ${result.warnings.length} warning${result.warnings.length === 1 ? '' : 's'}</span>
      </div>
      ${buildStatsHTML(result)}
      ${budgetHTML(build)}
      <div class="summary-list-head">
        <span>Selected components</span>
        <span>${selectedCount(build)}</span>
      </div>
      <div class="build-list">${buildRowsHTML(build)}</div>
      ${issuePreview(result)}
      ${totalsHTML(build)}
      <div class="summary-actions">
        <button class="btn btn--primary btn--sm" type="button" data-action="save-build">${icon('save', 14)}<span>Save</span></button>
        <button class="btn btn--ghost btn--sm" type="button" data-action="share-build">${icon('share', 14)}<span>Share</span></button>
        <button class="btn btn--ghost btn--sm" type="button" data-action="export-pdf">${icon('print', 14)}<span>PDF</span></button>
        <button class="btn btn--danger-ghost btn--sm" type="button" data-action="reset-build">${icon('reset', 14)}<span>Reset</span></button>
      </div>
      <div class="summary-foot">
        <a href="#/compatibility">${icon('shield', 13)} Full compatibility report</a>
        <a href="#/visualizer">${icon('cube', 13)} 3D preview</a>
      </div>
      <p class="summary-disclaimer">Prices are estimated sample values in Philippine pesos · Not live retailer quotes.</p>
    `;
  }

  function renderMobileBar() {
    const build = store.getCurrent();
    const total = buildTotal(build);
    const count = selectedCount(build);
    const result = evaluateBuild(build);
    mobileBar.innerHTML = `
      <div class="mobile-bar-inner">
        <div class="mobile-bar-total">
          <span>${count} part${count === 1 ? '' : 's'} · ${statusBadge(result)}</span>
          <strong>${peso(total)}</strong>
        </div>
        <button class="btn btn--primary btn--sm" type="button" data-action="scroll-summary">${icon('list', 14)}<span>View build</span></button>
      </div>
    `;
  }

  function renderAll() {
    renderSidebar();
    renderCatalogHead();
    renderGrid();
    renderSummary();
    renderMobileBar();
    renderFilterLine();
  }

  function setCategory(categoryId, options = {}) {
    if (!CATEGORIES.some((category) => category.id === categoryId)) return;
    state.category = categoryId;
    state.search = '';
    state.brand = 'all';
    state.stock = 'all';
    searchInput.value = '';
    searchInput.placeholder = `Search ${categoryMeta(categoryId).label.toLowerCase()}, brands, specs…`;
    renderBrandOptions();
    sortSelect.value = state.sort;
    stockSelect.value = state.stock;
    renderSidebar();
    renderCatalogHead();
    renderGrid();
    renderFilterLine();
    history.replaceState(null, '', `#/builder?cat=${categoryId}`);
    if (options.scroll) {
      page.querySelector('.catalog-tools')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function resetFilters() {
    state.search = '';
    state.brand = 'all';
    state.stock = 'all';
    searchInput.value = '';
    brandSelect.value = 'all';
    stockSelect.value = 'all';
    renderGrid();
    renderCatalogHead();
    renderFilterLine();
  }

  page.addEventListener('click', (event) => {
    const actionEl = event.target.closest('[data-action]');
    if (!actionEl) return;
    const action = actionEl.dataset.action;
    if (action === 'select-category') {
      setCategory(actionEl.dataset.category);
    } else if (action === 'focus-category') {
      setCategory(actionEl.dataset.category, { scroll: true });
    } else if (action === 'clear-filters') {
      resetFilters();
    } else if (action === 'scroll-summary') {
      summary.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  page.addEventListener('input', (event) => {
    if (event.target.id !== 'search-input') return;
    state.search = event.target.value;
    renderGrid();
    renderCatalogHead();
    renderFilterLine();
  });

  page.addEventListener('change', (event) => {
    const target = event.target;
    if (target.id === 'sort-select') {
      state.sort = target.value;
      renderGrid();
    } else if (target.id === 'brand-select') {
      state.brand = target.value;
      renderGrid();
      renderCatalogHead();
      renderFilterLine();
    } else if (target.id === 'stock-select') {
      state.stock = target.value;
      renderGrid();
      renderCatalogHead();
      renderFilterLine();
    } else if (target.matches('[data-budget-input]')) {
      const value = target.value === '' ? null : Number(target.value);
      if (value !== null && (!Number.isFinite(value) || value < 0)) return;
      store.setBudget(value);
    }
  });

  renderBrandOptions();
  searchInput.placeholder = `Search ${category().label.toLowerCase()}, brands, specs…`;
  renderAll();

  const unsubscribe = on('build', () => {
    renderSidebar();
    renderCatalogHead();
    renderGrid();
    renderSummary();
    renderMobileBar();
  });

  return () => unsubscribe();
}
