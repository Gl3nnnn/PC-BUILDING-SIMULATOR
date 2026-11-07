import { escapeHtml } from '../core/format.js';
import { icon } from './icons.js';

export function emptyState({ iconName = 'database', title = 'Nothing here yet', text = '', action = '' }) {
  return `
    <div class="empty-state">
      <div class="empty-icon">${icon(iconName, 28)}</div>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(text)}</p>
      ${action ? `<div class="empty-action">${action}</div>` : ''}
    </div>
  `;
}

export function pageHeader({ eyebrow, title, text, actions = '' }) {
  return `
    <header class="page-head">
      <div>
        ${eyebrow ? `<p class="eyebrow">${escapeHtml(eyebrow)}</p>` : ''}
        <h1 class="page-title">${title}</h1>
        ${text ? `<p class="page-subtitle">${text}</p>` : ''}
      </div>
      ${actions ? `<div class="page-actions">${actions}</div>` : ''}
    </header>
  `;
}

export function progressBar(value, total, tone = 'accent') {
  const percent = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return `
    <div class="progress-track progress-track--${tone}">
      <div class="progress-fill" style="width:${percent}%"></div>
    </div>
  `;
}

export function inlineStat(label, value, iconName = 'dot') {
  return `
    <div class="inline-stat">
      <span class="inline-stat-icon">${icon(iconName, 15)}</span>
      <div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>
    </div>
  `;
}

export function selectOptions(items, selected, valueKey = 'id', labelKey = 'label') {
  return items.map((item) => `<option value="${escapeHtml(item[valueKey])}" ${item[valueKey] === selected ? 'selected' : ''}>${escapeHtml(item[labelKey])}</option>`).join('');
}

export function scrollToId(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
