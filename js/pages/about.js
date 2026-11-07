import { TOTAL_COMPONENTS, TOTAL_BRANDS } from '../data/hardware.js';
import { PRESETS } from '../data/presets.js';
import { icon } from '../ui/icons.js';

const FEATURES = [
  { icon: 'core', name: 'Builder', text: 'Search, filter, sort, compare, and swap components at any time.', href: '#/builder' },
  { icon: 'shield', name: 'Compatibility', text: 'Ten categories of rules with plain-language explanations.', href: '#/compatibility' },
  { icon: 'cube', name: '3D Visualizer', text: 'A rotatable transparent case built with Three.js.', href: '#/visualizer' },
  { icon: 'gamepad', name: 'Performance', text: 'Estimated FPS across ten games, three resolutions, four quality levels.', href: '#/performance' },
  { icon: 'database', name: 'Hardware Database', text: 'One hundred sample products with detailed specifications.', href: '#/database' },
  { icon: 'bookmark', name: 'Saved Builds', text: 'Rename, duplicate, delete, share, and export builds locally.', href: '#/saved' },
];

const FAQ = [
  {
    q: 'Are the prices and stock levels real?',
    a: 'No. Every price is an estimated sample value in Philippine pesos, and availability is illustrative sample data. Nothing in this app connects to a retailer or live inventory feed. Use the totals as a planning aid, then confirm prices with your local store.',
  },
  {
    q: 'How accurate is the compatibility checker?',
    a: 'The checker derives results directly from the catalog specs: socket, chipset, memory type and limits, form factor, GPU length, cooler height or radiator size, PSU wattage and form factor, storage ports, and fan mounts. If a required specification is missing, the result becomes a yellow “cannot be verified” warning instead of a false green. Always confirm physical clearance and BIOS support with the manufacturer.',
  },
  {
    q: 'How are the FPS estimates calculated?',
    a: 'Each CPU and GPU has a relative performance score. The estimator combines those scores with per-game demand profiles, a resolution multiplier, a quality multiplier, and a CPU limit for draw-call-heavy titles. It is a transparent planning model, not a benchmark. Real performance depends on drivers, patches, ray tracing, upscaling, and the exact scene.',
  },
  {
    q: 'Where are my builds stored?',
    a: 'In your browser using localStorage. There is no account, backend, or database. Clearing site data removes local builds, so use Export JSON or PDF for anything you want to keep. Share links encode the build into the URL — the data is only decoded in the recipient’s browser.',
  },
  {
    q: 'Does the 3D view show the real products?',
    a: 'The 3D visualizer uses attractive procedural placeholder geometry, not manufacturer CAD models. It reflects the selected case size, GPU length, memory modules, cooler type, fans, and RGB lighting so you can understand the layout, but it is not a physical fit simulation.',
  },
  {
    q: 'Does it work offline and on GitHub Pages?',
    a: 'Yes. The app is a static site with relative asset paths and no server-side dependencies. Three.js is vendored locally, so the core experience works without a CDN. GitHub Pages only needs to serve the repository files. If Google Fonts is unavailable, the system font stack takes over.',
  },
  {
    q: 'Is it mobile-friendly?',
    a: 'Yes. The builder, database, saved builds, compatibility report, and performance estimator reflow for tablets and phones, with a sticky mobile build bar and a collapsible navigation menu.',
  },
];

