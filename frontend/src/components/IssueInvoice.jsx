import React, { useState } from "react";
import { jsPDF } from "jspdf";

const IssueInvoice = ({ template }) => {
  const [invoice, setInvoice] = useState({
    "customerName": "",
    "email": "",
    "dueDate": "",
    "amount": "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInvoice({ ...invoice, [name]: value });
  };

  const handleDownload = () => {
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text(`Invoice from ${template.companyName}`, 20, 20);
    doc.text(`Billing Address: ${template.billingAddress}`, 20, 30);
    doc.text(`Customer Name: ${invoice.customerName}`, 20, 40);
    doc.text(`Email: ${invoice.email}`, 20, 50);
    doc.text(`Due Date: ${invoice.dueDate}`, 20, 60);
    doc.text(`Amount: $${invoice.amount}`, 20, 70);
    doc.save("invoice.pdf");
  };

  return (
    <div className="bg-gray-100 min-h-screen p-8">
      <div
        className="bg-white shadow-lg rounded-lg p-6 max-w-3xl mx-auto"
        
      >
        <h1 className="text-2xl font-bold mb-6">Issue Invoice</h1>
        <div className="mb-4">
          <label className="block font-medium mb-1">Customer Name</label>
          <input
            type="text"
            name="customerName"
            value={invoice.customerName}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <div className="mb-4">
          <label className="block font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={invoice.email}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <div className="mb-4">
          <label className="block font-medium mb-1">Due Date</label>
          <input
            type="date"
            name="dueDate"
            value={invoice.dueDate}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <div className="mb-4">
          <label className="block font-medium mb-1">Amount</label>
          <input
            type="number"
            name="amount"
            value={invoice.amount}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <button
          onClick={handleDownload}
          className="bg-green-500 text-white px-6 py-2 rounded-lg"
        >
          Download PDF
        </button>
      </div>
    </div>
  );
};

export default IssueInvoice;
