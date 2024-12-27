import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Invoices = () => {
  const [invoices, setInvoices] = useState([
    {
      id: 1,
      companyName: 'TANISHQ Jewellers.',
      subtitle: 'Invoice for India`s Top Brand',
      logo: 'https://via.placeholder.com/100', // Placeholder for logo
      preview: 'https://via.placeholder.com/150', // Placeholder for preview
    },
    {
      id: 2,
      companyName: 'Riot Games Inc.',
      subtitle: 'Invoice for Champions 3.0 Bundle',
      logo: 'https://via.placeholder.com/100',
      preview: 'https://via.placeholder.com/150',
    },
  ]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center py-10">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl p-6 bg-gray-800 rounded-lg shadow-lg"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">My Invoices</h2>
          <Link to="/design-invoice">
            <button className="px-6 py-3 bg-blue-600 rounded hover:bg-blue-700 text-white transition duration-200">
              Design New
            </button>
          </Link>
        </div>

        <div className="space-y-6">
          {invoices.map((invoice) => (
            <motion.div
              key={invoice.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex justify-between items-center bg-gray-700 p-4 rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <img
                  src={invoice.logo}
                  alt="Company Logo"
                  className="w-12 h-12 object-cover rounded-full"
                />
                <div>
                  <h3 className="text-lg font-semibold">{invoice.companyName}</h3>
                  <p className="text-sm text-gray-400">{invoice.subtitle}</p>
                </div>
              </div>
              <div className="w-24 h-24 bg-gray-600 rounded-lg overflow-hidden">
                <img
                  src={invoice.preview}
                  alt="Invoice Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Invoices;
