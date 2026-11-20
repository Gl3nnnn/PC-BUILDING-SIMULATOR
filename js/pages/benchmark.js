import { store } from '../core/store.js';
import { runBenchmarks, BENCHMARK_NOTES } from '../core/benchmark.js';
import { escapeHtml } from '../core/format.js';
import { icon } from '../ui/icons.js';
import { toast } from '../ui/toast.js';

const MAX_SCORE_HINT = 6000;

function scoreTier(score) {
  if (score >= 4800) return { label: 'Flagship', tone: 'great' };
  if (score >= 3200) return { label: 'Strong', tone: 'good' };
  if (score >= 1700) return { label: 'Capable', tone: 'fair' };
  return { label: 'Entry', tone: 'low' };
}

function meterTone(percent) {
  if (percent >= 95) return 'error';
  if (percent >= 80) return 'warn';
  return 'ok';
}

function tempTone(temp, limit) {
  if (temp === null) return 'ok';
  if (temp >= limit) return 'error';
  if (temp >= limit - 12) return 'warn';
  return 'ok';
}

function bar(percent, tone) {
  return `<div class="bm-track bm-track--${tone}"><span style="width:${Math.max(1, Math.min(100, percent))}%"></span></div>`;
}

function profileTab(profile, active) {
  return `
    <button class="bm-tab ${active ? 'is-active' : ''}" type="button" data-bm-profile="${profile.id}">
      <span class="bm-tab-icon">${icon(profile.icon, 15)}</span>
      <span class="bm-tab-text">
        <strong>${escapeHtml(profile.label)}</strong>
        <em>${escapeHtml(profile.blurb)}</em>
      </span>
    </button>
  `;
}

function detailCard(profile, result) {
  const tier = scoreTier(profile.score);
  const cpuTone = meterTone(profile.utilization.cpu);
  const gpuTone = result.gpu ? meterTone(profile.utilization.gpu) : 'ok';
  const ramTone = profile.ram.percent >= 95 ? 'error' : profile.ram.percent >= 85 ? 'warn' : 'ok';
  const cpuTempTone = tempTone(profile.temps.cpu, profile.temps.cpuLimit);
  const gpuTempTone = tempTone(profile.temps.gpu, profile.temps.gpuLimit);
  const powerTone = profile.power.loadPct === null ? 'ok' : profile.power.loadPct > 100 ? 'error' : profile.power.loadPct > 85 ? 'warn' : 'ok';

  return `
    <div class="bm-run-head">
      <div class="bm-run-title">
        <span class="bm-run-icon">${icon(profile.icon, 18)}</span>
        <div>
          <h2>${escapeHtml(profile.label)}</h2>
          <p>${escapeHtml(profile.work)}</p>
        </div>
      </div>
      <span class="bm-tier bm-tier--${tier.tone}">${escapeHtml(tier.label)}</span>
    </div>

    <div class="bm-score-row">
      <div class="bm-score">
        <strong data-bm-score>${profile.score}</strong>
        <span>index points</span>
      </div>
      <div class="bm-score-meta">
        <p>${icon('cpu', 13)} CPU ${result.cpuIndex} pts · ${icon('gpu', 13)} GPU ${result.gpu ? `${result.gpuIndex} pts` : 'none'}</p>
        ${profile.fps
          ? `<p class="bm-fps">${icon('monitor', 13)} ${profile.fps.average} FPS average · ${profile.fps.onePercent} FPS 1% low · ${profile.fps.resolution} ${profile.fps.quality}</p>`
          : `<p>${icon('info', 13)} No frame rate for this workload — it is measured in time, not frames.</p>`}
      </div>
    </div>

    <div class="bm-meters">
      <div class="bm-meter">
        <div class="bm-meter-head"><span>${icon('cpu', 13)} CPU utilisation</span><strong data-bm-value>${profile.utilization.cpu}%</strong></div>
        ${bar(profile.utilization.cpu, cpuTone)}
      </div>
      <div class="bm-meter">
        <div class="bm-meter-head"><span>${icon('gpu', 13)} GPU utilisation</span><strong>${result.gpu ? `${profile.utilization.gpu}%` : 'n/a'}</strong></div>
        ${bar(result.gpu ? profile.utilization.gpu : 0, gpuTone)}
      </div>
      <div class="bm-meter">
        <div class="bm-meter-head"><span>${icon('memory', 13)} Memory</span><strong>${profile.ram.used} / ${profile.ram.installed} GB</strong></div>
        ${bar(profile.ram.percent, ramTone)}
        <p class="bm-meter-note">${profile.ram.pressure ? 'Above 85% used — the machine starts swapping and the score takes the hit.' : `${profile.ram.percent}% of installed capacity used by this job.`}</p>
      </div>
      <div class="bm-meter">
        <div class="bm-meter-head"><span>${icon('cooler', 13)} CPU temperature</span><strong>${profile.temps.cpu === null ? '—' : `${profile.temps.cpu} °C`}</strong></div>
        ${bar(profile.temps.cpu === null ? 0 : (profile.temps.cpu / 105) * 100, cpuTempTone)}
        <p class="bm-meter-note">Throttling from ${profile.temps.cpuLimit} °C${profile.temps.lost.cpu > 0 ? ` · losing ${profile.temps.lost.cpu}% of clock speed` : ' · no throttling'}</p>
      </div>
      <div class="bm-meter">
        <div class="bm-meter-head"><span>${icon('gpu', 13)} GPU temperature</span><strong>${profile.temps.gpu === null ? 'Integrated' : `${profile.temps.gpu} °C`}</strong></div>
        ${bar(profile.temps.gpu === null ? 0 : (profile.temps.gpu / 92) * 100, gpuTempTone)}
        <p class="bm-meter-note">${profile.temps.gpu === null ? 'No dedicated card in this build.' : `Throttling from ${profile.temps.gpuLimit} °C${profile.temps.lost.gpu > 0 ? ` · losing ${profile.temps.lost.gpu}% of clock speed` : ' · no throttling'}`}</p>
      </div>
      <div class="bm-meter">
        <div class="bm-meter-head"><span>${icon('psu', 13)} Power draw</span><strong>${profile.power.watts} W</strong></div>
        ${bar(profile.power.loadPct === null ? 0 : profile.power.loadPct, powerTone)}
        <p class="bm-meter-note">${profile.power.psuWatts ? `${profile.power.loadPct}% of the ${profile.power.psuWatts} W supply${profile.power.overPsu ? ' — over budget, the run would fail' : ''}` : 'No power supply selected.'}</p>
      </div>
    </div>

    <div class="bm-limit bm-limit--${profile.throttled || profile.power.overPsu ? 'warn' : 'ok'}">
      <span class="bm-limit-icon">${icon('alert', 16)}</span>
      <div>
        <strong>Limiter: ${escapeHtml(profile.limiter.kind)}</strong>
        <p>${escapeHtml(profile.limiter.detail)}</p>
      </div>
    </div>
  `;
}

