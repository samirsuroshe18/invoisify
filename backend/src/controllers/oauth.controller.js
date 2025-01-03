import asyncHandler from '../utils/asynchandler.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { User } from '../models/user.model.js';

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;

        // when we use save() method is used then all the fields are neccesary so to avoid that we have to pass an object with property {validatBeforeSave:false}
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token");
    }
}

const googleLogin = asyncHandler(async (req, res) => {
    const { name, email, profilePic } = req.body;

    if (!name || !email || !profilePic) {
        throw new ApiError(400, "Please provide all the required fields");
    }

    const existedUser = await User.findOne({ email });

    if (existedUser && existedUser.isGoogleVerified === false) {
        throw new ApiError(409, 'An account with this email already exists.');
    }

    if (!existedUser && existedUser.isGoogleVerified === false) {
        const loggedInUser = await User.create({
            name,
            email,
            profilePic,
            isGoogleVerified: true,
            isVerified: true,
        });

        if (!loggedInUser) {
            throw new ApiError(500, "Something went wrong");
        }
    
        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(loggedInUser._id);

        //option object is created beacause we dont want to modified the cookie to front side
    const option = {
        httpOnly: 'true' === process.env.HTTP_ONLY,
        secure: 'true' === process.env.COOKIE_SECURE,
        maxAge: Number(process.env.COOKIE_MAX_AGE),
    }

    return res.status(200).cookie('accessToken', accessToken, option).cookie('refreshToken', refreshToken, option).json(
        new ApiResponse(200, { loggedInUser, accessToken, refreshToken }, "User logged in sucessully")
    );
    }

    existedUser.name = name;
    existedUser.profilePic = profilePic;
    existedUser.isGoogleVerified = true;

    // when we use save() method is used then all the fields are neccesary so to avoid that we have to pass an object with property {validatBeforeSave:false}
    await existedUser.save({ validateBeforeSave: false });

    if (!existedUser) {
        throw new ApiError(500, "Something went wrong");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(existedUser._id);

    //option object is created beacause we dont want to modified the cookie to front side
    const option = {
        httpOnly: 'true' === process.env.HTTP_ONLY,
        secure: 'true' === process.env.COOKIE_SECURE,
        maxAge: Number(process.env.COOKIE_MAX_AGE),
    }

    return res.status(200).cookie('accessToken', accessToken, option).cookie('refreshToken', refreshToken, option).json(
        new ApiResponse(200, { existedUser, accessToken, refreshToken }, "User logged in sucessully")
    );
});

const profile = asyncHandler(async (req, res) => {
    return res.send(`Welcome ${req.user.displayName}`);
});

export {
    googleLogin,
}