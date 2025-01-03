import React from 'react'
import { FaGlobeAmericas, FaDiscord, FaInstagram } from "react-icons/fa";
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <div>
        <footer className="bg-gray-800 text-white p-4"> 
  <nav className="flex items-center justify-center gap-12">
    <Link className="no-underline text-md hover:underline">About us</Link>
    <Link className="no-underline text-md hover:underline">Contact</Link>
    <Link className="no-underline text-md hover:underline">Jobs</Link>
    <Link className="no-underline text-md hover:underline">Press kit</Link>
  </nav>
  <nav>
    <div className="flex items-center justify-center  gap-12 py-4">
      <Link>
        <FaGlobeAmericas className='h-6 w-12 text-white'/>
      </Link>
      <Link>
        <FaInstagram className='h-6 w-12 text-white'/>
      </Link>
      <Link>
        <FaDiscord className='h-6 w-12 text-white'/>
      </Link>
    </div>
  </nav>
  <aside className='text-center'>
    <p>Copyright © {new Date().getFullYear()} - All right reserved by Tech Forge</p>
  </aside>
</footer>
    </div>
  )
}

export default Footer