function comparisonTable(result, activeId) {
  return `
    <section class="bm-compare">
      <div class="bm-head">
        <h2>${icon('chart', 16)} All five workloads</h2>
        <span>${icon('info', 13)} Simulated index points · higher is better</span>
      </div>
      <div class="bm-compare-rows">
        ${result.profiles.map((profile) => {
          const pct = Math.min(100, (profile.score / MAX_SCORE_HINT) * 100);
          return `
            <button class="bm-compare-row ${profile.id === activeId ? 'is-active' : ''}" type="button" data-bm-profile="${profile.id}">
              <span class="bm-compare-label">${icon(profile.icon, 13)} ${escapeHtml(profile.label)}</span>
              <span class="bm-compare-bar"><span style="width:${Math.max(2, pct)}%"></span></span>
              <strong>${profile.score}</strong>
            </button>
          `;
        }).join('')}
      </div>
    </section>
  `;
}

export function render(root, _ctx = {}) {
  const result = runBenchmarks(store.getCurrent());
  let activeId = result.ready ? (result.best?.id || result.profiles[0].id) : '';
  let runToken = 0;

  root.innerHTML = `
    <section class="page page--benchmark">
      <header class="page-head">
        <div>
          <p class="eyebrow">${icon('chart', 13)} Benchmark suite</p>
          <h1>Benchmark dashboard</h1>
          <p class="page-sub">Five workload profiles scored from your current build. <strong>These are simulated results, not measurements</strong> — no code here runs your hardware.</p>
        </div>
        <div class="page-head-actions">
          <a class="btn btn--ghost" href="#/performance">${icon('chart', 15)}<span>Game estimates</span></a>
          <a class="btn btn--ghost" href="#/builder">${icon('wrench', 15)}<span>Edit build</span></a>
        </div>
      </header>

      ${result.ready ? `
        <div class="bm-shell">
          <aside class="bm-side">
            <div class="bm-build">
              <h2>${icon('cpu', 15)} Under test</h2>
              <p class="bm-build-line"><span>CPU</span><strong>${escapeHtml(result.cpu.name)}</strong></p>
              <p class="bm-build-line"><span>GPU</span><strong>${result.gpu ? escapeHtml(result.gpu.name) : 'Integrated graphics'}</strong></p>
              <p class="bm-build-line"><span>Memory</span><strong>${result.memoryGb} GB</strong></p>
              <p class="bm-build-line"><span>Storage</span><strong>${result.storageGb >= 1000 ? `${result.storageGb / 1000} TB` : `${result.storageGb} GB`}</strong></p>
            </div>
            <div class="bm-tabs">
              <h2>${icon('list', 15)} Workload</h2>
              ${result.profiles.map((profile) => profileTab(profile, profile.id === activeId)).join('')}
            </div>
            <button class="btn btn--primary bm-run-btn" type="button" data-bm-run>${icon('bolt', 15)}<span>Run benchmark</span></button>
            <p class="bm-run-hint">Runs about 2 seconds of simulated load, then reports.</p>
          </aside>

          <div class="bm-main">
            <section class="bm-run" data-bm-run-panel>
              <div class="bm-progress" data-bm-progress hidden>
                <div class="bm-progress-head"><span data-bm-progress-label>Warming up…</span><strong data-bm-progress-pct>0%</strong></div>
                <div class="bm-track bm-track--run"><span data-bm-progress-bar style="width:0%"></span></div>
              </div>
              <div data-bm-detail>${detailCard(result.profiles.find((p) => p.id === activeId), result)}</div>
            </section>
            ${comparisonTable(result, activeId)}
            <section class="bm-notes">
              <div class="bm-head">
                <h2>${icon('info', 16)} How these numbers are produced</h2>
                <span class="bm-sim-badge">Simulated, not measured</span>
              </div>
              <div class="bm-notes-grid">
                ${BENCHMARK_NOTES.map(([label, text]) => `<p><strong>${escapeHtml(label)}.</strong> ${escapeHtml(text)}</p>`).join('')}
              </div>
              <p class="bm-notes-foot">Real reviews measure these parts on a bench with fixed room temperature, fresh drivers and repeated runs. Use this dashboard to compare two builds you are considering, not to predict a specific number in a specific game.</p>
            </section>
          </div>
        </div>
      ` : `
        <section class="bm-blocked">
          <span class="bm-blocked-icon">${icon('alert', 26)}</span>
          <h2>This build cannot be benchmarked yet</h2>
          <p>${escapeHtml(result.reason)}</p>
          <div class="bm-blocked-actions">
            <a class="btn btn--primary" href="#/builder">${icon('wrench', 15)}<span>Open builder</span></a>
            <a class="btn btn--ghost" href="#/showcase">${icon('grid', 15)}<span>Load a preset</span></a>
          </div>
        </section>
      `}
    </section>
  `;

  if (!result.ready) return null;

  const panel = root.querySelector('[data-bm-run-panel]');
  const detail = root.querySelector('[data-bm-detail]');
  const progress = root.querySelector('[data-bm-progress]');
  const progressBar = root.querySelector('[data-bm-progress-bar]');
  const progressPct = root.querySelector('[data-bm-progress-pct]');
  const progressLabel = root.querySelector('[data-bm-progress-label]');
  const runBtn = root.querySelector('[data-bm-run]');
  let timer = null;

  function paintActive() {
    root.querySelectorAll('[data-bm-profile]').forEach((element) => {
      element.classList.toggle('is-active', element.dataset.bmProfile === activeId);
    });
    const profile = result.profiles.find((entry) => entry.id === activeId);
    detail.innerHTML = detailCard(profile, result);
  }

  // The run is a short simulated sweep so the dashboard feels like it is doing
  // something; the figures it lands on are the ones computed up front.
  function run() {
    if (timer) clearInterval(timer);
    const token = ++runToken;
    const profile = result.profiles.find((entry) => entry.id === activeId);
    progress.hidden = false;
    panel.classList.add('is-running');
    if (runBtn) runBtn.disabled = true;
    let pct = 0;
    const stages = ['Warming up…', 'Loading the CPU…', 'Loading the GPU…', 'Recording temperatures…', 'Writing results…'];
    timer = setInterval(() => {
      pct += 7 + Math.round(Math.random() * 6);
      if (pct >= 100) pct = 100;
      progressBar.style.width = `${pct}%`;
      progressPct.textContent = `${pct}%`;
      progressLabel.textContent = stages[Math.min(stages.length - 1, Math.floor((pct / 100) * stages.length))];
      if (pct >= 100) {
        clearInterval(timer);
        timer = null;
        if (token !== runToken) return;
        panel.classList.remove('is-running');
        progress.hidden = true;
        if (runBtn) runBtn.disabled = false;
        paintActive();
        toast(`${profile.label} benchmark finished: ${profile.score} points.`, 'success');
      }
    }, 90);
  }

  root.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-bm-profile]');
    if (tab) {
      activeId = tab.dataset.bmProfile;
      paintActive();
      return;
    }
    if (event.target.closest('[data-bm-run]')) {
      run();
    }
  });

  return () => {
    runToken += 1;
    if (timer) clearInterval(timer);
  };
}
