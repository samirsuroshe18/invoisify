import {Router} from "express";
import {check} from "../controllers/user.controller.js";

const router = Router();

router.route('/check').get(check);

export default router;