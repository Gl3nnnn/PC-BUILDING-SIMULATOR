import { getHardware } from '../data/hardware.js';
import { finishRepair, getLevelInfo, getRepaired } from '../core/career.js';
import { money } from '../core/currency.js';
import { initialiseLanguage, t } from '../core/settings.js';
import { sfx } from '../core/audio.js';
import { escapeHtml } from '../core/format.js';
import { icon } from '../ui/icons.js';
import { pageHeader, progressBar } from '../ui/common.js';
import { toast } from '../ui/toast.js';
import { repairsForLevel } from '../data/repairs.js';

function partName(id) {
  return getHardware(id)?.name || id;
}

function partsOf(repair) {
  return repair.parts.map((id) => ({ id, name: partName(id) }));
}

export function render(root) {
  initialiseLanguage();
  draw(root);
  return null;
}

function draw(root) {
  const level = getLevelInfo();
  const available = repairsForLevel(level.level);
  const solvedCount = available.filter((repair) => getRepaired(repair.id)).length;

  root.innerHTML = `
    <div class="page page--repair">
      ${pageHeader({
        eyebrow: escapeHtml(t('career')),
        title: `🔧 ${escapeHtml(t('repair'))}`,
        text: escapeHtml(t('repairsIntro')),
        actions: `<a class="btn btn--ghost" href="#/career">${icon('arrowRight', 15)}<span>${escapeHtml(t('career'))}</span></a>`,
      })}
      <div class="repair-grid">
        ${available.map((repair) => {
          const solved = getRepaired(repair.id);
          return `
            <article class="repair-card ${solved ? 'is-solved' : ''}" data-repair="${escapeHtml(repair.id)}">
              <div class="repair-head">
                <span class="badge ${solved ? 'badge--ok' : 'badge--warn'}">${solved ? escapeHtml(t('fixed')) : `Level ${repair.level}`}</span>
                <strong>${escapeHtml(repair.title)}</strong>
              </div>
              <p class="repair-symptom">${icon('info', 13)} ${escapeHtml(repair.symptom)}</p>
              <div class="repair-foot">
                <span>${icon('money', 13)} ${money(repair.payout)}</span>
                <span>${icon('cpu', 13)} ${repair.parts.length} parts inside</span>
                <button class="btn btn--primary btn--sm" type="button" data-diagnose="${escapeHtml(repair.id)}" ${solved ? 'disabled' : ''}>
                  ${icon('wrench', 14)}<span>${solved ? escapeHtml(t('fixed')) : escapeHtml(t('diagnose'))}</span>
                </button>
              </div>
            </article>
          `;
        }).join('')}
      </div>
      <section class="repair-progress">
        <h2>Diagnostics progress</h2>
        ${progressBar(solvedCount, available.length)}
        <p>Level ${level.level} · ${escapeHtml(level.title)} · ${available.length} cases on the bench</p>
      </section>
    </div>
  `;

  root.querySelectorAll('[data-diagnose]').forEach((button) => {
    button.addEventListener('click', () => openCase(root, button.dataset.diagnose));
  });
}

function openCase(root, id) {
  const repair = repairsForLevel(getLevelInfo().level).find((entry) => entry.id === id);
  if (!repair) return;
  const parts = partsOf(repair);
  const existing = root.querySelector('.repair-drawer');
  if (existing) existing.remove();

  let wrong = 0;
  let acted = false;

  const panel = document.createElement('div');
  panel.className = 'repair-drawer';
  panel.innerHTML = `
    <div class="repair-panel">
      <p class="eyebrow">${escapeHtml(repair.customer)}</p>
      <h2>${escapeHtml(repair.title)}</h2>
      <p class="repair-symptom">${icon('info', 14)} ${escapeHtml(repair.symptom)}</p>
      <h3>Quick tests</h3>
      <ul class="repair-clues">${repair.clues.map((clue) => `<li>${escapeHtml(clue)}</li>`).join('')}</ul>
      <h3>Swap a part</h3>
      <p class="form-hint">Click the part you believe is faulty. Every wrong swap costs ${money(300)}.</p>
      <div class="repair-parts">
        ${parts.map((part) => `<button class="repair-part" type="button" data-part="${escapeHtml(part.id)}">${icon('cpu', 14)}<span>${escapeHtml(part.name)}</span></button>`).join('')}
      </div>
      <div class="repair-actions">
        <button class="btn btn--ghost" type="button" data-close>${escapeHtml(t('close'))}</button>
      </div>
      <div class="repair-result" aria-live="polite"></div>
    </div>
  `;
  root.querySelector('.page--repair').appendChild(panel);

  const result = panel.querySelector('.repair-result');
  panel.querySelector('[data-close]').addEventListener('click', () => {
    panel.remove();
    draw(root);
  });

  panel.querySelectorAll('[data-part]').forEach((button) => {
    button.addEventListener('click', () => {
      if (acted) return;
      const partId = button.dataset.part;
      if (!repair.faults.includes(partId)) {
        wrong += 1;
        sfx.error();
        button.classList.add('is-wrong');
        button.disabled = true;
        result.innerHTML = `<p class="is-bad">${icon('x', 13)} ${escapeHtml(t('wrongPart'))} (−${money(300)})</p>`;
        setTimeout(() => {
          button.classList.remove('is-wrong');
          button.disabled = false;
        }, 1500);
        return;
      }
      acted = true;
      const paid = Math.max(0, repair.payout - wrong * 300);
      sfx.success();
      button.classList.add('is-fixed');
      const saved = finishRepair({ id: repair.id, payout: paid, stars: wrong === 0 ? 5 : wrong === 1 ? 4 : 3 });
      result.innerHTML = `
        <div class="repair-fixed">
          <h3>${icon('check', 16)} ${escapeHtml(t('repairDone'))}</h3>
          <p>${escapeHtml(repair.test)}</p>
          <div class="wb-payout">
            <div><span>${escapeHtml(t('payout'))}</span><strong>${money(saved?.payout || 0)}</strong></div>
            <div><span>${escapeHtml(t('mistakes'))}</span><strong>${wrong}</strong></div>
          </div>
        </div>
      `;
      panel.querySelectorAll('[data-part]').forEach((entry) => { entry.disabled = true; });
      toast(repair.test, 'success', { duration: 4200, title: t('fixed') });
    });
  });
}
