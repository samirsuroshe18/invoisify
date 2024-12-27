import React, { useState, useRef } from "react";
import html2pdf from "html2pdf.js";
import { jsPDF } from "jspdf";

const InvoicePreview = () => {
    const componentRef = useRef();

    // Function to generate and save PDF
    const generateAndSavePDF = () => {
        const options = {
            filename: "invoice.pdf",
            html2canvas: { scale: 2 },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        };

        html2pdf()
            .from(componentRef.current)
            .set(options)
            .save();
    };

    const [formData, setFormData] = useState({
        companyName: "Tricodes ",
        address: "7A, 2nd Floor, 80 Feet Road, Koramangala 4th Block, Bangalore",
        email: "tricodes7@gmail.com",
        customerName: "Customer Name",
        customerAddress: "Customer Address",
        invoiceNumber: "INV-0001",
        invoiceDate: "2024-12-27",
        dueDate: "2025-01-05",
        notes: "Thank you for your business!",
        items: [
            { description: "Service/Product 1", quantity: 1, rate: 100 },
            { description: "Service/Product 2", quantity: 2, rate: 150 },
        ],
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const calculateTotal = () => {
        return formData.items.reduce(
            (total, item) => total + item.quantity * item.rate,
            0
        );
    };

    return (
        <>
            <main
                className="m-5 p-5 xl:grid grid-cols-2 gap-10 xl:items-start"
                style={{
                    maxWidth: "1920px",
                    margin: "auto",
                }}
            >
                <section>
                    <div className="bg-white p-5 rounded shadow">
                        <div className="flex flex-col justify-center space-y-4">
                            {/* Input Fields */}
                            <div className="flex flex-col">
                                <label htmlFor="companyLogo">Company Logo</label>
                                <input
                                    type="file"
                                    name="companyLogo"
                                    id="companyLogo"
                                    placeholder="Enter Company Logo"
                                    value={formData.companyLogo}
                                    onChange={handleInputChange}
                                    className="border rounded p-2"
                                />
                            </div>

                            <div className="flex flex-col">
                                <label htmlFor="companyName">Company Name</label>
                                <input
                                    type="text"
                                    name="companyName"
                                    id="companyName"
                                    placeholder="Enter Company Name"
                                    value={formData.companyName}
                                    onChange={handleInputChange}
                                    className="border rounded p-2"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label htmlFor="address">Company Address</label>
                                <input
                                    type="text"
                                    name="address"
                                    id="address"
                                    placeholder="Enter Company Address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    className="border rounded p-2"
                                />
                            </div>

                            <div className="flex flex-col">
                                <label htmlFor="email">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    id="email"
                                    placeholder="Enter Email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="border rounded p-2"
                                />
                            </div>

                            <div className="flex flex-col">
                                <label htmlFor="customerName">Customer Name</label>
                                <input
                                    type="text"
                                    name="customerName"
                                    id="customerName"
                                    placeholder="Enter Customer Name"
                                    value={formData.customerName}
                                    onChange={handleInputChange}
                                    className="border rounded p-2"
                                />
                            </div>

                            <div className="flex flex-col">
                                <label htmlFor="customerAddress">Customer Address</label>
                                <input
                                    type="text"
                                    name="customerAddress"
                                    id="customerAddress"
                                    placeholder="Enter Customer Address"
                                    value={formData.customerAddress}
                                    onChange={handleInputChange}
                                    className="border rounded p-2"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                <div className="invoice__preview bg-white p-5 rounded-2xl border-4 border-blue-200">
                    {/* Printable content */}
                    <div ref={componentRef} className="p-5">
                        <header className="text-center border-b pb-4 mb-4">
                            <img
                                src={formData.companyLogo}
                                alt="Company Logo"
                                className="mx-auto mb-2"
                            />
                            <h1 className="text-2xl font-bold">{formData.companyName}</h1>
                            <p>{formData.address}</p>
                            <p>{formData.email}</p>
                        </header>

                        <section className="mb-4">
                            <h2 className="text-lg font-semibold">Invoice To:</h2>
                            <p>{formData.customerName}</p>
                            <p>{formData.customerAddress}</p>
                        </section>

                        <table className="w-10 border-collapse border">
                            <thead>
                                <tr className="bg-gray-200">
                                    <th className="border px-4 py-2">Description</th>
                                    <th className="border px-4 py-2">Quantity</th>
                                    <th className="border px-4 py-2">Rate</th>
                                    <th className="border px-4 py-2">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.items.map((item, index) => (
                                    <tr key={index}>
                                        <td className="border px-4 py-2">{item.description}</td>
                                        <td className="border px-4 py-2 text-center">{item.quantity}</td>
                                        <td className="border px-4 py-2 text-right">{item.rate}</td>
                                        <td className="border px-4 py-2 text-right">
                                            {item.quantity * item.rate}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan="3" className="border px-4 py-2 text-right font-bold">
                                        Total
                                    </td>
                                    <td className="border px-4 py-2 text-right font-bold">
                                        {calculateTotal()}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>

                        <section className="mt-4">
                            <h2 className="text-lg font-semibold">Remarks</h2>
                            <p>{formData.notes}</p>
                        </section>
                    </div>

                    <div className="flex justify-between mt-4 p-2">
                        <button
                            className="bg-green-500 text-white font-bold py-2 px-8 rounded hover:bg-green-600 transition-all duration-150"

                        >
                            Save
                        </button>
                        <button
                            className="bg-blue-500 text-white font-bold py-2 px-8 rounded hover:bg-blue-600 transition-all duration-150"
                            onClick={generateAndSavePDF}
                        >
                            Download
                        </button>
                        <button
                            className="bg-yellow-500 text-white font-bold py-2 px-8 rounded hover:bg-yellow-600 transition-all duration-150"

                        >
                            Send
                        </button>
                    </div>



                </div>
            </main>
        </>
    );
};

export default InvoicePreview;
