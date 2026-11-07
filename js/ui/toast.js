import { escapeHtml } from '../core/format.js';
import { icon } from './icons.js';

const TONES = {
  success: { cls: 'toast--success', icon: 'check' },
  info: { cls: 'toast--info', icon: 'info' },
  warn: { cls: 'toast--warn', icon: 'alert' },
  error: { cls: 'toast--error', icon: 'x' },
};

function ensureContainer() {
  let container = document.querySelector('.toast-stack');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-stack';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'false');
    document.body.appendChild(container);
  }
  return container;
}

export function toast(message, tone = 'info', options = {}) {
  const container = ensureContainer();
  const meta = TONES[tone] || TONES.info;
  const el = document.createElement('div');
  el.className = `toast ${meta.cls}`;
  el.innerHTML = `
    <span class="toast-icon">${icon(meta.icon, 16)}</span>
    <div class="toast-copy">
      ${options.title ? `<strong>${escapeHtml(options.title)}</strong>` : ''}
      <span>${escapeHtml(message)}</span>
    </div>
    <button class="toast-close" type="button" aria-label="Dismiss notification">${icon('close', 14)}</button>
    <span class="toast-progress"></span>
  `;
  const remove = () => {
    if (!el.isConnected) return;
    el.classList.add('is-leaving');
    setTimeout(() => el.remove(), 220);
  };
  el.querySelector('.toast-close')?.addEventListener('click', remove);
  container.appendChild(el);
  while (container.children.length > 4) container.firstElementChild.remove();
  requestAnimationFrame(() => el.classList.add('is-visible'));
  let timer = setTimeout(remove, options.duration || 4200);
  el.addEventListener('mouseenter', () => clearTimeout(timer));
  el.addEventListener('mouseleave', () => {
    timer = setTimeout(remove, 1600);
  });
  return el;
}
