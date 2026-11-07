import { CATEGORIES } from '../data/hardware.js';
import { store, on } from '../core/store.js';
import { buildPowerDraw, buildTotal, getItems, selectedCount } from '../core/build.js';
import { evaluateBuild } from '../core/compat.js';
import { escapeHtml, peso } from '../core/format.js';
import { icon } from '../ui/icons.js';
import { statusBadge } from '../ui/summary.js';
import { productArt } from '../ui/art.js';
import { pageHeader } from '../ui/common.js';

const PANEL_CATEGORIES = ['case', 'motherboard', 'cpu', 'gpu', 'ram', 'cooler'];

function sidePanelHTML() {
  const build = store.getCurrent();
  const result = evaluateBuild(build);
  const total = buildTotal(build);
  const count = selectedCount(build);
  const draw = buildPowerDraw(build);
  const rows = PANEL_CATEGORIES.map((categoryId) => {
    const category = CATEGORIES.find((entry) => entry.id === categoryId);
    const item = getItems(build, categoryId)[0];
    return `
      <div class="viz-part ${item ? '' : 'is-empty'}">
        <span class="viz-part-icon">${icon(category?.icon || 'dot', 15)}</span>
        <div class="viz-part-copy">
          <span>${escapeHtml(category?.label || categoryId)}</span>
          <strong>${item ? escapeHtml(item.name) : 'Not selected'}</strong>
        </div>
        ${item ? `<span class="viz-part-price">${peso(item.price)}</span>` : ''}
      </div>
    `;
  }).join('');

  return `
    <div class="viz-panel-head">
      <div>
        <p class="eyebrow">Now viewing</p>
        <h2>${escapeHtml(build.name)}</h2>
      </div>
      ${statusBadge(result)}
    </div>
    <div class="viz-metrics">
      <div><span>Estimated total</span><strong>${peso(total)}</strong></div>
      <div><span>Components</span><strong>${count}</strong></div>
      <div><span>Peak draw</span><strong>${draw} W</strong></div>
    </div>
    <div class="viz-parts">${rows}</div>
    <div class="viz-legend">
      <span class="viz-legend-swatch"></span>
      <span>Wireframe outlines show parts you have not selected yet.</span>
    </div>
    <div class="viz-panel-actions">
      <a class="btn btn--primary btn--sm" href="#/builder">${icon('wrench', 14)}<span>Edit build</span></a>
      <a class="btn btn--ghost btn--sm" href="#/compatibility">${icon('shield', 14)}<span>Compatibility</span></a>
      <a class="btn btn--ghost btn--sm" href="#/performance">${icon('chart', 14)}<span>Performance</span></a>
    </div>
    <p class="viz-note">Illustrative procedural scene — component sizes and placement are approximate, not engineering-accurate dimensions.</p>
  `;
}

