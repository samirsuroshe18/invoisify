import React, { useState } from "react";
import logo from "../assets/receipt.png";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className=" text-white ml-4 mr-4">
      
      <div className="flex items-center justify-between px-4 py-3">
      
        <div className="flex items-center gap-2">
          <img src={logo} alt="Logo" className="h-10 w-auto" />
          <span className="font-inknut text-white text-3xl">Invoisify</span>
        </div>

       
        <button
          className="block lg:hidden focus:outline-none"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <svg
            className="h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
            />
          </svg>
        </button>

        <ul
          className={`lg:flex gap-10 font-inknut ${
            isMenuOpen ? "block" : "hidden"
          } absolute lg:static top-full left-0 w-full lg:w-auto bg-gray-800 lg:bg-transparent z-10 lg:flex-row flex-col text-center`}
        >
          <li className="py-2 lg:py-0">
            <span className="cursor-pointer hover:text-gray-400">Home</span>
          </li>
          <Link to="/invoices">
            <li className="py-2 lg:py-0">
              <span className="cursor-pointer hover:text-gray-400">Invoices</span>
            </li>
          </Link>
          <li className="py-2 lg:py-0">
            <span className="cursor-pointer hover:text-gray-400">Help</span>
          </li>
          <Link to="/login">
          <li className="py-2 lg:py-0">
            <span className="cursor-pointer hover:text-gray-400">Login</span>
          </li>
          </Link>
          
        </ul>
      </div>
    </div>
  );
};

export default Navbar;
