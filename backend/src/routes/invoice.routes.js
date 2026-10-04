import { Router } from "express";
import { requireVerified, verifyJwt } from '../middlewares/auth.middleware.js'
import { writeLimiter } from '../middlewares/rateLimit.middleware.js'
import {
    changeStatus, createInvoice, deleteInvoice, duplicateInvoice, getInvoice, listInvoices, updateInvoice,
} from "../controllers/invoice.controller.js";

const router = Router();

// reading needs a login; changing anything needs a verified address as well
router.use(verifyJwt);

router.route('/')
    .get(listInvoices)
    .post(requireVerified, writeLimiter, createInvoice);

router.route('/:id')
    .get(getInvoice)
    .put(requireVerified, writeLimiter, updateInvoice)
    .delete(requireVerified, writeLimiter, deleteInvoice);

router.route('/:id/duplicate').post(requireVerified, writeLimiter, duplicateInvoice);
router.route('/:id/status').patch(requireVerified, writeLimiter, changeStatus);


export default router;
