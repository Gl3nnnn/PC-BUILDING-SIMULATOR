import { escapeHtml } from '../core/format.js';

let artSequence = 0;

const CATEGORY_COLORS = {
  cpu: '#5b8cff',
  motherboard: '#38bdf8',
  gpu: '#a855f7',
  ram: '#f472b6',
  storage: '#34d399',
  psu: '#fbbf24',
  case: '#8b5cf6',
  cooler: '#22d3ee',
  fans: '#f472b6',
};

const BRAND_COLORS = {
  Intel: '#5b8cff',
  AMD: '#ff4d5e',
  NVIDIA: '#7ed321',
  ASUS: '#ff4757',
  MSI: '#ff3d71',
  Gigabyte: '#ff8c42',
  ASRock: '#00c2ff',
  Corsair: '#f7d64a',
  Kingston: '#ff4b4b',
  Samsung: '#4d7cff',
  Crucial: '#67e8f9',
  'Western Digital': '#e5e7eb',
  Seagate: '#22c55e',
  Seasonic: '#fbbf24',
  'Cooler Master': '#a855f7',
  DeepCool: '#3b82f6',
  NZXT: '#7c6cff',
  'Lian Li': '#60a5fa',
  'Fractal Design': '#d6c7a1',
  'be quiet!': '#94a3b8',
  Noctua: '#b45309',
  Thermalright: '#f97316',
  Arctic: '#38bdf8',
  TeamGroup: '#f43f5e',
  'G.Skill': '#ef4444',
  Tecware: '#22d3ee',
  FSP: '#f59e0b',
  'ID-COOLING': '#10b981',
  Jonsbo: '#8b5cf6',
};

function shade(hex, amount) {
  const clean = String(hex || '#8b5cf6').replace('#', '');
  const value = clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean.padEnd(6, '0').slice(0, 6);
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  const adjust = (channel) => {
    const next = amount >= 0 ? channel + (255 - channel) * amount : channel * (1 + amount);
    return Math.max(0, Math.min(255, Math.round(next))).toString(16).padStart(2, '0');
  };
  return `#${adjust(r)}${adjust(g)}${adjust(b)}`;
}

function fanFace(cx, cy, radius, accent, ringOpacity = 0.9) {
  const blades = Array.from({ length: 7 }, (_, index) => {
    const rotation = (index * 360) / 7;
    return `<ellipse cx="${cx}" cy="${cy - radius * 0.52}" rx="${radius * 0.26}" ry="${radius * 0.46}" fill="#1c2333" stroke="rgba(255,255,255,0.06)" transform="rotate(${rotation} ${cx} ${cy})"/>`;
  }).join('');
  return `
    <circle cx="${cx}" cy="${cy}" r="${radius}" fill="#0a0d15" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
    <g opacity="0.95">${blades}</g>
    <circle cx="${cx}" cy="${cy}" r="${radius * 0.22}" fill="#2b3346" stroke="rgba(255,255,255,0.16)"/>
    <circle cx="${cx}" cy="${cy}" r="${radius * 0.94}" fill="none" stroke="${accent}" stroke-width="2" opacity="${ringOpacity}"/>
    <circle cx="${cx}" cy="${cy}" r="${radius * 0.94}" fill="none" stroke="${shade(accent, 0.3)}" stroke-width="6" opacity="0.12"/>
  `;
}

