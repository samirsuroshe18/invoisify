import { Router } from "express";
import { notDemo, requireVerified, verifyJwt } from '../middlewares/auth.middleware.js'
import { reviewsLimiter, writeLimiter } from '../middlewares/rateLimit.middleware.js'
import { getMyReview, listReviews, removeMyReview, saveMyReview } from "../controllers/review.controller.js";

const router = Router();

// open to everyone: the landing page shows the reviews
router.route('/').get(reviewsLimiter, listReviews);

// one review for each user; the demo account is shared, so it writes none
router.route('/mine')
    .get(verifyJwt, getMyReview)
    .put(verifyJwt, requireVerified, notDemo, writeLimiter, saveMyReview)
    .delete(verifyJwt, requireVerified, notDemo, writeLimiter, removeMyReview);


export default router;
