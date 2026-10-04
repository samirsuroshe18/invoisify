import { Router } from "express";
import { verifyJwt } from '../middlewares/auth.middleware.js'
import { getDashboard } from "../controllers/dashboard.controller.js";

const router = Router();

router.route('/').get(verifyJwt, getDashboard);


export default router;