function cpuArt(accent) {
  const pins = [];
  for (let index = 0; index < 9; index += 1) {
    const offset = 116 + index * 11;
    pins.push(`<rect x="${offset}" y="48" width="4" height="7" rx="1" fill="#c7cfdd" opacity="0.65"/>`);
    pins.push(`<rect x="${offset}" y="145" width="4" height="7" rx="1" fill="#c7cfdd" opacity="0.65"/>`);
    pins.push(`<rect x="108" y="${offset}" width="7" height="4" rx="1" fill="#c7cfdd" opacity="0.65"/>`);
    pins.push(`<rect x="205" y="${offset}" width="7" height="4" rx="1" fill="#c7cfdd" opacity="0.65"/>`);
  }
  return `
    <g transform="rotate(-5 160 100)">
      ${pins.join('')}
      <rect x="108" y="52" width="104" height="96" rx="10" fill="url(#metal)" stroke="${shade(accent, 0.15)}" stroke-width="1.5"/>
      <rect x="116" y="60" width="88" height="80" rx="5" fill="#0b0e17" stroke="rgba(255,255,255,0.08)"/>
      <rect x="134" y="76" width="52" height="48" rx="4" fill="url(#accent)" opacity="0.92"/>
      <rect x="141" y="83" width="38" height="34" rx="2" fill="#0a0d18" opacity="0.72"/>
      <path d="M145 90h30M145 98h30M145 106h30" stroke="${shade(accent, 0.4)}" stroke-width="1.4" opacity="0.55"/>
      <circle cx="124" cy="68" r="2.5" fill="${accent}" opacity="0.9"/>
      <path d="M114 138h92" stroke="rgba(255,255,255,0.12)"/>
      <text x="160" y="164" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="9" letter-spacing="2.5" fill="${accent}" opacity="0.8">PROCESSOR</text>
    </g>
  `;
}

function motherboardArt(accent) {
  const slots = Array.from({ length: 4 }, (_, index) => `<rect x="${224 + index * 10}" y="52" width="6" height="68" rx="2" fill="#0a0f1a" stroke="${shade(accent, -0.1)}" stroke-width="0.8"/>`).join('');
  const traces = [
    'M70 150h30v-28h18', 'M86 52v20h22v16', 'M206 150h14v-20h22', 'M70 96h20v12h14',
    'M180 52v22h26', 'M150 150v-16h22', 'M70 124h14v14', 'M190 116h26v18',
  ].map((path, index) => `<path d="${path}" fill="none" stroke="${accent}" stroke-width="1" opacity="${0.14 + (index % 3) * 0.06}"/>`).join('');
  return `
    <g transform="translate(0 4)">
      <rect x="46" y="28" width="228" height="144" rx="8" fill="#0c1826" stroke="rgba(120,180,255,0.28)" stroke-width="1.2"/>
      <rect x="52" y="34" width="216" height="132" rx="5" fill="none" stroke="rgba(255,255,255,0.05)"/>
      ${traces}
      <rect x="76" y="46" width="66" height="70" rx="4" fill="#0a111c" stroke="rgba(255,255,255,0.1)"/>
      <rect x="84" y="54" width="50" height="50" rx="2" fill="#111a29" stroke="${accent}" stroke-opacity="0.4"/>
      <path d="M92 62h34M92 70h34M92 78h34M92 86h34M92 94h34" stroke="rgba(160,200,255,0.2)" stroke-width="1"/>
      ${slots}
      <rect x="86" y="128" width="96" height="10" rx="3" fill="#131c2d" stroke="${accent}" stroke-opacity="0.3"/>
      <rect x="86" y="144" width="72" height="8" rx="2" fill="#0d1524" stroke="rgba(255,255,255,0.08)"/>
      <rect x="192" y="120" width="42" height="30" rx="4" fill="url(#metal)" stroke="rgba(255,255,255,0.1)"/>
      <path d="M200 128h26M200 134h26M200 140h26" stroke="rgba(255,255,255,0.15)"/>
      <rect x="76" y="40" width="88" height="5" rx="2" fill="${accent}" opacity="0.75"/>
      <circle cx="60" cy="44" r="3" fill="#0a0d14" stroke="rgba(255,255,255,0.2)"/>
      <circle cx="260" cy="160" r="3" fill="#0a0d14" stroke="rgba(255,255,255,0.2)"/>
      <circle cx="60" cy="158" r="3" fill="#0a0d14" stroke="rgba(255,255,255,0.2)"/>
      <text x="160" y="186" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="9" letter-spacing="2.5" fill="${accent}" opacity="0.8">MAINBOARD</text>
    </g>
  `;
}

