import { Router } from "express";
import { notDemo, verifyJwt } from '../middlewares/auth.middleware.js'
import { accountLimiter, demoLimiter, writeLimiter } from '../middlewares/rateLimit.middleware.js'
import {
    changePassword, demoLogin, forgotPassword, getMe, loginUser, logoutUser, registerUser, resendVerification,
} from "../controllers/user.controller.js";

const router = Router();

// these can send email or test a password, so each visitor gets a limited number of tries
router.route('/register').post(accountLimiter, registerUser);
router.route('/login').post(accountLimiter, loginUser);
router.route('/forgot-password').post(accountLimiter, forgotPassword);
router.route('/demo-login').post(demoLimiter, demoLogin);

// with a login
router.route('/me').get(verifyJwt, getMe);
router.route('/logout').post(verifyJwt, logoutUser);
router.route('/resend-verification').post(verifyJwt, notDemo, accountLimiter, resendVerification);
router.route('/change-password').post(verifyJwt, notDemo, writeLimiter, changePassword);


export default router;
