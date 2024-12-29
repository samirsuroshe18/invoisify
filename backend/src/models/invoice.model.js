import mongoose from "mongoose";
import { Schema } from "mongoose";

const invoiceSchema = new Schema({
    companyName: {
        type: String,
        required: true,
        
    },
   companyAddress: {
    type: String,
    required: true,
   },
    companyEmail : {
        type: String,
        required: true,
    },
    companyLogo: {
        type: String,
        required: true,
    },
    customerName: {
        type: String,
        required: true,
    },
    customerAddress: {
        type: String,
        required: true,
    },
    additionalNote: {
        type: String,
        required: false,
    },
    totalAmount: {
        type: Number,
        required: true,
    },
    issueDate: {
        type: Date,
        required: true,
    },
    dueDate: {
        type: Date,
        required: true,
    },
    paidDate: {
        type: Date,
        required: false,
    },
    status: {
        type: String,
        required: true,
    },

}, { timestamps: true });

export  const Invoice = mongoose.model("Invoice", invoiceSchema);