function gpuArt(accent) {
  return `
    <g>
      <rect x="34" y="64" width="252" height="84" rx="9" fill="url(#metal)" stroke="rgba(255,255,255,0.12)"/>
      <rect x="34" y="64" width="252" height="18" rx="9" fill="${shade(accent, -0.45)}" opacity="0.7"/>
      <rect x="42" y="72" width="80" height="4" rx="2" fill="${accent}" opacity="0.9"/>
      <rect x="34" y="132" width="252" height="16" rx="7" fill="#0b0f18" opacity="0.75"/>
      ${fanFace(88, 106, 27, accent)}
      ${fanFace(160, 106, 27, accent)}
      ${fanFace(232, 106, 27, accent)}
      <rect x="286" y="88" width="16" height="38" rx="3" fill="#181f2e" stroke="rgba(255,255,255,0.15)"/>
      <path d="M290 94h8M290 100h8M290 106h8M290 112h8M290 118h8" stroke="rgba(255,255,255,0.2)"/>
      <rect x="64" y="88" width="48" height="5" rx="2" fill="#0c111c" opacity="0.8"/>
      <circle cx="76" cy="156" r="2" fill="${accent}" opacity="0.7"/>
      <circle cx="244" cy="156" r="2" fill="${accent}" opacity="0.7"/>
      <text x="160" y="177" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="9" letter-spacing="2.5" fill="${accent}" opacity="0.8">GRAPHICS CARD</text>
    </g>
  `;
}

function ramArt(accent, rgb) {
  const sticks = [104, 150, 196].map((x, index) => {
    const top = rgb ? `<rect x="${x + 6}" y="44" width="28" height="5" rx="2.5" fill="${accent}" opacity="${0.65 + index * 0.12}"/>` : `<rect x="${x + 6}" y="44" width="28" height="5" rx="2.5" fill="${shade(accent, 0.1)}" opacity="0.45"/>`;
    return `
      <g transform="translate(0 ${index === 1 ? -4 : 0})">
        <rect x="${x}" y="46" width="40" height="114" rx="5" fill="url(#metal)" stroke="rgba(255,255,255,0.12)"/>
        <path d="M${x + 7} 58h26M${x + 7} 66h26" stroke="rgba(255,255,255,0.14)"/>
        ${top}
        <rect x="${x + 4}" y="156" width="32" height="7" rx="2" fill="#c7a24c" opacity="0.8"/>
        <path d="M${x + 9} 158v3M${x + 15} 158v3M${x + 21} 158v3M${x + 27} 158v3" stroke="#1a1408" stroke-width="1.2"/>
      </g>
    `;
  }).join('');
  return `
    ${sticks}
    <text x="160" y="184" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="9" letter-spacing="2.5" fill="${accent}" opacity="0.8">MEMORY</text>
  `;
}

function storageArt(accent, item) {
  const type = item?.specs?.type || 'NVMe SSD';
  const interfaceType = item?.specs?.interface;
  if (interfaceType === 'NVMe') {
    return `
      <g transform="rotate(-4 160 100)">
        <rect x="50" y="82" width="220" height="36" rx="4" fill="#0d1c2c" stroke="rgba(120,200,255,0.3)"/>
        <rect x="58" y="88" width="34" height="24" rx="2" fill="#c7a24c" opacity="0.85"/>
        <path d="M58 94h34M58 102h34" stroke="#1a1408" stroke-width="1.2"/>
        <rect x="102" y="88" width="38" height="24" rx="2" fill="#111a28" stroke="rgba(255,255,255,0.12)"/>
        <rect x="148" y="88" width="44" height="24" rx="2" fill="#111a28" stroke="rgba(255,255,255,0.12)"/>
        <rect x="200" y="88" width="26" height="24" rx="2" fill="#111a28" stroke="rgba(255,255,255,0.12)"/>
        <rect x="232" y="88" width="30" height="24" rx="2" fill="${accent}" opacity="0.2"/>
        <path d="M66 120h204" stroke="${accent}" stroke-width="2" opacity="0.8"/>
        <circle cx="250" cy="90" r="1.8" fill="${accent}"/>
      </g>
      <text x="160" y="160" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="9" letter-spacing="2.5" fill="${accent}" opacity="0.8">NVME STORAGE</text>
    `;
  }
  if (type === 'HDD') {
    return `
      <g>
        <rect x="84" y="52" width="152" height="108" rx="6" fill="url(#metal)" stroke="rgba(255,255,255,0.14)"/>
        <rect x="98" y="66" width="124" height="62" rx="4" fill="#0c111b" stroke="rgba(255,255,255,0.08)"/>
        <circle cx="160" cy="97" r="24" fill="none" stroke="${accent}" stroke-opacity="0.35" stroke-width="2"/>
        <circle cx="160" cy="97" r="10" fill="#161d2b" stroke="rgba(255,255,255,0.12)"/>
        <path d="M88 148h144" stroke="rgba(255,255,255,0.12)"/>
        <rect x="98" y="136" width="42" height="8" rx="2" fill="#0a0e17"/>
        <path d="M146 140h28M182 140h36" stroke="${accent}" stroke-width="1.4" opacity="0.5"/>
      </g>
      <text x="160" y="180" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="9" letter-spacing="2.5" fill="${accent}" opacity="0.8">HARD DRIVE</text>
    `;
  }
  return `
    <g>
      <rect x="104" y="58" width="112" height="88" rx="7" fill="url(#metal)" stroke="rgba(255,255,255,0.14)"/>
      <rect x="114" y="70" width="92" height="52" rx="3" fill="#0c111b" stroke="rgba(255,255,255,0.08)"/>
      <rect x="126" y="82" width="68" height="5" rx="2" fill="${accent}" opacity="0.8"/>
      <rect x="126" y="94" width="44" height="4" rx="2" fill="rgba(255,255,255,0.18)"/>
      <rect x="126" y="104" width="56" height="4" rx="2" fill="rgba(255,255,255,0.12)"/>
      <path d="M190 132h11v9h-11zM204 132h11v9h-11z" fill="#0a0e17" stroke="${accent}" stroke-opacity="0.4"/>
    </g>
    <text x="160" y="170" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="9" letter-spacing="2.5" fill="${accent}" opacity="0.8">SATA SSD</text>
  `;
}

