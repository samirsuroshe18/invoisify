import mongoose, { Schema } from "mongoose";
import { CURRENCIES } from './business.model.js';

export const STATUSES = ['draft', 'sent', 'paid'];

const itemSchema = new Schema({
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true },
    rate: { type: Number, required: true },
    // quantity x rate, calculated by the server
    amount: { type: Number, required: true },
}, { _id: false });

// the business as it was when the invoice was written
const businessSchema = new Schema({
    companyName: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    logoUrl: { type: String, default: '' },
    accentColor: { type: String, default: '' },
    paymentDetails: { type: String, default: '' },
}, { _id: false });

const customerSchema = new Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: '' },
    address: { type: String, trim: true, default: '' },
}, { _id: false });

const invoiceSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    // INV-0001, INV-0002, ... counted for each user
    number: {
        type: String,
        required: true,
    },

    business: { type: businessSchema, default: () => ({}) },
    customer: { type: customerSchema, required: true },

    // calendar days, YYYY-MM-DD
    issueDate: { type: String, required: true },
    dueDate: { type: String, required: true },
    paidDate: String,

    currency: { type: String, enum: CURRENCIES, required: true },

    items: [itemSchema],
    discountPercent: { type: Number, default: 0 },
    taxPercent: { type: Number, default: 0 },

    // calculated by the server from the items and the two percentages
    subtotal: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },

    notes: { type: String, trim: true, default: '' },

    // "overdue" is not stored: it is a sent invoice whose due date has passed
    status: {
        type: String,
        enum: STATUSES,
        default: 'draft',
    },

    sentAt: Date,

    // the random part of the address of the public page, once the invoice was shared
    shareCode: String,

    // made by the demo account
    isDemo: {
        type: Boolean,
        default: false,
    },

}, { timestamps: true });

invoiceSchema.index({ user: 1, number: 1 }, { unique: true });
invoiceSchema.index({ user: 1, createdAt: -1 });
invoiceSchema.index({ shareCode: 1 }, { unique: true, sparse: true });

export const Invoice = mongoose.model("Invoice", invoiceSchema);
