import {Router} from "express";
import { callback, loginFailure, loginSuccess } from "../controllers/oauth.controller.js";
import passport from "passport";

const router = Router();

router.route('/google/callback').get(passport.authenticate("google", {
    failureRedirect: "/api/v1/oauth/login/failure",
    successRedirect: "/api/v1/oauth/login/success"
}), callback);

router.route('/login/failure').get(loginFailure);
router.route('/login/success').get(loginSuccess);

export default router;