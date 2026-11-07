import { CATEGORIES, HARDWARE, itemsByCategory, BRANDS } from '../data/hardware.js';
import { store, on } from '../core/store.js';
import { getIds } from '../core/build.js';
import { escapeHtml } from '../core/format.js';
import { icon } from '../ui/icons.js';
import { productCard, syncCompareButtons, syncProductButtons } from '../ui/product.js';
import { compare } from '../ui/compare.js';
import { emptyState } from '../ui/common.js';

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

function matchesQuery(item, query) {
  if (!query) return true;
  const specs = Object.values(item.specs || {}).flat().filter((value) => value !== null && value !== undefined).join(' ');
  return `${item.name} ${item.brand} ${item.category} ${(item.tags || []).join(' ')} ${specs}`.toLowerCase().includes(query);
}

export function render(root, context = {}) {
  const requested = context.params?.get('category');
  const state = {
    category: CATEGORIES.some((category) => category.id === requested) ? requested : 'all',
    search: '',
    sort: 'recommended',
    brand: 'all',
    stock: 'all',
  };

  root.innerHTML = `
    <div class="database-page">
      <header class="page-head">
        <div>
          <p class="eyebrow">Specs, prices & availability</p>
          <h1 class="page-title">Hardware Database</h1>
          <p class="page-subtitle">${HARDWARE.length} realistic sample components across nine categories. Prices are estimates in Philippine pesos.</p>
        </div>
        <div class="page-actions">
          <a class="btn btn--primary" href="#/builder">${icon('wrench', 16)}<span>Open builder</span></a>
        </div>
      </header>

      <div class="db-toolbar">
        <label class="search-field search-field--lg">
          <span class="search-icon">${icon('search', 17)}</span>
          <input id="db-search" type="search" placeholder="Search 100 components by name, brand, socket, chipset, specs…" autocomplete="off" aria-label="Search hardware database">
        </label>
        <div class="tool-selects">
          <label class="mini-select">
            <span>Sort</span>
            <select id="db-sort" aria-label="Sort hardware">
              ${SORTS.map((sort) => `<option value="${sort.id}">${escapeHtml(sort.label)}</option>`).join('')}
            </select>
          </label>
          <label class="mini-select">
            <span>Brand</span>
            <select id="db-brand" aria-label="Filter by brand">
              <option value="all">All brands</option>
              ${BRANDS.map((brand) => `<option value="${escapeHtml(brand)}">${escapeHtml(brand)}</option>`).join('')}
            </select>
          </label>
          <label class="mini-select">
            <span>Stock</span>
            <select id="db-stock" aria-label="Filter by availability">
              ${STOCK_OPTIONS.map((option) => `<option value="${option.id}">${escapeHtml(option.label)}</option>`).join('')}
            </select>
          </label>
        </div>
      </div>

      <div class="db-category-row" id="db-category-row"></div>
      <div class="db-results-head" id="db-results-head"></div>
      <div class="product-grid product-grid--db" id="db-grid"></div>
    </div>
  `;

  const searchInput = root.querySelector('#db-search');
  const sortSelect = root.querySelector('#db-sort');
  const brandSelect = root.querySelector('#db-brand');
  const stockSelect = root.querySelector('#db-stock');
  const categoryRow = root.querySelector('#db-category-row');
  const resultsHead = root.querySelector('#db-results-head');
  const grid = root.querySelector('#db-grid');
  const page = root.querySelector('.database-page');

  function filteredItems() {
    const query = state.search.trim().toLowerCase();
    let items = state.category === 'all' ? HARDWARE : itemsByCategory(state.category);
    if (query) items = items.filter((item) => matchesQuery(item, query));
    if (state.brand !== 'all') items = items.filter((item) => item.brand === state.brand);
    if (state.stock !== 'all') items = items.filter((item) => item.availability === state.stock);
    if (state.sort === 'price-asc') items = [...items].sort((a, b) => a.price - b.price);
    else if (state.sort === 'price-desc') items = [...items].sort((a, b) => b.price - a.price);
    else if (state.sort === 'name-asc') items = [...items].sort((a, b) => a.name.localeCompare(b.name));
    else if (state.sort === 'name-desc') items = [...items].sort((a, b) => b.name.localeCompare(a.name));
    return items;
  }

  function renderCategories() {
    const allCount = HARDWARE.length;
    const chips = [
      `<button class="db-cat-chip ${state.category === 'all' ? 'is-active' : ''}" type="button" data-db-category="all">${icon('grid', 14)}<span>All</span><em>${allCount}</em></button>`,
      ...CATEGORIES.map((category) => {
        const count = itemsByCategory(category.id).length;
        return `<button class="db-cat-chip ${state.category === category.id ? 'is-active' : ''}" type="button" data-db-category="${category.id}">${icon(category.icon, 14)}<span>${escapeHtml(category.label)}</span><em>${count}</em></button>`;
      }),
    ];
    categoryRow.innerHTML = chips.join('');
  }

  function renderGrid() {
    const items = filteredItems();
    if (!items.length) {
      grid.innerHTML = emptyState({
        iconName: 'search',
        title: 'No hardware found',
        text: 'Try removing a filter or searching for a different brand or specification.',
        action: `<button class="btn btn--ghost" type="button" data-db-clear>${icon('refresh', 15)}<span>Reset filters</span></button>`,
      });
    } else {
      const build = store.getCurrent();
      const compareIds = compare.getIds();
      grid.innerHTML = items.map((item) => productCard(item, {
        selected: getIds(build, item.category).includes(item.id),
        compared: compareIds.includes(item.id),
      })).join('');
    }
    const label = state.category === 'all'
      ? 'all categories'
      : CATEGORIES.find((category) => category.id === state.category)?.label.toLowerCase();
    resultsHead.innerHTML = `
      <span><strong>${items.length}</strong> product${items.length === 1 ? '' : 's'} in ${escapeHtml(label)}</span>
      <span class="db-results-hint">${icon('compare', 13)} Select up to 4 of the same type to compare</span>
    `;
  }

  function clearFilters() {
    state.search = '';
    state.brand = 'all';
    state.stock = 'all';
    searchInput.value = '';
    brandSelect.value = 'all';
    stockSelect.value = 'all';
    renderGrid();
  }

  page.addEventListener('click', (event) => {
    const chip = event.target.closest('[data-db-category]');
    if (chip) {
      state.category = chip.dataset.dbCategory;
      if (state.brand !== 'all' && !filteredItems().length) {
        state.brand = 'all';
        brandSelect.value = 'all';
      }
      renderCategories();
      renderGrid();
      history.replaceState(null, '', state.category === 'all' ? '#/database' : `#/database?category=${state.category}`);
      return;
    }
    if (event.target.closest('[data-db-clear]')) {
      clearFilters();
    }
  });

  searchInput.addEventListener('input', () => {
    state.search = searchInput.value;
    renderGrid();
  });
  sortSelect.addEventListener('change', () => {
    state.sort = sortSelect.value;
    renderGrid();
  });
  brandSelect.addEventListener('change', () => {
    state.brand = brandSelect.value;
    renderGrid();
  });
  stockSelect.addEventListener('change', () => {
    state.stock = stockSelect.value;
    renderGrid();
  });

  renderCategories();
  renderGrid();

  const unsubBuild = on('build', () => syncProductButtons(root, store.getCurrent()));
  const onCompare = (event) => syncCompareButtons(root, event.detail.ids);
  document.addEventListener('compare:changed', onCompare);

  return () => {
    unsubBuild();
    document.removeEventListener('compare:changed', onCompare);
  };
}