function psuArt(accent, item) {
  const wattage = item?.specs?.wattage ? `${item.specs.wattage}W` : 'PSU';
  return `
    <g>
      <path d="M262 88c22-8 28 2 34 10" fill="none" stroke="${accent}" stroke-width="3" opacity="0.35"/>
      <path d="M262 100c24 4 26 16 34 24" fill="none" stroke="rgba(255,255,255,0.16)" stroke-width="3"/>
      <rect x="52" y="54" width="212" height="104" rx="7" fill="url(#metal)" stroke="rgba(255,255,255,0.14)"/>
      <rect x="62" y="64" width="192" height="12" rx="5" fill="#0a0e17" opacity="0.6"/>
      ${fanFace(112, 112, 32, accent, 0.75)}
      <rect x="158" y="84" width="84" height="44" rx="3" fill="#0b111c" stroke="rgba(255,255,255,0.1)"/>
      <text x="200" y="112" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="20" font-weight="700" fill="${accent}">${wattage}</text>
      <path d="M168 120h64" stroke="rgba(255,255,255,0.15)"/>
      <rect x="232" y="140" width="24" height="8" rx="2" fill="#0a0e17" stroke="${accent}" stroke-opacity="0.4"/>
    </g>
    <text x="160" y="180" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="9" letter-spacing="2.5" fill="${accent}" opacity="0.8">POWER SUPPLY</text>
  `;
}

function caseArt(accent, item) {
  const size = item?.specs?.size || 'Mid Tower';
  const height = size === 'Full Tower' ? 164 : size === 'SFF' ? 132 : 152;
  const top = 100 - height / 2;
  const width = size === 'Full Tower' ? 106 : size === 'SFF' ? 88 : 98;
  const left = 160 - width / 2;
  const fanCount = size === 'SFF' ? 2 : 3;
  const fanRadius = size === 'SFF' ? 15 : 18;
  const fans = Array.from({ length: fanCount }, (_, index) => {
    const y = top + 24 + index * (fanRadius * 2 + 12);
    return fanFace(left + 22, y + fanRadius, fanRadius, accent, 0.85);
  }).join('');
  return `
    <g>
      <ellipse cx="160" cy="${top + height + 8}" rx="${width * 0.72}" ry="8" fill="#000" opacity="0.5"/>
      <rect x="${left}" y="${top}" width="${width}" height="${height}" rx="8" fill="url(#metal)" stroke="rgba(255,255,255,0.16)"/>
      <rect x="${left + 10}" y="${top + 10}" width="${width - 20}" height="${height - 34}" rx="4" fill="#070a12" opacity="0.86"/>
      <rect x="${left + 10}" y="${top + 10}" width="${width - 20}" height="${height - 34}" rx="4" fill="none" stroke="rgba(255,255,255,0.08)"/>
      ${fans}
      <path d="M${left + 10} ${top + 18} L${left + width - 22} ${top + 10} L${left + width - 22} ${top + height - 40} L${left + 18} ${top + height - 28} Z" fill="rgba(180,210,255,0.06)"/>
      <path d="M${left + 8} ${top + height - 24} h${width - 16}" stroke="rgba(255,255,255,0.12)"/>
      <circle cx="${left + width / 2}" cy="${top + height - 12}" r="2" fill="${accent}" opacity="0.7"/>
      <rect x="${left - 2}" y="${top + height - 28}" width="${width + 4}" height="6" rx="3" fill="#0a0e17" stroke="rgba(255,255,255,0.08)"/>
      <path d="M${left + width - 30} ${top + 6} h16" stroke="${accent}" stroke-width="3" opacity="0.7"/>
    </g>
    <text x="160" y="${top + height + 24}" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="9" letter-spacing="2.5" fill="${accent}" opacity="0.8">${escapeHtml(size.toUpperCase())}</text>
  `;
}

