
import mongoose, {Schema} from 'mongoose';

const historySchema = new Schema({
    id: { type: String, required: true },
    customerName: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    issueDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    status: { type: String, required: true },
});

export const History = mongoose.model("History", historySchema);
