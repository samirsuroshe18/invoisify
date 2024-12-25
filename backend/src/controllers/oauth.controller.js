import asyncHandler from '../utils/asynchandler.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/ApiResponse.js';

const callback = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApiResponse(200, {}, "Callback is Working fine!")
    )
});

const loginFailure = asyncHandler(async (req, res) => {
    throw new ApiError(401, "Login Failed");
});

const loginSuccess = asyncHandler(async (req, res) => {
    if (!req.user) {
        throw new ApiError(401, "User Not Authenticated");
    }

    const option = {
        httpOnly: 'true' === process.env.HTTP_ONLY,
        secure: 'true' === process.env.COOKIE_SECURE,
        maxAge: Number(process.env.COOKIE_MAX_AGE),
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Successfully logged in")
    )
});

export {
    callback,
    loginFailure,
    loginSuccess
}