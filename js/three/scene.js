import * as THREE from 'three';
import { getItems } from '../core/build.js';
import { brandStyle, brandPlate, brandHub, brandLogo, memoryStyle, coolerFinish, gpuSeries } from './brands.js';
import { createSurfaceKit } from './rig/surfaces.js';
import { createRigControls } from './rig/camera.js';
import { buildGLB } from './rig/export-glb.js';
import { createFanKit } from './rig/fan.js';
import { getSettings } from '../core/settings.js';
import {
  buildCaseModel,
  buildMotherboardModel,
  buildCoolingModel,
  buildMemoryModel,
  buildGpuModel,
  buildPowerModel,
  buildFansModel,
} from './rig/parts/index.js';

// Width is deliberately tight against the build: the hardware cluster spans
// about 0.29 across, so anything wider left a wall of empty glass on one side
// and the board looked shoved into a corner.
// Composition pass: the box was both wider and deeper than the hardware it
// holds, so the card floated over a void under it and the front panel sat a
// long way from the parts. Sized so the board, card and intakes fill it.
const CASE_W = 0.6;
const CASE_H = 1.34;
const CASE_D = 0.88;
const PLATFORM_Y = -0.86;
const BOARD_X = -CASE_W / 2 + 0.08;
const BOARD_Y = 0.09;
const BOARD_H = 0.56;
const BOARD_D = 0.58;
const BOARD_REAR_Z = -CASE_D / 2 + 0.075;
const BOARD_FRONT_Z = BOARD_REAR_Z + BOARD_D;
// The socket sits above the board's middle, so the tower cooler has room to
// rise and the memory bank lands level with the top of the graphics card.
const CPU_Y = 0.26;
// The socket sat in the board's far rear corner, so the CPU and its cooler
// bunched up top-left behind the glass and read as off-centre. It now sits at
// the middle of the board's depth, which is where the eye expects the chip.
const CPU_Z = BOARD_REAR_Z + 0.27;
// Four DIMM channels, 4.8 cm apart, starting just in front of the socket.
const DIMM_Z0 = CPU_Z + 0.11;
const DIMM_PITCH = 0.044;
// Sits on the board's PCIe slot, which is at -0.115, and clears the shroud
// lid: it used to hang over a 20 cm void of empty glass and the rig looked
// hollow underneath.
const GPU_Y = -0.005;
const GPU_REAR_Z = BOARD_REAR_Z - 0.035;
const SIZE_SCALE = { SFF: 0.82, 'Mid Tower': 1, 'Full Tower': 1.08 };
const BRAND_ACCENTS = {
  Intel: 0x5b8cff,
  AMD: 0xff4d5e,
  NVIDIA: 0x76b900,
  ASUS: 0xff4757,
  MSI: 0xff3d71,
  Corsair: 0xf7d64a,
  'Lian Li': 0x8b5cf6,
  DeepCool: 0x3b82f6,
  NZXT: 0x7c6cff,
  Noctua: 0xc27c3a,
  Arctic: 0x38bdf8,
  'Cooler Master': 0xa855f7,
  'be quiet!': 0x94a3b8,
  Thermalright: 0xf97316,
  Seasonic: 0xfbbf24,
  GSkill: 0xef4444,
  'G.Skill': 0xef4444,
};

function accentOf(item, fallback = 0x8b5cf6) {
  if (!item) return new THREE.Color(fallback);
  if (item.accent) return new THREE.Color(item.accent);
  return new THREE.Color(BRAND_ACCENTS[item.brand] || fallback);
}






/* ---------------------------------------------------------------------------
 * Generated textures: everything is drawn on a canvas at load time, so the
 * scene still ships as a static site with no image assets.
 * ------------------------------------------------------------------------- */










