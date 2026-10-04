import { FaGithub } from "react-icons/fa";
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white p-6">
      <nav className="flex flex-wrap items-center justify-center gap-x-10 gap-y-2 text-sm">
        <Link to="/" className="hover:underline">Home</Link>
        <Link to="/login" className="hover:underline">Login</Link>
        <Link to="/register" className="hover:underline">Sign up</Link>
        <a href="https://github.com/samirsuroshe18/invoisify" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:underline">
          <FaGithub className="h-4 w-4" aria-hidden="true" /> GitHub
        </a>
      </nav>
      <p className="text-center text-sm text-gray-300 mt-4">
        Copyright © {new Date().getFullYear()} Invoisify. Built by team Tech Forge.
      </p>
    </footer>
  )
}

export default Footer
