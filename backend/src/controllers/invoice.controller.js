import asyncHandler from '../utils/asynchandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { Invoice, STATUSES } from '../models/invoice.model.js';
import { CURRENCIES } from '../models/business.model.js';
import { readChoice, readText } from '../utils/input.js';
import { readItems, readPercent, totalsOf } from '../utils/totals.js';
import { nextInvoiceNumber } from '../utils/invoiceNumber.js';
import { addDays, daysBetween, isDay, today } from '../utils/businessDay.js';
import { isValidObjectId } from '../utils/objectId.js';
import { getBusinessOf } from './business.controller.js';

const NAME_MAX = 120;
const EMAIL_MAX = 254;
const ADDRESS_MAX = 300;
const NOTES_MAX = 1000;
const SEARCH_MAX = 80;
const PER_PAGE = 20;
const MAX_PAGE = 100000;

// how many invoices an account may hold; the demo account is shared, so it gets fewer
const invoicesAllowed = (user) => (user.isDemo
    ? Number(process.env.MAX_DEMO_INVOICES) || 200
    : Number(process.env.MAX_INVOICES) || 2000);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LIST_FILTERS = ['all', 'draft', 'sent', 'overdue', 'paid'];

// which status an invoice may move to, and what the user is told
const MOVES = {
    draft: { sent: 'Invoice marked as sent' },
    sent: { paid: 'Invoice marked as paid', draft: 'Invoice moved back to draft' },
    paid: { sent: 'Invoice marked as unpaid' },
};

const isOverdue = (invoice, day = today()) => invoice.status === 'sent' && invoice.dueDate < day;

// an invoice as the pages get it; what the server keeps to itself is left out
const present = (invoice) => {
    const { user, shareCode, isDemo, __v, ...shown } = invoice.toObject();

    return { ...shown, paidDate: shown.paidDate || null, sentAt: shown.sentAt || null, overdue: isOverdue(invoice) };
};

// a row of the list: enough to show and to find the invoice
const presentRow = (invoice) => ({
    _id: invoice._id,
    number: invoice.number,
    customer: { name: invoice.customer.name },
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    paidDate: invoice.paidDate || null,
    currency: invoice.currency,
    total: invoice.total,
    status: invoice.status,
    overdue: isOverdue(invoice),
});

// Finds an invoice of the user. Another user's invoice is "not found", like one that
// does not exist: nobody learns which ids are in use.
const findInvoice = async (id, user) => {
    const invoice = isValidObjectId(id) ? await Invoice.findOne({ _id: id, user: user._id }) : null;

    if (!invoice) {
        throw new ApiError(404, "Invoice not found");
    }

    return invoice;
};

const readDay = (value, label) => {
    if (!isDay(value)) {
        throw new ApiError(400, `${label} must be a date like 2026-03-15`);
    }

    return value;
};

const readCustomer = (value) => {
    const customer = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    const email = readText(customer.email, 'Customer email', { max: EMAIL_MAX }).toLowerCase();

    if (email && !EMAIL_PATTERN.test(email)) {
        throw new ApiError(400, "Enter a valid customer email address");
    }

    return {
        name: readText(customer.name, 'Customer name', { max: NAME_MAX, required: true }),
        email,
        address: readText(customer.address, 'Customer address', { max: ADDRESS_MAX }),
    };
};

// Everything of an invoice a form may set. Number, status, totals and owner are never
// read from it; the totals are calculated here.
const readInvoice = (body, business) => {
    const customer = readCustomer(body.customer);
    const issueDate = readDay(body.issueDate, 'Issue date');
    const dueDate = readDay(body.dueDate, 'Due date');

    if (dueDate < issueDate) {
        throw new ApiError(400, "The due date cannot be before the issue date");
    }

    const currency = readChoice(body.currency, 'Currency', CURRENCIES) || business.currency;
    const discountPercent = readPercent(body.discountPercent, 'Discount');
    // an invoice without a tax rate of its own takes the one of the business
    const taxPercent = body.taxPercent === undefined ? business.taxPercent : readPercent(body.taxPercent, 'Tax');
    const notes = readText(body.notes, 'Notes', { max: NOTES_MAX });

    return {
        customer,
        issueDate,
        dueDate,
        currency,
        discountPercent,
        taxPercent,
        notes,
        ...totalsOf({ items: readItems(body.items), discountPercent, taxPercent }),
    };
};

const assertRoom = async (user) => {
    const limit = invoicesAllowed(user);

    if (await Invoice.countDocuments({ user: user._id }) >= limit) {
        throw new ApiError(409, `You have reached the limit of ${limit} invoices. Delete one to make room.`);
    }
};

// the business as it is now, to be written onto an invoice
const businessFor = async (user) => {
    const business = await getBusinessOf(user._id);

    if (!business.complete) {
        throw new ApiError(400, "Fill in your business profile before creating an invoice");
    }

    return business;
};

const snapshotOf = ({ companyName, email, phone, address, logoUrl, accentColor, paymentDetails }) =>
    ({ companyName, email, phone, address, logoUrl, accentColor, paymentDetails });

