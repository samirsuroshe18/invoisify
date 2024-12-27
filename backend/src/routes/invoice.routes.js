import { Router } from "express";
import { createInvoice } from "../controllers/invoice.controller.js";

const router = Router();

router.route('/createinvoice').post(createInvoice);

export default router;