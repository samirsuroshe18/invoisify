import request from 'supertest';
import app from '../src/app.js';
import { Invoice } from '../src/models/invoice.model.js';
import { Business } from '../src/models/business.model.js';
import { Counter } from '../src/models/counter.model.js';
import { addDays, today } from '../src/utils/businessDay.js';
import { loggedIn } from './helpers.js';

const api = '/api/v1/invoices';

// a verified user with a business profile, logged in
const owner = async (overrides = {}) => {
    const session = await loggedIn(overrides);
    await Business.create({ user: session.user._id, companyName: 'Northwind Studio', email: 'hello@northwind.test', currency: 'INR', taxPercent: 18, accentColor: '#0f766e' });
    return session;
};

const body = (changes = {}) => ({
    customer: { name: 'Acme Traders', email: 'accounts@acme.test', address: '4 Market Street' },
    issueDate: '2026-03-01',
    dueDate: '2026-03-15',
    items: [{ description: 'Website design', quantity: 2, rate: 1500.5 }, { description: 'Hosting', quantity: 3, rate: 199.99 }],
    discountPercent: 10,
    taxPercent: 18,
    notes: 'Thank you.',
    ...changes,
});

const create = async (agent, changes) => (await agent.post(api).send(body(changes))).body.data.invoice;
const setStatus = (agent, id, change) => agent.patch(`${api}/${id}/status`).send(change);

beforeAll(async () => {
    await Promise.all([Invoice.init(), Counter.init()]);
});

describe('creating', () => {
    test('an invoice gets the next number, the business details and totals from the server', async () => {
        const { user, agent } = await owner();

        const res = await agent.post(api).send(body({ total: 1, subtotal: 1, status: 'paid', number: 'INV-9999', user: '507f1f77bcf86cd799439011', isDemo: true }));

        expect([res.status, res.body.message]).toEqual([201, 'Invoice INV-0001 created']);
        const { invoice } = res.body.data;
        expect(invoice).toMatchObject({
            number: 'INV-0001', status: 'draft', overdue: false, currency: 'INR',
            issueDate: '2026-03-01', dueDate: '2026-03-15', paidDate: null,
            customer: { name: 'Acme Traders', email: 'accounts@acme.test', address: '4 Market Street' },
            business: { companyName: 'Northwind Studio', email: 'hello@northwind.test', accentColor: '#0f766e' },
            discountPercent: 10, taxPercent: 18,
            subtotal: 3600.97, discountAmount: 360.1, taxAmount: 583.36, total: 3824.23,
            notes: 'Thank you.',
        });
        expect(invoice.items.map((item) => item.amount)).toEqual([3001, 599.97]);
        for (const hidden of ['user', 'shareCode', 'isDemo', '__v']) {
            expect(invoice).not.toHaveProperty(hidden);
        }
        const saved = await Invoice.findOne();
        expect(String(saved.user)).toBe(String(user._id));
        expect(saved.isDemo).toBe(false);
    });

    test('numbers count up, and invoices made at the same moment get different ones', async () => {
        const { agent } = await owner();

        const invoices = await Promise.all(Array.from({ length: 8 }, () => agent.post(api).send(body())));

        expect(invoices.every((res) => res.status === 201)).toBe(true);
        expect(invoices.map((res) => res.body.data.invoice.number).sort()).toEqual(
            ['INV-0001', 'INV-0002', 'INV-0003', 'INV-0004', 'INV-0005', 'INV-0006', 'INV-0007', 'INV-0008']);
        expect((await create(agent)).number).toBe('INV-0009');
    });

    test('a refused invoice does not stop the next one', async () => {
        const { agent } = await owner();

        expect((await agent.post(api).send(body({ items: [] }))).status).toBe(400);
        const invoice = await create(agent);

        expect(invoice.number).toMatch(/^INV-000[12]$/);
        expect((await create(agent)).number).not.toBe(invoice.number);
    });

    test('currency and tax come from the business profile when not given', async () => {
        const { agent } = await owner();

        const invoice = await create(agent, { taxPercent: undefined, currency: undefined, discountPercent: undefined });

        expect(invoice).toMatchObject({ currency: 'INR', taxPercent: 18, discountPercent: 0 });
        expect((await create(agent, { currency: 'USD', taxPercent: 0 }))).toMatchObject({ currency: 'USD', taxPercent: 0 });
    });

    test('needs a business profile first', async () => {
        const { agent } = await loggedIn();

        const res = await agent.post(api).send(body());

        expect([res.status, res.body.message]).toEqual([400, 'Fill in your business profile before creating an invoice']);
    });

    test('each rule is named in its message', async () => {
        const { agent } = await owner();
        const refused = async (changes) => {
            const res = await agent.post(api).send(body(changes));
            return [res.status, res.body.message];
        };

        expect(await refused({ customer: { name: '' } })).toEqual([400, 'Customer name is required']);
        expect(await refused({ customer: 'Acme' })).toEqual([400, 'Customer name is required']);
        expect(await refused({ customer: { name: { $gt: '' } } })).toEqual([400, 'Customer name must be text']);
        expect(await refused({ customer: { name: 'A', email: 'nope' } })).toEqual([400, 'Enter a valid customer email address']);
        expect(await refused({ customer: { name: 'A', address: 'a'.repeat(301) } })).toEqual([400, 'Customer address must be at most 300 characters']);
        expect(await refused({ issueDate: '01-03-2026' })).toEqual([400, 'Issue date must be a date like 2026-03-15']);
        expect(await refused({ dueDate: '2026-02-31' })).toEqual([400, 'Due date must be a date like 2026-03-15']);
        expect(await refused({ dueDate: undefined })).toEqual([400, 'Due date must be a date like 2026-03-15']);
        expect(await refused({ dueDate: '2026-02-28' })).toEqual([400, 'The due date cannot be before the issue date']);
        expect(await refused({ currency: 'YEN' })).toEqual([400, 'Currency must be one of: INR, USD, EUR, GBP']);
        expect(await refused({ items: [{ description: 'x', quantity: 0, rate: 1 }] })).toEqual([400, 'Item 1: quantity must be above 0 with at most three decimals']);
        expect(await refused({ discountPercent: 101 })).toEqual([400, 'Discount must be between 0 and 100 with at most two decimals']);
        expect(await refused({ taxPercent: '18%' })).toEqual([400, 'Tax must be between 0 and 100 with at most two decimals']);
        expect(await refused({ notes: 'n'.repeat(1001) })).toEqual([400, 'Notes must be at most 1000 characters']);
        expect(await Invoice.countDocuments()).toBe(0);
    });
});

