import React, { useState, useRef } from "react";
import html2pdf from "html2pdf.js";
import logo from "../assets/invoisify.png";
import Navbar from "../components/Navbar";
import axios from "axios";
import { useAlert } from "../hooks/useAlert";


const InvoicePreview = () => {

    const [AlertComponent, showAlert] = useAlert();

    const componentRef = useRef();
    const [formData, setFormData] = useState({
        companyName: "",
        companyEmail: "",
        companyAddress: "",
        companyLogo: "",
        customerName: "",
        customerAddress: "",
        additionalNotes: "",
        totalAmount: 0,
        issueDate: new Date().toISOString().split("T")[0],
        paidDate: "2024-12-10",
        dueDate: new Date().toISOString().split("T")[0],
        status: "",
        items: [
            { description: "", quantity: 1, rate: 1 },

        ],
    });

    const formatDate = (isoDate, separator = " ") => {
        const [year, month, day] = isoDate.split("-");
        return `${day}${separator}${month}${separator}${year}`;
    };


    const issueDateISO = new Date().toISOString().split("T")[0];
    const dueDateISO = new Date(new Date().setDate(new Date().getDate() + 7))
        .toISOString()
        .split("T")[0];


    const formattedIssueDate = formatDate(issueDateISO, "-");
    const formattedDueDate = formatDate(dueDateISO, "-");


    const generateAndSavePDF = () => {
        console.log("Attempting to generate PDF");
        const options = {
            filename: `${formData.customerName}_invoice.pdf`,
            html2canvas: { scale: 2 },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        };

        if (componentRef.current) {
            html2pdf()
                .from(componentRef.current)
                .set(options)
                .save()
                .catch((error) => console.error("PDF generation error:", error));
        } else {
            console.error("componentRef is null or undefined");
        }
    };

    // const handleSubmit = async (e) => {
    //     e.preventDefault();
    //     try {
    //         const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/v1/invoice/create-invoice`, formData);
    //         showAlert('Invoice created successfully:' || response.data, 'success');
    //     } catch (error) {
    //         console.log('Error creating invoice:', error);
    //         showAlert('Error creating invoice:' || error, 'error');
    //     }
    // };
    const handleUpload = async (e) => {
        e.preventDefault();
        if (!formData.companyLogo) {
            alert(" Please select a file to upload");
            return;
        }

        const form = new FormData();
        form.append("companyLogo", formData.companyLogo); 
        form.append("companyName", formData.companyName); 
        form.append("companyEmail", formData.companyEmail); 
        form.append("companyAddress", formData.companyAddress); 
        form.append("customerName", formData.customerName); 
        form.append("customerAddress", formData.customerAddress); 
        form.append("additionalNotes", formData.additionalNotes); 
        form.append("totalAmount", formData.totalAmount); 
        form.append("issueDate", formData.issueDate); 
        form.append("paidDate", formData.paidDate);
        form.append("dueDate", formData.dueDate); 
        form.append("status", formData.status); 
        form.append("items", formData.items); 

        try {
            // setLoading(true);
            const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/v1/invoice/create-invoice`, formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data", // Telling Axios we are sending form data
                    },
                    // withCredentials: true, // Include credentials (cookies) with the request
                }
            );
            if(response.status === 200)
            showAlert("Video uploaded successfully!", 'success');
           
        } catch (error) {
            // const errorMessage = handleAxiosError(error);
            showAlert("Error uploading video:" || error,'error');
        } finally {
            // setLoading(false);
        }
    };

    const handleInputChange = (event) => {
        const { name, value, files } = event.target;

        if (name === 'customerLogo' && files) {

            setFormData((prevData) => ({
                ...prevData,
                companyLogo: files[0],
            }));
        } else {

            setFormData((prevData) => ({
                ...prevData,
                [name]: value,
            }));
        }
    };


    const handleItemChange = (index, field, value) => {
        const updatedItems = [...formData.items];
        updatedItems[index][field] = value;
        setFormData({ ...formData, items: updatedItems });
    };

    const clearAllItems = () => {
        setFormData({ ...formData, items: [] });
    };

    const addNewItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { description: "", quantity: 0, rate: 0 }],
        });
    };

    const calculateTotal = () => {
        return formData.items.reduce(
            (total, item) => total + item.quantity * item.rate,
            0
        );
    };

    return (
        <>
            <Navbar activePage="Invoices" />
            <AlertComponent />
            <main className="p-5 max-w-5xl mx-auto">
                {/* Editable Form */}
                <section className="mb-6 bg-gray-100 p-5 rounded-lg">
                    <h2 className="text-lg font-semibold mb-4">Edit Invoice Details</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input
                            type="text"
                            name="companyName"
                            value={formData.companyName}
                            onChange={handleInputChange}
                            placeholder="Company Name"
                            className="p-2 border bg-white rounded"
                        />
                        <input
                            type="text"
                            name="companyAddress"
                            value={formData.companyAddress}
                            onChange={handleInputChange}
                            placeholder="Company Address"
                            className="p-2 border rounded bg-white"
                        />
                        <input
                            type="email"
                            name="companyEmail"
                            value={formData.companyEmail}
                            onChange={handleInputChange}
                            placeholder="Company Email"
                            className="p-2 border rounded bg-white"
                        />
                        <input
                            type="text"
                            name="customerName"
                            value={formData.customerName}
                            onChange={handleInputChange}
                            placeholder="Customer Name"
                            className="p-2 border rounded bg-white"
                        />
                        <input
                            type="text"
                            name="customerAddress"
                            value={formData.customerAddress}
                            onChange={handleInputChange}
                            placeholder="Customer Address"
                            className="p-2 border rounded bg-white"
                        />

                        <div className="flex items-center justify-between ">
                            <label for="dueDate" className="text-md px-2 w-1/3 font-semibold">Due Date:</label>
                            <input
                                type="date"
                                name="dueDate"
                                value={formData.dueDate}
                                onChange={handleInputChange}
                                placeholder="Due Date"
                                className="p-2 border rounded w-2/3 bg-white"
                            />
                        </div>

                        <div className="flex items-center">
                            <label
                                htmlFor="customerLogo"
                                className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                            >
                                Choose Logo
                            </label>
                            <input
                                type="file"
                                id="customerLogo"
                                name="customerLogo"
                                onChange={handleInputChange}
                                className="hidden"
                            />
                            <span className="ml-4 text-gray-600">
                                {formData.companyLogo ? formData.companyLogo.name : 'No file chosen'}
                            </span>
                        </div>





                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleInputChange}
                            placeholder="Remarks"
                            className="p-2 border rounded col-span-1 focus:ring-blue-600 bg-white sm:col-span-2"
                        />
                    </div>
                </section>

                {/* Add New Row Section */}
                <div className="mt-4 bg-gray-100 p-5 rounded-lg mb-6">
                    <h2 className="text-lg font-semibold mb-4">Add New Item</h2>
                    {formData.items.map((item, index) => (
                        <div key={index} className="grid grid-cols-4  gap-4 mb-2">

                            <input
                                type="text"
                                placeholder="Description"
                                value={item.description}
                                onChange={(e) =>
                                    handleItemChange(index, "description", e.target.value)
                                }
                                className="p-2 border bg-white rounded"
                            />
                            <input
                                type="number"
                                placeholder="Quantity"
                                value={item.quantity}
                                onChange={(e) =>
                                    handleItemChange(index, "quantity", e.target.value)
                                }
                                className="p-2 border bg-white rounded"
                            />
                            <input
                                type="number"
                                placeholder="Rate"
                                value={item.rate}
                                onChange={(e) => handleItemChange(index, "rate", e.target.value)}
                                className="p-2 border bg-white rounded"
                            />
                        </div>
                    ))}
                    <button
                        onClick={addNewItem}
                        className="bg-green-500 text-white font-bold py-2 px-4 rounded hover:bg-green-600 transition-all duration-150"
                    >
                        Add New Row
                    </button>
                    <button
                        className="bg-red-500 text-white font-bold py-2 px-4 sm:px-8 rounded hover:bg-red-600 transition-all duration-150 ml-4 mt-4"
                        onClick={clearAllItems}
                    >
                        Clear All Items
                    </button>
                </div>

                {/* Invoice Preview */}
                <div
                    ref={componentRef}
                    className="invoice__preview bg-white p-5 rounded-2xl border-4 border-blue-200"
                >
                    <header className="text-center border-b pb-4 mb-4">
                        <img
                            src={formData.companyLogo ? URL.createObjectURL(formData.companyLogo) : logo}
                            alt="Company Logo"
                            className="mx-auto mb-2 w-48 h-24 sm:w-32 sm:h-32"

                        />
                        <h1 className="text-xl sm:text-2xl font-bold">{formData.companyName}</h1>
                        <p className="text-sm sm:text-base">{formData.address}</p>
                        <p className="text-sm sm:text-base">{formData.email}</p>
                    </header>

                    <section className="mb-4">
                        <h2 className="text-base sm:text-lg font-semibold">Invoice To:</h2>
                        <div className="flex justify-between">
                            <p className="text-sm sm:text-base">{formData.customerName}</p>
                            <p className="text-sm sm:text-base">Issue Date: {formattedIssueDate}</p>
                        </div>
                        <div className="flex justify-between">
                            <p className="text-sm sm:text-base">{formData.customerAddress}</p>
                            <p className="text-sm sm:text-base">Due Date: {formattedDueDate}</p>
                        </div>
                    </section>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse border text-sm sm:text-base">
                            <thead>
                                <tr className="bg-gray-200 text-center">
                                    <th className="border px-2 sm:px-4 py-2">Description</th>
                                    <th className="border px-2 sm:px-4 py-2" align="center">Quantity</th>
                                    <th className="border px-2 sm:px-4 py-2">Rate</th>
                                    <th className="border px-2 sm:px-4 py-2">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.items.map((item, index) => (
                                    <tr key={index}>
                                        <td className="border px-2 sm:px-4 py-2">{item.description}</td>
                                        <td className="border px-2 sm:px-4 py-2 text-center">
                                            {item.quantity}
                                        </td>
                                        <td className="border px-2 sm:px-4 py-2 text-right">
                                            {item.rate}
                                        </td>
                                        <td className="border px-2 sm:px-4 py-2 text-right">
                                            {item.quantity * item.rate}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td
                                        colSpan="3"
                                        className="border px-2 sm:px-4 py-2 text-right font-bold"
                                    >
                                        Total
                                    </td>
                                    <td className="border px-2 sm:px-4 py-2 text-right font-bold">
                                        {calculateTotal()}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <section className="mt-4">
                        <h2 className="text-base sm:text-lg font-semibold">Remarks</h2>
                        <p className="text-sm sm:text-base">{formData.notes}</p>
                    </section>
                </div>



                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-end mt-4 p-2 gap-2">
                    <button className="bg-green-500 text-white font-bold py-2 px-4 sm:px-8 rounded hover:bg-green-600 transition-all duration-150" onClick={handleUpload}>
                        Save
                    </button>
                    <button
                        className="bg-blue-500 text-white font-bold py-2 px-4 sm:px-8 rounded hover:bg-blue-600 transition-all duration-150"
                        onClick={generateAndSavePDF}
                    >
                        Download
                    </button>
                    <button className="bg-orange-500 text-white font-bold py-2 px-4 sm:px-8 rounded hover:bg-orange-600 transition-all duration-150">
                        Send
                    </button>
                </div>
            </main>
        </>
    );
};

export default InvoicePreview;
