import { Invoice } from '../models/invoice.model.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
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
        paidDate,
        dueDate,
        status,
        items,
    } = req.body;

    const file = req.file.path;
    console.log(file);

    // Log request body for debugging
    console.log("Request body:", req.body);
    const path = await uploadOnCloudinary(file);
    console.log(path?.url);
    console.log(`Company Name: ${companyName}`);
    console.log(`Company Email: ${companyEmail}`);
    console.log(`Company Address: ${companyAddress}`);
    console.log(`Company Logo: ${path.url}`);
    console.log(`Customer Name: ${customerName}`);
    console.log(`Customer Address: ${customerAddress}`);
    console.log(`Notes: ${additionalNotes}`);
    console.log(`Total amt:  ${Number(totalAmount)}`);
    console.log(`Issue Date:  ${new Date(issueDate)}`);
    console.log(`Due date:  ${new Date(dueDate)}`);
    console.log(`Paid date:  ${new Date(paidDate)}`);
    console.log(`Status:  ${status}`);
    console.log(`Items:  ${items}`);

    // Create invoice in the database
    const newInvoice = await Invoice.create({
        companyName,
        companyEmail,
        companyAddress,
        companyLogo: path?.url,
        customerName,
        customerAddress,
        additionalNotes,
        totalAmount : Number(totalAmount),
        issueDate: new Date(issueDate), // Convert to Date object
        paidDate: paidDate ? new Date(paidDate) : undefined, // Optional
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