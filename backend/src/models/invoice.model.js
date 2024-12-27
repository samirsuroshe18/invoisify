import mongoose from "mongoose";
import { Schema } from "mongoose";

const invoiceSchema = new Schema({
    companyName: {
        type: String,
        required: true,
        
    },
    logo : {
        type: String,
        required: true,
    },
    address : {
        type: String,
        required: true,
    },
    totalAmount : {
        type: String,
        required: true,
    },
    customerName : {
        type: String,
        required: true,
    },
    issueDate : {
        type: String,
        required: true,
    },
    dueDate : {
        type: String,
        required: true,
    },
    paidDate : {
        type: String,
    },
    status : {
        type: String,
        required: true,
    },

}, { timestamps: true });

export  const Invoice = mongoose.model("Invoice", invoiceSchema);