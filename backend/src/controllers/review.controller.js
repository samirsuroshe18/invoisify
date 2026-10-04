import asyncHandler from '../utils/asynchandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { Review } from '../models/review.model.js';
import { readText } from '../utils/input.js';
import { offensiveWord } from '../utils/language.js';

const COMMENT_MAX = 500;
const LISTED = 50;
const DUPLICATE_KEY = 11000;
const FRESH_MS = 30 * 1000;

// The landing page asks for the reviews at every visit. The answer is kept for half a
// minute, and thrown away at once when a review changes.
let kept = null;

const forgetList = () => {
    kept = null;
};

// a review as everyone sees it: the name, and nothing else about its writer
const present = (review) => ({ name: review.name, rating: review.rating, comment: review.comment, date: review.updatedAt });

const readRating = (value) => {
    const text = typeof value === 'number' ? String(value) : (typeof value === 'string' ? value.trim() : '');

    if (!/^[1-5]$/.test(text)) {
        throw new ApiError(400, "Rating must be a whole number from 1 to 5");
    }

    return Number(text);
};

const readList = async () => {
    const [reviews, summary] = await Promise.all([
        Review.find().sort({ updatedAt: -1 }).limit(LISTED),
        Review.aggregate([{ $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$rating' } } }]),
    ]);

    const count = summary[0]?.count || 0;

    return {
        reviews: reviews.map(present),
        count,
        // to one decimal; nothing to average without reviews
        average: count > 0 ? Math.round((summary[0].total / count) * 10) / 10 : null,
    };
};

const listReviews = asyncHandler(async (req, res) => {
    // the automated tests always read afresh
    const usable = kept && Date.now() - kept.at < FRESH_MS && process.env.NODE_ENV !== 'test';

    if (!usable) {
        kept = { at: Date.now(), list: await readList() };
    }

    return res.status(200).json(new ApiResponse(200, kept.list, "Reviews"));
});

const getMyReview = asyncHandler(async (req, res) => {
    const review = await Review.findOne({ user: req.user._id });

    return res.status(200).json(
        new ApiResponse(200, { review: review ? { rating: review.rating, comment: review.comment } : null }, "Your review")
    );
});

const saveMyReview = asyncHandler(async (req, res) => {
    const rating = readRating(req.body.rating);
    // lines are kept, runs of empty lines are not: a review is not stretched down the page
    const comment = readText(req.body.comment, 'Comment', { max: COMMENT_MAX, required: true })
        .split('\n').map((line) => line.trim()).join('\n').replace(/\n{3,}/g, '\n\n');

    const word = offensiveWord(comment);
    if (word) {
        throw new ApiError(400, `Please keep the review free of offensive language ("${word}")`);
    }

    // the review is shown under the account's name
    if (offensiveWord(req.user.name)) {
        throw new ApiError(400, "Your account name cannot be shown with a review");
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

    forgetList();

    return res.status(200).json(
        new ApiResponse(200, { review: { rating: review.rating, comment: review.comment } }, existed ? "Your review was updated" : "Thank you for your review")
    );
});

const removeMyReview = asyncHandler(async (req, res) => {
    await Review.deleteOne({ user: req.user._id });
    forgetList();

    return res.status(200).json(new ApiResponse(200, {}, "Your review was removed"));
});

export { listReviews, getMyReview, saveMyReview, removeMyReview }
