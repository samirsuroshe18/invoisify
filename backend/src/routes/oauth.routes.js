import {Router} from "express";
import { googleLogin } from "../controllers/oauth.controller.js";

const router = Router();

router.route('/google-login').post(googleLogin);

export default router;