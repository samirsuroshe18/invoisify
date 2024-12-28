import React, { useEffect, useState } from "react";
import axios from "axios";

const Invoices = ({ onSelectTemplate }) => {
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await axios.get(`${import.meta.url.VITE_BASE_URL}/api/v1/template/get-invoice`);
        setTemplates(response.data);
      } catch (error) {
        console.error("Error fetching templates:", error);
      }
    };
    fetchTemplates();
  }, []);

  return (
    <div className="bg-gray-100 min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">My Templates</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map((template) => (
            <div
              key={template._id}
              className="bg-white p-4 rounded-md shadow-md"
            >
              <h2 className="text-xl font-bold">{template.name}</h2>
              <p>{template.description}</p>
              <button
                className="mt-4 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md"
                onClick={() => onSelectTemplate(template)}
              >
                Select Template
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Invoices;
