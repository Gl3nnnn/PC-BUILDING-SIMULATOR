import { CATEGORIES, getHardware } from '../data/hardware.js';
import { encodeBuild, getItems, buildTotal } from './build.js';
import { COMPATIBILITY_LABELS, evaluateBuild } from './compat.js';
import { downloadFile, escapeHtml, formatDate, peso, safeFilename } from './format.js';
import { keySpecs } from '../ui/specs.js';
import { getPriceState } from './prices.js';

export function shareUrl(build) {
  const base = `${location.origin === 'null' ? 'file://' : location.origin}${location.pathname}`;
  const encoded = encodeBuild(build);
  return `${base}#/share?d=${encoded}`;
}

export async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy copy */
  }
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    area.style.pointerEvents = 'none';
    document.body.appendChild(area);
    area.focus();
    area.select();
    const success = document.execCommand('copy');
    area.remove();
    return success;
  } catch {
    return false;
  }
}

export function exportBuildJSON(build) {
  const payload = {
    app: 'PC Build Studio',
    version: 1,
    exportedAt: new Date().toISOString(),
    build: {
      name: build.name,
      items: build.items,
      budget: build.budget,
    },
  };
  downloadFile(`${safeFilename(build.name)}.json`, JSON.stringify(payload, null, 2), 'application/json');
}

function printStatus(result) {
  const meta = COMPATIBILITY_LABELS[result.status] || COMPATIBILITY_LABELS.empty;
  return meta.label;
}

function checkList(result) {
  const order = { error: 0, warn: 1, info: 2, ok: 3 };
  const checks = [...result.checks].sort((a, b) => order[a.level] - order[b.level]);
  if (!checks.length) return '<p class="muted">No compatibility checks were available.</p>';
  return `<ul class="check-list">${checks.map((check) => `
    <li class="check check--${check.level}">
      <strong>${escapeHtml(check.title)}</strong>
      <span>${escapeHtml(check.detail)}</span>
    </li>
  `).join('')}</ul>`;
}

export function buildPrintHTML(build, result) {
  const total = buildTotal(build);
  const budget = Number(build.budget) || 0;
  const priceState = getPriceState();
  const priceDisclosure = priceState.meta.source === 'feed'
    ? `Prices come from the configured live feed (${escapeHtml(priceState.meta.provider)}) and reflect the latest snapshot available to this browser${priceState.meta.generatedAt ? ` (${escapeHtml(formatDate(priceState.meta.generatedAt, true))})` : ''}. Confirm the final checkout price and stock with the retailer.`
    : 'Prices are sample estimates in Philippine pesos, not live retailer quotes. Stock availability is illustrative sample data.';
  const rows = CATEGORIES.flatMap((category) => getItems(build, category.id).map((item) => ({
    category: category.label,
    name: `${item.brand} ${item.name}`,
    specs: keySpecs(item).join(' · '),
    price: item.price,
  })));
  const missing = result.missing.map((category) => category.label);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(build.name)} — PC Build Summary</title>
