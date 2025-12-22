import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const linkClass = (path: string) =>
    `px-3 py-2 rounded-md text-sm font-medium ${
      isActive(path)
        ? 'bg-blue-700 text-white'
        : 'text-gray-300 hover:bg-blue-600 hover:text-white'
    }`;

  return (
    <nav className="bg-blue-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-white text-xl font-bold">
              Smart Campus
            </Link>
          </div>
          <div className="flex items-center space-x-2">
            <Link to="/" className={linkClass('/')}>
              Home
            </Link>
            <Link to="/live" className={linkClass('/live')}>
              Live Map
            </Link>
            <Link to="/zones" className={linkClass('/zones')}>
              Zones
            </Link>
            <Link to="/route" className={linkClass('/route')}>
              Route Planner
            </Link>
            <Link to="/recommendations" className={linkClass('/recommendations')}>
              Recommendations
            </Link>
            <Link to="/reports" className={linkClass('/reports')}>
              Reports
            </Link>
            <Link to="/admin" className={linkClass('/admin')}>
              Admin
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
