import mongoose, { Schema } from "mongoose";

// the last invoice number a user was given
const counterSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },

    seq: {
        type: Number,
        default: 0,
    },
});

export const Counter = mongoose.model("Counter", counterSchema);
