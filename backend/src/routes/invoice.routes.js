import { Router } from "express";
import { createInvoice } from "../controllers/invoice.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route('/create-invoice').post(verifyJwt, upload.single("companyLogo"),  createInvoice);

export default router;
