import {Invoice} from '../models/invoice.model.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

const createInvoice = asyncHandler(async (req, res) => {
    const { companyName, logo, address, totalAmount, customerName, issueDate, dueDate, paidDate, status } = req.body;

    if (!companyName?.trim() || !logo?.trim() || !address?.trim() || !totalAmount || !customerName?.trim() || !issueDate || !dueDate || !status?.trim()) {
        throw new ApiError(400, "All fields are required");
    }

    const newInvoice = await Invoice.create({
        companyName,
        logo,
        address,
        totalAmount,
        customerName,
        issueDate,
        dueDate,
        paidDate,
        status
    }); // Add closing parenthesis here

    if (!newInvoice) {
        throw new ApiError(500, "Something went wrong");
    }

    return res.status(201).json(
        new ApiResponse(201, newInvoice, "Invoice created successfully")
    );

    const createTemplate = asyncHandler(async (req, res) => {
        const { companyName, billingAddress, backgroundColor } = req.body;
        
        if (!companyName?.trim() || !billingAddress?.trim() || !backgroundColor?.trim()) {
            throw new ApiError(400, "All fields are required");
        }
        
        const newTemplate = await Template.create({
            companyName,
            billingAddress,
            backgroundColor,
        });
        
        if (!newTemplate) {
            throw new ApiError(500, "Something went wrong");
        }
        
        return res.status(201).json(
            new ApiResponse(201, newTemplate, "Template created successfully")
        );
    });
    
    const getTemplates = asyncHandler(async (req, res) => {
        const templates = await Template.find();
        
        return res.status(200).json(
            new ApiResponse(200, templates, "Templates retrieved successfully")
        );
    })

});

export { createInvoice, createTemplate, g };