export function render(root) {
  root.innerHTML = `
    <div class="about-page">
      <section class="about-hero">
        <div class="about-hero-glow"></div>
        <div>
          <p class="eyebrow">About the project</p>
          <h1 class="page-title">A local-first <span class="gradient-text">PC building studio</span>.</h1>
          <p class="page-subtitle">PC Build Studio is a complete front-end PC configurator: hardware selection, automatic compatibility validation, live peso totals, saved builds, an interactive Three.js case, and estimated gaming performance. It runs entirely in your browser.</p>
          <div class="about-actions">
            <a class="btn btn--primary" href="#/builder">${icon('wrench', 16)}<span>Start a build</span></a>
            <a class="btn btn--ghost" href="#/database">${icon('database', 16)}<span>Explore hardware</span></a>
          </div>
        </div>
        <div class="about-stats">
          <div class="about-stat"><strong>${TOTAL_COMPONENTS}</strong><span>sample components</span></div>
          <div class="about-stat"><strong>${TOTAL_BRANDS}</strong><span>hardware brands</span></div>
          <div class="about-stat"><strong>${PRESETS.length}</strong><span>curated presets</span></div>
          <div class="about-stat"><strong>0</strong><span>servers or accounts</span></div>
        </div>
      </section>

      <section class="about-section">
        <div class="section-head">
          <div><p class="eyebrow">Feature tour</p><h2 class="section-title">Everything in one place</h2></div>
        </div>
        <div class="about-feature-grid">
          ${FEATURES.map((feature) => `
            <a class="about-feature" href="${feature.href}">
              <span class="about-feature-icon">${icon(feature.icon === 'core' ? 'wrench' : feature.icon, 19)}</span>
              <div><h3>${feature.name}</h3><p>${feature.text}</p></div>
              ${icon('arrowRight', 15)}
            </a>
          `).join('')}
        </div>
      </section>

      <section class="about-section">
        <div class="about-two-col">
          <div class="about-card">
            <p class="eyebrow">Design principles</p>
            <h2>Functional first, honest always</h2>
            <ul class="about-list">
              <li>${icon('check', 15)}<span><strong>No fake results.</strong> Unknown specifications become verification warnings, never green checks.</span></li>
              <li>${icon('check', 15)}<span><strong>No hidden backend.</strong> Builds, presets, and sharing are handled with local storage and encoded URLs.</span></li>
              <li>${icon('check', 15)}<span><strong>Clear pricing.</strong> Every amount is labelled as an estimated sample price in PHP.</span></li>
              <li>${icon('check', 15)}<span><strong>Responsive by default.</strong> Desktop, tablet, and phone layouts are part of the core design.</span></li>
              <li>${icon('check', 15)}<span><strong>Graceful fallbacks.</strong> Procedural product illustrations and 3D placeholders avoid broken images and empty scenes.</span></li>
            </ul>
          </div>
          <div class="about-card about-card--accent">
            <p class="eyebrow">Built with</p>
            <h2>Simple, dependency-light web tech</h2>
            <div class="tech-chips">
              <span class="tech-chip">HTML5</span>
              <span class="tech-chip">CSS3</span>
              <span class="tech-chip">JavaScript ES6+</span>
              <span class="tech-chip">ES Modules</span>
              <span class="tech-chip">Three.js r160</span>
              <span class="tech-chip">localStorage</span>
              <span class="tech-chip">Hash routing</span>
              <span class="tech-chip">No build step</span>
            </div>
            <p class="about-tech-note">The hardware database is separated from the application logic. Three.js is vendored in <code>vendor/</code> so GitHub Pages works without a package manager or CDN for the core experience.</p>
          </div>
        </div>
      </section>

      <section class="about-section">
        <div class="section-head">
          <div><p class="eyebrow">Good to know</p><h2 class="section-title">Frequently asked questions</h2></div>
        </div>
        <div class="faq-list">
          ${FAQ.map((item) => `
            <details class="faq-item">
              <summary>${icon('chevronDown', 16)}<span>${item.q}</span></summary>
              <p>${item.a}</p>
            </details>
          `).join('')}
        </div>
      </section>

      <section class="about-section">
        <div class="about-disclaimer">
          <span class="about-disclaimer-icon">${icon('info', 20)}</span>
          <div>
            <h2>Data & disclaimer</h2>
            <p>PC Build Studio is a demonstration project. Product names, specifications, prices, and availability are realistic sample data assembled for the simulator; they are not an offer, quote, or guarantee. FPS figures are model-based estimates and not benchmark results. Compatibility checks cannot account for every revision, BIOS version, physical variation, or cable clearance. Always verify with the manufacturer or retailer before purchasing.</p>
            <p>Three.js is © three.js authors, used under the MIT license. Product names and trademarks belong to their respective owners. This project is not affiliated with any hardware manufacturer or retailer.</p>
          </div>
        </div>
      </section>

      <section class="cta-band">
        <div class="cta-band-glow"></div>
        <div>
          <p class="eyebrow">Ready when you are</p>
          <h2>Plan it. Check it. Build it.</h2>
          <p>No sign-up, no cloud, no nonsense. Just a clean configurator that respects your privacy.</p>
        </div>
        <div class="cta-band-actions">
          <a class="btn btn--primary btn--lg" href="#/builder">${icon('wrench', 17)}<span>Open the builder</span></a>
          <a class="btn btn--ghost btn--lg" href="#/saved">${icon('bookmark', 17)}<span>View saved builds</span></a>
        </div>
      </section>
    </div>
  `;
}
