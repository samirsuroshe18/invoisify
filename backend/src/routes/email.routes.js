import { Router } from "express";
import { verifyEmailLink, forgotPasswordLink, verifyPassword } from "../controllers/email.controller.js";

const router = Router();

router.route('/verify-email').get(verifyEmailLink)
router.route('/reset-password').get(forgotPasswordLink)
router.route('/verify-password').post(verifyPassword)


export default router;