describe('who may do what', () => {
    test('a visitor can do nothing', async () => {
        const { agent } = await owner();
        const invoice = await create(agent);

        for (const call of [
            request(app).get(api), request(app).post(api).send(body()), request(app).get(`${api}/${invoice._id}`),
            request(app).put(`${api}/${invoice._id}`).send(body()), request(app).delete(`${api}/${invoice._id}`),
            request(app).post(`${api}/${invoice._id}/duplicate`), request(app).patch(`${api}/${invoice._id}/status`).send({ status: 'sent' }),
        ]) {
            expect((await call).status).toBe(401);
        }
    });

    test('an unverified account can read and cannot write', async () => {
        const { user, agent } = await owner({ isVerified: false });
        const existing = await Invoice.create({ user: user._id, number: 'INV-0001', customer: { name: 'A' }, issueDate: '2026-03-01', dueDate: '2026-03-02', currency: 'INR', business: { companyName: 'N' }, items: [], total: 0 });

        expect((await agent.get(api)).status).toBe(200);
        expect((await agent.get(`${api}/${existing._id}`)).status).toBe(200);
        // one request at a time: each is made when the one before it has answered
        for (const call of [
            () => agent.post(api).send(body()), () => agent.put(`${api}/${existing._id}`).send(body()), () => agent.delete(`${api}/${existing._id}`),
            () => agent.post(`${api}/${existing._id}/duplicate`), () => setStatus(agent, existing._id, { status: 'sent' }),
        ]) {
            const res = await call();
            expect([res.status, res.body.message]).toEqual([403, 'Verify your email to do this']);
        }
        expect(await Invoice.countDocuments()).toBe(1);
    });

    test('another user\'s invoice is not found, whatever is tried', async () => {
        const mine = await owner();
        const other = await owner();
        const invoice = await create(mine.agent);

        for (const call of [
            () => other.agent.get(`${api}/${invoice._id}`), () => other.agent.put(`${api}/${invoice._id}`).send(body()),
            () => other.agent.delete(`${api}/${invoice._id}`), () => other.agent.post(`${api}/${invoice._id}/duplicate`),
            () => setStatus(other.agent, invoice._id, { status: 'sent' }),
        ]) {
            const res = await call();
            expect([res.status, res.body.message]).toEqual([404, 'Invoice not found']);
        }
        expect((await other.agent.get(api)).body.data.invoices).toEqual([]);
        expect((await Invoice.findById(invoice._id)).status).toBe('draft');
    });

    test('an id that is not an id, and values that are not values, read and change nothing', async () => {
        const { agent } = await owner();
        await create(agent);

        for (const id of ['nope', '{"$ne":null}', '507f1f77bcf86cd799439011']) {
            expect((await agent.get(`${api}/${encodeURIComponent(id)}`)).status).toBe(404);
        }
        expect((await agent.get(api).query({ 'status[$ne]': 'x' })).status).toBe(400);
        expect((await agent.get(api).query({ 'search[$regex]': '.*' })).status).toBe(400);
        const res = await setStatus(agent, (await Invoice.findOne())._id, { status: { $ne: 'draft' } });
        expect(res.status).toBe(400);
        expect((await Invoice.findOne()).status).toBe('draft');
    });

    test('the demo account works on its own invoices, which are marked as the demo\'s', async () => {
        const { agent } = await owner({ isDemo: true });

        const invoice = await create(agent);

        expect(invoice.number).toBe('INV-0001');
        expect((await Invoice.findOne()).isDemo).toBe(true);
    });
});

