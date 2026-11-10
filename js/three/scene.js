import * as THREE from 'three';
import { getItems } from '../core/build.js';

const CASE_W = 1.02;
const CASE_H = 1.5;
const CASE_D = 0.98;
const PLATFORM_Y = -0.86;
const BOARD_X = -CASE_W / 2 + 0.095;
const BOARD_Y = 0.08;
const BOARD_H = 0.64;
const BOARD_D = 0.62;
const BOARD_REAR_Z = -CASE_D / 2 + 0.075;
const BOARD_FRONT_Z = BOARD_REAR_Z + BOARD_D;
const CPU_Y = 0.27;
const CPU_Z = BOARD_REAR_Z + 0.2;
const GPU_Y = 0.01;
const GPU_REAR_Z = BOARD_REAR_Z + 0.045;
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

function disposeMaterial(material) {
  if (!material) return;
  if (material.map) material.map.dispose();
  if (material.emissiveMap) material.emissiveMap.dispose();
  material.dispose();
}

function disposeObject(object) {
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
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

function createPcbTexture(accent) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 640;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#071b28';
  ctx.fillRect(0, 0, 512, 640);
  const boardGlow = ctx.createLinearGradient(0, 0, 512, 640);
  boardGlow.addColorStop(0, 'rgba(35, 91, 116, 0.28)');
  boardGlow.addColorStop(0.55, 'rgba(13, 45, 61, 0.14)');
  boardGlow.addColorStop(1, 'rgba(75, 55, 120, 0.14)');
  ctx.fillStyle = boardGlow;
  ctx.fillRect(0, 0, 512, 640);
  ctx.strokeStyle = 'rgba(102, 207, 236, 0.24)';
  ctx.lineWidth = 1.2;
  for (let index = 0; index < 84; index += 1) {
    const startX = Math.random() * 512;
    const startY = Math.random() * 640;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    let x = startX;
    let y = startY;
    for (let step = 0; step < 3; step += 1) {
      if (Math.random() > 0.5) x += (Math.random() - 0.5) * 150;
      else y += (Math.random() - 0.5) * 150;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.strokeStyle = `rgba(${Math.round(accent.r * 255)},${Math.round(accent.g * 255)},${Math.round(accent.b * 255)},0.22)`;
  ctx.lineWidth = 2;
  for (let index = 0; index < 14; index += 1) {
    const y = 34 + index * 44;
    ctx.beginPath();
    ctx.moveTo(24, y);
    ctx.lineTo(174, y);
    ctx.lineTo(208, y + 20);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(204, 228, 245, 0.3)';
  for (let index = 0; index < 110; index += 1) {
    ctx.fillRect(Math.random() * 512, Math.random() * 640, 3, 3);
  }
  ctx.fillStyle = 'rgba(190, 215, 235, 0.22)';
  ctx.font = '600 15px "Segoe UI", sans-serif';
  ctx.fillText('PC BUILD STUDIO - SAMPLE BOARD', 24, 618);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
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

export function createPCScene(container, options = {}) {
  const testCanvas = document.createElement('canvas');
  const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
  if (!gl) throw new Error('WebGL is not available in this browser.');

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = 'pc-canvas';
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 60);

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

  const view = {
    theta: 1.02,
    phi: 1.28,
    radius: 3.55,
    targetTheta: 1.02,
    targetPhi: 1.28,
    targetRadius: 3.55,
    userZoom: false,
  };

  const rgbMaterials = [];
  const tempColor = new THREE.Color();

  const hemi = new THREE.HemisphereLight(0xa8c4ff, 0x060810, 1.15);
  scene.add(hemi);
  const ambient = new THREE.AmbientLight(0x26324e, 0.72);
  scene.add(ambient);
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
  keyLight.position.set(2.8, 4.2, 3.6);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1536, 1536);
  keyLight.shadow.camera.left = -2.8;
  keyLight.shadow.camera.right = 2.8;
  keyLight.shadow.camera.top = 3;
  keyLight.shadow.camera.bottom = -2.5;
  keyLight.shadow.bias = -0.0007;
  scene.add(keyLight);
  const interiorLight = new THREE.PointLight(0xe8f1ff, 4.4, 4.5, 1.8);
  interiorLight.position.set(0.2, 0.32, 0.18);
  scene.add(interiorLight);
  const lowerFill = new THREE.PointLight(0x9dbbff, 2.1, 3.4, 1.9);
  lowerFill.position.set(0.28, -0.3, 0.3);
  scene.add(lowerFill);
  const frontFill = new THREE.PointLight(0x67e8f9, 1.5, 4.8, 1.9);
  frontFill.position.set(0.65, -0.1, 0.85);
  scene.add(frontFill);
  const rimPurple = new THREE.PointLight(0xa855f7, 2.5, 5.2, 2);
  rimPurple.position.set(-1.8, 1.7, -1.5);
  scene.add(rimPurple);
  const caseFill = new THREE.DirectionalLight(0xe2ecff, 0.85);
  caseFill.position.set(4, 2.4, 2.8);
  scene.add(caseFill);

  const platform = new THREE.Group();
  const platformBase = new THREE.Mesh(
    new THREE.CylinderGeometry(1.96, 2.02, 0.06, 96),
    new THREE.MeshStandardMaterial({ color: 0x0a0d14, metalness: 0.72, roughness: 0.34 }),
  );
  platformBase.position.y = PLATFORM_Y;
  platformBase.receiveShadow = true;
  platform.add(platformBase);

  const platformRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.63, 0.007, 8, 128),
    new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.72 }),
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

  const glowTexture = createRadialGlow();
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(4.4, 4.4),
    new THREE.MeshBasicMaterial({
      map: glowTexture,
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = PLATFORM_Y + 0.033;
  platform.add(glow);

  const floorGridTexture = createFloorGrid();
  const floorGrid = new THREE.Mesh(
    new THREE.CircleGeometry(1.84, 96),
    new THREE.MeshBasicMaterial({ map: floorGridTexture, transparent: true, opacity: 0.72, depthWrite: false }),
  );
  floorGrid.rotation.x = -Math.PI / 2;
  floorGrid.position.y = PLATFORM_Y + 0.035;
  floorGrid.renderOrder = 1;
  platform.add(floorGrid);
  scene.add(platform);

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
      roughness: 0.3,
      metalness: 0.18,
    });
    return addRgbMaterial(material, { intensity, accent });
  }

  function addBox(parent, width, height, depth, x, y, z, material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function addCylinder(parent, radiusTop, radiusBottom, height, x, y, z, material, segments = 24) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
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
      framed = false,
      opacity = 1,
      frameColor = 0x101620,
      bladeColor = 0x232c3d,
    } = fanOptions;
    const group = new THREE.Group();
    const frameMaterial = new THREE.MeshStandardMaterial({ color: frameColor, roughness: 0.55, metalness: 0.42 });
    const ringMaterial = rgb
      ? rgbMaterial('standard', 2.4, accent)
      : new THREE.MeshStandardMaterial({ color: 0x080b11, emissive: accent, emissiveIntensity: 0.5, roughness: 0.38 });
    const rim = new THREE.Mesh(new THREE.TorusGeometry(radius, radius * 0.045, 6, 48), frameMaterial);
    group.add(rim);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.9, radius * 0.06, 8, 48), ringMaterial);
    group.add(ring);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.18, radius * 0.18, radius * 0.14, 20), frameMaterial);
    hub.rotation.x = Math.PI / 2;
    group.add(hub);
    const back = new THREE.Mesh(
      new THREE.CircleGeometry(radius * 0.97, 36),
      new THREE.MeshBasicMaterial({ color: 0x04060a, transparent: true, opacity: 0.55, depthWrite: false }),
    );
    back.position.z = -radius * 0.1;
    group.add(back);
    const bladeMaterial = new THREE.MeshStandardMaterial({ color: bladeColor, roughness: 0.48, metalness: 0.32 });
    const bladeGeometry = new THREE.BoxGeometry(radius * 0.64, radius * 0.12, radius * 0.018);
    bladeGeometry.translate(radius * 0.37, 0, 0);
    for (let index = 0; index < 7; index += 1) {
      const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
      blade.rotation.z = (index * Math.PI * 2) / 7;
      blade.rotation.x = 0.42;
      blade.castShadow = true;
      group.add(blade);
    }
    if (framed) {
      const arm = radius * 0.12;
      const size = radius * 2 + arm * 2;
      addBox(group, size, arm, arm, 0, radius + arm / 2, 0, frameMaterial).castShadow = false;
      addBox(group, size, arm, arm, 0, -radius - arm / 2, 0, frameMaterial).castShadow = false;
      addBox(group, arm, size, arm, radius + arm / 2, 0, 0, frameMaterial).castShadow = false;
      addBox(group, arm, size, arm, -radius - arm / 2, 0, 0, frameMaterial).castShadow = false;
    }
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

  function addCable(parent, points, radius, color) {
    const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(point[0], point[1], point[2])));
    const geometry = new THREE.TubeGeometry(curve, 42, radius, 7, false);
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0.08 }));
    mesh.castShadow = true;
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

  function buildCase(pcCase) {
    explodeParts.length = 0;
    const specs = pcCase?.specs || {};
    const accent = accentOf(pcCase, 0x8b5cf6);
    state.accent.copy(accent);
    const size = specs.size || 'Mid Tower';
    const scale = SIZE_SCALE[size] || 1;
    rootGroup.scale.setScalar(scale);
    rootGroup.position.y = PLATFORM_Y + (CASE_H * scale) / 2 + 0.035;

    const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x171d29, metalness: 0.68, roughness: 0.32 });
    const panelMaterial = new THREE.MeshStandardMaterial({ color: 0x0b0f17, metalness: 0.48, roughness: 0.48 });
    const innerMaterial = new THREE.MeshStandardMaterial({ color: 0x131924, metalness: 0.52, roughness: 0.46 });
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x9cc4ff,
      metalness: 0,
      roughness: 0.04,
      transparent: true,
      opacity: 0.085,
      side: THREE.DoubleSide,
      depthWrite: false,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
    });
    const accentMaterial = new THREE.MeshStandardMaterial({
      color: 0x07080d,
      emissive: accent,
      emissiveIntensity: 1.15,
      roughness: 0.32,
    });

    addBox(caseGroup, CASE_W, 0.035, CASE_D, 0, -CASE_H / 2, 0, panelMaterial);

    const leftPanel = addBox(caseGroup, 0.018, CASE_H, CASE_D, -CASE_W / 2, 0, 0, panelMaterial);
    registerExplode(leftPanel, new THREE.Vector3(-0.38, 0, 0));
    const glass = addBox(caseGroup, 0.009, CASE_H - 0.08, CASE_D - 0.08, CASE_W / 2, 0, 0, glassMaterial);
    glass.castShadow = false;
    glass.receiveShadow = false;
    glass.renderOrder = 4;
    registerExplode(glass, new THREE.Vector3(0.42, 0, 0));

    const topGlass = addBox(caseGroup, CASE_W - 0.06, 0.008, CASE_D - 0.06, 0, CASE_H / 2 - 0.004, 0, glassMaterial);
    topGlass.castShadow = false;
    topGlass.receiveShadow = false;
    topGlass.renderOrder = 4;
    registerExplode(topGlass, new THREE.Vector3(0, 0.38, 0));

    addBox(caseGroup, CASE_W, CASE_H, 0.018, 0, 0, -CASE_D / 2, panelMaterial);
    addBox(caseGroup, 0.014, CASE_H, 0.014, -CASE_W / 2 + 0.02, 0, CASE_D / 2 - 0.02, frameMaterial);
    addBox(caseGroup, 0.014, CASE_H, 0.014, CASE_W / 2 - 0.02, 0, CASE_D / 2 - 0.02, frameMaterial);
    addBox(caseGroup, 0.014, CASE_H, 0.014, -CASE_W / 2 + 0.02, 0, -CASE_D / 2 + 0.02, frameMaterial);
    addBox(caseGroup, 0.014, CASE_H, 0.014, CASE_W / 2 - 0.02, 0, -CASE_D / 2 + 0.02, frameMaterial);
    addBox(caseGroup, CASE_W, 0.018, 0.018, 0, -CASE_H / 2 + 0.02, CASE_D / 2 - 0.02, frameMaterial);
    addBox(caseGroup, CASE_W, 0.018, 0.018, 0, CASE_H / 2 - 0.02, CASE_D / 2 - 0.02, frameMaterial);
    addBox(caseGroup, 0.018, 0.018, CASE_D, -CASE_W / 2 + 0.02, -CASE_H / 2 + 0.02, 0, frameMaterial);
    addBox(caseGroup, 0.018, 0.018, CASE_D, -CASE_W / 2 + 0.02, CASE_H / 2 - 0.02, 0, frameMaterial);
    addBox(caseGroup, 0.018, 0.018, CASE_D, CASE_W / 2 - 0.02, CASE_H / 2 - 0.02, 0, frameMaterial);
    addBox(caseGroup, CASE_W - 0.04, 0.018, 0.018, 0, CASE_H / 2 - 0.02, -CASE_D / 2 + 0.02, frameMaterial);

    const frontPanel = specs.frontPanel || 'Mesh';
    if (frontPanel.includes('Glass')) {
      const frontGlass = addBox(caseGroup, CASE_W - 0.055, CASE_H - 0.1, 0.008, 0, 0, CASE_D / 2 + 0.005, glassMaterial);
      frontGlass.castShadow = false;
      frontGlass.receiveShadow = false;
      frontGlass.renderOrder = 4;
      registerExplode(frontGlass, new THREE.Vector3(0, 0, 0.38));
    } else {
      const frontMesh = addBox(caseGroup, CASE_W - 0.055, CASE_H - 0.1, 0.008, 0, 0, CASE_D / 2 + 0.002, new THREE.MeshStandardMaterial({
        color: 0x090d14,
        metalness: 0.35,
        roughness: 0.62,
        transparent: true,
        opacity: 0.11,
        depthWrite: false,
      }));
      frontMesh.castShadow = false;
      registerExplode(frontMesh, new THREE.Vector3(0, 0, 0.38));
      const meshLines = addLineGrid(caseGroup, CASE_W - 0.06, CASE_H - 0.11, CASE_D / 2 + 0.009, 0x62779b, 0.4, 0.03);
      registerExplode(meshLines, new THREE.Vector3(0, 0, 0.38));
      if (frontPanel.includes('Wood')) {
        const wood = new THREE.MeshStandardMaterial({ color: 0x6e4c31, roughness: 0.82, metalness: 0.04 });
        for (let index = 0; index < 5; index += 1) {
          addBox(caseGroup, 0.06, CASE_H - 0.14, 0.025, -CASE_W / 2 + 0.12 + index * 0.09, 0, CASE_D / 2 + 0.018, wood).castShadow = false;
        }
      }
    }

    const frontStrip = addBox(caseGroup, 0.012, CASE_H - 0.16, 0.01, CASE_W / 2 - 0.048, 0, CASE_D / 2 + 0.015, accentMaterial);
    frontStrip.castShadow = false;
    const topStrip = addBox(caseGroup, CASE_W * 0.72, 0.008, 0.01, -0.02, CASE_H / 2 + 0.007, CASE_D / 2 - 0.08, accentMaterial);
    topStrip.castShadow = false;
    const sideGlow = addBox(caseGroup, 0.006, CASE_H - 0.14, 0.012, CASE_W / 2 + 0.005, 0, CASE_D / 2 - 0.02, accentMaterial);
    sideGlow.castShadow = false;

    const buttonMaterial = new THREE.MeshStandardMaterial({ color: 0x151b26, metalness: 0.7, roughness: 0.3 });
    const powerButton = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.012, 20), buttonMaterial);
    powerButton.rotation.x = Math.PI / 2;
    powerButton.position.set(CASE_W / 2 - 0.13, CASE_H / 2 - 0.065, CASE_D / 2 + 0.02);
    caseGroup.add(powerButton);
    for (let index = 0; index < 2; index += 1) {
      addBox(caseGroup, 0.036, 0.011, 0.008, CASE_W / 2 - 0.21 - index * 0.052, CASE_H / 2 - 0.065, CASE_D / 2 + 0.018, buttonMaterial).castShadow = false;
    }

    for (const x of [-CASE_W / 2 + 0.06, CASE_W / 2 - 0.06]) {
      for (const z of [-CASE_D / 2 + 0.06, CASE_D / 2 - 0.06]) {
        addCylinder(caseGroup, 0.022, 0.026, 0.035, x, -CASE_H / 2 - 0.02, z, frameMaterial, 16).castShadow = false;
      }
    }

    const edgeGeometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(CASE_W, CASE_H, CASE_D));
    const edges = new THREE.LineSegments(edgeGeometry, new THREE.LineBasicMaterial({ color: 0x3a465c, transparent: true, opacity: 0.22 }));
    caseGroup.add(edges);

    platformRing.material.color.copy(accent);
    glow.material.color.copy(accent);
    return { accent, size, scale, specs };
  }

  function buildMotherboard(build) {
    const board = getItems(build, 'motherboard')[0];
    const accent = accentOf(board, 0x38bdf8);
    const pcbMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: board ? createPcbTexture(accent) : null,
      emissive: 0x071a24,
      emissiveIntensity: 0.35,
      roughness: 0.58,
      metalness: 0.24,
    });
    if (!board) pcbMaterial.color.set(0x0a151d);
    const boardMesh = addBox(partsGroup, 0.018, BOARD_H, BOARD_D, BOARD_X, BOARD_Y, BOARD_REAR_Z + BOARD_D / 2, pcbMaterial);
    if (!board) {
      boardMesh.material.transparent = true;
      boardMesh.material.opacity = 0.35;
      boardMesh.material.wireframe = true;
    }

    const slotMaterial = new THREE.MeshStandardMaterial({ color: 0x05070c, roughness: 0.48, metalness: 0.35 });
    const heatsinkMaterial = new THREE.MeshStandardMaterial({ color: 0x1a2230, metalness: 0.78, roughness: 0.3 });
    const trimMaterial = new THREE.MeshStandardMaterial({ color: 0x070a10, emissive: accent, emissiveIntensity: 0.35, roughness: 0.4 });

    addBox(partsGroup, 0.07, 0.16, 0.2, BOARD_X + 0.05, 0.36, BOARD_REAR_Z + 0.07, heatsinkMaterial);
    addBox(partsGroup, 0.022, 0.12, 0.15, BOARD_X + 0.09, 0.36, BOARD_REAR_Z + 0.07, trimMaterial).castShadow = false;
    addBox(partsGroup, 0.035, 0.07, 0.16, BOARD_X + 0.03, 0.36, BOARD_REAR_Z + 0.01, heatsinkMaterial);
    addBox(partsGroup, 0.035, 0.12, 0.14, BOARD_X + 0.02, -0.13, 0.06, heatsinkMaterial);
    addBox(partsGroup, 0.012, 0.04, 0.11, BOARD_X + 0.043, -0.13, 0.06, trimMaterial).castShadow = false;

    for (let index = 0; index < 4; index += 1) {
      addBox(partsGroup, 0.012, 0.018, 0.29, BOARD_X + 0.02, 0.035 - index * 0.012, -0.11, slotMaterial);
    }
    addBox(partsGroup, 0.02, 0.022, 0.3, BOARD_X + 0.02, -0.115, -0.11, slotMaterial);
    addBox(partsGroup, 0.03, 0.09, 0.16, BOARD_X + 0.02, -0.055, 0.17, heatsinkMaterial);
    addBox(partsGroup, 0.009, 0.025, 0.11, BOARD_X + 0.04, -0.055, 0.17, trimMaterial).castShadow = false;
    addBox(partsGroup, 0.03, 0.11, 0.04, BOARD_X + 0.03, 0.26, BOARD_FRONT_Z - 0.05, slotMaterial);

    for (let index = 0; index < 8; index += 1) {
      const cap = addCylinder(partsGroup, 0.008, 0.008, 0.045, BOARD_X + 0.035, -0.08 + (index % 3) * 0.055, 0.1 + Math.floor(index / 3) * 0.045, heatsinkMaterial, 12);
      cap.castShadow = false;
    }

    const boardLight = addBox(partsGroup, 0.006, 0.008, 0.4, BOARD_X + 0.011, 0.38, BOARD_REAR_Z + 0.34, trimMaterial);
    boardLight.castShadow = false;
    return { board, accent };
  }

  function buildCpuAndCooler(build) {
    const cpu = getItems(build, 'cpu')[0];
    const cooler = getItems(build, 'cooler')[0];
    const coolerAccent = accentOf(cooler, 0x22d3ee);
    const cpuX = BOARD_X + 0.045;

    if (cpu) {
      addBox(partsGroup, 0.028, 0.115, 0.115, cpuX, CPU_Y, CPU_Z, new THREE.MeshStandardMaterial({
        color: 0x1b2332,
        metalness: 0.82,
        roughness: 0.26,
      }));
      const cpuGlow = addBox(partsGroup, 0.006, 0.075, 0.075, cpuX + 0.018, CPU_Y, CPU_Z, new THREE.MeshStandardMaterial({
        color: 0x0a0d14,
        emissive: accentOf(cpu, 0x5b8cff),
        emissiveIntensity: 0.9,
        roughness: 0.38,
      }));
      cpuGlow.castShadow = false;
    } else {
      addGhost(partsGroup, 0.06, 0.12, 0.12, cpuX, CPU_Y, CPU_Z, 0x5b8cff);
    }

    if (!cooler) {
      addGhost(partsGroup, 0.22, 0.3, 0.2, BOARD_X + 0.16, CPU_Y + 0.06, CPU_Z, coolerAccent);
      return;
    }

    if (cooler.specs.type === 'Air') {
      const heatsinkMaterial = new THREE.MeshStandardMaterial({ color: 0x394458, metalness: 0.86, roughness: 0.24 });
      const copperMaterial = new THREE.MeshStandardMaterial({ color: 0x8a5a3f, metalness: 0.86, roughness: 0.3 });
      const towerX = BOARD_X + 0.17;
      const baseY = CPU_Y;
      addBox(partsGroup, 0.2, 0.022, 0.19, towerX, baseY, CPU_Z, copperMaterial);
      for (let index = 0; index < 11; index += 1) {
        addBox(partsGroup, 0.22, 0.007, 0.19, towerX, baseY + 0.025 + index * 0.024, CPU_Z, heatsinkMaterial).castShadow = false;
      }
      addBox(partsGroup, 0.015, 0.28, 0.2, towerX - 0.11, baseY + 0.16, CPU_Z, heatsinkMaterial);
      addBox(partsGroup, 0.015, 0.28, 0.2, towerX + 0.11, baseY + 0.16, CPU_Z, heatsinkMaterial);
      for (let index = 0; index < 4; index += 1) {
        const pipe = addCylinder(partsGroup, 0.009, 0.009, 0.27, towerX - 0.065 + (index % 2) * 0.13, baseY + 0.15, CPU_Z - 0.055 + Math.floor(index / 2) * 0.11, copperMaterial, 8);
        pipe.castShadow = false;
      }
      addFan(partsGroup, { x: towerX, y: baseY + 0.03, z: CPU_Z + 0.13 }, 0.086, {
        rgb: Boolean(cooler.specs.rgb),
        accent: coolerAccent,
        framed: true,
      });
      if (Number(cooler.specs.fans) > 1) {
        addFan(partsGroup, { x: towerX, y: baseY + 0.03, z: CPU_Z - 0.13 }, 0.086, {
          rgb: Boolean(cooler.specs.rgb),
          accent: coolerAccent,
          framed: true,
        });
      }
      return;
    }

    const pumpMaterial = new THREE.MeshStandardMaterial({ color: 0x0d1119, metalness: 0.58, roughness: 0.28 });
    const pump = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.074, 0.038, 32), pumpMaterial);
    pump.rotation.z = Math.PI / 2;
    pump.position.set(cpuX + 0.025, CPU_Y, CPU_Z);
    pump.castShadow = true;
    partsGroup.add(pump);
    const pumpFace = new THREE.Mesh(
      new THREE.CylinderGeometry(0.058, 0.058, 0.006, 32),
      new THREE.MeshStandardMaterial({ color: 0x080b12, metalness: 0.4, roughness: 0.24 }),
    );
    pumpFace.rotation.z = Math.PI / 2;
    pumpFace.position.set(cpuX + 0.047, CPU_Y, CPU_Z);
    partsGroup.add(pumpFace);
    const pumpRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.06, 0.007, 8, 36),
      rgbMaterial('standard', 2.5, coolerAccent),
    );
    pumpRing.rotation.y = Math.PI / 2;
    pumpRing.position.set(cpuX + 0.052, CPU_Y, CPU_Z);
    partsGroup.add(pumpRing);

    const fanCount = Math.min(3, Math.max(2, Math.round((Number(cooler.specs.radiatorSize) || 240) / 120)));
    const radiatorY = CASE_H / 2 - 0.075;
    const radiatorZ = 0.0;
    const radW = fanCount * 0.185 + 0.045;
    addBox(partsGroup, radW, 0.034, 0.255, -0.02, radiatorY, radiatorZ, new THREE.MeshStandardMaterial({
      color: 0x0b0f18,
      metalness: 0.72,
      roughness: 0.3,
    }));
    for (let index = 0; index < 20; index += 1) {
      addBox(partsGroup, 0.005, 0.028, 0.235, -0.02 - radW / 2 + 0.02 + index * ((radW - 0.04) / 19), radiatorY, radiatorZ, new THREE.MeshStandardMaterial({ color: 0x263145, metalness: 0.82, roughness: 0.28 })).castShadow = false;
    }
    const radGlow = addBox(partsGroup, radW - 0.06, 0.006, 0.008, -0.02, radiatorY + 0.02, radiatorZ + 0.12, rgbMaterial('standard', 1.2, coolerAccent));
    radGlow.castShadow = false;
    const fanY = radiatorY - 0.058;
    for (let index = 0; index < fanCount; index += 1) {
      addFan(partsGroup, {
        x: -0.02 - (fanCount - 1) * 0.09 + index * 0.18,
        y: fanY,
        z: radiatorZ,
      }, 0.082, {
        rgb: Boolean(cooler.specs.rgb),
        accent: coolerAccent,
        rotationX: Math.PI / 2,
        framed: true,
      });
    }

    addCable(partsGroup, [
      [cpuX + 0.035, CPU_Y + 0.06, CPU_Z + 0.04],
      [BOARD_X + 0.18, CPU_Y + 0.18, CPU_Z + 0.2],
      [BOARD_X + 0.28, 0.59, 0.12],
      [-0.18, radiatorY - 0.035, 0.08],
    ], 0.011, 0x141a24);
    addCable(partsGroup, [
      [cpuX + 0.035, CPU_Y + 0.06, CPU_Z - 0.04],
      [BOARD_X + 0.18, CPU_Y + 0.16, CPU_Z - 0.2],
      [BOARD_X + 0.3, 0.57, -0.1],
      [-0.02, radiatorY - 0.035, 0.02],
    ], 0.011, 0x141a24);
  }

  function buildMemory(build) {
    const kits = getItems(build, 'ram');
    const accent = accentOf(kits[0], 0xf472b6);
    const modules = kits.length
      ? Math.min(4, kits.reduce((sum, kit) => sum + (Number(kit.specs.modules) || 0), 0))
      : 0;
    const hasRgb = kits.some((kit) => kit.specs.rgb);
    const count = modules || 2;
    const stickMaterial = new THREE.MeshStandardMaterial({
      color: modules ? 0x61718c : 0x141a23,
      metalness: 0.66,
      roughness: 0.26,
      transparent: !modules,
      opacity: modules ? 1 : 0.32,
      wireframe: !modules,
    });
    for (let index = 0; index < count; index += 1) {
      const z = CPU_Z + 0.16 + index * 0.038;
      addBox(partsGroup, 0.045, 0.3, 0.014, BOARD_X + 0.04, 0.225, z, stickMaterial);
      if (modules) {
        const topMaterial = hasRgb
          ? rgbMaterial('standard', 2.4, accent)
          : new THREE.MeshStandardMaterial({ color: 0x05070b, emissive: accent, emissiveIntensity: 0.85, roughness: 0.34 });
        addBox(partsGroup, 0.046, 0.009, 0.014, BOARD_X + 0.04, 0.379, z, topMaterial).castShadow = false;
        addBox(partsGroup, 0.006, 0.26, 0.015, BOARD_X + 0.064, 0.225, z, new THREE.MeshStandardMaterial({
          color: 0x9aabc4,
          metalness: 0.82,
          roughness: 0.22,
        })).castShadow = false;
      }
    }
  }

  function buildGpu(build) {
    const gpu = getItems(build, 'gpu')[0];
    const accent = accentOf(gpu, 0xa855f7);
    const length = gpu ? Math.min(0.66, Math.max(0.38, Number(gpu.specs.length) * 0.00205)) : 0.5;
    const centerX = BOARD_X + 0.13;
    const centerZ = GPU_REAR_Z + length / 2;
    const height = 0.22;
    const depth = 0.25;

    if (!gpu) {
      addGhost(partsGroup, depth, height, length, centerX, GPU_Y, centerZ, accent);
      return;
    }

    const shroudMaterial = new THREE.MeshStandardMaterial({ color: 0x252f40, metalness: 0.6, roughness: 0.3 });
    const gpuFaceMaterial = new THREE.MeshStandardMaterial({ color: 0x06090f, metalness: 0.4, roughness: 0.5 });
    addBox(partsGroup, depth, height, length, centerX, GPU_Y, centerZ, shroudMaterial);
    addBox(partsGroup, 0.012, height - 0.018, length - 0.02, centerX + depth / 2 - 0.006, GPU_Y, centerZ, gpuFaceMaterial).castShadow = false;
    addBox(partsGroup, depth - 0.025, 0.012, length - 0.03, centerX, GPU_Y + height / 2 - 0.006, centerZ, new THREE.MeshStandardMaterial({
      color: 0x06070b,
      emissive: accent,
      emissiveIntensity: 1.9,
      roughness: 0.34,
    })).castShadow = false;
    addBox(partsGroup, 0.014, 0.016, length - 0.015, centerX + depth / 2 - 0.003, GPU_Y - height / 2 + 0.008, centerZ, new THREE.MeshStandardMaterial({
      color: 0x91a4c4,
      metalness: 0.9,
      roughness: 0.18,
    })).castShadow = false;
    addBox(partsGroup, depth + 0.012, 0.012, 0.028, centerX, GPU_Y, GPU_REAR_Z - 0.012, new THREE.MeshStandardMaterial({
      color: 0x8291aa,
      metalness: 0.84,
      roughness: 0.24,
    })).castShadow = false;

    const fanCount = length > 0.49 ? 3 : 2;
    for (let index = 0; index < fanCount; index += 1) {
      const fanZ = centerZ - length / 2 + (length / fanCount) * (index + 0.5);
      addFan(partsGroup, { x: centerX + depth / 2 + 0.004, y: GPU_Y, z: fanZ }, Math.min(0.084, length / (fanCount * 2.25)), {
        rgb: true,
        accent,
        rotationY: Math.PI / 2,
        frameColor: 0x59677f,
        bladeColor: 0x1b2331,
      });
    }

    const antSagX = centerX + 0.02;
    const antSagZ = centerZ + length / 2 - 0.055;
    addBox(partsGroup, 0.02, 0.5, 0.02, antSagX, -0.36, antSagZ, new THREE.MeshStandardMaterial({ color: 0x5d6c85, metalness: 0.75, roughness: 0.3 })).castShadow = false;

    addCable(partsGroup, [
      [centerX + depth / 2 - 0.01, GPU_Y + height / 2 + 0.015, centerZ + length / 2 - 0.055],
      [centerX + 0.18, -0.16, centerZ + length / 2 + 0.02],
      [centerX + 0.16, -0.36, 0.08],
      [0.08, -0.4, 0.08],
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

  function buildPsuAndStorage(build) {
    const psu = getItems(build, 'psu')[0];
    const storage = getItems(build, 'storage');
    const accent = accentOf(psu, 0xfbbf24);
    const shroudMaterial = new THREE.MeshStandardMaterial({ color: 0x1c2534, metalness: 0.62, roughness: 0.34 });
    addBox(partsGroup, CASE_W - 0.09, 0.11, CASE_D - 0.12, -0.005, -CASE_H / 2 + 0.075, 0.01, shroudMaterial);
    addBox(partsGroup, CASE_W - 0.14, 0.012, CASE_D - 0.18, -0.005, -CASE_H / 2 + 0.132, 0.01, new THREE.MeshStandardMaterial({
      color: 0x3a465d,
      metalness: 0.82,
      roughness: 0.22,
    })).castShadow = false;
    const shroudSide = -0.005 + (CASE_W - 0.09) / 2 + 0.002;
    addBox(partsGroup, 0.004, 0.062, CASE_D - 0.28, shroudSide, -CASE_H / 2 + 0.072, 0.01, new THREE.MeshStandardMaterial({
      color: 0x090d15,
      metalness: 0.5,
      roughness: 0.4,
    })).castShadow = false;
    addBox(partsGroup, 0.004, 0.006, CASE_D - 0.31, shroudSide + 0.002, -CASE_H / 2 + 0.098, 0.01, new THREE.MeshStandardMaterial({
      color: 0x91a4c4,
      metalness: 0.9,
      roughness: 0.18,
    })).castShadow = false;
    const shroudGlow = addBox(partsGroup, CASE_W - 0.18, 0.006, 0.008, -0.005, -CASE_H / 2 + 0.14, CASE_D / 2 - 0.13, new THREE.MeshStandardMaterial({
      color: 0x06070b,
      emissive: accent,
      emissiveIntensity: 0.85,
      roughness: 0.4,
    }));
    shroudGlow.castShadow = false;

    if (!psu) {
      addGhost(partsGroup, 0.42, 0.17, 0.3, BOARD_X + 0.26, -0.56, -0.16, accent);
    } else {
      addBox(partsGroup, 0.4, 0.16, 0.29, BOARD_X + 0.26, -0.56, -0.16, new THREE.MeshStandardMaterial({
        color: 0x151b26,
        metalness: 0.64,
        roughness: 0.36,
      }));
      addBox(partsGroup, 0.16, 0.07, 0.012, BOARD_X + 0.26, -0.56, -0.005, new THREE.MeshStandardMaterial({
        color: 0x080b12,
        emissive: accent,
        emissiveIntensity: 0.4,
        roughness: 0.5,
      })).castShadow = false;
    }

    storage.slice(0, 2).forEach((drive, index) => {
      const color = drive.specs.interface === 'NVMe' ? accentOf(drive, 0x34d399) : 0x2a3346;
      const driveZ = -0.07 - index * 0.13;
      addBox(partsGroup, 0.17, 0.026, 0.1, BOARD_X + 0.32, -0.607, driveZ, new THREE.MeshStandardMaterial({
        color: 0x36445a,
        metalness: 0.68,
        roughness: 0.3,
      }));
      addBox(partsGroup, 0.14, 0.004, 0.075, BOARD_X + 0.32, -0.592, driveZ, new THREE.MeshStandardMaterial({
        color: 0x080b12,
        emissive: color,
        emissiveIntensity: 1.1,
        roughness: 0.4,
      })).castShadow = false;
      addBox(partsGroup, 0.02, 0.01, 0.09, BOARD_X + 0.24, -0.604, driveZ, new THREE.MeshStandardMaterial({
        color: 0x91a4c4,
        metalness: 0.9,
        roughness: 0.2,
      })).castShadow = false;
    });

    addCable(partsGroup, [
      [BOARD_X + 0.07, 0.2, BOARD_FRONT_Z - 0.06],
      [BOARD_X + 0.16, 0.05, 0.3],
      [BOARD_X + 0.2, -0.26, 0.24],
      [BOARD_X + 0.24, -0.39, 0.12],
    ], 0.012, 0x111720);
    addCable(partsGroup, [
      [BOARD_X + 0.02, 0.36, BOARD_REAR_Z + 0.12],
      [BOARD_X - 0.04, 0.48, -0.02],
      [-0.14, 0.48, -0.1],
      [-0.24, 0.04, -0.2],
      [-0.22, -0.38, 0.04],
    ], 0.01, 0x0e131c);
  }

  function buildFans(build) {
    const pcCase = getItems(build, 'case')[0];
    const kits = getItems(build, 'fans');
    const selectedCount = kits.reduce((sum, fan) => sum + (Number(fan.specs.count) || 0), 0);
    const count = Math.min(3, selectedCount || Number(pcCase?.specs.includedFans) || 2);
    const hasRgb = kits.some((fan) => fan.specs.rgb);
    const accent = state.accent;
    const positions = count >= 3 ? [0.28, 0, -0.28] : count === 2 ? [0.16, -0.16] : [0];
    positions.forEach((y) => {
      addFan(partsGroup, { x: 0, y, z: CASE_D / 2 - 0.072 }, 0.145, {
        rgb: hasRgb,
        accent,
        framed: true,
      });
    });
    addFan(partsGroup, { x: -0.17, y: 0.42, z: -CASE_D / 2 + 0.072 }, 0.105, {
      rgb: hasRgb,
      accent,
      framed: true,
    });
  }

  function applyBuild(build) {
    clearGroup(caseGroup);
    clearGroup(partsGroup);
    clearGroup(measureGroup);
    rgbMaterials.length = 0;
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
    if (aspect < 0.82) return 3.65;
    if (aspect < 1.15) return 3.8;
    return 3.55;
  }

  function resetView() {
    view.userZoom = false;
    view.targetTheta = 1.02;
    view.targetPhi = 1.28;
    view.targetRadius = defaultRadius();
    state.lastInteraction = 0;
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
      glowTexture.dispose();
      floorGridTexture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      container.innerHTML = '';
    },
  };
}
