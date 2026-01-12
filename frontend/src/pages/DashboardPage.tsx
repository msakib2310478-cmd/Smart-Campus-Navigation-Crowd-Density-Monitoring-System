import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const quickActions = [
    {
      title: 'QR Scanner',
      description: 'Scan zone QR codes to update your location instantly',
      icon: '📸',
      path: '/scanner',
      color: 'from-emerald-500 to-green-500'
    },
    {
      title: 'Live Campus Map',
      description: 'View real-time crowd density and navigate campus zones',
      icon: '🗺️',
      path: '/map',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Crowd Statistics',
      description: 'Analyze crowd patterns and historical data',
      icon: '📊',
      path: '/statistics',
      color: 'from-green-500 to-teal-500'
    },
    {
      title: 'Smart Recommendations',
      description: 'Find the best uncrowded location for your needs',
      icon: '🎯',
      path: '/recommend',
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Zone QR Codes',
      description: 'View and download QR codes for all campus zones',
      icon: '📱',
      path: '/qr-codes',
      color: 'from-indigo-500 to-purple-500'
    },
    {
      title: 'Profile Settings',
      description: 'Manage your account and preferences',
      icon: '👤',
      path: '/profile',
      color: 'from-orange-500 to-red-500'
    }
  ];

  const campusZones = [
    { name: 'Library', capacity: 200, icon: '📚', description: 'Study areas and reading rooms' },
    { name: 'Cafeteria', capacity: 150, icon: '🍽️', description: 'Dining and social spaces' },
    { name: 'Computer Lab', capacity: 80, icon: '💻', description: 'Computing facilities' },
    { name: 'Study Hall', capacity: 120, icon: '📖', description: 'Group study spaces' },
    { name: 'Gym', capacity: 100, icon: '🏋️', description: 'Fitness center' },
    { name: 'Common Room', capacity: 60, icon: '🛋️', description: 'Relaxation areas' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="text-2xl">📍</div>
              <span className="text-xl font-bold text-teal-700">Campus Nav</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.fullName}!</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-teal-900 mb-2">
                Welcome back, {user?.fullName}!
              </h1>
              <p className="text-gray-600">
                Access real-time campus navigation and crowd monitoring tools
              </p>
            </div>
            <div className="text-6xl">🎓</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.path}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-all duration-300 hover:scale-105 group"
              >
                <div className={`bg-gradient-to-r ${action.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <span className="text-2xl">{action.icon}</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{action.title}</h3>
                <p className="text-sm text-gray-600">{action.description}</p>
                <div className="mt-4 text-teal-600 font-semibold text-sm group-hover:text-teal-700">
                  Access →
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Campus Zones Overview */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Campus Zones</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campusZones.map((zone, index) => (
              <button
                key={index}
                onClick={() => navigate('/map', { state: { selectedZone: zone.name } })}
                className="bg-white rounded-lg shadow-md p-6 text-left hover:shadow-xl hover:scale-105 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl">{zone.icon}</span>
                  <span className="text-sm text-gray-500">Click to navigate</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{zone.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{zone.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Capacity: {zone.capacity}</span>
                  <span className="text-teal-600 font-semibold text-sm group-hover:text-teal-700">
                    View Map →
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">System Status</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-2">🟢</div>
              <h3 className="font-bold text-gray-900">Live Tracking</h3>
              <p className="text-sm text-gray-600">Real-time updates active</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">📍</div>
              <h3 className="font-bold text-gray-900">Campus Coverage</h3>
              <p className="text-sm text-gray-600">All zones monitored</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">👥</div>
              <h3 className="font-bold text-gray-900">Active Users</h3>
              <p className="text-sm text-gray-600">Real-time participation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