describe('editing', () => {
    test('a draft is changed and its totals are calculated again', async () => {
        const { agent } = await owner();
        const invoice = await create(agent);

        const res = await agent.put(`${api}/${invoice._id}`).send(body({ items: [{ description: 'Audit', quantity: 1, rate: 100 }], discountPercent: 0, taxPercent: 0, customer: { name: 'New Customer' }, number: 'INV-7777' }));

        expect([res.status, res.body.message]).toEqual([200, 'Invoice saved']);
        expect(res.body.data.invoice).toMatchObject({ number: 'INV-0001', total: 100, subtotal: 100, customer: { name: 'New Customer', email: '', address: '' } });
        expect(res.body.data.invoice.items).toHaveLength(1);
    });

    test('a draft takes the business details as they are now; a sent invoice keeps what it was sent with', async () => {
        const { user, agent } = await owner();
        const draft = await create(agent);
        const sent = await create(agent);
        await setStatus(agent, sent._id, { status: 'sent' });
        await Business.updateOne({ user: user._id }, { companyName: 'Renamed Studio' });

        await agent.put(`${api}/${draft._id}`).send(body());

        expect((await agent.get(`${api}/${draft._id}`)).body.data.invoice.business.companyName).toBe('Renamed Studio');
        expect((await agent.get(`${api}/${sent._id}`)).body.data.invoice.business.companyName).toBe('Northwind Studio');
    });

    test('only a draft can be edited', async () => {
        const { agent } = await owner();
        const invoice = await create(agent);
        await setStatus(agent, invoice._id, { status: 'sent' });

        const res = await agent.put(`${api}/${invoice._id}`).send(body({ notes: 'changed' }));

        expect([res.status, res.body.message]).toEqual([409, 'Only a draft can be edited']);
        expect((await Invoice.findById(invoice._id)).notes).toBe('Thank you.');
    });

    test('a refused edit changes nothing', async () => {
        const { agent } = await owner();
        const invoice = await create(agent);

        expect((await agent.put(`${api}/${invoice._id}`).send(body({ dueDate: '2026-01-01' }))).status).toBe(400);
        expect((await Invoice.findById(invoice._id)).dueDate).toBe('2026-03-15');
    });
});

