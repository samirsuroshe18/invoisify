import { jest } from '@jest/globals';

// files are never really stored in tests
const storeFile = jest.fn(async (file) => (file ? 'https://files.example/logo.png' : null));
jest.unstable_mockModule('../src/utils/uploads.js', () => ({ storeFile, uploadsEnabled: () => true }));

const request = (await import('supertest')).default;
const { default: app } = await import('../src/app.js');
const { User } = await import('../src/models/user.model.js');
const { Business } = await import('../src/models/business.model.js');
const { Invoice } = await import('../src/models/invoice.model.js');
const { Usage } = await import('../src/models/usage.model.js');
const { visitorOf } = await import('../src/utils/visitor.js');
const { today, addDays } = await import('../src/utils/businessDay.js');
const { totalsOf } = await import('../src/utils/totals.js');
const { default: mailSender } = await import('../src/utils/mailSender.js');
const { createUser, loggedIn, PASSWORD } = await import('./helpers.js');

const users = '/api/v1/users';
const invoices = '/api/v1/invoices';

const SETTINGS = ['ACCOUNT_RATE_LIMIT', 'ACCOUNT_EMAIL_RATE_LIMIT', 'RESEND_RATE_LIMIT', 'DAILY_MAIL_LIMIT', 'MAX_INVOICES', 'MAX_DEMO_INVOICES', 'BUSINESS_UTC_OFFSET_MINUTES', 'NODE_ENV_FOR_COOKIES'];
afterEach(() => {
    SETTINGS.forEach((name) => delete process.env[name]);
    storeFile.mockClear();
});

const owner = async (overrides = {}) => {
    const session = await loggedIn(overrides);
    await Business.create({ user: session.user._id, companyName: 'Northwind Studio' });
    return session;
};
const invoiceBody = (changes = {}) => ({
    customer: { name: 'Acme' }, issueDate: today(), dueDate: addDays(today(), 7), items: [{ description: 'Work', quantity: 1, rate: 100 }], ...changes,
});

describe('the session', () => {
    test('one cookie, httpOnly, that lasts as long as the login does', async () => {
        const user = await createUser();

        const res = await request(app).post(`${users}/login`).send({ email: user.email, password: PASSWORD });

        const cookies = res.headers['set-cookie'];
        expect(cookies).toHaveLength(1);
        expect(cookies[0]).toMatch(/^accessToken=/);
        expect(cookies[0]).toMatch(/HttpOnly/);
        expect(cookies[0]).toMatch(/SameSite=Lax/);
        expect(cookies[0]).toMatch(/Max-Age=604800/);
        expect(cookies[0]).not.toMatch(/Secure/);
        expect(res.headers['x-powered-by']).toBeUndefined();
    });

    test('nothing about a refresh token is kept', async () => {
        const user = await createUser();
        await request(app).post(`${users}/login`).send({ email: user.email, password: PASSWORD });

        expect((await User.findById(user._id)).toObject()).not.toHaveProperty('refreshToken');
    });
});

describe('who a visitor is', () => {
    const req = (forwarded) => ({ headers: { 'x-forwarded-for': forwarded }, ip: '198.51.100.9' });

    test('an IPv6 visitor is the network they are on, not one of its countless addresses', () => {
        const first = visitorOf(req('2001:db8:aaaa:bbbb:1:2:3:4'));

        expect(visitorOf(req('2001:db8:aaaa:bbbb:ffff:eeee:dddd:cccc'))).toBe(first);
        expect(visitorOf(req('2001:db8:aaaa:bbbb::1'))).toBe(first);
        expect(visitorOf(req('2001:db8:aaaa:cccc::1'))).not.toBe(first);
        expect(visitorOf(req('2001:db8::1'))).toBe(visitorOf(req('2001:db8:0:0:9::')));
        expect(visitorOf(req('203.0.113.7'))).toBe('203.0.113.7');
        expect(visitorOf(req('made up'))).toBe('198.51.100.9');
    });
});

