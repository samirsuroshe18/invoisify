import { Review } from '../models/review.model.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asynchandler.js';

export const createReview = asyncHandler(async (req, res) => {
    const { name, rating, comment } = req.body;

    if (!name || !rating || !comment) {
        throw new ApiError(400, 'User ID, Product ID, and Rating are required');
    }

    const review = await Review.create({
        name,
        rating: Number(rating),
        comment,
    });

    return res.status(201).json(new ApiResponse(200, review, 'Review created successfully'));
});

export const getReviews = asyncHandler(async (req, res) => {
    const reviews = await Review.find({});

    return res.status(200).json(new ApiResponse(200, reviews, 'Reviews retrieved successfully'));
});

export default { createReview, getReviews };