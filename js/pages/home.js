import { CATEGORIES, HARDWARE, TOTAL_COMPONENTS, TOTAL_BRANDS, getHardware, itemsByCategory } from '../data/hardware.js';
import { PRESETS } from '../data/presets.js';
import { store, on } from '../core/store.js';
import { buildTotal, coreProgress, selectedCount } from '../core/build.js';
import { evaluateBuild } from '../core/compat.js';
import { peso, escapeHtml } from '../core/format.js';
import { icon } from '../ui/icons.js';
import { productArt } from '../ui/art.js';
import { presetCard } from '../ui/preset.js';
import { statusBadge } from '../ui/summary.js';
import { progressBar } from '../ui/common.js';

function buildCardHTML() {
  const build = store.getCurrent();
  const result = evaluateBuild(build);
  const total = buildTotal(build);
  const count = selectedCount(build);
  const progress = coreProgress(build);
  const percent = progress.total ? Math.round((progress.selected / progress.total) * 100) : 0;
  return `
    <div class="hero-build-card">
      <div class="hbc-glow"></div>
      <div class="hbc-head">
        <span class="hbc-kicker">${count ? 'Your current build' : 'Start your build'}</span>
        ${statusBadge(result)}
      </div>
      <h3>${escapeHtml(build.name)}</h3>
      <p class="hbc-sub">${count ? `${count} component${count === 1 ? '' : 's'} selected · ${progress.selected}/${progress.total} core parts` : 'Pick a preset or start from scratch — compatibility is checked as you go.'}</p>
      <div class="hbc-progress">
        ${progressBar(progress.selected, progress.total)}
        <span>${percent}% complete</span>
      </div>
      <div class="hbc-foot">
        <div>
          <span class="totals-label">Estimated total</span>
          <strong class="hbc-total">${peso(total)}</strong>
        </div>
        <div class="hbc-actions">
          <a class="btn btn--primary btn--sm" href="#/builder">${icon('wrench', 14)}<span>${count ? 'Continue' : 'Build'}</span></a>
          <a class="btn btn--ghost btn--sm" href="#/visualizer">${icon('cube', 14)}<span>3D view</span></a>
        </div>
      </div>
    </div>
  `;
}