describe('logging in and the limits', () => {
    const login = (email, password, address) => request(app).post(`${users}/login`)
        .set('X-Forwarded-For', `${address}, 198.51.100.50`).send({ email, password });

    test('a visitor who logs in correctly is never slowed down by it', async () => {
        process.env.ACCOUNT_RATE_LIMIT = '100';
        process.env.ACCOUNT_EMAIL_RATE_LIMIT = '3';
        const user = await createUser();

        for (let attempt = 0; attempt < 6; attempt += 1) {
            expect((await login(user.email, PASSWORD, '203.0.113.60')).status).toBe(200);
        }
    });

    test('someone guessing an account\'s password from one place does not lock its owner out', async () => {
        process.env.ACCOUNT_RATE_LIMIT = '100';
        const user = await createUser();

        const guesses = [];
        for (let attempt = 0; attempt < 12; attempt += 1) {
            guesses.push((await login(user.email, 'a-wrong-guess', '203.0.113.61')).status);
        }

        // ten wrong tries from one visitor, then that visitor is refused for this account
        expect(guesses.slice(0, 10).every((status) => status === 401)).toBe(true);
        expect(guesses.slice(10)).toEqual([429, 429]);
        // the owner, somewhere else, still gets in
        expect((await login(user.email, PASSWORD, '203.0.113.62')).status).toBe(200);
    });

    test('an unknown address costs as much time to refuse as a wrong password', async () => {
        const user = await createUser();
        const time = async (email) => {
            const started = process.hrtime.bigint();
            await request(app).post(`${users}/login`).send({ email, password: 'a-wrong-guess' });
            return Number(process.hrtime.bigint() - started) / 1e6;
        };
        await time(user.email);

        const known = await time(user.email);
        const unknown = await time('nobody@test.dev');

        // both ran the password check; without it an unknown address answers many times faster
        expect(unknown).toBeGreaterThan(known / 3);
    });
});

describe('verification mails', () => {
    test('a second link cannot be asked for within a minute', async () => {
        const { user, agent } = await loggedIn({ isVerified: false });

        expect((await agent.post(`${users}/resend-verification`)).status).toBe(200);
        const again = await agent.post(`${users}/resend-verification`);

        expect([again.status, again.body.message]).toEqual([429, 'A link was sent a moment ago. Check your inbox, or try again in a minute.']);

        // a minute later it works again
        await User.updateOne({ _id: user._id }, { verifyTokenExpiry: new Date(Date.now() + 9 * 60 * 1000 - 5000) });
        expect((await agent.post(`${users}/resend-verification`)).status).toBe(200);
    });

    test('an account can ask for only so many links, wherever the requests come from', async () => {
        process.env.ACCOUNT_RATE_LIMIT = '100';
        process.env.RESEND_RATE_LIMIT = '2';
        const { user, agent } = await loggedIn({ isVerified: false });
        const resend = async (address) => {
            await User.updateOne({ _id: user._id }, { $unset: { verifyTokenExpiry: 1 } });
            return (await agent.post(`${users}/resend-verification`).set('X-Forwarded-For', `${address}, 198.51.100.51`)).status;
        };

        expect([await resend('203.0.113.70'), await resend('203.0.113.71'), await resend('203.0.113.72')]).toEqual([200, 200, 429]);
    });
});

describe('the mail the site may send in a day', () => {
    test('once the day\'s allowance is used, no more mail is attempted', async () => {
        process.env.DAILY_MAIL_LIMIT = '2';
        const user = await createUser({ isVerified: false });

        expect(await mailSender(user.email, user._id, 'VERIFY')).toBeTruthy();
        expect(await mailSender(user.email, user._id, 'VERIFY')).toBeTruthy();
        expect(await mailSender(user.email, user._id, 'VERIFY')).toBeUndefined();
        expect((await Usage.findOne({ key: 'mail' })).count).toBe(2);
    });

    test('a sign-up that could not be mailed says so', async () => {
        process.env.DAILY_MAIL_LIMIT = '1';
        await request(app).post(`${users}/register`).send({ name: 'First', email: 'first@example.com', password: 'long-enough' });

        const res = await request(app).post(`${users}/register`).send({ name: 'Second', email: 'second@example.com', password: 'long-enough' });

        expect([res.status, res.body.message]).toEqual([201, 'Account created, but the verification email could not be sent. Log in and send it again.']);
    });
});

describe('how much an account can store', () => {
    test('an account has a limit of invoices; deleting makes room', async () => {
        process.env.MAX_INVOICES = '2';
        const { agent } = await owner();
        const first = await agent.post(invoices).send(invoiceBody());
        await agent.post(invoices).send(invoiceBody());

        const third = await agent.post(invoices).send(invoiceBody());
        const copy = await agent.post(`${invoices}/${first.body.data.invoice._id}/duplicate`);

        expect([third.status, third.body.message]).toEqual([409, 'You have reached the limit of 2 invoices. Delete one to make room.']);
        expect(copy.status).toBe(409);
        await agent.delete(`${invoices}/${first.body.data.invoice._id}`);
        expect((await agent.post(invoices).send(invoiceBody())).status).toBe(201);
    });

    test('the demo account has a smaller limit of its own', async () => {
        process.env.MAX_DEMO_INVOICES = '1';
        const { agent } = await owner({ isDemo: true });

        expect((await agent.post(invoices).send(invoiceBody())).status).toBe(201);
        expect((await agent.post(invoices).send(invoiceBody())).status).toBe(409);
    });
});

