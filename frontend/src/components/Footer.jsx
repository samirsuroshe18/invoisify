import React from 'react'
import { FaGlobeAmericas, FaDiscord, FaInstagram } from "react-icons/fa";
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <div className="bg-gray-900 h-max bottom-0">
        <footer >
  <nav className="flex justify-center items-center gap-4 py-4 h-max">
    <Link className="text-lg no-underline hover:underline">About us</Link>
    <Link className="text-lg no-underline hover:underline">Contact</Link>
    <Link className="text-lg no-underline hover:underline">Jobs</Link>
    <Link className="text-lg no-underline hover:underline">Press kit</Link>
  </nav>
  <nav>
    <div className="flex items-center justify-center text-white">
      <a>
        <FaGlobeAmericas className='h-6 w-12'/>
      </a>
      <a>
        <FaInstagram className='h-6 w-12'/>
      </a>
      <a>
        <FaDiscord className='h-6 w-12'/>
      </a>
    </div>
  </nav>
  <aside className='bottom-0'>
    <p className='text-white text-md flex text-center items-center justify-center py-4'>Copyright © {new Date().getFullYear()} - All right reserved by Tech Forge</p>
  </aside>
</footer>
    </div>
  )
}

export default Footer