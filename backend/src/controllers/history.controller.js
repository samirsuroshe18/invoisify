import asyncHandler from "../utils/asynchandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import {History} from "../models/history.model.js";
import { Invoice } from "../models/invoice.model.js";

const getHistory = asyncHandler(async (req, res) => {
        const history = await Invoice.find({createdBy: req.user._id});

        if (history.length === 0) {
            throw new ApiError(404, 'No history found');
        }

        return res.status(200).json(
            new ApiResponse(200, history, 'History retrieved successfully')
        );
});

export {
    getHistory,
};
