import asyncHandler from '../utils/asynchandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { Review } from '../models/review.model.js';
import { readText } from '../utils/input.js';
import { hasOffensiveLanguage } from '../utils/language.js';

const COMMENT_MAX = 500;
const LISTED = 50;
const DUPLICATE_KEY = 11000;

// a review as everyone sees it: the name, and nothing else about its writer
const present = (review) => ({ name: review.name, rating: review.rating, comment: review.comment, date: review.updatedAt });

const readRating = (value) => {
    const text = typeof value === 'number' ? String(value) : (typeof value === 'string' ? value.trim() : '');

    if (!/^[1-5]$/.test(text)) {
        throw new ApiError(400, "Rating must be a whole number from 1 to 5");
    }

    return Number(text);
};

const listReviews = asyncHandler(async (req, res) => {
    const [reviews, summary] = await Promise.all([
        Review.find().sort({ updatedAt: -1 }).limit(LISTED),
        Review.aggregate([{ $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$rating' } } }]),
    ]);

    const count = summary[0]?.count || 0;

    return res.status(200).json(
        new ApiResponse(200, {
            reviews: reviews.map(present),
            count,
            // to one decimal; nothing to average without reviews
            average: count > 0 ? Math.round((summary[0].total / count) * 10) / 10 : null,
        }, "Reviews")
    );
});

const getMyReview = asyncHandler(async (req, res) => {
    const review = await Review.findOne({ user: req.user._id });

    return res.status(200).json(
        new ApiResponse(200, { review: review ? { rating: review.rating, comment: review.comment } : null }, "Your review")
    );
});

const saveMyReview = asyncHandler(async (req, res) => {
    const rating = readRating(req.body.rating);
    const comment = readText(req.body.comment, 'Comment', { max: COMMENT_MAX, required: true });

    if (hasOffensiveLanguage(comment)) {
        throw new ApiError(400, "Please keep the review free of offensive language");
    }

    const existed = await Review.exists({ user: req.user._id });

    // the name is the account's, never one from the form
    const save = () => Review.findOneAndUpdate(
        { user: req.user._id },
        { $set: { rating, comment, name: req.user.name } },
        { upsert: true, new: true }
    );

    // two first saves at once both try to create the review; the one that lost finds it on a second try
    const review = await save().catch((error) => {
        if (error.code !== DUPLICATE_KEY) throw error;
        return save();
    });

    return res.status(200).json(
        new ApiResponse(200, { review: { rating: review.rating, comment: review.comment } }, existed ? "Your review was updated" : "Thank you for your review")
    );
});

const removeMyReview = asyncHandler(async (req, res) => {
    await Review.deleteOne({ user: req.user._id });

    return res.status(200).json(new ApiResponse(200, {}, "Your review was removed"));
});

export { listReviews, getMyReview, saveMyReview, removeMyReview }
