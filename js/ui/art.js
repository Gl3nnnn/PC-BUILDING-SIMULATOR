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

/* Real chassis finishes, matching the maker's own palette in the 3D
   profiles: Corsair is near-black, Jonsbo is light silver, Fractal is
   charcoal with oak. Before this every card was tinted with the accent, so a
   Corsair case came out orange. */
const CASE_BODY = {
  Tecware: '#1a1d22',
  Jonsbo: '#2a2c31',
  'Lian Li': '#16181e',
  NZXT: '#20232b',
  Corsair: '#15171b',
  'Fractal Design': '#2b2a26',
  'Cooler Master': '#1b1626',
  DeepCool: '#171c24',
  ASUS: '#14161c',
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

/* Each chassis draws its own body, front intake and fan layout. Before this,
   every case was the same rounded box with three identical fans, so the cards
   gave no clue which product you were looking at. */
const CASE_DESIGNS = [
  { test: /hyperion|gr701/i, w: 118, h: 162, rx: 11, frontFrac: 0.33, kind: 'alu', fans: 3, fanR: 17, mark: 'ROG', accentBar: 'top' },
  { test: /o11|lancool 216|dynamic/i, w: 112, h: 156, rx: 8, frontFrac: 0.3, kind: 'glass', fans: 3, fanR: 14, mark: 'LIAN LI', accentBar: 'none', dual: true },
  { test: /h5 flow/i, w: 104, h: 148, rx: 9, frontFrac: 0.31, kind: 'perf', fans: 2, fanR: 15, mark: 'NZXT', accentBar: 'band', bottom: true },
  { test: /4000d/i, w: 106, h: 146, rx: 8, frontFrac: 0.3, kind: 'narrow', fans: 2, fanR: 14, mark: 'CORSAIR', accentBar: 'top' },
  { test: /north/i, w: 106, h: 146, rx: 7, frontFrac: 0.34, kind: 'wood', fans: 2, fanR: 15, mark: 'FRACTAL', accentBar: 'none' },
  { test: /nr200|nr 200/i, w: 98, h: 122, rx: 9, frontFrac: 0.32, kind: 'dots', fans: 2, fanR: 15, mark: 'COOLER MASTER', accentBar: 'top' },
  { test: /matrexx/i, w: 102, h: 142, rx: 7, frontFrac: 0.31, kind: 'slats', fans: 3, fanR: 14, mark: 'DEEPCOOL', accentBar: 'top' },
  { test: /forge m2/i, w: 102, h: 142, rx: 8, frontFrac: 0.32, kind: 'hex', fans: 3, fanR: 14, mark: 'TECWARE', accentBar: 'top' },
  { test: /d31/i, w: 106, h: 134, rx: 10, frontFrac: 0.34, kind: 'dots', fans: 2, fanR: 16, mark: 'JONSBO', accentBar: 'top' },
];

const CASE_BY_SIZE = {
  'Full Tower': { w: 112, h: 156, fans: 3, fanR: 15 },
  'Mid Tower': { w: 104, h: 144, fans: 3, fanR: 14 },
  SFF: { w: 96, h: 122, fans: 2, fanR: 14 },
};

function caseDesign(item) {
  const name = item?.name || '';
  for (const entry of CASE_DESIGNS) if (entry.test.test(name)) return entry;
  const size = item?.specs?.size || 'Mid Tower';
  const front = (item?.specs?.frontPanel || 'Mesh').toLowerCase();
  const kind = front.includes('wood') ? 'wood' : front.includes('glass') ? 'glass' : front.includes('perfor') ? 'perf' : 'hex';
  return { ...(CASE_BY_SIZE[size] || CASE_BY_SIZE['Mid Tower']), rx: 9, frontFrac: 0.32, kind, mark: '', accentBar: 'top' };
}

/** Front intake texture: real mesh, honeycomb, slats, wood or brushed metal. */
function frontPanel(kind, id, tint) {
  const solid = `rgba(7,10,18,0.9)`;
  if (kind === 'glass' || kind === 'narrow') return { defs: '', fill: solid };
  let body = '';
  if (kind === 'hex') {
    body = `<path d="M0 4 L4.6 1.3 L9.2 4 L9.2 9.4 L4.6 12 L0 9.4 Z" fill="none" stroke="rgba(190,215,255,0.3)" stroke-width="1"/>`;
  } else if (kind === 'dots') {
    body = `<circle cx="4" cy="4" r="1.35" fill="#05080e"/>`;
  } else if (kind === 'perf') {
    body = `<circle cx="3" cy="3" r="0.85" fill="#05080e"/><circle cx="3" cy="3" r="0.85" fill="none" stroke="rgba(180,205,240,0.16)"/>`;
  } else if (kind === 'slats') {
    body = `<rect y="0" width="12" height="3.2" fill="#05080e"/><path d="M0 3.2H12" stroke="rgba(170,200,245,0.22)" stroke-width="0.9"/>`;
  } else if (kind === 'wood') {
    body = `<rect width="9" height="26" fill="url(#woodg${id})"/><path d="M9 0V26" stroke="rgba(0,0,0,0.45)" stroke-width="1.2"/><path d="M2.4 0V26M5.4 0V26" stroke="rgba(0,0,0,0.18)" stroke-width="0.6"/>`;
  } else if (kind === 'alu') {
    body = `<path d="M0 0L12 12M-6 0L12 18M-12 0L12 24" stroke="rgba(255,255,255,0.09)" stroke-width="1"/><path d="M0 6H12M0 12H12M0 18H12" stroke="rgba(255,255,255,0.05)" stroke-width="0.6"/>`;
  }
  const size = kind === 'hex' ? [9.2, 12] : kind === 'dots' ? [8, 8] : kind === 'perf' ? [6, 6] : kind === 'slats' ? [12, 4.2] : kind === 'wood' ? [9, 26] : [12, 12];
  return {
    defs: `<pattern id="casefront${id}" width="${size[0]}" height="${size[1]}" patternUnits="userSpaceOnUse">${body}</pattern>`,
    fill: `url(#casefront${id})`,
  };
}

function caseMark(text, x, y) {
  if (!text) return '';
  return `<text x="${x}" y="${y}" text-anchor="end" font-family="'JetBrains Mono', monospace" font-size="5.5" letter-spacing="1.2" fill="rgba(226,236,252,0.5)">${escapeHtml(text)}</text>`;
}

function caseArt(accent, item, id) {
  const size = item?.specs?.size || 'Mid Tower';
  const look = caseDesign(item);
  const width = look.w;
  const height = look.h;
  const GROUND = 170;
  const top = GROUND - height;
  const left = 160 - width / 2;
  const frontW = Math.round(width * look.frontFrac);
  const chin = 14;

  const panel = frontPanel(look.kind, id, shade(accent, -0.55));
  const edgeMaterial = shade(accent, -0.62);
  const body = CASE_BODY[item?.brand] || '#1b2331';

  // Fans sit in the front intake column, evenly spaced down its length.
  // The radius is capped to the column so a ring can never poke out of the
  // chassis, which is what made the cards look broken at small sizes.
  const fanR = Math.min(look.fanR, frontW / 2 - 5);
  const fanZoneTop = top + 10;
  const fanZoneHeight = height - chin - 20;
  const gap = fanZoneHeight / look.fans;
  const fans = Array.from({ length: look.fans }, (_, index) => {
    const cy = fanZoneTop + gap * (index + 0.5);
    const cx = left + frontW / 2;
    return fanFace(cx, cy, fanR, accent, look.kind === 'wood' ? 0.35 : 0.9);
  }).join('');

  const accentBar = look.accentBar === 'top'
    ? `<rect x="${left + width - 26}" y="${top + 7}" width="17" height="4" rx="2" fill="${accent}" opacity="0.85"/>`
    : look.accentBar === 'band'
      ? `<path d="M${left + 6} ${top + 12}h${width - 12}" stroke="${accent}" stroke-width="3" opacity="0.55"/>`
      : '';

  const glassSheen = `<path d="M${left + frontW + 6} ${top + 12} L${left + width - 10} ${top + 4} L${left + width - 10} ${top + height - 42} L${left + frontW + 12} ${top + height - 26} Z" fill="rgba(190,215,255,0.07)"/>`;

  /* The glass side of the case shows a real machine inside: board, cooler,
     graphics card, power supply and cable runs. A plain black window made
     every chassis look like the same empty fridge. */
  const iL = left + frontW + 4;
  const iR = left + width - 9;
  const iT = top + 8;
  const iB = top + height - chin - 4;
  const iw = iR - iL;
  const ih = iB - iT;
  const boardX = iL + iw * 0.2;
  const boardY = iT + ih * 0.08;
  const boardW = iw * 0.56;
  const boardH = ih * 0.58;
  const coolerX = boardX + boardW * 0.16;
  const coolerY = boardY + boardH * 0.16;
  const coolerR = Math.min(boardW * 0.19, boardH * 0.2);
  const gpuX = iL + iw * 0.12;
  const gpuY = boardY + boardH * 0.72;
  const gpuW = iw * 0.74;
  const gpuH = ih * 0.13;
  const psuY = iB - ih * 0.14;
  const interior = `
    <rect x="${iL}" y="${iT}" width="${iw}" height="${ih}" fill="url(#caseinner${id})"/>
    <rect x="${boardX}" y="${boardY}" width="${boardW}" height="${boardH}" rx="2" fill="#121a26" stroke="rgba(150,190,255,0.2)" stroke-width="0.8"/>
    <rect x="${boardX + 3}" y="${boardY + 3}" width="${boardW - 6}" height="${boardH * 0.16}" rx="1.5" fill="#0d141f"/>
    <circle cx="${coolerX + coolerR}" cy="${coolerY + coolerR}" r="${coolerR}" fill="#0a0f18" stroke="${accent}" stroke-width="1.2" opacity="0.9"/>
    <circle cx="${coolerX + coolerR}" cy="${coolerY + coolerR}" r="${coolerR * 0.45}" fill="none" stroke="rgba(200,220,255,0.28)" stroke-width="0.8"/>
    <path d="M${coolerX + coolerR - coolerR * 0.5} ${coolerY + coolerR}h${coolerR}" stroke="rgba(200,220,255,0.2)" stroke-width="0.7"/>
    <rect x="${boardX + boardW * 0.82}" y="${boardY + boardH * 0.1}" width="${boardW * 0.13}" height="${boardH * 0.46}" rx="1" fill="#0c131d" stroke="${accent}" stroke-opacity="0.45" stroke-width="0.7"/>
    <rect x="${gpuX}" y="${gpuY}" width="${gpuW}" height="${gpuH}" rx="2.5" fill="#151d2b" stroke="rgba(190,215,255,0.28)" stroke-width="0.8"/>
    <path d="M${gpuX + 4} ${gpuY + 2.4}h${gpuW * 0.42}" stroke="${accent}" stroke-width="1.1" opacity="0.85"/>
    <circle cx="${gpuX + gpuW * 0.3}" cy="${gpuY + gpuH * 0.62}" r="${gpuH * 0.3}" fill="#0a0f18" stroke="rgba(190,215,255,0.22)" stroke-width="0.6"/>
    <circle cx="${gpuX + gpuW * 0.62}" cy="${gpuY + gpuH * 0.62}" r="${gpuH * 0.3}" fill="#0a0f18" stroke="rgba(190,215,255,0.22)" stroke-width="0.6"/>
    <rect x="${gpuX + gpuW * 0.84}" y="${gpuY + gpuH * 0.3}" width="${gpuW * 0.1}" height="${gpuH * 0.4}" rx="1" fill="${accent}" opacity="0.5"/>
    <path d="M${boardX + boardW * 0.74} ${boardY + boardH * 0.95}C${gpuX + gpuW * 0.5} ${gpuY - 6} ${psuY - 4} ${psuY - 2} ${iL + iw * 0.14} ${psuY}" fill="none" stroke="${accent}" stroke-width="1.1" opacity="0.32"/>
    <rect x="${iL}" y="${psuY}" width="${iw}" height="${iB - psuY}" fill="#0a1018" opacity="0.9"/>
    <path d="M${iL} ${psuY}H${iR}" stroke="rgba(190,215,255,0.2)" stroke-width="1"/>
    <rect x="${iL + iw * 0.68}" y="${psuY + (iB - psuY) * 0.28}" width="${iw * 0.2}" height="${(iB - psuY) * 0.34}" rx="1" fill="${accent}" opacity="0.35"/>
    <path d="M${iL + iw * 0.42} ${psuY}h${iw * 0.2}" stroke="rgba(200,220,255,0.35)" stroke-width="0.8"/>
    <path d="M${iL + 6} ${iT + 5}h${iw * 0.28}M${iL + 6} ${iT + 9}h${iw * 0.22}" stroke="rgba(190,215,255,0.18)" stroke-width="0.8"/>
  `;

  const feet = look.bottom
    ? `<path d="M${left + frontW + 4} ${top + height - chin - 20} l${width - frontW - 16} 6" stroke="rgba(190,215,255,0.16)" stroke-width="2"/>`
    : '';

  return `
    <defs>
      ${panel.defs}
      <linearGradient id="woodg${id}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#6b4726"/>
        <stop offset="0.55" stop-color="#916138"/>
        <stop offset="1" stop-color="#5c3c20"/>
      </linearGradient>
      <linearGradient id="casebody${id}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${shade(body, 0.16)}"/>
        <stop offset="0.45" stop-color="${body}"/>
        <stop offset="1" stop-color="${shade(body, -0.3)}"/>
      </linearGradient>
      <radialGradient id="caseinner${id}" cx="38%" cy="32%" r="86%">
        <stop offset="0" stop-color="#141c29"/>
        <stop offset="0.55" stop-color="#0a111b"/>
        <stop offset="1" stop-color="#05080f"/>
      </radialGradient>
      <clipPath id="caseclip${id}">
        <rect x="${left}" y="${top}" width="${width}" height="${height}" rx="${look.rx}"/>
      </clipPath>
    </defs>
    <g>
      <ellipse cx="160" cy="${GROUND + 9}" rx="${width * 0.7}" ry="8" fill="#000" opacity="0.55"/>
      <rect x="${left}" y="${top}" width="${width}" height="${height}" rx="${look.rx}" fill="url(#casebody${id})" stroke="rgba(255,255,255,0.16)"/>
      <g clip-path="url(#caseclip${id})">
      <rect x="${left + 4}" y="${top + 4}" width="${width - 8}" height="${height - chin}" rx="${Math.max(2, look.rx - 3)}" fill="#060910" opacity="0.92"/>
      ${interior}
      <rect x="${left + 4}" y="${top + 4}" width="${frontW - 4}" height="${height - chin}" fill="${panel.fill}" opacity="0.9"/>
      <path d="M${left + frontW} ${top + 4}V${top + height - chin}" stroke="${edgeMaterial}" stroke-width="2" opacity="0.9"/>
      ${feet}
      ${glassSheen}
      <path d="M${left + width - 10} ${top + 10}V${top + height - chin - 6}" stroke="rgba(255,255,255,0.22)" stroke-width="1.2"/>
      ${fans}
      ${accentBar}
      ${look.dual ? `<path d="M${left + 6} ${top + height - chin - 46}h${width - 12}" stroke="rgba(200,220,255,0.18)" stroke-width="1.5"/><rect x="${left + 6}" y="${top + height - chin - 42}" width="${width - 12}" height="42" fill="rgba(10,16,26,0.55)"/>` : ''}
      <path d="M${left + width - 24} ${top + height - chin - 26}h12" stroke="${accent}" stroke-width="2" opacity="0.6"/>
      <rect x="${left + 4}" y="${top + height - chin - 5}" width="${width - 8}" height="5" rx="2.5" fill="#080c14" stroke="rgba(255,255,255,0.1)"/>
      <circle cx="${left + 8}" cy="${top + height - chin - 3.5}" r="1.4" fill="${accent}" opacity="0.85"/>
      ${caseMark(look.mark, left + width - 12, top + height - chin - 3)}
      </g>
    </g>
    <text x="160" y="${GROUND + 23}" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="9" letter-spacing="2.5" fill="${accent}" opacity="0.8">${escapeHtml(size.toUpperCase())}</text>
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
  else if (category === 'case') inner = caseArt(accent, item, id);
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
