import mongoose from 'mongoose';
import { formatNumber, nextInvoiceNumber } from '../src/utils/invoiceNumber.js';
import { Counter } from '../src/models/counter.model.js';

const someone = () => new mongoose.Types.ObjectId();

beforeAll(async () => {
    // the unique index is what makes the first numbers of a user safe
    await Counter.init();
});

test('numbers count up from INV-0001 for each user on their own', async () => {
    const first = someone();
    const second = someone();

    expect(await nextInvoiceNumber(first)).toBe('INV-0001');
    expect(await nextInvoiceNumber(first)).toBe('INV-0002');
    expect(await nextInvoiceNumber(second)).toBe('INV-0001');
    expect(await nextInvoiceNumber(first)).toBe('INV-0003');
});

test('twenty numbers asked for at the same moment are twenty different numbers', async () => {
    const user = someone();

    const numbers = await Promise.all(Array.from({ length: 20 }, () => nextInvoiceNumber(user)));

    expect([...numbers].sort()).toEqual(Array.from({ length: 20 }, (_, index) => formatNumber(index + 1)));
    expect(await Counter.countDocuments({ user })).toBe(1);
});

test('beyond 9999 the number simply grows', () => {
    expect(formatNumber(9999)).toBe('INV-9999');
    expect(formatNumber(10000)).toBe('INV-10000');
});
