
import mongoose from 'mongoose';

const historySchema = new mongoose.Schema({
    id: { type: String, required: true },
    customerName: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    issueDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    status: { type: String, required: true },
});

const History = mongoose.model('History', invoiceSchema);

module.exports = History;
