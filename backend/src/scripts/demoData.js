// The demo account: a small design studio with invoices in every state, so a visitor
// has something to look at and to try. Only what belongs to the demo account is ever
// removed here.
import crypto from 'crypto';
import mongoose from 'mongoose';
import { User } from '../models/user.model.js';
import { Business } from '../models/business.model.js';
import { Invoice } from '../models/invoice.model.js';
import { Counter } from '../models/counter.model.js';
import { DEMO_EMAIL, DEMO_PASSWORD } from '../utils/demo.js';
import { addDays, today } from '../utils/businessDay.js';
import { totalsOf } from '../utils/totals.js';
import { formatNumber } from '../utils/invoiceNumber.js';

const BUSINESS = {
    companyName: 'Northwind Studio',
    email: 'hello@northwind.example',
    phone: '+91 98200 00000',
    address: '12 Lake Road, Pune 411001',
    accentColor: '#2563eb',
    currency: 'INR',
    taxPercent: 18,
    paymentDetails: 'Bank transfer to Northwind Studio, account 0000 1234 5678, IFSC DEMO0001234',
};

const customer = (name, email, address) => ({ name, email, address });

const CUSTOMERS = {
    acme: customer('Acme Traders', 'accounts@acme.example', '4 Market Street, Mumbai'),
    bluesky: customer('Blue Sky Travels', 'finance@bluesky.example', '21 MG Road, Bengaluru'),
    greenleaf: customer('Greenleaf Organics', 'hello@greenleaf.example', '7 Farm Lane, Nashik'),
    orbit: customer('Orbit Fitness', 'billing@orbit.example', '88 Ring Road, Delhi'),
    papertrail: customer('Papertrail Books', 'owner@papertrail.example', '3 College Street, Kolkata'),
};

const item = (description, quantity, rate) => ({ description, quantity, rate });

// Oldest first. issued and due are counted in days from today; a paid invoice says how
// many days after it was issued it was paid.
const INVOICES = [
    { to: 'acme', issued: -150, due: -136, paidAfter: 9, items: [item('Brand identity design', 1, 45000), item('Logo variations', 3, 2500)] },
    { to: 'bluesky', issued: -132, due: -118, paidAfter: 12, items: [item('Landing page design', 1, 28000), item('Stock photography', 6, 750)], discount: 5 },
    { to: 'greenleaf', issued: -110, due: -95, paidAfter: 4, items: [item('Packaging design, three sizes', 3, 9500)] },
    { to: 'orbit', issued: -96, due: -82, paidAfter: 20, items: [item('Poster series', 4, 3200), item('Print-ready files', 1, 1500)] },
    { to: 'acme', issued: -75, due: -61, paidAfter: 10, items: [item('Website redesign', 1, 85000), item('Content migration', 12.5, 1200)], discount: 10 },
    { to: 'papertrail', issued: -58, due: -44, paidAfter: 6, items: [item('Catalogue layout', 48, 350)] },
    { to: 'bluesky', issued: -40, due: -26, paidAfter: 14, items: [item('Social media templates', 10, 1800)] },
    { to: 'orbit', issued: -34, due: -20, sent: true, items: [item('Membership brochure', 1, 14000), item('Illustrations', 5, 2200)] },
    { to: 'greenleaf', issued: -12, due: 2, sent: true, items: [item('Monthly design retainer', 1, 30000)] },
    { to: 'papertrail', issued: -6, due: 8, sent: true, items: [item('Book cover design', 2, 12000)], discount: 2.5 },
    { to: 'acme', issued: -2, due: 12, items: [item('Annual report design', 1, 60000), item('Infographics', 8, 2750)] },
    { to: 'bluesky', issued: 0, due: 14, items: [item('Travel guide layout', 24, 900)], notes: 'Draft: waiting for the final page count.' },
];

// The same account gets the same id at every rebuild, so a visitor who is logged in
// to the demo stays logged in when the server restarts.
const DEMO_ID = new mongoose.Types.ObjectId(crypto.createHash('md5').update(DEMO_EMAIL).digest('hex').slice(0, 24));

const snapshot = ({ companyName, email, phone, address, accentColor, paymentDetails }) =>
    ({ companyName, email, phone, address, logoUrl: '', accentColor, paymentDetails });

const buildInvoice = (plan, index, day) => {
    const issueDate = addDays(day, plan.issued);
    const paid = plan.paidAfter !== undefined;
    const issuedAt = new Date(`${issueDate}T09:00:00Z`);

    return {
        user: DEMO_ID,
        number: formatNumber(index + 1),
        business: snapshot(BUSINESS),
        customer: CUSTOMERS[plan.to],
        issueDate,
        dueDate: addDays(day, plan.due),
        paidDate: paid ? addDays(issueDate, plan.paidAfter) : undefined,
        currency: BUSINESS.currency,
        discountPercent: plan.discount || 0,
        taxPercent: BUSINESS.taxPercent,
        ...totalsOf({ items: plan.items, discountPercent: plan.discount || 0, taxPercent: BUSINESS.taxPercent }),
        notes: plan.notes || 'Thank you for your business.',
        status: paid ? 'paid' : (plan.sent ? 'sent' : 'draft'),
        sentAt: paid || plan.sent ? issuedAt : undefined,
        isDemo: true,
        // the list shows the newest first, so the invoices are as old as their issue dates
        createdAt: issuedAt,
        updatedAt: issuedAt,
    };
};

const removeDemo = async () => {
    await Promise.all([
        Invoice.deleteMany({ user: DEMO_ID }),
        Business.deleteMany({ user: DEMO_ID }),
        Counter.deleteMany({ user: DEMO_ID }),
    ]);
    await User.deleteMany({ $or: [{ _id: DEMO_ID }, { email: DEMO_EMAIL }] });
};

// Builds the demo account from scratch. Safe to run at every start of the server.
const rebuildDemo = async () => {
    await removeDemo();

    // User.create runs the password hashing
    await User.create({ _id: DEMO_ID, name: 'Demo User', email: DEMO_EMAIL, password: DEMO_PASSWORD, isVerified: true, isDemo: true });
    await Business.create({ user: DEMO_ID, ...BUSINESS });

    const day = today();
    // timestamps: false keeps the dates given above
    await Invoice.insertMany(INVOICES.map((plan, index) => buildInvoice(plan, index, day)), { timestamps: false });
    await Counter.create({ user: DEMO_ID, seq: INVOICES.length });

    return { invoices: INVOICES.length };
};

// For the start of the server: a demo that cannot be built must not keep the server
// from starting, so the failure is reported and the server carries on.
const startDemo = async (rebuild = rebuildDemo) => {
    try {
        const { invoices } = await rebuild();
        console.log(`Demo account rebuilt: ${invoices} invoices`);
        return true;
    } catch (error) {
        console.log(`The demo account could not be rebuilt: ${error.message}`);
        return false;
    }
};

export { rebuildDemo, startDemo }
