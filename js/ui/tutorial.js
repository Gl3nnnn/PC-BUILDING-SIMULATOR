import { initialiseLanguage, t } from '../core/settings.js';
import { icon } from './icons.js';
import { openModal } from './modal.js';

const STEPS = [
  {
    title: t('tutorialStep1'),
    text: 'Every customer writes a brief: a budget, a job, and a few wishes. Pick one from the workshop. You start with a small wallet, so reputation is your first currency.',
    art: '📋',
  },
  {
    title: t('tutorialStep2'),
    text: 'Build the PC inside the customer budget using the normal builder. The compatibility checker, FPS estimator and noise figures all still apply - the customer notices everything.',
    art: '🧩',
  },
  {
    title: t('tutorialStep3'),
    text: 'On the workbench you install each part into the right bay. Wrong bay, wrong order, wrong part: every mistake costs a star. Cable routing comes last.',
    art: '🔧',
  },
  {
    title: t('tutorialStep4'),
    text: 'Press the power button. The POST screen tells you what is wrong. Fix it, then hand the PC over - the customer rates it out of five and pays a share of the fee.',
    art: '⭐',
  },
];

export function openTutorial() {
  initialiseLanguage();
  let index = 0;
  let overlay = null;

  const next = () => {
    if (index < STEPS.length - 1) {
      index += 1;
      paint();
      return;
    }
    overlay?.querySelector('[data-modal-close]')?.click();
  };

  function paint() {
    const step = STEPS[index];
    const rootEl = overlay.querySelector('#tut-root');
    rootEl.innerHTML = `
      <div class="tut-step">
        <div class="tut-art" aria-hidden="true">${step.art}</div>
        <p class="eyebrow">Step ${index + 1} of ${STEPS.length}</p>
        <h3>${step.title}</h3>
        <p>${step.text}</p>
        <div class="tut-dots">${STEPS.map((_, dot) => `<span class="tut-dot ${dot === index ? 'is-on' : ''}"></span>`).join('')}</div>
      </div>
    `;
  }

  overlay = openModal({
    title: t('tutorial'),
    eyebrow: 'Four steps',
    size: 'md',
    body: '<div id="tut-root"></div>',
    footer: `
      <button class="btn btn--ghost" type="button" data-modal-close>${t('close')}</button>
      <button class="btn btn--primary" type="button" id="tut-next">${icon('arrowRight', 15)}<span>${t('next')}</span></button>
    `,
  });

  overlay.querySelector('#tut-next')?.addEventListener('click', next);
  paint();
  return overlay;
}
