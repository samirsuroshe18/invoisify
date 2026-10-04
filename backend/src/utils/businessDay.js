// A "day" in Invoisify is a calendar day written as YYYY-MM-DD. Today is the day it is
// where the business is, wherever the server runs: the distance from UTC is set in
// minutes, and the default is India (UTC+5:30).
const DEFAULT_OFFSET_MINUTES = 330;
// no place on earth is further than 14 hours from UTC
const MAX_OFFSET_MINUTES = 14 * 60;
const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

const offsetMs = () => {
    const setting = (process.env.BUSINESS_UTC_OFFSET_MINUTES || '').trim();
    const configured = Number(setting);
    const usable = setting !== '' && Number.isFinite(configured) && Math.abs(configured) <= MAX_OFFSET_MINUTES;

    return (usable ? configured : DEFAULT_OFFSET_MINUTES) * MINUTE_MS;
};

const today = (now = new Date()) => new Date(now.getTime() + offsetMs()).toISOString().slice(0, 10);

// the moment a day starts, counted in UTC; only used to count days, never shown
const startOf = (day) => {
    const [year, month, date] = DAY.exec(day).slice(1).map(Number);
    return Date.UTC(year, month - 1, date);
};

// a day that exists in the calendar, written as YYYY-MM-DD
const isDay = (value) => {
    if (typeof value !== 'string' || !DAY.test(value)) return false;

    return new Date(startOf(value)).toISOString().slice(0, 10) === value;
};

const addDays = (day, count) => new Date(startOf(day) + count * DAY_MS).toISOString().slice(0, 10);

// how many days the second day is after the first
const daysBetween = (first, second) => Math.round((startOf(second) - startOf(first)) / DAY_MS);

export { today, isDay, addDays, daysBetween }
