import { getHardware, itemsByCategory } from '../data/hardware.js';
import { store } from '../core/store.js';
import { getItems } from '../core/build.js';
import { estimatePerformance, performanceVerdict, RESOLUTIONS, QUALITY } from '../core/perf.js';
import { analyzeBuild } from '../core/intelligence.js';
import { escapeHtml, peso } from '../core/format.js';
import { icon } from '../ui/icons.js';
import { emptyState } from '../ui/common.js';
import { intelligenceCardsHTML } from '../ui/summary.js';
import { toast } from '../ui/toast.js';

function cpuOptions(selected) {
  const groups = ['Intel', 'AMD'];
  return groups.map((brand) => {
    const items = itemsByCategory('cpu').filter((item) => item.brand === brand).sort((a, b) => b.score - a.score);
    return `<optgroup label="${brand}">${items.map((item) => `<option value="${item.id}" ${item.id === selected ? 'selected' : ''}>${escapeHtml(item.name)} · ${item.score} pts</option>`).join('')}</optgroup>`;
  }).join('');
}

function gpuOptions(selected, integratedAvailable) {
  const groups = ['NVIDIA', 'AMD'];
  const integrated = `<option value="integrated" ${selected === 'integrated' ? 'selected' : ''} ${integratedAvailable ? '' : 'disabled'}>Integrated graphics${integratedAvailable ? '' : ' (CPU has none)'}</option>`;
  return integrated + groups.map((brand) => {
    const items = itemsByCategory('gpu').filter((item) => item.brand === brand).sort((a, b) => b.score - a.score);
    return `<optgroup label="${brand}">${items.map((item) => `<option value="${item.id}" ${item.id === selected ? 'selected' : ''}>${escapeHtml(item.name)} · ${item.score} pts</option>`).join('')}</optgroup>`;
  }).join('');
}

function fpsBarWidth(fps) {
  return `${Math.max(2, Math.min(100, (fps / 240) * 100))}%`;
}

function upgradeCard(entry, kind) {
  return `
    <article class="upgrade-card">
      <div class="upgrade-head">
        <span class="badge badge--neutral">${escapeHtml(kind)}</span>
        <strong>${escapeHtml(entry.item.name)}</strong>
      </div>
      <p>${escapeHtml(entry.reason || '')}</p>
      <div class="upgrade-meta">
        <span>${entry.deltaFps > 0 ? `+${entry.deltaFps} avg FPS` : 'Capacity / platform upgrade'}</span>
        <span>${peso(entry.price)}</span>
      </div>
      <a class="mini-action" href="#/builder?cat=${escapeHtml(entry.item.category)}">${icon('plus', 12)}<span>Add from builder</span></a>
    </article>
  `;
}

function currentBuildIntelligence(state) {
  const build = store.getCurrent();
  const intel = analyzeBuild(build, { resolution: state.resolution, quality: state.quality });
  if (!intel.averageFps && !intel.psuWattage) return '';
  const upgrades = [
    ...intel.upgrades.cpu.slice(0, 2).map((entry) => ({ entry, kind: 'CPU' })),
    ...intel.upgrades.gpu.slice(0, 2).map((entry) => ({ entry, kind: 'GPU' })),
    ...intel.upgrades.ram.slice(0, 1).map((entry) => ({ entry, kind: 'Memory' })),
    ...intel.upgrades.storage.slice(0, 1).map((entry) => ({ entry, kind: 'Storage' })),
  ].slice(0, 4);
  return `
    <section class="perf-intel">
      <div class="games-head">
        <h2>Build intelligence</h2>
        <span>${icon('wrench', 13)} Your current builder · ${escapeHtml(intel.performance.resolution.label)} ${escapeHtml(intel.performance.quality.label.toLowerCase())}</span>
      </div>
      <p class="perf-intel-note">This analysis uses the parts currently in your builder, not the demo selectors above.</p>
      ${intelligenceCardsHTML(intel)}
      <div class="upgrade-head-row">
        <h2>Upgrade path</h2>
        <span>${icon('chart', 13)} Ranked by estimated FPS gain per peso</span>
      </div>
      ${upgrades.length
        ? `<div class="upgrade-grid">${upgrades.map(({ entry, kind }) => upgradeCard(entry, kind)).join('')}</div>`
        : `<p class="upgrade-empty">${icon('check', 14)} No obvious upgrade is needed within the current case and PSU constraints.</p>`}
      ${intel.bottleneck ? `<p class="perf-footnote">${icon('info', 13)} ${escapeHtml(intel.bottleneck.detail)}</p>` : ''}
    </section>
  `;
}

