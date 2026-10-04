import { Counter } from '../models/counter.model.js';

const PREFIX = 'INV-';
const DIGITS = 4;
const DUPLICATE_KEY = 11000;

const formatNumber = (seq) => `${PREFIX}${String(seq).padStart(DIGITS, '0')}`;

const increment = (userId) => Counter.findOneAndUpdate(
    { user: userId },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
);

// The next invoice number of a user: INV-0001, INV-0002 and so on. Counting up is one
// step in the database, so two invoices made at the same moment get different numbers.
// A number is never given twice, also when the invoice it was meant for is not saved.
const nextInvoiceNumber = async (userId) => {
    let counter;

    try {
        counter = await increment(userId);
    } catch (error) {
        // the very first two requests of a user can both try to create the counter;
        // the one that lost finds it on a second try
        if (error.code !== DUPLICATE_KEY) throw error;
        counter = await increment(userId);
    }

    return formatNumber(counter.seq);
};

export { nextInvoiceNumber, formatNumber }
