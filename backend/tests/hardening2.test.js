import { jest } from '@jest/globals';

// the provider is replaced: it accepts or refuses as each test says
const provider = jest.fn(async () => ({ accepted: true }));
jest.unstable_mockModule('nodemailer', () => ({ createTransport: () => ({ sendMail: provider }) }));

const request = (await import('supertest')).default;
const { default: app } = await import('../src/app.js');
const { Invoice } = await import('../src/models/invoice.model.js');
const { Business } = await import('../src/models/business.model.js');
const { Usage } = await import('../src/models/usage.model.js');
const { Review } = await import('../src/models/review.model.js');
const { invoiceMail, sendInvoiceMail } = await import('../src/utils/mailSender.js');
const { offensiveWord } = await import('../src/utils/language.js');
const { addDays, today } = await import('../src/utils/businessDay.js');
const { loggedIn } = await import('./helpers.js');

const api = '/api/v1/invoices';
const open = '/api/v1/public/invoices';

const owner = async (overrides = {}) => {
    const session = await loggedIn(overrides);
    await Business.create({ user: session.user._id, companyName: 'Northwind Studio', email: 'hello@northwind.test' });
    return session;
};
const body = (changes = {}) => ({
    customer: { name: 'Acme Traders', email: 'accounts@acme.test' }, issueDate: today(), dueDate: addDays(today(), 14),
    items: [{ description: 'Design', quantity: 1, rate: 500 }], taxPercent: 0, ...changes,
});
const create = async (agent, changes) => (await agent.post(api).send(body(changes))).body.data.invoice;
const usage = async (key) => (await Usage.findOne({ key }))?.count ?? 0;
const mail = (changes = {}) => ({
    to: 'accounts@acme.test', from: 'Northwind Studio', replyTo: 'hello@northwind.test', customerName: 'Acme', number: 'INV-0001',
    total: 100, currency: 'INR', dueDate: '2026-03-15', link: 'http://localhost:5178/i/0123456789abcdef0123456789abcdef', ...changes,
});

beforeAll(async () => {
    await Promise.all([Invoice.init(), Usage.init(), Review.init()]);
});

beforeEach(() => {
    provider.mockReset();
    provider.mockResolvedValue({ accepted: true });
});

afterEach(() => {
    ['DAILY_MAIL_LIMIT', 'DAILY_INVOICE_MAIL_LIMIT', 'DAILY_SEND_LIMIT', 'FRONTEND_URL_OVERRIDE'].forEach((name) => delete process.env[name]);
    process.env.FRONTEND_URL = 'http://localhost:5178';
});

describe('the site\'s mail for the day', () => {
    test('a mail the provider refused is not counted for the site, and is counted for the sender', async () => {
        const { user, agent } = await owner();
        const invoice = await create(agent);
        provider.mockRejectedValue(new Error('provider says no'));

        const res = await agent.post(`${api}/${invoice._id}/send`);

        expect([res.status, res.body.message]).toEqual([502, 'The email could not be sent. The invoice was not changed.']);
        expect(await usage('mail')).toBe(0);
        expect(await usage('invoice-mail')).toBe(0);
        // a send that fails still uses one of the account's sends, so failing is not a free loop
        expect(await usage(`send:${user._id}`)).toBe(1);
        expect((await Invoice.findById(invoice._id)).status).toBe('draft');
    });

    test('invoice mail stops before the day\'s mail is used up, so sign-ups and resets still get theirs', async () => {
        process.env.DAILY_INVOICE_MAIL_LIMIT = '2';

        expect(await sendInvoiceMail(mail())).toBe('sent');
        expect(await sendInvoiceMail(mail())).toBe('sent');
        expect(await sendInvoiceMail(mail())).toBe('limit');
        expect(provider).toHaveBeenCalledTimes(2);
        expect(await usage('mail')).toBe(2);
    });

    test('the sender is told when the site has sent its invoice mail for the day', async () => {
        process.env.DAILY_INVOICE_MAIL_LIMIT = '1';
        const { user, agent } = await owner();
        const invoice = await create(agent);
        await agent.post(`${api}/${invoice._id}/send`);

        const res = await agent.post(`${api}/${invoice._id}/send`);

        expect([res.status, res.body.message]).toEqual([429, 'Invoisify has sent all the invoice emails it can today. Try again tomorrow, or copy the link and send it yourself.']);
        // that was not the sender's doing, so it is not counted against them
        expect(await usage(`send:${user._id}`)).toBe(1);
    });

    test('a customer address with characters a mail address cannot have is refused when the invoice is written', async () => {
        const { agent } = await owner();

        for (const email of ['a@b.c,d@e.f', 'a(@b.c', 'a@b.c;d', '"a"@b.c', 'a<b@c.d>']) {
            const res = await agent.post(api).send(body({ customer: { name: 'Acme', email } }));
            expect([res.status, res.body.message]).toEqual([400, 'Enter a valid customer email address']);
        }
    });
});

