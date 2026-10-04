import { jest } from '@jest/globals';

// no real email in tests; what would have been sent is looked at instead
const sendInvoiceMail = jest.fn(async () => true);
jest.unstable_mockModule('../src/utils/mailSender.js', () => ({ default: jest.fn(async () => ({ sent: true })), sendMail: jest.fn(async () => true), sendInvoiceMail }));

const request = (await import('supertest')).default;
const { default: app } = await import('../src/app.js');
const { Invoice } = await import('../src/models/invoice.model.js');
const { Business } = await import('../src/models/business.model.js');
const { Usage } = await import('../src/models/usage.model.js');
const { addDays, today } = await import('../src/utils/businessDay.js');
const { loggedIn } = await import('./helpers.js');

const api = '/api/v1/invoices';
const open = '/api/v1/public/invoices';

const owner = async (overrides = {}) => {
    const session = await loggedIn(overrides);
    await Business.create({ user: session.user._id, companyName: 'Northwind Studio', email: 'hello@northwind.test', paymentDetails: 'UPI: northwind@upi' });
    return session;
};
const body = (changes = {}) => ({
    customer: { name: 'Acme Traders', email: 'accounts@acme.test', address: '4 Market Street' },
    issueDate: today(), dueDate: addDays(today(), 14), items: [{ description: 'Design', quantity: 2, rate: 500 }], taxPercent: 0, notes: 'Thank you.', ...changes,
});
const create = async (agent, changes) => (await agent.post(api).send(body(changes))).body.data.invoice;
const sent = async (agent, changes) => {
    const invoice = await create(agent, changes);
    await agent.patch(`${api}/${invoice._id}/status`).send({ status: 'sent' });
    return invoice;
};

beforeAll(async () => {
    await Promise.all([Invoice.init(), Usage.init()]);
});

beforeEach(() => {
    sendInvoiceMail.mockClear();
    sendInvoiceMail.mockResolvedValue(true);
});

afterEach(() => {
    delete process.env.DAILY_SEND_LIMIT;
});

