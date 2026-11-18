import * as THREE from 'three';
import { getItems } from '../core/build.js';
import { brandStyle, brandPlate, brandHub, brandLogo, memoryStyle, coolerFinish, gpuSeries } from './brands.js';

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

function seededRandom(seed) {
  let value = seed >>> 0 || 1;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function disposeMaterial(material) {
  if (!material) return;
  if (material.userData && material.userData.shared) return;
  if (material.map && !(material.map.userData && material.map.userData.shared)) material.map.dispose();
  if (material.emissiveMap && !(material.emissiveMap.userData && material.emissiveMap.userData.shared)) material.emissiveMap.dispose();
  if (material.alphaMap && !(material.alphaMap.userData && material.alphaMap.userData.shared)) material.alphaMap.dispose();
  material.dispose();
}

function disposeObject(object) {
  object.traverse((child) => {
    if (child.geometry && !(child.geometry.userData && child.geometry.userData.shared)) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) child.material.forEach(disposeMaterial);
      else disposeMaterial(child.material);
    }
  });
}

function clearGroup(group) {
  group.children.slice().forEach((child) => {
    disposeObject(child);
    group.remove(child);
  });
}

function roundedRectShape(width, height, radius) {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  const r = Math.min(radius, width / 2 - 0.001, height / 2 - 0.001);
  shape.moveTo(x + r, y);
  shape.lineTo(x + width - r, y);
  shape.absarc(x + width - r, y + r, r, -Math.PI / 2, 0);
  shape.lineTo(x + width, y + height - r);
  shape.absarc(x + width - r, y + height - r, r, 0, Math.PI / 2);
  shape.lineTo(x + r, y + height);
  shape.absarc(x + r, y + height - r, r, Math.PI / 2, Math.PI);
  shape.lineTo(x, y + r);
  shape.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5);
  return shape;
}

/* ---------------------------------------------------------------------------
 * Generated textures: everything is drawn on a canvas at load time, so the
 * scene still ships as a static site with no image assets.
 * ------------------------------------------------------------------------- */

