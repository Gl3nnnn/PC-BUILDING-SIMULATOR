import { getHardware } from '../data/hardware.js';
import { store, on } from '../core/store.js';
import { buildTotal, selectedCount } from '../core/build.js';
import { evaluateBuild, COMPATIBILITY_LABELS } from '../core/compat.js';
import { escapeHtml, peso } from '../core/format.js';
import { icon } from '../ui/icons.js';
import { statusBadge } from '../ui/summary.js';
import { emptyState, progressBar } from '../ui/common.js';

const LEVEL_META = {
  error: { label: 'Blocking issue', icon: 'x', cls: 'error' },
  warn: { label: 'Needs verification', icon: 'alert', cls: 'warn' },
  info: { label: 'Note', icon: 'info', cls: 'info' },
  ok: { label: 'Passed', icon: 'check', cls: 'ok' },
};

const CHECKED_RULES = [
  { icon: 'cpu', title: 'CPU socket', text: 'The processor must physically match the motherboard socket.' },
  { icon: 'motherboard', title: 'Chipset support', text: 'The board chipset must officially support the selected CPU.' },
  { icon: 'ram', title: 'Memory generation', text: 'DDR4 vs DDR5 support across the CPU, board, and kits.' },
  { icon: 'ram', title: 'Memory limits', text: 'DIMM slots, total capacity, speed profiles, and dual-channel advice.' },
  { icon: 'case', title: 'Board & case fit', text: 'ATX, Micro-ATX, and Mini-ITX compatibility.' },
  { icon: 'gpu', title: 'GPU clearance', text: "Card length versus the case's published maximum." },
  { icon: 'cooler', title: 'Cooler fit', text: 'Socket support, cooler height or radiator size, and thermal rating.' },
  { icon: 'psu', title: 'Power headroom', text: 'Estimated peak draw versus PSU wattage and recommended headroom.' },
  { icon: 'storage', title: 'Storage ports', text: 'M.2 slot count, SATA ports, and PCIe generation limits.' },
  { icon: 'fan', title: 'Fan mounts & power', text: 'Fan sizing/count limits plus GPU and PSU connector checks.' },
];

function buildSummaryText(result) {
  if (result.status === 'compatible') return 'Every rule passed. This configuration is clear to build.';
  if (result.status === 'warning') return `No blocking conflicts, but ${result.warnings.length} item${result.warnings.length === 1 ? '' : 's'} should be verified before buying.`;
  if (result.status === 'incompatible') return `${result.errors.length} blocking conflict${result.errors.length === 1 ? '' : 's'} must be fixed before this build can work.`;
  if (result.status === 'incomplete') return `Add ${result.missing.length} required component${result.missing.length === 1 ? '' : 's'} to complete the compatibility picture.`;
  return 'Add components to start the compatibility report.';
}

function partsChips(check) {
  if (!check.parts?.length) return '';
  const chips = check.parts.map((id) => getHardware(id)).filter(Boolean).map((item) => `
    <button class="part-chip" type="button" data-action="details" data-id="${item.id}">
      ${icon('cpu', 12)}<span>${escapeHtml(item.name)}</span>
    </button>
  `).join('');
  return `<div class="check-parts">${chips}</div>`;
}

function checkCard(check) {
  const meta = LEVEL_META[check.level] || LEVEL_META.info;
  return `
    <article class="check-card check-card--${meta.cls}">
      <span class="check-card-icon">${icon(meta.icon, 16)}</span>
      <div class="check-card-copy">
        <div class="check-card-head">
          <span class="check-level">${meta.label}</span>
          <h3>${escapeHtml(check.title)}</h3>
        </div>
        <p>${escapeHtml(check.detail)}</p>
        ${partsChips(check)}
      </div>
    </article>
  `;
}

function section(title, checks, iconName, tone) {
  if (!checks.length) return '';
  return `
    <section class="compat-section">
      <div class="compat-section-head">
        <h2>${icon(iconName, 18)}<span>${escapeHtml(title)}</span><em class="count-badge count-badge--${tone}">${checks.length}</em></h2>
      </div>
      <div class="check-list">${checks.map(checkCard).join('')}</div>
    </section>
  `;
}

