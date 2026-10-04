import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../api/authApi';
import { loggedOut } from '../redux/slices/authSlice';
import useToast from '../lib/useToast';
import logo from '../assets/logo.svg';

const APP_LINKS = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Invoices', href: '/invoices' },
  { name: 'New invoice', href: '/invoices/new' },
  { name: 'Settings', href: '/settings' },
];

const linkClass = ({ isActive }) =>
  `${isActive ? 'text-blue-600' : 'text-gray-600'} text-sm font-medium hover:text-blue-500 transition`;

const Navbar = () => {
  const { status, user } = useSelector((state) => state.auth);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();

  const isIn = status === 'in';
  const links = isIn ? APP_LINKS : [];
  const close = () => setIsMenuOpen(false);

  const logoutUser = async () => {
    setLeaving(true);
    try {
      await logout();
    } catch {
      // the session may have ended already; the app logs out either way
    }
    dispatch(loggedOut());
    close();
    setLeaving(false);
    toast.success('Logged out');
    navigate('/');
  };

  const account = isIn ? (
    <>
      <span className="text-sm text-gray-500 truncate max-w-[12rem]" title={user.email}>{user.name}</span>
      <button className="btn-quiet" onClick={logoutUser} disabled={leaving}>Logout</button>
    </>
  ) : (
    <>
      <Link to="/login" onClick={close} className="btn-quiet">Login</Link>
      <Link to="/register" onClick={close} className="btn-primary">Sign up</Link>
    </>
  );

  return (
    <nav className="sticky top-0 z-40 bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link to={isIn ? '/dashboard' : '/'} onClick={close} className="flex items-center gap-2">
          <img className="h-8 w-8" src={logo} alt="" />
          <span className="text-xl font-semibold text-gray-800">Invoisify</span>
        </Link>

        <ul className="hidden md:flex items-center gap-6">
          {links.map((item) => (
            <li key={item.href}><NavLink to={item.href} end className={linkClass}>{item.name}</NavLink></li>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-3">{status !== 'checking' && account}</div>

        <button
          className="md:hidden text-gray-800 p-2 -mr-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMenuOpen}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
          </svg>
        </button>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t bg-white px-4 py-3 space-y-3">
          <ul className="space-y-3">
            {links.map((item) => (
              <li key={item.href}><NavLink to={item.href} end onClick={close} className={linkClass}>{item.name}</NavLink></li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-3">{status !== 'checking' && account}</div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
