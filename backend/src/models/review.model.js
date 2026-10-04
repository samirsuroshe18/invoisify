import mongoose, { Schema } from "mongoose";

// What a user says about Invoisify, shown on the landing page. One for each user.
const reviewSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },

    // the user's name when the review was written
    name: {
        type: String,
        required: true,
        trim: true,
    },

    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },

    comment: {
        type: String,
        required: true,
        trim: true,
    },

}, { timestamps: true });

export const Review = mongoose.model("Review", reviewSchema);
