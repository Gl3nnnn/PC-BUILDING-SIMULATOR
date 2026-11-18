import * as THREE from 'three';

/**
 * Brand design profiles for the 3D preview.
 *
 * Every real part carries its maker's look: a colour, a finish (matt or
 * brushed), a mark, and a graphic style for the printed plates. Keeping that
 * in one table means a new part inherits the right look from its brand alone,
 * and any specific model can override a field (Noctua's brown fans, Fractal's
 * wood, Corsair's low-profile memory).
 */
const PROFILES = {
  Intel: {
    accent: 0x5b8cff, body: 0x0b2740, panel: 0x081a2b, frameColor: 0x16283d, bladeColor: 0x1d3247,
    style: 'minimal', pattern: 'grid', mark: 'intel', weight: 800, tracking: 0.02, metalness: 0.3, roughness: 0.5,
  },
  AMD: {
    accent: 0xff4d3d, body: 0x1a1013, panel: 0x120a0c, frameColor: 0x241518, bladeColor: 0x2c1a1d,
    style: 'angular', pattern: 'diag', mark: 'AMD', weight: 800, tracking: 0.06, metalness: 0.45, roughness: 0.4,
  },
  NVIDIA: {
    accent: 0x76b900, body: 0x1c2118, panel: 0x0e120c, frameColor: 0x1c2219, bladeColor: 0x252c20,
    style: 'angular', pattern: 'hex', mark: 'NVIDIA', weight: 800, tracking: 0.05, metalness: 0.55, roughness: 0.32,
  },
  ASUS: {
    accent: 0xff4757, body: 0x14161c, panel: 0x0b0d11, frameColor: 0x1b1e26, bladeColor: 0x232733,
    style: 'angular', pattern: 'diag', mark: 'ROG', weight: 900, tracking: 0.16, metalness: 0.6, roughness: 0.3,
  },
  MSI: {
    accent: 0xff2d55, body: 0x191a20, panel: 0x0d0e12, frameColor: 0x1f2029, bladeColor: 0x262832,
    style: 'angular', pattern: 'diag', mark: 'MSI', weight: 900, tracking: 0.12, metalness: 0.5, roughness: 0.34,
  },
  Gigabyte: {
    accent: 0xff8a1f, body: 0x1a1a1c, panel: 0x101012, frameColor: 0x222226, bladeColor: 0x2a2a2f,
    style: 'angular', pattern: 'grid', mark: 'GIGABYTE', weight: 800, tracking: 0.08, metalness: 0.35, roughness: 0.46,
  },
  ASRock: {
    accent: 0xf43f5e, body: 0x22242a, panel: 0x14161a, frameColor: 0x2a2d34, bladeColor: 0x32353d,
    style: 'minimal', pattern: 'dots', mark: 'ASRock', weight: 700, tracking: 0.04, metalness: 0.32, roughness: 0.5,
  },
  Kingston: {
    accent: 0xff2d2d, body: 0x16181d, panel: 0x0c0d10, frameColor: 0x1e2027, bladeColor: 0x262930,
    style: 'angular', pattern: 'diag', mark: 'FURY', weight: 900, tracking: 0.14, metalness: 0.62, roughness: 0.3,
  },
  Corsair: {
    accent: 0xf7d64a, body: 0x15171b, panel: 0x0a0b0e, frameColor: 0x1b1d22, bladeColor: 0x24262c,
    style: 'minimal', pattern: 'grid', mark: 'CORSAIR', weight: 800, tracking: 0.16, metalness: 0.55, roughness: 0.34,
  },
  'G.Skill': {
    accent: 0xff3b30, body: 0x17181c, panel: 0x0c0d10, frameColor: 0x20222a, bladeColor: 0x282a33,
    style: 'angular', pattern: 'diag', mark: 'TRIDENT', weight: 900, tracking: 0.12, metalness: 0.72, roughness: 0.24,
  },
  TeamGroup: {
    accent: 0x00a8e8, body: 0x14181d, panel: 0x0a0d10, frameColor: 0x1b2027, bladeColor: 0x232830,
    style: 'angular', pattern: 'hex', mark: 'T-FORCE', weight: 800, tracking: 0.1, metalness: 0.55, roughness: 0.32,
  },
  Crucial: {
    accent: 0x2563eb, body: 0x131820, panel: 0x090d13, frameColor: 0x1a2029, bladeColor: 0x232a35,
    style: 'minimal', pattern: 'dots', mark: 'crucial', weight: 700, tracking: 0.02, metalness: 0.4, roughness: 0.44,
  },
  Samsung: {
    accent: 0x1428a0, body: 0x15181f, panel: 0x0a0c11, frameColor: 0x1c2029, bladeColor: 0x242935,
    style: 'minimal', pattern: 'none', mark: 'SAMSUNG', weight: 700, tracking: 0.18, metalness: 0.45, roughness: 0.4,
  },
  Seagate: {
    accent: 0x6cb33f, body: 0x1a1d1c, panel: 0x0d100e, frameColor: 0x22262a, bladeColor: 0x2a2f31,
    style: 'minimal', pattern: 'grid', mark: 'Seagate', weight: 700, tracking: 0.04, metalness: 0.35, roughness: 0.5,
  },
  'Western Digital': {
    accent: 0x005195, body: 0x161a21, panel: 0x0b0e12, frameColor: 0x1d222a, bladeColor: 0x252b34,
    style: 'minimal', pattern: 'none', mark: 'WD', weight: 800, tracking: 0.14, metalness: 0.4, roughness: 0.44,
  },
  Seasonic: {
    accent: 0x0091d5, body: 0x1a2028, panel: 0x0d1116, frameColor: 0x232a33, bladeColor: 0x2b333d,
    style: 'minimal', pattern: 'grid', mark: 'SEASONIC', weight: 700, tracking: 0.16, metalness: 0.6, roughness: 0.34,
  },
  'Cooler Master': {
    accent: 0x8b5cf6, body: 0x1b1626, panel: 0x0e0b15, frameColor: 0x241d31, bladeColor: 0x2c2439,
    style: 'angular', pattern: 'diag', mark: 'COOLER MASTER', weight: 800, tracking: 0.1, metalness: 0.46, roughness: 0.4,
  },
  FSP: {
    accent: 0xe31e24, body: 0x1b1c20, panel: 0x0e0e11, frameColor: 0x24252a, bladeColor: 0x2c2d33,
    style: 'minimal', pattern: 'grid', mark: 'FSP', weight: 900, tracking: 0.12, metalness: 0.5, roughness: 0.4,
  },
  'be quiet!': {
    accent: 0xcbd5e1, body: 0x14161a, panel: 0x090a0c, frameColor: 0x1c1e23, bladeColor: 0x26282e,
    style: 'minimal', pattern: 'none', mark: 'be quiet!', weight: 700, tracking: 0.02, metalness: 0.42, roughness: 0.52,
  },
  DeepCool: {
    accent: 0x3b82f6, body: 0x171c24, panel: 0x0b0f14, frameColor: 0x1f252f, bladeColor: 0x272e39,
    style: 'angular', pattern: 'hex', mark: 'DEEPCOOL', weight: 800, tracking: 0.1, metalness: 0.5, roughness: 0.36,
  },
  Tecware: {
    accent: 0x22d3ee, body: 0x1a1d22, panel: 0x0d0f13, frameColor: 0x22262c, bladeColor: 0x2a2f36,
    style: 'minimal', pattern: 'dots', mark: 'TECWARE', weight: 700, tracking: 0.12, metalness: 0.35, roughness: 0.5,
  },
  Jonsbo: {
    accent: 0x94a3b8, body: 0x2a2c31, panel: 0x16181c, frameColor: 0x1e2025, bladeColor: 0x272a30,
    style: 'minimal', pattern: 'none', mark: 'JONSBO', weight: 600, tracking: 0.14, metalness: 0.7, roughness: 0.28,
  },
  'Lian Li': {
    accent: 0x8b5cf6, body: 0x16181e, panel: 0x0a0c10, frameColor: 0x1d2028, bladeColor: 0x252932,
    style: 'minimal', pattern: 'grid', mark: 'LIAN LI', weight: 800, tracking: 0.18, metalness: 0.68, roughness: 0.3,
  },
  NZXT: {
    accent: 0x6a5cff, body: 0x20232b, panel: 0x101218, frameColor: 0x24272f, bladeColor: 0x2d303a,
    style: 'minimal', pattern: 'none', mark: 'NZXT', weight: 800, tracking: 0.16, metalness: 0.3, roughness: 0.58,
  },
  'Fractal Design': {
    accent: 0xd8c9a3, body: 0x2b2a26, panel: 0x171614, frameColor: 0x22221f, bladeColor: 0x2c2b27,
    style: 'minimal', pattern: 'none', mark: 'FRACTAL', weight: 600, tracking: 0.14, metalness: 0.22, roughness: 0.66,
  },
  Noctua: {
    accent: 0xc27c3a, body: 0x8a6a4a, panel: 0xb19e78, frameColor: 0xb19e78, bladeColor: 0x8a5a34,
    style: 'minimal', pattern: 'none', mark: 'NOCTUA', weight: 700, tracking: 0.1, metalness: 0.22, roughness: 0.62,
  },
  Thermalright: {
    accent: 0xf97316, body: 0x1b1d22, panel: 0x0e0f12, frameColor: 0x22252c, bladeColor: 0x2a2e36,
    style: 'angular', pattern: 'diag', mark: 'THERMALRIGHT', weight: 800, tracking: 0.08, metalness: 0.6, roughness: 0.32,
  },
  Arctic: {
    accent: 0x38bdf8, body: 0x1f2228, panel: 0x111318, frameColor: 0x262a32, bladeColor: 0x2f333c,
    style: 'minimal', pattern: 'dots', mark: 'ARCTIC', weight: 700, tracking: 0.12, metalness: 0.4, roughness: 0.46,
  },
  'ID-COOLING': {
    accent: 0x0ea5e9, body: 0x1c2027, panel: 0x0e1116, frameColor: 0x242931, bladeColor: 0x2c323b,
    style: 'minimal', pattern: 'grid', mark: 'ID-COOLING', weight: 700, tracking: 0.08, metalness: 0.45, roughness: 0.4,
  },
};

