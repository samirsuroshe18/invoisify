import { Router } from "express";
import { createReview,  getReviews,  } from "../controllers/review.controller.js";


const router = Router();

router.route('/create-review').post(createReview);
router.route('/get-reviews').get(getReviews);

export default router;