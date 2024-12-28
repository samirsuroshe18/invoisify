import React, { useEffect } from 'react';
import Typed from 'typed.js';
import { FaCheckCircle, FaCog, FaFileInvoice, FaArrowDown } from 'react-icons/fa';
import { Link } from 'react-scroll';
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
    new Typed('#typed-text', options);
  }, []);

  
  const fadeIn = useSpring({
    opacity: 1,
    from: { opacity: 0 },
    config: { duration: 1000 },
  });

  return (
    <section className="relative w-full min-h-screen bg-gray-100">
      <div className="max-w-screen-xl mx-auto px-8 py-16 relative z-10" id="features">
        <animated.div style={fadeIn} className="text-center space-y-6 mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-800">
            Our Key Features
          </h1>
          <p className="text-lg text-gray-600">
            <span id="typed-text"></span>
          </p>
        </animated.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          
          <div className="bg-white p-6 rounded-lg shadow-lg text-center hover:shadow-2xl transition duration-300">
            <div className='flex justify-center items-center'>
                <FaFileInvoice className="text-blue-600 text-4xl mb-4" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Invoice Creation</h3>
            <p className="text-gray-600 mb-4">
              Quickly generate and send professional invoices to your clients.
            </p>
            <Link
              to="/features"
              smooth={true}
              offset={-70}
              duration={500}
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition no-underline duration-300"
            >
              Learn More
            </Link>
          </div>

          
          <div className="bg-white p-6 rounded-lg shadow-lg text-center hover:shadow-2xl transition duration-300">
            <div className='flex justify-center items-center'>
                <FaCheckCircle className="text-green-600 text-4xl mb-4" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Track Payments</h3>
            <p className="text-gray-600 mb-4">
              Stay on top of your finances by tracking payments and invoice statuses.
            </p>
            <Link
              to="features"
              smooth={true}
              offset={-70}
              duration={500}
              className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition no-underline duration-300"
            >
              Learn More
            </Link>
          </div>

         
          <div className="bg-white p-6 rounded-lg shadow-lg text-center hover:shadow-2xl transition duration-300">
            <div className='flex justify-center items-center'>
                <FaCog className="text-gray-600 text-4xl mb-4" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Custom Settings</h3>
            <p className="text-gray-600 mb-4">
              Personalize your invoicing experience with custom settings and preferences.
            </p>
            <Link
              to="features"
              smooth={true}
              offset={-70}
              duration={500}
              className="inline-block px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition no-underline duration-300"
            >
              Learn More
            </Link>
          </div>
        </div>

        
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2">
          <Link to="home" smooth={true} offset={-70} duration={500}>
            <div className="text-center text-blue-600">
              {/* <FaArrowDown className="text-3xl animate-bounce" /> */}
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Features;
