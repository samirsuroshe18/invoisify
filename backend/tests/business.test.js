import { jest } from '@jest/globals';

// files are never really stored in tests
const storeFile = jest.fn(async (file) => (file ? 'https://files.example/logo.png' : null));
jest.unstable_mockModule('../src/utils/uploads.js', () => ({ storeFile, uploadsEnabled: () => true }));

const request = (await import('supertest')).default;
const { default: app } = await import('../src/app.js');
const { Business } = await import('../src/models/business.model.js');
const { loggedIn } = await import('./helpers.js');

const api = '/api/v1/business';
const good = { companyName: 'Northwind Studio', email: 'hello@northwind.test', address: '12 Lake Road, Pune' };
const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(300)]);
const withLogo = (agent, fields = good, file = { filename: 'logo.png', contentType: 'image/png' }, bytes = png) => {
    const req = agent.put(api);
    Object.entries(fields).forEach(([key, value]) => req.field(key, value));
    return req.attach('logo', bytes, file);
};

beforeEach(() => storeFile.mockClear());

describe('reading the profile', () => {
    test('needs a login', async () => {
        expect((await request(app).get(api)).status).toBe(401);
        expect((await request(app).put(api).send(good)).status).toBe(401);
    });

    test('before anything was saved, the defaults', async () => {
        const { agent } = await loggedIn();

        const res = await agent.get(api);

        expect(res.status).toBe(200);
        expect(res.body.data.business).toEqual({
            companyName: '', email: '', phone: '', address: '', logoUrl: '', accentColor: '#2563eb',
            currency: 'INR', taxPercent: 0, paymentDetails: '', complete: false,
        });
    });

    test('a user sees their own profile and never another one', async () => {
        const mine = await loggedIn();
        const theirs = await loggedIn();
        await mine.agent.put(api).send(good);

        expect((await mine.agent.get(api)).body.data.business).toMatchObject({ companyName: 'Northwind Studio', complete: true });
        expect((await theirs.agent.get(api)).body.data.business).toMatchObject({ companyName: '', complete: false });
    });
});

describe('saving the profile', () => {
    test('saves every field, trimmed, and saving again replaces it', async () => {
        const { user, agent } = await loggedIn();

        await agent.put(api).send(good);
        const res = await agent.put(api).send({
            companyName: '  Northwind Design  ', email: 'Billing@Northwind.test', phone: '+91 98000 00000', address: 'Pune',
            accentColor: '#0F766E', currency: 'USD', taxPercent: '12.5', paymentDetails: 'UPI: northwind@upi',
        });

        expect([res.status, res.body.message]).toEqual([200, 'Business profile saved']);
        expect(res.body.data.business).toEqual({
            companyName: 'Northwind Design', email: 'billing@northwind.test', phone: '+91 98000 00000', address: 'Pune',
            logoUrl: '', accentColor: '#0f766e', currency: 'USD', taxPercent: 12.5, paymentDetails: 'UPI: northwind@upi', complete: true,
        });
        expect(await Business.countDocuments({ user: user._id })).toBe(1);
    });

    test('each rule is named in its message', async () => {
        const { agent } = await loggedIn();
        const save = async (changes) => (await agent.put(api).send({ ...good, ...changes })).body.message;

        expect(await save({ companyName: '' })).toBe('Company name is required');
        expect(await save({ companyName: 'c'.repeat(121) })).toBe('Company name must be at most 120 characters');
        expect(await save({ email: 'not-an-address' })).toBe('Enter a valid email address');
        expect(await save({ address: 'a'.repeat(301) })).toBe('Address must be at most 300 characters');
        expect(await save({ accentColor: 'blue' })).toBe('Accent colour must look like #2563eb');
        expect(await save({ accentColor: '#12345' })).toBe('Accent colour must look like #2563eb');
        expect(await save({ currency: 'YEN' })).toBe('Currency must be one of: INR, USD, EUR, GBP');
        expect(await save({ taxPercent: '101' })).toBe('Default tax rate must be between 0 and 100 with at most two decimals');
        expect(await save({ paymentDetails: 'p'.repeat(501) })).toBe('Payment details must be at most 500 characters');
        expect(await save({ companyName: { $gt: '' } })).toBe('Company name must be text');
        expect(await Business.countDocuments()).toBe(0);
    });

    test('the user, the logo address and other fields cannot be set from the form', async () => {
        const mine = await loggedIn();
        const other = await loggedIn();

        await mine.agent.put(api).send({ ...good, user: String(other.user._id), logoUrl: 'https://evil.example/x.png', complete: false, _id: '507f1f77bcf86cd799439011' });

        const saved = await Business.findOne();
        expect(String(saved.user)).toBe(String(mine.user._id));
        expect(saved.logoUrl).toBeUndefined();
    });

    test('an unverified account can read and cannot save', async () => {
        const { agent } = await loggedIn({ isVerified: false });

        expect((await agent.get(api)).status).toBe(200);
        const res = await agent.put(api).send(good);
        expect([res.status, res.body.message]).toEqual([403, 'Verify your email to do this']);
    });
});

describe('the logo', () => {
    test('is stored once the fields were accepted', async () => {
        const { agent } = await loggedIn();

        const res = await withLogo(agent);

        expect(res.status).toBe(200);
        expect(res.body.data.business.logoUrl).toBe('https://files.example/logo.png');
        expect(storeFile.mock.calls[0][1]).toBe('logos');
    });

    test('is not stored when the fields are refused', async () => {
        const { agent } = await loggedIn();

        const res = await withLogo(agent, { ...good, companyName: '' });

        expect(res.status).toBe(400);
        expect(storeFile).not.toHaveBeenCalled();
    });

    test('is kept when the profile is saved again without one, and can be removed', async () => {
        const { agent } = await loggedIn();
        await withLogo(agent);

        const kept = await agent.put(api).send({ ...good, companyName: 'Renamed' });
        const removed = await agent.put(api).send({ ...good, removeLogo: true });

        expect(kept.body.data.business).toMatchObject({ companyName: 'Renamed', logoUrl: 'https://files.example/logo.png' });
        expect(removed.body.data.business.logoUrl).toBe('');
    });

    test('must be an image of at most 1 MB', async () => {
        const { agent } = await loggedIn();

        const pdf = await withLogo(agent, good, { filename: 'logo.pdf', contentType: 'application/pdf' });
        const large = await withLogo(agent, good, { filename: 'logo.png', contentType: 'image/png' }, Buffer.concat([png, Buffer.alloc(1024 * 1024)]));

        expect([pdf.status, pdf.body.message]).toEqual([400, 'The logo must be a JPEG, PNG or WebP image']);
        expect([large.status, large.body.message]).toEqual([400, 'The logo must be 1 MB or smaller']);
        expect(await Business.countDocuments()).toBe(0);
    });

    test('a logo that could not be stored does not lose the profile', async () => {
        const { agent } = await loggedIn();
        storeFile.mockRejectedValueOnce(new Error('store down'));

        const res = await withLogo(agent);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Business profile saved, but the logo could not be stored');
        expect(res.body.data.business).toMatchObject({ companyName: 'Northwind Studio', logoUrl: '' });
    });

    test('the demo account saves its profile, but no file is stored for it', async () => {
        const { agent } = await loggedIn({ isDemo: true });

        const res = await withLogo(agent);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Business profile saved. Logos are not stored for the demo account.');
        expect(storeFile).not.toHaveBeenCalled();
    });
});
