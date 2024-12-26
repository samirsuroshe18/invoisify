import {Router} from "express";
import { changeCurrentPassword, forgotPassword, getCurrentUser, loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route('/register').post(registerUser);
router.route('/login').post(loginUser);
router.route('/forgot-password').post(forgotPassword);

//Secure routes
router.route('/logout').get(verifyJwt, logoutUser);
router.route('/change-password').post(verifyJwt, changeCurrentPassword);
router.route('/get-current-user').get(verifyJwt, getCurrentUser); 

export default router;