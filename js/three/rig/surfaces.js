// Texture, material and primitive kit for the 3D rig.
//
// Everything that decides how a part LOOKS lives here: the canvas textures,
// the material cache, and the box/cylinder/rounded helpers every model builds
// from. The models themselves stay in their own modules, so a change to the
// finish of a part never means touching the geometry of another one.
import * as THREE from 'three';

/**
 * Build the surface kit for one scene.
 *
 * @param {object} state Scene state, read for its accent colour.
 * @param {Array}  rgbMaterials Live list of RGB materials to animate.
 * @param {Array}  ownedTextures Live list of textures to dispose on teardown.
 */
export function createSurfaceKit(state, rgbMaterials, ownedTextures) {
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

  const geometryCache = new Map();
  const materialCache = new Map();
  const textureCache = new Map();
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



  function tex(key, factory) {
    let value = textureCache.get(key);
    if (!value) {
      value = factory();
      value.userData.shared = true;
      textureCache.set(key, value);
    }
    return value;
  }

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


  return {
    geo, mat, own, tex,
    addBox, addCylinder, addRoundedBox, addScrew, addInstances,
    rgbMaterial, addRgbMaterial,
    disposeObject, clearGroup,
    createPcbTexture, createRadialGlow, createSoftShadow, createFloorGrid,
    createStudioEnvironment, createPerforationTexture, createStreakTexture,
    createLabelSprite, createBladeGeometry, roundedRectShape,
    disposeCaches() {
      ownedTextures.forEach((texture) => texture.dispose());
      ownedTextures.length = 0;
      textureCache.forEach((value) => value.dispose());
      textureCache.clear();
      geometryCache.forEach((value) => value.dispose());
      geometryCache.clear();
      materialCache.forEach((value) => value.dispose());
      materialCache.clear();
    },
  };
}

