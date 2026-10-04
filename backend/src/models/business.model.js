import mongoose, { Schema } from "mongoose";

export const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'];
export const DEFAULT_ACCENT = '#2563eb';

// The details of a user's business, filled in once and copied onto each invoice
const businessSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },

    companyName: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    logoUrl: String,

    // the colour of the heading of an invoice
    accentColor: { type: String, default: DEFAULT_ACCENT },

    // what a new invoice starts with
    currency: { type: String, enum: CURRENCIES, default: 'INR' },
    taxPercent: { type: Number, default: 0 },

    // shown at the bottom of an invoice: a bank account, a UPI id
    paymentDetails: { type: String, trim: true, default: '' },

}, { timestamps: true });

export const Business = mongoose.model("Business", businessSchema);
