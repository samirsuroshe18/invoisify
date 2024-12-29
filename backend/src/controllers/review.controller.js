import { Review } from '../models/review.model.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asynchandler.js';

export const createReview = asyncHandler(async (req, res) => {

    const { name, rating, comment } = req.body;

    console.log(req.body);

    if (!name || !rating || !comment) {
        throw new ApiError(400, 'User ID, Product ID, and Rating are required');
    }


    const review = await Review.create({
        name,
        rating: Number(rating),
        comment,
    });



    return res.status(201).json(new ApiResponse(201, 'Review created successfully', review));
});

export const getReviews = asyncHandler(async (req, res) => {
    const reviews = await reviweModel.find({});

    res.json(new ApiResponse(200, reviews));
});

export default { createReview, getReviews };