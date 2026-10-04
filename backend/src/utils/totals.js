import ApiError from './ApiError.js';

// Money is counted in whole hundredths and quantities in whole thousandths, as big
// integers, so nothing is ever rounded by accident. Amounts become ordinary numbers
// again only at the end, when they are small enough to be exact.
const MAX_ITEMS = 50;
const DESCRIPTION_MAX = 200;
const MAX_QUANTITY = 100000n * 1000n;       // 100,000 in thousandths
const MAX_RATE = 100000000n * 100n;         // 100,000,000 in hundredths
const MAX_TOTAL = 1000000000000n * 100n;    // a million million in hundredths

// "12", "12.5", "0.125": digits, with decimals only where a point is. Nothing else is
// a number here: no signs, no exponents, no separators, no leading zeros.
const DECIMAL = /^(0|[1-9]\d*)(?:\.(\d+))?$/;

const refuse = (message) => {
    throw new ApiError(400, message);
};

// A value as a whole number of its smallest part: scaled(“12.5”, 2) is 1250n.
// Returns null when the value is not a plain number or has more decimals than allowed.
const scaled = (value, decimals) => {
    const text = typeof value === 'number' ? String(value) : (typeof value === 'string' ? value.trim() : '');
    const parts = DECIMAL.exec(text);

    if (!parts) return null;

    const fraction = parts[2] || '';
    if (fraction.length > decimals || parts[1].length > 15) return null;

    return BigInt(parts[1] + fraction.padEnd(decimals, '0'));
};

// a / b with a half rounded up; both are never negative here
const divideRounded = (a, b) => (a * 2n + b) / (b * 2n);

const toUnits = (hundredths) => Number(hundredths) / 100;

const readItem = (item, position) => {
    const label = `Item ${position}`;
    const description = item && typeof item.description === 'string' ? item.description.trim() : '';

    if (!description) refuse(`${label}: description is required`);
    if (description.length > DESCRIPTION_MAX) refuse(`${label}: description must be at most ${DESCRIPTION_MAX} characters`);

    const quantity = scaled(item.quantity, 3);
    if (quantity === null || quantity <= 0n || quantity > MAX_QUANTITY) {
        refuse(`${label}: quantity must be above 0 with at most three decimals`);
    }

    const rate = scaled(item.rate, 2);
    if (rate === null || rate > MAX_RATE) {
        refuse(`${label}: rate must be 0 or more with at most two decimals`);
    }

    return { description, quantity: Number(quantity) / 1000, rate: toUnits(rate) };
};

// The items of an invoice as they arrived, as a list or as the JSON text of one.
// Only description, quantity and rate are taken; anything else an item carries is dropped.
const readItems = (value) => {
    let items = value;

    if (typeof value === 'string') {
        try {
            items = JSON.parse(value);
        } catch (error) {
            items = null;
        }
    }

    if (!Array.isArray(items) || items.length === 0) refuse('An invoice needs at least one item');
    if (items.length > MAX_ITEMS) refuse(`An invoice can have at most ${MAX_ITEMS} items`);

    return items.map((item, index) => readItem(item, index + 1));
};

// a percentage from 0 to 100 with at most two decimals; nothing given is 0
const readPercent = (value, label) => {
    if (value === undefined || value === null || value === '') return 0;

    const percent = scaled(value, 2);

    if (percent === null || percent > 10000n) {
        refuse(`${label} must be between 0 and 100 with at most two decimals`);
    }

    return toUnits(percent);
};

// Everything an invoice adds up to. items, discountPercent and taxPercent are what
// readItems and readPercent returned.
const totalsOf = ({ items, discountPercent, taxPercent }) => {
    const lines = items.map((item) => {
        // thousandths x hundredths, brought back to hundredths
        const amount = divideRounded(scaled(item.quantity, 3) * scaled(item.rate, 2), 1000n);
        return { ...item, amount };
    });

    const subtotal = lines.reduce((sum, line) => sum + line.amount, 0n);
    const discountAmount = divideRounded(subtotal * scaled(discountPercent, 2), 10000n);
    const taxAmount = divideRounded((subtotal - discountAmount) * scaled(taxPercent, 2), 10000n);
    const total = subtotal - discountAmount + taxAmount;

    // the subtotal is the largest figure there is before a discount takes it down again
    if (total > MAX_TOTAL || subtotal > MAX_TOTAL) refuse('The invoice total is too large');

    return {
        items: lines.map((line) => ({ ...line, amount: toUnits(line.amount) })),
        subtotal: toUnits(subtotal),
        discountAmount: toUnits(discountAmount),
        taxAmount: toUnits(taxAmount),
        total: toUnits(total),
    };
};

export { readItems, readPercent, totalsOf }