export function render(root) {
  const showcase = getHardware('case-lianli-o11-evo');
  const categoryCards = CATEGORIES.map((category) => `
    <a class="category-tile" href="#/database?category=${category.id}">
      <span class="category-tile-icon">${icon(category.icon, 20)}</span>
      <span class="category-tile-copy">
        <strong>${escapeHtml(category.label)}</strong>
        <span>${itemsByCategory(category.id).length} products</span>
      </span>
      <span class="category-tile-arrow">${icon('arrowRight', 15)}</span>
    </a>
  `).join('');

  root.innerHTML = `
    <div class="home-page">
      <section class="hero">
        <div class="hero-grid-overlay"></div>
        <div class="hero-copy">
          <p class="eyebrow"><span class="live-dot"></span> Interactive PC configurator · Philippine pesos</p>
          <h1 class="hero-title">Build your <span class="gradient-text">dream PC</span>, part by part.</h1>
          <p class="hero-sub">Choose real-world hardware, catch compatibility problems before you buy, preview your rig in 3D, and estimate gaming performance — all in one local-first studio.</p>
          <div class="hero-cta">
            <a class="btn btn--primary btn--lg" href="#/builder">${icon('wrench', 17)}<span>Start building</span>${icon('arrowRight', 16)}</a>
            <button class="btn btn--ghost btn--lg" type="button" data-action="open-wizard">${icon('sparkles', 17)}<span>Guided setup</span></button>
            <a class="btn btn--ghost btn--lg" href="#/database">${icon('database', 17)}<span>Browse hardware</span></a>
          </div>
          <div class="hero-stats">
            <div class="hero-stat"><strong>${TOTAL_COMPONENTS}</strong><span>sample parts</span></div>
            <div class="hero-stat"><strong>${TOTAL_BRANDS}</strong><span>brands</span></div>
            <div class="hero-stat"><strong>${PRESETS.length}</strong><span>presets</span></div>
            <div class="hero-stat"><strong>₱</strong><span>PHP pricing</span></div>
          </div>
        </div>
        <div class="hero-visual">
          <div class="hero-visual-glow"></div>
          <div class="hero-rings" aria-hidden="true"></div>
          <div class="hero-case-art">${productArt(showcase)}</div>
          <span class="float-chip float-chip--one">${icon('shield', 14)} Compatibility checked</span>
          <span class="float-chip float-chip--two">${icon('chart', 14)} FPS estimates</span>
          <span class="float-chip float-chip--three">${icon('cube', 14)} Interactive 3D</span>
          <div class="hero-build-wrap" id="hero-build-card">${buildCardHTML()}</div>
        </div>
      </section>

      <section class="home-section">
        <div class="feature-grid">
          <article class="feature-card">
            <span class="feature-icon feature-icon--blue">${icon('shield', 20)}</span>
            <h3>Real compatibility logic</h3>
            <p>Sockets, chipsets, DDR generations, clearances, PSU headroom, and more are validated from actual catalog specs.</p>
            <a href="#/compatibility" class="text-link">See how checks work ${icon('arrowRight', 14)}</a>
          </article>
          <article class="feature-card">
            <span class="feature-icon feature-icon--purple">${icon('cube', 20)}</span>
            <h3>Live 3D preview</h3>
            <p>Rotate a transparent case and watch the motherboard, GPU, memory, and cooling update as you choose parts.</p>
            <a href="#/visualizer" class="text-link">Open visualizer ${icon('arrowRight', 14)}</a>
          </article>
          <article class="feature-card">
            <span class="feature-icon feature-icon--pink">${icon('gamepad', 20)}</span>
            <h3>Gaming estimates</h3>
            <p>Approximate FPS for popular titles at 1080p, 1440p, and 4K, with quality presets and CPU/GPU bottleneck notes.</p>
            <a href="#/performance" class="text-link">Estimate performance ${icon('arrowRight', 14)}</a>
          </article>
          <article class="feature-card">
            <span class="feature-icon feature-icon--green">${icon('save', 20)}</span>
            <h3>Save, share, export</h3>
            <p>Keep builds in your browser, rename them, share encoded links, or print a clean PDF summary for shopping.</p>
            <a href="#/saved" class="text-link">Open saved builds ${icon('arrowRight', 14)}</a>
          </article>
        </div>
      </section>

      <section class="home-section" id="presets">
        <div class="section-head">
          <div>
            <p class="eyebrow">Ready-made starting points</p>
            <h2 class="section-title">Build presets</h2>
            <p class="section-sub">Start with a curated configuration, then swap any part you like. Every preset is checked for compatibility.</p>
          </div>
          <button class="btn btn--ghost" type="button" data-action="open-presets">${icon('sparkles', 15)}<span>Compare presets</span></button>
        </div>
        <div class="preset-grid">${PRESETS.map((preset) => presetCard(preset)).join('')}</div>
      </section>

      <section class="home-section">
        <div class="section-head">
          <div>
            <p class="eyebrow">The whole catalog</p>
            <h2 class="section-title">Browse by component</h2>
            <p class="section-sub">${HARDWARE.length} sample products across nine categories, searchable and filterable.</p>
          </div>
        </div>
        <div class="category-grid">${categoryCards}</div>
      </section>

      <section class="home-section">
        <div class="section-head">
          <div>
            <p class="eyebrow">From idea to build sheet</p>
            <h2 class="section-title">How it works</h2>
          </div>
        </div>
        <div class="steps">
          <div class="step">
            <span class="step-number">01</span>
            <h3>Pick your parts</h3>
            <p>Search or load a preset. Add, remove, and replace components at any time — no need to restart.</p>
          </div>
          <div class="step">
            <span class="step-number">02</span>
            <h3>Fix conflicts</h3>
            <p>Every selection triggers automatic compatibility checks with plain-language explanations and a recommended PSU.</p>
          </div>
          <div class="step">
            <span class="step-number">03</span>
            <h3>Visualise & save</h3>
            <p>Rotate the 3D build, estimate FPS, then save it locally or share an encoded link with a friend.</p>
          </div>
        </div>
      </section>

      <section class="cta-band">
        <div class="cta-band-glow"></div>
        <div>
          <p class="eyebrow">No account required</p>
          <h2>Your next PC starts here.</h2>
          <p>Everything runs in your browser. Builds are stored locally, and prices are clearly labelled estimates.</p>
        </div>
        <div class="cta-band-actions">
          <a class="btn btn--primary btn--lg" href="#/builder">${icon('wrench', 17)}<span>Open the builder</span></a>
          <a class="btn btn--ghost btn--lg" href="#/saved">${icon('bookmark', 17)}<span>Saved builds</span></a>
        </div>
      </section>
    </div>
  `;

  const cardHost = root.querySelector('#hero-build-card');
  const unsubscribe = on('build', () => {
    if (cardHost?.isConnected) cardHost.innerHTML = buildCardHTML();
  });

  return () => unsubscribe();
}
