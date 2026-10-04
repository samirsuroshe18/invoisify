import { Router } from "express";
import { accountLimiter } from '../middlewares/rateLimit.middleware.js'
import { checkResetToken, setNewPassword, verifyEmail } from "../controllers/verify.controller.js";

const router = Router();

// the links that arrive by email; the pages of the web app call these
router.route('/verify-email').get(accountLimiter, verifyEmail);
router.route('/reset-password').get(accountLimiter, checkResetToken).post(accountLimiter, setNewPassword);


export default router;