export function render(root) {
  const build = store.getCurrent();
  const caseItem = getItems(build, 'case')[0];
  const count = selectedCount(build);

  root.innerHTML = `
    <div class="visualizer-page">
      ${pageHeader({
        eyebrow: 'Interactive preview',
        title: '3D Build Visualizer',
        text: 'Orbit a live, transparent rig built from the parts you selected. Drag to rotate, scroll to zoom.',
        actions: `
          <a class="btn btn--ghost" href="#/builder">${icon('wrench', 15)}<span>Back to builder</span></a>
          <button class="btn btn--primary" type="button" data-action="save-build">${icon('save', 15)}<span>Save build</span></button>
        `,
      })}

      <div class="visualizer-layout">
        <section class="viz-viewer" aria-label="Interactive 3D PC preview">
          <div class="viz-toolbar">
            <div class="viz-toolbar-title">
              <span class="live-dot"></span>
              <span>Live scene</span>
              <span class="viz-toolbar-count">${count} part${count === 1 ? '' : 's'}</span>
            </div>
            <div class="viz-toolbar-actions">
              <button class="viz-tool is-active" type="button" data-viz="rotate" aria-pressed="true" title="Toggle auto-rotate">
                ${icon('rotate', 15)}<span>Auto-rotate</span>
              </button>
              <button class="viz-tool is-active" type="button" data-viz="rgb" aria-pressed="true" title="Toggle RGB lighting">
                ${icon('sparkles', 15)}<span>RGB</span>
              </button>
              <button class="viz-tool" type="button" data-viz="reset" title="Reset camera">
                ${icon('refresh', 15)}<span>Reset view</span>
              </button>
            </div>
          </div>
          <div class="viz-stage" id="viz-stage">
            <div class="viz-loading" id="viz-loading">
              <span class="viz-spinner" aria-hidden="true"></span>
              <p>Assembling your 3D rig…</p>
            </div>
          </div>
          <div class="viz-overlay-hint">${icon('zoom', 14)}<span>Drag to orbit · Scroll to zoom</span></div>
          <div class="viz-corner-label">${icon('cube', 13)}<span>${caseItem ? escapeHtml(caseItem.name) : 'No case selected'}</span></div>
        </section>

        <aside class="viz-panel" id="viz-panel">${sidePanelHTML()}</aside>
      </div>
    </div>
  `;

  const page = root.querySelector('.visualizer-page');
  const stage = page.querySelector('#viz-stage');
  const panel = page.querySelector('#viz-panel');
  const rotateButton = page.querySelector('[data-viz="rotate"]');
  const rgbButton = page.querySelector('[data-viz="rgb"]');

  let sceneApi = null;
  let disposed = false;
  const controls = { autoRotate: true, rgb: true };

  function showFallback(message, detail = '') {
    const fallbackArt = getItems(store.getCurrent(), 'case')[0];
    stage.innerHTML = `
      <div class="viz-fallback">
        <div class="viz-fallback-art">${fallbackArt ? productArt(fallbackArt) : icon('cube', 64)}</div>
        <div class="viz-fallback-copy">
          <h3>${escapeHtml(message)}</h3>
          <p>${escapeHtml(detail || 'Your browser could not start WebGL. The 3D scene needs hardware acceleration, but the rest of the builder works normally.')}</p>
          <div class="viz-fallback-actions">
            <a class="btn btn--primary btn--sm" href="#/builder">${icon('wrench', 14)}<span>Continue building</span></a>
            <a class="btn btn--ghost btn--sm" href="#/performance">${icon('chart', 14)}<span>Estimate FPS</span></a>
          </div>
        </div>
      </div>
    `;
  }

  async function bootScene() {
    try {
      const { createPCScene } = await import('../three/scene.js');
      if (disposed) return;
      sceneApi = createPCScene(stage, {
        build: store.getCurrent(),
        autoRotate: controls.autoRotate,
        rgb: controls.rgb,
      });
      stage.querySelector('#viz-loading')?.remove();
      stage.classList.add('is-ready');
    } catch (error) {
      console.error(error);
      if (!disposed) showFallback('3D preview unavailable', error?.message || '');
    }
  }

  function updateControls() {
    rotateButton.classList.toggle('is-active', controls.autoRotate);
    rotateButton.setAttribute('aria-pressed', String(controls.autoRotate));
    rgbButton.classList.toggle('is-active', controls.rgb);
    rgbButton.setAttribute('aria-pressed', String(controls.rgb));
    sceneApi?.setAutoRotate(controls.autoRotate);
    sceneApi?.setRGB(controls.rgb);
  }

  page.addEventListener('click', (event) => {
    const button = event.target.closest('[data-viz]');
    if (!button) return;
    const action = button.dataset.viz;
    if (action === 'rotate') {
      controls.autoRotate = !controls.autoRotate;
      updateControls();
    } else if (action === 'rgb') {
      controls.rgb = !controls.rgb;
      updateControls();
    } else if (action === 'reset') {
      sceneApi?.resetView();
      controls.autoRotate = true;
      updateControls();
    }
  });

  const unsubscribe = on('build', () => {
    const current = store.getCurrent();
    if (panel.isConnected) panel.innerHTML = sidePanelHTML();
    sceneApi?.updateBuild(current);
  });

  bootScene();

  return () => {
    disposed = true;
    unsubscribe();
    sceneApi?.dispose();
    sceneApi = null;
  };
}