function gameCard(game) {
  return `
    <article class="game-card" style="--game-accent:${game.accent}">
      <div class="game-head">
        <div>
          <span class="game-genre">${escapeHtml(game.genre)}</span>
          <h3>${escapeHtml(game.name)}</h3>
        </div>
        <span class="fps-tier fps-tier--${game.tier.tone}">${escapeHtml(game.tier.label)}</span>
      </div>
      <div class="fps-row">
        <strong>${game.fps}</strong>
        <span class="fps-unit">FPS<span>estimated</span></span>
        <span class="fps-range">${game.low}–${game.high}</span>
      </div>
      <div class="fps-track"><span style="width:${fpsBarWidth(game.fps)}"></span></div>
      <div class="game-foot">
        <span class="game-bottleneck">${game.bottleneck === 'Balanced' ? 'Balanced load' : `${game.bottleneck}-limited`}</span>
        ${game.capped ? '<span class="game-cap">Game caps at 60 FPS</span>' : ''}
      </div>
    </article>
  `;
}

export function render(root) {
  const build = store.getCurrent();
  const buildCpu = getItems(build, 'cpu')[0] || null;
  const buildGpu = getItems(build, 'gpu')[0] || null;
  const state = {
    cpuId: buildCpu?.id || 'cpu-r5-7600',
    gpuId: buildGpu?.id || (buildCpu ? (Number(buildCpu.specs.igpuScore) > 0 ? 'integrated' : '') : 'gpu-rx-7800xt'),
    resolution: '1080p',
    quality: 'ultra',
  };

  root.innerHTML = `
    <div class="performance-page">
      <header class="page-head">
        <div>
          <p class="eyebrow">Estimated gaming performance</p>
          <h1 class="page-title">Performance Estimator</h1>
          <p class="page-subtitle">Compare CPU and GPU combinations across resolutions and quality settings. Values are estimates, not benchmark guarantees.</p>
        </div>
        <div class="page-actions">
          <button class="btn btn--ghost" type="button" data-perf-action="use-build">${icon('wrench', 15)}<span>Use my build</span></button>
          <a class="btn btn--primary" href="#/compatibility">${icon('shield', 15)}<span>Check compatibility</span></a>
        </div>
      </header>

      <div class="perf-layout">
        <aside class="perf-controls">
          <div class="perf-panel">
            <div class="perf-panel-head">
              <h2>${icon('cpu', 17)} Hardware</h2>
              <span class="badge badge--neutral">Sample scores</span>
            </div>
            <label class="field-label" for="perf-cpu">Processor</label>
            <div class="select-wrap">
              <select id="perf-cpu" class="select-lg">${cpuOptions(state.cpuId)}</select>
              ${icon('chevronDown', 15)}
            </div>
            <label class="field-label" for="perf-gpu">Graphics card</label>
            <div class="select-wrap">
              <select id="perf-gpu" class="select-lg">${gpuOptions(state.gpuId, Number(getHardware(state.cpuId)?.specs.igpuScore) > 0)}</select>
              ${icon('chevronDown', 15)}
            </div>
            <div class="perf-source" id="perf-source"></div>
          </div>

          <div class="perf-panel">
            <div class="perf-panel-head"><h2>${icon('monitor', 17)} Resolution</h2></div>
            <div class="segmented segmented--three" data-perf-group="resolution">
              ${RESOLUTIONS.map((res) => `
                <button type="button" class="segment ${res.id === state.resolution ? 'is-active' : ''}" data-resolution="${res.id}">
                  <strong>${res.label}</strong><span>${res.sublabel}</span>
                </button>
              `).join('')}
            </div>
            <div class="perf-panel-head perf-panel-head--spaced"><h2>${icon('palette', 17)} Quality</h2></div>
            <div class="segmented segmented--four" data-perf-group="quality">
              ${QUALITY.map((quality) => `
                <button type="button" class="segment ${quality.id === state.quality ? 'is-active' : ''}" data-quality="${quality.id}">
                  <strong>${quality.label}</strong>
                </button>
              `).join('')}
            </div>
          </div>

          <details class="perf-explainer">
            <summary>${icon('info', 15)} How these estimates work ${icon('chevronDown', 14)}</summary>
            <p>Each CPU and GPU has a relative performance score. Estimated FPS combines those scores with a per-game demand profile, resolution scaling, and quality scaling. A CPU cap models draw-call limits in esports and simulation titles.</p>
            <p>The result is a planning aid only. Drivers, patches, ray tracing, upscaling, background apps, and exact game scenes can change real performance significantly.</p>
          </details>

          <div class="perf-disclaimer">
            ${icon('alert', 15)}
            <p><strong>Estimates, not guaranteed benchmarks.</strong> Actual FPS varies by game version, settings, drivers, cooling, and system configuration.</p>
          </div>
        </aside>

        <section class="perf-results" id="perf-results"></section>
      </div>
    </div>
  `;

  const cpuSelect = root.querySelector('#perf-cpu');
  const gpuSelect = root.querySelector('#perf-gpu');
  const results = root.querySelector('#perf-results');
  const source = root.querySelector('#perf-source');
  const page = root.querySelector('.performance-page');

  function integratedAvailable() {
    return Number(getHardware(state.cpuId)?.specs.igpuScore) > 0;
  }

  function resultModel() {
    const cpu = getHardware(state.cpuId);
    const gpu = state.gpuId === 'integrated' ? null : getHardware(state.gpuId);
    return estimatePerformance({
      cpu,
      gpu,
      resolution: state.resolution,
      quality: state.quality,
    });
  }

  function renderSource() {
    const fromBuildCpu = buildCpu && buildCpu.id === state.cpuId;
    const fromBuildGpu = state.gpuId === 'integrated'
      ? !buildGpu
      : buildGpu && buildGpu.id === state.gpuId;
    if (fromBuildCpu || fromBuildGpu) {
      source.innerHTML = `${icon('check', 13)} <span>Using hardware from your build where available.</span>`;
    } else {
      source.innerHTML = `${icon('info', 13)} <span>Demo selection — choose your own parts or use your build.</span>`;
    }
  }

  function renderResults() {
    const result = resultModel();
    renderSource();
    if (!result.ready) {
      results.innerHTML = emptyState({
        iconName: 'gamepad',
        title: 'Select hardware to estimate',
        text: result.reason,
        action: `<button class="btn btn--ghost" type="button" data-perf-action="use-build">${icon('wrench', 15)}<span>Use my build</span></button>`,
      });
      return;
    }
    const verdict = performanceVerdict(result);
    const cpu = result.cpu;
    const gpu = result.gpu;
    results.innerHTML = `
      <div class="perf-summary">
        <div class="perf-summary-glow"></div>
        <div class="perf-summary-main">
          <div>
            <p class="eyebrow">${result.resolution.label} · ${result.quality.label} settings</p>
            <h2>${escapeHtml(verdict.title)}</h2>
            <p>${escapeHtml(verdict.detail)}</p>
          </div>
          <div class="perf-average">
            <strong>${result.average}</strong>
            <span>average FPS</span>
          </div>
        </div>
        <div class="perf-summary-stats">
          <div class="perf-stat"><span>${icon('cpu', 14)} CPU</span><strong>${escapeHtml(cpu.name)}</strong><em>${result.cpuScore} pts</em></div>
          <div class="perf-stat"><span>${icon('gpu', 14)} GPU</span><strong>${escapeHtml(gpu ? gpu.name : `${cpu.name} integrated`)}</strong><em>${result.integrated ? 'Integrated graphics' : `${result.gpuScore} pts`}</em></div>
          <div class="perf-stat"><span>${icon('gamepad', 14)} 60 FPS target</span><strong>${result.hitRate} / ${result.games.length} titles</strong><em>${result.resolution.label} ${result.quality.label.toLowerCase()}</em></div>
          <div class="perf-stat"><span>${icon('monitor', 14)} Suggested use</span><strong>${result.resolution.label} ${result.quality.label}</strong><em>${result.hitRate >= 8 ? 'Very comfortable' : result.hitRate >= 5 ? 'Good match' : 'Tune settings'}</em></div>
        </div>
        ${result.integrated ? `<div class="integrated-note">${icon('info', 14)} Integrated graphics estimate. A dedicated GPU is strongly recommended for modern games.</div>` : ''}
        <div class="target-bar">
          <div class="target-bar-head"><span>Games estimated at 60 FPS or higher</span><strong>${result.hitRate}/${result.games.length}</strong></div>
          <div class="target-track"><div style="width:${(result.hitRate / result.games.length) * 100}%"></div></div>
        </div>
      </div>
      <div class="games-head">
        <h2>Game estimates</h2>
        <span>${icon('chart', 13)} ${result.games.length} titles · varied CPU/GPU demand</span>
      </div>
      <div class="games-grid">${result.games.map(gameCard).join('')}</div>
      <p class="perf-footnote">${icon('info', 13)} Estimates assume a healthy system with current drivers, adequate cooling, and no severe background load. Upscaling (DLSS/FSR/XeSS) and frame generation are excluded.</p>
      ${currentBuildIntelligence(state)}
    `;
  }

  function setActiveSegments() {
    page.querySelectorAll('[data-resolution]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.resolution === state.resolution);
    });
    page.querySelectorAll('[data-quality]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.quality === state.quality);
    });
  }

  cpuSelect.addEventListener('change', () => {
    state.cpuId = cpuSelect.value;
    if (state.gpuId === 'integrated' && !integratedAvailable()) {
      state.gpuId = '';
      gpuSelect.value = '';
    }
    const integratedOption = gpuSelect.querySelector('option[value="integrated"]');
    if (integratedOption) {
      integratedOption.disabled = !integratedAvailable();
      integratedOption.textContent = `Integrated graphics${integratedAvailable() ? '' : ' (CPU has none)'}`;
    }
    renderResults();
  });
  gpuSelect.addEventListener('change', () => {
    state.gpuId = gpuSelect.value;
    renderResults();
  });

  page.addEventListener('click', (event) => {
    const resolution = event.target.closest('[data-resolution]');
    if (resolution) {
      state.resolution = resolution.dataset.resolution;
      setActiveSegments();
      renderResults();
      return;
    }
    const quality = event.target.closest('[data-quality]');
    if (quality) {
      state.quality = quality.dataset.quality;
      setActiveSegments();
      renderResults();
      return;
    }
    if (event.target.closest('[data-perf-action="use-build"]')) {
      const currentBuild = store.getCurrent();
      const cpu = getItems(currentBuild, 'cpu')[0];
      const gpu = getItems(currentBuild, 'gpu')[0];
      if (!cpu) {
        toast('Your build does not have a CPU yet. Pick a processor manually.', 'info');
        return;
      }
      state.cpuId = cpu.id;
      state.gpuId = gpu ? gpu.id : (Number(cpu.specs.igpuScore) > 0 ? 'integrated' : '');
      cpuSelect.value = state.cpuId;
      gpuSelect.innerHTML = gpuOptions(state.gpuId, Number(cpu.specs.igpuScore) > 0);
      gpuSelect.value = state.gpuId;
      renderResults();
      toast('Performance estimator loaded from your current build.', 'success');
    }
  });

  renderResults();
}
