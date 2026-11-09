import { HARDWARE_BY_ID } from '../data/hardware.js';
import { PRESETS } from '../data/presets.js';
import { store } from '../core/store.js';
import { evaluateBuild } from '../core/compat.js';
import { escapeHtml, peso } from '../core/format.js';
import { openModal, closeModal } from './modal.js';
import { icon } from './icons.js';
import { presetTotal } from './preset.js';
import { statusBadge } from './summary.js';
import { toast } from './toast.js';

const USES = [
  { id: 'office', label: 'Office & everyday', detail: 'Documents, browsing, calls', icon: 'monitor', niches: ['Office'] },
  { id: 'gaming', label: 'Gaming', detail: '1080p to 4K gaming', icon: 'gamepad', niches: ['Gaming'] },
  { id: 'creator', label: 'Content creation', detail: 'Streaming, editing, design', icon: 'sparkles', niches: ['Creator', 'Workstation'] },
  { id: 'workstation', label: 'Workstation', detail: '3D, AI, simulation', icon: 'cpu', niches: ['Workstation'] },
];

const FORM_FACTORS = ['Any size', 'ATX', 'Micro-ATX', 'Mini-ITX'];

function presetFormFactors(preset) {
  const caseItem = HARDWARE_BY_ID[preset.items.case?.[0]];
  return caseItem?.specs.supportedFormFactors || [];
}

function presetBuild(preset) {
  return { name: preset.name, items: preset.items, budget: null };
}

function scoredPresets(use, budget, size) {
  const selectedUse = USES.find((entry) => entry.id === use) || USES[1];
  return PRESETS
    .filter((preset) => selectedUse.niches.includes(preset.niche))
    .filter((preset) => size === 'Any size' || presetFormFactors(preset).includes(size))
    .map((preset) => {
      const total = presetTotal(preset);
      const overBudget = total > budget ? (total - budget) * 1.8 : 0;
      return {
        preset,
        total,
        status: evaluateBuild(presetBuild(preset)),
        score: Math.abs(total - budget) + overBudget,
      };
    })
    .sort((a, b) => a.score - b.score);
}

function recommendationHTML(entry) {
  if (!entry) {
    return `<div class="wizard-empty">${icon('search', 20)}<p>No preset matches that size. Choose “Any size” and try again.</p></div>`;
  }
  const { preset, total, status } = entry;
  const items = Object.values(preset.items).flat().map((id) => HARDWARE_BY_ID[id]).filter(Boolean);
  return `
    <div class="wizard-result" style="--preset-accent:${preset.accent}">
      <div class="wizard-result-head">
        <div>
          <p class="eyebrow">Recommended starting point</p>
          <h3>${escapeHtml(preset.name)}</h3>
          <p>${escapeHtml(preset.tagline)}</p>
        </div>
        ${statusBadge(status)}
      </div>
      <div class="wizard-result-meta">
        <div><span>Estimated total</span><strong>${peso(total)}</strong></div>
        <div><span>Parts</span><strong>${items.length}</strong></div>
        <div><span>Budget fit</span><strong>${total <= Number(document.querySelector('#wizard-budget')?.value || 0) ? 'Within budget' : 'Slightly over'}</strong></div>
      </div>
      <div class="wizard-chips">
        ${items.slice(0, 6).map((item) => `<span class="mini-chip">${escapeHtml(item.name)}</span>`).join('')}
      </div>
      <button class="btn btn--primary" type="button" data-wizard-load="${preset.id}">${icon('sparkles', 15)}<span>Load this baseline</span></button>
    </div>
  `;
}

export function openBuildWizard() {
  let use = 'gaming';
  let size = 'Any size';
  let budget = 60000;

  const overlay = openModal({
    title: 'Guided build setup',
    subtitle: 'Tell us how you will use the PC and your budget. We will recommend a compatible starting point you can customise part by part.',
    eyebrow: 'Wizard',
    size: 'md',
    body: `
      <div class="wizard">
        <div class="wizard-step">
          <span class="wizard-step-number">01</span>
          <div class="wizard-step-body">
            <h3>What will you do most?</h3>
            <div class="wizard-uses">
              ${USES.map((entry) => `
                <button class="wizard-use ${entry.id === use ? 'is-active' : ''}" type="button" data-wizard-use="${entry.id}">
                  ${icon(entry.icon, 18)}
                  <strong>${escapeHtml(entry.label)}</strong>
                  <span>${escapeHtml(entry.detail)}</span>
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="wizard-step">
          <span class="wizard-step-number">02</span>
          <div class="wizard-step-body">
            <h3>What is your budget?</h3>
            <label class="wizard-budget">
              <span>PHP</span>
              <input id="wizard-budget" type="number" min="0" step="500" value="${budget}" inputmode="numeric">
            </label>
            <div class="wizard-quick-budgets">
              ${[35000, 60000, 100000, 160000].map((amount) => `<button type="button" data-wizard-budget="${amount}">${peso(amount)}</button>`).join('')}
            </div>
          </div>
        </div>

        <div class="wizard-step">
          <span class="wizard-step-number">03</span>
          <div class="wizard-step-body">
            <h3>Preferred case size?</h3>
            <div class="wizard-sizes">
              ${FORM_FACTORS.map((entry) => `<button class="wizard-size ${entry === size ? 'is-active' : ''}" type="button" data-wizard-size="${escapeHtml(entry)}">${escapeHtml(entry)}</button>`).join('')}
            </div>
          </div>
        </div>

        <div id="wizard-result"></div>
      </div>
    `,
    footer: `<button class="btn btn--ghost" type="button" data-modal-close>Close</button>`,
  });

  const resultHost = overlay.querySelector('#wizard-result');
  const budgetInput = overlay.querySelector('#wizard-budget');

  function update() {
    budget = Math.max(0, Number(budgetInput.value) || 0);
    const matches = scoredPresets(use, budget, size);
    resultHost.innerHTML = recommendationHTML(matches[0]);
    overlay.querySelectorAll('[data-wizard-use]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.wizardUse === use);
    });
    overlay.querySelectorAll('[data-wizard-size]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.wizardSize === size);
    });
  }

  overlay.addEventListener('click', (event) => {
    const useButton = event.target.closest('[data-wizard-use]');
    if (useButton) {
      use = useButton.dataset.wizardUse;
      update();
      return;
    }
    const sizeButton = event.target.closest('[data-wizard-size]');
    if (sizeButton) {
      size = sizeButton.dataset.wizardSize;
      update();
      return;
    }
    const budgetButton = event.target.closest('[data-wizard-budget]');
    if (budgetButton) {
      budgetInput.value = budgetButton.dataset.wizardBudget;
      update();
      return;
    }
    const loadButton = event.target.closest('[data-wizard-load]');
    if (loadButton) {
      const id = loadButton.dataset.wizardLoad;
      if (store.loadPreset(id)) {
        closeModal();
        toast('Baseline loaded', 'Customise any part in the builder — compatibility updates automatically.', 'success');
        location.hash = '#/builder';
      }
    }
  });

  budgetInput.addEventListener('input', update);
  update();
}
