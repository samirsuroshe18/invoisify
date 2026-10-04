import ApiError from './ApiError.js';

const DEFAULT_MAX = 200;

// Text from a form or a JSON body, trimmed. A number is accepted as text; anything
// else (an object, a list, a boolean) is refused, so nothing but plain values reaches a query.
const readText = (value, label, { max = DEFAULT_MAX, required = false } = {}) => {
    const missing = value === undefined || value === null || value === '';

    if (!missing && typeof value !== 'string' && typeof value !== 'number') {
        throw new ApiError(400, `${label} must be text`);
    }

    const text = missing ? '' : String(value).trim();

    if (!text && required) {
        throw new ApiError(400, `${label} is required`);
    }

    if (text.length > max) {
        throw new ApiError(400, `${label} must be at most ${max} characters`);
    }

    return text;
};

// a choice from a fixed list; an empty value means "not given"
const readChoice = (value, label, choices, { required = false } = {}) => {
    const text = readText(value, label, { required });

    if (text && !choices.includes(text)) {
        throw new ApiError(400, `${label} must be one of: ${choices.join(', ')}`);
    }

    return text || undefined;
};

const readDate = (value, label, { required = false } = {}) => {
    const text = readText(value, label, { required });
    if (!text) return undefined;

    const date = new Date(text);

    if (Number.isNaN(date.getTime())) {
        throw new ApiError(400, `${label} must be a date`);
    }

    return date;
};

// An amount of money: a number, or a form's text of one, above zero and with at most
// two decimals. Anything else is refused.
const MONEY_PATTERN = /^(0|[1-9]\d*)(\.\d+)?$/;

const readMoney = (value, label) => {
    const text = typeof value === 'number' ? String(value) : (typeof value === 'string' ? value.trim() : '');
    const amount = MONEY_PATTERN.test(text) ? Number(text) : NaN;

    if (!Number.isFinite(amount) || amount <= 0) {
        throw new ApiError(400, `${label} must be a number above 0`);
    }

    // counted in the text, before the number could round the extra digits away
    const decimals = (text.split('.')[1] || '').length;

    if (decimals > 2) {
        throw new ApiError(400, `${label} can have at most two decimals`);
    }

    return amount;
};

// a checkbox: JSON sends true, a multipart form sends "true"
const readBoolean = (value) => value === true || value === 'true';

export { readText, readChoice, readDate, readBoolean, readMoney }
