import React from 'react';
import { Link, useLocation } from 'react-router-dom';
const Navbar: React.FC = () => {
  const location = useLocation();
  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };
  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary-600">🛰️</span>
            <span className="text-xl font-bold text-gray-800">ClaimSat + Reunify</span>
          </Link>
          <div className="flex space-x-1">
            <Link
              to="/"
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                location.pathname === '/'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Home
            </Link>
            <Link
              to="/claimsat"
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                isActive('/claimsat')
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              ClaimSat
            </Link>
            <Link
              to="/reunify"
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                isActive('/reunify')
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Reunify
            </Link>
            <Link
              to="/admin"
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                isActive('/admin')
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Admin
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
export default Navbar;