describe('the mail itself', () => {
    test('says that Invoisify only delivers it, and does not turn a typed web address into one', () => {
        const built = invoiceMail(mail({ from: 'www.pay-now.example Billing', customerName: 'you. Visit https://evil.example now' }));

        expect(built.html).toMatch(/does not check who the sender is/);
        expect(built.html).not.toMatch(/https:\/\/evil\.example|www\.pay-now/);
        expect(built.senderName).not.toMatch(/www\./);
    });

    test('a web address with a trailing slash still gives a clean link', async () => {
        process.env.FRONTEND_URL = 'https://invoisify.example/';
        const { agent } = await owner();
        const invoice = await create(agent);

        const res = await agent.post(`${api}/${invoice._id}/send`);

        expect(res.body.data.link).toBe(`https://invoisify.example/i/${res.body.data.code}`);
        expect(provider.mock.calls[0][0].html).toContain(`href="https://invoisify.example/i/${res.body.data.code}"`);
    });
});

describe('links and drafts', () => {
    test('moving an invoice back to draft ends its link for good', async () => {
        const { agent } = await owner();
        const invoice = await create(agent);
        const { code } = (await agent.post(`${api}/${invoice._id}/send`)).body.data;

        await agent.patch(`${api}/${invoice._id}/status`).send({ status: 'draft' });
        await agent.patch(`${api}/${invoice._id}/status`).send({ status: 'sent' });

        expect((await request(app).get(`${open}/${code}`)).status).toBe(404);
        expect((await agent.get(`${api}/${invoice._id}`)).body.data.invoice.shared).toBe(false);
        expect((await agent.post(`${api}/${invoice._id}/share`)).body.data.code).not.toBe(code);
    });

    test('a paid invoice can be shared', async () => {
        const { agent } = await owner();
        const invoice = await create(agent);
        await agent.patch(`${api}/${invoice._id}/status`).send({ status: 'sent' });
        await agent.patch(`${api}/${invoice._id}/status`).send({ status: 'paid' });

        const res = await agent.post(`${api}/${invoice._id}/share`);

        expect(res.status).toBe(200);
        expect((await request(app).get(`${open}/${res.body.data.code}`)).body.data.invoice.status).toBe('paid');
    });

    test('an invoice deleted while it is being sent is answered, not a server error', async () => {
        const { agent } = await owner();
        const invoice = await create(agent);
        provider.mockImplementationOnce(async () => {
            await Invoice.deleteOne({ _id: invoice._id });
            return { accepted: true };
        });

        const res = await agent.post(`${api}/${invoice._id}/send`);

        expect([res.status, res.body.message]).toEqual([409, 'The invoice was changed in the meantime. Open it again.']);
    });
});

