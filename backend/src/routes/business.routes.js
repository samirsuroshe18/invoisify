import { Router } from "express";
import { requireVerified, verifyJwt } from '../middlewares/auth.middleware.js'
import { acceptImage } from '../middlewares/upload.middleware.js'
import { writeLimiter } from '../middlewares/rateLimit.middleware.js'
import { getBusiness, saveBusiness } from "../controllers/business.controller.js";

const router = Router();

router.use(verifyJwt);

router.route('/')
    .get(getBusiness)
    .put(requireVerified, writeLimiter, acceptImage('logo'), saveBusiness);


export default router;
