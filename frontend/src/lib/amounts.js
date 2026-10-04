// Numbers as people type them, and the totals of an invoice while it is being typed.
// The arithmetic is the server's: whole hundredths and thousandths as big integers,
// each step rounded half up, so the preview never differs from what is stored.

const DECIMAL = /^(0|[1-9]\d*)(?:\.(\d+))?$/;

// ".5" is "0.5", "5." is "5", "012" is "12". Anything else is left as typed, for the
// form to refuse.
export const tidyNumber = (value) => {
  let text = String(value ?? '').trim();

  if (text.startsWith('.')) text = `0${text}`;
  if (text.endsWith('.')) text = text.slice(0, -1);
  text = text.replace(/^0+(?=\d)/, '');

  return text;
};

// a typed number as a whole number of its smallest part, or null when it is not one
const scaled = (value, decimals) => {
  const parts = DECIMAL.exec(tidyNumber(value));
  if (!parts) return null;

  const fraction = parts[2] || '';
  if (fraction.length > decimals || parts[1].length > 15) return null;

  return BigInt(parts[1] + fraction.padEnd(decimals, '0'));
};

// whether a typed quantity, rate or percentage is one the server will take
export const isQuantity = (value) => { const amount = scaled(value, 3); return amount !== null && amount > 0n; };
export const isRate = (value) => scaled(value, 2) !== null;
export const isPercent = (value) => { const amount = scaled(value === '' ? '0' : value, 2); return amount !== null && amount <= 10000n; };

const divideRounded = (a, b) => (a * 2n + b) / (b * 2n);
const toUnits = (hundredths) => Number(hundredths) / 100;

// items: [{ description, quantity, rate }] as typed. What cannot be read yet counts as 0.
export const previewTotals = ({ items, discountPercent, taxPercent }) => {
  const lines = items.map((item) => ({
    ...item,
    amount: divideRounded((scaled(item.quantity, 3) ?? 0n) * (scaled(item.rate, 2) ?? 0n), 1000n),
  }));

  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0n);
  const discountAmount = divideRounded(subtotal * (scaled(discountPercent || '0', 2) ?? 0n), 10000n);
  const taxAmount = divideRounded((subtotal - discountAmount) * (scaled(taxPercent || '0', 2) ?? 0n), 10000n);

  return {
    items: lines.map((line) => ({ ...line, amount: toUnits(line.amount) })),
    subtotal: toUnits(subtotal),
    discountAmount: toUnits(discountAmount),
    taxAmount: toUnits(taxAmount),
    total: toUnits(subtotal - discountAmount + taxAmount),
  };
};
