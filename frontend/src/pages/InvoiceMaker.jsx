import React, { useState } from 'react';
import axios from 'axios';

const InvoiceMaker = () => {
    const [invoiceDetails, setInvoiceDetails] = useState({
        "companyName" : "",
        "logo" : "",
        "address" : "",
        "totalAmount" : 0,
        "customerName" : "",
        "issueDate" : "",
        "dueDate" : "",
        "paidDate" : "",
        "paymentStatus" : "",
    });
    
    

    const handleChange = (e) => {
        const { name, value } = e.target;
        setInvoiceDetails({
            ...invoiceDetails,
            [name]: value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/v1/invoice/createinvoice`, invoiceDetails);
            console.log('Invoice created successfully:', response.data);
        } catch (error) {
            console.error('Error creating invoice:', error);
        }
    };

    return (
        <div>
            <h1>Create Invoice</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>company Name:</label>
                    <input
                        type="text"
                        name="companyName"
                        value={invoiceDetails.companyName}
                        onChange={(e)=>handleChange(e)}
                        required
                    />
                </div>
                <div>
                    <label>Logo</label>
                    <input
                        type="text"
                        name="logo"
                        value={invoiceDetails.logo}
                        onChange={(e) => handleChange(e)}
                        required
                    />
                </div>
                <div>
                    <label>Address</label>
                    <input
                        type="text"
                        name="address"
                        value={invoiceDetails.address}
                        onChange={(e) => handleChange(e)}
                        required
                    />
                </div>
                <div>
                    <label>Total Amount</label>
                    <input
                        type="number"
                        name="totalAmount"
                        value={invoiceDetails.totalAmount}
                        onChange={(e) => handleChange(e)}
                        required
                    />
                </div>
                <div>
                    <label>Customer name</label>
                    <input
                        type="text"
                        name="customerName"
                        value={invoiceDetails.customerName}
                        onChange={(e) => handleChange(e)}
                        required
                    />
                </div>
                <div>
                    <label>Issue Date</label>
                    <input
                        type="number"
                        name="issueDate"
                        value={invoiceDetails.issueDate}
                        onChange={(e) => handleChange(e)}
                        required
                    />
                </div>
                <div>
                    <label>Due date:</label>
                    <input
                        type="number"
                        name="dueDate"
                        value={invoiceDetails.dueDate}
                        onChange={(e) => handleChange(e)}
                        required
                    />
                </div>
                <div>
                    <label>Paid date</label>
                    <input
                        type="number"
                        name="paidDate"
                        value={invoiceDetails.paidDate}
                        onChange={(e) => handleChange(e)}
                        required
                    />
                </div>
                <div>
                    <label>Payment Status</label>
                    <input
                        type="text"
                        name="paymentStatus"
                        value={invoiceDetails.paymentStatus}
                        onChange={(e) => handleChange(e)}
                        required
                    />
                </div>
                <button type="submit" className='m-2 p-2 bg-blue-600'>Create Invoice</button>
            </form>
        </div>
    );
};

export default InvoiceMaker;