function coolerArt(accent, item) {
  const liquid = item?.specs?.type === 'Liquid';
  if (liquid) {
    const fans = [92, 160, 228].map((x) => fanFace(x, 62, 22, accent, 0.8)).join('');
    return `
      <g>
        <rect x="60" y="38" width="200" height="48" rx="5" fill="#0b1019" stroke="rgba(255,255,255,0.12)"/>
        <path d="M68 44v36M78 44v36M88 44v36M98 44v36M108 44v36M118 44v36M128 44v36M138 44v36M148 44v36M158 44v36M168 44v36M178 44v36M188 44v36M198 44v36M208 44v36M218 44v36M228 44v36M238 44v36M248 44v36" stroke="rgba(255,255,255,0.07)"/>
        ${fans}
        <path d="M128 86c-10 26 8 38 2 60M192 86c10 26-8 38-2 60" fill="none" stroke="#263247" stroke-width="8" stroke-linecap="round"/>
        <path d="M128 86c-10 26 8 38 2 60M192 86c10 26-8 38-2 60" fill="none" stroke="${shade(accent, 0.2)}" stroke-width="2" stroke-linecap="round" opacity="0.4"/>
        <rect x="132" y="128" width="56" height="46" rx="8" fill="url(#metal)" stroke="rgba(255,255,255,0.16)"/>
        <rect x="142" y="138" width="36" height="26" rx="4" fill="#0a0e17" stroke="${accent}" stroke-opacity="0.5"/>
        <circle cx="160" cy="151" r="8" fill="none" stroke="${accent}" stroke-width="2" opacity="0.9"/>
        <circle cx="160" cy="151" r="2" fill="${accent}"/>
      </g>
      <text x="160" y="190" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="9" letter-spacing="2.5" fill="${accent}" opacity="0.8">LIQUID COOLING</text>
    `;
  }
  const fins = Array.from({ length: 9 }, (_, index) => `<path d="M112 ${54 + index * 9}h58" stroke="rgba(200,215,240,0.3)" stroke-width="3"/>`).join('');
  return `
    <g>
      <rect x="104" y="44" width="74" height="98" rx="4" fill="#111725" stroke="rgba(255,255,255,0.12)"/>
      ${fins}
      <path d="M104 142h74" stroke="rgba(255,255,255,0.15)"/>
      <path d="M124 142v12M158 142v12" stroke="#c7cfdd" stroke-width="4" stroke-linecap="round"/>
      <rect x="112" y="154" width="58" height="8" rx="3" fill="url(#metal)" stroke="rgba(255,255,255,0.14)"/>
      <circle cx="200" cy="94" r="34" fill="#0a0d15" stroke="rgba(255,255,255,0.1)"/>
      <g>
        <ellipse cx="200" cy="76" rx="9" ry="18" fill="#232b3d" opacity="0.9"/>
        <ellipse cx="200" cy="76" rx="9" ry="18" fill="#232b3d" opacity="0.9" transform="rotate(60 200 94)"/>
        <ellipse cx="200" cy="76" rx="9" ry="18" fill="#232b3d" opacity="0.9" transform="rotate(120 200 94)"/>
      </g>
      <circle cx="200" cy="94" r="9" fill="#2b3346" stroke="rgba(255,255,255,0.16)"/>
      <circle cx="200" cy="94" r="32" fill="none" stroke="${accent}" stroke-width="2" opacity="0.8"/>
    </g>
    <text x="160" y="186" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="9" letter-spacing="2.5" fill="${accent}" opacity="0.8">AIR COOLING</text>
  `;
}

