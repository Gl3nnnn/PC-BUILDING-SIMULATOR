/**
 * The mode switcher, rendered in the header and on the home page.
 *
 * Three modes, one control. Clicking a mode both records it as the active
 * preference and jumps to the page that mode belongs to, so the button always
 * does something visible.
 */

import { MODES, getActiveModeId } from '../core/mode.js';
import { icon } from './icons.js';
import { escapeHtml } from '../core/format.js';

export function modeSwitchHTML() {
  const active = getActiveModeId();
  return MODES.map((mode) => `
    <button
      class="mode-chip ${mode.id === active ? 'is-active' : ''}"
      type="button"
      data-action="set-mode"
      data-mode="${mode.id}"
      aria-pressed="${mode.id === active ? 'true' : 'false'}"
      title="${escapeHtml(mode.tagline)}"
    >${icon(mode.icon, 14)}<span>${escapeHtml(mode.title)}</span></button>
  `).join('');
}

export function modeCardsHTML() {
  const active = getActiveModeId();
  return MODES.map((mode) => `
    <article class="mode-card ${mode.id === active ? 'is-active' : ''}">
      <span class="mode-card-icon">${icon(mode.icon, 22)}</span>
      <div class="mode-card-body">
        <p class="mode-card-kicker">${escapeHtml(mode.tagline)}</p>
        <h3>${escapeHtml(mode.title)}</h3>
        <p>${escapeHtml(mode.blurb)}</p>
      </div>
      <a class="btn ${mode.id === active ? 'btn--primary' : 'btn--ghost'} btn--sm" href="${mode.route}" data-mode-link="${mode.id}">
        <span>${escapeHtml(mode.cta)}</span>${icon('arrowRight', 14)}
      </a>
    </article>
  `).join('');
}

export function hydrateModeSwitch(root) {
  const host = root?.querySelector?.('#mode-switch');
  if (host) host.innerHTML = modeSwitchHTML();
}
