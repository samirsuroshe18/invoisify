import React, { useState } from "react";
import axios from "axios";

const InvoiceDesigner = () => {
  const [template, setTemplate] = useState({
    companyName: "",
    billingAddress: "",
    backgroundColor: "#ffffff",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTemplate({ ...template, [name]: value });
  };

  const handleSaveTemplate = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_BASE_URL}/api/v1/template/create-invoice`, template);
      alert("Template saved successfully!");
    } catch (error) {
      console.error("Error saving template:", error);
      alert("Failed to save template.");
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen p-8">
      <div className="bg-white shadow-lg rounded-lg p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Invoice Designer</h1>
        <div className="mb-4">
          <label className="block font-medium mb-1">Company Name</label>
          <input
            type="text"
            name="companyName"
            value={template.companyName}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <div className="mb-4">
          <label className="block font-medium mb-1">Billing Address</label>
          <textarea
            name="billingAddress"
            value={template.billingAddress}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border rounded-lg"
          ></textarea>
        </div>
        <div className="mb-4">
          <label className="block font-medium mb-1">Background Color</label>
          <input
            type="color"
            name="backgroundColor"
            value={template.backgroundColor}
            onChange={handleInputChange}
            className="w-16 h-10 border rounded-lg"
          />
        </div>
        <button
          onClick={handleSaveTemplate}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg"
        >
          Save Template
        </button>
      </div>
    </div>
  );
};

export default InvoiceDesigner;
