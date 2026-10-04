import { readItems, readPercent, totalsOf } from '../src/utils/totals.js';

const item = (description, quantity, rate) => ({ description, quantity, rate });
const message = (run) => {
    try {
        run();
    } catch (error) {
        return [error.statusCode, error.message];
    }
    return null;
};

describe('reading the items of an invoice', () => {
    test('items become plain, trimmed values', () => {
        expect(readItems([{ description: '  Logo design ', quantity: '2', rate: '1500.50', amount: 1, _id: 'x' }])).toEqual([
            { description: 'Logo design', quantity: 2, rate: 1500.5 },
        ]);
    });

    test('a form can send the list as JSON text', () => {
        expect(readItems(JSON.stringify([item('Hosting', 1, 99)]))).toEqual([item('Hosting', 1, 99)]);
    });

    test('there must be 1 to 50 items', () => {
        for (const value of [undefined, null, [], 'nonsense', '{"a":1}', 7, { 0: item('a', 1, 1) }]) {
            expect(message(() => readItems(value))).toEqual([400, 'An invoice needs at least one item']);
        }
        const many = Array.from({ length: 51 }, () => item('a', 1, 1));
        expect(message(() => readItems(many))).toEqual([400, 'An invoice can have at most 50 items']);
        expect(readItems(many.slice(1))).toHaveLength(50);
    });

    test('each problem names the item and the field', () => {
        const second = (bad) => message(() => readItems([item('ok', 1, 1), bad]));

        expect(second(item('', 1, 1))).toEqual([400, 'Item 2: description is required']);
        expect(second(item('d'.repeat(201), 1, 1))).toEqual([400, 'Item 2: description must be at most 200 characters']);
        expect(second(item({ $gt: '' }, 1, 1))).toEqual([400, 'Item 2: description is required']);
        expect(second('not an item')).toEqual([400, 'Item 2: description is required']);
        expect(second(null)).toEqual([400, 'Item 2: description is required']);

        const quantity = 'Item 2: quantity must be above 0 with at most three decimals';
        for (const bad of [0, -1, '0', '', undefined, null, 'two', '1e3', '1,200', '012', 1.2345, '1.2345', 100001, [1], { $gt: 0 }, true, Infinity]) {
            expect(second(item('x', bad, 1))).toEqual([400, quantity]);
        }

        const rate = 'Item 2: rate must be 0 or more with at most two decimals';
        for (const bad of [-1, '-0.01', '', undefined, 'free', '1e3', '1,200', '012', 9.999, '9.999', 100000001, [1], { $gt: 0 }, false, NaN]) {
            expect(second(item('x', 1, bad))).toEqual([400, rate]);
        }
    });

    test('the smallest and largest values are accepted', () => {
        expect(readItems([item('a', 0.001, 0), item('b', '100000', '100000000'), item('c', 1.5, 0.01), item('d', '0.5', '10.10')])).toHaveLength(4);
    });
});

describe('reading a percentage', () => {
    test('0 to 100 with at most two decimals; nothing given is 0', () => {
        expect(readPercent(undefined, 'Tax')).toBe(0);
        expect(readPercent('', 'Tax')).toBe(0);
        expect(readPercent(null, 'Tax')).toBe(0);
        expect(readPercent('18', 'Tax')).toBe(18);
        expect(readPercent(12.5, 'Tax')).toBe(12.5);
        expect(readPercent('100', 'Tax')).toBe(100);
        expect(readPercent(0, 'Tax')).toBe(0);
    });

    test('anything else is refused by name', () => {
        for (const bad of [-1, 100.01, '18%', '1e1', '012', 12.345, 'ten', [5], { $gt: 0 }, true]) {
            expect(message(() => readPercent(bad, 'Discount'))).toEqual([400, 'Discount must be between 0 and 100 with at most two decimals']);
        }
    });
});

