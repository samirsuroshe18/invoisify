import { Link } from 'react-router-dom';

// the frame of the login, sign-up and password pages
const AuthCard = ({ title, children }) => (
  <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-gray-100">
    <Link to="/" className="flex items-center gap-2 mb-6">
      <img className="h-8" src="https://img.icons8.com/ios-filled/50/000000/invoice.png" alt="" />
      <span className="text-2xl font-semibold text-gray-800">Invoisify</span>
    </Link>
    <div className="card w-full max-w-md p-6 sm:p-8 shadow-lg">
      <h1 className="text-2xl font-semibold text-center text-gray-800 mb-6">{title}</h1>
      {children}
    </div>
  </div>
);

export default AuthCard;