describe('status', () => {
    test('draft to sent to paid and back again', async () => {
        const { agent } = await owner();
        const invoice = await create(agent);

        const sent = await setStatus(agent, invoice._id, { status: 'sent' });
        expect([sent.status, sent.body.message]).toEqual([200, 'Invoice marked as sent']);
        expect(sent.body.data.invoice).toMatchObject({ status: 'sent', paidDate: null });
        expect(sent.body.data.invoice.sentAt).toBeTruthy();

        const paid = await setStatus(agent, invoice._id, { status: 'paid', paidDate: '2026-03-10' });
        expect(paid.body.data.invoice).toMatchObject({ status: 'paid', paidDate: '2026-03-10', overdue: false });

        const unpaid = await setStatus(agent, invoice._id, { status: 'sent' });
        expect([unpaid.body.message, unpaid.body.data.invoice.status, unpaid.body.data.invoice.paidDate]).toEqual(['Invoice marked as unpaid', 'sent', null]);

        const draft = await setStatus(agent, invoice._id, { status: 'draft' });
        expect([draft.body.message, draft.body.data.invoice.status]).toEqual(['Invoice moved back to draft', 'draft']);
    });

    test('the paid date is today unless given, and never before the issue date', async () => {
        const { agent } = await owner();
        const invoice = await create(agent, { issueDate: addDays(today(), -3), dueDate: addDays(today(), 10) });
        await setStatus(agent, invoice._id, { status: 'sent' });

        const early = await setStatus(agent, invoice._id, { status: 'paid', paidDate: addDays(today(), -4) });
        const wrong = await setStatus(agent, invoice._id, { status: 'paid', paidDate: 'yesterday' });
        const paid = await setStatus(agent, invoice._id, { status: 'paid' });

        expect([early.status, early.body.message]).toEqual([400, 'The paid date cannot be before the issue date']);
        expect([wrong.status, wrong.body.message]).toEqual([400, 'Paid date must be a date like 2026-03-15']);
        expect(paid.body.data.invoice.paidDate).toBe(today());
    });

    test('changes outside the table are refused by name', async () => {
        const { agent } = await owner();
        const draft = await create(agent);
        const paid = await create(agent);
        await setStatus(agent, paid._id, { status: 'sent' });
        await setStatus(agent, paid._id, { status: 'paid', paidDate: '2026-03-02' });
        const refused = async (id, status) => {
            const res = await setStatus(agent, id, { status });
            return [res.status, res.body.message];
        };

        expect(await refused(draft._id, 'paid')).toEqual([409, 'An invoice that is draft cannot become paid']);
        expect(await refused(draft._id, 'draft')).toEqual([409, 'An invoice that is draft cannot become draft']);
        expect(await refused(paid._id, 'draft')).toEqual([409, 'An invoice that is paid cannot become draft']);
        expect(await refused(paid._id, 'paid')).toEqual([409, 'An invoice that is paid cannot become paid']);
        expect(await refused(draft._id, 'overdue')).toEqual([400, 'Status must be one of: draft, sent, paid']);
        expect(await refused(draft._id, undefined)).toEqual([400, 'Status is required']);
    });

    test('two changes sent together leave one consistent invoice', async () => {
        const { agent } = await owner();
        const invoice = await create(agent);
        await setStatus(agent, invoice._id, { status: 'sent' });

        const answers = await Promise.all([
            setStatus(agent, invoice._id, { status: 'paid', paidDate: '2026-03-05' }),
            setStatus(agent, invoice._id, { status: 'draft' }),
        ]);

        expect(answers.map((res) => res.status).sort()).toEqual([200, 409]);
        const saved = await Invoice.findById(invoice._id);
        expect([['paid', '2026-03-05'], ['draft', undefined]]).toContainEqual([saved.status, saved.paidDate]);
    });

    test('overdue is a sent invoice whose due date has passed', async () => {
        const { agent } = await owner();
        const late = await create(agent, { issueDate: addDays(today(), -20), dueDate: addDays(today(), -1) });
        const dueToday = await create(agent, { issueDate: addDays(today(), -20), dueDate: today() });
        const overdueOf = async (invoice) => (await agent.get(`${api}/${invoice._id}`)).body.data.invoice.overdue;

        expect(await overdueOf(late)).toBe(false);
        await setStatus(agent, late._id, { status: 'sent' });
        await setStatus(agent, dueToday._id, { status: 'sent' });
        expect(await overdueOf(late)).toBe(true);
        expect(await overdueOf(dueToday)).toBe(false);
        await setStatus(agent, late._id, { status: 'paid' });
        expect(await overdueOf(late)).toBe(false);
    });
});

describe('deleting and duplicating', () => {
    test('a draft or a sent invoice is deleted; a paid one must be marked unpaid first', async () => {
        const { agent } = await owner();
        const draft = await create(agent);
        const paid = await create(agent);
        await setStatus(agent, paid._id, { status: 'sent' });
        await setStatus(agent, paid._id, { status: 'paid', paidDate: '2026-03-02' });

        const gone = await agent.delete(`${api}/${draft._id}`);
        const kept = await agent.delete(`${api}/${paid._id}`);

        expect([gone.status, gone.body.message]).toEqual([200, 'Invoice INV-0001 deleted']);
        expect([kept.status, kept.body.message]).toEqual([409, 'Mark the invoice as unpaid before deleting it']);
        expect(await Invoice.countDocuments()).toBe(1);
        // a number is never given again
        expect((await create(agent)).number).toBe('INV-0003');
    });

    test('a duplicate is a new draft from today with the same time to pay', async () => {
        const { user, agent } = await owner();
        const original = await create(agent, { issueDate: '2026-01-10', dueDate: '2026-01-24' });
        await setStatus(agent, original._id, { status: 'sent' });
        await Business.updateOne({ user: user._id }, { companyName: 'Renamed Studio' });

        const res = await agent.post(`${api}/${original._id}/duplicate`);

        expect([res.status, res.body.message]).toEqual([201, 'Invoice INV-0002 created from INV-0001']);
        expect(res.body.data.invoice).toMatchObject({
            number: 'INV-0002', status: 'draft', issueDate: today(), dueDate: addDays(today(), 14), paidDate: null,
            total: original.total, customer: original.customer, business: { companyName: 'Renamed Studio' },
        });
        expect(res.body.data.invoice._id).not.toBe(original._id);
        expect(res.body.data.invoice.sentAt).toBeNull();
    });
});