describe('sending by email', () => {
    test('a draft is mailed to the customer with a link to its page and becomes sent', async () => {
        const { agent } = await owner();
        const invoice = await create(agent);

        const res = await agent.post(`${api}/${invoice._id}/send`);

        expect([res.status, res.body.message]).toEqual([200, 'Invoice INV-0001 sent to accounts@acme.test']);
        expect(res.body.data.invoice).toMatchObject({ status: 'sent', shared: true });
        expect(res.body.data.code).toMatch(/^[0-9a-f]{32}$/);
        expect(sendInvoiceMail).toHaveBeenCalledTimes(1);
        const mail = sendInvoiceMail.mock.calls[0][0];
        expect(mail).toMatchObject({ to: 'accounts@acme.test', from: 'Northwind Studio', replyTo: 'hello@northwind.test', number: 'INV-0001', total: 1000, currency: 'INR', dueDate: addDays(today(), 14) });
        expect(mail.link).toBe(`http://localhost:5178/i/${res.body.data.code}`);
        expect((await Invoice.findById(invoice._id)).sentAt).toBeInstanceOf(Date);
    });

    test('a sent invoice can be sent again, with the same link', async () => {
        const { agent } = await owner();
        const invoice = await create(agent);
        const first = await agent.post(`${api}/${invoice._id}/send`);

        const again = await agent.post(`${api}/${invoice._id}/send`);

        expect(again.status).toBe(200);
        expect(again.body.data.code).toBe(first.body.data.code);
        expect(sendInvoiceMail).toHaveBeenCalledTimes(2);
    });

    test('needs the customer\'s address, and is not for a paid invoice', async () => {
        const { agent } = await owner();
        const noAddress = await create(agent, { customer: { name: 'Acme' } });
        const paid = await sent(agent);
        await agent.patch(`${api}/${paid._id}/status`).send({ status: 'paid' });

        const first = await agent.post(`${api}/${noAddress._id}/send`);
        const second = await agent.post(`${api}/${paid._id}/send`);

        expect([first.status, first.body.message]).toEqual([400, "Add the customer's email address before sending"]);
        expect([second.status, second.body.message]).toEqual([409, 'A paid invoice is not sent again']);
        expect(sendInvoiceMail).not.toHaveBeenCalled();
    });

    test('a mail that could not be sent leaves the invoice and the count as they were', async () => {
        const { user, agent } = await owner();
        const invoice = await create(agent);
        sendInvoiceMail.mockResolvedValueOnce(false);

        const res = await agent.post(`${api}/${invoice._id}/send`);

        expect([res.status, res.body.message]).toEqual([502, 'The email could not be sent. The invoice was not changed.']);
        const saved = await Invoice.findById(invoice._id);
        expect([saved.status, saved.sentAt]).toEqual(['draft', undefined]);
        expect((await Usage.findOne({ key: `send:${user._id}` })).count).toBe(0);
    });

    test('an account sends only so many a day; another account is not affected', async () => {
        process.env.DAILY_SEND_LIMIT = '2';
        const mine = await owner();
        const other = await owner();
        const invoice = await create(mine.agent);

        await mine.agent.post(`${api}/${invoice._id}/send`);
        await mine.agent.post(`${api}/${invoice._id}/send`);
        const third = await mine.agent.post(`${api}/${invoice._id}/send`);

        expect([third.status, third.body.message]).toEqual([429, "You have sent today's 2 invoices by email. Try again tomorrow."]);
        expect(sendInvoiceMail).toHaveBeenCalledTimes(2);
        expect((await other.agent.post(`${api}/${(await create(other.agent))._id}/send`)).status).toBe(200);
    });

    test('sends that arrive together cannot pass the limit', async () => {
        process.env.DAILY_SEND_LIMIT = '2';
        const { agent } = await owner();
        const invoice = await create(agent);

        const answers = await Promise.all(Array.from({ length: 5 }, () => agent.post(`${api}/${invoice._id}/send`)));

        expect(answers.filter((res) => res.status === 200)).toHaveLength(2);
        expect(sendInvoiceMail).toHaveBeenCalledTimes(2);
        expect((await Invoice.findById(invoice._id)).status).toBe('sent');
    });

    test('the demo account\'s sends are simulated: sent, shared, and no mail', async () => {
        const { agent } = await owner({ isDemo: true });
        const invoice = await create(agent);

        const res = await agent.post(`${api}/${invoice._id}/send`);

        expect([res.status, res.body.message]).toEqual([200, 'Invoice INV-0001 marked as sent. The demo account sends no email.']);
        expect(res.body.data.invoice).toMatchObject({ status: 'sent', shared: true });
        expect(sendInvoiceMail).not.toHaveBeenCalled();
    });

    test('is closed to visitors, unverified accounts and other users', async () => {
        const mine = await owner();
        const invoice = await create(mine.agent);
        const other = await owner();
        const unverified = await owner({ isVerified: false });

        expect((await request(app).post(`${api}/${invoice._id}/send`)).status).toBe(401);
        expect((await other.agent.post(`${api}/${invoice._id}/send`)).status).toBe(404);
        expect((await unverified.agent.post(`${api}/${invoice._id}/send`)).status).toBe(403);
        expect(sendInvoiceMail).not.toHaveBeenCalled();
    });
});