export function createPCScene(container, options = {}) {
  const testCanvas = document.createElement('canvas');
  const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
  if (!gl) throw new Error('WebGL is not available in this browser.');

  // Two graphics tiers. Simple halves the pixels, drops the shadow pass and the
  // multi-sample buffer, which is what a low-end laptop or an old phone can
  // actually keep up with. The setting lives in Preferences.
  const simple = (options.quality || getSettings().quality) === 'simple';
  const pixelBudget = simple ? 1 : 2;
  const renderer = new THREE.WebGLRenderer({
    antialias: !simple,
    alpha: true,
    powerPreference: simple ? 'default' : 'high-performance',
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelBudget));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = simple ? 1.24 : 1.16;
  renderer.shadowMap.enabled = !simple;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = 'pc-canvas';
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.05, 60);

  const rootGroup = new THREE.Group();
  const caseGroup = new THREE.Group();
  const partsGroup = new THREE.Group();
  const measureGroup = new THREE.Group();
  measureGroup.visible = false;
  // Bay markers: glowing rings that show where the next step goes. Only the
  // workshop asks for them, so the plain visualizer never shows rings.
  const slotGroup = new THREE.Group();
  slotGroup.visible = Boolean(options.workbench);
  rootGroup.add(caseGroup, partsGroup, measureGroup, slotGroup);
  scene.add(rootGroup);

  const state = {
    autoRotate: options.autoRotate ?? true,
    rgb: options.rgb ?? true,
    exploded: options.exploded ?? false,
    measure: false,
    // Panel attachment lives on the scene: taking a side off is something you
    // do on the bench, not part of the saved build.
    panels: { left: true, right: true, top: true },
    explodeT: 0,
    dragging: false,
    lastInteraction: 0,
    disposed: false,
    accent: new THREE.Color(0x2f81f7),
  };
  const explodeParts = [];
  const fanRotors = [];
  const ownedTextures = [];
  // Every group that holds built geometry, so dispose can empty them all.
  const contentGroups = [];
  // Frame pacing for the render loop: the simple tier aims at 30 fps, the
  // standard tier paints every frame the display offers.
  const frameInterval = simple ? 33 : 0;
  let lastFrameAt = 0;
  // Removable case panels, keyed 'left' | 'right' | 'top'.
  const panelNodes = {};
  let hoverPick = null;

  const view = {
    // Opening on the front corner pushed the board and its cooler off to the
    // left of the glass. Looking through the side panel instead puts the
    // board face-on, so the CPU and tower sit in the middle of the picture.
    theta: options.workbench ? 1.15 : 1.42,
    phi: options.workbench ? 1.16 : 1.24,
    radius: 3.55,
    targetTheta: options.workbench ? 1.15 : 1.42,
    targetPhi: options.workbench ? 1.16 : 1.24,
    targetRadius: 3.55,
    userZoom: false,
  };

  const rgbMaterials = [];
  const tempColor = new THREE.Color();

  // Look, build, dispose: the surface kit owns textures, materials and the
  // box/rounded-box primitives, so scene.js only orchestrates the parts.
  const surfaces = createSurfaceKit(state, rgbMaterials, ownedTextures);
  const {
    geo, mat, own, tex, addBox, addCylinder, addRoundedBox, addScrew, addInstances,
    rgbMaterial, addRgbMaterial, disposeObject, clearGroup,
    createPcbTexture, createRadialGlow, createSoftShadow, createFloorGrid,
    createStudioEnvironment, createPerforationTexture, createStreakTexture,
    createLabelSprite, createBladeGeometry,
  } = surfaces;

  /* --- shared geometry / material caches, so a rebuild stays cheap --------- */




  /* --- lighting ----------------------------------------------------------- */

  const hemi = new THREE.HemisphereLight(0xa8c4ff, 0x060810, 0.9);
  scene.add(hemi);
  const ambient = new THREE.AmbientLight(0x26324e, 0.4);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.3);
  keyLight.position.set(2.8, 4.2, 3.6);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1536, 1536);
  keyLight.shadow.camera.left = -2.8;
  keyLight.shadow.camera.right = 2.8;
  keyLight.shadow.camera.top = 3;
  keyLight.shadow.camera.bottom = -2.5;
  keyLight.shadow.bias = -0.0006;
  keyLight.shadow.radius = 3;
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xbcd4ff, 0.9);
  rimLight.position.set(-3.4, 1.6, -2.6);
  scene.add(rimLight);

  const interiorLight = new THREE.PointLight(0xe8f1ff, 2.9, 4.5, 1.7);
  interiorLight.position.set(0.24, 0.34, 0.2);
  scene.add(interiorLight);
  const lowerFill = new THREE.PointLight(0x9dbbff, 1.35, 3.4, 1.9);
  lowerFill.position.set(0.3, -0.3, 0.32);
  scene.add(lowerFill);
  const frontFill = new THREE.PointLight(0x9fd8ff, 0.85, 4.6, 1.9);
  frontFill.position.set(0.55, 0.42, 0.95);
  scene.add(frontFill);
  const rimPurple = new THREE.PointLight(0xb27cff, 1.85, 5.2, 2);
  rimPurple.position.set(-1.8, 1.7, -1.5);
  scene.add(rimPurple);
  const caseFill = new THREE.DirectionalLight(0xe2ecff, 0.72);
  caseFill.position.set(4, 2.4, 2.8);
  scene.add(caseFill);

  // Studio environment: gives every metal part something to reflect.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envSource = own(createStudioEnvironment());
  const envTarget = pmrem.fromEquirectangular(envSource);
  scene.environment = envTarget.texture;
  pmrem.dispose();

  /* --- platform ----------------------------------------------------------- */
  const platform = new THREE.Group();
  const platformBase = new THREE.Mesh(
    new THREE.CylinderGeometry(1.96, 2.02, 0.06, 96),
    new THREE.MeshStandardMaterial({ color: 0x0a0d14, metalness: 0.86, roughness: 0.26 }),
  );
  platformBase.position.y = PLATFORM_Y;
  platformBase.receiveShadow = true;
  platform.add(platformBase);

  const platformRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.63, 0.007, 8, 128),
    new THREE.MeshBasicMaterial({ color: 0x2f81f7, transparent: true, opacity: 0.34 }),
  );
  platformRing.rotation.x = -Math.PI / 2;
  platformRing.position.y = PLATFORM_Y + 0.034;
  platform.add(platformRing);

  const platformInnerRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.15, 0.0028, 6, 96),
    new THREE.MeshBasicMaterial({ color: 0x7f8db0, transparent: true, opacity: 0.16 }),
  );
  platformInnerRing.rotation.x = -Math.PI / 2;
  platformInnerRing.position.y = PLATFORM_Y + 0.034;
  platform.add(platformInnerRing);

  const glowTexture = own(createRadialGlow());
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.7, 2.7),
    new THREE.MeshBasicMaterial({
      map: glowTexture,
      color: 0x2f81f7,
      transparent: true,
      opacity: 0.06,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = PLATFORM_Y + 0.033;
  platform.add(glow);

  const floorGridTexture = own(createFloorGrid());
  const floorGrid = new THREE.Mesh(
    new THREE.CircleGeometry(1.84, 96),
    new THREE.MeshBasicMaterial({ map: floorGridTexture, transparent: true, opacity: 0.72, depthWrite: false }),
  );
  floorGrid.rotation.x = -Math.PI / 2;
  floorGrid.position.y = PLATFORM_Y + 0.035;
  floorGrid.renderOrder = 1;
  platform.add(floorGrid);

  const shadowTexture = own(createSoftShadow());
  const contactShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 1.35),
    new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, opacity: 0.6, depthWrite: false }),
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = PLATFORM_Y + 0.036;
  contactShadow.renderOrder = 2;
  platform.add(contactShadow);
  scene.add(platform);
  if (options.workbench) {
    // The turntable is a showroom thing. On a workbench its glowing rings sat
    // on the wood as stray circles, so the bench replaces it completely.
    platform.visible = false;
  }

  /* --- workshop bench ------------------------------------------------------ */
  // Only built for the workshop page. The visualizer keeps the clean turntable;
  // the workshop puts the rig on a real bench with a pegboard behind it and a
  // parts tray in front, which is what makes assembly feel like a workbench.

  const workbench = new THREE.Group();
  if (options.workbench) {
    const benchTop = mat('ws-bench-top', () => new THREE.MeshStandardMaterial({ color: 0x3b2517, roughness: 0.82, metalness: 0.03 }));
    const benchEdge = mat('ws-bench-edge', () => new THREE.MeshStandardMaterial({ color: 0x2a1a10, roughness: 0.8, metalness: 0.1 }));
    const steel = mat('ws-steel', () => new THREE.MeshStandardMaterial({ color: 0x515c6e, metalness: 0.86, roughness: 0.34 }));
    const pegMat = mat('ws-peg', () => new THREE.MeshStandardMaterial({ color: 0x1a222f, roughness: 0.66, metalness: 0.32 }));
    const trayMat = mat('ws-tray', () => new THREE.MeshStandardMaterial({ color: 0x141b26, roughness: 0.6, metalness: 0.4 }));

    // Bench surface: a worktop wide enough to hold the rig and the tray, kept
    // under the case so the camera never looks along a big floating slab.
    const bench = addBox(workbench, 2.45, 0.06, 1.62, 0, PLATFORM_Y - 0.045, 0.12, benchTop);
    bench.receiveShadow = true;
    addBox(workbench, 2.5, 0.012, 1.68, 0, PLATFORM_Y - 0.08, 0.12, benchEdge);
    // Drawer front on the bench edge.
    addBox(workbench, 0.92, 0.18, 0.04, 0.5, PLATFORM_Y - 0.19, 0.9, benchEdge);
    addBox(workbench, 0.3, 0.022, 0.026, 0.5, PLATFORM_Y - 0.12, 0.93, steel);

    // Pegboard behind the bench, with tools hung on it. Kept below the rig's
    // top and close to the back so it frames the case instead of towering over
    // it as a bright wall.
    const peg = addBox(workbench, 2.1, 1.06, 0.04, 0, PLATFORM_Y + 0.5, -0.78, pegMat);
    peg.receiveShadow = true;
    addBox(workbench, 2.16, 0.032, 0.06, 0, PLATFORM_Y + 1.03, -0.78, steel);
    addBox(workbench, 2.16, 0.032, 0.06, 0, PLATFORM_Y - 0.02, -0.78, steel);
    for (let index = 0; index < 5; index += 1) {
      const x = -0.8 + index * 0.4;
      addCylinder(workbench, 0.005, 0.005, 0.04, x, PLATFORM_Y + 0.82, -0.755, steel, 10, 'z').castShadow = false;
      addBox(workbench, 0.04, 0.16 + (index % 3) * 0.04, 0.016, x, PLATFORM_Y + 0.72, -0.75, steel).castShadow = false;
    }

    // Parts tray in front, divided into three bins.
    addBox(workbench, 0.56, 0.026, 0.18, -0.62, PLATFORM_Y + 0.005, 0.52, trayMat);
    addBox(workbench, 0.56, 0.045, 0.014, -0.62, PLATFORM_Y + 0.03, 0.43, trayMat).castShadow = false;
    addBox(workbench, 0.56, 0.045, 0.014, -0.62, PLATFORM_Y + 0.03, 0.61, trayMat).castShadow = false;
    for (let index = -1; index <= 1; index += 1) {
      addBox(workbench, 0.011, 0.045, 0.18, -0.62 + index * 0.17, PLATFORM_Y + 0.03, 0.52, trayMat).castShadow = false;
    }
    // Screwdriver and a thermal paste tube lying in the tray.
    addCylinder(workbench, 0.01, 0.01, 0.15, -0.68, PLATFORM_Y + 0.04, 0.52, steel, 14, 'x').castShadow = false;
    addCylinder(workbench, 0.007, 0.007, 0.045, -0.77, PLATFORM_Y + 0.04, 0.52, steel, 12, 'x').castShadow = false;
    const pasteMat = mat('ws-paste', () => new THREE.MeshStandardMaterial({ color: 0xdfe7f4, roughness: 0.5, metalness: 0.1 }));
    addCylinder(workbench, 0.011, 0.011, 0.08, -0.46, PLATFORM_Y + 0.045, 0.52, pasteMat, 14, 'x').castShadow = false;

    // Anti-static mat under the rig, level with the feet rather than over them.
    const matMat = mat('ws-mat', () => new THREE.MeshStandardMaterial({ color: 0x131d29, roughness: 0.92, metalness: 0.06 }));
    addBox(workbench, 0.92, 0.005, 0.72, 0, PLATFORM_Y - 0.012, 0, matMat).receiveShadow = true;

    scene.add(workbench);
  }

  // Panels taken off the rig are laid out on the bench beside it, so removing
  // a panel reads as a real panel put down instead of the side going missing.
  // (Built lazily by setPanel below; nothing to do here until one is removed.)

  /* --- RGB registration

  /* --- RGB registration --------------------------------------------------- */



  /* --- primitive helpers -------------------------------------------------- */







  function addGhost(parent, width, height, depth, x, y, z, accent) {
    // Empty bays are drawn as one muted steel-blue outline rather than each
    // part's brand colour: a dozen neon wireframes read as clutter, not a rig.
    void accent;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      new THREE.MeshBasicMaterial({
        color: 0x6f86a5,
        wireframe: true,
        transparent: true,
        opacity: 0.1,
      }),
    );
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  /* --- guided assembly markers --------------------------------------------- */

  // One ring per assembly step, sitting at the place that part belongs. They
  // face the side glass (normal along +x) so from the default side view they
  // read as circles over the bay they mark.
  const SLOT_BAYS = [
    { id: 'case', x: 0, y: -CASE_H / 2 + 0.08, z: 0.02, radius: 0.115 },
    { id: 'standoffs', x: BOARD_X, y: BOARD_Y, z: BOARD_REAR_Z + (BOARD_FRONT_Z - BOARD_REAR_Z) / 2, radius: 0.055 },
    { id: 'cpu', x: BOARD_X + 0.045, y: CPU_Y, z: CPU_Z, radius: 0.032 },
    { id: 'ram', x: BOARD_X + 0.06, y: 0.27, z: DIMM_Z0 + DIMM_PITCH * 1.5, radius: 0.05 },
    { id: 'paste', x: BOARD_X + 0.09, y: CPU_Y + 0.03, z: CPU_Z, radius: 0.03 },
    { id: 'cooler', x: BOARD_X + 0.11, y: CPU_Y + 0.08, z: CPU_Z, radius: 0.062 },
    { id: 'mount', x: BOARD_X, y: BOARD_Y - 0.16, z: BOARD_REAR_Z + (BOARD_FRONT_Z - BOARD_REAR_Z) / 2, radius: 0.05 },
    { id: 'storage', x: BOARD_X + 0.05, y: 0.11, z: BOARD_REAR_Z + 0.2, radius: 0.04 },
    { id: 'gpu', x: 0, y: GPU_Y, z: GPU_REAR_Z + 0.18, radius: 0.075 },
    { id: 'psu', x: BOARD_X + 0.26, y: -0.28, z: -0.16, radius: 0.06 },
    { id: 'power', x: BOARD_X + 0.02, y: 0.36, z: BOARD_REAR_Z - 0.02, radius: 0.038 },
    { id: 'front', x: BOARD_X + 0.03, y: -0.06, z: BOARD_FRONT_Z - 0.07, radius: 0.032 },
    { id: 'fans', x: 0, y: 0.16, z: CASE_D / 2 - 0.1, radius: 0.07 },
  ];

  const SLOT_COLORS = { current: 0xf5a524, waiting: 0x38bdf8 };
  const slotMarkers = [];
  let assemblyStepId = 'case';

  for (const bay of SLOT_BAYS) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(bay.radius * 0.72, bay.radius, 44),
      new THREE.MeshBasicMaterial({
        color: SLOT_COLORS.waiting,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    ring.position.set(bay.x, bay.y, bay.z);
    ring.rotation.y = Math.PI / 2;
    ring.userData.slotId = bay.id;
    ring.visible = false;
    slotGroup.add(ring);

    // A second, wider ring reads as a soft halo round the target bay.
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(bay.radius * 1.02, bay.radius * 1.16, 44),
      new THREE.MeshBasicMaterial({
        color: SLOT_COLORS.waiting,
        transparent: true,
        opacity: 0.1,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    halo.position.copy(ring.position);
    halo.rotation.y = Math.PI / 2;
    halo.visible = false;
    slotGroup.add(halo);

    slotMarkers.push({ id: bay.id, ring, halo, radius: bay.radius });
  }

  function setAssemblyStep(stepId, options = {}) {
    assemblyStepId = stepId || '';
    const done = Array.isArray(options.done) ? options.done : [];
    for (const marker of slotMarkers) {
      const isDone = done.includes(marker.id);
      const isCurrent = marker.id === assemblyStepId;
      // A done bay keeps a dim ring so the finished work still reads on the rig;
      // the current bay glows amber; bays not reached yet sit faint blue.
      marker.ring.visible = !isDone || isCurrent;
      marker.halo.visible = isCurrent;
      const color = isCurrent ? SLOT_COLORS.current : isDone ? 0x22c55e : SLOT_COLORS.waiting;
      marker.ring.material.color.setHex(color);
      marker.halo.material.color.setHex(color);
      marker.ring.material.opacity = isCurrent ? 0.85 : isDone ? 0.16 : 0.22;
      marker.halo.material.opacity = isCurrent ? 0.18 : 0.06;
      marker.ring.userData.targetScale = 1;
    }
  }

  // Where each bay marker lands on screen, in canvas pixels. The workshop drags
  // a part with a real pointer, so it needs to know which bay the pointer is
  // over. Positions are recomputed on every ask, never cached, because the rig
  // turns and the panel moves between one dragover event and the next.
  const bayWorld = new THREE.Vector3();
  function bayScreenPositions() {
    const el = renderer.domElement;
    const width = el.clientWidth || 1;
    const height = el.clientHeight || 1;
    const out = [];
    for (const marker of slotMarkers) {
      marker.ring.getWorldPosition(bayWorld);
      const projected = bayWorld.clone().project(camera);
      // A bay behind the camera projects to a mirrored point; report it as off
      // screen so a drop there is never taken for a hit.
      const behind = projected.z > 1;
      out.push({
        id: marker.id,
        x: (projected.x * 0.5 + 0.5) * width,
        y: (-projected.y * 0.5 + 0.5) * height,
        radius: marker.radius,
        behind,
        visible: marker.ring.visible && !behind,
      });
    }
    return out;
  }

  // Frames per second, smoothed over half a second. A single slow frame should
  // not read as a stutter, so the count is averaged rather than reported raw.
  let fpsFrames = 0;
  let fpsSince = 0;
  let fpsValue = 0;
  function noteFrame(now) {
    fpsFrames += 1;
    if (!fpsSince) fpsSince = now;
    const span = now - fpsSince;
    if (span >= 500) {
      fpsValue = Math.round((fpsFrames / span) * 1000);
      fpsFrames = 0;
      fpsSince = now;
    }
  }

  function pulseInstall(partId) {
    if (!partId) return;
    for (const child of partsGroup.children) {
      if (child.userData.partId !== partId) continue;
      child.userData.installT = 0;
      if (!child.userData.installBase) child.userData.installBase = child.scale.clone();
    }
  }

  // Cables must stay inside the chassis shell. Catmull-Rom overshoots between
  // control points, so every point (and the curve that follows) is clamped to
  // the interior of the case before the tube is built.
  const CABLE_LIMIT = {
    x: CASE_W / 2 - 0.055,
    y: CASE_H / 2 - 0.055,
    z: CASE_D / 2 - 0.055,
  };

  function clampCablePoint(vector) {
    return vector.set(
      Math.max(-CABLE_LIMIT.x, Math.min(CABLE_LIMIT.x, vector.x)),
      Math.max(-CABLE_LIMIT.y, Math.min(CABLE_LIMIT.y, vector.y)),
      Math.max(-CABLE_LIMIT.z, Math.min(CABLE_LIMIT.z, vector.z)),
    );
  }

  function addCable(parent, points, radius, color) {
    const control = points.map((point) => clampCablePoint(new THREE.Vector3(point[0], point[1], point[2])));
    const curve = new THREE.CatmullRomCurve3(control);
    // Sample the curve once and pull every sample back inside the shell; a
    // spline that dips through the side panel is what made cables look broken.
    const samples = curve.getPoints(48).map(clampCablePoint);
    const safeCurve = new THREE.CatmullRomCurve3(samples);
    const safeRadius = Math.min(radius, 0.0085);
    const geometry = new THREE.TubeGeometry(safeCurve, 48, safeRadius, 8, false);
    // Matte and dark: a shiny cable picked up the studio light and read as a
    // pale metal rod instead of wire sleeving.
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
      color,
      roughness: 0.88,
      metalness: 0.05,
      envMapIntensity: 0.3,
    }));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  /* --- cable ports -------------------------------------------------------- */

  // Where each socket sits on the rig, in case coordinates. The workshop glows
  // these spots so a plug has somewhere visible to go, and clicking one is how
  // you land a cable. They face the side glass (normal along +x) so they read as
  // discs from the default bench view.
  const PORT_ANCHORS = {
    'psu-24pin': [0.1, -0.235, -0.17],
    'psu-eps': [0.1, -0.26, -0.12],
    'psu-pcie': [0.1, -0.285, -0.16],
    'psu-12v': [0.1, -0.285, -0.09],
    'psu-sata': [0.1, -0.31, -0.2],
    'board-24pin': [-0.19, 0.02, 0.155],
    'board-eps': [-0.19, 0.345, -0.3],
    'board-cpu-fan': [-0.19, 0.325, -0.065],
    'board-pump': [-0.19, 0.3, -0.24],
    'board-fan-header': [-0.19, -0.135, 0.13],
    'board-sata': [-0.19, -0.12, -0.26],
    'board-front': [-0.19, -0.175, 0.16],
    'gpu-pcie': [0.15, 0.055, -0.28],
    'gpu-12v': [0.15, 0.055, -0.28],
    'drive-sata-power': [0.02, -0.19, -0.16],
    'drive-sata-data': [0.02, -0.18, -0.11],
    'case-front': [0.09, -0.09, 0.37],
    'cooler-fan': [-0.13, 0.3, CPU_Z + 0.09],
    'cooler-pump': [-0.16, 0.3, CPU_Z],
    'fans-hub': [0.05, 0.05, 0.31],
    'radiator-fans': [0.0, 0.54, 0.0],
  };

  const portGroup = new THREE.Group();
  portGroup.visible = Boolean(options.workbench);
  const cableGroup = new THREE.Group();
  cableGroup.visible = Boolean(options.workbench);
  rootGroup.add(portGroup, cableGroup);
  // Content groups are cleared by name on dispose, so the socket markers and
  // the drawn cables are freed along with the parts instead of lingering in
  // GPU memory after the page closes.
  contentGroups.push(caseGroup, partsGroup, measureGroup, slotGroup, portGroup, cableGroup);

  const portMarkers = new Map();
  for (const [portId, [x, y, z]] of Object.entries(PORT_ANCHORS)) {
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(0.032, 24),
      new THREE.MeshBasicMaterial({
        color: 0x22d3ee,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        depthWrite: false,
        // Drawn over the rig: a socket sitting inside the board or the shroud
        // would otherwise be hidden by the part it belongs to.
        depthTest: false,
      }),
    );
    disc.renderOrder = 12;
    disc.position.set(x, y, z);
    disc.rotation.y = Math.PI / 2;
    disc.visible = false;
    disc.userData.portId = portId;
    portGroup.add(disc);

    // A ring doubles the target so a small socket is still easy to click, and it
    // breathes so the socket to press is obvious on a busy rig.
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.046, 0.058, 32),
      new THREE.MeshBasicMaterial({
        color: 0xf5a524,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
        depthWrite: false,
        depthTest: false,
      }),
    );
    ring.renderOrder = 13;
    ring.position.copy(disc.position);
    ring.rotation.y = Math.PI / 2;
    ring.visible = false;
    ring.userData.portId = portId;
    portGroup.add(ring);
    portMarkers.set(portId, { disc, ring, home: new THREE.Vector3(x, y, z) });
  }

  /**
   * Show only the sockets the list names (plus their pair plugs). Connected
   * cables call this again with a shorter list, so a plugged socket goes dark.
   */
  function setCablePorts(list = []) {
    const wanted = new Set(list.filter(Boolean));
    for (const [portId, marker] of portMarkers) {
      const on = wanted.has(portId);
      marker.disc.visible = on;
      marker.ring.visible = on;
      // Sockets sit on the glass side; pushing them a touch toward the camera
      // keeps them readable instead of half sunk inside the part they mark.
      marker.disc.position.x = marker.home.x + (on ? 0.035 : 0);
      marker.ring.position.x = marker.home.x + (on ? 0.035 : 0);
    }
  }

  function cableRoute(fromId, toId) {
    const from = PORT_ANCHORS[fromId];
    const to = PORT_ANCHORS[toId];
    if (!from || !to) return null;
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    // Two waypoints: one that drops toward the power bay, one that hugs the
    // rear wall. Following the board's surface keeps the run looking routed
    // instead of floating across the open glass.
    const drop = a.clone().lerp(b, 0.5);
    drop.x = Math.min(drop.x, BOARD_X + 0.05);
    drop.z = Math.min(drop.z, BOARD_REAR_Z + 0.16);
    drop.y = Math.min(a.y, b.y) - 0.02;
    const turn = b.clone();
    turn.x = Math.min(b.x, BOARD_X + 0.06);
    turn.z = Math.min(b.z, BOARD_REAR_Z + 0.14);
    return [[a.x, a.y, a.z], [drop.x, drop.y, drop.z], [turn.x, turn.y, turn.z], [b.x, b.y, b.z]];
  }

  /** Draw exactly the cables in the list, and put a plug on each end. */
  function setCables(connectedIds = []) {
    while (cableGroup.children.length) {
      const child = cableGroup.children.pop();
      child.geometry?.dispose();
      // The sleeve material is shared by every cable, so it outlives a redraw:
      // disposing it here would leave the next set of cables untextured.
      if (Array.isArray(child.material)) child.material.forEach((mat) => { if (!mat.userData?.shared) mat.dispose(); });
      else if (child.material && !child.material.userData?.shared) child.material.dispose();
    }
    if (!connectedIds.length) return;
    const sleeve = new THREE.MeshStandardMaterial({ color: 0x14181f, roughness: 0.9, metalness: 0.04, envMapIntensity: 0.25 });
    sleeve.userData.shared = true;
    for (const id of connectedIds) {
      const kind = CABLE_ENDS[id];
      if (!kind) continue;
      const route = cableRoute(kind.from, kind.to);
      if (!route) continue;
      const mesh = addCable(cableGroup, route, 0.0075, 0x14181f);
      mesh.material.dispose();
      mesh.material = sleeve;
      // Plugs: a small block on each end so the cable meets a real connector
      // rather than dissolving into the socket.
      for (const end of [route[0], route[route.length - 1]]) {
        const plug = new THREE.Mesh(
          new THREE.BoxGeometry(0.022, 0.03, 0.026),
          new THREE.MeshStandardMaterial({ color: 0x22262e, roughness: 0.75, metalness: 0.15 }),
        );
        plug.position.set(end[0], end[1], end[2]);
        plug.castShadow = true;
        cableGroup.add(plug);
      }
    }
  }

  // Cable ids and the two sockets each one joins (kept here so the scene does
  // not import the rules module and make a cycle through build.js).
  const CABLE_ENDS = {
    atx24: { from: 'psu-24pin', to: 'board-24pin' },
    eps8: { from: 'psu-eps', to: 'board-eps' },
    'gpu-pcie': { from: 'psu-pcie', to: 'gpu-pcie' },
    'gpu-12v': { from: 'psu-12v', to: 'gpu-12v' },
    'sata-power': { from: 'psu-sata', to: 'drive-sata-power' },
    'sata-data': { from: 'board-sata', to: 'drive-sata-data' },
    'front-panel': { from: 'case-front', to: 'board-front' },
    'cpu-fan': { from: 'cooler-fan', to: 'board-cpu-fan' },
    'case-fan': { from: 'fans-hub', to: 'board-fan-header' },
    'aio-pump': { from: 'cooler-pump', to: 'board-pump' },
    'aio-radiator': { from: 'radiator-fans', to: 'board-fan-header' },
  };

  function addLineGrid(parent, width, height, z, color = 0x34405a, opacity = 0.3, step = 0.035) {
    const points = [];
    for (let x = -width / 2; x <= width / 2; x += step) {
      points.push(new THREE.Vector3(x, -height / 2, z), new THREE.Vector3(x, height / 2, z));
    }
    for (let y = -height / 2; y <= height / 2; y += step) {
      points.push(new THREE.Vector3(-width / 2, y, z), new THREE.Vector3(width / 2, y, z));
    }
    const lines = new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
    );
    lines.renderOrder = 2;
    parent.add(lines);
    return lines;
  }

  function addDimensionMark(parent, fromZ, toZ, y, x, color, label, opacity = 0.9) {
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, y, fromZ),
        new THREE.Vector3(x, y, toZ),
      ]),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
    );
    line.renderOrder = 5;
    parent.add(line);
    const tick = 0.018;
    for (const z of [fromZ, toZ]) {
      const tickLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x, y - tick, z),
          new THREE.Vector3(x, y + tick, z),
        ]),
        new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
      );
      tickLine.renderOrder = 5;
      parent.add(tickLine);
    }
    const sprite = createLabelSprite(label, color);
    sprite.position.set(x, y - 0.07, (fromZ + toZ) / 2);
    parent.add(sprite);
    return line;
  }

  function registerExplode(mesh, offset) {
    // Panels now live inside their own group, so the offset is carried on the
    // group instead of the mesh.
    const target = Object.values(panelNodes).includes(mesh.parent) ? mesh.parent : mesh;
    explodeParts.push({ mesh: target, base: target.position.clone(), offset, owner: target });
    return mesh;
  }

  /* --- case --------------------------------------------------------------- */


  /* --- motherboard -------------------------------------------------------- */


  /* --- CPU and cooler ----------------------------------------------------- */


  /* --- memory ------------------------------------------------------------- */



  /* --- graphics card ------------------------------------------------------ */


  /* --- power supply, shroud and storage ----------------------------------- */


  /* --- case fans ---------------------------------------------------------- */


  // Parts are tagged with the catalogue id of the component in that bay, so a
  // click in the scene can name the exact part being inspected.
  function tagFrom(group, from, partId) {
    if (!partId) return;
    for (let index = from; index < group.children.length; index += 1) {
      group.children[index].userData.partId = partId;
    }
  }

  // Models live in rig/parts/*, one module per part family. Each receives the
  // same kit, so a model asks for a shared helper by name and never reaches
  // back into this file for anything.
  // Fans are drawn the same way by three part families, so the helper is its
  // own module: it receives the surface kit and the live rotor list.
  const addFan = createFanKit({ state, fanRotors, surfaces, brandStyle, brandHub });

  // The kit is everything a part model may ask for: layout constants, scene
  // groups, the shared surfaces, brand artwork and the helpers the models draw
  // together (fans, sockets, cables, dimension marks). A model destructures
  // exactly the names it uses.
  const kit = {
    accentOf, addBox, addCable, addCylinder, addDimensionMark, addFan, addGhost, addInstances,
    addRoundedBox, addScrew, BOARD_D, BOARD_FRONT_Z, BOARD_H, BOARD_REAR_Z, BOARD_X, BOARD_Y,
    brandHub, brandLogo, brandPlate, brandStyle, CASE_D, CASE_H, CASE_W, caseGroup,
    coolerFinish, CPU_Y, CPU_Z, createPcbTexture, createPerforationTexture,
    createStreakTexture, DIMM_PITCH, DIMM_Z0, explodeParts, getItems, glow, GPU_REAR_Z, GPU_Y,
    gpuSeries, mat, measureGroup, memoryStyle, panelNodes, partsGroup, PLATFORM_Y,
    platformRing, registerExplode, rgbMaterial, rootGroup, SIZE_SCALE, state, tex, THREE
  };
  const buildCase = (...args) => buildCaseModel(kit, ...args);
  const buildMotherboard = (...args) => buildMotherboardModel(kit, ...args);
  const buildCpuAndCooler = (...args) => buildCoolingModel(kit, ...args);
  const buildMemory = (...args) => buildMemoryModel(kit, ...args);
  const buildGpu = (...args) => buildGpuModel(kit, ...args);
  const buildPsuAndStorage = (...args) => buildPowerModel(kit, ...args);
  const buildFans = (...args) => buildFansModel(kit, ...args);

  function applyBuild(build) {
    // Panels stay where the user left them on the bench: installing a part
    // rebuilds the scene, and having a side panel slam back on mid-assembly was
    // the one thing that broke the workshop illusion. Fresh panel groups are
    // built by buildCase, so the flags are re-applied rather than reset.
    if (!options.workbench) {
      state.panels.left = true;
      state.panels.right = true;
      state.panels.top = true;
    }
    panelNodes.left = null;
    panelNodes.right = null;
    panelNodes.top = null;
    clearGroup(caseGroup);
    clearGroup(partsGroup);
    clearGroup(measureGroup);
    rgbMaterials.length = 0;
    fanRotors.length = 0;
    const pcCase = getItems(build, 'case')[0];
    const board = getItems(build, 'motherboard')[0];
    const cpu = getItems(build, 'cpu')[0];
    const cooler = getItems(build, 'cooler')[0];
    const ram = getItems(build, 'ram')[0];
    const gpu = getItems(build, 'gpu')[0];
    const psu = getItems(build, 'psu')[0];
    const fanKit = getItems(build, 'fans')[0];

    buildCase(pcCase);
    tagFrom(caseGroup, 0, pcCase?.id);
    buildMotherboard(build);
    tagFrom(partsGroup, 0, board?.id);
    const afterBoard = partsGroup.children.length;
    buildCpuAndCooler(build);
    tagFrom(partsGroup, afterBoard, (cooler || cpu)?.id);
    const afterCooler = partsGroup.children.length;
    buildMemory(build);
    tagFrom(partsGroup, afterCooler, ram?.id);
    const afterRam = partsGroup.children.length;
    buildGpu(build);
    tagFrom(partsGroup, afterRam, gpu?.id);
    const afterGpu = partsGroup.children.length;
    buildPsuAndStorage(build);
    tagFrom(partsGroup, afterGpu, psu?.id);
    const afterPsu = partsGroup.children.length;
    buildFans(build);
    tagFrom(partsGroup, afterPsu, fanKit?.id);
    measureGroup.visible = state.measure;
    applyPanelState();
  }

  /* --- removable panels ---------------------------------------------------- */

  function applyPanelState() {
    for (const [key, node] of Object.entries(panelNodes)) {
      if (!node) continue;
      const attached = state.panels[key] !== false;
      // Snap straight to the resting place instead of gliding: a rebuild has
      // just created these, so there is no motion to animate from.
      node.userData.slide = attached ? 0 : 1;
      node.visible = true;
    }
  }

  function setPanel(side, attached) {
    if (!state.panels.hasOwnProperty(side)) return true;
    state.panels[side] = Boolean(attached);
    return state.panels[side];
  }

  function togglePanel(side) {
    if (!state.panels.hasOwnProperty(side)) return true;
    state.panels[side] = !state.panels[side];
    return state.panels[side];
  }

  // Orbit, zoom, angle presets and click-picking all live in rig/camera.js:
  // the framing maths is the part most likely to need tuning, so it is kept
  // apart from the models it looks at.
  const controls = createRigControls({
    container, renderer, camera, view, state, options,
    targets: () => ({ portGroup, partsGroup, caseGroup, rootGroup }),
  });
  const { resetView, setView: setViewAngle, zoom: zoomBy, resize, updateCamera, pickAt } = controls;


  const clock = new THREE.Clock();

  function animateRgb(time) {
    for (const entry of rgbMaterials) {
      if (state.rgb) {
        const hue = (time * 0.05 + entry.offset) % 1;
        tempColor.setHSL(hue, 0.84, 0.55);
        if (entry.basic) {
          entry.material.color.copy(tempColor);
          entry.material.opacity = 0.95;
        } else {
          entry.material.emissive.copy(tempColor);
          entry.material.emissiveIntensity = entry.intensity;
        }
      } else if (entry.basic) {
        entry.material.color.copy(entry.accent);
        entry.material.opacity = 0.6;
      } else {
        entry.material.emissive.copy(entry.accent);
        entry.material.emissiveIntensity = entry.intensity * 0.38;
      }
    }
    if (state.rgb) {
      tempColor.setHSL((time * 0.035 + 0.6) % 1, 0.82, 0.56);
      rimPurple.color.copy(tempColor);
    } else {
      rimPurple.color.set(0x2f81f7);
    }
  }

  function animate() {
    if (state.disposed) return;
    // Frame pacing: the simple tier targets 30 fps instead of the display's
    // refresh rate, so a weak GPU is never asked to paint frames nobody sees.
    const frameNow = performance.now();
    if (frameInterval && frameNow - lastFrameAt < frameInterval) return;
    lastFrameAt = frameNow;
    const time = clock.getElapsedTime();
    const now = performance.now();
    if (state.autoRotate && !state.dragging && now - state.lastInteraction > 1200) {
      view.targetTheta += 0.0019;
    }
    view.theta += (view.targetTheta - view.theta) * 0.08;
    view.phi += (view.targetPhi - view.phi) * 0.08;
    view.radius += (view.targetRadius - view.radius) * 0.08;
    updateCamera();
    animateRgb(time);
    // Fans idle-spin so the machine reads as powered on.
    for (const entry of fanRotors) {
      entry.rotor.rotation.z -= 0.012 * entry.speed;
    }
    state.explodeT += ((state.exploded ? 1 : 0) - state.explodeT) * 0.08;
    for (const entry of explodeParts) {
      entry.mesh.position.copy(entry.base).addScaledVector(entry.offset, state.explodeT);
    }
    // A panel taken off in the workshop slides clear of the rig and leans
    // against the bench beside it, so it reads as a panel set aside rather than
    // a hole in the side. Both directions use the same eased amount, so it goes
    // home again the same way.
    for (const [key, node] of Object.entries(panelNodes)) {
      if (!node) continue;
      const attached = state.panels[key] !== false;
      const target = attached ? 0 : 1;
      const current = node.userData.slide || 0;
      const amount = current + (target - current) * 0.1;
      node.userData.slide = amount;
      const away = key === 'left' ? -1 : key === 'right' ? 1 : 0;
      // Added on top of the explode position rather than overwriting it: the
      // explode pass above has already set the absolute position this frame.
      node.position.x += away * (CASE_W * 0.62) * amount;
      node.position.y += (key === 'top' ? CASE_H * 0.7 : -CASE_H * 0.5) * amount;
      // A small lean, not a quarter turn: rotating the group pivots it around
      // the case centre, which would swing the panel off the worktop.
      node.rotation.z = away * 0.16 * amount;
      node.visible = amount > 0.02 || state.exploded;
    }
    // Sockets breathe while a cable is waiting: without the pulse the small
    // discs vanish against the card and the board.
    if (portGroup.visible) {
      for (const marker of portMarkers.values()) {
        if (!marker.ring.visible) continue;
        const pulse = 1 + Math.sin(time * 3.2) * 0.12;
        marker.ring.scale.setScalar(pulse);
        marker.ring.material.opacity = 0.55 + Math.sin(time * 3.2) * 0.2;
      }
    }

    // Bay markers breathe, so the step you are on is the thing that draws the
    // eye: the current ring pulses, the rest sit still.
    if (slotGroup.visible) {
      for (const marker of slotMarkers) {
        if (marker.halo.visible) {
          const wobble = 1 + Math.sin(time * 2.4) * 0.08;
          marker.halo.scale.setScalar(wobble);
          marker.halo.material.opacity = 0.1 + (Math.sin(time * 2.4) * 0.5 + 0.5) * 0.12;
        }
      }
    }
    // A part that has just been fitted pops in: it grows past its size and
    // settles, which reads as the part being pressed home.
    for (const child of partsGroup.children) {
      if (child.userData.installT === undefined) continue;
      child.userData.installT = Math.min(1, child.userData.installT + 0.055);
      const t = child.userData.installT;
      const overshoot = 1 + Math.sin(t * Math.PI) * 0.16;
      const base = child.userData.installBase || child.scale;
      child.scale.set(base.x * overshoot, base.y * overshoot, base.z * overshoot);
      if (t >= 1) {
        child.scale.copy(base);
        delete child.userData.installT;
      }
    }
    const pulse = 1 + Math.sin(time * 1.6) * 0.008;
    rootGroup.position.y = (PLATFORM_Y + (CASE_H * rootGroup.scale.y) / 2 + 0.035) * pulse;
    renderer.render(scene, camera);
    noteFrame(now);
  }

  applyBuild(options.build || { items: {} });
  resetView();

  /* --- on-demand rendering --------------------------------------------------
   * A rig sitting still should cost nothing. Rendering pauses when the canvas
   * scrolls out of view or the tab is hidden, and resumes when it comes back,
   * so three pages of 3D never fight for the GPU at once.
   * ------------------------------------------------------------------------ */

  let running = false;
  const startLoop = () => {
    if (running || state.disposed) return;
    running = true;
    lastFrameAt = 0;
    renderer.setAnimationLoop(animate);
  };
  const stopLoop = () => {
    if (!running) return;
    running = false;
    renderer.setAnimationLoop(null);
  };

  let inView = true;
  const onVisibilityChange = () => {
    if (document.hidden || !inView) stopLoop();
    else startLoop();
  };

  let observer = null;
  if (typeof IntersectionObserver === 'function') {
    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) inView = entry.isIntersecting;
      onVisibilityChange();
    }, { threshold: 0.02 });
    observer.observe(container);
  }
  document.addEventListener('visibilitychange', onVisibilityChange);
  startLoop();

  return {
    updateBuild(build) {
      applyBuild(build || { items: {} });
    },
    setAutoRotate(enabled) {
      state.autoRotate = Boolean(enabled);
      state.lastInteraction = 0;
    },
    setRGB(enabled) {
      state.rgb = Boolean(enabled);
    },
    setExploded(enabled) {
      state.exploded = Boolean(enabled);
    },
    setMeasure(enabled) {
      state.measure = Boolean(enabled);
      measureGroup.visible = state.measure;
    },
    // A change made while the canvas is off-screen still has to be drawn, so
    // the next time it scrolls back in the picture is current.
    requestRender() {
      if (document.hidden || !inView) return;
      startLoop();
    },
    snapshot() {
      renderer.render(scene, camera);
      return renderer.domElement.toDataURL('image/png');
    },
    // Hand the rig to other 3D tools: a .glb of exactly what is on screen,
    // with the parts as separate nodes named by their catalogue id.
    exportGLB() {
      rootGroup.updateWorldMatrix(true, true);
      return buildGLB(rootGroup, THREE, { name: options.name || 'PC build' });
    },
    resetView,
    setView: setViewAngle,
    zoom(factor) {
      zoomBy(Number(factor) || 1);
    },
    // Workshop API: panels are taken off in place, never rebuilt.
    setPanel(side, attached) {
      return setPanel(side, attached);
    },
    // Guided assembly: mark the bay for the current step and clear the rest.
    setAssemblyStep(stepId, stepOptions) {
      setAssemblyStep(stepId, stepOptions);
      return assemblyStepId;
    },
    pulseInstall,
    // Drag targeting: where each bay currently sits on the canvas, and how well
    // the renderer is keeping up.
    bayScreenPositions,
    getFps() {
      return fpsValue;
    },
    // Cable management: light the sockets a cable may go into, then draw the
    // cables that are already in.
    setCablePorts(portIds) {
      setCablePorts(portIds);
    },
    setCables(cableIds) {
      setCables(cableIds);
    },
    togglePanel(side) {
      return togglePanel(side);
    },
    panelState(side) {
      return state.panels[side] !== false;
    },
    dispose() {
      state.disposed = true;
      renderer.setAnimationLoop(null);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      observer?.disconnect();
      observer = null;
      controls.dispose();
      // Empty every group that was handed out, not three of the six: the socket
      // markers and cable runs were being left behind on the graphics card.
      contentGroups.forEach((group) => clearGroup(group));
      portMarkers.clear();
      slotMarkers.length = 0;
      disposeObject(platform);
      envTarget.dispose();
      ownedTextures.forEach((texture) => texture.dispose());
      ownedTextures.length = 0;
      surfaces.disposeCaches();
      renderer.dispose();
      renderer.domElement.remove();
      container.innerHTML = '';
    },
  };
}