const FALLBACK = {
  accent: 0x8b5cf6, body: 0x1b2331, panel: 0x0c1018, frameColor: 0x141b28, bladeColor: 0x222c3c,
  style: 'minimal', pattern: 'grid', mark: 'PCBS', weight: 700, tracking: 0.1, metalness: 0.5, roughness: 0.4,
};

const BRAND_ALIASES = {
  'Be Quiet': 'be quiet!',
  BeQuiet: 'be quiet!',
  GSkill: 'G.Skill',
  'Team Group': 'TeamGroup',
  David: 'G.Skill',
  LianLi: 'Lian Li',
  'Cooler Master': 'Cooler Master',
  'Western Digital': 'Western Digital',
  WD: 'Western Digital',
  IDCooling: 'ID-COOLING',
};

const SERIES = {
  gpu: [
    { test: /Founders|RTX 40|RTX 50/i, shroud: 'founders', fans: 2 },
    { test: /RTX 30/i, shroud: 'classic', fans: 2 },
    { test: /Radeon RX 9|Radeon RX 70/i, shroud: 'aero', fans: 3 },
    { test: /Radeon/i, shroud: 'aero', fans: 2 },
  ],
};

function resolveBrandName(brand) {
  if (!brand) return '';
  if (PROFILES[brand]) return brand;
  const alias = BRAND_ALIASES[brand];
  if (alias) return alias;
  const found = Object.keys(PROFILES).find((name) => name.toLowerCase() === brand.toLowerCase());
  return found || '';
}

