import { CATEGORIES, HARDWARE, getHardware } from '../data/hardware.js';
import { store, on } from '../core/store.js';
import { buildTotal, getIds, getItems, selectedCount } from '../core/build.js';
import { evaluateBuild } from '../core/compat.js';
import { escapeHtml, peso } from '../core/format.js';
import { icon } from '../ui/icons.js';
import { statusBadge } from '../ui/summary.js';
import { pageHeader } from '../ui/common.js';
import { toast } from '../ui/toast.js';
import { sfx } from '../core/audio.js';
import { createPCScene } from '../three/scene.js';
import { assemblyState, canInstall } from '../core/assembly.js';
import { CABLE_KINDS, cableState, connectCable } from '../core/cables.js';

/**
 * 3D PC Workshop.
 *
 * One screen holds the whole assembly: the rig on a workbench, a removable
 * side panel, a live bay list, and an inventory tray of parts you can drag onto
 * the bench. Dropping a part installs it into the build, which is the same
 * store the rest of the app reads, so the bay list, the price and the
 * compatibility badge all follow along.
 *
 * The panel state lives on the scene (not the store): it is a thing you do on
 * the bench, not part of the saved build.
 */

const BAYS = ['case', 'motherboard', 'cpu', 'cooler', 'ram', 'gpu', 'storage', 'psu', 'fans'];

// Cables are a bench action, like the side panel: they live on this page and
// not in the saved build, so swapping a part never silently invents a cable.
let connectedCables = [];
let armedCable = null;

// Parts worth dragging: the whole catalogue is too long, so the tray offers
// what actually makes a machine run, in the order you would install it.
function trayParts(build) {
  return HARDWARE.filter((item) => BAYS.includes(item.category));
}

function bayLabel(categoryId) {
  return CATEGORIES.find((entry) => entry.id === categoryId)?.label || categoryId;
}

function bayIcon(categoryId) {
  return CATEGORIES.find((entry) => entry.id === categoryId)?.icon || 'dot';
}

/**
 * The guided sequence: all fourteen steps in one rail, with the step you are on
 * opened up so it can explain itself. Every step also carries its bay, so
 * pressing one filters the tray to the part it wants.
 */
function stepRailHTML(build) {
  const assembly = assemblyState(build);
  const current = assembly.steps[assembly.currentIndex];
  const detail = current && current.detail ? current.detail(build) : [];
  const total = assembly.steps.length;
  const percent = Math.round((assembly.doneCount / total) * 100);
  return `
    <section class="ws-card ws-card--steps" data-ws-rail>
      <div class="ws-card__head">
        <h2>Assembly steps</h2>
        <span>${assembly.complete ? 'Ready for a boot test' : `Step ${current.index + 1} of ${total}`}</span>
      </div>
      <div class="ws-progress" role="presentation"><div class="ws-progress__fill" data-ws-step-progress style="width:${percent}%"></div></div>
      <ol class="ws-steps" data-ws-steps>
        ${assembly.steps.map((step) => {
          const isCurrent = step.id === current?.id && !assembly.complete;
          return `
            <li class="ws-step ${step.done ? 'is-done' : ''} ${isCurrent ? 'is-current' : ''}" data-ws-step="${escapeHtml(step.id)}" ${step.category ? `data-ws-step-cat="${escapeHtml(step.category)}"` : ''}>
              <button class="ws-step__row" type="button" aria-current="${isCurrent ? 'step' : 'false'}">
                <span class="ws-step__dot">${step.done ? '✓' : step.index + 1}</span>
                <span class="ws-step__title">${escapeHtml(step.title)}</span>
              </button>
              ${isCurrent ? `
                <div class="ws-step__open">
                  <p class="ws-step__ask">${escapeHtml(step.ask)}</p>
                  <p class="ws-step__why">${escapeHtml(step.why)}</p>
                  ${detail.length ? `<dl class="ws-step__specs">${detail.map(([label, value]) => `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`).join('')}</dl>` : ''}
                  <p class="ws-step__wait" data-ws-step-wait></p>
                </div>
              ` : ''}
            </li>
          `;
        }).join('')}
      </ol>
    </section>
  `;
}

