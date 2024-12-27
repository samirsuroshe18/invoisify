import {Template} from "../models/template.model.js"; 
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asynchandler.js';


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

export { createTemplate, getTemplates };