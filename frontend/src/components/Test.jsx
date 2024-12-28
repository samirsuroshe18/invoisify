import React from 'react'

const Test = () => {
  return (
    <div>
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

                    <div>
                        <table className="max-w-40 border-collapse border">
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
                                        <td className="border px-4 py-2"><input type="text" value={item.description} onChange={(e) => handleItemChange(index, "description", e.target.value)} /></td>
                                        <td className="border px-4 py-2"><input type="number" value={item.quantity} onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value) || 0)} /></td>
                                        <td className="border px-4 py-2"><input type="text" value={item.rate} onChange={(e) => handleItemChange(index, "rate", parseFloat(e.target.value) || 0)} /></td>
                                        <td className="border px-4 py-2 text-right">
                                            {item.quantity * item.rate}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>

                        </table>
                    </div>
                </div>
            </div>
        </section>
    </div>
  )
}

export default Test