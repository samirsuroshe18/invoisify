import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';

const Navbar = ({ activePage }) => {
  const userData = useSelector(state => state.auth);
  console.log('userData navbar', userData);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  
  const logoutUser = () => {
    axios
    .get(`${import.meta.env.VITE_BASE_URL}/api/v1/user/logout`, {
      withCredentials: true,
    })
    .then((response) => {
      alert(response.data.message);
      navigate('/login');
    })
    .catch((error) => {
      alert(error?.response?.data.message || error.message);
    })
  };

  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Invoices', href: '/invoice-preview' },
    { name: 'Reviews', href: '/review' },
  ];

  return (
    <nav className="relative px-6  flex justify-between items-center bg-white shadow-md">

      <div className="flex items-center ml-4">
        <Link to="" className="flex items-center no-underline">
          <img
            className="h-8"
            src="https://img.icons8.com/ios-filled/50/000000/invoice.png"
            alt="Invoice App"
          />
          <span className="ml-2 text-xl font-semibold no-underline text-gray-800">
            Invoisify
          </span>
        </Link>
      </div>

      <button className="lg:hidden text-gray-800 focus:outline-none"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Toggle Menu"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16m-7 6h7"
          />
        </svg>
      </button>

      {/* Desktop Menu */}
      <ul className="hidden lg:flex space-x-6  items-center mt-2">
        {navItems.map((item) => (
          <li key={item.name}>
            <Link 
              to={item.href}
              className={`${
                activePage === item.name ? 'text-blue-500' : 'text-gray-600'
              } text-md flex items-center font-medium no-underline hover:text-blue-400 transition`}
            >
              {item.name}
            </Link>
          </li>
        ))}
        
        {!userData &&
          <li>
          <Link
            to="/register"
            className="ml-4 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md shadow no-underline hover:bg-blue-600 transition"
          >
            Signup
          </Link>
        </li>}

        {userData &&
            <li className="px-4 py-2 no-underline">
            <Link to="/register">
              <button
                className="block w-full text-center px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md shadow hover:bg-blue-600 no-underline transition"
                onClick={logoutUser}
              >
                Logout
              </button>
            </Link>
          </li>
          }

      </ul>



      {isMenuOpen && (
        <ul className="absolute top-12 left-0 w-full bg-white shadow-lg lg:hidden">
          {navItems.map((item) => (
            <li key={item.name} className="border-b no-underline">
              <Link
                to={item.href}
                className={`block px-4 no- py-2 no-underline ${
                  activePage === item.name ? 'text-blue-500' : 'text-gray-800'
                } text-sm font-medium hover:text-blue-400 transition`}
              >
                {item.name}
              </Link>
            </li>
          ))}
          {!userData && 
          <li className="px-4 py-2 no-underline">
            <Link to="/register">
              <button
                className="block w-full text-center px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md shadow hover:bg-blue-600 transition"
              >
                Signup
              </button>
            </Link>
          </li>}
          {userData &&
            <li className="px-4 py-2 no-underline">
            <Link to="/register">
              <button
                className="block w-full text-center px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md shadow hover:bg-blue-600 no-underline transition"
                onClick={logoutUser}
              >
                Logout
              </button>
            </Link>
          </li>
          }
        </ul>
      )}
    </nav>
  );
};

export default Navbar;
