import { PRESETS, PRESETS_BY_ID } from './data/presets.js';
import { getHardware } from './data/hardware.js';
import { store, on } from './core/store.js';
import { buildFromFile, buildTotal, decodeBuild, getIds, sanitizeBuild, selectedCount } from './core/build.js';
import { evaluateBuild } from './core/compat.js';
import { escapeHtml, peso } from './core/format.js';
import { copyText, exportBuildJSON, printBuildSummary, shareUrl } from './core/export.js';
import { icon } from './ui/icons.js';
import { compare } from './ui/compare.js';
import { closeModal, confirmDialog, openModal } from './ui/modal.js';
import { toast } from './ui/toast.js';
import { componentDetailsHTML, syncCompareButtons, syncProductButtons } from './ui/product.js';
import { buildRowsHTML, buildStatsHTML, statusBadge } from './ui/summary.js';
import { presetCard, presetDetailsHTML } from './ui/preset.js';
import { render as renderHome } from './pages/home.js';
import { render as renderBuilder } from './pages/builder.js';
import { render as renderDatabase } from './pages/database.js';
import { render as renderCompatibility } from './pages/compatibility.js';
import { render as renderPerformance } from './pages/performance.js';
import { render as renderVisualizer } from './pages/visualizer.js';
import { render as renderSaved } from './pages/saved.js';
import { render as renderAbout } from './pages/about.js';

const PAGES = {
  home: { title: 'PC Building Simulator', render: renderHome },
  builder: { title: 'PC Builder', render: renderBuilder },
  database: { title: 'Hardware Database', render: renderDatabase },
  compatibility: { title: 'Compatibility Checker', render: renderCompatibility },
  performance: { title: 'Performance Estimator', render: renderPerformance },
  visualizer: { title: '3D Visualizer', render: renderVisualizer },
  saved: { title: 'Saved Builds', render: renderSaved },
  about: { title: 'About', render: renderAbout },
};

const ROOT = document.querySelector('#app');
const HEADER = document.querySelector('.site-header');
const NAV = document.querySelector('#site-nav');
const NAV_TOGGLE = document.querySelector('[data-action="toggle-menu"]');

let currentCleanup = null;
let menuOpen = false;
let pendingSharedBuild = null;

function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, query = ''] = raw.split('?');
  const name = path.split('/').filter(Boolean)[0] || 'home';
  return { name, params: new URLSearchParams(query) };
}

function updateHeader() {
  const count = selectedCount(store.getCurrent());
  const total = buildTotal(store.getCurrent());
  const countEl = document.querySelector('#header-build-count');
  const totalEl = document.querySelector('#header-build-total');
  const pill = document.querySelector('#header-build-pill');
  if (countEl) countEl.textContent = `${count} part${count === 1 ? '' : 's'}`;
  if (totalEl) totalEl.textContent = peso(total);
  if (pill) pill.classList.toggle('is-empty', count === 0);
  const savedCount = document.querySelector('#nav-saved-count');
  if (savedCount) {
    const saved = store.getSaved().length;
    savedCount.textContent = String(saved);
    savedCount.hidden = saved === 0;
  }
}

