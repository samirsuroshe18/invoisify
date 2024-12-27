// routes/invoiceRoutes.js
import express from "express";
import {createTemplate,getTemplates,} from "../controllers/template.controller.js";

const router = express.Router();

// Route to create a new invoice
router.post("/create-invoice", createTemplate);

// Route to get all invoices
router.get("/get-invoice", getTemplates);



export default router;
