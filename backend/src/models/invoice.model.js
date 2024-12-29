import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
    description: { type: String, required: true },
    quantity: { type: Number, required: true },
    rate: { type: Number, required: true },
});

const invoiceSchema = new mongoose.Schema({
    companyName: { type: String, required: true },
    companyEmail: { type: String, required: false },
    companyAddress: { type: String, required: true },
    companyLogo: { type: String, required: true },
    customerName: { type: String, required: true },
    customerAddress: { type: String, required: false },
    additionalNotes: { type: String, required: false },
    totalAmount: { type: Number, required: true },
    issueDate: { type: Date, required: true },
    paidDate: { type: Date, required: false },
    dueDate: { type: Date, required: true },
    status: { type: String, required: true },
    items: [itemSchema],
});

export const Invoice = mongoose.model("Invoice", invoiceSchema);