function fanArt(accent, item) {
  const radius = 58;
  return `
    <g>
      ${fanFace(160, 98, radius, accent, 0.9)}
      <circle cx="160" cy="98" r="${radius + 8}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-dasharray="4 6"/>
    </g>
    <text x="160" y="182" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="9" letter-spacing="2.5" fill="${accent}" opacity="0.8">CASE FAN</text>
  `;
}

function fallbackArt(accent) {
  return `
    <rect x="110" y="55" width="100" height="90" rx="8" fill="url(#metal)" stroke="${accent}" stroke-opacity="0.4"/>
    <circle cx="160" cy="100" r="22" fill="none" stroke="${accent}" stroke-opacity="0.6" stroke-width="2"/>
    <path d="M160 86v28M146 100h28" stroke="${accent}" stroke-opacity="0.6" stroke-width="2"/>
  `;
}

export function accentFor(item) {
  if (!item) return '#8b5cf6';
  return item.accent || BRAND_COLORS[item.brand] || CATEGORY_COLORS[item.category] || '#8b5cf6';
}

export function productArt(item, options = {}) {
  const id = ++artSequence;
  const accent = accentFor(item);
  const accentLight = shade(accent, 0.35);
  const accentDark = shade(accent, -0.5);
  const category = item?.category || 'case';
  let inner = '';
  if (category === 'cpu') inner = cpuArt(accent);
  else if (category === 'motherboard') inner = motherboardArt(accent);
  else if (category === 'gpu') inner = gpuArt(accent);
  else if (category === 'ram') inner = ramArt(accent, Boolean(item?.specs?.rgb));
  else if (category === 'storage') inner = storageArt(accent, item);
  else if (category === 'psu') inner = psuArt(accent, item);
  else if (category === 'case') inner = caseArt(accent, item);
  else if (category === 'cooler') inner = coolerArt(accent, item);
  else if (category === 'fans') inner = fanArt(accent, item);
  else inner = fallbackArt(accent);
  inner = inner.replaceAll('url(#metal)', `url(#artmetal${id})`).replaceAll('url(#accent)', `url(#artaccent${id})`);

  const label = item?.name ? `Illustration of ${item.name}` : 'PC component illustration';
  const className = options.className ? `product-art ${options.className}` : 'product-art';

  return `
    <svg class="${className}" viewBox="0 0 320 200" role="img" aria-label="${escapeHtml(label)}" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="artbg${id}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#0a0c14"/>
          <stop offset="1" stop-color="#101426"/>
        </linearGradient>
        <radialGradient id="artglow${id}" cx="50%" cy="52%" r="60%">
          <stop offset="0" stop-color="${accent}" stop-opacity="0.34"/>
          <stop offset="0.62" stop-color="${accent}" stop-opacity="0.07"/>
          <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="artmetal${id}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#343d52"/>
          <stop offset="0.45" stop-color="#151b29"/>
          <stop offset="0.75" stop-color="#242c3e"/>
          <stop offset="1" stop-color="#0e131e"/>
        </linearGradient>
        <linearGradient id="artaccent${id}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${accentLight}"/>
          <stop offset="0.55" stop-color="${accent}"/>
          <stop offset="1" stop-color="${accentDark}"/>
        </linearGradient>
        <pattern id="artgrid${id}" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" stroke="rgba(255,255,255,0.045)" stroke-width="1"/>
        </pattern>
      </defs>
      <rect width="320" height="200" fill="url(#artbg${id})"/>
      <rect width="320" height="200" fill="url(#artgrid${id})"/>
      <ellipse cx="160" cy="104" rx="150" ry="86" fill="url(#artglow${id})"/>
      ${inner}
    </svg>
  `;
}

export function compactArt(item) {
  return productArt(item, { className: 'product-art--compact' });
}