const listInvoices = asyncHandler(async (req, res) => {
    const status = readChoice(req.query.status, 'Status', LIST_FILTERS) || 'all';
    const search = readText(req.query.search, 'Search', { max: SEARCH_MAX });
    const asked = Number(req.query.page);
    const page = Number.isInteger(asked) && asked >= 1 && asked <= MAX_PAGE ? asked : 1;

    const filter = { user: req.user._id };
    const day = today();

    // days are written as YYYY-MM-DD, so they compare as text
    if (status === 'overdue') {
        Object.assign(filter, { status: 'sent', dueDate: { $lt: day } });
    } else if (status === 'sent') {
        Object.assign(filter, { status: 'sent', dueDate: { $gte: day } });
    } else if (status !== 'all') {
        filter.status = status;
    }

    if (search) {
        // what was typed is looked for as it is, not as a pattern
        const literal = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        filter.$or = [{ number: literal }, { 'customer.name': literal }];
    }

    const [total, invoices] = await Promise.all([
        Invoice.countDocuments(filter),
        Invoice.find(filter).select('-items -business -notes').sort({ createdAt: -1, _id: -1 }).skip((page - 1) * PER_PAGE).limit(PER_PAGE),
    ]);

    return res.status(200).json(
        new ApiResponse(200, { invoices: invoices.map(presentRow), page, pages: Math.max(1, Math.ceil(total / PER_PAGE)), total }, "Invoices")
    );
});

const createInvoice = asyncHandler(async (req, res) => {
    const business = await businessFor(req.user);
    const fields = readInvoice(req.body, business);
    await assertRoom(req.user);

    // the number is taken only for an invoice that passed every check
    const invoice = await Invoice.create({
        ...fields,
        user: req.user._id,
        number: await nextInvoiceNumber(req.user._id),
        business: snapshotOf(business),
        isDemo: req.user.isDemo,
    });

    return res.status(201).json(
        new ApiResponse(201, { invoice: present(invoice) }, `Invoice ${invoice.number} created`)
    );
});

const getInvoice = asyncHandler(async (req, res) => {
    const invoice = await findInvoice(req.params.id, req.user);

    return res.status(200).json(new ApiResponse(200, { invoice: present(invoice) }, "Invoice"));
});

const updateInvoice = asyncHandler(async (req, res) => {
    const existing = await findInvoice(req.params.id, req.user);
    const business = await businessFor(req.user);
    const fields = readInvoice(req.body, business);

    // the filter lets the change through only while the invoice is still a draft
    const invoice = await Invoice.findOneAndUpdate(
        { _id: existing._id, user: req.user._id, status: 'draft' },
        { $set: { ...fields, business: snapshotOf(business) } },
        { new: true }
    );

    if (!invoice) {
        throw new ApiError(409, "Only a draft can be edited");
    }

    return res.status(200).json(new ApiResponse(200, { invoice: present(invoice) }, "Invoice saved"));
});

const changeStatus = asyncHandler(async (req, res) => {
    const invoice = await findInvoice(req.params.id, req.user);
    const status = readChoice(req.body.status, 'Status', STATUSES, { required: true });
    const message = MOVES[invoice.status][status];

    if (!message) {
        throw new ApiError(409, `An invoice that is ${invoice.status} cannot become ${status}`);
    }

    const changes = { $set: { status }, $unset: {} };

    if (status === 'paid') {
        const paidDate = req.body.paidDate === undefined || req.body.paidDate === '' ? today() : readDay(req.body.paidDate, 'Paid date');

        if (paidDate < invoice.issueDate) {
            throw new ApiError(400, "The paid date cannot be before the issue date");
        }

        // one day ahead of the business's day is allowed: where the user is, it may be tomorrow already
        if (paidDate > addDays(today(), 1)) {
            throw new ApiError(400, "The paid date cannot be in the future");
        }

        changes.$set.paidDate = paidDate;
    } else {
        changes.$unset.paidDate = '';
    }

    if (status === 'sent' && invoice.status === 'draft') {
        changes.$set.sentAt = new Date();
    }

    if (status === 'draft') {
        changes.$unset.sentAt = '';
    }

    // of two changes that arrive together only the first finds the status it expects
    const changed = await Invoice.findOneAndUpdate(
        { _id: invoice._id, user: req.user._id, status: invoice.status },
        changes,
        { new: true }
    );

    if (!changed) {
        throw new ApiError(409, "The invoice was changed in the meantime. Open it again.");
    }

    return res.status(200).json(new ApiResponse(200, { invoice: present(changed) }, message));
});

const deleteInvoice = asyncHandler(async (req, res) => {
    const invoice = await findInvoice(req.params.id, req.user);

    const removed = await Invoice.deleteOne({ _id: invoice._id, user: req.user._id, status: { $ne: 'paid' } });

    if (removed.deletedCount === 0) {
        throw new ApiError(409, "Mark the invoice as unpaid before deleting it");
    }

    return res.status(200).json(new ApiResponse(200, {}, `Invoice ${invoice.number} deleted`));
});

const duplicateInvoice = asyncHandler(async (req, res) => {
    const original = await findInvoice(req.params.id, req.user);
    const business = await businessFor(req.user);
    await assertRoom(req.user);
    const { customer, currency, items, discountPercent, taxPercent, subtotal, discountAmount, taxAmount, total, notes } = original.toObject();
    const issueDate = today();

    const invoice = await Invoice.create({
        customer, currency, items, discountPercent, taxPercent, subtotal, discountAmount, taxAmount, total, notes,
        user: req.user._id,
        number: await nextInvoiceNumber(req.user._id),
        business: snapshotOf(business),
        // from today, with the same number of days to pay
        issueDate,
        dueDate: addDays(issueDate, daysBetween(original.issueDate, original.dueDate)),
        isDemo: req.user.isDemo,
    });

    return res.status(201).json(
        new ApiResponse(201, { invoice: present(invoice) }, `Invoice ${invoice.number} created from ${original.number}`)
    );
});

export { listInvoices, createInvoice, getInvoice, updateInvoice, changeStatus, deleteInvoice, duplicateInvoice, present, isOverdue }