function specLine(item) {
  if (!item) return '';
  const specs = item.specs || {};
  // Numbers only when the unit is obvious from the field: without it the tray
  // read "Graphics Card · 6" and "Memory · 32", which looks like a bug.
  const units = { vram: 'GB', capacity: 'GB', wattage: 'W', speed: 'MHz', tdp: 'W', length: 'mm' };
  return ['socket', 'chipset', 'type', 'capacity', 'vram', 'wattage', 'size', 'formFactor', 'speed']
    .filter((key) => specs[key] !== undefined && specs[key] !== null && specs[key] !== '')
    .slice(0, 3)
    .map((key) => `${specs[key]}${units[key] ? ` ${units[key]}` : ''}`)
    .join(' · ');
}

function baysHTML(build) {
  return BAYS.map((categoryId) => {
    const item = getItems(build, categoryId)[0];
    const filled = Boolean(item);
    return `
      <li class="ws-bay ${filled ? 'is-filled' : 'is-empty'}" title="${escapeHtml(item ? item.name : `${bayLabel(categoryId)} still empty`)}">
        <span class="ws-bay__mark">${filled ? '✓' : '+'}</span>
        <span class="ws-bay__label">${escapeHtml(bayLabel(categoryId))}</span>
        ${filled
          ? `<span class="ws-bay__item">${escapeHtml(item.name)}</span>`
          : '<span class="ws-bay__empty">Drop a part here</span>'}
      </li>
    `;
  }).join('');
}

function inventoryHTML(build, filter = 'all', assembly = null) {
  const parts = trayParts(build).filter((item) => filter === 'all' || item.category === filter);
  if (!parts.length) return '<li class="ws-empty">Nothing in this category.</li>';
  const current = assembly && !assembly.complete ? assembly.steps[assembly.currentIndex] : null;
  return parts.map((item) => {
    const installed = getIds(build, item.category).includes(item.id);
    // A part that cannot go in yet keeps its row, but the button says why: the
    // bench is on an earlier step. Blocking the drag reads as a dead app, so the
    // row stays live and the reason comes back in a sentence after the drop.
    const blocked = Boolean(current && !installed && current.category && current.category !== item.category
      && !['paste', 'cooler', 'power', 'front'].includes(current.id));
    return `
      <li class="ws-part ${installed ? 'is-installed' : ''} ${blocked ? 'is-early' : ''}" data-part-id="${escapeHtml(item.id)}" ${installed || blocked ? '' : 'draggable="true"'}>
        <span class="ws-part__icon">${icon(CATEGORIES.find((entry) => entry.id === item.category)?.icon || 'dot', 16)}</span>
        <div class="ws-part__copy">
          <strong>${escapeHtml(item.name)}</strong>
          <span>${escapeHtml(bayLabel(item.category))}${specLine(item) ? ` · ${escapeHtml(specLine(item))}` : ''}${blocked ? ' · not yet' : ''}</span>
        </div>
        <button class="ws-part__go" type="button" data-install="${escapeHtml(item.id)}">${installed ? 'In' : blocked ? 'Wait' : 'Install'}</button>
      </li>
    `;
  }).join('');
}

function cableCardHTML(build) {
  const state = cableState(build, connectedCables);
  if (!state.total) {
    return `
      <section class="ws-card ws-card--cables">
        <div class="ws-card__head"><h2>Cable management</h2><span>Nothing yet</span></div>
        <p class="ws-empty">Fit a board, a supply and a card first, then the cables this build needs appear here.</p>
      </section>
    `;
  }
  return `
    <section class="ws-card ws-card--cables">
      <div class="ws-card__head">
        <h2>Cable management</h2>
        <span data-ws-cable-count>${state.plugged} of ${state.total} plugged</span>
      </div>
      <div class="ws-progress" role="presentation"><div class="ws-progress__fill ws-progress__fill--cable" style="width:${(state.plugged / state.total) * 100}%"></div></div>
      <ul class="ws-cables" data-ws-cables>
        ${state.entries.map((entry) => `
          <li class="ws-cable ${entry.connected ? 'is-plugged' : ''} ${armedCable === entry.id ? 'is-armed' : ''}" data-cable-id="${escapeHtml(entry.id)}">
            <span class="ws-cable__mark">${entry.connected ? '✓' : '○'}</span>
            <div class="ws-cable__copy">
              <strong>${escapeHtml(entry.label)}</strong>
              <span>${escapeHtml(entry.from)} → ${escapeHtml(entry.to)}</span>
            </div>
            <button class="ws-cable__go" type="button" data-cable-plug="${escapeHtml(entry.id)}">${entry.connected ? 'Out' : 'Plug'}</button>
          </li>
        `).join('')}
      </ul>
      <p class="ws-cable__hint">${armedCable
        ? `Now click the glowing socket on the rig, or press Plug on this cable.`
        : `Pick a cable, then press its socket on the rig. A wrong socket is turned down with the reason.`}</p>
    </section>
  `;
}

