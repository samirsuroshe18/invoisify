import { Router } from "express";
import { publicLimiter } from '../middlewares/rateLimit.middleware.js'
import { getPublicInvoice } from "../controllers/share.controller.js";
import ApiError from '../utils/ApiError.js';

const router = Router();

// open to everyone who has the link of an invoice
router.route('/invoices/:code').get(publicLimiter, getPublicInvoice);
router.route('/invoices').get(publicLimiter, (req, res, next) => next(new ApiError(404, "This invoice is not available")));


export default router;
