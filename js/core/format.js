const pesoFormatter = new Intl.NumberFormat('en-PH', { maximumFractionDigits: 0 });

export function peso(amount) {
  const value = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  return `₱${pesoFormatter.format(value)}`;
}

export function num(value) {
  return pesoFormatter.format(Number(value) || 0);
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function formatDate(value, withTime = false) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  if (withTime) {
    options.hour = 'numeric';
    options.minute = '2-digit';
  }
  return date.toLocaleDateString('en-PH', options);
}

export function uid(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function debounce(fn, wait = 180) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

export function base64UrlEncode(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

export function base64UrlDecode(encoded) {
  const padded = encoded.replaceAll('-', '+').replaceAll('_', '/') + '==='.slice((encoded.length + 3) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function downloadFile(filename, content, type = 'application/json') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1200);
}

export function safeFilename(name) {
  return String(name || 'pc-build')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'pc-build';
}

export function plural(count, singular, pluralWord) {
  return `${num(count)} ${count === 1 ? singular : pluralWord || `${singular}s`}`;
}

export function byteSizeLabel(gb) {
  const value = Number(gb) || 0;
  return value >= 1000 && value % 1000 === 0 ? `${value / 1000} TB` : `${value} GB`;
}
