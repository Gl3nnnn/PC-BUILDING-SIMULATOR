import { escapeHtml } from '../core/format.js';
import { icon } from './icons.js';

let activeOverlay = null;
let activeOnClose = null;
let lastFocused = null;

export function openModal(options = {}) {
  closeModal();
  lastFocused = document.activeElement;
  const {
    title = '',
    subtitle = '',
    eyebrow = '',
    body = '',
    footer = '',
    size = 'md',
    className = '',
    onClose = null,
    dismissible = true,
  } = options;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal modal--${escapeHtml(size)} ${escapeHtml(className)}" role="dialog" aria-modal="true" aria-label="${escapeHtml(title || 'Dialog')}">
      <div class="modal-orb modal-orb--one"></div>
      <div class="modal-orb modal-orb--two"></div>
      <header class="modal-head">
        <div class="modal-head-text">
          ${eyebrow ? `<p class="eyebrow">${escapeHtml(eyebrow)}</p>` : ''}
          ${title ? `<h2 class="modal-title">${escapeHtml(title)}</h2>` : ''}
          ${subtitle ? `<p class="modal-subtitle">${escapeHtml(subtitle)}</p>` : ''}
        </div>
        ${dismissible ? `<button class="icon-btn modal-close" type="button" data-modal-close aria-label="Close dialog">${icon('close', 18)}</button>` : ''}
      </header>
      <div class="modal-body">${body}</div>
      ${footer ? `<footer class="modal-foot">${footer}</footer>` : ''}
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.classList.add('has-modal');
  requestAnimationFrame(() => overlay.classList.add('is-open'));

  activeOverlay = overlay;
  activeOnClose = onClose;

  const closeTargets = overlay.querySelectorAll('[data-modal-close]');
  closeTargets.forEach((button) => button.addEventListener('click', () => closeModal()));

  overlay.addEventListener('mousedown', (event) => {
    if (event.target === overlay && dismissible) closeModal();
  });

  const focusTarget = overlay.querySelector('[autofocus], input, select, textarea, button');
  if (focusTarget) setTimeout(() => focusTarget.focus(), 80);

  return overlay;
}

export function closeModal() {
  if (!activeOverlay) return;
  const overlay = activeOverlay;
  const onClose = activeOnClose;
  activeOverlay = null;
  activeOnClose = null;
  overlay.classList.remove('is-open');
  document.body.classList.remove('has-modal');
  setTimeout(() => overlay.remove(), 160);
  if (lastFocused && typeof lastFocused.focus === 'function') {
    setTimeout(() => lastFocused?.focus?.(), 60);
  }
  if (typeof onClose === 'function') onClose();
}

export function isModalOpen() {
  return Boolean(activeOverlay);
}

export function confirmDialog({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false }) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      closeModal();
      resolve(value);
    };
    const overlay = openModal({
      title,
      size: 'sm',
      body: `<p class="confirm-message">${escapeHtml(message)}</p>`,
      footer: `
        <button class="btn btn--ghost" type="button" data-confirm-cancel>${escapeHtml(cancelLabel)}</button>
        <button class="btn ${danger ? 'btn--danger' : 'btn--primary'}" type="button" data-confirm-ok>${escapeHtml(confirmLabel)}</button>
      `,
      onClose: () => finish(false),
    });
    overlay.querySelector('[data-confirm-cancel]')?.addEventListener('click', () => finish(false));
    overlay.querySelector('[data-confirm-ok]')?.addEventListener('click', () => finish(true));
    overlay.querySelector('[data-confirm-ok]')?.focus();
  });
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && activeOverlay) {
    event.preventDefault();
    closeModal();
  }
  if (event.key === 'Tab' && activeOverlay) {
    const focusable = [...activeOverlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
      .filter((element) => !element.disabled && element.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});