function renderBody(container) {
  const build = store.getCurrent();
  const result = evaluateBuild(build);

  if (selectedCount(build) === 0) {
    container.innerHTML = `
      <div class="compat-empty">
        ${emptyState({
          iconName: 'shield',
          title: 'Nothing to check yet',
          text: 'Add components in the builder or load a preset, then return here for a full compatibility report.',
          action: `<a class="btn btn--primary" href="#/builder">${icon('wrench', 15)}<span>Open the builder</span></a>
            <button class="btn btn--ghost" type="button" data-action="open-presets">${icon('sparkles', 15)}<span>Load a preset</span></button>`,
        })}
        <div class="rules-grid">
          ${CHECKED_RULES.map((rule) => `
            <div class="rule-card">
              <span class="rule-icon">${icon(rule.icon, 17)}</span>
              <div><strong>${escapeHtml(rule.title)}</strong><p>${escapeHtml(rule.text)}</p></div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    return;
  }

  const meta = COMPATIBILITY_LABELS[result.status];
  const progressPercent = result.progress.total ? Math.round((result.progress.selected / result.progress.total) * 100) : 0;
  const missingHTML = result.missing.length ? `
    <section class="missing-panel">
      <div class="missing-head">
        ${icon('alert', 17)}
        <div><h2>Required components missing</h2><p>Compatibility checks only cover the parts you have selected.</p></div>
      </div>
      <div class="missing-list">
        ${result.missing.map((category) => `
          <a class="missing-chip" href="#/builder?cat=${category.id}">${icon(category.icon, 14)}<span>${escapeHtml(category.label)}</span>${icon('plus', 12)}</a>
        `).join('')}
      </div>
    </section>
  ` : '';

  const passed = result.passes;
  container.innerHTML = `
    <div class="compat-overview compat-overview--${meta.tone}">
      <div class="compat-overview-glow"></div>
      <div class="compat-overview-main">
        <span class="compat-big-icon">${icon(meta.icon, 26)}</span>
        <div>
          <p class="eyebrow">Compatibility report · ${escapeHtml(build.name)}</p>
          <h2>${escapeHtml(meta.label)}</h2>
          <p>${escapeHtml(buildSummaryText(result))}</p>
        </div>
        ${statusBadge(result)}
      </div>
      <div class="compat-metrics">
        <div class="compat-metric"><span>${icon('cpu', 14)} Components</span><strong>${result.selectedCount}</strong></div>
        <div class="compat-metric"><span>${icon('money', 14)} Estimated total</span><strong>${peso(result.total)}</strong></div>
        <div class="compat-metric"><span>${icon('bolt', 14)} Est. peak draw</span><strong>${result.estimatedWattage} W</strong></div>
        <div class="compat-metric"><span>${icon('psu', 14)} Recommended PSU</span><strong>${result.recommendedPsu} W</strong></div>
        <div class="compat-metric compat-metric--progress">
          <span>${icon('check', 14)} Core components</span>
          <strong>${result.progress.selected}/${result.progress.total}</strong>
          ${progressBar(result.progress.selected, result.progress.total)}
          <em>${progressPercent}% complete</em>
        </div>
      </div>
      ${result.errors.length ? `<div class="compat-issue-bar compat-issue-bar--error">${icon('x', 15)} ${result.errors.length} blocking issue${result.errors.length === 1 ? '' : 's'} found — review the sections below.</div>` : ''}
    </div>

    ${missingHTML}

    ${section('Blocking issues', result.errors, 'x', 'error')}
    ${section('Warnings & verification', result.warnings, 'alert', 'warn')}
    ${section('Notes', result.infos, 'info', 'info')}

    <section class="compat-section">
      <details class="passed-group" ${passed.length && !result.errors.length ? 'open' : ''}>
        <summary>
          <span class="passed-group-title">${icon('check', 17)}<span>Passed checks</span><em class="count-badge count-badge--ok">${passed.length}</em></span>
          <span class="passed-group-hint">${icon('chevronDown', 16)}</span>
        </summary>
        <div class="check-list">${passed.length ? passed.map(checkCard).join('') : '<p class="muted">No checks passed yet — add the required components.</p>'}</div>
      </details>
    </section>

    <section class="compat-section">
      <div class="compat-section-head"><h2>${icon('shield', 18)}<span>What this report checks</span></h2></div>
      <div class="rules-grid">
        ${CHECKED_RULES.map((rule) => `
          <div class="rule-card">
            <span class="rule-icon">${icon(rule.icon, 17)}</span>
            <div><strong>${escapeHtml(rule.title)}</strong><p>${escapeHtml(rule.text)}</p></div>
          </div>
        `).join('')}
      </div>
      <div class="compat-legend">
        <span class="legend-item"><span class="legend-dot legend-dot--ok"></span>Compatible</span>
        <span class="legend-item"><span class="legend-dot legend-dot--warn"></span>Warning / verify</span>
        <span class="legend-item"><span class="legend-dot legend-dot--error"></span>Incompatible</span>
        <span class="legend-item"><span class="legend-dot legend-dot--info"></span>Note / incomplete</span>
      </div>
      <p class="detail-note">${icon('info', 14)} Unknown or missing specifications are never treated as compatible — they appear as a yellow “cannot be verified” warning. Always confirm final clearance and BIOS support with the manufacturer.</p>
    </section>
  `;
}

export function render(root) {
  root.innerHTML = `
    <div class="compatibility-page">
      <header class="page-head">
        <div>
          <p class="eyebrow">Automatic validation</p>
          <h1 class="page-title">Compatibility Checker</h1>
          <p class="page-subtitle">Every rule explained in plain language, with green, yellow, and red results you can act on.</p>
        </div>
        <div class="page-actions">
          <a class="btn btn--ghost" href="#/builder">${icon('wrench', 15)}<span>Edit build</span></a>
          <button class="btn btn--primary" type="button" data-action="export-pdf">${icon('print', 15)}<span>Export PDF</span></button>
        </div>
      </header>
      <div id="compat-body"></div>
    </div>
  `;
  const body = root.querySelector('#compat-body');
  renderBody(body);
  const unsubscribe = on('build', () => renderBody(body));
  return () => unsubscribe();
}
