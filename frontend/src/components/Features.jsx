import { useEffect } from 'react';
import Typed from 'typed.js';
import { FaCheckCircle, FaCog, FaFileInvoice } from 'react-icons/fa';
import { useSpring, animated } from 'react-spring';

const Features = () => {
  
  useEffect(() => {
    const options = {
      strings: ['Easily Manage Your Invoices', 'Create Professional Invoices', 'Track Financial Transactions'],
      typeSpeed: 100,
      backSpeed: 50,
      backDelay: 1000,
      startDelay: 500,
      loop: true,
    };
    const typed = new Typed('#typed-text', options);

    return () => typed.destroy();
  }, []);

  
  const fadeIn = useSpring({
    opacity: 1,
    from: { opacity: 0 },
    config: { duration: 1000 },
  });

  return (
    <section className="relative w-full bg-gray-100">
      <div className="max-w-screen-xl mx-auto px-6 py-16 relative z-10" id="features">
        <animated.div style={fadeIn} className="text-center space-y-6 mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-800">
            Our Key Features
          </h1>
          <p className="text-lg text-gray-600">
            <span id="typed-text"></span>
          </p>
        </animated.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center hover:shadow-2xl transition duration-300">
            <div className='flex justify-center items-center'>
                <FaFileInvoice className="text-blue-600 text-4xl mb-4" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Invoice Creation</h3>
            <p className="text-gray-600">
              Fill in your business once, add the items, and the invoice is numbered, totalled and ready as a PDF.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg text-center hover:shadow-2xl transition duration-300">
            <div className='flex justify-center items-center'>
                <FaCheckCircle className="text-green-600 text-4xl mb-4" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Track Payments</h3>
            <p className="text-gray-600">
              Draft, sent, paid: every invoice shows where it stands, and overdue ones are flagged on their own.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg text-center hover:shadow-2xl transition duration-300">
            <div className='flex justify-center items-center'>
                <FaCog className="text-gray-600 text-4xl mb-4" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Your Own Details</h3>
            <p className="text-gray-600">
              Your logo, colour, currency, tax rate and payment details appear on every invoice you make.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
