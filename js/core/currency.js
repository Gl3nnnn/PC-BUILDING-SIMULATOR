/**
 * Display currency for the whole app.
 *
 * All catalog prices are stored in Philippine pesos. This module only changes
 * how those numbers are *shown*: the build totals, wallet and payouts all stay
 * peso-based internally, so nothing in the game logic ever depends on the rate.
 *
 * The rates are fixed sample values for display only - they are not live FX.
 */

export const CURRENCIES = {
  PHP: { code: 'PHP', symbol: '₱', rate: 1, label: 'Philippine peso', short: 'PHP' },
  USD: { code: 'USD', symbol: '$', rate: 0.0175, label: 'US dollar', short: 'USD' },
  EUR: { code: 'EUR', symbol: '€', rate: 0.0161, label: 'Euro', short: 'EUR' },
  GBP: { code: 'GBP', symbol: '£', rate: 0.0138, label: 'British pound', short: 'GBP' },
  AUD: { code: 'AUD', symbol: 'A$', rate: 0.0264, label: 'Australian dollar', short: 'AUD' },
  SGD: { code: 'SGD', symbol: 'S$', rate: 0.0237, label: 'Singapore dollar', short: 'SGD' },
  JPY: { code: 'JPY', symbol: '¥', rate: 2.72, label: 'Japanese yen', short: 'JPY' },
  INR: { code: 'INR', symbol: '₹', rate: 1.46, label: 'Indian rupee', short: 'INR' },
};

export const CURRENCY_CODES = Object.keys(CURRENCIES);

const listeners = new Set();
let active = 'PHP';

export function getCurrency() {
  return active;
}

export function currencyMeta(code = active) {
  return CURRENCIES[code] || CURRENCIES.PHP;
}

export function setCurrency(code, options = {}) {
  const next = CURRENCIES[code] ? code : 'PHP';
  if (next === active) return active;
  active = next;
  listeners.forEach((handler) => {
    try {
      handler(active);
    } catch (error) {
      console.error(error);
    }
  });
  if (options.emit !== false) window.dispatchEvent(new CustomEvent('currency:changed', { detail: { code: active } }));
  return active;
}

export function onCurrencyChange(handler) {
  listeners.add(handler);
  return () => listeners.delete(handler);
}

/** Convert a peso amount into the active display currency. */
export function convert(amount) {
  const value = Number(amount);
  return (Number.isFinite(value) ? value : 0) * currencyMeta().rate;
}

/** Compact money label, e.g. ₱1,250 / $22 / ¥3,400. Amounts come in pesos. */
export function money(amount, options = {}) {
  const meta = options.code ? currencyMeta(options.code) : currencyMeta();
  const value = convert(amount);
  const digits = options.digits ?? (meta.code === 'JPY' ? 0 : Math.abs(value) < 100 ? 2 : 0);
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  const sign = value < 0 ? '-' : '';
  return `${sign}${meta.symbol}${formatter.format(Math.abs(value))}`;
}

/** Two-letter-ish label used beside price inputs. */
export function currencyLabel() {
  return currencyMeta().short;
}