/** Design profile for a brand name, already merged over the fallback. */
export function brandStyle(brand) {
  const key = resolveBrandName(brand);
  const base = key ? PROFILES[key] : FALLBACK;
  return { ...FALLBACK, ...base, key: key || brand || 'generic' };
}

/**
 * Design profile for one hardware item: the brand look plus any colour the
 * catalogue stores on the item itself (cases and a few kits carry one).
 */
export function brandDesign(item) {
  if (!item) return brandStyle('');
  const style = brandStyle(item.brand);
  const accent = new THREE.Color(item.accent || style.accent);
  return { ...style, accent, name: item.name || '', category: item.category || '' };
}

/** Which shroud shape a graphics card gets, from its name alone. */
export function gpuSeries(item) {
  if (!item) return { shroud: 'classic', fans: 2 };
  const list = SERIES.gpu;
  for (const entry of list) {
    if (entry.test.test(item.name || '')) return entry;
  }
  return { shroud: 'classic', fans: 2 };
}

/* --- drawing helpers ------------------------------------------------------ */

function roundedPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  const radius = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/** Letter-spaced wordmark, because brand plates are defined by their tracking. */
function drawWordmark(ctx, text, x, y, size, color, options = {}) {
  const { weight = 800, tracking = 0.1, align = 'left', font = 'Segoe UI' } = options;
  ctx.font = `${weight} ${size}px "${font}", "Arial", sans-serif`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  const spacing = size * tracking;
  const letters = String(text).split('');
  const widths = letters.map((letter) => ctx.measureText(letter).width);
  const total = widths.reduce((sum, width) => sum + width, 0) + spacing * (letters.length - 1);
  let cursor = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  letters.forEach((letter, index) => {
    ctx.fillText(letter, cursor, y);
    cursor += widths[index] + spacing;
  });
  return total;
}

