import { Invoice } from '../models/invoice.model.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asynchandler.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';

const createInvoice = asyncHandler(async (req, res) => {
    const {
        companyName,
        companyEmail,
        companyAddress,
        customerName,
        customerAddress,
        additionalNotes,
        totalAmount,
        issueDate,
        dueDate,
        items,
    } = req.body;
    
    console.log(`totalAmount: ${totalAmount}`);
    const productItems = JSON.parse(items);

    if (!Array.isArray(productItems)) {
        throw new ApiError(400, "Item must be an array");
    }
    
    const file = req.file.path;
    const path = await uploadOnCloudinary(file);
    
    if (!path?.url) {
        throw new ApiError(500, "Failed to upload company logo");
    }

    // Create invoice in the database
    const newInvoice = await Invoice.create({
        createdBy: req.user._id,
        companyName,
        companyEmail,
        companyAddress,
        companyLogo: path.url,
        customerName,
        customerAddress,
        additionalNotes,
        totalAmount: Number(totalAmount),
        issueDate,
        dueDate,
        items: productItems,
    });

    if (!newInvoice) {
        throw new ApiError(500, "Something went wrong while creating the invoice");
    }

    return res.status(200).json(
        new ApiResponse(200, newInvoice, "Invoice created successfully")
    );
});

export { createInvoice };