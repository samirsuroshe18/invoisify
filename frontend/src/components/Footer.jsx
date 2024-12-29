import React from 'react'
import { FaGlobeAmericas, FaDiscord, FaInstagram } from "react-icons/fa";
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <div>
        <footer className="footer footer-center bg-base-200 text-base-content p-10">
  <nav className="grid grid-flow-col gap-4">
    <Link className="link link-hover">About us</Link>
    <Link className="link link-hover">Contact</Link>
    <Link className="link link-hover">Jobs</Link>
    <Link className="link link-hover">Press kit</Link>
  </nav>
  <nav>
    <div className="grid grid-flow-col gap-4">
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
  <aside>
    <p>Copyright © {new Date().getFullYear()} - All right reserved by Tech Forge</p>
  </aside>
</footer>
    </div>
  )
}

export default Footer