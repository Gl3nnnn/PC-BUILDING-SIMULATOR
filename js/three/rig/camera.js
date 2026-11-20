// Camera controls for the 3D rig: orbit, zoom, named angles, and picking.
//
// The rig is not free-flying: the camera always looks at the case from a
// distance that keeps the whole chassis inside the frame, whatever shape the
// panel is. Keeping that maths in one module means a page cannot break the
// framing by asking for a view one property at a time.
import * as THREE from 'three';

/** How far back the camera sits, per canvas shape. */
export function defaultRadius(container) {
  const width = container.clientWidth || 720;
  const height = container.clientHeight || 560;
  const aspect = width / height;
  // Framing leaves a margin all round: at a closer distance the case edges
  // were clipped by the canvas on tall, narrow panels.
  if (aspect < 0.82) return 3.2;
  if (aspect < 1.15) return 3.05;
  return 2.9;
}

/**
 * Wire orbit, zoom, angle presets and click-picking to one canvas.
 *
 * @param {object} args
 * @param {HTMLElement} args.container  The element the canvas fills.
 * @param {THREE.WebGLRenderer} args.renderer
 * @param {THREE.PerspectiveCamera} args.camera
 * @param {object} args.view    Live orbit state { theta, phi, radius, targets }.
 * @param {object} args.state   Scene state, for drag and idle bookkeeping.
 * @param {object} args.options createPCScene options (onPick, onPortPick).
 * @param {Function} args.targets Returns the groups a click may hit.
 */
export function createRigControls({ container, renderer, camera, view, state, options, targets }) {
  const home = { theta: view.theta, phi: view.phi };

  // Named camera angles: reach a look in one press instead of a long drag.
  // Each preset only sets the orbit angles; the distance comes from defaultRadius.
  const VIEW_PRESETS = {
    side: { theta: home.theta, phi: home.phi },
    front: { theta: Math.PI, phi: 1.28 },
    rear: { theta: 0, phi: 1.28 },
    top: { theta: 1.42, phi: 0.46 },
  };

  function resetView() {
    view.userZoom = false;
    view.targetTheta = home.theta;
    view.targetPhi = home.phi;
    view.targetRadius = defaultRadius(container);
    state.lastInteraction = 0;
  }

  function setView(name) {
    const preset = VIEW_PRESETS[name];
    if (!preset) return;
    view.userZoom = false;
    view.targetTheta = preset.theta;
    view.targetPhi = preset.phi;
    view.targetRadius = defaultRadius(container);
    state.lastInteraction = 0;
  }

  function zoom(factor) {
    view.userZoom = true;
    view.targetRadius = THREE.MathUtils.clamp(view.targetRadius * factor, 2.05, 6.4);
    state.lastInteraction = performance.now();
  }

  function resize() {
    const width = container.clientWidth || 720;
    const height = container.clientHeight || 560;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (!view.userZoom) view.targetRadius = defaultRadius(container);
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  function updateCamera() {
    const sinPhi = Math.sin(view.phi);
    camera.position.set(
      view.radius * sinPhi * Math.sin(view.theta),
      view.radius * Math.cos(view.phi) + 0.03,
      view.radius * sinPhi * Math.cos(view.theta),
    );
    camera.lookAt(0, 0.03, 0);
  }

  let pointerId = null;
  let lastX = 0;
  let lastY = 0;
  let pressX = 0;
  let pressY = 0;
  // Click-to-inspect: a press that barely moves is a pick, a press that travels
  // is a camera drag. Parts are tagged with their catalogue id at build time.
  const raycaster = new THREE.Raycaster();
  const pointerNdc = new THREE.Vector2();

  function pickAt(clientX, clientY) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointerNdc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointerNdc, camera);
    const { portGroup, partsGroup, caseGroup, rootGroup } = targets();
    // Sockets come first: they are small glowing discs in front of the parts,
    // so a cable press always lands on the connector it was aimed at.
    if (portGroup.visible) {
      const portHits = raycaster.intersectObjects(portGroup.children, false);
      for (const hit of portHits) {
        if (hit.object.userData?.portId) return { portId: hit.object.userData.portId, partId: null };
      }
    }
    const hits = raycaster.intersectObjects([partsGroup, caseGroup], true);
    for (const hit of hits) {
      let node = hit.object;
      while (node) {
        if (node.userData && node.userData.partId) return { portId: null, partId: node.userData.partId };
        if (node === rootGroup) break;
        node = node.parent;
      }
    }
    return { portId: null, partId: null };
  }

  function onPointerDown(event) {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    pointerId = event.pointerId;
    state.dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    pressX = event.clientX;
    pressY = event.clientY;
    state.lastInteraction = performance.now();
    renderer.domElement.setPointerCapture(event.pointerId);
    renderer.domElement.classList.add('is-grabbing');
  }

  function onPointerMove(event) {
    if (!state.dragging || event.pointerId !== pointerId) return;
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
    view.targetTheta -= dx * 0.0055;
    view.targetPhi = THREE.MathUtils.clamp(view.targetPhi - dy * 0.0045, 0.34, 2.1);
    state.lastInteraction = performance.now();
  }

  function onPointerUp(event) {
    if (event.pointerId !== pointerId) return;
    state.dragging = false;
    pointerId = null;
    renderer.domElement.classList.remove('is-grabbing');
    state.lastInteraction = performance.now();
    const travelled = Math.abs(event.clientX - pressX) + Math.abs(event.clientY - pressY);
    if (travelled < 6) {
      const pick = pickAt(event.clientX, event.clientY);
      if (pick.portId && typeof options.onPortPick === 'function') {
        options.onPortPick(pick.portId);
      } else if (typeof options.onPick === 'function') {
        options.onPick(pick.partId);
      }
    }
  }

  function onWheel(event) {
    event.preventDefault();
    view.userZoom = true;
    view.targetRadius = THREE.MathUtils.clamp(view.targetRadius + event.deltaY * 0.0016, 2.05, 6.4);
    state.lastInteraction = performance.now();
  }

  const canvas = renderer.domElement;
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });

  return {
    resetView,
    setView,
    zoom,
    resize,
    updateCamera,
    pickAt,
    home,
    presets: VIEW_PRESETS,
    dispose() {
      resizeObserver.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
    },
  };
}