function paintPattern(ctx, width, height, color, pattern) {
  if (!pattern || pattern === 'none') return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.5;
  if (pattern === 'diag') {
    ctx.lineWidth = 2;
    for (let x = -height; x < width + height; x += 22) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + height, height);
      ctx.stroke();
    }
  } else if (pattern === 'grid') {
    ctx.lineWidth = 1.5;
    for (let x = 0; x < width; x += 26) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 26) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  } else if (pattern === 'hex') {
    ctx.lineWidth = 2;
    const r = 13;
    for (let row = 0; row * r * 1.7 < height; row += 1) {
      for (let col = 0; col * r * 1.77 < width; col += 1) {
        const cx = col * r * 1.77 + (row % 2 ? r * 0.88 : 0);
        const cy = row * r * 1.5;
        ctx.beginPath();
        for (let i = 0; i < 6; i += 1) {
          const angle = (Math.PI / 3) * i;
          const px = cx + Math.cos(angle) * r;
          const py = cy + Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }
  } else if (pattern === 'dots') {
    for (let y = 8; y < height; y += 18) {
      for (let x = 8; x < width; x += 18) {
        ctx.beginPath();
        ctx.arc(x, y, 1.9, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

/* --- textures ------------------------------------------------------------- */

const PLATE_W = 512;
const PLATE_H = 128;

/**
 * A printed plate: maker mark, model line and the brand's accent bar.
 * Used for GPU side plates, PSU badges, cooler tops and case badges.
 */
export function brandPlate(options = {}) {
  const {
    brand = '',
    title = '',
    sub = '',
    accent = 0x8b5cf6,
    style = 'minimal',
    pattern = 'grid',
    direction = 'wide',
  } = options;
  const design = options.design || brandStyle(brand);
  const accentColor = new THREE.Color(accent || design.accent);
  const accentCss = `#${accentColor.getHexString()}`;
  const bodyCss = `#${new THREE.Color(design.body).getHexString()}`;

  const width = direction === 'tall' ? 256 : PLATE_W;
  const height = direction === 'tall' ? 512 : PLATE_H;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) return new THREE.CanvasTexture(canvas);

  const base = ctx.createLinearGradient(0, 0, width, height);
  base.addColorStop(0, bodyCss);
  base.addColorStop(0.55, '#080a0f');
  base.addColorStop(1, bodyCss);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);
  paintPattern(ctx, width, height, accentCss, pattern);

  // Metal sheen across the plate.
  const sheen = ctx.createLinearGradient(0, 0, width * 0.75, height);
  sheen.addColorStop(0, 'rgba(255,255,255,0.10)');
  sheen.addColorStop(0.4, 'rgba(255,255,255,0.22)');
  sheen.addColorStop(1, 'rgba(255,255,255,0.02)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, width, height);

  // Accent bar, shaped by the brand's style.
  ctx.fillStyle = accentCss;
  if (style === 'angular') {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width * 0.14, 0);
    ctx.lineTo(width * 0.05, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillRect(0, 0, width * 0.035, height);
  }

  if (direction === 'tall') {
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(-Math.PI / 2);
    const markWidth = drawWordmark(ctx, (title || design.mark || '').toUpperCase(), 0, -16, 40, '#eff4ff', {
      weight: design.weight, tracking: design.tracking, align: 'center',
    });
    ctx.fillStyle = accentCss;
    ctx.fillRect(-Math.min(160, markWidth / 2), 12, Math.min(320, markWidth), 4);
    if (sub) {
      drawWordmark(ctx, sub, 0, 40, 20, accentCss, {
        weight: 700, tracking: 0.12, align: 'center',
      });
    }
    ctx.restore();
  } else {
    drawWordmark(ctx, (title || design.mark || '').toUpperCase(), width * 0.07, height * 0.44, 46, '#eff4ff', {
      weight: design.weight, tracking: design.tracking, align: 'left',
    });
    if (sub) {
      drawWordmark(ctx, sub, width * 0.07, height * 0.78, 20, accentCss, {
        weight: 700, tracking: 0.1, align: 'left',
      });
    }
    // Small maker mark in the corner keeps the plate readable at any zoom.
    if (design.mark && title && design.mark.toUpperCase() !== title.toUpperCase()) {
      drawWordmark(ctx, design.mark.toUpperCase(), width * 0.93, height * 0.78, 15, '#93a4c0', {
        weight: 600, tracking: 0.14, align: 'right',
      });
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** Fan hub sticker: maker mark, ring in the brand colour, model line. */
export function brandHub(options = {}) {
  const { brand = '', accent = 0x8b5cf6, label = '' } = options;
  const design = options.design || brandStyle(brand);
  const accentColor = new THREE.Color(accent || design.accent);
  const accentCss = `#${accentColor.getHexString()}`;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = `#${new THREE.Color(design.body).getHexString()}`;
  ctx.fillRect(0, 0, 256, 256);
  paintPattern(ctx, 256, 256, accentCss, design.pattern);
  ctx.fillStyle = 'rgba(4,6,10,0.72)';
  ctx.beginPath();
  ctx.arc(128, 128, 104, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = accentCss;
  ctx.lineWidth = 5;
  ctx.globalAlpha = 0.9;
  for (let index = 0; index < 3; index += 1) {
    ctx.beginPath();
    ctx.arc(128, 128, 42 + index * 20, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  const mark = (label || design.mark || 'FAN').toUpperCase();
  drawWordmark(ctx, mark.slice(0, 14), 128, 122, mark.length > 8 ? 22 : 30, '#e9f1ff', {
    weight: design.weight, tracking: Math.min(design.tracking, 0.08), align: 'center',
  });
  drawWordmark(ctx, 'PWM', 128, 160, 15, accentCss, { weight: 700, tracking: 0.14, align: 'center' });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** Printed logo plate for a chipset heatsink or a case chin. */
export function brandLogo(options = {}) {
  const { brand = '', accent = 0x8b5cf6, text = '' } = options;
  const design = options.design || brandStyle(brand);
  const accentColor = new THREE.Color(accent || design.accent);
  const accentCss = `#${accentColor.getHexString()}`;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);
  ctx.fillStyle = `#${new THREE.Color(design.panel).getHexString()}`;
  ctx.fillRect(0, 0, 256, 128);
  paintPattern(ctx, 256, 128, accentCss, design.pattern);
  ctx.fillStyle = 'rgba(6,9,14,0.72)';
  roundedPath(ctx, 12, 12, 232, 104, 10);
  ctx.fill();
  ctx.strokeStyle = accentCss;
  ctx.lineWidth = 3;
  roundedPath(ctx, 12, 12, 232, 104, 10);
  ctx.stroke();
  drawWordmark(ctx, (text || design.mark || 'BOARD').toUpperCase(), 128, 62, (text || design.mark || '').length > 8 ? 24 : 34, '#eaf1ff', {
    weight: design.weight, tracking: Math.min(design.tracking, 0.08), align: 'center',
  });
  if (design.key) {
    drawWordmark(ctx, 'DESIGNED IN LAB', 128, 94, 12, accentCss, { weight: 600, tracking: 0.16, align: 'center' });
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** Memory heatspreader treatment: each kit family trims its top differently. */
export function memoryStyle(item) {
  const name = (item?.name || '').toLowerCase();
  const brand = (item?.brand || '').toLowerCase();
  if (name.includes('trident')) {
    return { top: 'fin', accentWave: true, height: 1.03, toothHeight: 0.05, stripes: true };
  }
  if (name.includes('lpx')) return { top: 'low', accentWave: false, height: 0.82, stripes: false };
  if (name.includes('fury')) return { top: 'beast', accentWave: true, height: 0.98, stripes: true };
  if (name.includes('vengeance')) return { top: 'angular', accentWave: true, height: 0.96, stripes: false };
  if (name.includes('delta') || name.includes('vulcan')) return { top: 'rgb', accentWave: true, height: 0.98, stripes: true };
  if (name.includes('renegade')) return { top: 'fin', accentWave: true, height: 1.02, toothHeight: 0.045, stripes: true };
  if (brand.includes('crucial') || name.includes('crucial')) return { top: 'plain', accentWave: false, height: 0.9, stripes: false };
  return { top: 'plain', accentWave: false, height: 0.95, stripes: false };
}

/** Air cooler finish: Noctua is beige and brown, be quiet is black, and so on. */
export function coolerFinish(item) {
  const brand = (item?.brand || '').toLowerCase();
  if (brand.includes('noctua')) {
    return { fins: 0xb19e78, copper: 0xb07a4b, plate: 0x8a5a34, blades: 0x8a5a34, frame: 0xb19e78, dark: false };
  }
  if (brand.includes('be quiet')) {
    return { fins: 0x1b1e24, copper: 0x8a6a44, plate: 0x11141a, blades: 0x14171c, frame: 0x14171c, dark: true };
  }
  if (brand.includes('thermalright')) {
    return { fins: 0xc3ccd8, copper: 0xb07a4b, plate: 0x1b1f26, blades: 0x22262e, frame: 0x1b1f26, dark: false };
  }
  if (brand.includes('deepcool')) {
    return { fins: 0x3d4a63, copper: 0xa8763f, plate: 0x11161f, blades: 0x1c2331, frame: 0x1a2130, dark: true };
  }
  if (brand.includes('arctic')) {
    return { fins: 0xcfd8e5, copper: 0xb07a4b, plate: 0x1d222a, blades: 0x262b34, frame: 0x2a2f39, dark: false };
  }
  return { fins: 0x4a5768, copper: 0xb07a4b, plate: 0x181d26, blades: 0x222c3c, frame: 0x141b28, dark: false };
}

export const BRAND_PROFILES = PROFILES;
export const BRAND_NAMES = Object.keys(PROFILES);
