import { CATEGORIES, HARDWARE } from '../data/hardware.js';
import { PRESETS } from '../data/presets.js';
import { store } from '../core/store.js';
import { escapeHtml, peso } from '../core/format.js';
import { closeModal, openModal } from './modal.js';
import { icon } from './icons.js';
import { presetTotal } from './preset.js';
import { toast } from './toast.js';

const ROUTES = [
  { label: 'Home', meta: 'Overview and presets', href: '#/home', icon: 'home', keywords: 'start dashboard' },
  { label: 'PC Builder', meta: 'Choose components', href: '#/builder', icon: 'wrench', keywords: 'build configure parts' },
  { label: 'Hardware Database', meta: 'Browse all products', href: '#/database', icon: 'database', keywords: 'catalog search products' },
  { label: '3D Visualizer', meta: 'Orbit your current build', href: '#/visualizer', icon: 'cube', keywords: 'three preview render' },
  { label: 'Performance Estimator', meta: 'FPS and bottleneck analysis', href: '#/performance', icon: 'chart', keywords: 'gaming fps bench' },
  { label: 'Compatibility Checker', meta: 'Review every compatibility rule', href: '#/compatibility', icon: 'shield', keywords: 'errors warnings fit' },
  { label: 'Saved Builds', meta: 'Load, export, or share builds', href: '#/saved', icon: 'bookmark', keywords: 'local storage import export' },
  { label: 'Showcase', meta: 'Curated build gallery', href: '#/showcase', icon: 'grid', keywords: 'gallery community favorite' },
  { label: 'About & Guides', meta: 'FAQ and buying guides', href: '#/about', icon: 'info', keywords: 'help documentation' },
];

const CATEGORY_ICONS = Object.fromEntries(CATEGORIES.map((category) => [category.id, category.icon]));

function allCommands() {
  return [
    ...ROUTES.map((route) => ({ ...route, group: 'Navigate' })),
    ...PRESETS.map((preset) => ({
      label: preset.name,
      meta: `${preset.niche} · ${peso(presetTotal(preset))} · Load preset`,
      icon: 'sparkles',
      group: 'Presets',
      action: 'preset',
      presetId: preset.id,
      keywords: `${preset.niche} ${preset.tagline} preset`,
    })),
    ...HARDWARE.map((item) => ({
      label: item.name,
      meta: `${item.brand} · ${item.category} · ${peso(item.price)}`,
      icon: CATEGORY_ICONS[item.category] || 'dot',
      group: 'Hardware',
      href: `#/database?q=${encodeURIComponent(item.name)}`,
      keywords: `${item.brand} ${item.category} ${item.tags?.join(' ') || ''}`,
    })),
  ];
}

const COMMANDS = allCommands();

function resultHTML(item, index, selected) {
  return `
    <button class="command-item ${selected ? 'is-selected' : ''}" type="button" data-command-index="${index}" role="option" aria-selected="${selected}">
      <span class="command-item-icon">${icon(item.icon, 16)}</span>
      <span class="command-item-copy">
        <strong>${escapeHtml(item.label)}</strong>
        <span>${escapeHtml(item.meta)}</span>
      </span>
      <span class="command-item-group">${escapeHtml(item.group)}</span>
    </button>
  `;
}

export function openCommandPalette() {
  let selected = 0;
  let results = [];
  const overlay = openModal({
    className: 'modal--command',
    size: 'md',
    body: `
      <div class="command-palette">
        <label class="command-search">
          <span>${icon('search', 17)}</span>
          <input id="command-input" type="search" placeholder="Search pages, presets, or hardware…" autocomplete="off" spellcheck="false" aria-label="Search commands">
          <kbd>Esc</kbd>
        </label>
        <div class="command-results" id="command-results" role="listbox" aria-label="Command results"></div>
        <div class="command-foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>Enter</kbd> open</span>
          <span><kbd>Ctrl</kbd> + <kbd>K</kbd> toggle</span>
        </div>
      </div>
    `,
  });
  const input = overlay.querySelector('#command-input');
  const host = overlay.querySelector('#command-results');

  function render() {
    const query = input.value.trim().toLowerCase();
    const words = query.split(/\s+/).filter(Boolean);
    const filtered = COMMANDS
      .filter((item) => {
        const haystack = `${item.label} ${item.meta} ${item.keywords || ''}`.toLowerCase();
        return words.every((word) => haystack.includes(word));
      })
      .slice(0, 40);
    results = filtered;
    selected = Math.min(selected, Math.max(0, results.length - 1));
    if (!results.length) {
      host.innerHTML = `<p class="command-empty">${icon('search', 18)} No results. Try a component name, page, or preset.</p>`;
      return;
    }
    host.innerHTML = results.map((item, index) => resultHTML(item, index, index === selected)).join('');
  }

  function execute(item) {
    if (!item) return;
    closeModal();
    setTimeout(() => {
      if (item.action === 'preset') {
        if (store.loadPreset(item.presetId)) {
          toast('Preset loaded', `${item.label} is ready in the builder.`, 'success');
          location.hash = '#/builder';
        }
      } else if (item.href) {
        location.hash = item.href;
      }
    }, 0);
  }

  input.addEventListener('input', () => {
    selected = 0;
    render();
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!results.length) return;
      selected = (selected + (event.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length;
      render();
      host.querySelector('.command-item.is-selected')?.scrollIntoView({ block: 'nearest' });
    } else if (event.key === 'Enter') {
      event.preventDefault();
      execute(results[selected]);
    }
  });

  host.addEventListener('mousemove', (event) => {
    const item = event.target.closest('[data-command-index]');
    if (!item) return;
    const index = Number(item.dataset.commandIndex);
    if (!Number.isFinite(index) || index === selected) return;
    selected = index;
    host.querySelectorAll('.command-item').forEach((entry, entryIndex) => {
      entry.classList.toggle('is-selected', entryIndex === selected);
      entry.setAttribute('aria-selected', String(entryIndex === selected));
    });
  });

  host.addEventListener('click', (event) => {
    const item = event.target.closest('[data-command-index]');
    if (!item) return;
    execute(results[Number(item.dataset.commandIndex)]);
  });

  render();
  setTimeout(() => input.focus(), 60);
}

export function openShortcutsDialog() {
  const shortcuts = [
    ['Ctrl / ⌘ + K', 'Open the command palette'],
    ['Ctrl / ⌘ + S', 'Save the current build'],
    ['G then H', 'Go to Home'],
    ['G then B', 'Go to Builder'],
    ['G then D', 'Go to Hardware Database'],
    ['G then V', 'Go to 3D Visualizer'],
    ['?', 'Show this shortcut list'],
    ['Esc', 'Close dialogs and menus'],
  ];
  openModal({
    title: 'Keyboard shortcuts',
    subtitle: 'Move around PC Build Studio without reaching for the mouse.',
    size: 'sm',
    body: `
      <div class="shortcut-list">
        ${shortcuts.map(([keys, description]) => `
          <div class="shortcut-row">
            <span class="shortcut-keys">${keys.split(' + ').map((key) => `<kbd>${escapeHtml(key)}</kbd>`).join('<span>+</span>')}</span>
            <span>${escapeHtml(description)}</span>
          </div>
        `).join('')}
      </div>
    `,
    footer: `<button class="btn btn--primary" type="button" data-modal-close>Got it</button>`,
  });
}