function updateNav(name) {
  document.querySelectorAll('[data-nav]').forEach((link) => {
    const active = link.dataset.nav === name;
    link.classList.toggle('is-active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

function setMenu(open) {
  menuOpen = Boolean(open);
  HEADER?.classList.toggle('is-menu-open', menuOpen);
  NAV?.classList.toggle('is-open', menuOpen);
  if (NAV_TOGGLE) NAV_TOGGLE.setAttribute('aria-expanded', String(menuOpen));
  document.body.classList.toggle('has-nav-open', menuOpen);
}

function setDocumentTitle(name) {
  const page = PAGES[name];
  document.title = page ? `${page.title} · PC Build Studio` : 'PC Build Studio';
}

function errorMarkup(error) {
  return `
    <div class="route-error">
      <span class="route-error-icon">${icon('alert', 30)}</span>
      <h1>Something went wrong</h1>
      <p>${escapeHtml(error?.message || 'This page could not be rendered.')}</p>
      <div class="route-error-actions">
        <a class="btn btn--primary" href="#/home">${icon('home', 15)}<span>Back home</span></a>
        <button class="btn btn--ghost" type="button" data-action="reload-app">${icon('refresh', 15)}<span>Reload</span></button>
      </div>
    </div>
  `;
}

function renderRoute() {
  const parsed = parseHash();
  if (parsed.name === 'share') {
    handleShareRoute(parsed.params);
    return;
  }
  const routeName = PAGES[parsed.name] ? parsed.name : 'home';
  const page = PAGES[routeName];

  document.body.dataset.route = routeName;

  if (currentCleanup) {
    try {
      currentCleanup();
    } catch (error) {
      console.error(error);
    }
    currentCleanup = null;
  }

  closeModal();
  setMenu(false);
  ROOT.innerHTML = '';
  try {
    const cleanup = page.render(ROOT, { params: parsed.params, route: routeName });
    currentCleanup = typeof cleanup === 'function' ? cleanup : null;
  } catch (error) {
    console.error(error);
    ROOT.innerHTML = errorMarkup(error);
  }

  updateHeader();
  updateNav(routeName);
  setDocumentTitle(routeName);
  window.scrollTo(0, 0);
}

function handleShareRoute(params) {
  const encoded = params.get('d');
  history.replaceState(null, '', '#/home');
  renderRoute();
  if (!encoded) {
    toast('This share link does not contain any build data.', 'error');
    return;
  }
  try {
    const build = decodeBuild(encoded);
    openSharedModal(build);
  } catch (error) {
    toast(error?.message || 'This shared build could not be opened.', 'error');
  }
}

function goBuilder() {
  if (parseHash().name !== 'builder') location.hash = '#/builder';
}

function notifyComponentResult(result) {
  if (!result || !result.item) return;
  if (result.action === 'added') {
    toast(`${result.item.name} added to your build.`, 'success', { duration: 2200 });
  } else if (result.action === 'remove' || result.action === 'removed') {
    toast(`${result.item.name} removed.`, 'info', { duration: 2000 });
  } else if (result.action === 'replaced') {
    const previous = result.previous?.name ? `${result.previous.name} replaced with ` : 'Component replaced with ';
    toast(`${previous}${result.item.name}.`, 'success', { duration: 2600 });
  } else if (result.action === 'limit') {
    toast('You can add up to 12 items in this category.', 'warn');
  }
}

function openDetails(id) {
  const item = getHardware(id);
  if (!item) return;
  const selected = getIds(store.getCurrent(), item.category).includes(id);
  const overlay = openModal({
    title: item.name,
    size: 'lg',
    className: 'modal--detail',
    body: componentDetailsHTML(item, { selected }),
  });
  overlay.querySelector('.detail-art')?.setAttribute('aria-hidden', 'true');
}

function openPresetsDialog() {
  openModal({
    title: 'Build presets',
    eyebrow: 'Curated starting points',
    subtitle: 'Every preset is checked for compatibility. Load one, then swap any component you like.',
    size: 'xl',
    body: `<div class="preset-grid preset-grid--modal">${PRESETS.map((preset) => presetCard(preset, { actionLabel: 'Load' })).join('')}</div>`,
    footer: `<button class="btn btn--ghost" type="button" data-modal-close>Close</button>`,
  });
}

function openPresetDetails(id) {
  const preset = PRESETS_BY_ID[id];
  if (!preset) return;
  openModal({
    title: preset.name,
    eyebrow: 'Preset preview',
    size: 'lg',
    body: presetDetailsHTML(preset),
  });
}

async function loadPresetById(id) {
  const preset = PRESETS_BY_ID[id];
  if (!preset) return;
  if (selectedCount(store.getCurrent()) > 0) {
    const confirmed = await confirmDialog({
      title: `Load “${preset.name}”?`,
      message: 'This replaces every component in your current build. Your budget setting is kept.',
      confirmLabel: 'Load preset',
    });
    if (!confirmed) return;
  }
  store.loadPreset(id);
  closeModal();
  toast(`${preset.name} loaded. Customise any part from the builder.`, 'success');
  goBuilder();
}

function openSaveDialog() {
  const build = store.getCurrent();
  if (selectedCount(build) === 0) {
    toast('Add at least one component before saving.', 'warn');
    return;
  }
  const existing = build.sourceId ? store.getSavedById(build.sourceId) : null;
  const count = selectedCount(build);
  const total = buildTotal(build);
  const overlay = openModal({
    title: existing ? 'Save build changes' : 'Save this build',
    eyebrow: existing ? 'Editing a saved build' : 'Local to this browser',
    size: 'sm',
    body: `
      <form id="save-build-form" class="stack-form">
        <label class="field-label" for="save-build-name">Build name</label>
        <input class="text-input" id="save-build-name" name="name" maxlength="60" value="${escapeHtml(build.name)}" autofocus autocomplete="off">
        <div class="form-summary">
          <span>${icon('cpu', 14)} ${count} component${count === 1 ? '' : 's'}</span>
          <span>${icon('money', 14)} ${peso(total)}</span>
        </div>
        <p class="form-hint">${icon('lock', 13)} Saved with localStorage on this device. Export a JSON or PDF copy for long-term keeping.</p>
      </form>
    `,
    footer: `
      <button class="btn btn--ghost" type="button" data-modal-close>Cancel</button>
      ${existing ? `<button class="btn btn--ghost" type="button" data-save-copy>Save as copy</button>` : ''}
      <button class="btn btn--primary" type="submit" form="save-build-form">${icon('save', 15)}<span>${existing ? 'Save changes' : 'Save build'}</span></button>
    `,
  });

  const form = overlay.querySelector('#save-build-form');
  const commit = (asCopy) => {
    const name = overlay.querySelector('#save-build-name')?.value || '';
    if (!name.trim()) {
      toast('Give your build a name before saving.', 'warn');
      overlay.querySelector('#save-build-name')?.focus();
      return;
    }
    try {
      const result = store.saveSnapshot(name, {
        updateId: !asCopy && existing ? existing.id : null,
      });
      closeModal();
      toast(result.action === 'updated' ? 'Saved build updated.' : 'Build saved.', 'success');
    } catch (error) {
      toast(error?.message || 'This build could not be saved.', 'error');
    }
  };
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    commit(false);
  });
  overlay.querySelector('[data-save-copy]')?.addEventListener('click', () => commit(true));
}

function openRenameSaved(id) {
  const entry = store.getSavedById(id);
  if (!entry) return;
  const overlay = openModal({
    title: 'Rename saved build',
    eyebrow: 'Saved build',
    size: 'sm',
    body: `
      <form id="rename-saved-form" class="stack-form">
        <label class="field-label" for="rename-saved-input">Build name</label>
        <input class="text-input" id="rename-saved-input" maxlength="60" value="${escapeHtml(entry.name)}" autofocus autocomplete="off">
        <p class="form-hint">${icon('info', 13)} Only the saved copy is renamed. Your current build is unaffected unless it is the same entry.</p>
      </form>
    `,
    footer: `
      <button class="btn btn--ghost" type="button" data-modal-close>Cancel</button>
      <button class="btn btn--primary" type="submit" form="rename-saved-form">${icon('edit', 15)}<span>Rename</span></button>
    `,
  });
  overlay.querySelector('#rename-saved-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = overlay.querySelector('#rename-saved-input')?.value || '';
    if (!value.trim()) {
      toast('The build name cannot be empty.', 'warn');
      return;
    }
    store.updateSaved(id, { name: value });
    closeModal();
    toast('Saved build renamed.', 'success');
  });
}

function openShareDialog(build) {
  if (selectedCount(build) === 0) {
    toast('Add components before sharing a build.', 'warn');
    return;
  }
  const url = shareUrl(build);
  const count = selectedCount(build);
  const total = buildTotal(build);
  const overlay = openModal({
    title: 'Share this build',
    eyebrow: 'Encoded link',
    subtitle: 'The build is compressed into the link itself. No account or server is involved.',
    size: 'md',
    body: `
      <div class="share-dialog">
        <p class="share-copy">Anyone with this link can preview and load the configuration. It contains component IDs, the build name, and the optional budget — no personal data.</p>
        <div class="share-field">
          <input id="share-link" class="text-input" readonly value="${escapeHtml(url)}" aria-label="Shareable build link">
          <button class="btn btn--primary btn--sm" type="button" data-action="copy-share">${icon('copy', 15)}<span>Copy</span></button>
        </div>
        <div class="share-meta">
          <span>${icon('cpu', 14)} ${count} part${count === 1 ? '' : 's'}</span>
          <span>${icon('money', 14)} ${peso(total)}</span>
          <span>${icon('lock', 14)} No server</span>
        </div>
        <p class="detail-note">${icon('info', 13)} Links are permanent only while this site is hosted at the same address. Very large builds create long URLs.</p>
      </div>
    `,
    footer: `<button class="btn btn--ghost" type="button" data-modal-close>Done</button>`,
  });
  const input = overlay.querySelector('#share-link');
  input?.addEventListener('focus', () => input.select());
  setTimeout(() => input?.select(), 120);
}

function openSharedModal(build) {
  pendingSharedBuild = build;
  const result = evaluateBuild(build);
  const total = buildTotal(build);
  const count = selectedCount(build);
  openModal({
    title: `Shared build: ${build.name}`,
    eyebrow: 'Import preview',
    subtitle: 'Review this encoded configuration before loading it into your builder.',
    size: 'lg',
    body: `
      <div class="shared-preview">
        <div class="shared-preview-head">
          ${statusBadge(result)}
          <span class="shared-preview-total">${peso(total)}</span>
        </div>
        ${buildStatsHTML(result)}
        <div class="build-list">${buildRowsHTML(build, { interactive: false })}</div>
        <p class="detail-note">${icon('alert', 13)} Loading this build replaces your current components. Budget information is included only if the sender set one.</p>
      </div>
    `,
    footer: `
      <button class="btn btn--ghost" type="button" data-modal-close>Discard</button>
      <button class="btn btn--primary" type="button" data-action="import-shared">${icon('download', 15)}<span>Load ${count} part${count === 1 ? '' : 's'}</span></button>
    `,
    onClose: () => {
      pendingSharedBuild = null;
    },
  });
}

function importJSONFile() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.hidden = true;
  document.body.appendChild(input);
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) {
      input.remove();
      return;
    }
    try {
      const text = await file.text();
      const imported = buildFromFile(text);
      if (selectedCount(store.getCurrent()) > 0) {
        const confirmed = await confirmDialog({
          title: 'Import this build?',
          message: 'Importing replaces every component in your current build.',
          confirmLabel: 'Import build',
        });
        if (!confirmed) return;
      }
      store.replaceBuild(imported, { reason: 'import', name: imported.name });
      toast('Build imported from JSON.', 'success');
      goBuilder();
    } catch (error) {
      toast(error?.message || 'That file could not be imported.', 'error');
    } finally {
      input.remove();
    }
  });
  input.click();
}

