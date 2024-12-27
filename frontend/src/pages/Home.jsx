import React from "react";
import { useSpring, animated } from "react-spring";
import { FaArrowDown } from "react-icons/fa";
import { Link } from "react-scroll"; //smooth scrolling
import logo from "../assets/receipt.png"; 
import AOS from "aos";
import "aos/dist/aos.css";
import bgImg from '../assets/invoice-bg.png';
import Navbar from "../components/Navbar";

AOS.init();

const Home = () => {

  const heroText = useSpring({
    opacity: 1,
    from: { opacity: 0 },
    delay: 500,
  });

  return (
    <div className="bg-gray-900 text-white ">
      <Navbar/>
      {/* <nav className="flex items-center justify-between px-6 py-4 bg-gray-900 font-inknut">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Logo" className="h-10 w-auto" />
          <span className="text-3xl font-bold">Invoisify</span>
        </div>
        <ul className="hidden md:flex gap-8">
          <li className="cursor-pointer hover:text-gray-400">Home</li>
          <li className="cursor-pointer hover:text-gray-400">Invoices</li>
          <li className="cursor-pointer hover:text-gray-400">Help</li>
          <li className="cursor-pointer hover:text-gray-400">Sign Up</li>
        </ul>
        <button className="md:hidden px-4 py-2 bg-blue-600 rounded hover:bg-blue-700">
          Menu
        </button>
      </nav> */}

      
      <header
        className="flex flex-col items-center justify-center text-center py-40 px-4 bg-cover text-gray-900 bg-opacity-50 backdrop-blur-lg rounded-xl bg-center"
        style={{
          backgroundImage: `url(${bgImg})`,
        }}
      >
        <animated.h1
          style={heroText}
          className="text-4xl md:text-6xl font-bold mb-6"
          data-aos="fade-up"
          data-aos-duration="1000"
        >
          Simplify Your Invoicing Process
        </animated.h1>
        <p
          className="text-lg md:text-2xl mb-8"
          data-aos="fade-up"
          data-aos-duration="1200"
        >
          Create, manage, and send professional invoices effortlessly with
          Invoisify.
        </p>
        <button
          className="px-6 py-3 bg-blue-600 rounded hover:bg-blue-700 text-xl"
          data-aos="fade-up"
          data-aos-duration="1400"
        >
          Get Started
        </button>

        
        <Link to="features" smooth={true} duration={500}>
          <div className="mt-8">
            <FaArrowDown className="text-3xl text-gray-900 animate-bounce" />
          </div>
        </Link>
      </header>

      
      <section id="features" className="py-16 px-6">
        <h2
          className="text-3xl font-bold text-center mb-12"
          data-aos="fade-right"
        >
          Why Choose Invoisify?
        </h2>
        <div className="grid md:grid-cols-3 gap-10">
          <div
            className="bg-gray-800 p-6 rounded-lg text-center"
            data-aos="fade-up"
            data-aos-duration="1000"
          >
            <h3 className="text-xl font-semibold mb-4">Customizable Invoices</h3>
            <p>
              Create personalized invoices with your brand logo and details.
            </p>
          </div>
          <div
            className="bg-gray-800 p-6 rounded-lg text-center"
            data-aos="fade-up"
            data-aos-duration="1200"
          >
            <h3 className="text-xl font-semibold mb-4">Automated Reminders</h3>
            <p>
              Never miss a payment deadline with automated email reminders.
            </p>
          </div>
          <div
            className="bg-gray-800 p-6 rounded-lg text-center"
            data-aos="fade-up"
            data-aos-duration="1400"
          >
            <h3 className="text-xl font-semibold mb-4">Real-Time Insights</h3>
            <p>
              Track your earnings and pending invoices in one place.
            </p>
          </div>
        </div>
      </section>

 
      <section className="bg-blue-600 py-16 px-6 text-center">
        <h2
          className="text-3xl md:text-4xl font-bold mb-6"
          data-aos="zoom-in"
        >
          Ready to Get Started?
        </h2>
        <p
          className="text-lg md:text-xl mb-8"
          data-aos="zoom-in"
          data-aos-delay="200"
        >
          Join thousands of professionals using Invoisify to streamline their
          invoicing process.
        </p>
        <Link to="/register">
          <button
            className="px-8 py-3 bg-gray-800 rounded hover:bg-gray-700 text-white text-xl"
            data-aos="zoom-in"
            data-aos-delay="400"
          >
            Sign Up for Free
          </button>
        </Link>
      </section>


      <footer className="py-6 bg-gray-800 text-center">
        <p>&copy; 2024 Invoisify. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default Home;
