import { CATEGORIES } from '../data/hardware.js';
import { store, on } from '../core/store.js';
import { buildPowerDraw, buildTotal, getItems, selectedCount } from '../core/build.js';
import { evaluateBuild, getCompatibilitySummary } from '../core/compat.js';
import { getPriceSourceLabel } from '../core/prices.js';
import { escapeHtml, peso } from '../core/format.js';
import { icon } from '../ui/icons.js';
import { statusBadge } from '../ui/summary.js';
import { productArt } from '../ui/art.js';
import { pageHeader } from '../ui/common.js';
import { toast } from '../ui/toast.js';

const PANEL_CATEGORIES = ['case', 'motherboard', 'cpu', 'gpu', 'ram', 'cooler'];

function sidePanelHTML() {
  const build = store.getCurrent();
  const result = evaluateBuild(build);
  const total = buildTotal(build);
  const count = selectedCount(build);
  const draw = buildPowerDraw(build);
  const gpu = getItems(build, 'gpu')[0];
  const pcCase = getItems(build, 'case')[0];
  const gpuLength = Number(gpu?.specs.length);
  const maxLength = Number(pcCase?.specs.maxGpuLength);
  const hasDimensions = Number.isFinite(gpuLength) && Number.isFinite(maxLength);
  const gpuFits = hasDimensions ? gpuLength <= maxLength : null;
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
    ${hasDimensions ? `
      <div class="viz-dimension ${gpuFits ? 'is-ok' : 'is-error'}">
        ${icon(gpuFits ? 'check' : 'alert', 13)}
        <span>GPU ${gpuLength} mm · case limit ${maxLength} mm${gpuFits ? '' : ' — does not fit'}</span>
      </div>
    ` : ''}
    <div class="viz-legend">
      <span class="viz-legend-swatch"></span>
      <span>Wireframe outlines show parts you have not selected yet. Dimension markers use catalog measurements.</span>
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
              <button class="viz-tool" type="button" data-viz="explode" aria-pressed="false" title="Separate the case panels">
                ${icon('panel', 15)}<span>Explode</span>
              </button>
              <button class="viz-tool" type="button" data-viz="reset" title="Reset camera">
                ${icon('refresh', 15)}<span>Reset view</span>
              </button>
              <button class="viz-tool viz-tool--accent" type="button" data-viz="share-card" title="Create a shareable image">
                ${icon('share', 15)}<span>Share card</span>
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

      <div class="viz-share-overlay" id="viz-share-overlay" hidden>
        <div class="viz-share-modal" role="dialog" aria-modal="true" aria-labelledby="viz-share-title">
          <div class="viz-share-head">
            <div>
              <p class="eyebrow">Share preview</p>
              <h2 id="viz-share-title">Your build card is ready</h2>
            </div>
            <button class="icon-button" type="button" data-share-close aria-label="Close share preview">${icon('close', 16)}</button>
          </div>
          <img class="viz-share-image" id="viz-share-image" alt="Shareable preview of the current PC build" />
          <div class="viz-share-actions">
            <a class="btn btn--primary" id="viz-share-download" download="pc-build-studio.png">${icon('download', 15)}<span>Download image</span></a>
            <button class="btn btn--ghost" type="button" data-share-copy>${icon('copy', 15)}<span>Copy share link</span></button>
            <button class="btn btn--ghost" type="button" data-share-close>${icon('close', 15)}<span>Close</span></button>
          </div>
          <p class="viz-share-note">The image includes your current 3D view, build name, key parts, price, and compatibility status.</p>
        </div>
      </div>
    </div>
  `;

  const page = root.querySelector('.visualizer-page');
  const stage = page.querySelector('#viz-stage');
  const panel = page.querySelector('#viz-panel');
  const rotateButton = page.querySelector('[data-viz="rotate"]');
  const rgbButton = page.querySelector('[data-viz="rgb"]');
  const explodeButton = page.querySelector('[data-viz="explode"]');
  const shareOverlay = page.querySelector('#viz-share-overlay');
  const shareImage = page.querySelector('#viz-share-image');
  const shareDownload = page.querySelector('#viz-share-download');

  let sceneApi = null;
  let disposed = false;
  const controls = { autoRotate: true, rgb: true, exploded: false };

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

  function roundRectPath(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function loadImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = source;
    });
  }

  function fitText(ctx, text, maxWidth) {
    if (ctx.measureText(text).width <= maxWidth) return text;
    let output = text;
    while (output.length > 4 && ctx.measureText(`${output}…`).width > maxWidth) {
      output = output.slice(0, -1);
    }
    return `${output}…`;
  }

  async function buildShareImage(source) {
    const image = await loadImage(source);
    const build = store.getCurrent();
    const result = evaluateBuild(build);
    const total = buildTotal(build);
    const cpu = getItems(build, 'cpu')[0];
    const gpu = getItems(build, 'gpu')[0];
    const status = getCompatibilitySummary(result);
    const statusTone = result.status === 'incompatible' ? '#fb7185'
      : result.status === 'warning' ? '#fbbf24'
      : result.status === 'compatible' ? '#34d399'
      : '#7dd3fc';

    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');

    const background = ctx.createLinearGradient(0, 0, 1200, 630);
    background.addColorStop(0, '#070b13');
    background.addColorStop(0.55, '#0a1120');
    background.addColorStop(1, '#0d1024');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, 1200, 630);

    ctx.strokeStyle = 'rgba(109, 140, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 1200; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 630);
      ctx.stroke();
    }
    for (let y = 0; y < 630; y += 48) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1200, y);
      ctx.stroke();
    }

    const glow = ctx.createRadialGradient(870, 315, 40, 870, 315, 390);
    glow.addColorStop(0, 'rgba(109, 140, 255, 0.25)');
    glow.addColorStop(1, 'rgba(109, 140, 255, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(420, 0, 780, 630);

    const cardX = 592;
    const cardY = 44;
    const cardW = 552;
    const cardH = 542;
    ctx.save();
    roundRectPath(ctx, cardX, cardY, cardW, cardH, 28);
    ctx.clip();
    ctx.fillStyle = '#0b111c';
    ctx.fillRect(cardX, cardY, cardW, cardH);
    const scale = Math.max(cardW / image.width, cardH / image.height);
    const drawW = image.width * scale;
    const drawH = image.height * scale;
    ctx.drawImage(image, cardX + (cardW - drawW) / 2, cardY + (cardH - drawH) / 2, drawW, drawH);
    const imageShade = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
    imageShade.addColorStop(0, 'rgba(5, 8, 14, 0.08)');
    imageShade.addColorStop(1, 'rgba(5, 8, 14, 0.48)');
    ctx.fillStyle = imageShade;
    ctx.fillRect(cardX, cardY, cardW, cardH);
    ctx.restore();
    ctx.strokeStyle = 'rgba(148, 173, 255, 0.26)';
    ctx.lineWidth = 2;
    roundRectPath(ctx, cardX, cardY, cardW, cardH, 28);
    ctx.stroke();

    const left = 64;
    ctx.fillStyle = '#98aaff';
    ctx.font = '700 16px "Segoe UI", sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText('PC BUILD STUDIO', left, 92);
    ctx.letterSpacing = '0px';

    ctx.fillStyle = '#f3f6ff';
    ctx.font = '700 54px "Segoe UI", sans-serif';
    ctx.fillText(fitText(ctx, build.name || 'My PC build', 480), left, 166);

    const pillY = 198;
    ctx.font = '600 15px "Segoe UI", sans-serif';
    const pillText = status.label;
    const pillW = ctx.measureText(pillText).width + 42;
    ctx.fillStyle = `${statusTone}1f`;
    roundRectPath(ctx, left, pillY, pillW, 34, 17);
    ctx.fill();
    ctx.strokeStyle = `${statusTone}66`;
    ctx.stroke();
    ctx.fillStyle = statusTone;
    ctx.beginPath();
    ctx.arc(left + 17, pillY + 17, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(pillText, left + 29, pillY + 23);

    ctx.fillStyle = '#6f7f9c';
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.letterSpacing = '2px';
    ctx.fillText('CPU', left, 288);
    ctx.fillText('GRAPHICS', left, 354);
    ctx.letterSpacing = '0px';
    ctx.fillStyle = '#dbe4f8';
    ctx.font = '600 20px "Segoe UI", sans-serif';
    ctx.fillText(fitText(ctx, cpu?.name || 'Not selected', 468), left, 316);
    ctx.fillText(fitText(ctx, gpu?.name || 'Integrated graphics', 468), left, 382);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
    ctx.beginPath();
    ctx.moveTo(left, 424);
    ctx.lineTo(left + 470, 424);
    ctx.stroke();

    ctx.fillStyle = '#6f7f9c';
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillText('ESTIMATED TOTAL', left, 466);
    ctx.fillStyle = '#f3f6ff';
    ctx.font = '700 42px "Segoe UI", sans-serif';
    ctx.fillText(peso(total), left, 512);

    ctx.fillStyle = '#72809b';
    ctx.font = '500 13px "Segoe UI", sans-serif';
    ctx.fillText(`${result.selectedCount} components · ${getPriceSourceLabel()} prices · 1080p estimate context`, left, 548);

    ctx.fillStyle = '#6f7f9c';
    ctx.font = '500 12px "Segoe UI", sans-serif';
    ctx.fillText('gl3nnnn.github.io/PC-BUILDING-SIMULATOR', left, 600);

    ctx.fillStyle = 'rgba(109, 140, 255, 0.8)';
    ctx.fillRect(0, 626, 1200, 4);

    return canvas.toDataURL('image/png');
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
      updateControls();
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
    explodeButton.classList.toggle('is-active', controls.exploded);
    explodeButton.setAttribute('aria-pressed', String(controls.exploded));
    sceneApi?.setAutoRotate(controls.autoRotate);
    sceneApi?.setRGB(controls.rgb);
    sceneApi?.setExploded(controls.exploded);
  }

  page.addEventListener('click', async (event) => {
    if (event.target.closest('[data-share-close]') || event.target === shareOverlay) {
      shareOverlay.hidden = true;
      return;
    }
    if (event.target.closest('[data-share-copy]')) {
      try {
        await navigator.clipboard.writeText(location.href);
        toast('Share link copied', 'Your current build URL is on the clipboard.', 'success');
      } catch {
        toast('Could not copy the link', 'Copy it from the address bar instead.', 'warning');
      }
      return;
    }

    const button = event.target.closest('[data-viz]');
    if (!button) return;
    const action = button.dataset.viz;
    if (action === 'rotate') {
      controls.autoRotate = !controls.autoRotate;
      updateControls();
    } else if (action === 'rgb') {
      controls.rgb = !controls.rgb;
      updateControls();
    } else if (action === 'explode') {
      controls.exploded = !controls.exploded;
      updateControls();
    } else if (action === 'reset') {
      sceneApi?.resetView();
      controls.autoRotate = true;
      updateControls();
    } else if (action === 'share-card') {
      if (!sceneApi) {
        toast('3D preview unavailable', 'Share cards need the live scene. Enable hardware acceleration and try again.', 'warning');
        return;
      }
      button.disabled = true;
      try {
        const dataUrl = await buildShareImage(sceneApi.snapshot());
        shareImage.src = dataUrl;
        shareDownload.href = dataUrl;
        const slug = (store.getCurrent().name || 'pc-build').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'pc-build';
        shareDownload.download = `${slug}-pc-build-studio.png`;
        shareOverlay.hidden = false;
      } catch (error) {
        console.error(error);
        toast('Could not create the share image', 'Try again after the 3D scene has finished loading.', 'error');
      } finally {
        button.disabled = false;
      }
    }
  });

  page.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !shareOverlay.hidden) shareOverlay.hidden = true;
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