describe('the list', () => {
    const many = async (agent, count) => {
        for (let index = 0; index < count; index += 1) {
            await create(agent, { customer: { name: `Customer ${index + 1}` } });
        }
    };

    test('newest first, 20 to a page, without the items', async () => {
        const { agent } = await owner();
        await many(agent, 23);

        const first = (await agent.get(api)).body.data;
        const second = (await agent.get(api).query({ page: 2 })).body.data;

        expect(first).toMatchObject({ page: 1, pages: 2, total: 23 });
        expect(first.invoices).toHaveLength(20);
        expect(first.invoices[0].number).toBe('INV-0023');
        expect(second.invoices.map((invoice) => invoice.number)).toEqual(['INV-0003', 'INV-0002', 'INV-0001']);
        expect(first.invoices[0]).toEqual(expect.objectContaining({ customer: { name: 'Customer 23' }, total: 3824.23, currency: 'INR', status: 'draft', overdue: false }));
        expect(first.invoices[0]).not.toHaveProperty('items');
        expect(first.invoices[0]).not.toHaveProperty('shareCode');
    });

    test('a page that is not a number, or past the end', async () => {
        const { agent } = await owner();
        await many(agent, 2);

        expect((await agent.get(api).query({ page: 'two' })).body.data.page).toBe(1);
        expect((await agent.get(api).query({ page: -3 })).body.data.page).toBe(1);
        expect((await agent.get(api).query({ page: 9 })).body.data).toMatchObject({ page: 9, pages: 1, invoices: [] });
    });

    test('search looks in the number and the customer name, and takes the text literally', async () => {
        const { agent } = await owner();
        await create(agent, { customer: { name: 'Acme Traders' } });
        await create(agent, { customer: { name: 'Blue (Sky) Ltd.' } });
        await create(agent, { customer: { name: 'acme west' } });
        const found = async (search) => (await agent.get(api).query({ search })).body.data.invoices.map((invoice) => invoice.number).sort();

        expect(await found('ACME')).toEqual(['INV-0001', 'INV-0003']);
        expect(await found('inv-0002')).toEqual(['INV-0002']);
        expect(await found('(sky)')).toEqual(['INV-0002']);
        expect(await found('.*')).toEqual([]);
        expect(await found('  ')).toEqual(['INV-0001', 'INV-0002', 'INV-0003']);
        expect((await agent.get(api).query({ search: 's'.repeat(81) })).status).toBe(400);
    });

    test('each status filter, with overdue apart from sent', async () => {
        const { agent } = await owner();
        const past = { issueDate: addDays(today(), -30), dueDate: addDays(today(), -5) };
        const future = { issueDate: addDays(today(), -2), dueDate: addDays(today(), 12) };
        await create(agent, future);                                   // 1 draft
        const sent = await create(agent, future);                      // 2 sent
        const overdue = await create(agent, past);                     // 3 overdue
        const paid = await create(agent, past);                        // 4 paid
        await create(agent, past);                                     // 5 draft with a past due date
        for (const invoice of [sent, overdue, paid]) await setStatus(agent, invoice._id, { status: 'sent' });
        await setStatus(agent, paid._id, { status: 'paid' });
        const numbers = async (status) => (await agent.get(api).query({ status })).body.data.invoices.map((invoice) => invoice.number).sort();

        expect(await numbers('all')).toHaveLength(5);
        expect(await numbers(undefined)).toHaveLength(5);
        expect(await numbers('draft')).toEqual(['INV-0001', 'INV-0005']);
        expect(await numbers('sent')).toEqual(['INV-0002']);
        expect(await numbers('overdue')).toEqual(['INV-0003']);
        expect(await numbers('paid')).toEqual(['INV-0004']);
        expect((await agent.get(api).query({ status: 'late' })).status).toBe(400);
        expect((await agent.get(api).query({ status: 'overdue' })).body.data.invoices[0].overdue).toBe(true);
    });
});
