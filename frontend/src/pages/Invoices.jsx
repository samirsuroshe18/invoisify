import React, { useEffect, useState } from "react";
import axios from "axios";

const Invoices = ({ onSelectTemplate }) => {
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await axios.get("/api/templates");
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
              key={template.id}
              className="bg-white shadow-lg rounded-lg p-6"
              onClick={() => onSelectTemplate(template)}
            >
              <h2 className="text-lg font-semibold">{template.companyName}</h2>
              <p className="text-gray-700">{template.billingAddress}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Invoices;