async function exportSavedToPDF(id) {
  const entry = store.getSavedById(id);
  if (!entry) return;
  printBuildSummary(sanitizeBuild(entry, entry.name));
}

const actionHandlers = {
  'toggle-menu'() {
    setMenu(!menuOpen);
  },
  'reload-app'() {
    location.reload();
  },
  'open-presets'() {
    openPresetsDialog();
  },
  'preset-details'(button) {
    openPresetDetails(button.dataset.id);
  },
  'load-preset'(button) {
    loadPresetById(button.dataset.id);
  },
  'save-build'() {
    openSaveDialog();
  },
  'share-build'() {
    openShareDialog(store.getCurrent());
  },
  'copy-share'() {
    const input = document.querySelector('#share-link');
    if (!input) return;
    copyText(input.value).then((success) => {
      if (success) toast('Share link copied to clipboard.', 'success');
      else {
        input.focus();
        input.select();
        toast('Copy the selected link manually.', 'info');
      }
    });
  },
  'import-shared'() {
    if (!pendingSharedBuild) return;
    const build = pendingSharedBuild;
    store.replaceBuild(build, { reason: 'shared', name: build.name });
    pendingSharedBuild = null;
    closeModal();
    toast('Shared build loaded into the builder.', 'success');
    goBuilder();
  },
  'export-pdf'() {
    if (selectedCount(store.getCurrent()) === 0) {
      toast('Add components before exporting a PDF summary.', 'warn');
      return;
    }
    printBuildSummary(store.getCurrent());
  },
  'reset-build'() {
    confirmDialog({
      title: 'Reset your build?',
      message: 'This removes every selected component and clears the build name. Saved builds are not affected.',
      confirmLabel: 'Reset build',
      danger: true,
    }).then((confirmed) => {
      if (!confirmed) return;
      store.clearBuild();
      toast('Build reset. Start fresh whenever you are ready.', 'info');
    });
  },
  'add-component'(button) {
    const result = store.addComponent(button.dataset.category, button.dataset.id);
    notifyComponentResult(result);
    syncProductButtons(document, store.getCurrent());
  },
  'remove-component'(button) {
    const item = getHardware(button.dataset.id);
    const removed = store.removeComponent(button.dataset.category, button.dataset.id);
    if (removed && item) toast(`${item.name} removed.`, 'info', { duration: 2000 });
    syncProductButtons(document, store.getCurrent());
  },
  details(button) {
    openDetails(button.dataset.id);
  },
  'toggle-compare'(button) {
    compare.toggle(button.dataset.id);
  },
  'import-json'() {
    importJSONFile();
  },
  'load-saved'(button) {
    const entry = store.getSavedById(button.dataset.id);
    if (!entry) return;
    if (store.loadSavedBuild(button.dataset.id)) {
      toast(`${entry.name} loaded into the builder.`, 'success');
      goBuilder();
    }
  },
  'rename-saved'(button) {
    openRenameSaved(button.dataset.id);
  },
  'delete-saved'(button) {
    const entry = store.getSavedById(button.dataset.id);
    if (!entry) return;
    confirmDialog({
      title: `Delete “${entry.name}”?`,
      message: 'This permanently removes the saved build from this browser. Your current build is not changed.',
      confirmLabel: 'Delete build',
      danger: true,
    }).then((confirmed) => {
      if (!confirmed) return;
      store.deleteSaved(button.dataset.id);
      toast('Saved build deleted.', 'info');
    });
  },
  'duplicate-saved'(button) {
    const copy = store.duplicateSaved(button.dataset.id);
    if (copy) toast(`Created “${copy.name}”.`, 'success');
  },
  'share-saved'(button) {
    const entry = store.getSavedById(button.dataset.id);
    if (!entry) return;
    openShareDialog(sanitizeBuild(entry, entry.name));
  },
  'pdf-saved'(button) {
    exportSavedToPDF(button.dataset.id);
  },
  'export-saved'(button) {
    const entry = store.getSavedById(button.dataset.id);
    if (!entry) return;
    exportBuildJSON(sanitizeBuild(entry, entry.name));
    toast('Build exported as JSON.', 'success');
  },
  'clear-saved'() {
    confirmDialog({
      title: 'Clear all saved builds?',
      message: 'Every saved build in this browser will be permanently deleted. This cannot be undone.',
      confirmLabel: 'Delete all builds',
      danger: true,
    }).then((confirmed) => {
      if (!confirmed) return;
      store.clearSaved();
      toast('All saved builds cleared.', 'info');
    });
  },
};

document.addEventListener('click', (event) => {
  const actionEl = event.target.closest('[data-action]');
  if (!actionEl) {
    if (menuOpen && !event.target.closest('.site-header')) setMenu(false);
    return;
  }
  const handler = actionHandlers[actionEl.dataset.action];
  if (!handler) return;
  if (actionEl.disabled || actionEl.getAttribute('aria-disabled') === 'true') return;
  handler(actionEl, event);
});

document.addEventListener('click', (event) => {
  if (!event.target.closest('.site-header')) setMenu(false);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuOpen) setMenu(false);
});

document.addEventListener('compare:changed', (event) => {
  syncCompareButtons(document, event.detail?.ids || []);
});

window.addEventListener('hashchange', renderRoute);

on('build', updateHeader);
on('saved', updateHeader);

if (!location.hash || location.hash === '#') {
  history.replaceState(null, '', '#/home');
}

const yearEl = document.querySelector('#footer-year');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

compare.init();
renderRoute();