function sideColumnHTML(build) {
  const result = evaluateBuild(build);
  const count = selectedCount(build);
  const required = ['case', 'motherboard', 'cpu', 'ram', 'storage', 'psu'];
  const done = required.filter((categoryId) => getItems(build, categoryId).length > 0).length;
  return `
    ${stepRailHTML(build)}
    ${cableCardHTML(build)}
    <section class="ws-card ws-card--bays">
      <div class="ws-card__head">
        <h2>Mount points</h2>
        <span data-ws-bay-count>${count} part${count === 1 ? '' : 's'} in the rig</span>
      </div>
      <div class="ws-progress" role="presentation"><div class="ws-progress__fill" data-ws-progress style="width:${(done / required.length) * 100}%"></div></div>
      <ul class="ws-bays" data-ws-bays>${baysHTML(build)}</ul>
    </section>

    <section class="ws-card ws-card--inventory">
      <div class="ws-card__head">
        <h2>Parts tray</h2>
        <span data-ws-price>${peso(buildTotal(build))}</span>
      </div>
      <div class="ws-tablist" role="tablist" aria-label="Filter the parts tray">
        <button class="ws-tab is-active" type="button" data-ws-filter="all" role="tab" aria-selected="true">All</button>
        ${BAYS.map((categoryId) => `<button class="ws-tab" type="button" data-ws-filter="${categoryId}" role="tab" aria-selected="false">${escapeHtml(bayLabel(categoryId))}</button>`).join('')}
      </div>
      <ul class="ws-inventory" data-ws-inventory>${inventoryHTML(build, 'all', assemblyState(build))}</ul>
    </section>

    <section class="ws-card">
      <div class="ws-card__head">
        <h2>Bench checks</h2>
        ${statusBadge(result)}
      </div>
      <div class="ws-bays">${(result.errors?.length || result.warnings?.length)
        ? `<p class="ws-empty">${escapeHtml((result.errors?.[0] || result.warnings?.[0])?.message || 'There is a problem with this build.')}</p>`
        : result.missing?.length
          ? `<p class="ws-empty">Still missing: ${escapeHtml(result.missing.map((entry) => bayLabel(entry.id || entry)).join(', '))}</p>`
          : '<p class="ws-empty">No problems found. Every part fits and the power supply has headroom.</p>'}</div>
      <div class="ws-panel-actions" style="display:flex;gap:6px;margin-top:10px">
        <a class="btn btn--ghost btn--sm" href="#/builder">${icon('wrench', 14)}<span>Builder</span></a>
        <a class="btn btn--ghost btn--sm" href="#/compatibility">${icon('shield', 14)}<span>Checks</span></a>
        <button class="btn btn--primary btn--sm" type="button" data-ws-view-boards">${icon('check', 14)}<span>Done</span></button>
      </div>
    </section>
  `;
}

