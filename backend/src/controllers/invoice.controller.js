import { Invoice } from '../models/invoice.model.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

const createInvoice = asyncHandler(async (req, res) => {
    const {
        companyName,
        companyEmail,
        companyAddress,
        companyLogo,
        customerName,
        customerAddress,
        additionalNotes,
        totalAmount,
        issueDate,
        paidDate,
        dueDate,
        status,
        items,
    } = req.body;

    // Log request body for debugging
    console.log("Request body:", req.body);

    // Ensure required fields are present
    const requiredFields = [
        companyName,
        companyLogo,
        companyAddress,
        totalAmount,
        customerName,
        issueDate,
        dueDate,
        status,
    ];

    const areFieldsValid = requiredFields.every(field =>
        field !== undefined &&
        field !== null &&
        (typeof field !== 'string' || field.trim() !== '')
    );

    if (!areFieldsValid) {
        throw new ApiError(400, "All required fields must be provided and non-empty");
    }

    // Check if `items` array is valid
    if (!Array.isArray(items) || items.length === 0) {
        throw new ApiError(400, "At least one item is required");
    }

    const validItems = items.every(item =>
        item.description && item.quantity > 0 && item.rate > 0
    );

    if (!validItems) {
        throw new ApiError(400, "Each item must have a valid description, quantity, and rate");
    }

    // Create invoice in the database
    const newInvoice = await Invoice.create({
        companyName,
        companyEmail,
        companyAddress,
        companyLogo,
        customerName,
        customerAddress,
        additionalNotes,
        totalAmount,
        issueDate: new Date(issueDate), // Convert to Date object
        paidDate: paidDate ? new Date(paidDate) : null, // Optional
        dueDate: new Date(dueDate),
        status,
        items,
    });

    if (!newInvoice) {
        throw new ApiError(500, "Something went wrong while creating the invoice");
    }

    return res.status(201).json(
        new ApiResponse(201, newInvoice, "Invoice created successfully")
    );
});

export { createInvoice };