<style>
  @page { margin: 16mm 14mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: "Segoe UI", Arial, sans-serif; color: #111827; font-size: 12px; line-height: 1.5; }
  .doc-bar { height: 7px; background: linear-gradient(90deg, #4d7cff, #a855f7, #f472b6); border-radius: 99px; margin-bottom: 22px; }
  .brand { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 18px; }
  .brand strong { font-size: 15px; letter-spacing: .12em; text-transform: uppercase; color: #4f46e5; }
  .brand span { color: #6b7280; font-size: 10px; }
  h1 { font-size: 26px; margin: 0 0 4px; letter-spacing: -.02em; }
  .subtitle { color: #6b7280; margin: 0 0 14px; font-size: 11px; }
  .status { display: inline-block; font-weight: 700; font-size: 10px; letter-spacing: .06em; text-transform: uppercase; padding: 4px 9px; border-radius: 99px; border: 1px solid; margin-bottom: 18px; }
  .status.ok { color: #047857; border-color: #a7f3d0; background: #ecfdf5; }
  .status.error { color: #b91c1c; border-color: #fecaca; background: #fef2f2; }
  .status.warn { color: #b45309; border-color: #fde68a; background: #fffbeb; }
  .status.info, .status.neutral { color: #1d4ed8; border-color: #bfdbfe; background: #eff6ff; }
  .stats { display: flex; gap: 10px; margin-bottom: 20px; }
  .stat { flex: 1; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; }
  .stat span { display: block; font-size: 9px; text-transform: uppercase; letter-spacing: .08em; color: #6b7280; }
  .stat strong { font-size: 16px; }
  h2 { font-size: 13px; letter-spacing: .08em; text-transform: uppercase; color: #374151; margin: 22px 0 8px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 9px; letter-spacing: .07em; text-transform: uppercase; color: #6b7280; border-bottom: 1px solid #d1d5db; padding: 6px 6px; }
  td { padding: 7px 6px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
  td.price, th.price { text-align: right; white-space: nowrap; }
  td.cat { color: #6b7280; font-size: 10px; white-space: nowrap; }
  td .spec { display: block; color: #6b7280; font-size: 9.5px; }
  tfoot td { font-weight: 700; border-top: 2px solid #111827; border-bottom: none; font-size: 13px; }
  .check-list { list-style: none; padding: 0; margin: 0; }
  .check { border-left: 3px solid; padding: 7px 10px; margin-bottom: 6px; break-inside: avoid; }
  .check strong { display: block; font-size: 11px; }
  .check span { color: #4b5563; font-size: 10.5px; }
  .check--ok { border-color: #10b981; background: #f0fdf4; }
  .check--warn { border-color: #f59e0b; background: #fffbeb; }
  .check--error { border-color: #ef4444; background: #fef2f2; }
  .check--info { border-color: #3b82f6; background: #eff6ff; }
  .muted { color: #6b7280; }
  .notes { border-top: 1px solid #e5e7eb; margin-top: 22px; padding-top: 10px; color: #6b7280; font-size: 9.5px; }
  .notes p { margin: 3px 0; }
  ul.plain { margin: 0; padding-left: 16px; }
  @media print { .doc-bar { print-color-adjust: exact; -webkit-print-color-adjust: exact; } .status, .stat, .check { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
</style>
</head>
<body>
  <div class="doc-bar"></div>
  <div class="brand"><strong>PC Build Studio</strong><span>Build summary · ${escapeHtml(formatDate(new Date(), true))}</span></div>
  <h1>${escapeHtml(build.name)}</h1>
  <p class="subtitle">${rows.length} components selected${budget ? ` · Budget ${peso(budget)}` : ''}${missing.length ? ` · Missing: ${escapeHtml(missing.join(', '))}` : ''}</p>
  <span class="status ${escapeHtml(result.status === 'incompatible' ? 'error' : result.status === 'warning' ? 'warn' : result.status === 'compatible' ? 'ok' : 'info')}">${escapeHtml(printStatus(result))}</span>
  <div class="stats">
    <div class="stat"><span>Estimated total</span><strong>${peso(total)}</strong></div>
    <div class="stat"><span>Estimated peak draw</span><strong>${result.estimatedWattage} W</strong></div>
    <div class="stat"><span>Recommended PSU</span><strong>${result.recommendedPsu} W</strong></div>
    <div class="stat"><span>Compatibility issues</span><strong>${result.errors.length} errors · ${result.warnings.length} warnings</strong></div>
  </div>
  <h2>Component list</h2>
  <table>
    <thead><tr><th>Category</th><th>Component</th><th class="price">Est. price</th></tr></thead>
    <tbody>
      ${rows.length ? rows.map((row) => `
        <tr>
          <td class="cat">${escapeHtml(row.category)}</td>
          <td>${escapeHtml(row.name)}${row.specs ? `<span class="spec">${escapeHtml(row.specs)}</span>` : ''}</td>
          <td class="price">${peso(row.price)}</td>
        </tr>
      `).join('') : '<tr><td colspan="3" class="muted">No components selected.</td></tr>'}
    </tbody>
    <tfoot><tr><td colspan="2">Estimated total</td><td class="price">${peso(total)}</td></tr></tfoot>
  </table>
  <h2>Compatibility report</h2>
  ${checkList(result)}
  <div class="notes">
    <p><strong>About this document:</strong> Generated locally by PC Build Studio. ${priceDisclosure}</p>
    <p>Compatibility results are automatically derived from the specifications in the catalog. Verify final clearance, BIOS support, and power requirements with the manufacturer before purchasing.</p>
    <p>No account, server, or personal data is required — saved builds stay in this browser's local storage.</p>
  </div>
</body>
</html>`;
}

export function printBuildSummary(build) {
  const result = evaluateBuild(build);
  const html = buildPrintHTML(build, result);
  const frame = document.createElement('iframe');
  frame.setAttribute('title', 'Printable build summary');
  frame.style.position = 'fixed';
  frame.style.right = '0';
  frame.style.bottom = '0';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = '0';
  frame.style.opacity = '0';
  frame.style.pointerEvents = 'none';
  document.body.appendChild(frame);
  const cleanup = () => setTimeout(() => frame.remove(), 1500);
  frame.addEventListener('load', () => {
    setTimeout(() => {
      try {
        frame.contentWindow.focus();
        frame.contentWindow.print();
      } finally {
        cleanup();
      }
    }, 220);
  });
  frame.srcdoc = html;
  return true;
}

export function resolvePresetItems(preset) {
  return Object.values(preset.items).flat().map((id) => getHardware(id)).filter(Boolean);
}
