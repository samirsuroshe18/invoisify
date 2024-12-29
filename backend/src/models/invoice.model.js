import mongoose, {Schema} from 'mongoose';

const itemSchema = new Schema({
    description: { 
        type: String,
    },

    quantity: { 
        type: Number,
    },

    rate: { 
        type: Number,
    },
});

const invoiceSchema = new mongoose.Schema({
    companyName: { 
        type: String, 
    },

    companyEmail: { 
        type: String, 
        required: false 
    },

    companyAddress: { 
        type: String, 
        required: true 
    },

    companyLogo: { 
        type: String, 
        required: true 
    },

    customerName: { 
        type: String, 
        required: true 
    },

    customerAddress: { 
        type: String, 
        required: false 
    },

    additionalNotes: { 
        type: String, 
    },

    totalAmount: { 
        type: Number, 
        required: true 
    },

    issueDate: { 
        type: Date, 
        required: true 
    },

    paidDate: { 
        type: Date,
    },

    dueDate: { 
        type: Date, 
        required: true 
    },

    status: { 
        type: String, 
        enum: ['pending', 'sent', 'paid', 'completed'],
        default: 'pending',
    },

    items: [itemSchema],

}, { timestamps: true } );

export const Invoice = mongoose.model("Invoice", invoiceSchema);


