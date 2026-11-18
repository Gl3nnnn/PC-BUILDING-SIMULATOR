/**
 * Poster export: draws a shareable PNG of a finished build on a canvas so the
 * player can post it. No libraries - plain 2D canvas, drawn from the catalog.
 */

import { CATEGORIES } from '../data/hardware.js';
import { buildTotal, getItems } from '../core/build.js';
import { evaluateBuild } from '../core/compat.js';
import { money } from '../core/currency.js';
import { estimatePerformance } from '../core/perf.js';
import { safeFilename } from './format.js';

const W = 1080;
const H = 1350;

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
  const words = String(text).split(' ');
  let line = '';
  let lines = 0;
  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      lines += 1;
      line = word;
      y += lineHeight;
    } else {
      line = test;
    }
  });
  if (lines < maxLines && line) ctx.fillText(line, x, y);
}

function drawStars(ctx, stars, x, y, size) {
  ctx.fillStyle = '#6d8cff';
  for (let i = 0; i < 5; i += 1) {
    ctx.globalAlpha = i < stars ? 1 : 0.18;
    ctx.font = `${size}px "Segoe UI Symbol", sans-serif`;
    ctx.fillText('★', x + i * (size * 1.1), y);
  }
  ctx.globalAlpha = 1;
}

export function buildPoster({ build, jobTitle, stars, techName = 'Technician', levelLabel = '', fpsResolution = '1080p', fpsQuality = 'high' }) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const gradient = ctx.createLinearGradient(0, 0, W, H);
  gradient.addColorStop(0, '#070b16');
  gradient.addColorStop(0.5, '#0b1020');
  gradient.addColorStop(1, '#131a33');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = 'rgba(109, 140, 255, 0.16)';
  ctx.beginPath();
  ctx.arc(W - 120, 120, 300, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(168, 85, 247, 0.10)';
  ctx.beginPath();
  ctx.arc(80, H - 100, 340, 0, Math.PI * 2);
  ctx.fill();

  const levelInfo = { level: '—', title: 'Builder', label: levelLabel };
  const profile = { name: techName };
  const total = buildTotal(build);
  const compat = evaluateBuild(build);
  const cpu = getItems(build, 'cpu')[0] || null;
  const gpu = getItems(build, 'gpu')[0] || null;
  const perf = estimatePerformance({ cpu, gpu, resolution: fpsResolution, quality: fpsQuality });

  ctx.fillStyle = '#8ea2c7';
  ctx.font = '600 26px "Segoe UI", sans-serif';
  ctx.fillText('PC BUILD STUDIO · CAREER', 72, 108);

  ctx.fillStyle = '#eef2ff';
  ctx.font = '700 66px "Segoe UI", sans-serif';
  wrapText(ctx, jobTitle || build.name || 'Custom build', 72, 190, W - 144, 74, 2);

  ctx.fillStyle = '#b8c4dc';
  ctx.font = '500 28px "Segoe UI", sans-serif';
  ctx.fillText(`${profile.name} · ${levelInfo.label || `Level ${levelInfo.level} ${levelInfo.title}`}`, 72, 262);

  drawStars(ctx, Math.round(stars || 0), 72, 340, 44);

  // Parts list
  let y = 430;
  CATEGORIES.forEach((category) => {
    const items = getItems(build, category.id);
    if (!items.length) return;
    ctx.fillStyle = '#7e8ba6';
    ctx.font = '600 22px "Segoe UI", sans-serif';
    ctx.fillText(category.label.toUpperCase(), 72, y);
    ctx.fillStyle = '#eef2ff';
    ctx.font = '500 28px "Segoe UI", sans-serif';
    const name = items.map((item) => item.name).join(' · ');
    wrapText(ctx, name, 300, y, W - 372, 32, 2);
    y += 62;
  });

  // Stats card
  const cardY = H - 300;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  roundRect(ctx, 72, cardY, W - 144, 180, 26);
  ctx.fill();
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.24)';
  ctx.lineWidth = 2;
  ctx.stroke();

  const stats = [
    ['TOTAL', money(total)],
    ['AVG FPS', perf.ready ? `${perf.average} @ ${perf.resolution.label}` : 'integrated'],
    ['STATUS', compat.status === 'compatible' ? 'Compatible' : compat.status],
  ];
  stats.forEach(([label, value], index) => {
    const x = 110 + index * ((W - 220) / 3);
    ctx.fillStyle = '#7e8ba6';
    ctx.font = '600 20px "Segoe UI", sans-serif';
    ctx.fillText(label, x, cardY + 62);
    ctx.fillStyle = index === 0 ? '#6d8cff' : '#eef2ff';
    ctx.font = '700 40px "Segoe UI", sans-serif';
    ctx.fillText(String(value), x, cardY + 118);
  });

  ctx.fillStyle = 'rgba(238, 242, 255, 0.45)';
  ctx.font = '500 22px "Segoe UI", sans-serif';
  ctx.fillText('Built in PC Build Studio', 72, H - 60);
  return canvas;
}

export function downloadPoster(options) {
  const canvas = buildPoster(options);
  if (!canvas) return false;
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeFilename(options.jobTitle || 'build')}-poster.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }, 'image/png');
  return true;
}
export { safeFilename };
