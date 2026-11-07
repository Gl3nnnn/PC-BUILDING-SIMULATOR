import * as THREE from 'three';
import { getItems } from '../core/build.js';

const CASE_W = 1.02;
const CASE_H = 1.5;
const CASE_D = 0.96;
const PLATFORM_Y = -0.86;
const BRAND_ACCENTS = {
  Intel: 0x5b8cff,
  AMD: 0xff4d5e,
  NVIDIA: 0x76b900,
  ASUS: 0xff4757,
  MSI: 0xff3d71,
  Corsair: 0xf7d64a,
  'Lian Li': 0x60a5fa,
  DeepCool: 0x3b82f6,
  NZXT: 0x7c6cff,
  Noctua: 0xc27c3a,
  Arctic: 0x38bdf8,
  'Cooler Master': 0xa855f7,
  'be quiet!': 0x94a3b8,
};
const SIZE_SCALE = { SFF: 0.82, 'Mid Tower': 1, 'Full Tower': 1.08 };

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
  ctx.fillStyle = '#07141d';
  ctx.fillRect(0, 0, 512, 640);
  ctx.strokeStyle = 'rgba(70,170,210,0.16)';
  ctx.lineWidth = 1.2;
  for (let index = 0; index < 70; index += 1) {
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
  ctx.strokeStyle = `rgba(${Math.round(accent.r * 255)},${Math.round(accent.g * 255)},${Math.round(accent.b * 255)},0.25)`;
  ctx.lineWidth = 2;
  for (let index = 0; index < 12; index += 1) {
    const y = 40 + index * 48;
    ctx.beginPath();
    ctx.moveTo(28, y);
    ctx.lineTo(160, y);
    ctx.lineTo(190, y + 22);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(200,225,240,0.35)';
  for (let index = 0; index < 90; index += 1) {
    ctx.fillRect(Math.random() * 512, Math.random() * 640, 3, 3);
  }
  ctx.fillStyle = 'rgba(190,215,235,0.3)';
  ctx.font = '600 16px "Segoe UI", sans-serif';
  ctx.fillText('PC BUILD STUDIO · SAMPLE BOARD', 28, 620);
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
  gradient.addColorStop(0, 'rgba(255,255,255,0.55)');
  gradient.addColorStop(0.45, 'rgba(255,255,255,0.16)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createPCScene(container, options = {}) {
  const testCanvas = document.createElement('canvas');
  const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
  if (!gl) throw new Error('WebGL is not available in this browser.');

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = 'pc-canvas';
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);

  const rootGroup = new THREE.Group();
  const caseGroup = new THREE.Group();
  const partsGroup = new THREE.Group();
  rootGroup.add(caseGroup, partsGroup);
  scene.add(rootGroup);

  const state = {
    autoRotate: options.autoRotate ?? true,
    rgb: options.rgb ?? true,
    dragging: false,
    lastInteraction: 0,
    disposed: false,
    accent: new THREE.Color(0x8b5cf6),
  };

  const view = {
    theta: 0.88,
    phi: 1.13,
    radius: 3.55,
    targetTheta: 0.88,
    targetPhi: 1.13,
    targetRadius: 3.55,
  };

  const rgbMaterials = [];
  const tempColor = new THREE.Color();

  const hemi = new THREE.HemisphereLight(0x9fb4ff, 0x080810, 1.1);
  scene.add(hemi);
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.1);
  keyLight.position.set(2.4, 4, 3.2);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.left = -3;
  keyLight.shadow.camera.right = 3;
  keyLight.shadow.camera.top = 3;
  keyLight.shadow.camera.bottom = -2;
  keyLight.shadow.bias = -0.0008;
  scene.add(keyLight);
  const rimBlue = new THREE.PointLight(0x4d7cff, 6, 7, 2);
  rimBlue.position.set(-2.4, 1.2, 2.2);
  scene.add(rimBlue);
  const rimPurple = new THREE.PointLight(0xa855f7, 5, 7, 2);
  rimPurple.position.set(2.2, 1.8, -1.6);
  scene.add(rimPurple);
  const fillLight = new THREE.PointLight(0x67e8f9, 2.4, 5, 2);
  fillLight.position.set(0, -0.4, 2.6);
  scene.add(fillLight);

  const platform = new THREE.Group();
  const platformBase = new THREE.Mesh(
    new THREE.CylinderGeometry(1.9, 1.95, 0.055, 72),
    new THREE.MeshStandardMaterial({ color: 0x0b0e17, metalness: 0.7, roughness: 0.36 }),
  );
  platformBase.position.y = PLATFORM_Y;
  platformBase.receiveShadow = true;
  platform.add(platformBase);

  const platformRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.58, 0.006, 8, 96),
    new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.65 }),
  );
  platformRing.rotation.x = -Math.PI / 2;
  platformRing.position.y = PLATFORM_Y + 0.031;
  platform.add(platformRing);

  const glowTexture = createRadialGlow();
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(4.2, 4.2),
    new THREE.MeshBasicMaterial({
      map: glowTexture,
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0.24,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = PLATFORM_Y + 0.032;
  platform.add(glow);

  const grid = new THREE.GridHelper(6, 36, 0x26304a, 0x141a28);
  grid.position.y = PLATFORM_Y + 0.034;
  grid.material.transparent = true;
  grid.material.opacity = 0.35;
  platform.add(grid);
  scene.add(platform);

  function addRgbMaterial(material, optionsForMaterial = {}) {
    rgbMaterials.push({
      material,
      offset: Math.random(),
      basic: Boolean(optionsForMaterial.basic),
      intensity: optionsForMaterial.intensity ?? 1.6,
    });
    return material;
  }

  function rgbMaterial(type = 'standard', intensity = 1.6) {
    if (type === 'basic') {
      const material = new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.9 });
      return addRgbMaterial(material, { basic: true });
    }
    const material = new THREE.MeshStandardMaterial({
      color: 0x07080d,
      emissive: 0xa855f7,
      emissiveIntensity: intensity,
      roughness: 0.32,
      metalness: 0.2,
    });
    return addRgbMaterial(material, { intensity });
  }

  function addBox(parent, width, height, depth, x, y, z, material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function addFan(parent, position, radius, optionsForFan = {}) {
    const {
      rgb = false,
      accent = new THREE.Color(0x8b5cf6),
      rotationX = 0,
      rotationY = 0,
      rotationZ = 0,
      speed = 1,
      opacity = 1,
    } = optionsForFan;
    const group = new THREE.Group();
    const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x111722, roughness: 0.55, metalness: 0.35 });
    const ringMaterial = rgb
      ? rgbMaterial('standard', 2.2)
      : new THREE.MeshStandardMaterial({ color: 0x0a0d15, emissive: accent, emissiveIntensity: 0.55, roughness: 0.4 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.92, radius * 0.075, 8, 40), ringMaterial);
    group.add(ring);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(radius, radius * 0.035, 6, 40), frameMaterial);
    group.add(rim);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.2, radius * 0.2, radius * 0.18, 18), frameMaterial);
    hub.rotation.x = Math.PI / 2;
    group.add(hub);
    const bladeMaterial = new THREE.MeshStandardMaterial({ color: 0x232b3c, roughness: 0.5, metalness: 0.35 });
    const bladeGeometry = new THREE.BoxGeometry(radius * 0.62, radius * 0.13, radius * 0.022);
    bladeGeometry.translate(radius * 0.36, 0, 0);
    for (let index = 0; index < 7; index += 1) {
      const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
      blade.rotation.z = (index * Math.PI * 2) / 7;
      blade.rotation.x = 0.38;
      blade.castShadow = true;
      group.add(blade);
    }
    group.position.set(position.x, position.y, position.z);
    group.rotation.set(rotationX, rotationY, rotationZ);
    group.scale.setScalar(speed);
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
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
      color: accent,
      wireframe: true,
      transparent: true,
      opacity: 0.2,
    }));
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  function addCable(parent, points, radius, color) {
    const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(point[0], point[1], point[2])));
    const geometry = new THREE.TubeGeometry(curve, 32, radius, 6, false);
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05 }));
    parent.add(mesh);
    return mesh;
  }

  function buildCase(pcCase) {
    const specs = pcCase?.specs || {};
    const accent = accentOf(pcCase, 0x8b5cf6);
    state.accent.copy(accent);
    const size = specs.size || 'Mid Tower';
    const scale = SIZE_SCALE[size] || 1;
    rootGroup.scale.setScalar(scale);
    rootGroup.position.y = PLATFORM_Y + (CASE_H * scale) / 2 + 0.035;

    const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x0c0f16, metalness: 0.72, roughness: 0.34 });
    const panelMaterial = new THREE.MeshStandardMaterial({ color: 0x0b0e15, metalness: 0.58, roughness: 0.44 });
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x8bb8ff,
      metalness: 0,
      roughness: 0.06,
      transparent: true,
      opacity: 0.13,
      side: THREE.DoubleSide,
      depthWrite: false,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
    });
    const accentMaterial = new THREE.MeshStandardMaterial({
      color: 0x07080d,
      emissive: accent,
      emissiveIntensity: 1.1,
      roughness: 0.35,
    });

    addBox(caseGroup, CASE_W, CASE_H, 0.024, 0, 0, -CASE_D / 2, panelMaterial);
    addBox(caseGroup, CASE_W, 0.028, CASE_D, 0, -CASE_H / 2, 0, frameMaterial);
    addBox(caseGroup, CASE_W, 0.028, CASE_D, 0, CASE_H / 2, 0, frameMaterial);
    addBox(caseGroup, 0.024, CASE_H, CASE_D, -CASE_W / 2, 0, 0, panelMaterial);

    const glass = addBox(caseGroup, 0.009, CASE_H - 0.06, CASE_D - 0.06, CASE_W / 2, 0, 0, glassMaterial);
    glass.castShadow = false;
    glass.receiveShadow = false;

    const topStrip = addBox(caseGroup, CASE_W * 0.86, 0.008, 0.012, 0, CASE_H / 2 - 0.035, CASE_D / 2 - 0.05, accentMaterial);
    topStrip.castShadow = false;

    const frontPanel = specs.frontPanel || 'Mesh';
    if (frontPanel.includes('Glass')) {
      const front = addBox(caseGroup, CASE_W - 0.05, CASE_H - 0.12, 0.008, 0, 0, CASE_D / 2, glassMaterial);
      front.castShadow = false;
    } else {
      const frontMaterial = new THREE.MeshStandardMaterial({ color: 0x090c13, metalness: 0.4, roughness: 0.68, transparent: true, opacity: 0.62 });
      addBox(caseGroup, CASE_W - 0.05, CASE_H - 0.12, 0.02, 0, 0, CASE_D / 2, frontMaterial);
      const slatMaterial = new THREE.MeshStandardMaterial({ color: 0x1a2230, metalness: 0.5, roughness: 0.5 });
      for (let index = 0; index < 14; index += 1) {
        addBox(caseGroup, CASE_W - 0.09, 0.008, 0.006, 0, -CASE_H / 2 + 0.12 + index * 0.09, CASE_D / 2 + 0.012, slatMaterial).castShadow = false;
      }
    }

    if (frontPanel.includes('Wood')) {
      const wood = new THREE.MeshStandardMaterial({ color: 0x6b4a2f, roughness: 0.82, metalness: 0.05 });
      for (let index = 0; index < 6; index += 1) {
        addBox(caseGroup, 0.055, CASE_H - 0.16, 0.02, -CASE_W / 2 + 0.1 + index * 0.09, 0, CASE_D / 2 + 0.016, wood).castShadow = false;
      }
    }

    const trim = addBox(caseGroup, 0.014, CASE_H - 0.04, 0.014, CASE_W / 2 - 0.012, 0, CASE_D / 2 - 0.012, accentMaterial);
    trim.castShadow = false;

    for (const x of [-CASE_W / 2 + 0.045, CASE_W / 2 - 0.045]) {
      for (const z of [-CASE_D / 2 + 0.045, CASE_D / 2 - 0.045]) {
        addBox(caseGroup, 0.035, 0.035, 0.035, x, -CASE_H / 2 - 0.018, z, frameMaterial).castShadow = false;
      }
    }

    const edgeGeometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(CASE_W, CASE_H, CASE_D));
    const edges = new THREE.LineSegments(edgeGeometry, new THREE.LineBasicMaterial({ color: 0x3b465c, transparent: true, opacity: 0.35 }));
    caseGroup.add(edges);

    const topEdge = new THREE.Mesh(
      new THREE.TorusGeometry(0.34, 0.004, 6, 32, Math.PI),
      new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.4 }),
    );
    topEdge.position.set(0, CASE_H / 2 + 0.02, 0);
    topEdge.rotation.x = Math.PI / 2;
    caseGroup.add(topEdge);

    platformRing.material.color.copy(accent);
    glow.material.color.copy(accent);
    return { accent, size, scale, specs };
  }

  function buildMotherboard(build, dims) {
    const board = getItems(build, 'motherboard')[0];
    const accent = accentOf(board, 0x38bdf8);
    const pcbMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: board ? createPcbTexture(accent) : null,
      roughness: 0.62,
      metalness: 0.2,
    });
    if (!board) pcbMaterial.color.set(0x0b1620);
    const boardW = 0.62;
    const boardH = 0.78;
    const boardY = 0.1;
    const boardZ = -CASE_D / 2 + 0.07;
    addBox(partsGroup, boardW, boardH, 0.018, 0.15, boardY, boardZ, pcbMaterial);

    const slotMaterial = new THREE.MeshStandardMaterial({ color: 0x05070d, roughness: 0.5, metalness: 0.3 });
    const heatsinkMaterial = new THREE.MeshStandardMaterial({ color: 0x1b2330, metalness: 0.8, roughness: 0.3 });

    addBox(partsGroup, 0.16, 0.15, 0.025, 0.04, 0.33, boardZ + 0.022, heatsinkMaterial);
    addBox(partsGroup, 0.09, 0.09, 0.012, 0.04, 0.33, boardZ + 0.035, new THREE.MeshStandardMaterial({ color: 0x0a0d14, emissive: accent, emissiveIntensity: 0.22, roughness: 0.4 }));

    for (let index = 0; index < 4; index += 1) {
      addBox(partsGroup, 0.016, 0.24, 0.028, 0.29 + index * 0.037, 0.32, boardZ + 0.024, slotMaterial);
    }

    addBox(partsGroup, 0.16, 0.12, 0.03, 0.36, 0.06, boardZ + 0.024, slotMaterial);
    addBox(partsGroup, 0.16, 0.12, 0.03, 0.36, -0.1, boardZ + 0.024, slotMaterial);
    addBox(partsGroup, 0.14, 0.13, 0.028, 0.34, -0.23, boardZ + 0.024, heatsinkMaterial);
    addBox(partsGroup, 0.12, 0.016, 0.03, 0.02, -0.26, boardZ + 0.024, new THREE.MeshStandardMaterial({ color: 0x0b1019, emissive: accent, emissiveIntensity: 0.5, roughness: 0.5 }));

    addBox(partsGroup, 0.035, 0.1, 0.05, 0.45, 0.38, boardZ + 0.04, slotMaterial);
    addBox(partsGroup, 0.1, 0.025, 0.012, 0.04, 0.455, boardZ + 0.028, heatsinkMaterial);
    const accentStrip = addBox(partsGroup, 0.2, 0.006, 0.008, 0.15, -0.135, boardZ + 0.04, rgbMaterial('standard', 1.2));
    accentStrip.castShadow = false;

    return { board, boardZ, accent };
  }

  function buildCpuAndCooler(build, dims, boardZ) {
    const cpu = getItems(build, 'cpu')[0];
    const cooler = getItems(build, 'cooler')[0];
    const coolerAccent = accentOf(cooler, 0x22d3ee);
    const cpuX = 0.04;
    const cpuY = 0.33;
    const cpuZ = boardZ + 0.045;

    if (cpu) {
      addBox(partsGroup, 0.13, 0.13, 0.02, cpuX, cpuY, cpuZ, new THREE.MeshStandardMaterial({
        color: 0x1a2130,
        metalness: 0.8,
        roughness: 0.28,
        emissive: 0x1a2130,
        emissiveIntensity: 0.3,
      }));
      const cpuGlow = addBox(partsGroup, 0.09, 0.09, 0.004, cpuX, cpuY, cpuZ + 0.014, new THREE.MeshStandardMaterial({
        color: 0x0a0d14,
        emissive: accentOf(cpu, 0x5b8cff),
        emissiveIntensity: 0.9,
        roughness: 0.4,
      }));
      cpuGlow.castShadow = false;
    }

    if (!cooler) {
      addGhost(partsGroup, 0.22, 0.3, 0.22, cpuX, cpuY + 0.17, cpuZ + 0.07, coolerAccent);
      return;
    }

    if (cooler.specs.type === 'Air') {
      const heatsinkMaterial = new THREE.MeshStandardMaterial({ color: 0x394458, metalness: 0.85, roughness: 0.24 });
      const copperMaterial = new THREE.MeshStandardMaterial({ color: 0x8a5a3f, metalness: 0.85, roughness: 0.32 });
      const baseY = cpuY;
      const towerZ = boardZ + 0.11;
      addBox(partsGroup, 0.19, 0.02, 0.19, cpuX, baseY, cpuZ + 0.01, copperMaterial);
      for (let index = 0; index < 10; index += 1) {
        addBox(partsGroup, 0.28, 0.008, 0.24, cpuX, baseY + 0.035 + index * 0.024, towerZ, heatsinkMaterial);
      }
      for (let index = 0; index < 4; index += 1) {
        const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.24, 8), copperMaterial);
        pipe.position.set(cpuX - 0.09 + index * 0.06, baseY + 0.12, towerZ - 0.07);
        partsGroup.add(pipe);
      }
      addFan(partsGroup, { x: cpuX, y: baseY + 0.15, z: towerZ + 0.145 }, 0.115, {
        rgb: Boolean(cooler.specs.rgb),
        accent: coolerAccent,
        rotationX: 0,
      });
    } else {
      const pump = addBox(partsGroup, 0.16, 0.16, 0.06, cpuX, cpuY, cpuZ + 0.02, new THREE.MeshStandardMaterial({
        color: 0x0d1119,
        metalness: 0.6,
        roughness: 0.28,
      }));
      pump.castShadow = true;
      const pumpRing = addFan(partsGroup, { x: cpuX, y: cpuY, z: cpuZ + 0.055 }, 0.065, {
        rgb: Boolean(cooler.specs.rgb),
        accent: coolerAccent,
        rotationX: 0,
      });
      pumpRing.scale.setScalar(0.95);

      const radiatorY = CASE_H / 2 - 0.1;
      const radiatorZ = 0.02;
      addBox(partsGroup, 0.58, 0.028, 0.2, 0.1, radiatorY, radiatorZ, new THREE.MeshStandardMaterial({
        color: 0x0b0f18,
        metalness: 0.7,
        roughness: 0.34,
      }));
      for (let index = 0; index < 14; index += 1) {
        addBox(partsGroup, 0.55, 0.004, 0.012, 0.1, radiatorY + 0.018, radiatorZ - 0.085 + index * 0.013, new THREE.MeshStandardMaterial({ color: 0x2a3346, metalness: 0.8, roughness: 0.3 })).castShadow = false;
      }
      const fanY = radiatorY - 0.06;
      for (let index = 0; index < 3; index += 1) {
        addFan(partsGroup, { x: -0.07 + index * 0.17, y: fanY, z: radiatorZ }, 0.082, {
          rgb: Boolean(cooler.specs.rgb),
          accent: coolerAccent,
          rotationX: Math.PI / 2,
          rotationZ: 0.1,
        });
      }
      addCable(partsGroup, [
        [cpuX - 0.05, cpuY + 0.05, cpuZ + 0.03],
        [-0.16, 0.46, -0.24],
        [-0.2, 0.61, -0.05],
        [-0.12, 0.65, 0.08],
      ], 0.016, 0x1b2230);
      addCable(partsGroup, [
        [cpuX + 0.05, cpuY + 0.05, cpuZ + 0.03],
        [0.2, 0.46, -0.22],
        [0.26, 0.61, -0.02],
        [0.22, 0.65, 0.1],
      ], 0.016, 0x1b2230);
    }
  }

  function buildMemory(build, boardZ) {
    const kits = getItems(build, 'ram');
    const accents = accentOf(kits[0], 0xf472b6);
    const modules = kits.length
      ? Math.min(4, kits.reduce((sum, kit) => sum + (Number(kit.specs.modules) || 0), 0))
      : 0;
    const hasRgb = kits.some((kit) => kit.specs.rgb);
    const count = modules || 2;
    for (let index = 0; index < count; index += 1) {
      const x = 0.29 + index * 0.037;
      const stickMaterial = new THREE.MeshStandardMaterial({
        color: modules ? 0x1c2331 : 0x151a22,
        metalness: 0.6,
        roughness: 0.42,
        transparent: !modules,
        opacity: modules ? 1 : 0.26,
      });
      addBox(partsGroup, 0.018, 0.25, 0.055, x, 0.32, boardZ + 0.055, stickMaterial);
      if (modules) {
        const topMaterial = hasRgb
          ? rgbMaterial('standard', 2.4)
          : new THREE.MeshStandardMaterial({ color: 0x06070b, emissive: accents, emissiveIntensity: 1.1, roughness: 0.35 });
        addBox(partsGroup, 0.019, 0.012, 0.052, x, 0.452, boardZ + 0.055, topMaterial).castShadow = false;
      }
    }
  }

  function buildGpu(build, boardZ, dims) {
    const gpu = getItems(build, 'gpu')[0];
    const accent = accentOf(gpu, 0xa855f7);
    const length = gpu ? Math.min(0.63, Math.max(0.29, Number(gpu.specs.length) * 0.00152)) : 0.44;
    const centerX = -0.28 + length / 2;
    const y = 0.015;
    const z = -0.2;
    const height = 0.13;
    const depth = 0.25;

    if (!gpu) {
      addGhost(partsGroup, length, height, depth, centerX, y, z, accent);
      return;
    }

    const shroud = addBox(partsGroup, length, height, depth, centerX, y, z, new THREE.MeshStandardMaterial({
      color: 0x171d29,
      metalness: 0.55,
      roughness: 0.38,
    }));
    shroud.castShadow = true;
    addBox(partsGroup, length - 0.02, height - 0.02, 0.012, centerX, y, z + depth / 2 - 0.006, new THREE.MeshStandardMaterial({
      color: 0x0c1018,
      metalness: 0.4,
      roughness: 0.55,
    }));
    addBox(partsGroup, length - 0.035, 0.012, 0.012, centerX, y + height / 2 - 0.008, z + depth / 2 + 0.001, new THREE.MeshStandardMaterial({
      color: 0x06070b,
      emissive: accent,
      emissiveIntensity: 1.2,
      roughness: 0.35,
    })).castShadow = false;

    const fanCount = length > 0.43 ? 3 : 2;
    for (let index = 0; index < fanCount; index += 1) {
      const fanX = centerX - length / 2 + (length / fanCount) * (index + 0.5);
      addFan(partsGroup, { x: fanX, y, z: z + depth / 2 + 0.006 }, Math.min(0.052, length / (fanCount * 2.4)), {
        rgb: false,
        accent,
        rotationX: 0,
      });
    }

    addBox(partsGroup, 0.12, 0.02, 0.035, centerX + length / 2 - 0.1, y + height / 2, z - 0.02, new THREE.MeshStandardMaterial({
      color: 0x0a0e16,
      metalness: 0.6,
      roughness: 0.4,
    })).castShadow = false;

    addCable(partsGroup, [
      [centerX + length / 2 - 0.12, y + height / 2 + 0.01, z - 0.02],
      [0.24, -0.18, 0.0],
      [0.2, -0.45, -0.02],
    ], 0.014, 0x141a24);
  }

  function buildPsuAndStorage(build) {
    const psu = getItems(build, 'psu')[0];
    const storage = getItems(build, 'storage');
    const accent = accentOf(psu, 0xfbbf24);
    const shroudMaterial = new THREE.MeshStandardMaterial({ color: 0x0c1018, metalness: 0.55, roughness: 0.45 });
    addBox(partsGroup, 0.76, 0.1, 0.58, 0.05, -0.43, 0.02, shroudMaterial);
    const shroudLight = addBox(partsGroup, 0.52, 0.006, 0.008, 0.05, -0.411, 0.31, new THREE.MeshStandardMaterial({
      color: 0x06070b,
      emissive: accent,
      emissiveIntensity: 0.8,
      roughness: 0.4,
    }));
    shroudLight.castShadow = false;

    if (psu) {
      addBox(partsGroup, 0.52, 0.2, 0.33, 0.06, -0.59, -0.04, new THREE.MeshStandardMaterial({
        color: 0x161c27,
        metalness: 0.65,
        roughness: 0.36,
      }));
      addBox(partsGroup, 0.2, 0.09, 0.02, 0.06, -0.59, 0.13, new THREE.MeshStandardMaterial({
        color: 0x080b12,
        emissive: accent,
        emissiveIntensity: 0.45,
        roughness: 0.5,
      })).castShadow = false;
      addCable(partsGroup, [
        [0.28, -0.52, 0.08],
        [0.36, -0.3, 0.02],
        [0.2, -0.18, -0.04],
      ], 0.012, 0x10151f);
    } else {
      addGhost(partsGroup, 0.5, 0.19, 0.3, 0.06, -0.59, -0.04, accent);
    }

    const mounted = storage.filter((drive) => drive.specs.interface === 'NVMe' || drive.specs.form !== 'M.2 2280').slice(0, 2);
    mounted.forEach((drive, index) => {
      const color = drive.specs.interface === 'NVMe' ? accentOf(drive, 0x34d399) : 0x2a3346;
      addBox(partsGroup, 0.16, 0.028, 0.1, 0.12 + index * 0.02, -0.365 - index * 0.032, 0.12, new THREE.MeshStandardMaterial({
        color: 0x121722,
        metalness: 0.6,
        roughness: 0.4,
      }));
      addBox(partsGroup, 0.13, 0.003, 0.07, 0.12 + index * 0.02, -0.35 - index * 0.032, 0.12, new THREE.MeshStandardMaterial({
        color: 0x080b12,
        emissive: color,
        emissiveIntensity: 0.8,
        roughness: 0.4,
      })).castShadow = false;
    });
  }

  function buildFans(build, dims) {
    const pcCase = getItems(build, 'case')[0];
    const kits = getItems(build, 'fans');
    const selectedCount = kits.reduce((sum, fan) => sum + (Number(fan.specs.count) || 0), 0);
    const count = Math.min(3, selectedCount || Number(pcCase?.specs.includedFans) || 2);
    const hasRgb = kits.some((fan) => fan.specs.rgb);
    const accent = state.accent;
    const positions = count >= 3 ? [0.36, 0, -0.36] : count === 2 ? [0.2, -0.2] : [0];
    positions.forEach((y) => {
      addFan(partsGroup, { x: -0.06, y, z: CASE_D / 2 - 0.09 }, 0.125, {
        rgb: hasRgb,
        accent,
      });
    });
    addFan(partsGroup, { x: -0.27, y: 0.3, z: -CASE_D / 2 + 0.06 }, 0.095, {
      rgb: hasRgb,
      accent,
    });
  }

  function buildDetails(build, dims) {
    const boardZ = -CASE_D / 2 + 0.07;
    buildMotherboard(build, dims);
    buildCpuAndCooler(build, dims, boardZ);
    buildMemory(build, boardZ);
    buildGpu(build, boardZ, dims);
    buildPsuAndStorage(build);
    buildFans(build, dims);
  }

  function applyBuild(build) {
    clearGroup(caseGroup);
    clearGroup(partsGroup);
    rgbMaterials.length = 0;
    const pcCase = getItems(build, 'case')[0];
    const dims = buildCase(pcCase);
    buildDetails(build, dims);
  }

  function resize() {
    const width = container.clientWidth || 720;
    const height = container.clientHeight || 560;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  function updateCamera() {
    const sinPhi = Math.sin(view.phi);
    camera.position.set(
      view.radius * sinPhi * Math.sin(view.theta),
      view.radius * Math.cos(view.phi) + 0.02,
      view.radius * sinPhi * Math.cos(view.theta),
    );
    camera.lookAt(0, 0.02, 0);
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
    view.targetPhi = THREE.MathUtils.clamp(view.targetPhi - dy * 0.0045, 0.38, 2.15);
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
    view.targetRadius = THREE.MathUtils.clamp(view.targetRadius + event.deltaY * 0.0016, 2.1, 6.2);
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
      const hue = state.rgb ? (time * 0.05 + entry.offset) % 1 : 0.62 + entry.offset * 0.08;
      tempColor.setHSL(hue, 0.86, 0.56);
      if (entry.basic) {
        entry.material.color.copy(tempColor);
        entry.material.opacity = state.rgb ? 0.95 : 0.55;
      } else {
        entry.material.emissive.copy(tempColor);
        entry.material.emissiveIntensity = state.rgb ? entry.intensity : 0.45;
      }
    }
    if (state.rgb) {
      tempColor.setHSL((time * 0.035 + 0.6) % 1, 0.85, 0.58);
      rimBlue.color.copy(tempColor);
      tempColor.setHSL((time * 0.035 + 0.82) % 1, 0.85, 0.58);
      rimPurple.color.copy(tempColor);
    } else {
      rimBlue.color.set(0x4d7cff);
      rimPurple.color.set(0xa855f7);
    }
  }

  function animate() {
    if (state.disposed) return;
    const time = clock.getElapsedTime();
    const now = performance.now();
    if (state.autoRotate && !state.dragging && now - state.lastInteraction > 1200) {
      view.targetTheta += 0.0021;
    }
    view.theta += (view.targetTheta - view.theta) * 0.08;
    view.phi += (view.targetPhi - view.phi) * 0.08;
    view.radius += (view.targetRadius - view.radius) * 0.08;
    updateCamera();
    animateRgb(time);
    const pulse = 1 + Math.sin(time * 1.6) * 0.012;
    rootGroup.position.y = (PLATFORM_Y + (CASE_H * rootGroup.scale.y) / 2 + 0.035) * pulse;
    renderer.render(scene, camera);
  }

  renderer.setAnimationLoop(animate);
  applyBuild(options.build || { items: {} });

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
    resetView() {
      view.targetTheta = 0.88;
      view.targetPhi = 1.13;
      view.targetRadius = 3.55;
      state.lastInteraction = 0;
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
      disposeObject(platform);
      glowTexture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      container.innerHTML = '';
    },
  };
}
