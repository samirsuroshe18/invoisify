import mongoose, { Schema } from "mongoose";

const templateSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  billingAddress: { type: String, required: true },
  backgroundColor: { type: String, required: true },
});

export const Template = mongoose.model("Template",templateSchema);