describe('the public page', () => {
    test('is never kept by a cache, and says when the invoice is from the demo account', async () => {
        const real = await owner();
        const demo = await owner({ isDemo: true });
        const realCode = (await real.agent.post(`${api}/${(await create(real.agent))._id}/send`)).body.data.code;
        const demoCode = (await demo.agent.post(`${api}/${(await create(demo.agent))._id}/send`)).body.data.code;

        const fromReal = await request(app).get(`${open}/${realCode}`);
        const fromDemo = await request(app).get(`${open}/${demoCode}`);

        expect(fromReal.headers['cache-control']).toBe('no-store');
        expect(fromReal.body.data.invoice.demo).toBe(false);
        expect(fromDemo.body.data.invoice.demo).toBe(true);
    });

    test('answers behind a login are not kept by a cache either', async () => {
        const { agent } = await owner();

        expect((await agent.get(api)).headers['cache-control']).toBe('no-store');
        expect((await agent.get('/api/v1/users/me')).headers['cache-control']).toBe('no-store');
    });
});

describe('reviews', () => {
    const mine = '/api/v1/reviews/mine';

    test('a review is not shown under a name that is offensive', async () => {
        const { agent } = await loggedIn({ name: 'Total Asshole' });

        const res = await agent.put(mine).send({ rating: 5, comment: 'Great.' });

        expect([res.status, res.body.message]).toEqual([400, 'Your account name cannot be shown with a review']);
        expect(await Review.countDocuments()).toBe(0);
    });

    test('the refusal names the word, and ordinary words are not refused', async () => {
        const { agent } = await loggedIn();

        const res = await agent.put(mine).send({ rating: 1, comment: 'What a load of Shit.' });
        expect([res.status, res.body.message]).toEqual([400, 'Please keep the review free of offensive language ("Shit")']);

        for (const fine of ['Bloody good tool.', 'Dick Smith recommended it.', 'Tit for tat, it pays off.', 'A pawn shop could use this.', 'The assessment is fair.', 'No bum notes, no screwing around.']) {
            expect(offensiveWord(fine)).toBeNull();
        }
    });

    test('a word spelled out with dots or spaces is still the word', () => {
        expect(offensiveWord('this is s.h.i.t really')).not.toBeNull();
        expect(offensiveWord('s h i t')).not.toBeNull();
        expect(offensiveWord('a b c d e f g')).toBeNull();
        expect(offensiveWord('I paid 3 invoices in a day')).toBeNull();
    });

    test('a comment is not stretched with empty lines', async () => {
        const { agent } = await loggedIn();

        await agent.put(mine).send({ rating: 5, comment: `First line.\n\n\n\n\n\n\nSecond line.\n   \n\n` });

        expect((await Review.findOne()).comment).toBe('First line.\n\nSecond line.');
    });

    test('the list is the same for a short while, and fresh after a change', async () => {
        const { agent } = await loggedIn({ name: 'Asha Rao' });
        expect((await request(app).get('/api/v1/reviews')).body.data.count).toBe(0);

        await agent.put(mine).send({ rating: 5, comment: 'Great.' });

        expect((await request(app).get('/api/v1/reviews')).body.data.count).toBe(1);
    });
});

describe('the dashboard\'s counts', () => {
    test('are of all invoices, whatever their currency, like the list they lead to', async () => {
        const { user, agent } = await loggedIn();
        const invoiceOf = (number, changes) => Invoice.create({ user: user._id, number, customer: { name: 'A' }, issueDate: today(), dueDate: addDays(today(), 7), currency: 'INR', status: 'sent', items: [], total: 10, ...changes });
        await invoiceOf('INV-0001', {});
        await invoiceOf('INV-0002', { currency: 'USD' });
        await invoiceOf('INV-0003', { currency: 'USD', status: 'draft' });

        const { data } = (await agent.get('/api/v1/dashboard')).body;

        expect(data.counts).toEqual({ draft: 1, sent: 2, overdue: 0, paid: 0 });
        expect(data.figures.INR).not.toHaveProperty('counts');
        expect((await agent.get(api).query({ status: 'sent' })).body.data.total).toBe(data.counts.sent);
    });
});