export function render(root) {
  const build = store.getCurrent();
  const caseItem = getItems(build, 'case')[0];

  root.innerHTML = `
    <div class="workshop-page">
      ${pageHeader({
        eyebrow: 'Step-by-step build',
        title: '3D PC Workshop',
        text: 'Strip the case, drag parts in from the tray, and inspect any component by clicking it. Everything you install here goes straight into your build.',
        actions: `
          <a class="btn btn--ghost" href="#/visualizer">${icon('cube', 15)}<span>3D view</span></a>
          <button class="btn btn--primary" type="button" data-action="save-build">${icon('save', 15)}<span>Save build</span></button>
        `,
      })}

      <div class="ws-stage">
        <section class="ws-viewport" id="ws-viewport" aria-label="3D assembly workbench">
          <div class="ws-canvas" id="ws-canvas"></div>
          <div class="ws-baydrop" id="ws-baydrop" aria-hidden="true">
            <span class="ws-baydrop__ring"></span>
            <span class="ws-baydrop__text"></span>
          </div>
          <div class="ws-fps" id="ws-fps" title="Live frames per second">-- fps</div>
          <div class="ws-toolbar">
            <div class="ws-toolgroup" role="group" aria-label="Panels">
              <button class="ws-tool is-active" type="button" data-ws="panel" data-side="left" aria-pressed="true">${icon('panel', 15)}<span>Left panel</span></button>
              <button class="ws-tool is-active" type="button" data-ws="panel" data-side="right" aria-pressed="true">${icon('panel', 15)}<span>Glass panel</span></button>
              <button class="ws-tool is-active" type="button" data-ws="panel" data-side="top" aria-pressed="true">${icon('panel', 15)}<span>Roof</span></button>
            </div>
            <div class="ws-toolgroup" role="group" aria-label="Camera">
              <button class="ws-tool is-active" type="button" data-ws="view" data-angle="side">${icon('eye', 15)}<span>Side</span></button>
              <button class="ws-tool" type="button" data-ws="view" data-angle="front">Front</button>
              <button class="ws-tool" type="button" data-ws="view" data-angle="top">Top</button>
              <button class="ws-tool" type="button" data-ws="rotate" aria-pressed="false">${icon('rotate', 15)}</button>
            </div>
            <div class="ws-toolgroup" role="group" aria-label="Lighting">
              <button class="ws-tool is-active" type="button" data-ws="rgb" aria-pressed="true">${icon('sparkles', 15)}<span>RGB</span></button>
            </div>
          </div>

          <div class="ws-loading" id="ws-loading">
            <span class="ws-spinner" aria-hidden="true"></span>
            <p>Setting up the workbench…</p>
          </div>

          <div class="ws-inspect" id="ws-inspect" hidden></div>

          <div class="ws-hint">${icon('zoom', 14)}<span>Drag a part from the tray onto the bench to install it · drag the rig to orbit · click a part to inspect</span></div>
          <div class="ws-case-label">${icon('case', 13)}<span data-ws-case>${caseItem ? escapeHtml(caseItem.name) : 'No case selected'}</span></div>

          <div class="ws-dropveil" aria-hidden="true">
            ${icon('download', 26)}
            <span>Drop anywhere on the bench to install this part</span>
          </div>
        </section>

        <aside class="ws-side" id="ws-side">${sideColumnHTML(build)}</aside>
      </div>
    </div>
  `;

  const viewport = root.querySelector('#ws-viewport');
  const canvasBox = root.querySelector('#ws-canvas');
  const side = root.querySelector('#ws-side');
  const inspect = root.querySelector('#ws-inspect');
  const loading = root.querySelector('#ws-loading');

  let disposed = false;
  let sceneApi = null;
  let draggingPartId = null;
  connectedCables = [];
  armedCable = null;

  /* --- install / remove ---------------------------------------------------- */

  function installItem(itemId) {
    const item = getHardware(itemId);
    if (!item) return null;

    // The guided sequence decides first. A part that belongs to a later step is
    // turned down with the reason, in plain words, instead of silently landing
    // on the bench in an impossible order.
    const verdict = canInstall(store.getCurrent(), itemId);
    if (!verdict.ok) {
      sfx.error?.();
      toast(verdict.reason, 'warn', { duration: 5200, title: `Not yet: ${verdict.item?.name || 'this part'}` });
      return { action: 'blocked', item: verdict.item, reason: verdict.reason };
    }

    const result = store.addComponent(item.category, itemId);
    if (result.action === 'replaced') {
      sfx.install();
      toast(`${result.previous?.name || 'The old part'} swapped for ${item.name}.`, 'success', { duration: 2400 });
    } else if (result.action === 'added') {
      sfx.install();
      toast(`${item.name} installed.`, 'success', { duration: 2200 });
    } else if (result.action === 'removed') {
      sfx.remove();
      toast(`${item.name} removed.`, 'info', { duration: 2000 });
    }
    if (result.action !== 'invalid') {
      // Pop the part home in the scene, then re-mark the bay for the next step.
      sceneApi?.pulseInstall(itemId);
      syncAssembly();
    }
    return result;
  }

  /** Re-mark the bay for the step the build is on, and keep the rail honest. */
  function syncAssembly() {
    const build = store.getCurrent();
    const assembly = assemblyState(build);
    const current = assembly.complete ? null : assembly.steps[assembly.currentIndex];
    sceneApi?.setAssemblyStep(current?.id || '', { done: assembly.steps.filter((s) => s.done).map((s) => s.id) });
    const wait = root.querySelector('[data-ws-step-wait]');
    if (wait && current) {
      const have = current.category ? getItems(build, current.category)[0] : null;
      wait.textContent = have
        ? `Fitted: ${have.name}.`
        : `Waiting for: ${bayLabel(current.category || 'cpu')}. The tray is filtered to it.`;
    }
    return assembly;
  }

  function refreshSide() {
    const current = store.getCurrent();
    if (!side.isConnected) return;
    side.innerHTML = sideColumnHTML(current);
    // The scene rebuild keeps its own panel state, so match the buttons to it.
    syncPanelButtons();
    // Keep the tray on the filter the user picked: repainting the whole column
    // must not silently jump back to All.
    const activeTab = side.querySelector(`[data-ws-filter="${trayFilter}"]`);
    if (activeTab && trayFilter !== 'all') {
      side.querySelectorAll('[data-ws-filter]').forEach((button) => {
        const on = button === activeTab;
        button.classList.toggle('is-active', on);
        button.setAttribute('aria-selected', String(on));
      });
    }
    paintTray();
    syncAssembly();
    const caseItem = getItems(current, 'case')[0];
    const caseLabel = root.querySelector('[data-ws-case]');
    if (caseLabel) caseLabel.textContent = caseItem ? caseItem.name : 'No case selected';
  }

  /* --- cables -------------------------------------------------------------- */

  /** Drop cables the build no longer needs, and redraw what is left. */
  function syncCables() {
    const build = store.getCurrent();
    const needed = CABLE_KINDS.filter((kind) => kind.needs(build)).map((kind) => kind.id);
    connectedCables = connectedCables.filter((id) => needed.includes(id));
    if (armedCable && !needed.includes(armedCable)) armedCable = null;
    sceneApi?.setCables(connectedCables);
    const armed = armedCable ? portsFor(armedCable).map((port) => port.id) : [];
    sceneApi?.setCablePorts(armed);
  }

  function portsFor(cableId) {
    const kind = CABLE_KINDS.find((entry) => entry.id === cableId);
    if (!kind) return [];
    return [{ id: kind.fromPort }, { id: kind.toPort }].filter((port) => port.id);
  }

  function armCable(cableId) {
    armedCable = armedCable === cableId ? null : cableId;
    // Paint the rows straight from the DOM rather than re-rendering the whole
    // column: a full repaint dropped the armed class on the way through.
    side.querySelectorAll('[data-cable-id]').forEach((row) => {
      row.classList.toggle('is-armed', row.dataset.cableId === armedCable);
    });
    const hint = side.querySelector('.ws-cable__hint');
    if (hint) {
      const kind = armedCable ? CABLE_KINDS.find((entry) => entry.id === armedCable) : null;
      hint.textContent = kind
        ? `${kind.label} is in your hand: press its glowing socket on the rig, or press Plug to land it. ${kind.why}`
        : 'Pick a cable, then press its socket on the rig. A wrong socket is turned down with the reason.';
    }
    syncCables();
    sfx.pick?.();
  }

  /** Plug a cable, by name, into the socket the user clicked (or straight in). */
  function plugCable(cableId, portId = null) {
    const verdict = connectCable(store.getCurrent(), connectedCables, cableId, portId);
    if (!verdict.ok) {
      sfx.error?.();
      toast(verdict.reason, 'warn', { duration: 5000, title: 'Wrong socket' });
      return false;
    }
    connectedCables = [...connectedCables, cableId];
    armedCable = null;
    sfx.install();
    toast(`${verdict.kind.label} plugged in.`, 'success', { duration: 2200 });
    syncCables();
    refreshSide();
    return true;
  }

  function unplugCable(cableId) {
    connectedCables = connectedCables.filter((id) => id !== cableId);
    if (armedCable === cableId) armedCable = null;
    sfx.remove?.();
    syncCables();
    refreshSide();
  }

  /* --- inspect card -------------------------------------------------------- */

  const INSPECT_REPORTS = {
    case: 'The case sets what fits: board form factor, card length and cooler height all depend on it.',
    motherboard: 'The board is the spine of the rig. Its socket decides the CPU and its chipset decides which features you get.',
    cpu: 'The processor must match the socket and the board chipset. Its power draw is what the cooler has to handle.',
    cooler: 'A cooler clears the case and keeps the CPU in check. Tall air towers can block tall memory.',
    ram: 'Memory must match the board generation. Two sticks instead of one is what makes dual channel pay off.',
    gpu: 'The graphics card sets gaming performance. Check its length against the case limit and its draw against the supply.',
    storage: 'An NVMe drive reads far faster than a SATA one. Either way, it needs a matching slot on the board.',
    psu: 'The supply has to cover peak draw with headroom. Aim for a supply that is about a third bigger than the build needs.',
    fans: 'Case fans decide how quickly hot air leaves. Front intake in, rear exhaust out.',
  };

  function showInspect(itemId) {
    const item = getHardware(itemId);
    if (!item || !inspect) return;
    const specs = item.specs || {};
    const rows = [
      ['Category', bayLabel(item.category)],
      ['Brand', item.brand || '—'],
      ['Price', peso(item.price)],
    ];
    Object.entries(specs).slice(0, 5).forEach(([key, value]) => {
      if (value === null || value === undefined || Array.isArray(value)) return;
      const units = { vram: 'GB', capacity: 'GB', wattage: 'W', speed: 'MHz', tdp: 'W', length: 'mm', height: 'mm' };
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase());
      rows.push([label, `${value}${units[key] ? ` ${units[key]}` : ''}`]);
    });
    inspect.innerHTML = `
      <p class="ws-inspect__eyebrow">${icon('eye', 12)}<span>Inspecting</span></p>
      <h3>${escapeHtml(item.name)}</h3>
      <dl>${rows.map(([label, value]) => `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`).join('')}</dl>
      <p class="ws-inspect__note" style="margin:9px 0 0;font-size:11.5px;line-height:1.45;color:#8b9cb8">${escapeHtml(INSPECT_REPORTS[item.category] || '')}</p>
      <div class="ws-inspect__actions">
        <button class="btn btn--ghost btn--sm" type="button" data-ws-inspect-close>${icon('close', 13)}<span>Close</span></button>
        <a class="btn btn--primary btn--sm" href="#/builder?cat=${encodeURIComponent(item.category)}">${icon('wrench', 13)}<span>Change</span></a>
      </div>
    `;
    inspect.hidden = false;
  }

  function hideInspect() {
    if (inspect) inspect.hidden = true;
  }

  /* --- panel toggles ------------------------------------------------------- */

  function syncPanelButtons() {
    root.querySelectorAll('[data-ws="panel"]').forEach((button) => {
      const side = button.dataset.side;
      const attached = sceneApi ? sceneApi.panelState(side) : true;
      button.classList.toggle('is-active', attached);
      button.setAttribute('aria-pressed', String(attached));
    });
  }

  /* --- bay targeting ------------------------------------------------------- */

  const bayDrop = root.querySelector('#ws-baydrop');
  const bayDropText = bayDrop?.querySelector('.ws-baydrop__text');
  const bayDropRing = bayDrop?.querySelector('.ws-baydrop__ring');

  /** Which bay is the pointer over, if any. Sizes are in canvas pixels. */
  function bayUnderPointer(event) {
    if (!sceneApi || typeof sceneApi.bayScreenPositions !== 'function') return null;
    const box = canvasBox.getBoundingClientRect();
    const x = event.clientX - box.left;
    const y = event.clientY - box.top;
    let best = null;
    let bestGap = Infinity;
    for (const bay of sceneApi.bayScreenPositions()) {
      if (bay.behind) continue;
      // The glow is what the user aims at, so the ring is given a generous
      // margin in pixels; a ring a few pixels wide would be unhittable.
      const gap = Math.hypot(bay.x - x, bay.y - y) - Math.max(48, bay.radius * 900);
      if (gap < bestGap) {
        bestGap = gap;
        best = bay;
      }
    }
    return best && bestGap <= 0 ? best : null;
  }

  /** Draw the drop halo and its label while a part hovers over a bay. */
  function paintDropTarget(event) {
    const bay = bayUnderPointer(event);
    if (!bay || !bayDrop) {
      hideDropTarget();
      return;
    }
    const step = assemblyState(store.getCurrent()).steps.find((entry) => entry.id === bay.id);
    const item = draggingPartId ? getHardware(draggingPartId) : null;
    const wanted = step?.category || null;
    const fits = !wanted || (item && item.category === wanted);
    bayDrop.classList.add('is-on');
    bayDrop.classList.toggle('is-bad', !fits);
    bayDrop.style.left = `${bay.x}px`;
    bayDrop.style.top = `${bay.y}px`;
    bayDrop.style.width = `${Math.max(96, bay.radius * 1500)}px`;
    bayDrop.style.height = `${Math.max(96, bay.radius * 1500)}px`;
    if (bayDropRing) bayDropRing.style.setProperty('--drop-tint', fits ? '#38bdf8' : '#f59e0b');
    if (bayDropText) {
      // On a good bay the label also names the part's headline numbers, so the
      // drop point doubles as the spec hint while you hold the part.
      const spec = item ? specLine(item) : '';
      bayDropText.textContent = fits
        ? `Drop here: ${bayLabel(wanted || item?.category || 'cpu')}${spec ? ` · ${spec}` : ''}`
        : `This bay takes the ${bayLabel(wanted)}`;
    }
  }

  function hideDropTarget() {
    if (!bayDrop) return;
    bayDrop.classList.remove('is-on', 'is-bad');
  }

  /* --- frames per second --------------------------------------------------- */

  let fpsTimer = null;
  function startFpsWatch() {
    if (fpsTimer || !sceneApi || typeof sceneApi.getFps !== 'function') return;
    const badge = root.querySelector('#ws-fps');
    if (!badge) return;
    fpsTimer = setInterval(() => {
      const fps = sceneApi.getFps();
      if (!fps) return;
      badge.textContent = `${fps} fps`;
      // Colour by how the frame rate reads in the hand, not by a fixed target:
      // 50 and up is smooth, 30-49 is usable, below that is worth telling.
      badge.classList.toggle('is-low', fps < 30);
      badge.classList.toggle('is-mid', fps >= 30 && fps < 50);
    }, 700);
  }

  /* --- pointer drag from the tray ------------------------------------------ */

  side.addEventListener('dragstart', (event) => {
    const row = event.target.closest('[data-part-id]');
    if (!row || row.classList.contains('is-installed') || row.classList.contains('is-early')) {
      event.preventDefault();
      return;
    }
    draggingPartId = row.dataset.partId;
    row.classList.add('is-dragging');
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('text/plain', draggingPartId);
    viewport.classList.add('is-dropping');
  });

  side.addEventListener('dragend', () => {
    draggingPartId = null;
    viewport.classList.remove('is-dropping');
    side.querySelectorAll('.ws-part.is-dragging').forEach((row) => row.classList.remove('is-dragging'));
  });

  viewport.addEventListener('dragover', (event) => {
    if (!draggingPartId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    paintDropTarget(event);
  });

  viewport.addEventListener('dragleave', (event) => {
    if (event.target === viewport) {
      viewport.classList.remove('is-dropping');
      hideDropTarget();
    }
  });

  viewport.addEventListener('drop', (event) => {
    event.preventDefault();
    viewport.classList.remove('is-dropping');
    const itemId = event.dataTransfer.getData('text/plain') || draggingPartId;
    const bay = bayUnderPointer(event);
    hideDropTarget();
    if (!itemId) return;
    // A part dropped on the wrong bay is turned down in words, so the bench
    // teaches where each part goes instead of silently accepting anything.
    const build = store.getCurrent();
    const assembly = assemblyState(build);
    const step = assembly.complete ? null : assembly.steps.find((entry) => entry.id === bay?.id);
    const item = getHardware(itemId);
    if (step && step.category && item && item.category !== step.category) {
      sfx.error?.();
      toast(`That bay takes the ${bayLabel(step.category)}. ${item.name} is a ${bayLabel(item.category)}.`, 'warn', {
        duration: 5200,
        title: 'Wrong bay',
      });
      return;
    }
    const result = installItem(itemId);
    if (result?.item) showInspect(itemId);
    // The halo collapses into the bay it just filled, so the successful drop
    // ends with a snap instead of the marker vanishing mid-animation.
    if (bay && bayDrop && result?.action && result.action !== 'blocked' && result.action !== 'invalid') {
      bayDrop.classList.add('is-snap');
      setTimeout(() => {
        bayDrop.classList.remove('is-snap', 'is-on');
      }, 420);
    }
  });

  /* --- clicks -------------------------------------------------------------- */

  let trayFilter = 'all';

  function paintTray() {
    const list = side.querySelector('[data-ws-inventory]');
    if (list) list.innerHTML = inventoryHTML(store.getCurrent(), trayFilter, assemblyState(store.getCurrent()));
  }

  root.addEventListener('click', (event) => {
    // Pressing a step opens it and points the tray at the part it wants, so the
    // rail is a way to jump to a job rather than a list to read.
    const stepRow = event.target.closest('.ws-step__row');
    if (stepRow) {
      const step = stepRow.closest('[data-ws-step]');
      const category = step?.dataset.wsStepCat;
      if (category) {
        trayFilter = category;
        side.querySelectorAll('[data-ws-filter]').forEach((button) => {
          const on = button.dataset.wsFilter === category;
          button.classList.toggle('is-active', on);
          button.setAttribute('aria-selected', String(on));
        });
        paintTray();
        sfx.click();
      }
      return;
    }

    if (event.target.closest('[data-ws-inspect-close]')) {
      hideInspect();
      event.preventDefault();
      return;
    }

    const installButton = event.target.closest('[data-install]');
    if (installButton) {
      installItem(installButton.dataset.install);
      return;
    }

    const filterButton = event.target.closest('[data-ws-filter]');
    if (filterButton) {
      trayFilter = filterButton.dataset.wsFilter || 'all';
      side.querySelectorAll('[data-ws-filter]').forEach((button) => {
        const on = button === filterButton;
        button.classList.toggle('is-active', on);
        button.setAttribute('aria-selected', String(on));
      });
      paintTray();
      return;
    }

    // A cable row arms that cable; its Plug button lands it straight in.
    const cableRow = event.target.closest('[data-cable-id]');
    const plugButton = event.target.closest('[data-cable-plug]');
    if (plugButton) {
      const cableId = plugButton.dataset.cablePlug;
      if (connectedCables.includes(cableId)) unplugCable(cableId);
      else plugCable(cableId);
      return;
    }
    if (cableRow) {
      armCable(cableRow.dataset.cableId);
      return;
    }

    const tool = event.target.closest('[data-ws]');
    if (tool) {
      const action = tool.dataset.ws;
      if (action === 'panel') {
        const attached = sceneApi ? sceneApi.togglePanel(tool.dataset.side) : true;
        tool.classList.toggle('is-active', attached);
        tool.setAttribute('aria-pressed', String(attached));
        sfx.click();
      } else if (action === 'view') {
        root.querySelectorAll('[data-ws="view"]').forEach((button) => button.classList.toggle('is-active', button === tool));
        sceneApi?.setAutoRotate(false);
        root.querySelector('[data-ws="rotate"]')?.setAttribute('aria-pressed', 'false');
        root.querySelector('[data-ws="rotate"]')?.classList.remove('is-active');
        sceneApi?.setView(tool.dataset.angle || 'side');
      } else if (action === 'rotate') {
        const on = tool.getAttribute('aria-pressed') !== 'true';
        tool.setAttribute('aria-pressed', String(on));
        tool.classList.toggle('is-active', on);
        sceneApi?.setAutoRotate(on);
      } else if (action === 'rgb') {
        const on = tool.getAttribute('aria-pressed') !== 'true';
        tool.setAttribute('aria-pressed', String(on));
        tool.classList.toggle('is-active', on);
        sceneApi?.setRGB(on);
      }
      return;
    }

    if (event.target.closest('[data-ws-view-boards]')) {
      location.hash = '#/performance';
    }
  });

  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      if (!inspect.hidden) hideInspect();
      else if (armedCable) armCable(armedCable);
    }
  };
  document.addEventListener('keydown', onKeyDown);

  /* --- scene --------------------------------------------------------------- */

  async function bootScene() {
    try {
      sceneApi = createPCScene(canvasBox, {
        workbench: true,
        autoRotate: false,
        build: store.getCurrent(),
        onPick: (itemId) => {
          if (itemId) {
            showInspect(itemId);
            sfx.pick();
          } else {
            hideInspect();
          }
        },
        // Pressing a glowing socket on the rig lands the armed cable in it, or
        // explains why that socket is the wrong one.
        onPortPick: (portId) => {
          if (!armedCable) {
            toast('Pick a cable in the list first, then press its socket.', 'info', { duration: 3200 });
            return;
          }
          plugCable(armedCable, portId);
        },
      });
      loading.hidden = true;
      syncPanelButtons();
      // Start with the glass off: the whole point of the workshop is that you
      // can see (and reach) the inside of the case.
      sceneApi.setPanel('right', false);
      syncPanelButtons();
      // Mark the bay for the step the build is on, straight away.
      syncAssembly();
      syncCables();
      startFpsWatch();
    } catch (error) {
      console.error(error);
      loading.innerHTML = `<p>This browser could not start the 3D workbench.</p><p style="font-size:12px;color:#8496b2">WebGL is needed for the 3D view. Try Simplified graphics in Settings, or keep building with the parts tray - it works either way.</p><a class="btn btn--ghost btn--sm" href="#/data" style="margin-top:10px;display:inline-flex">Graphics settings</a>`;
    }
  }

  bootScene();

  const unsubscribe = on('build', () => {
    const current = store.getCurrent();
    refreshSide();
    if (sceneApi) sceneApi.updateBuild(current);
    // A swapped part can change which cables the build needs (a card that wants
    // 12V-2x6, a SATA drive, a liquid cooler), so re-check the list after it.
    syncCables();
  });

  return () => {
    disposed = true;
    unsubscribe();
    document.removeEventListener('keydown', onKeyDown);
    if (fpsTimer) clearInterval(fpsTimer);
    fpsTimer = null;
    sceneApi?.dispose();
    sceneApi = null;
  };
}
