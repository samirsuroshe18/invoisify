import request from 'supertest';
import app from '../src/app.js';
import { Invoice } from '../src/models/invoice.model.js';
import { Business } from '../src/models/business.model.js';
import { rebuildDemo } from '../src/scripts/demoData.js';
import { addDays, today } from '../src/utils/businessDay.js';
import { loggedIn } from './helpers.js';

const api = '/api/v1/dashboard';

let counter = 0;
// an invoice written straight into the database, with just what the figures look at
const invoiceOf = (user, changes = {}) => {
    counter += 1;
    return Invoice.create({
        user: user._id, number: `INV-${String(counter).padStart(4, '0')}`, customer: { name: `Customer ${counter}` },
        issueDate: today(), dueDate: addDays(today(), 14), currency: 'INR', status: 'draft', items: [], total: 100, ...changes,
    });
};

const monthOf = (day) => day.slice(0, 7);
// the first day of the month a number of months before this one
const monthsAgo = (count) => {
    const [year, month] = today().split('-').map(Number);
    return new Date(Date.UTC(year, month - 1 - count, 1)).toISOString().slice(0, 10);
};

test('needs a login', async () => {
    expect((await request(app).get(api)).status).toBe(401);
});

test('an account without invoices gets zeros in its default currency, and six months', async () => {
    const { user, agent } = await loggedIn();
    await Business.create({ user: user._id, companyName: 'N', currency: 'USD' });

    const { data } = (await agent.get(api)).body;

    expect(data.defaultCurrency).toBe('USD');
    expect(data.currencies).toEqual(['USD']);
    expect(data.figures.USD).toMatchObject({ invoiced: 0, paid: 0, outstanding: 0, overdue: 0 });
    expect(data.counts).toEqual({ draft: 0, sent: 0, overdue: 0, paid: 0 });
    expect(data.figures.USD.byMonth).toHaveLength(6);
    expect(data.figures.USD.byMonth.map((row) => row.month)).toEqual([5, 4, 3, 2, 1, 0].map((count) => monthOf(monthsAgo(count))));
    expect(data.figures.USD.byMonth.every((row) => row.invoiced === 0 && row.paid === 0)).toBe(true);
    expect(data.recent).toEqual([]);
});

test('amounts and counts by status; drafts are counted and never added up', async () => {
    const { user, agent } = await loggedIn();
    await invoiceOf(user, { status: 'draft', total: 9999 });
    await invoiceOf(user, { status: 'sent', total: 1000.1 });
    await invoiceOf(user, { status: 'sent', total: 200.2 });
    await invoiceOf(user, { status: 'sent', total: 50, issueDate: addDays(today(), -30), dueDate: addDays(today(), -1) });
    await invoiceOf(user, { status: 'sent', total: 70, issueDate: addDays(today(), -30), dueDate: today() });
    await invoiceOf(user, { status: 'paid', total: 300.3, paidDate: today() });
    await invoiceOf(user, { status: 'paid', total: 0.4, paidDate: today(), issueDate: addDays(today(), -40), dueDate: addDays(today(), -20) });

    const { data } = (await agent.get(api)).body;

    // sent: 1000.10 + 200.20 + 50 + 70 = 1320.30; paid: 300.30 + 0.40 = 300.70
    expect(data.figures.INR).toMatchObject({ invoiced: 1621, paid: 300.7, outstanding: 1320.3, overdue: 50 });
    expect(data.counts).toEqual({ draft: 1, sent: 3, overdue: 1, paid: 2 });
});

test('currencies are never added together; the default comes first', async () => {
    const { user, agent } = await loggedIn();
    await Business.create({ user: user._id, companyName: 'N', currency: 'EUR' });
    await invoiceOf(user, { status: 'sent', total: 100, currency: 'USD' });
    await invoiceOf(user, { status: 'paid', total: 40, currency: 'INR', paidDate: today() });
    await invoiceOf(user, { status: 'sent', total: 7, currency: 'EUR' });

    const { data } = (await agent.get(api)).body;

    expect(data.currencies).toEqual(['EUR', 'INR', 'USD']);
    expect(data.figures.EUR).toMatchObject({ invoiced: 7, outstanding: 7, paid: 0 });
    expect(data.figures.USD).toMatchObject({ invoiced: 100, outstanding: 100, paid: 0 });
    expect(data.figures.INR).toMatchObject({ invoiced: 40, outstanding: 0, paid: 40 });
});

