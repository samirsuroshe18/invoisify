import request from 'supertest';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Business } from '../src/models/business.model.js';
import { Invoice } from '../src/models/invoice.model.js';
import { Counter } from '../src/models/counter.model.js';
import { rebuildDemo, startDemo } from '../src/scripts/demoData.js';
import { DEMO_EMAIL, DEMO_PASSWORD } from '../src/utils/demo.js';
import { addDays, today } from '../src/utils/businessDay.js';
import { totalsOf } from '../src/utils/totals.js';
import { loggedIn } from './helpers.js';

const demoAgent = async () => {
    const agent = request.agent(app);
    await agent.post('/api/v1/users/demo-login');
    return agent;
};

test('the demo account has a business and twelve invoices in every state', async () => {
    await rebuildDemo();

    const demo = await User.findOne({ email: DEMO_EMAIL });
    expect(demo).toMatchObject({ isDemo: true, isVerified: true });
    expect(await Business.findOne({ user: demo._id })).toMatchObject({ companyName: 'Northwind Studio', currency: 'INR', taxPercent: 18 });

    const invoices = await Invoice.find({ user: demo._id }).sort({ number: 1 });
    expect(invoices.map((invoice) => invoice.number)).toEqual(Array.from({ length: 12 }, (_, index) => `INV-${String(index + 1).padStart(4, '0')}`));
    expect(invoices.every((invoice) => invoice.isDemo)).toBe(true);
    const count = (status) => invoices.filter((invoice) => invoice.status === status).length;
    expect([count('draft'), count('sent'), count('paid')]).toEqual([2, 3, 7]);
    expect(invoices.filter((invoice) => invoice.status === 'sent' && invoice.dueDate < today())).toHaveLength(1);
});

test('its invoices are consistent: dates in order, totals as the server calculates them', async () => {
    await rebuildDemo();

    for (const invoice of await Invoice.find()) {
        expect(invoice.dueDate >= invoice.issueDate).toBe(true);
        expect(invoice.issueDate <= today()).toBe(true);
        expect(invoice.issueDate >= addDays(today(), -160)).toBe(true);
        if (invoice.status === 'paid') {
            expect(invoice.paidDate >= invoice.issueDate && invoice.paidDate <= today()).toBe(true);
        } else {
            expect(invoice.paidDate).toBeUndefined();
        }
        const items = invoice.items.map(({ description, quantity, rate }) => ({ description, quantity, rate }));
        const expected = totalsOf({ items, discountPercent: invoice.discountPercent, taxPercent: invoice.taxPercent });
        expect(invoice.total).toBe(expected.total);
        expect(invoice.subtotal).toBe(expected.subtotal);
        expect(invoice.business.companyName).toBe('Northwind Studio');
    }
});

test('the demo can be entered, and its next invoice is number 13', async () => {
    await rebuildDemo();
    const agent = await demoAgent();

    const list = (await agent.get('/api/v1/invoices')).body.data;
    const created = await agent.post('/api/v1/invoices').send({
        customer: { name: 'A visitor' }, issueDate: today(), dueDate: addDays(today(), 7), items: [{ description: 'Trial', quantity: 1, rate: 10 }],
    });

    expect(list.total).toBe(12);
    expect(list.invoices[0].number).toBe('INV-0012');
    expect(created.body.data.invoice.number).toBe('INV-0013');
    // what a visitor makes is the newest in the list, whatever the time of day
    expect((await agent.get('/api/v1/invoices')).body.data.invoices.slice(0, 2).map((invoice) => invoice.number)).toEqual(['INV-0013', 'INV-0012']);
    expect((await request(app).post('/api/v1/users/login').send({ email: DEMO_EMAIL, password: DEMO_PASSWORD })).status).toBe(200);
});

test('a rebuild undoes what visitors did and keeps them logged in', async () => {
    await rebuildDemo();
    const agent = await demoAgent();
    const demoId = String((await User.findOne({ email: DEMO_EMAIL }))._id);
    await agent.post('/api/v1/invoices').send({ customer: { name: 'A visitor' }, issueDate: today(), dueDate: today(), items: [{ description: 'x', quantity: 1, rate: 1 }] });
    await agent.put('/api/v1/business').send({ companyName: 'Changed by a visitor' });

    await rebuildDemo();

    expect(String((await User.findOne({ email: DEMO_EMAIL }))._id)).toBe(demoId);
    expect(await User.countDocuments({ isDemo: true })).toBe(1);
    expect(await Invoice.countDocuments({ user: demoId })).toBe(12);
    expect((await Business.findOne({ user: demoId })).companyName).toBe('Northwind Studio');
    expect((await Counter.findOne({ user: demoId })).seq).toBe(12);
    expect((await agent.get('/api/v1/users/me')).status).toBe(200);
});

test('what real users made is not touched', async () => {
    const { user, agent } = await loggedIn();
    await agent.put('/api/v1/business').send({ companyName: 'A real business' });
    await agent.post('/api/v1/invoices').send({ customer: { name: 'Real customer' }, issueDate: today(), dueDate: today(), items: [{ description: 'x', quantity: 1, rate: 1 }] });

    await rebuildDemo();
    await rebuildDemo();

    expect(await Invoice.countDocuments({ user: user._id })).toBe(1);
    expect((await Business.findOne({ user: user._id })).companyName).toBe('A real business');
    expect((await Counter.findOne({ user: user._id })).seq).toBe(1);
    expect((await agent.get('/api/v1/users/me')).status).toBe(200);
    expect(await User.countDocuments()).toBe(2);
});

test('a rebuild that cannot finish is reported, not thrown, at the start of the server', async () => {
    const failing = async () => { throw new Error('database away'); };

    expect(await startDemo(failing)).toBe(false);
    expect(await startDemo()).toBe(true);
});