describe('logos', () => {
    const save = (agent, bytes, contentType = 'image/png', filename = 'logo.png') =>
        agent.put('/api/v1/business').field('companyName', 'Northwind').attach('logo', bytes, { filename, contentType });
    const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(100)]);
    const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(100)]);
    const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP'), Buffer.alloc(100)]);

    test('the three kinds of image are recognised by their content', async () => {
        const { agent } = await loggedIn();

        for (const [bytes, type] of [[png, 'image/png'], [jpeg, 'image/jpeg'], [webp, 'image/webp']]) {
            expect((await save(agent, bytes, type)).status).toBe(200);
        }
        expect(storeFile).toHaveBeenCalledTimes(3);
    });

    test('a file that only claims to be an image is refused', async () => {
        const { agent } = await loggedIn();

        for (const bytes of [Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'), Buffer.from('<html><body>hi</body></html>'), Buffer.from('%PDF-1.7'), Buffer.alloc(50)]) {
            const res = await save(agent, bytes);
            expect([res.status, res.body.message]).toEqual([400, 'The logo must be a JPEG, PNG or WebP image']);
        }
        expect(storeFile).not.toHaveBeenCalled();
        expect(await Business.countDocuments()).toBe(0);
    });
});

describe('invoices at the edges', () => {
    test('a page number beyond reason is page 1, not an error', async () => {
        const { agent } = await owner();
        await agent.post(invoices).send(invoiceBody());

        for (const page of ['1e300', '99999999999', '1.5', 'NaN']) {
            const res = await agent.get(invoices).query({ page });
            expect(res.status).toBe(200);
            expect(res.body.data.page).toBe(1);
        }
    });

    test('an invoice cannot be paid on a day that has not come', async () => {
        const { agent } = await owner();
        const { invoice } = (await agent.post(invoices).send(invoiceBody())).body.data;
        await agent.patch(`${invoices}/${invoice._id}/status`).send({ status: 'sent' });

        const future = await agent.patch(`${invoices}/${invoice._id}/status`).send({ status: 'paid', paidDate: addDays(today(), 2) });
        // one day ahead is allowed: where the visitor is, it may be tomorrow already
        const tomorrow = await agent.patch(`${invoices}/${invoice._id}/status`).send({ status: 'paid', paidDate: addDays(today(), 1) });

        expect([future.status, future.body.message]).toEqual([400, 'The paid date cannot be in the future']);
        expect(tomorrow.status).toBe(200);
    });

    test('a full discount on the largest invoice is refused, not stored inexactly', () => {
        const items = Array.from({ length: 50 }, () => ({ description: 'a', quantity: 100000, rate: 100000000 }));

        expect(() => totalsOf({ items, discountPercent: 100, taxPercent: 0 })).toThrow('The invoice total is too large');
    });

    test('two first saves of a profile at once both succeed', async () => {
        await Business.init();
        const { user, agent } = await loggedIn();

        const answers = await Promise.all([
            agent.put('/api/v1/business').send({ companyName: 'One' }),
            agent.put('/api/v1/business').send({ companyName: 'Two' }),
        ]);

        expect(answers.map((res) => res.status)).toEqual([200, 200]);
        expect(await Business.countDocuments({ user: user._id })).toBe(1);
    });
});

describe('the business day', () => {
    test('today is the day in the business\'s time zone, India unless set', () => {
        // 19:00 UTC on the 12th is 00:30 on the 13th in India
        expect(today(new Date('2026-11-12T19:00:00Z'))).toBe('2026-11-13');
        expect(today(new Date('2026-11-12T18:29:59Z'))).toBe('2026-11-12');

        process.env.BUSINESS_UTC_OFFSET_MINUTES = '-300';
        expect(today(new Date('2026-11-12T04:59:00Z'))).toBe('2026-11-11');

        process.env.BUSINESS_UTC_OFFSET_MINUTES = '';
        expect(today(new Date('2026-11-12T19:00:00Z'))).toBe('2026-11-13');
    });

    test('an invoice becomes overdue when the business\'s day has passed its due date', async () => {
        const { user, agent } = await owner();
        await Invoice.create({ user: user._id, number: 'INV-0001', customer: { name: 'A' }, issueDate: addDays(today(), -9), dueDate: addDays(today(), -1), currency: 'INR', status: 'sent', items: [], total: 0 });
        await Invoice.create({ user: user._id, number: 'INV-0002', customer: { name: 'B' }, issueDate: addDays(today(), -9), dueDate: today(), currency: 'INR', status: 'sent', items: [], total: 0 });

        const list = (await agent.get(invoices).query({ status: 'overdue' })).body.data.invoices;

        expect(list.map((invoice) => invoice.number)).toEqual(['INV-0001']);
    });
});