describe('totals', () => {
    test('amounts, discount, tax and total', () => {
        // 2 x 1500.50 = 3001.00; 3 x 199.99 = 599.97; subtotal 3600.97
        // discount 10% = 360.097 -> 360.10; taxable 3240.87; tax 18% = 583.3566 -> 583.36; total 3824.23
        const totals = totalsOf({ items: [item('Design', 2, 1500.5), item('Hosting', 3, 199.99)], discountPercent: 10, taxPercent: 18 });

        expect(totals).toEqual({
            items: [{ description: 'Design', quantity: 2, rate: 1500.5, amount: 3001 }, { description: 'Hosting', quantity: 3, rate: 199.99, amount: 599.97 }],
            subtotal: 3600.97,
            discountAmount: 360.1,
            taxAmount: 583.36,
            total: 3824.23,
        });
    });

    test('sums that floating point gets wrong come out exact', () => {
        // 0.1 x 3 is 0.30000000000000004 in floating point
        expect(totalsOf({ items: [item('a', 3, 0.1)], discountPercent: 0, taxPercent: 0 })).toMatchObject({ subtotal: 0.3, total: 0.3 });
        // 19.99 x 3 = 59.97
        expect(totalsOf({ items: [item('a', 3, 19.99)], discountPercent: 0, taxPercent: 0 }).total).toBe(59.97);
        // ten lines of 0.1 add up to exactly 1
        expect(totalsOf({ items: Array.from({ length: 10 }, () => item('a', 1, 0.1)), discountPercent: 0, taxPercent: 0 }).subtotal).toBe(1);
        // 1.005 x 1 must round up to 1.01, although 1.005 is stored as 1.00499999999999989
        expect(totalsOf({ items: [item('a', 1.005, 1)], discountPercent: 0, taxPercent: 0 }).items[0].amount).toBe(1.01);
        // 0.335 x 3 = 1.005 -> 1.01
        expect(totalsOf({ items: [item('a', 0.335, 3)], discountPercent: 0, taxPercent: 0 }).total).toBe(1.01);
    });

    test('a discount of a third, and tax on what is left', () => {
        // subtotal 100.00; discount 33.33% = 33.33; taxable 66.67; tax 12.5% = 8.33375 -> 8.33; total 75.00
        expect(totalsOf({ items: [item('a', 1, 100)], discountPercent: 33.33, taxPercent: 12.5 })).toMatchObject({
            subtotal: 100, discountAmount: 33.33, taxAmount: 8.33, total: 75,
        });
    });

    test('a half is rounded up at every step', () => {
        // 0.5% of 1.00 = 0.005 -> 0.01
        expect(totalsOf({ items: [item('a', 1, 1)], discountPercent: 0.5, taxPercent: 0 }).discountAmount).toBe(0.01);
        // 2.5% tax on 1.00 = 0.025 -> 0.03
        expect(totalsOf({ items: [item('a', 1, 1)], discountPercent: 0, taxPercent: 2.5 }).taxAmount).toBe(0.03);
    });

    test('large invoices add up exactly', () => {
        // 99999.999 x 199.99 = 19998999.80001 -> 19998999.80; fifty of them = 999949990.00
        const items = Array.from({ length: 50 }, () => item('a', 99999.999, 199.99));

        const totals = totalsOf({ items, discountPercent: 0, taxPercent: 0 });

        expect(totals.items[0].amount).toBe(19998999.8);
        expect(totals.total).toBe(999949990);
    });

    test('a total beyond a million million is refused, not stored inexactly', () => {
        const items = Array.from({ length: 50 }, () => item('a', 100000, 100000000));

        expect(message(() => totalsOf({ items, discountPercent: 0, taxPercent: 0 }))).toEqual([400, 'The invoice total is too large']);
        expect(totalsOf({ items: [item('a', 100000, 9999999.99)], discountPercent: 0, taxPercent: 0 }).total).toBe(999999999000);
    });

    test('a full discount leaves nothing, and nothing is taxed', () => {
        expect(totalsOf({ items: [item('a', 2, 50)], discountPercent: 100, taxPercent: 18 })).toMatchObject({ subtotal: 100, discountAmount: 100, taxAmount: 0, total: 0 });
    });
});