describe('sharing by link', () => {
    test('a sent invoice gets a link once; asking again gives the same one', async () => {
        const { agent } = await owner();
        const invoice = await sent(agent);

        const first = await agent.post(`${api}/${invoice._id}/share`);
        const second = await agent.post(`${api}/${invoice._id}/share`);

        expect(first.status).toBe(200);
        expect(first.body.data.code).toMatch(/^[0-9a-f]{32}$/);
        expect(second.body.data.code).toBe(first.body.data.code);
        expect((await agent.get(`${api}/${invoice._id}`)).body.data.invoice.shared).toBe(true);
        expect((await agent.get(`${api}/${invoice._id}`)).body.data.invoice).not.toHaveProperty('shareCode');
    });

    test('a draft is not shared', async () => {
        const { agent } = await owner();
        const invoice = await create(agent);

        const res = await agent.post(`${api}/${invoice._id}/share`);

        expect([res.status, res.body.message]).toEqual([409, 'Mark the invoice as sent before sharing it']);
    });

    test('stopping makes the old link dead, and a new share gives a new one', async () => {
        const { agent } = await owner();
        const invoice = await sent(agent);
        const { code } = (await agent.post(`${api}/${invoice._id}/share`)).body.data;

        const stopped = await agent.delete(`${api}/${invoice._id}/share`);

        expect([stopped.status, stopped.body.message]).toEqual([200, 'The link no longer works']);
        expect((await request(app).get(`${open}/${code}`)).status).toBe(404);
        expect((await agent.post(`${api}/${invoice._id}/share`)).body.data.code).not.toBe(code);
    });

    test('is closed to visitors, unverified accounts and other users', async () => {
        const mine = await owner();
        const invoice = await sent(mine.agent);
        const other = await owner();
        const unverified = await owner({ isVerified: false });

        for (const method of ['post', 'delete']) {
            expect((await request(app)[method](`${api}/${invoice._id}/share`)).status).toBe(401);
            expect((await other.agent[method](`${api}/${invoice._id}/share`)).status).toBe(404);
            expect((await unverified.agent[method](`${api}/${invoice._id}/share`)).status).toBe(403);
        }
        expect((await Invoice.findById(invoice._id)).shareCode).toBeUndefined();
    });
});

describe('the public page', () => {
    test('shows the invoice to anyone with the link, and nothing else about the user', async () => {
        const { agent } = await owner();
        const invoice = await sent(agent);
        const { code } = (await agent.post(`${api}/${invoice._id}/share`)).body.data;

        const res = await request(app).get(`${open}/${code}`);

        expect(res.status).toBe(200);
        expect(res.body.data.invoice).toMatchObject({
            number: 'INV-0001', status: 'sent', overdue: false, total: 1000, currency: 'INR', notes: 'Thank you.',
            business: { companyName: 'Northwind Studio', paymentDetails: 'UPI: northwind@upi' },
            customer: { name: 'Acme Traders', address: '4 Market Street' },
        });
        expect(res.body.data.invoice.items).toHaveLength(1);
        for (const hidden of ['_id', 'user', 'shareCode', 'isDemo', 'shared', 'createdAt', 'updatedAt', 'sentAt', '__v']) {
            expect(res.body.data.invoice).not.toHaveProperty(hidden);
        }
        expect(res.body.data.invoice.customer).not.toHaveProperty('email');
        expect(JSON.stringify(res.body)).not.toMatch(/accounts@acme\.test/);
    });

    test('follows the invoice: paid shows as paid, back to draft hides it', async () => {
        const { agent } = await owner();
        const invoice = await sent(agent);
        const { code } = (await agent.post(`${api}/${invoice._id}/share`)).body.data;

        await agent.patch(`${api}/${invoice._id}/status`).send({ status: 'paid' });
        expect((await request(app).get(`${open}/${code}`)).body.data.invoice.status).toBe('paid');

        await agent.patch(`${api}/${invoice._id}/status`).send({ status: 'sent' });
        await agent.patch(`${api}/${invoice._id}/status`).send({ status: 'draft' });
        const hidden = await request(app).get(`${open}/${code}`);
        expect([hidden.status, hidden.body.message]).toEqual([404, 'This invoice is not available']);
    });

    test('a code that is wrong, malformed or an operator finds nothing', async () => {
        const { agent } = await owner();
        await sent(agent);
        const unshared = await sent(agent);
        expect((await Invoice.findById(unshared._id)).shareCode).toBeUndefined();

        for (const code of ['0'.repeat(32), 'nope', 'undefined', 'null', '%7B%22%24ne%22%3Anull%7D', 'A'.repeat(32), '0'.repeat(31)]) {
            const res = await request(app).get(`${open}/${code}`);
            expect([res.status, res.body.message]).toEqual([404, 'This invoice is not available']);
        }
        expect((await request(app).get(open).query({ code: { $ne: null } })).status).toBe(404);
    });

    test('deleting the invoice takes its page away', async () => {
        const { agent } = await owner();
        const invoice = await sent(agent);
        const { code } = (await agent.post(`${api}/${invoice._id}/share`)).body.data;

        await agent.delete(`${api}/${invoice._id}`);

        expect((await request(app).get(`${open}/${code}`)).status).toBe(404);
    });
});
