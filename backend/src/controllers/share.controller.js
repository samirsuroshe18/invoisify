import crypto from 'crypto';
import asyncHandler from '../utils/asynchandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { Invoice } from '../models/invoice.model.js';
import { sendInvoiceMail } from '../utils/mailSender.js';
import { giveBack, take } from '../utils/dailyLimit.js';
import { findInvoice, isOverdue, present } from './invoice.controller.js';

const SHARE_CODE = /^[0-9a-f]{32}$/;

const sendsAllowed = () => Number(process.env.DAILY_SEND_LIMIT) || 20;

const newCode = () => crypto.randomBytes(16).toString('hex');

// The code of an invoice's public page, made the first time it is needed. The filter
// writes a code only where there is none, so two requests at once end with the same one.
const codeFor = async (invoice) => {
    if (invoice.shareCode) return invoice.shareCode;

    await Invoice.updateOne({ _id: invoice._id, shareCode: { $exists: false } }, { $set: { shareCode: newCode() } });

    const current = await Invoice.findById(invoice._id);

    // it was deleted meanwhile
    if (!current?.shareCode) {
        throw new ApiError(409, CHANGED);
    }

    return current.shareCode;
};

// the address of the web app, without a slash at its end
const webApp = () => (process.env.FRONTEND_URL || '').replace(/\/+$/, '');

const linkTo = (code) => `${webApp()}/i/${code}`;

const CHANGED = "The invoice was changed in the meantime. Open it again.";

// what anyone with the link sees: the invoice as it is on paper, and nothing about the account
const presentPublic = (invoice) => {
    const { number, business, customer, issueDate, dueDate, paidDate, currency, items, discountPercent, taxPercent, subtotal, discountAmount, taxAmount, total, notes, status } = invoice.toObject();

    return {
        number, business, issueDate, dueDate, paidDate: paidDate || null, currency, items, discountPercent, taxPercent,
        subtotal, discountAmount, taxAmount, total, notes, status,
        // the customer's email address is the customer's own business
        customer: { name: customer.name, address: customer.address },
        overdue: isOverdue(invoice),
        // the demo account is open to everyone: the page says that this is not a real invoice
        demo: Boolean(invoice.isDemo),
    };
};

const shareInvoice = asyncHandler(async (req, res) => {
    const invoice = await findInvoice(req.params.id, req.user);

    // a draft can still change; what is shared is what was sent
    if (invoice.status === 'draft') {
        throw new ApiError(409, "Mark the invoice as sent before sharing it");
    }

    const code = await codeFor(invoice);

    return res.status(200).json(new ApiResponse(200, { code, link: linkTo(code) }, "Link ready"));
});

const stopSharing = asyncHandler(async (req, res) => {
    const invoice = await findInvoice(req.params.id, req.user);

    await Invoice.updateOne({ _id: invoice._id, user: req.user._id }, { $unset: { shareCode: '' } });

    return res.status(200).json(new ApiResponse(200, {}, "The link no longer works"));
});

const sendInvoice = asyncHandler(async (req, res) => {
    const invoice = await findInvoice(req.params.id, req.user);

    if (invoice.status === 'paid') {
        throw new ApiError(409, "A paid invoice is not sent again");
    }

    if (!invoice.customer.email) {
        throw new ApiError(400, "Add the customer's email address before sending");
    }

    // the demo account is open to everyone, so it never sends real mail
    if (!req.user.isDemo) {
        const key = `send:${req.user._id}`;

        if (await take(key, sendsAllowed()) === null) {
            throw new ApiError(429, `You have sent today's ${sendsAllowed()} invoices by email. Try again tomorrow.`);
        }

        const outcome = await sendInvoiceMail({
            to: invoice.customer.email,
            from: invoice.business.companyName,
            replyTo: invoice.business.email,
            customerName: invoice.customer.name,
            number: invoice.number,
            total: invoice.total,
            currency: invoice.currency,
            dueDate: invoice.dueDate,
            link: linkTo(await codeFor(invoice)),
        });

        if (outcome === 'limit') {
            // not the sender's doing, so it does not count against them
            await giveBack(key);
            throw new ApiError(429, "Invoisify has sent all the invoice emails it can today. Try again tomorrow, or copy the link and send it yourself.");
        }

        // The invoice stays as it was. The attempt still counts for the account:
        // otherwise sends that fail could be repeated without end.
        if (outcome !== 'sent') {
            throw new ApiError(502, "The email could not be sent. The invoice was not changed.");
        }
    }

    const code = await codeFor(invoice);

    // a draft becomes sent; an invoice that was sent already stays as it is
    await Invoice.updateOne({ _id: invoice._id, user: req.user._id, status: 'draft' }, { $set: { status: 'sent', sentAt: new Date() } });

    const message = req.user.isDemo
        ? `Invoice ${invoice.number} marked as sent. The demo account sends no email.`
        : `Invoice ${invoice.number} sent to ${invoice.customer.email}`;

    const current = await Invoice.findById(invoice._id);

    if (!current) {
        throw new ApiError(409, CHANGED);
    }

    return res.status(200).json(
        new ApiResponse(200, { invoice: present(current), code, link: linkTo(code) }, message)
    );
});

const getPublicInvoice = asyncHandler(async (req, res) => {
    const { code } = req.params;

    // only the shape a code can have ever reaches the database; a draft has no public page
    const invoice = typeof code === 'string' && SHARE_CODE.test(code)
        ? await Invoice.findOne({ shareCode: code, status: { $ne: 'draft' } })
        : null;

    if (!invoice) {
        throw new ApiError(404, "This invoice is not available");
    }

    return res.status(200).json(new ApiResponse(200, { invoice: presentPublic(invoice) }, "Invoice"));
});

export { shareInvoice, stopSharing, sendInvoice, getPublicInvoice }
