import asyncHandler from '../utils/asynchandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import { Invoice } from '../models/invoice.model.js';
import { today } from '../utils/businessDay.js';
import { getBusinessOf } from './business.controller.js';
import { isOverdue } from './invoice.controller.js';

const MONTHS_SHOWN = 6;
const RECENT = 5;

// amounts are added in whole hundredths, as big integers, so the sums are exact
const toHundredths = (amount) => BigInt(Math.round(amount * 100));
const toUnits = (hundredths) => Number(hundredths) / 100;

// this month and the five before it, oldest first, as YYYY-MM
const monthsShown = (day) => {
    const [year, month] = day.split('-').map(Number);

    return Array.from({ length: MONTHS_SHOWN }, (_, index) =>
        new Date(Date.UTC(year, month - MONTHS_SHOWN + index, 1)).toISOString().slice(0, 7));
};

const emptyFigures = (months) => ({
    invoiced: 0n,
    paid: 0n,
    outstanding: 0n,
    overdue: 0n,
    byMonth: new Map(months.map((month) => [month, { invoiced: 0n, paid: 0n }])),
});

// Adds one invoice to the figures of its currency and to the counts. The counts are
// of all invoices, whatever their currency, like the list they lead to.
const count = (figures, counts, invoice, day) => {
    const amount = toHundredths(invoice.total);

    if (invoice.status === 'draft') {
        // a draft is not money yet: it is counted and never added up
        counts.draft += 1;
        return;
    }

    figures.invoiced += amount;
    const issued = figures.byMonth.get(invoice.issueDate.slice(0, 7));
    if (issued) issued.invoiced += amount;

    if (invoice.status === 'paid') {
        counts.paid += 1;
        figures.paid += amount;
        const paid = figures.byMonth.get((invoice.paidDate || '').slice(0, 7));
        if (paid) paid.paid += amount;
        return;
    }

    figures.outstanding += amount;

    if (isOverdue(invoice, day)) {
        counts.overdue += 1;
        figures.overdue += amount;
    } else {
        counts.sent += 1;
    }
};

const presentFigures = (figures) => ({
    invoiced: toUnits(figures.invoiced),
    paid: toUnits(figures.paid),
    outstanding: toUnits(figures.outstanding),
    overdue: toUnits(figures.overdue),
    byMonth: [...figures.byMonth.entries()].map(([month, sums]) => ({ month, invoiced: toUnits(sums.invoiced), paid: toUnits(sums.paid) })),
});

const presentRow = (invoice, day) => ({
    _id: invoice._id,
    number: invoice.number,
    customer: { name: invoice.customer.name },
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    currency: invoice.currency,
    total: invoice.total,
    status: invoice.status,
    overdue: isOverdue(invoice, day),
});

// Where the user's invoices stand. Amounts in different currencies are never added
// together: every currency the user has invoices in gets figures of its own.
const getDashboard = asyncHandler(async (req, res) => {
    const day = today();
    const months = monthsShown(day);

    const [business, invoices, recent] = await Promise.all([
        getBusinessOf(req.user._id),
        Invoice.find({ user: req.user._id }).select('status total currency issueDate dueDate paidDate').lean(),
        Invoice.find({ user: req.user._id }).select('number customer.name issueDate dueDate currency total status').sort({ createdAt: -1, _id: -1 }).limit(RECENT).lean(),
    ]);

    const figures = new Map([[business.currency, emptyFigures(months)]]);
    const counts = { draft: 0, sent: 0, overdue: 0, paid: 0 };

    for (const invoice of invoices) {
        if (!figures.has(invoice.currency)) figures.set(invoice.currency, emptyFigures(months));
        count(figures.get(invoice.currency), counts, invoice, day);
    }

    // the default currency first, the others in the order of the alphabet
    const currencies = [business.currency, ...[...figures.keys()].filter((currency) => currency !== business.currency).sort()];

    return res.status(200).json(
        new ApiResponse(200, {
            defaultCurrency: business.currency,
            currencies,
            counts,
            figures: Object.fromEntries(currencies.map((currency) => [currency, presentFigures(figures.get(currency))])),
            recent: recent.map((invoice) => presentRow(invoice, day)),
        }, "Dashboard")
    );
});

export { getDashboard }