function createPcbTexture(accent) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 896;
  const ctx = canvas.getContext('2d');
  const rand = seededRandom(0x5eed + Math.round(accent.getHex() % 4096));
  const accentHex = `rgb(${Math.round(accent.r * 255)},${Math.round(accent.g * 255)},${Math.round(accent.b * 255)})`;

  ctx.fillStyle = '#06141d';
  ctx.fillRect(0, 0, 768, 896);
  const base = ctx.createLinearGradient(0, 0, 768, 896);
  base.addColorStop(0, 'rgba(24, 74, 96, 0.22)');
  base.addColorStop(0.5, 'rgba(10, 38, 52, 0.12)');
  base.addColorStop(1, 'rgba(44, 34, 74, 0.18)');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 768, 896);

  // Fine copper traces, drawn as elbow segments the way a real board routes.
  for (let index = 0; index < 190; index += 1) {
    const startX = rand() * 768;
    const startY = rand() * 896;
    const length = 40 + rand() * 220;
    const horizontal = rand() > 0.5;
    ctx.strokeStyle = rand() > 0.82 ? `rgba(196, 152, 96, 0.4)` : `rgba(96, 196, 226, ${0.1 + rand() * 0.18})`;
    ctx.lineWidth = rand() > 0.86 ? 1.8 : 0.9;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    if (horizontal) {
      ctx.lineTo(startX + length * 0.55, startY);
      ctx.lineTo(startX + length * 0.62, startY + (rand() > 0.5 ? 1 : -1) * length * 0.18);
      ctx.lineTo(startX + length, startY + (rand() > 0.5 ? 1 : -1) * length * 0.18);
    } else {
      ctx.lineTo(startX, startY + length * 0.55);
      ctx.lineTo(startX + (rand() > 0.5 ? 1 : -1) * length * 0.16, startY + length * 0.62);
      ctx.lineTo(startX + (rand() > 0.5 ? 1 : -1) * length * 0.16, startY + length);
    }
    ctx.stroke();
  }

  // Parallel bus lines, the signature look of a modern board.
  ctx.strokeStyle = 'rgba(120, 210, 240, 0.16)';
  ctx.lineWidth = 1.4;
  for (let group = 0; group < 5; group += 1) {
    const originX = 360 + group * 54;
    const originY = 470;
    for (let line = 0; line < 6; line += 1) {
      ctx.beginPath();
      ctx.moveTo(originX + line * 3, originY);
      ctx.lineTo(originX + line * 3, originY + 40);
      ctx.lineTo(originX + line * 3 + 46, originY + 86);
      ctx.lineTo(originX + line * 3 + 46, originY + 140);
      ctx.stroke();
    }
  }

  // Silkscreen pads, sockets and component outlines.
  ctx.fillStyle = 'rgba(222, 236, 248, 0.22)';
  ctx.font = '600 11px "Segoe UI", sans-serif';
  ctx.fillText('PC BUILD STUDIO', 26, 856);
  ctx.font = '500 9px "Segoe UI", sans-serif';
  ctx.fillText('ATX / REV 1.2', 26, 872);
  for (let index = 0; index < 70; index += 1) {
    ctx.strokeStyle = 'rgba(226, 240, 250, 0.16)';
    ctx.lineWidth = 0.8;
    const w = 12 + rand() * 30;
    const h = 8 + rand() * 22;
    ctx.strokeRect(rand() * 740, rand() * 880, w, h);
  }
  for (let index = 0; index < 260; index += 1) {
    const gold = rand() > 0.6;
    ctx.fillStyle = gold ? 'rgba(214, 174, 108, 0.5)' : 'rgba(206, 228, 244, 0.25)';
    ctx.fillRect(rand() * 768, rand() * 896, 3 + rand() * 4, 2 + rand() * 3);
  }

  // Accent glow along the board edge and around the chipset zone.
  const glow = ctx.createLinearGradient(0, 0, 0, 210);
  glow.addColorStop(0, accentHex);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 768, 210);
  ctx.globalAlpha = 1;

  // Screw holes.
  ctx.fillStyle = 'rgba(4, 10, 16, 0.9)';
  for (const [x, y] of [[40, 40], [728, 40], [40, 850], [728, 850], [384, 62], [384, 832]]) {
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(210, 226, 240, 0.2)';
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function createRadialGlow() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, 'rgba(255,255,255,0.6)');
  gradient.addColorStop(0.42, 'rgba(255,255,255,0.16)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createSoftShadow() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(128, 128, 10, 128, 128, 126);
  gradient.addColorStop(0, 'rgba(0,0,0,0.72)');
  gradient.addColorStop(0.55, 'rgba(0,0,0,0.32)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createFloorGrid() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.translate(256, 256);
  ctx.strokeStyle = 'rgba(116, 139, 190, 0.18)';
  ctx.lineWidth = 1;
  for (let radius = 36; radius <= 248; radius += 26) {
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (let index = 0; index < 24; index += 1) {
    const angle = (index / 24) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * 30, Math.sin(angle) * 30);
    ctx.lineTo(Math.cos(angle) * 250, Math.sin(angle) * 250);
    ctx.stroke();
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'destination-in';
  const fade = ctx.createRadialGradient(256, 256, 20, 256, 256, 256);
  fade.addColorStop(0, 'rgba(255,255,255,0.9)');
  fade.addColorStop(0.7, 'rgba(255,255,255,0.6)');
  fade.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, 512, 512);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** A tiny studio built from soft boxes: this is what metals reflect. */
function createStudioEnvironment() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, 512);
  sky.addColorStop(0, '#1b2440');
  sky.addColorStop(0.45, '#0a0f1c');
  sky.addColorStop(0.72, '#05070d');
  sky.addColorStop(1, '#020408');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1024, 512);

  const softbox = (x, y, w, h, color, strength) => {
    const gradient = ctx.createRadialGradient(x + w / 2, y + h / 2, 2, x + w / 2, y + h / 2, Math.max(w, h) * 0.72);
    gradient.addColorStop(0, `rgba(${color},${strength})`);
    gradient.addColorStop(0.55, `rgba(${color},${strength * 0.35})`);
    gradient.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, w, h);
  };

  // Top key light strip, then cool and warm rims on either side.
  softbox(300, 0, 430, 150, '255,255,255', 0.98);
  softbox(60, 120, 250, 210, '150,206,255', 0.62);
  softbox(820, 90, 210, 240, '196,168,255', 0.5);
  softbox(410, 300, 300, 120, '235,246,255', 0.28);
  softbox(120, 400, 220, 110, '255,206,150', 0.3);

  // Thin highlight bars read as strip lights in a mirror finish.
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillRect(0, 208, 1024, 5);
  ctx.fillStyle = 'rgba(140,196,255,0.35)';
  ctx.fillRect(0, 330, 1024, 3);

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Perforated metal panel, used as an alpha map so the holes are real holes. */
function createPerforationTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = '#000000';
  const spacing = 16;
  for (let y = 0; y < 256; y += spacing) {
    for (let x = 0; x < 256; x += spacing) {
      const offset = (y / spacing) % 2 === 0 ? 0 : spacing / 2;
      ctx.beginPath();
      ctx.arc(x + offset, y, 4.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/** A soft diagonal streak: the cheapest way to make glass look like glass. */
function createStreakTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, 256, 512);
  const band = ctx.createLinearGradient(0, 0, 256, 512);
  band.addColorStop(0, 'rgba(255,255,255,0)');
  band.addColorStop(0.42, 'rgba(214,238,255,0.5)');
  band.addColorStop(0.5, 'rgba(255,255,255,0.9)');
  band.addColorStop(0.58, 'rgba(214,238,255,0.4)');
  band.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = band;
  ctx.fillRect(0, 0, 256, 512);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createLabelSprite(text, color = 0x9fb0cc) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(5, 9, 16, 0.86)';
  ctx.strokeStyle = `#${new THREE.Color(color).getHexString()}`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(4, 4, 504, 120, 18);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#dbe6ff';
  ctx.font = '600 42px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 66);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  }));
  sprite.scale.set(0.4, 0.1, 1);
  return sprite;
}

/** Curved, swept fan blade with a real pitch, built once and shared. */
function createBladeGeometry(radius) {
  const inner = radius * 0.24;
  const outer = radius * 0.96;
  const radialSteps = 12;
  const chordSteps = 4;
  const sweep = Math.PI * 0.5;
  const pitch = radius * 0.13;
  const positions = [];
  const indices = [];
  for (let i = 0; i <= radialSteps; i += 1) {
    const t = i / radialSteps;
    const r = inner + (outer - inner) * t;
    const chord = Math.PI * 0.24 * (0.5 + 0.72 * t);
    const start = -chord / 2 + sweep * t * t;
    for (let j = 0; j <= chordSteps; j += 1) {
      const u = j / chordSteps;
      const angle = start + chord * u;
      const camber = Math.sin(Math.PI * u) * radius * 0.022;
      const z = pitch * t * t + camber;
      positions.push(Math.cos(angle) * r, Math.sin(angle) * r, z);
    }
  }
  const stride = chordSteps + 1;
  for (let i = 0; i < radialSteps; i += 1) {
    for (let j = 0; j < chordSteps; j += 1) {
      const a = i * stride + j;
      const b = a + 1;
      const c = a + stride + 1;
      const d = a + stride;
      indices.push(a, b, c, a, c, d);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function createPCScene(container, options = {}) {
  const testCanvas = document.createElement('canvas');
  const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
  if (!gl) throw new Error('WebGL is not available in this browser.');

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.16;
  renderer.shadowMap.enabled = true;
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
  rootGroup.add(caseGroup, partsGroup, measureGroup);
  scene.add(rootGroup);

  const state = {
    autoRotate: options.autoRotate ?? true,
    rgb: options.rgb ?? true,
    exploded: options.exploded ?? false,
    measure: false,
    explodeT: 0,
    dragging: false,
    lastInteraction: 0,
    disposed: false,
    accent: new THREE.Color(0x8b5cf6),
  };
  const explodeParts = [];
  const fanRotors = [];
  const ownedTextures = [];

  const view = {
    // Opening on the front corner pushed the board and its cooler off to the
    // left of the glass. Looking through the side panel instead puts the
    // board face-on, so the CPU and tower sit in the middle of the picture.
    theta: 1.42,
    phi: 1.24,
    radius: 3.55,
    targetTheta: 1.42,
    targetPhi: 1.24,
    targetRadius: 3.55,
    userZoom: false,
  };

  const rgbMaterials = [];
  const tempColor = new THREE.Color();

  /* --- shared geometry / material caches, so a rebuild stays cheap --------- */
  const geometryCache = new Map();
  const materialCache = new Map();

  function geo(key, factory) {
    let value = geometryCache.get(key);
    if (!value) {
      value = factory();
      value.userData.shared = true;
      geometryCache.set(key, value);
    }
    return value;
  }

  function mat(key, factory) {
    let value = materialCache.get(key);
    if (!value) {
      value = factory();
      value.userData.shared = true;
      materialCache.set(key, value);
    }
    return value;
  }

  function own(texture) {
    ownedTextures.push(texture);
    return texture;
  }

  const textureCache = new Map();

  function tex(key, factory) {
    let value = textureCache.get(key);
    if (!value) {
      value = factory();
      value.userData.shared = true;
      textureCache.set(key, value);
    }
    return value;
  }

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
    new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.5 }),
  );
  platformRing.rotation.x = -Math.PI / 2;
  platformRing.position.y = PLATFORM_Y + 0.034;
  platform.add(platformRing);

  const platformInnerRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.15, 0.0028, 6, 96),
    new THREE.MeshBasicMaterial({ color: 0x7f8db0, transparent: true, opacity: 0.26 }),
  );
  platformInnerRing.rotation.x = -Math.PI / 2;
  platformInnerRing.position.y = PLATFORM_Y + 0.034;
  platform.add(platformInnerRing);

  const glowTexture = own(createRadialGlow());
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.7, 2.7),
    new THREE.MeshBasicMaterial({
      map: glowTexture,
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0.1,
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

  /* --- RGB registration --------------------------------------------------- */

  function addRgbMaterial(material, settings = {}) {
    const entry = {
      material,
      offset: Math.random() * 0.075,
      basic: Boolean(settings.basic),
      intensity: Math.min(settings.intensity ?? 1.3, 1.45),
      accent: (settings.accent || state.accent).clone(),
    };
    rgbMaterials.push(entry);
    return material;
  }

  function rgbMaterial(type = 'standard', intensity = 1.6, accent = state.accent) {
    if (type === 'basic') {
      const material = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.9 });
      return addRgbMaterial(material, { basic: true, accent });
    }
    const material = new THREE.MeshStandardMaterial({
      color: 0x07080d,
      emissive: accent,
      emissiveIntensity: intensity,
      roughness: 0.28,
      metalness: 0.2,
    });
    return addRgbMaterial(material, { intensity, accent });
  }

  /* --- primitive helpers -------------------------------------------------- */

  function addBox(parent, width, height, depth, x, y, z, material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function addCylinder(parent, radiusTop, radiusBottom, height, x, y, z, material, segments = 24, axis = 'y') {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), material);
    if (axis === 'x') mesh.rotation.z = Math.PI / 2;
    if (axis === 'z') mesh.rotation.x = Math.PI / 2;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  /** Soft-edged box: the single biggest "looks manufactured" upgrade. */
  function addRoundedBox(parent, width, height, depth, radius, x, y, z, material, depthAxis = 'z') {
    const along = depthAxis === 'x' ? width : depthAxis === 'y' ? height : depth;
    const sx = depthAxis === 'x' ? depth : width;
    const sy = depthAxis === 'y' ? depth : height;
    // Very thin parts cannot take a bevel without turning into a blob.
    if (Math.min(sx, sy, along) < 0.007) {
      return addBox(parent, width, height, depth, x, y, z, material);
    }
    const key = `rbox:${width.toFixed(3)}:${height.toFixed(3)}:${depth.toFixed(3)}:${radius.toFixed(3)}:${depthAxis}`;
    const geometry = geo(key, () => {
      // The bevel adds its size on every side, so the inner shape is shrunk by
      // the same amount: the finished part matches the size asked for.
      const bevel = Math.min(along * 0.2, Math.min(sx, sy) * 0.06);
      const innerW = sx - bevel * 2;
      const innerH = sy - bevel * 2;
      const shape = roundedRectShape(innerW, innerH, Math.min(radius, Math.min(innerW, innerH) * 0.45));
      const extrude = new THREE.ExtrudeGeometry(shape, {
        depth: Math.max(0.0005, along - bevel * 2),
        bevelEnabled: true,
        bevelSize: bevel,
        bevelThickness: bevel,
        bevelSegments: 2,
        curveSegments: depthAxis === 'x' ? 10 : 8,
        steps: 1,
      });
      extrude.translate(0, 0, -(along - bevel * 2) / 2);
      if (depthAxis === 'x') extrude.rotateY(Math.PI / 2);
      if (depthAxis === 'y') extrude.rotateX(-Math.PI / 2);
      extrude.computeVertexNormals();
      return extrude;
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function addScrew(parent, x, y, z, radius, material, rotationY = 0) {
    const screw = new THREE.Mesh(
      geo(`screw:${radius.toFixed(4)}`, () => new THREE.CylinderGeometry(radius, radius, radius * 0.8, 8)),
      material,
    );
    screw.rotation.x = Math.PI / 2;
    screw.rotation.y = rotationY;
    screw.position.set(x, y, z);
    parent.add(screw);
    return screw;
  }

  function addInstances(parent, geometry, material, transforms) {
    if (!transforms.length) return null;
    const mesh = new THREE.InstancedMesh(geometry, material, transforms.length);
    const matrix = new THREE.Matrix4();
    transforms.forEach((entry, index) => {
      matrix.makeTranslation(entry[0], entry[1], entry[2]);
      mesh.setMatrixAt(index, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    parent.add(mesh);
    return mesh;
  }

  function addFan(parent, position, radius, fanOptions = {}) {
    const {
      rgb = false,
      accent = state.accent,
      rotationX = 0,
      rotationY = 0,
      rotationZ = 0,
      framed = true,
      frameColor = null,
      bladeColor = null,
      design = null,
      brand = '',
      spin = 1,
      opacity = 1,
      backing = true,
    } = fanOptions;
    const group = new THREE.Group();
    const border = radius * 0.085;
    const depth = radius * 0.24;
    // Each maker sells its own fan: the frame and blade tones come from the
    // brand profile unless the caller names a specific colour.
    const fanDesign = design || brandStyle(brand);
    const frameTone = frameColor ?? fanDesign.frameColor;
    const bladeTone = bladeColor ?? fanDesign.bladeColor;

    const frameMaterial = mat(`fan-frame:${frameTone}:${fanDesign.key}`, () => new THREE.MeshStandardMaterial({
      color: frameTone,
      roughness: fanDesign.dark ? 0.62 : 0.52,
      metalness: fanDesign.dark ? 0.3 : 0.45,
    }));
    const bladeMaterial = mat(`fan-blade:${bladeTone}:${fanDesign.key}`, () => new THREE.MeshStandardMaterial({
      color: bladeTone,
      roughness: fanDesign.dark ? 0.48 : 0.34,
      metalness: fanDesign.dark ? 0.18 : 0.32,
      side: THREE.DoubleSide,
    }));

    if (framed) {
      const size = (radius + border) * 2;
      const barThickness = depth * 0.86;
      const frameMaterialShared = frameMaterial;
      // Frame built from four rounded bars: no punched-hole geometry, so the
      // opening is always clean and the rotor is never covered.
      addRoundedBox(group, size, border, barThickness, border * 0.4, 0, radius + border * 0.5, 0, frameMaterialShared);
      addRoundedBox(group, size, border, barThickness, border * 0.4, 0, -radius - border * 0.5, 0, frameMaterialShared);
      addRoundedBox(group, border, size, barThickness, border * 0.4, radius + border * 0.5, 0, 0, frameMaterialShared);
      addRoundedBox(group, border, size, barThickness, border * 0.4, -radius - border * 0.5, 0, 0, frameMaterialShared);
      const opening = new THREE.Mesh(
        geo(`fan-opening:${radius.toFixed(4)}:${border.toFixed(4)}`, () => new THREE.TorusGeometry(radius + border * 0.3, border * 0.42, 8, 48)),
        frameMaterialShared,
      );
      opening.castShadow = false;
      group.add(opening);

      // Corner screws: the tiny detail that sells the scale.
      const screwMaterial = mat('fan-screw', () => new THREE.MeshStandardMaterial({ color: 0x71809b, metalness: 0.92, roughness: 0.26 }));
      const corner = radius + border * 0.22;
      for (const sx of [-1, 1]) {
        for (const sy of [-1, 1]) {
          addScrew(group, sx * corner, sy * corner, depth * 0.46, radius * 0.045, screwMaterial);
        }
      }
    } else {
      // Unframed fans still get a chunky housing ring: a hairline rim left the
      // rotor looking like a bare disc pasted onto the front panel.
      const rim = new THREE.Mesh(new THREE.TorusGeometry(radius, radius * 0.075, 10, 56), frameMaterial);
      group.add(rim);
    }

    // The light ring sits just inside the frame opening.
    const ringMaterial = rgb
      ? rgbMaterial('standard', 2.5, accent)
      : mat(`fan-ring:${accent.getHex()}`, () => new THREE.MeshStandardMaterial({
        color: 0x080b11,
        emissive: accent,
        emissiveIntensity: 0.6,
        roughness: 0.32,
        metalness: 0.2,
      }));
    const glowRing = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.93, radius * 0.028, 8, 64), ringMaterial);
    group.add(glowRing);

    // Diffuser behind the blades, so the fan never looks see-through. Fans whose
    // motor face points at the viewer skip it: seen from outside the case the
    // plate read as a dark disc floating in the back wall instead of a fan.
    if (backing) {
      const backingMesh = new THREE.Mesh(
        new THREE.CircleGeometry(radius * 0.95, 40),
        mat('fan-backing', () => new THREE.MeshStandardMaterial({ color: 0x05070c, roughness: 0.7, metalness: 0.2 })),
      );
      backingMesh.position.z = -depth * 0.42;
      group.add(backingMesh);
    }

    const rotor = new THREE.Group();
    rotor.position.z = -depth * 0.05;
    group.add(rotor);

    const bladeGeometry = geo(`fan-blade-geo:${radius.toFixed(4)}`, () => createBladeGeometry(radius));
    const bladeCount = radius > 0.11 ? 9 : 7;
    for (let index = 0; index < bladeCount; index += 1) {
      const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
      blade.rotation.z = (index * Math.PI * 2) / bladeCount;
      blade.castShadow = false;
      rotor.add(blade);
    }

    const hub = new THREE.Mesh(
      geo(`fan-hub:${radius.toFixed(4)}`, () => new THREE.CylinderGeometry(radius * 0.2, radius * 0.215, depth * 0.6, 28)),
      mat('fan-hub-mat', () => new THREE.MeshStandardMaterial({ color: 0x0d131d, roughness: 0.4, metalness: 0.55 })),
    );
    hub.rotation.x = Math.PI / 2;
    hub.position.z = depth * 0.22;
    rotor.add(hub);

    const sticker = new THREE.Mesh(
      new THREE.CircleGeometry(radius * 0.185, 32),
      new THREE.MeshStandardMaterial({
        map: tex(`hub:${fanDesign.key}:${accent.getHex()}:${brand}`, () => brandHub({ brand, accent, design: fanDesign, label: brand })),
        roughness: 0.42,
        metalness: 0.15,
      }),
    );
    sticker.position.z = depth * 0.62;
    rotor.add(sticker);

    fanRotors.push({ rotor, speed: spin * (0.55 + (radius > 0.11 ? 0 : 0.4)) });

    group.position.set(position.x, position.y, position.z);
    group.rotation.set(rotationX, rotationY, rotationZ);
    if (opacity < 1) {
      group.traverse((child) => {
        if (child.material) {
          child.material.transparent = true;
          child.material.opacity = opacity;
        }
      });
    }
    parent.add(group);
    return group;
  }

  function addGhost(parent, width, height, depth, x, y, z, accent) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      new THREE.MeshBasicMaterial({
        color: accent,
        wireframe: true,
        transparent: true,
        opacity: 0.17,
      }),
    );
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
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
    explodeParts.push({ mesh, base: mesh.position.clone(), offset });
    return mesh;
  }

  /* --- case --------------------------------------------------------------- */

  function buildCase(pcCase) {
    explodeParts.length = 0;
    const specs = pcCase?.specs || {};
    const accent = accentOf(pcCase, 0x8b5cf6);
    const design = brandStyle(pcCase?.brand);
    state.accent.copy(accent);
    const size = specs.size || 'Mid Tower';
    const scale = SIZE_SCALE[size] || 1;
    rootGroup.scale.setScalar(scale);
    rootGroup.position.y = PLATFORM_Y + (CASE_H * scale) / 2 + 0.035;

    const frameMaterial = mat(`case-frame:${design.key}`, () => new THREE.MeshStandardMaterial({
      color: design.body,
      metalness: 0.82,
      roughness: 0.28,
    }));
    const panelMaterial = mat(`case-panel:${design.key}`, () => new THREE.MeshStandardMaterial({
      color: design.panel,
      metalness: 0.55,
      roughness: 0.44,
    }));
    const interiorMaterial = mat('case-interior', () => new THREE.MeshStandardMaterial({
      color: 0x121a26,
      metalness: 0.5,
      roughness: 0.5,
      side: THREE.DoubleSide,
    }));
    const glassMaterial = mat('case-glass', () => new THREE.MeshPhysicalMaterial({
      color: 0x8ab0e0,
      metalness: 0,
      roughness: 0.03,
      transparent: true,
      opacity: 0.06,
      side: THREE.DoubleSide,
      depthWrite: false,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      envMapIntensity: 1.9,
    }));
    // Dimmer accent: at 1.25 the strips blew out to pure neon and read as
    // stray glowing bars from above instead of a light strip inside the case.
    const accentMaterial = rgbMaterial('standard', 0.42, accent);
    const glassEdgeMaterial = mat('case-glass-edge', () => new THREE.MeshStandardMaterial({
      color: 0x243449,
      metalness: 0.9,
      roughness: 0.16,
    }));

    // Floor, back and skeleton. The back wall is smoked acrylic rather than
    // an opaque plate, so swinging the camera behind the rig never hides the
    // parts behind a black slab.
    addBox(caseGroup, CASE_W, 0.028, CASE_D, 0, -CASE_H / 2, 0, panelMaterial);
    const backMaterial = mat('case-back', () => new THREE.MeshPhysicalMaterial({
      color: 0x0d1420,
      metalness: 0.2,
      roughness: 0.08,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      depthWrite: false,
      envMapIntensity: 1.5,
    }));
    const backWall = addBox(caseGroup, CASE_W, CASE_H, 0.016, 0, 0, -CASE_D / 2, backMaterial);
    backWall.castShadow = false;
    backWall.receiveShadow = false;
    backWall.renderOrder = 2;

    // The side the camera can swing behind is smoked glass, not a solid wall:
    // an opaque panel turned the whole rig into an unreadable black block.
    const smokedMaterial = mat('case-smoked', () => new THREE.MeshPhysicalMaterial({
      color: 0x0f1520,
      metalness: 0.1,
      roughness: 0.06,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      depthWrite: false,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      envMapIntensity: 1.6,
    }));
    const leftPanel = addRoundedBox(caseGroup, 0.018, CASE_H, CASE_D, 0.008, -CASE_W / 2, 0, 0, smokedMaterial, 'x');
    leftPanel.castShadow = false;
    leftPanel.receiveShadow = false;
    leftPanel.renderOrder = 4;
    registerExplode(leftPanel, new THREE.Vector3(-0.24, 0, 0));
    for (const [edgeY, height, edgeZ, length] of [
      [CASE_H / 2 - 0.03, 0.012, 0, CASE_D - 0.06],
      [-CASE_H / 2 + 0.03, 0.012, 0, CASE_D - 0.06],
      [0, CASE_H - 0.06, CASE_D / 2 - 0.03, 0.012],
      [0, CASE_H - 0.06, -CASE_D / 2 + 0.03, 0.012],
    ]) {
      addBox(caseGroup, 0.012, height, length, -CASE_W / 2 - 0.004, edgeY, edgeZ, glassEdgeMaterial).castShadow = false;
    }

    // Tempered glass side panel with polished edges and a reflection streak.
    const glass = addBox(caseGroup, 0.008, CASE_H - 0.075, CASE_D - 0.075, CASE_W / 2, 0, 0, glassMaterial);
    glass.castShadow = false;
    glass.receiveShadow = false;
    glass.renderOrder = 4;
    registerExplode(glass, new THREE.Vector3(0.26, 0, 0));
    for (const [edgeY, height, edgeZ, length] of [
      [CASE_H / 2 - 0.04, 0.012, 0, CASE_D - 0.075],
      [-CASE_H / 2 + 0.04, 0.012, 0, CASE_D - 0.075],
      [0, CASE_H - 0.075, CASE_D / 2 - 0.04, 0.012],
      [0, CASE_H - 0.075, -CASE_D / 2 + 0.04, 0.012],
    ]) {
      const edge = addBox(caseGroup, 0.014, height, length, CASE_W / 2 + 0.002, edgeY, edgeZ, glassEdgeMaterial);
      edge.castShadow = false;
    }
    const streak = new THREE.Mesh(
      new THREE.PlaneGeometry(0.42, CASE_H - 0.2),
      new THREE.MeshBasicMaterial({
        map: tex('streak', createStreakTexture),
        transparent: true,
        opacity: 0.16,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    streak.rotation.y = Math.PI / 2;
    streak.position.set(CASE_W / 2 + 0.008, 0, 0.12);
    streak.renderOrder = 5;
    caseGroup.add(streak);

    // Roof glass gets its own, clearer material: the shared glass carried the
    // studio reflection at full strength, so looking down from above turned the
    // whole rig into a flat black lid.
    const roofGlassMaterial = mat('case-roof-glass', () => new THREE.MeshPhysicalMaterial({
      color: 0xa8c6ec,
      metalness: 0,
      roughness: 0.05,
      transparent: true,
      opacity: 0.035,
      side: THREE.DoubleSide,
      depthWrite: false,
      // Clearcoat and reflections pulled right down: the roof was picking up
      // the dark studio environment, so looking down it turned into a black
      // lid over the whole rig instead of a clear top window.
      clearcoat: 0.12,
      clearcoatRoughness: 0.06,
      envMapIntensity: 0.08,
    }));
    const topGlass = addBox(caseGroup, CASE_W - 0.055, 0.007, CASE_D - 0.055, 0, CASE_H / 2 - 0.004, 0, roofGlassMaterial);
    topGlass.castShadow = false;
    topGlass.receiveShadow = false;
    topGlass.renderOrder = 4;
    registerExplode(topGlass, new THREE.Vector3(0, 0.2, 0));

    // Vertical frame posts and horizontal rails. Kept slim: at the old
    // thickness the glass box read as a heavy cage around the rig.
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        addBox(caseGroup, 0.011, CASE_H, 0.011, sx * (CASE_W / 2 - 0.02), 0, sz * (CASE_D / 2 - 0.02), frameMaterial);
      }
    }
    for (const sy of [-1, 1]) {
      addBox(caseGroup, CASE_W, 0.012, 0.012, 0, sy * (CASE_H / 2 - 0.02), CASE_D / 2 - 0.02, frameMaterial);
      addBox(caseGroup, CASE_W, 0.012, 0.012, 0, sy * (CASE_H / 2 - 0.02), -CASE_D / 2 + 0.02, frameMaterial);
      addBox(caseGroup, 0.012, 0.012, CASE_D, -CASE_W / 2 + 0.02, sy * (CASE_H / 2 - 0.02), 0, frameMaterial);
      addBox(caseGroup, 0.012, 0.012, CASE_D, CASE_W / 2 - 0.02, sy * (CASE_H / 2 - 0.02), 0, frameMaterial);
    }

    const frontPanel = specs.frontPanel || 'Mesh';
    if (frontPanel.includes('Glass')) {
      const frontGlass = addBox(caseGroup, CASE_W - 0.05, CASE_H - 0.095, 0.007, 0, 0, CASE_D / 2 + 0.004, glassMaterial);
      frontGlass.castShadow = false;
      frontGlass.receiveShadow = false;
      frontGlass.renderOrder = 4;
      registerExplode(frontGlass, new THREE.Vector3(0, 0, 0.24));
    } else {
      const perf = tex('perforation', createPerforationTexture);
      perf.repeat.set(16, 22);
      const meshMaterial = mat('case-mesh', () => new THREE.MeshStandardMaterial({
        color: 0x1b2534,
        metalness: 0.62,
        roughness: 0.5,
        alphaMap: perf,
        alphaTest: 0.35,
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
        side: THREE.DoubleSide,
      }));
      const frontMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(CASE_W - 0.05, CASE_H - 0.095),
        meshMaterial,
      );
      frontMesh.position.set(0, 0, CASE_D / 2 + 0.003);
      frontMesh.castShadow = false;
      frontMesh.renderOrder = 3;
      caseGroup.add(frontMesh);
      registerExplode(frontMesh, new THREE.Vector3(0, 0, 0.24));

      // Panel frame around the mesh so it reads as a mounted plate.
      for (const [w, h, x, y] of [
        [CASE_W - 0.05, 0.02, 0, CASE_H / 2 - 0.055],
        [CASE_W - 0.05, 0.02, 0, -CASE_H / 2 + 0.055],
        [0.02, CASE_H - 0.09, -CASE_W / 2 + 0.035, 0],
        [0.02, CASE_H - 0.09, CASE_W / 2 - 0.035, 0],
      ]) {
        addBox(caseGroup, w, h, 0.02, x, y, CASE_D / 2 + 0.008, frameMaterial).castShadow = false;
      }

      if (frontPanel.includes('Wood')) {
        // Real North has slats right across the front: they used to cover only
        // the left half and stand outside the frame, so the case looked broken.
        // Darker walnut: at the mid tone the studio light blew the planks out
        // to pale cream, so the front read as painted pine instead of wood.
        const wood = mat('case-wood', () => new THREE.MeshStandardMaterial({ color: 0x4e3117, roughness: 0.86, metalness: 0.04 }));
        const slats = 7;
        const usable = CASE_W - 0.075;
        // Narrower planks with wider gaps: the intake fans sit right behind
        // the front panel, and wide slats closed over them so the whole front
        // read as a solid cover instead of a vented front. The gaps are wider
        // than the planks so each intake fan reads as a full circle of blades
        // through the wood, the way the real North shows its front fans.
        const slatWidth = usable / slats - 0.042;
        for (let index = 0; index < slats; index += 1) {
          const slatX = -usable / 2 + (usable / slats) * (index + 0.5);
          // Flush with the panel frame: standing proud of it the planks looked
          // like they were falling off the front of the case.
          addRoundedBox(caseGroup, slatWidth, CASE_H - 0.13, 0.016, 0.005, slatX, 0, CASE_D / 2 + 0.006, wood, 'y').castShadow = false;
        }
      }
    }

    // Accent light strips sit just inside the frame. They used to float a few
    // millimetres outside the mesh and the glass, which read as glowing bars
    // hanging off the case from any angle.
    // Both strips are kept short and low: running the full height they glowed
    // over the wood slats and across the roof, so the top view showed two stray
    // neon bars instead of a clean front.
    const frontStrip = addBox(caseGroup, 0.011, CASE_H - 0.64, 0.01, CASE_W / 2 - 0.042, -0.1, CASE_D / 2 - 0.005, accentMaterial);
    frontStrip.castShadow = false;
    // The roof bar is gone. Seen from above it cut a bright neon line straight
    // across the top of the case, which read as a stray glowing stick rather
    // than part of the chassis.

    // Front I/O: a real button, USB ports and an audio jack.
    const buttonRing = new THREE.Mesh(new THREE.TorusGeometry(0.019, 0.004, 8, 28), accentMaterial);
    buttonRing.position.set(CASE_W / 2 - 0.13, CASE_H / 2 - 0.07, CASE_D / 2 + 0.018);
    buttonRing.castShadow = false;
    caseGroup.add(buttonRing);
    const buttonMaterial = mat('case-button', () => new THREE.MeshStandardMaterial({ color: 0x151d29, metalness: 0.72, roughness: 0.3 }));
    const powerButton = addCylinder(caseGroup, 0.013, 0.013, 0.01, CASE_W / 2 - 0.13, CASE_H / 2 - 0.07, CASE_D / 2 + 0.02, buttonMaterial, 20, 'z');
    powerButton.castShadow = false;
    for (let index = 0; index < 2; index += 1) {
      addBox(caseGroup, 0.03, 0.011, 0.007, CASE_W / 2 - 0.22 - index * 0.045, CASE_H / 2 - 0.07, CASE_D / 2 + 0.017, buttonMaterial).castShadow = false;
    }
    addCylinder(caseGroup, 0.006, 0.006, 0.008, CASE_W / 2 - 0.075, CASE_H / 2 - 0.07, CASE_D / 2 + 0.018, buttonMaterial, 14, 'z').castShadow = false;

    // Maker badge on the front panel, in the brand's own plate style.
    if (pcCase) {
      const badge = new THREE.Mesh(
        new THREE.PlaneGeometry(0.12, 0.028),
        new THREE.MeshStandardMaterial({
          map: tex(`case-badge:${design.key}:${accent.getHex()}:${pcCase.id}`, () => brandPlate({
            brand: pcCase.brand,
            title: design.mark,
            sub: (specs.size || 'CASE').toUpperCase(),
            accent,
            design,
          })),
          roughness: 0.4,
          metalness: 0.32,
          transparent: true,
        }),
      );
      badge.position.set(-CASE_W / 2 + 0.14, -CASE_H / 2 + 0.038, CASE_D / 2 + 0.008);
      badge.castShadow = false;
      caseGroup.add(badge);
    }

    // Rubber-capped feet.
    const footMaterial = mat('case-foot', () => new THREE.MeshStandardMaterial({ color: 0x1b2230, metalness: 0.7, roughness: 0.36 }));
    const rubberMaterial = mat('case-rubber', () => new THREE.MeshStandardMaterial({ color: 0x05070b, roughness: 0.92, metalness: 0.05 }));
    for (const x of [-CASE_W / 2 + 0.07, CASE_W / 2 - 0.07]) {
      for (const z of [-CASE_D / 2 + 0.07, CASE_D / 2 - 0.07]) {
        addCylinder(caseGroup, 0.024, 0.027, 0.036, x, -CASE_H / 2 - 0.016, z, footMaterial, 18).castShadow = false;
        addCylinder(caseGroup, 0.026, 0.026, 0.006, x, -CASE_H / 2 - 0.034, z, rubberMaterial, 18).castShadow = false;
      }
    }

    // Interior shelf: an open frame along the edges, not a full plate, so the
    // top-down view shows the rig instead of a lid.
    addBox(caseGroup, CASE_W - 0.04, 0.012, 0.06, 0, CASE_H / 2 - 0.062, -CASE_D / 2 + 0.05, interiorMaterial).castShadow = false;
    for (const sx of [-1, 1]) {
      addBox(caseGroup, 0.05, 0.012, CASE_D - 0.05, sx * (CASE_W / 2 - 0.045), CASE_H / 2 - 0.062, 0, interiorMaterial).castShadow = false;
    }
    const grommetMaterial = mat('case-grommet', () => new THREE.MeshStandardMaterial({ color: 0x0a0e15, roughness: 0.85, metalness: 0.1 }));
    for (const [gy, gz] of [[0.24, 0.22], [-0.06, 0.24], [-0.3, 0.16]]) {
      addRoundedBox(caseGroup, 0.006, 0.075, 0.075, 0.02, BOARD_X + 0.09, gy, gz, grommetMaterial, 'x').castShadow = false;
    }
    // A cable-management bar used to sit on this line. With the case narrowed
    // to fit the build it lands inside the opaque shroud, so it is gone rather
    // than kept as an invisible leftover.

    // Rear panel details. The back wall is smoked glass so the interior stays
    // visible, but with the slot covers alone the back read as a bare sheet:
    // it now carries the parts a real case back has outside it.
    const rearZ = -CASE_D / 2 - 0.018;
    const rearPlate = mat('case-rear-plate', () => new THREE.MeshStandardMaterial({
      color: 0x3c4655,
      metalness: 0.82,
      roughness: 0.28,
    }));
    const portMaterial = mat('case-rear-port', () => new THREE.MeshStandardMaterial({ color: 0x070a10, roughness: 0.62, metalness: 0.3 }));
    // Rear I/O cluster: the USB, LAN, audio and video ports, as a grid of cut
    // outs behind the board's shields.
    addRoundedBox(caseGroup, 0.19, 0.11, 0.008, 0.006, BOARD_X + 0.03, 0.335, rearZ, rearPlate, 'y').castShadow = false;
    for (let index = 0; index < 5; index += 1) {
      addBox(caseGroup, 0.026, 0.018, 0.006, BOARD_X - 0.01 + index * 0.032, 0.355, rearZ - 0.005, portMaterial).castShadow = false;
    }
    for (let index = 0; index < 3; index += 1) {
      addBox(caseGroup, 0.03, 0.022, 0.006, BOARD_X + 0.055 + index * 0.036, 0.31, rearZ - 0.005, portMaterial).castShadow = false;
    }
    // Expansion slot covers on the rear panel, each with a thumbscrew.
    for (let index = 0; index < 7; index += 1) {
      const coverY = 0.18 - index * 0.062;
      addBox(caseGroup, 0.02, 0.05, 0.012, BOARD_X + 0.03, coverY, -CASE_D / 2 + 0.012, frameMaterial).castShadow = false;
      addScrew(caseGroup, BOARD_X + 0.03, coverY, -CASE_D / 2 + 0.02, 0.005, frameMaterial);
    }
    // Power supply cut-out: the IEC socket, the rocker switch and a vent grid,
    // which is what you actually see at the bottom of a case back.
    addRoundedBox(caseGroup, 0.36, 0.14, 0.008, 0.006, 0.01, -0.4, rearZ, rearPlate, 'y').castShadow = false;
    addBox(caseGroup, 0.06, 0.05, 0.01, -0.06, -0.4, rearZ - 0.005, portMaterial).castShadow = false;
    addBox(caseGroup, 0.022, 0.026, 0.01, 0.02, -0.4, rearZ - 0.005, portMaterial).castShadow = false;
    for (let index = 0; index < 9; index += 1) {
      addBox(caseGroup, 0.004, 0.1, 0.006, 0.07 + index * 0.012, -0.4, rearZ - 0.004, portMaterial).castShadow = false;
    }
    // Vent slots beside the rear fan opening.
    for (let index = 0; index < 6; index += 1) {
      addBox(caseGroup, 0.09, 0.008, 0.006, -0.17, 0.55 + index * 0.014, rearZ - 0.004, portMaterial).castShadow = false;
    }

    platformRing.material.color.copy(accent);
    glow.material.color.copy(accent);
    return { accent, size, scale, specs };
  }

  /* --- motherboard -------------------------------------------------------- */

  function buildMotherboard(build) {
    const board = getItems(build, 'motherboard')[0];
    const accent = accentOf(board, 0x38bdf8);
    const design = brandStyle(board?.brand);
    const pcbTexture = board ? tex(`pcb:${accent.getHex()}:${design.key}`, () => createPcbTexture(accent)) : null;
    // The board sits right behind the smoked glass, so it must stay dark:
    // a bright PCB plus glass haze turned the whole side view milky blue.
    // Tinted again: at 0x9aa7b8 the board read as a pale concrete slab with
    // tiny traces on it, not a green-black circuit board.
    const pcbMaterial = new THREE.MeshStandardMaterial({
      color: 0x5f7080,
      map: pcbTexture,
      emissive: 0x03090e,
      emissiveIntensity: 0.25,
      roughness: 0.72,
      metalness: 0.18,
      envMapIntensity: 0.25,
    });
    if (!board) pcbMaterial.color.set(0x0a151d);
    const boardMesh = addBox(partsGroup, 0.016, BOARD_H, BOARD_D, BOARD_X, BOARD_Y, BOARD_REAR_Z + BOARD_D / 2, pcbMaterial);
    if (!board) {
      boardMesh.material.transparent = true;
      boardMesh.material.opacity = 0.35;
      boardMesh.material.wireframe = true;
    }

    const slotMaterial = mat('mb-slot', () => new THREE.MeshStandardMaterial({ color: 0x05070c, roughness: 0.44, metalness: 0.4 }));
    const heatsinkMaterial = mat(`mb-heatsink:${design.key}`, () => new THREE.MeshStandardMaterial({
      color: design.body,
      metalness: Math.max(0.62, design.metalness),
      roughness: Math.min(0.3, design.roughness),
    }));
    const darkMetal = mat('mb-darkmetal', () => new THREE.MeshStandardMaterial({ color: 0x10161f, metalness: 0.7, roughness: 0.34 }));
    const trimMaterial = mat(`mb-trim:${accent.getHex()}`, () => new THREE.MeshStandardMaterial({
      color: 0x070a10,
      emissive: accent,
      // Emissive at 0.4 turned the VRM and I/O strips into two bright red
      // rectangles floating in the dark; they are accents on a heatsink, not
      // light bars.
      emissiveIntensity: 0.16,
      roughness: 0.38,
      metalness: 0.3,
    }));
    const goldMaterial = mat('mb-gold', () => new THREE.MeshStandardMaterial({ color: 0xc9a05a, metalness: 1, roughness: 0.28 }));

    // Rear I/O shroud with an etched accent and port cutouts (faces -Z).
    addRoundedBox(partsGroup, 0.03, 0.2, 0.14, 0.008, BOARD_X + 0.02, 0.33, BOARD_REAR_Z + 0.05, heatsinkMaterial, 'x');
    addBox(partsGroup, 0.008, 0.05, 0.12, BOARD_X + 0.038, 0.33, BOARD_REAR_Z + 0.05, trimMaterial).castShadow = false;
    for (let index = 0; index < 4; index += 1) {
      addBox(partsGroup, 0.024, 0.014, 0.03, BOARD_X + 0.016, 0.39 - index * 0.022, BOARD_REAR_Z + 0.004, slotMaterial).castShadow = false;
    }
    addBox(partsGroup, 0.024, 0.02, 0.032, BOARD_X + 0.016, 0.295, BOARD_REAR_Z + 0.004, slotMaterial).castShadow = false;

    // VRM heatsinks with parallel fins.
    const vrmFins = [];
    for (let index = 0; index < 9; index += 1) vrmFins.push([BOARD_X + 0.047, 0.33, BOARD_REAR_Z + 0.085 + index * 0.016]);
    addInstances(partsGroup, new THREE.BoxGeometry(0.05, 0.17, 0.007), heatsinkMaterial, vrmFins);
    addBox(partsGroup, 0.026, 0.19, 0.16, BOARD_X + 0.032, 0.33, BOARD_REAR_Z + 0.09, darkMetal);
    addBox(partsGroup, 0.006, 0.12, 0.012, BOARD_X + 0.07, 0.33, BOARD_REAR_Z + 0.09, trimMaterial).castShadow = false;

    // Chipset heatsink, low profile, with an angled accent face.
    addRoundedBox(partsGroup, 0.03, 0.1, 0.15, 0.006, BOARD_X + 0.026, -0.13, 0.055, heatsinkMaterial, 'x');
    const chipFins = [];
    for (let index = 0; index < 7; index += 1) chipFins.push([BOARD_X + 0.043, -0.13, -0.005 + index * 0.022]);
    addInstances(partsGroup, new THREE.BoxGeometry(0.006, 0.075, 0.01), darkMetal, chipFins);
    addBox(partsGroup, 0.008, 0.028, 0.1, BOARD_X + 0.044, -0.13, 0.055, trimMaterial).castShadow = false;

    // Maker logo printed on the chipset heatsink: the board's calling card.
    if (board) {
      const logo = new THREE.Mesh(
        new THREE.PlaneGeometry(0.115, 0.052),
        new THREE.MeshStandardMaterial({
          map: tex(`mb-logo:${design.key}:${board.id ?? board.brand}:${accent.getHex()}`, () => brandLogo({
            brand: board.brand,
            accent,
            design,
            text: design.mark,
          })),
          roughness: 0.35,
          metalness: 0.4,
          transparent: true,
        }),
      );
      logo.rotation.y = Math.PI / 2;
      logo.position.set(BOARD_X + 0.0465, -0.13, 0.055);
      logo.castShadow = false;
      partsGroup.add(logo);
    }

    // DIMM slots: four upright rails 4.8 cm apart, each with gold contacts at
    // the mouth and a latch clip at both ends. The first pass drew them 0.3 long
    // in z and only 0.038 apart, so all four overlapped into one bar lying
    // along the board's foot and the memory had nothing to stand in.
    // The socket is a short upright rail behind the module's lower half: the
    // stick plugs into it and stands on top of it. This is what makes the
    // memory read as seated, instead of a plate pasted flat on the board.
    const dimmBase = [];
    for (let index = 0; index < 4; index += 1) {
      const z = DIMM_Z0 + index * DIMM_PITCH;
      addBox(partsGroup, 0.04, 0.1, 0.046, BOARD_X + 0.02, 0.19, z, slotMaterial).castShadow = false;
      addBox(partsGroup, 0.01, 0.018, 0.05, BOARD_X + 0.041, 0.155, z, goldMaterial).castShadow = false;
      // Clips at both ends of the rail, the way a real DIMM slot latches a stick.
      dimmBase.push([BOARD_X + 0.02, 0.245, z - 0.022]);
      dimmBase.push([BOARD_X + 0.02, 0.245, z + 0.022]);
    }
    addInstances(partsGroup, new THREE.BoxGeometry(0.044, 0.022, 0.01), darkMetal, dimmBase);

    // PCIe x16 slot with a reinforced metal head.
    addBox(partsGroup, 0.02, 0.022, 0.31, BOARD_X + 0.014, -0.115, -0.1, slotMaterial);
    addBox(partsGroup, 0.026, 0.03, 0.05, BOARD_X + 0.016, -0.115, -0.255, heatsinkMaterial).castShadow = false;
    addBox(partsGroup, 0.026, 0.03, 0.05, BOARD_X + 0.016, -0.115, 0.052, heatsinkMaterial).castShadow = false;

    // M.2 drive bay plus its heatsink cover.
    addBox(partsGroup, 0.014, 0.012, 0.2, BOARD_X + 0.012, 0.145, -0.02, slotMaterial).castShadow = false;
    addRoundedBox(partsGroup, 0.024, 0.024, 0.22, 0.005, BOARD_X + 0.028, 0.155, -0.02, heatsinkMaterial, 'x');
    addBox(partsGroup, 0.006, 0.004, 0.14, BOARD_X + 0.041, 0.155, -0.02, trimMaterial).castShadow = false;

    // 24-pin connector and the front-panel header.
    addBox(partsGroup, 0.034, 0.1, 0.05, BOARD_X + 0.024, 0.24, BOARD_FRONT_Z - 0.06, slotMaterial);
    addBox(partsGroup, 0.034, 0.022, 0.06, BOARD_X + 0.024, -0.045, BOARD_FRONT_Z - 0.06, slotMaterial).castShadow = false;

    // Solid capacitors and a scatter of surface-mount parts.
    const capMaterial = mat('mb-cap', () => new THREE.MeshStandardMaterial({ color: 0x1b2536, metalness: 0.7, roughness: 0.32 }));
    const caps = [];
    for (let index = 0; index < 12; index += 1) {
      caps.push([BOARD_X + 0.036, -0.08 + (index % 4) * 0.05, 0.02 + Math.floor(index / 4) * 0.05]);
    }
    const capGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.042, 10);
    const capMesh = new THREE.InstancedMesh(capGeo, capMaterial, caps.length);
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);
    const unitScale = new THREE.Vector3(1, 1, 1);
    caps.forEach((entry, index) => {
      matrix.compose(new THREE.Vector3(entry[0], entry[1], entry[2]), quaternion, unitScale);
      capMesh.setMatrixAt(index, matrix);
    });
    capMesh.instanceMatrix.needsUpdate = true;
    partsGroup.add(capMesh);

    // Debug LED block: four tiny status lights. Basic material made them glow
    // at full brightness, so from above the board carried a rainbow strip of
    // four squares that looked like a stray graphic rather than status LEDs.
    const ledColors = [0xff4d5e, 0xfbbf24, 0x6ee7b7, 0x67e8f9];
    ledColors.forEach((color, index) => {
      const led = addBox(
        partsGroup,
        0.008,
        0.004,
        0.004,
        BOARD_X + 0.012,
        0.4,
        BOARD_FRONT_Z - 0.11 + index * 0.007,
        new THREE.MeshStandardMaterial({
          color: 0x0b0f16,
          emissive: color,
          emissiveIntensity: 0.35,
          roughness: 0.4,
        }),
      );
      led.castShadow = false;
    });

    // Board screws.
    const screwMaterial = mat('mb-screw', () => new THREE.MeshStandardMaterial({ color: 0x8a99b2, metalness: 0.95, roughness: 0.22 }));
    for (const [sy, sz] of [[0.36, 0.06], [0.36, 0.55], [-0.26, 0.06], [-0.26, 0.55], [0.06, 0.55], [0.06, 0.06]]) {
      addScrew(partsGroup, BOARD_X + 0.02, sy, BOARD_REAR_Z + sz, 0.009, screwMaterial);
    }

    return { board, accent };
  }

  /* --- CPU and cooler ----------------------------------------------------- */

  function buildCpuAndCooler(build) {
    const cpu = getItems(build, 'cpu')[0];
    const cooler = getItems(build, 'cooler')[0];
    const coolerAccent = accentOf(cooler, 0x22d3ee);
    const cpuX = BOARD_X + 0.045;
    const cpuAccent = accentOf(cpu, 0x5b8cff);

    if (cpu) {
      const ihsMaterial = mat('cpu-ihs', () => new THREE.MeshStandardMaterial({
        color: 0xb9c6d6,
        metalness: 0.98,
        roughness: 0.18,
      }));
      addBox(partsGroup, 0.024, 0.115, 0.115, cpuX, CPU_Y, CPU_Z, ihsMaterial);
      const cpuGlow = addBox(partsGroup, 0.005, 0.07, 0.07, cpuX + 0.016, CPU_Y, CPU_Z, new THREE.MeshStandardMaterial({
        color: 0x0a0d14,
        emissive: cpuAccent,
        emissiveIntensity: 1,
        roughness: 0.36,
      }));
      cpuGlow.castShadow = false;
      addBox(partsGroup, 0.008, 0.03, 0.09, cpuX + 0.02, CPU_Y - 0.03, CPU_Z, new THREE.MeshStandardMaterial({
        color: 0x10161f,
        metalness: 0.6,
        roughness: 0.4,
      })).castShadow = false;
    } else {
      addGhost(partsGroup, 0.06, 0.12, 0.12, cpuX, CPU_Y, CPU_Z, 0x5b8cff);
    }

    if (!cooler) {
      addGhost(partsGroup, 0.22, 0.3, 0.2, BOARD_X + 0.16, CPU_Y + 0.06, CPU_Z, coolerAccent);
      return;
    }

    if (cooler.specs.type === 'Air') {
      // Air coolers are where brands look most different: Noctua's beige and
      // brown, be quiet!'s blackout, Thermalright's silver stack.
      const finish = coolerFinish(cooler);
      const coolerDesign = brandStyle(cooler.brand);
      const finMaterial = mat(`cooler-fin:${finish.fins}`, () => new THREE.MeshStandardMaterial({
        color: finish.fins,
        metalness: finish.dark ? 0.62 : 0.92,
        roughness: finish.dark ? 0.44 : 0.22,
      }));
      const copperMaterial = mat(`cooler-copper:${finish.copper}`, () => new THREE.MeshStandardMaterial({
        // Tinted well down: at full copper the cold plate caught the studio
        // light and read as a tan bar lying under the fin stack.
        color: new THREE.Color(finish.copper).multiplyScalar(0.3),
        metalness: 0.85,
        roughness: 0.4,
      }));
      const plateMaterial = mat(`cooler-plate:${finish.plate}`, () => new THREE.MeshStandardMaterial({ color: finish.plate, metalness: 0.5, roughness: 0.42 }));
      const towerX = BOARD_X + 0.165;
      const baseY = CPU_Y;
      // Base plate is a small cold plate under the fins, not a shelf: at
      // 0.2 wide it stuck out past the fin stack and read as a tan plank.
      addRoundedBox(partsGroup, 0.135, 0.02, 0.135, 0.006, towerX, baseY, CPU_Z, copperMaterial, 'y');
      // Fin stack, drawn as one instanced mesh: 22 thin plates.
      const fins = [];
      for (let index = 0; index < 22; index += 1) fins.push([towerX, baseY + 0.028 + index * 0.0132, CPU_Z]);
      addInstances(partsGroup, new THREE.BoxGeometry(0.225, 0.0035, 0.195), finMaterial, fins);
      // Top and bottom plates tie the fin stack together without hiding it.
      // Both take the fin tone: a brighter plate material turned the bottom
      // edge into a tan plank lying across the board.
      addRoundedBox(partsGroup, 0.228, 0.01, 0.2, 0.004, towerX, baseY + 0.318, CPU_Z, finMaterial, 'y');
      addRoundedBox(partsGroup, 0.228, 0.006, 0.2, 0.003, towerX, baseY + 0.03, CPU_Z, finMaterial, 'y');
      // Heat pipes rising through the stack.
      for (let index = 0; index < 4; index += 1) {
        const px = towerX - 0.055 + (index % 2) * 0.11;
        const pz = CPU_Z - 0.045 + Math.floor(index / 2) * 0.09;
        addCylinder(partsGroup, 0.0085, 0.0085, 0.29, px, baseY + 0.155, pz, copperMaterial, 10).castShadow = false;
      }
      // Brand plate across the top of the tower.
      const plate = new THREE.Mesh(
        new THREE.PlaneGeometry(0.16, 0.04),
        new THREE.MeshStandardMaterial({
          map: tex(`plate:${coolerDesign.key}:${cooler.name}:${coolerAccent.getHex()}`, () => brandPlate({
            brand: cooler.brand,
            title: coolerDesign.mark,
            sub: cooler.name ? cooler.name.slice(0, 24) : 'TOWER COOLER',
            accent: coolerAccent,
            design: coolerDesign,
          })),
          roughness: 0.4,
          metalness: 0.3,
        }),
      );
      plate.position.set(towerX + 0.062, baseY + 0.28, CPU_Z);
      plate.rotation.y = Math.PI / 2;
      partsGroup.add(plate);
      // The blade face points at the glass. Flipped the other way the fan's
      // solid backing disc faced out and read as a dark plate bolted to the
      // side of the fin stack. Kept on the rear side of the tower so it never
      // stands in front of the DIMM row.
      addFan(partsGroup, { x: towerX, y: baseY + 0.165, z: CPU_Z - 0.115 }, 0.09, {
        rgb: Boolean(cooler.specs.rgb),
        accent: coolerAccent,
        framed: false,
        brand: cooler.brand || '',
        design: coolerDesign,
        frameColor: finish.frame,
        bladeColor: finish.blades,
        rotationY: Math.PI,
      });
      // One fan only. A push-pull pair put a second rotor behind the fins, and
      // seen through the side glass it read as a stray third fan next to the
      // real one.
      return;
    }

    // Liquid cooler: block, pump cap, radiator, tubes.
    const aioDesign = brandStyle(cooler.brand);
    const pumpMaterial = mat(`aio-pump:${aioDesign.key}`, () => new THREE.MeshStandardMaterial({
      color: aioDesign.dark ? 0x0c0f14 : aioDesign.body,
      metalness: 0.72,
      roughness: 0.26,
    }));
    const pump = addRoundedBox(partsGroup, 0.05, 0.135, 0.135, 0.014, cpuX + 0.022, CPU_Y, CPU_Z, pumpMaterial, 'x');
    pump.castShadow = true;
    const pumpFace = addCylinder(partsGroup, 0.056, 0.056, 0.008, cpuX + 0.05, CPU_Y, CPU_Z, mat('aio-face', () => new THREE.MeshStandardMaterial({ color: 0x080c14, metalness: 0.5, roughness: 0.2 })), 36, 'x');
    pumpFace.castShadow = false;
    const pumpRing = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.007, 8, 40), rgbMaterial('standard', 2.6, coolerAccent));
    pumpRing.rotation.y = Math.PI / 2;
    pumpRing.position.set(cpuX + 0.055, CPU_Y, CPU_Z);
    partsGroup.add(pumpRing);
    const pumpLogo = new THREE.Mesh(
      new THREE.CircleGeometry(0.042, 32),
      new THREE.MeshStandardMaterial({
        map: tex(`aio:${aioDesign.key}:${coolerAccent.getHex()}`, () => brandHub({
          brand: cooler.brand,
          accent: coolerAccent,
          design: aioDesign,
          label: aioDesign.mark,
        })),
        roughness: 0.4,
        metalness: 0.25,
      }),
    );
    pumpLogo.rotation.y = Math.PI / 2;
    pumpLogo.position.set(cpuX + 0.056, CPU_Y, CPU_Z);
    partsGroup.add(pumpLogo);
    // Tube sockets at the top of the block.
    for (const dz of [-0.03, 0.03]) {
      addCylinder(partsGroup, 0.012, 0.012, 0.02, cpuX + 0.032, CPU_Y + 0.075, CPU_Z + dz, pumpMaterial, 12);
    }

    const fanCount = Math.min(3, Math.max(2, Math.round((Number(cooler.specs.radiatorSize) || 240) / 120)));
    const radiatorY = CASE_H / 2 - 0.075;
    const radiatorZ = 0.0;
    const radW = fanCount * 0.185 + 0.04;
    const radiatorMaterial = mat(`aio-rad:${aioDesign.key}`, () => new THREE.MeshStandardMaterial({ color: aioDesign.panel, metalness: 0.8, roughness: 0.3 }));
    addRoundedBox(partsGroup, radW, 0.036, 0.26, 0.008, -0.02, radiatorY, radiatorZ, radiatorMaterial, 'y');
    // Radiator fin rows.
    const radFins = [];
    const radFinCount = Math.max(14, Math.round(radW * 42));
    for (let index = 0; index < radFinCount; index += 1) {
      radFins.push([-0.02 - radW / 2 + 0.022 + index * ((radW - 0.044) / (radFinCount - 1)), radiatorY, radiatorZ]);
    }
    addInstances(partsGroup, new THREE.BoxGeometry(0.004, 0.03, 0.24), mat('aio-radfin', () => new THREE.MeshStandardMaterial({ color: 0x2c3a4f, metalness: 0.9, roughness: 0.24 })), radFins);
    for (const side of [-1, 1]) {
      addBox(partsGroup, 0.012, 0.042, 0.24, -0.02 + side * radW / 2, radiatorY, radiatorZ, radiatorMaterial).castShadow = false;
    }
    const radGlow = addBox(partsGroup, radW - 0.05, 0.006, 0.007, -0.02, radiatorY + 0.021, radiatorZ + 0.125, rgbMaterial('standard', 1.25, coolerAccent));
    radGlow.castShadow = false;
    const fanY = radiatorY - 0.06;
    for (let index = 0; index < fanCount; index += 1) {
      addFan(partsGroup, {
        x: -0.02 - (fanCount - 1) * 0.09 + index * 0.18,
        y: fanY,
        z: radiatorZ,
      }, 0.082, {
        rgb: Boolean(cooler.specs.rgb),
        accent: coolerAccent,
        rotationX: Math.PI / 2,
        // Round rims, not square frames: three framed fans in a row stacked
        // their bars into a cage over the radiator blades.
        framed: false,
        brand: cooler.brand || '',
        design: aioDesign,
      });
    }

    // Braided, slightly glossy tubing back to the radiator.
    // Two short arcs from the pump up to the radiator: offset in Z so they do
    // not overlap, and rising the whole way so they never sag across the GPU.
    addCable(partsGroup, [
      [cpuX + 0.03, CPU_Y + 0.07, CPU_Z + 0.028],
      [cpuX + 0.05, CPU_Y + 0.2, CPU_Z + 0.075],
      [radiatorZ + 0.055, radiatorY - 0.14, radiatorZ + 0.06],
      [radiatorZ + 0.02, radiatorY - 0.02, radiatorZ + 0.05],
    ], 0.011, 0x1a2029);
    addCable(partsGroup, [
      [cpuX + 0.03, CPU_Y + 0.07, CPU_Z - 0.028],
      [cpuX + 0.05, CPU_Y + 0.21, CPU_Z - 0.075],
      [radiatorZ + 0.055, radiatorY - 0.13, radiatorZ + 0.055],
      [radiatorZ + 0.02, radiatorY - 0.02, radiatorZ + 0.045],
    ], 0.011, 0x1a2029);
  }

  /* --- memory ------------------------------------------------------------- */

  function buildMemory(build) {
    const kits = getItems(build, 'ram');
    const accent = accentOf(kits[0], 0xf472b6);
    const design = brandStyle(kits[0]?.brand);
    const trim = memoryStyle(kits[0]);
    const modules = kits.length
      ? Math.min(4, kits.reduce((sum, kit) => sum + (Number(kit.specs.modules) || 0), 0))
      : 0;
    const hasRgb = kits.some((kit) => kit.specs.rgb);
    const count = modules || 2;
    const stickMaterial = mat('ram-stick', () => new THREE.MeshStandardMaterial({
      color: 0x1d2735,
      metalness: 0.62,
      roughness: 0.34,
    }));
    // Vengeance LPX is a flat matte plate, Trident Z5 is brushed aluminium with
    // a finned crown, Fury Beast is a black slab with an accent slash: three
    // different kits, three different materials.
    const heatspreaderMaterial = mat(`ram-heat:${design.key}`, () => new THREE.MeshStandardMaterial({
      color: design.body,
      metalness: trim.top === 'fin' ? 0.95 : 0.8,
      roughness: trim.top === 'fin' ? 0.18 : 0.3,
    }));
    // Crown plate is the brand accent mixed well down into a dark metal. At full
    // accent strength the two sticks read as hot pink glowing slabs from above
    // instead of the dark heatspreader tops a real kit has.
    const crownMaterial = mat(`ram-crown:${design.key}:${accent.getHex()}`, () => new THREE.MeshStandardMaterial({
      color: new THREE.Color(accent).multiplyScalar(0.18),
      metalness: 0.6,
      roughness: 0.38,
    }));
    const darkTrim = mat('ram-trim', () => new THREE.MeshStandardMaterial({ color: 0x0a0f16, roughness: 0.5, metalness: 0.4 }));

    for (let index = 0; index < count; index += 1) {
      const z = DIMM_Z0 + index * DIMM_PITCH;
      // It stands UP out of the socket: 20 cm tall, 7 cm across, and its lower
      // edge sits inside the rail's 14-24 cm band, so it is plugged in rather
      // than floating. Before, it was 32 cm tall and 1 cm thin and rose past
      // the board's top edge, which is why it read as a pole lying on the board.
      const stickY = 0.27;
      const stickH = 0.24;
      // Narrower than the slot pitch, so two sticks read as two separate
      // modules with a gap between them instead of one wide pink block.
      const stickZ = 0.03;
      if (!modules) {
        addGhost(partsGroup, 0.03, stickH, stickZ, BOARD_X + 0.034, stickY, z, accent);
        continue;
      }
      // Thin through the glass, wide along the board, 20 cm tall: the face you
      // see through the window is the tall plate with the brand print on it.
      addBox(partsGroup, 0.028, stickH, stickZ, BOARD_X + 0.028, stickY, z, stickMaterial);
      addRoundedBox(partsGroup, 0.032, stickH, 0.034, 0.004, BOARD_X + 0.034, stickY, z, heatspreaderMaterial, 'x');

      const topMaterial = hasRgb
        ? rgbMaterial('standard', 0.22, accent)
        : new THREE.MeshStandardMaterial({ color: 0x05070b, emissive: new THREE.Color(accent).multiplyScalar(0.45), emissiveIntensity: 0.4, roughness: 0.32 });
      const crownY = stickY + stickH / 2;
      // A thin lit diffuser band across the TOP edge of the plate, the way a
      // real RGB kit glows through the window. It used to be a vertical bar
      // 13 cm tall down the face at full strength, which read as a hot pink
      // slab standing in front of the stick instead of a light strip.
      const diffuserMaterial = hasRgb
        ? rgbMaterial('standard', 0.3, accent)
        : new THREE.MeshStandardMaterial({
          color: 0x080b11,
          emissive: new THREE.Color(accent).multiplyScalar(0.5),
          emissiveIntensity: 0.35,
          roughness: 0.3,
        });
      addBox(partsGroup, 0.005, 0.016, 0.03, BOARD_X + 0.051, crownY - 0.012, z, diffuserMaterial).castShadow = false;

      if (trim.top === 'fin') {
        // Trident Z: a comb of little fins across the top of the spreader.
        const teeth = [];
        for (let tooth = 0; tooth < 7; tooth += 1) teeth.push([BOARD_X + 0.034, crownY + 0.008, z - 0.012 + tooth * 0.004]);
        addInstances(partsGroup, new THREE.BoxGeometry(0.032, 0.014, 0.0016), crownMaterial, teeth);
        addRoundedBox(partsGroup, 0.032, 0.008, 0.032, 0.003, BOARD_X + 0.034, crownY + 0.002, z, topMaterial, 'y').castShadow = false;
      } else if (trim.top === 'low') {
        // LPX: nothing on top but a thin dark cap.
        addBox(partsGroup, 0.032, 0.004, 0.032, BOARD_X + 0.034, crownY + 0.002, z, darkTrim).castShadow = false;
      } else if (trim.top === 'angular') {
        // Vengeance: a raised light bar with an angled end cap.
        addRoundedBox(partsGroup, 0.032, 0.011, 0.032, 0.004, BOARD_X + 0.034, crownY + 0.005, z, topMaterial, 'y').castShadow = false;
        addRoundedBox(partsGroup, 0.034, 0.008, 0.026, 0.003, BOARD_X + 0.034, crownY + 0.012, z, crownMaterial, 'y').castShadow = false;
      } else if (trim.top === 'beast') {
        // Fury Beast: a slash of brand colour cut across the plate.
        addRoundedBox(partsGroup, 0.032, 0.012, 0.032, 0.004, BOARD_X + 0.034, crownY + 0.005, z, topMaterial, 'y').castShadow = false;
        addBox(partsGroup, 0.005, 0.006, 0.03, BOARD_X + 0.051, stickY + 0.04, z, crownMaterial).castShadow = false;
      } else if (trim.top === 'rgb') {
        addRoundedBox(partsGroup, 0.032, 0.014, 0.032, 0.005, BOARD_X + 0.034, crownY + 0.006, z, topMaterial, 'y').castShadow = false;
      } else {
        addRoundedBox(partsGroup, 0.032, 0.012, 0.032, 0.004, BOARD_X + 0.034, crownY + 0.004, z, topMaterial, 'y').castShadow = false;
      }

      // Printed label on each stick, in the maker's own wordmark style.
      const label = new THREE.Mesh(
        new THREE.PlaneGeometry(0.026, 0.11),
        new THREE.MeshStandardMaterial({
          // Tinted down: the plate texture carries a bright sheen, which at
          // full strength washed each stick out to a pale pink sheet.
          color: 0x7d8798,
          map: tex(`plate-ram:${design.key}:${trims0(kits, index)}:${accent.getHex()}`, () => brandPlate({
            brand: kits[0]?.brand,
            title: (design.mark || 'RAM').toUpperCase(),
            sub: `DDR${kits[0]?.specs?.type || '4'} ${kits[0]?.specs?.speed || ''}`.trim(),
            accent,
            design,
            direction: 'tall',
          })),
          roughness: 0.45,
          metalness: 0.2,
        }),
      );
      label.rotation.y = Math.PI / 2;
      label.position.set(BOARD_X + 0.0505, stickY - 0.028, z);
      label.castShadow = false;
      partsGroup.add(label);
    }
  }

  // Tiny helper so the texture cache key stays readable.
  function trims0(kits, index) {
    const kit = kits[Math.min(index, kits.length - 1)];
    return kit?.id || index;
  }

  /* --- graphics card ------------------------------------------------------ */

  function buildGpu(build) {
    const gpu = getItems(build, 'gpu')[0];
    const accent = accentOf(gpu, 0xa855f7);
    const length = gpu ? Math.min(0.66, Math.max(0.38, Number(gpu.specs.length) * 0.00205)) : 0.5;
    // A real card is a fat slab that reaches most of the way to the glass. At
    // 0.22 deep it sat as a thin plank and left a wall of empty glass between
    // its fans and the window, which is what made the interior look half empty.
    const centerX = BOARD_X + 0.19;
    const centerZ = GPU_REAR_Z + length / 2;
    // Two slots tall, not four: at 0.24 with a 0.34 body the card swallowed the
    // whole lower half of the case and read as a black crate with fans on it.
    const height = 0.2;
    const depth = 0.3;

    if (!gpu) {
      addGhost(partsGroup, depth, height, length, centerX, GPU_Y, centerZ, accent);
      return;
    }

    const design = brandStyle(gpu.brand);
    const series = gpuSeries(gpu);
    // Reference cards are a two-tone metal frame (dark grey with bronze),
    // while partner cards wear their maker's own shroud colour.
    const bodyTone = series.shroud === 'founders' ? 0x2e3138 : design.body;
    const shroudMaterial = mat(`gpu-shroud:${design.key}:${series.shroud}`, () => new THREE.MeshStandardMaterial({
      color: bodyTone,
      metalness: series.shroud === 'founders' ? 0.92 : design.metalness * 0.95,
      roughness: series.shroud === 'founders' ? 0.24 : design.roughness * 0.85,
    }));
    const faceMaterial = mat(`gpu-face:${design.key}`, () => new THREE.MeshStandardMaterial({
      color: design.panel,
      metalness: 0.45,
      roughness: 0.52,
    }));
    const chromeMaterial = mat('gpu-chrome', () => new THREE.MeshStandardMaterial({ color: 0x9fb0c8, metalness: 1, roughness: 0.16 }));
    // Reference cards finish their end caps in bronze, custom cards in the
    // maker's own accent, so the card is recognisable from across the case.
    const trimMaterial = mat(`gpu-trim:${design.key}:${accent.getHex()}`, () => new THREE.MeshStandardMaterial({
      color: series.shroud === 'founders' ? 0xb08d57 : accent,
      metalness: series.shroud === 'founders' ? 0.98 : 0.72,
      roughness: series.shroud === 'founders' ? 0.2 : 0.3,
    }));

    // Body with soft edges, a black fan face, and a vented backplate.
    addRoundedBox(partsGroup, depth, height, length, 0.012, centerX, GPU_Y, centerZ, shroudMaterial, 'z');
    addRoundedBox(partsGroup, 0.016, height - 0.016, length - 0.012, 0.008, centerX + depth / 2 - 0.002, GPU_Y, centerZ, faceMaterial, 'x').castShadow = false;

    // Brushed alloy backplate, a shade lighter than the shroud so the card
    // reads as two pieces instead of one dark block.
    const backplateMaterial = mat(`gpu-backplate:${design.key}:${series.shroud}`, () => {
      const tone = new THREE.Color(series.shroud === 'founders' ? 0x3a3f47 : design.body);
      tone.offsetHSL(0, -0.04, 0.16);
      return new THREE.MeshStandardMaterial({
        color: tone,
        metalness: series.shroud === 'founders' ? 0.95 : 0.82,
        roughness: series.shroud === 'founders' ? 0.3 : 0.38,
      });
    });
    const backplate = addRoundedBox(partsGroup, 0.012, height - 0.018, length - 0.018, 0.006, centerX - depth / 2 - 0.003, GPU_Y, centerZ, backplateMaterial, 'x');
    backplate.castShadow = false;
    // Real backplates are perforated, so the card never reads as a black slab
    // from the rear: two rows of vents per fan, plus a fin line down the middle.
    const vents = [];
    for (let row = 0; row < 6; row += 1) {
      for (let column = 0; column < 9; column += 1) {
        vents.push([
          centerX - depth / 2 - 0.009,
          GPU_Y - 0.055 + row * 0.019,
          centerZ - length / 2 + 0.05 + column * ((length - 0.1) / 8),
        ]);
      }
    }
    addInstances(partsGroup, new THREE.BoxGeometry(0.004, 0.011, 0.017), faceMaterial, vents);
    addBox(partsGroup, 0.005, 0.008, length - 0.06, centerX - depth / 2 - 0.009, GPU_Y + 0.062, centerZ, trimMaterial).castShadow = false;

    // Glowing top strip and a chrome side rail.
    addBox(partsGroup, depth - 0.05, 0.007, length - 0.04, centerX, GPU_Y + height / 2 - 0.004, centerZ, rgbMaterial('standard', 1.1, accent)).castShadow = false;
    addBox(partsGroup, 0.012, 0.012, length - 0.02, centerX + depth / 2 - 0.004, GPU_Y - height / 2 + 0.008, centerZ, chromeMaterial).castShadow = false;
    // Brand accent: a strip along the shroud edge, split by card family.
    if (series.shroud === 'founders') {
      for (const side of [-1, 1]) {
        addRoundedBox(partsGroup, depth * 0.9, 0.006, 0.02, 0.002, centerX, GPU_Y + side * (height / 2 - 0.012), centerZ - length / 2 + 0.02, trimMaterial, 'z').castShadow = false;
        addRoundedBox(partsGroup, depth * 0.9, 0.006, 0.02, 0.002, centerX, GPU_Y + side * (height / 2 - 0.012), centerZ + length / 2 - 0.02, trimMaterial, 'z').castShadow = false;
      }
    } else {
      addBox(partsGroup, 0.008, 0.006, length * 0.72, centerX + depth / 2 - 0.007, GPU_Y + height / 2 - 0.018, centerZ, trimMaterial).castShadow = false;
    }

    // Display bracket with three output ports and a thumbscrew.
    addBox(partsGroup, depth + 0.008, 0.012, 0.024, centerX, GPU_Y + height / 2 - 0.01, GPU_REAR_Z - 0.006, chromeMaterial).castShadow = false;
    addBox(partsGroup, depth + 0.004, 0.015, 0.03, centerX, GPU_Y, GPU_REAR_Z - 0.012, shroudMaterial).castShadow = false;
    for (let index = 0; index < 3; index += 1) {
      addBox(partsGroup, 0.05, 0.016, 0.006, centerX + depth / 2 - 0.04 - index * 0.06, GPU_Y - 0.03, GPU_REAR_Z - 0.022, faceMaterial).castShadow = false;
    }

    const fanCount = length > 0.49 ? 3 : 2;
    const pitch = length / fanCount;
    // Slimmer card, three bigger fans: at 22 cm tall with 7 cm rotors the
    // shroud read as a tall black box with three small circles on it.
    const fanRadius = Math.min(0.075, pitch / 2 - 0.008);
    for (let index = 0; index < fanCount; index += 1) {
      const fanZ = centerZ - length / 2 + pitch * (index + 0.5);
      addFan(partsGroup, { x: centerX + depth / 2 + 0.007, y: GPU_Y, z: fanZ }, fanRadius, {
        rgb: true,
        accent,
        rotationY: Math.PI / 2,
        // No frame bars: the four bars around each rotor lined up into a grid
        // across the card face, which read as a cover lying over the fans.
        framed: false,
        design,
        frameColor: design.frameColor,
        // Card fans are dark rotors, not white ones: taken straight from the
        // brand they caught the studio light and read as pale mint swirls
        // painted over the card face.
        bladeColor: new THREE.Color(design.bladeColor).multiplyScalar(0.42).getHex(),
        brand: gpu.brand || '',
        spin: 1.6,
      });
    }

    // Power connector on the card's top edge.
    addBox(partsGroup, 0.045, 0.022, 0.032, centerX + 0.015, GPU_Y + height / 2 + 0.008, centerZ + length / 2 - 0.07, faceMaterial).castShadow = false;
    addBox(partsGroup, 0.032, 0.008, 0.024, centerX + 0.015, GPU_Y + height / 2 + 0.019, centerZ + length / 2 - 0.07, chromeMaterial).castShadow = false;

    // Printed brand plate along the card face.
    const plate = new THREE.Mesh(
      new THREE.PlaneGeometry(Math.min(0.17, length * 0.42), 0.028),
      new THREE.MeshStandardMaterial({
        map: tex(`plate-gpu:${design.key}:${gpu.id ?? gpu.name}:${accent.getHex()}`, () => brandPlate({
          brand: gpu.brand,
          title: design.mark,
          sub: (gpu.name || '').replace(/NVIDIA |AMD /g, '').slice(0, 22).toUpperCase(),
          accent,
          design,
        })),
        roughness: 0.4,
        metalness: 0.35,
      }),
    );
    plate.rotation.y = Math.PI / 2;
    plate.position.set(centerX + depth / 2 + 0.0045, GPU_Y + height / 2 - 0.036, centerZ + length / 2 - 0.055);
    partsGroup.add(plate);

    // Anti-sag support: short, and it stops on the top of the PSU shroud, so
    // it never reads as a tall bar floating through the case or piercing it.
    const antSagX = centerX + 0.02;
    const antSagZ = centerZ + length / 2 - 0.055;
    const sagTop = GPU_Y - height / 2 - 0.006;
    const sagBottom = -0.29;
    addBox(partsGroup, 0.016, 0.01, 0.05, antSagX, sagTop, antSagZ, chromeMaterial).castShadow = false;
    addCylinder(partsGroup, 0.007, 0.007, Math.max(0.08, sagTop - sagBottom), antSagX, (sagTop + sagBottom) / 2, antSagZ, chromeMaterial, 10).castShadow = false;

    addCable(partsGroup, [
      [centerX + 0.015, GPU_Y + height / 2 + 0.02, centerZ + length / 2 - 0.07],
      [centerX + 0.18, -0.14, centerZ + length / 2 + 0.02],
      [centerX + 0.16, -0.34, 0.08],
      [0.08, -0.285, 0.08],
    ], 0.014, 0x111720);

    const pcCase = getItems(build, 'case')[0];
    const gpuLength = Number(gpu.specs.length) || 0;
    const maxLength = Number(pcCase?.specs.maxGpuLength);
    const fits = !Number.isFinite(maxLength) || gpuLength <= maxLength;
    const measureColor = fits ? 0x6ee7b7 : 0xfb7185;
    if (gpuLength > 0) {
      addDimensionMark(measureGroup, GPU_REAR_Z, GPU_REAR_Z + length, GPU_Y - height / 2 - 0.04, centerX + depth / 2 + 0.015, measureColor, `${gpuLength} mm`);
    }
    if (Number.isFinite(maxLength)) {
      const limitLength = Math.min(CASE_D - 0.18, maxLength * 0.00205);
      addDimensionMark(measureGroup, GPU_REAR_Z, GPU_REAR_Z + limitLength, GPU_Y - height / 2 - 0.16, centerX + depth / 2 + 0.015, fits ? 0x64748b : 0xfb7185, `Case limit ${maxLength} mm`, fits ? 0.55 : 0.9);
    }
  }

  /* --- power supply, shroud and storage ----------------------------------- */

  function buildPsuAndStorage(build) {
    const psu = getItems(build, 'psu')[0];
    const storage = getItems(build, 'storage');
    const accent = accentOf(psu, 0xfbbf24);
    const design = brandStyle(psu?.brand);
    const shroudMaterial = mat(`psu-shroud:${design.key}`, () => new THREE.MeshStandardMaterial({
      color: design.body,
      metalness: 0.7,
      roughness: 0.32,
    }));

    // PSU shroud: a tall solid base, the way a real case hides the power
    // supply and cables. Raised: when its lid sat at -0.30 the graphics card
    // floated over a 20 cm void of empty glass and the whole rig read bottom
    // heavy and hollow.
    const SHROUD_W = CASE_W - 0.055;
    const SHROUD_TOP = -0.15;
    const SHROUD_H = CASE_H / 2 + SHROUD_TOP - 0.02;
    const shroudTop = SHROUD_TOP;
    addRoundedBox(partsGroup, SHROUD_W, SHROUD_H, CASE_D - 0.12, 0.008, 0, shroudTop - SHROUD_H / 2, 0.01, shroudMaterial, 'y');
    addBox(partsGroup, SHROUD_W - 0.05, 0.012, CASE_D - 0.18, 0, shroudTop + 0.006, 0.01, mat('psu-brush', () => new THREE.MeshStandardMaterial({
      color: 0x3d4a60,
      metalness: 0.9,
      roughness: 0.2,
    }))).castShadow = false;
    const shroudSide = SHROUD_W / 2 + 0.002;
    addBox(partsGroup, 0.004, SHROUD_H - 0.14, CASE_D - 0.28, shroudSide, shroudTop - (SHROUD_H - 0.14) / 2 - 0.02, 0.01, mat('psu-plate', () => new THREE.MeshStandardMaterial({ color: 0x090d15, metalness: 0.55, roughness: 0.38 }))).castShadow = false;
    addBox(partsGroup, 0.004, 0.006, CASE_D - 0.31, shroudSide + 0.002, shroudTop - 0.075, 0.01, mat('psu-chrome', () => new THREE.MeshStandardMaterial({ color: 0x9fb0c8, metalness: 1, roughness: 0.16 }))).castShadow = false;
    const shroudGlow = addBox(partsGroup, SHROUD_W - 0.09, 0.005, 0.007, 0, shroudTop + 0.012, CASE_D / 2 - 0.13, rgbMaterial('standard', 0.5, accent));
    shroudGlow.castShadow = false;

    if (!psu) {
      addGhost(partsGroup, 0.42, 0.17, 0.3, BOARD_X + 0.26, shroudTop - 0.14, -0.16, accent);
    } else {
      const psuMaterial = mat(`psu-body:${design.key}`, () => new THREE.MeshStandardMaterial({
        color: design.panel,
        metalness: 0.7,
        roughness: 0.34,
      }));
      // The unit sits hidden inside the shroud, the way a real case hides the
      // PSU, so it never reads as a black box floating in the middle of the rig.
      const psuY = shroudTop - 0.085;
      addRoundedBox(partsGroup, 0.4, 0.095, 0.29, 0.008, BOARD_X + 0.26, psuY, -0.16, psuMaterial, 'z');
      // Badge plate on the shroud's side, facing the window.
      const badge = new THREE.Mesh(
        new THREE.PlaneGeometry(0.15, 0.045),
        new THREE.MeshStandardMaterial({
          map: tex(`badge-psu:${design.key}:${psu.id ?? psu.brand}:${accent.getHex()}`, () => brandPlate({
            brand: psu.brand,
            title: design.mark,
            sub: `${psu.specs.wattage || ''}W ${psu.specs.efficiency || ''}`.trim(),
            accent,
            design,
          })),
          roughness: 0.42,
          metalness: 0.3,
        }),
      );
      badge.rotation.y = Math.PI / 2;
      badge.position.set(shroudSide + 0.004, shroudTop - 0.075, 0.05);
      partsGroup.add(badge);
      // Modular cable sockets along the shroud edge, where they would really sit.
      for (let index = 0; index < 4; index += 1) {
        addBox(partsGroup, 0.026, 0.012, 0.016, shroudSide + 0.002, shroudTop - 0.075, -0.06 - index * 0.045, mat('psu-socket', () => new THREE.MeshStandardMaterial({ color: 0x05080d, roughness: 0.6 }))).castShadow = false;
      }
    }

    // Storage: M.2 sits on the board, 2.5" drives stand upright in the bay.
    // Lying flat on the shroud they read as two loose chips dropped inside the
    // case, so they are mounted on edge like a real drive cage.
    storage.slice(0, 2).forEach((drive, index) => {
      const color = drive.specs.interface === 'NVMe' ? accentOf(drive, 0x34d399) : accentOf(drive, 0x2a3346);
      const driveDesign = brandStyle(drive.brand);
      const driveZ = 0.26 - index * 0.19;
      // A touch larger than before: at chip size these read as two loose
      // boxes dropped on the shroud instead of the drives they are.
      const driveX = SHROUD_W / 2 - 0.12;
      // 2.5" drives the way a real bay mounts them: flat, one behind the other,
      // lying in the opening between the card and the shroud. Standing them on
      // edge pointed their front faces at the camera, which read as two black
      // boxes stuck on the graphics card.
      const driveY = shroudTop + 0.02;
      const driveMaterial = mat(`drive-body:${driveDesign.key}`, () => new THREE.MeshStandardMaterial({
        color: driveDesign.body,
        metalness: 0.74,
        roughness: 0.3,
      }));
      addRoundedBox(partsGroup, 0.13, 0.032, 0.165, 0.006, driveX + 0.04, driveY, driveZ, driveMaterial, 'z');
      // A mounting tray under each drive: lying straight on the lid they read
      // as two loose plates dropped on the power-supply cover.
      addBox(partsGroup, 0.145, 0.008, 0.18, driveX + 0.04, driveY - 0.02, driveZ, mat('drive-tray', () => new THREE.MeshStandardMaterial({
        color: 0x0c1119,
        metalness: 0.6,
        roughness: 0.4,
      }))).castShadow = false;
      for (const side of [-1, 1]) {
        addBox(partsGroup, 0.012, 0.012, 0.012, driveX + 0.04 + side * 0.05, driveY - 0.02, driveZ + 0.07, mat('drive-screw', () => new THREE.MeshStandardMaterial({
          color: 0x8c98ac,
          metalness: 0.9,
          roughness: 0.3,
        }))).castShadow = false;
      }
      // An activity light, not a lit panel: at full-face size this glowed like
      // a stray green slab lying on the power-supply cover.
      addBox(partsGroup, 0.05, 0.0035, 0.012, driveX + 0.02, driveY + 0.018, driveZ, new THREE.MeshStandardMaterial({
        color: 0x080b12,
        emissive: color,
        emissiveIntensity: 0.35,
        roughness: 0.4,
      })).castShadow = false;
      addBox(partsGroup, 0.03, 0.02, 0.011, driveX + 0.04, driveY + 0.017, driveZ - 0.07, mat('drive-trim', () => new THREE.MeshStandardMaterial({
        color: 0x2b3444,
        metalness: 0.6,
        roughness: 0.34,
      }))).castShadow = false;
      const label = new THREE.Mesh(
        new THREE.PlaneGeometry(0.07, 0.02),
        new THREE.MeshStandardMaterial({
          map: tex(`plate-drive:${driveDesign.key}:${drive.id ?? drive.brand}`, () => brandPlate({
            brand: drive.brand,
            title: driveDesign.mark,
            sub: `${drive.specs.interface || ''} ${drive.specs.capacityGB || ''}GB`.trim(),
            accent: color,
            design: driveDesign,
          })),
          roughness: 0.45,
          metalness: 0.25,
        }),
      );
      label.rotation.x = -Math.PI / 2;
      label.position.set(driveX + 0.04, driveY + 0.0175, driveZ);
      partsGroup.add(label);
    });

    // Cables are routed behind the motherboard, the way a real build tucks
    // them into the gap between the board and the rear wall. Running them at
    // the board's front edge made them pass straight through the graphics
    // card body, so they showed up as pale arcs drawn across the fans.
    addCable(partsGroup, [
      [BOARD_X + 0.07, 0.21, BOARD_REAR_Z - 0.018],
      [BOARD_X + 0.09, 0.06, BOARD_REAR_Z - 0.022],
      [BOARD_X + 0.1, -0.16, BOARD_REAR_Z - 0.022],
      [BOARD_X + 0.12, shroudTop + 0.02, BOARD_REAR_Z - 0.03],
    ], 0.012, 0x111720);
    addCable(partsGroup, [
      [BOARD_X + 0.02, 0.36, BOARD_REAR_Z - 0.02],
      [BOARD_X - 0.02, 0.42, BOARD_REAR_Z - 0.026],
      [BOARD_X - 0.04, 0.28, BOARD_REAR_Z - 0.03],
      [BOARD_X - 0.03, shroudTop + 0.02, BOARD_REAR_Z - 0.03],
    ], 0.01, 0x0e131c);
  }

  /* --- case fans ---------------------------------------------------------- */

  function buildFans(build) {
    const pcCase = getItems(build, 'case')[0];
    const kits = getItems(build, 'fans');
    const selectedCount = kits.reduce((sum, fan) => sum + (Number(fan.specs.count) || 0), 0);
    const count = Math.min(3, selectedCount || Number(pcCase?.specs.includedFans) || 2);
    const hasRgb = kits.some((fan) => fan.specs.rgb);
    const accent = state.accent;
    // A bought fan pack brings its own frame and blade colours; with none
    // chosen, the case's stock fans use the case maker's design.
    const kit = kits[0];
    const design = kit ? brandStyle(kit.brand) : brandStyle(pcCase?.brand);
    const brand = kit?.brand || pcCase?.brand || '';
    // The fans sat in a small cluster around the case's middle, leaving the
    // front half of the panel empty. They now occupy the open front area above
    // the shroud, stacked like a real case's intake positions.
    const positions = count >= 3 ? [0.44, 0.15, -0.14] : count === 2 ? [0.44, 0.16] : [0.3];
    // Intake fans sit inside the case, behind the front panel. Mounted almost
    // flush with it, with the wood slats and mesh right in front, they read as
    // stickers applied to the panel instead of fans moving air through it.
    const frontFanRadius = 0.125;
    // Right up against the front panel, just behind the wood slats: parked 11
    // cm back, the perspective pushed the rotors off the panel so the intake
    // fans read as loose discs floating beside the wood instead of fans pulling
    // air through the front of the case.
    const frontFanZ = CASE_D / 2 - 0.042;
    positions.forEach((y) => {
      // No frame, no backing plate: the first attempt mounted the fans almost
      // flush with the front panel, so the rotors drew on top of the wood slats
      // and read as two fans stuck onto the side of the case.
      // Framed, the way a stock intake fan is bolted to the front mount: an
      // open rotor alone read as a flat disc lying loose behind the planks.
      addFan(partsGroup, { x: 0, y, z: frontFanZ }, frontFanRadius, {
        rgb: hasRgb,
        accent,
        framed: true,
        brand,
        design,
        // Dark blades and frame: taking the brand's light fan palette made the
        // intake column read as three silver discs bolted to the front, the
        // brightest thing in the case.
        frameColor: 0x171d27,
        bladeColor: 0x232b38,
      });
    });
    // Rear exhaust. It used to be skipped whenever a tower air cooler was
    // fitted, which left the case back with no fan at all. Every case gets one
    // now, mounted on the back panel the way a real 120 mm exhaust is.
    addFan(partsGroup, { x: -0.17, y: 0.42, z: -CASE_D / 2 + 0.055 }, 0.1, {
      rgb: hasRgb,
      accent,
      framed: true,
      brand,
      design,
      backing: false,
      rotationY: Math.PI,
    });
  }

  function applyBuild(build) {
    clearGroup(caseGroup);
    clearGroup(partsGroup);
    clearGroup(measureGroup);
    rgbMaterials.length = 0;
    fanRotors.length = 0;
    const pcCase = getItems(build, 'case')[0];
    buildCase(pcCase);
    buildMotherboard(build);
    buildCpuAndCooler(build);
    buildMemory(build);
    buildGpu(build);
    buildPsuAndStorage(build);
    buildFans(build);
    measureGroup.visible = state.measure;
  }

  function defaultRadius() {
    const width = container.clientWidth || 720;
    const height = container.clientHeight || 560;
    const aspect = width / height;
    // Framing leaves a margin all round: at the old distance the case edges
    // were clipped by the canvas on tall, narrow panels. Pulled in tighter now
    // that the case is shorter crop, so the rig fills the frame instead of
    // sitting in it as a small box.
    if (aspect < 0.82) return 3.2;
    if (aspect < 1.15) return 3.05;
    return 2.9;
  }

  function resetView() {
    view.userZoom = false;
    view.targetTheta = 1.42;
    view.targetPhi = 1.24;
    view.targetRadius = defaultRadius();
    state.lastInteraction = 0;
  }

  // Named camera angles, so a look can be reached in one press instead of
  // dragging the orbit by hand. Each preset only sets the orbit angles.
  const VIEW_PRESETS = {
    side: { theta: 1.42, phi: 1.24 },
    front: { theta: Math.PI, phi: 1.28 },
    rear: { theta: 0, phi: 1.28 },
    top: { theta: 1.42, phi: 0.46 },
  };

  function setViewAngle(name) {
    const preset = VIEW_PRESETS[name];
    if (!preset) return;
    view.userZoom = false;
    view.targetTheta = preset.theta;
    view.targetPhi = preset.phi;
    view.targetRadius = defaultRadius();
    state.lastInteraction = 0;
  }

  function zoomBy(factor) {
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
    if (!view.userZoom) view.targetRadius = defaultRadius();
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

  function onPointerDown(event) {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    pointerId = event.pointerId;
    state.dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
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
  }

  function onWheel(event) {
    event.preventDefault();
    view.userZoom = true;
    view.targetRadius = THREE.MathUtils.clamp(view.targetRadius + event.deltaY * 0.0016, 2.05, 6.4);
    state.lastInteraction = performance.now();
  }

  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  renderer.domElement.addEventListener('pointermove', onPointerMove);
  renderer.domElement.addEventListener('pointerup', onPointerUp);
  renderer.domElement.addEventListener('pointercancel', onPointerUp);
  renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

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
      rimPurple.color.set(0x8b5cf6);
    }
  }

  function animate() {
    if (state.disposed) return;
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
    const pulse = 1 + Math.sin(time * 1.6) * 0.008;
    rootGroup.position.y = (PLATFORM_Y + (CASE_H * rootGroup.scale.y) / 2 + 0.035) * pulse;
    renderer.render(scene, camera);
  }

  renderer.setAnimationLoop(animate);
  applyBuild(options.build || { items: {} });
  resetView();

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
    snapshot() {
      renderer.render(scene, camera);
      return renderer.domElement.toDataURL('image/png');
    },
    resetView,
    setView: setViewAngle,
    zoom(factor) {
      zoomBy(Number(factor) || 1);
    },
    dispose() {
      state.disposed = true;
      renderer.setAnimationLoop(null);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointercancel', onPointerUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      clearGroup(caseGroup);
      clearGroup(partsGroup);
      clearGroup(measureGroup);
      disposeObject(platform);
      envTarget.dispose();
      ownedTextures.forEach((texture) => texture.dispose());
      ownedTextures.length = 0;
      textureCache.forEach((value) => value.dispose());
      textureCache.clear();
      geometryCache.forEach((value) => value.dispose());
      geometryCache.clear();
      materialCache.forEach((value) => value.dispose());
      materialCache.clear();
      renderer.dispose();
      renderer.domElement.remove();
      container.innerHTML = '';
    },
  };
}