test('by month: invoiced by the issue date, paid by the day of payment', async () => {
    const { user, agent } = await loggedIn();
    const twoAgo = monthsAgo(2);
    const oneAgo = monthsAgo(1);
    // issued two months ago, paid last month
    await invoiceOf(user, { status: 'paid', total: 500, issueDate: twoAgo, dueDate: addDays(twoAgo, 10), paidDate: addDays(oneAgo, 3) });
    // issued and still open from last month
    await invoiceOf(user, { status: 'sent', total: 250.5, issueDate: addDays(oneAgo, 5), dueDate: addDays(oneAgo, 20) });
    // a draft from last month is not in the figures
    await invoiceOf(user, { status: 'draft', total: 77, issueDate: oneAgo, dueDate: oneAgo });
    // older than six months: in the totals, not in the chart
    await invoiceOf(user, { status: 'paid', total: 10, issueDate: monthsAgo(8), dueDate: monthsAgo(8), paidDate: monthsAgo(7) });

    const figures = (await agent.get(api)).body.data.figures.INR;
    const month = (day) => figures.byMonth.find((row) => row.month === monthOf(day));

    expect(month(twoAgo)).toEqual({ month: monthOf(twoAgo), invoiced: 500, paid: 0 });
    expect(month(oneAgo)).toEqual({ month: monthOf(oneAgo), invoiced: 250.5, paid: 500 });
    expect(month(today())).toEqual({ month: monthOf(today()), invoiced: 0, paid: 0 });
    expect(figures.invoiced).toBe(760.5);
    expect(figures.paid).toBe(510);
});

test('sums that floating point gets wrong come out exact', async () => {
    const { user, agent } = await loggedIn();
    for (let index = 0; index < 10; index += 1) {
        await invoiceOf(user, { status: 'sent', total: 0.1 });
    }
    await invoiceOf(user, { status: 'sent', total: 0.2 });

    expect((await agent.get(api)).body.data.figures.INR.outstanding).toBe(1.2);
});

test('the five latest invoices, and only the user\'s own', async () => {
    const mine = await loggedIn();
    const other = await loggedIn();
    for (let index = 0; index < 7; index += 1) {
        await invoiceOf(mine.user, { status: 'sent', createdAt: new Date(Date.now() - (10 - index) * 60000) });
    }
    await invoiceOf(other.user, { status: 'paid', total: 5000, paidDate: today() });

    const { data } = (await mine.agent.get(api)).body;

    expect(data.recent).toHaveLength(5);
    expect(data.recent[0]).toEqual(expect.objectContaining({ number: expect.stringMatching(/^INV-/), customer: { name: expect.any(String) }, total: 100, status: 'sent', overdue: false }));
    expect(data.recent.map((row) => row.number)).toEqual([...data.recent.map((row) => row.number)].sort().reverse());
    expect(data.figures.INR.paid).toBe(0);
    expect(data.counts).toMatchObject({ sent: 7, paid: 0 });
});

test('the demo account has something in every figure', async () => {
    await rebuildDemo();
    const agent = request.agent(app);
    await agent.post('/api/v1/users/demo-login');

    const { data } = (await agent.get(api)).body;
    const figures = data.figures.INR;

    expect(data.counts).toEqual({ draft: 2, sent: 2, overdue: 1, paid: 7 });
    expect(figures.paid).toBeGreaterThan(0);
    expect(figures.overdue).toBeGreaterThan(0);
    expect(figures.outstanding).toBeGreaterThan(figures.overdue);
    expect(figures.invoiced).toBe(Math.round((figures.paid + figures.outstanding) * 100) / 100);
    expect(figures.byMonth.filter((row) => row.invoiced > 0).length).toBeGreaterThanOrEqual(5);
    expect(data.recent).toHaveLength(5);
});
