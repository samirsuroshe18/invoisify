import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAlert } from '../hooks/useAlert';
import Navbar from '../components/Navbar';

const History = () => {
    const [AlertComponent, showAlert] = useAlert();
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        
        const fetchHistory = async () => {
            try {
                const response = await axios.get(
                    'http://localhost:3000/api/v1/history'
                );
                if (response.status >= 200 && response.status < 300) {
                    setHistoryData(response.data.history); 
                } else {
                    showAlert('Failed to fetch invoice history');
                }
            } catch (error) {
                setError(error.response?.data?.message || error.message);
                showAlert(error.response?.data?.message || error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    return (
        <>
        <Navbar activePage="History"/>
        <div className="p-5 max-w-5xl mx-auto">
            <AlertComponent />
            <h2 className="text-2xl font-semibold mb-4">Invoice History</h2>
            {loading ? (
                <div className="text-center text-lg">Loading...</div>
            ) : error ? (
                <div className="text-center text-red-500">{error}</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border text-sm sm:text-base">
                        <thead>
                            <tr className="bg-gray-200 text-center">
                                <th className="border px-2 sm:px-4 py-2">Invoice ID</th>
                                <th className="border px-2 sm:px-4 py-2">Customer</th>
                                <th className="border px-2 sm:px-4 py-2">Amount</th>
                                <th className="border px-2 sm:px-4 py-2">Issue Date</th>
                                <th className="border px-2 sm:px-4 py-2">Due Date</th>
                                <th className="border px-2 sm:px-4 py-2">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historyData.map((invoice) => (
                                <tr key={invoice.id}>
                                    <td className="border px-2 sm:px-4 py-2">{invoice.id}</td>
                                    <td className="border px-2 sm:px-4 py-2">{invoice.customerName}</td>
                                    <td className="border px-2 sm:px-4 py-2 text-right">{invoice.totalAmount}</td>
                                    <td className="border px-2 sm:px-4 py-2 text-center">{invoice.issueDate}</td>
                                    <td className="border px-2 sm:px-4 py-2 text-center">{invoice.dueDate}</td>
                                    <td className="border px-2 sm:px-4 py-2 text-center">
                                        <span className={`text-${invoice.status === 'Paid' ? 'green' : 'red'}-500`}>
                                            {invoice.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
        </>
    );
};

export default History;
