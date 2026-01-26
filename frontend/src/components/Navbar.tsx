import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-gradient-to-r from-teal-600 to-cyan-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="text-white font-bold text-xl">📍 Campus Nav</div>
          </Link>

          <div className="flex space-x-4 items-center">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="text-white hover:text-cyan-200 transition">
                  Dashboard
                </Link>
                <Link to="/scanner" className="text-white hover:text-cyan-200 transition flex items-center gap-1">
                  <span>📸</span> Scanner
                </Link>
                <Link to="/map" className="text-white hover:text-cyan-200 transition">
                  Live Map
                </Link>
                <Link to="/statistics" className="text-white hover:text-cyan-200 transition">
                  Statistics
                </Link>
                <Link to="/qr-codes" className="text-white hover:text-cyan-200 transition">
                  QR Codes
                </Link>
                <Link to="/profile" className="text-white hover:text-cyan-200 transition">
                  {user?.fullName}
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="bg-white text-teal-600 hover:bg-cyan-100 px-4 py-2 rounded transition"
                >
                  Signup
                </Link>
                <Link
                  to="/login"
                  className="bg-cyan-400 text-white hover:bg-cyan-500 px-4 py-2 rounded transition"
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
