import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleZoneClick = (zoneName: string) => {
    if (isAuthenticated) {
      // Navigate to dashboard for authenticated users
      navigate('/dashboard', { state: { selectedZone: zoneName } });
    } else {
      // Prompt to login for non-authenticated users
      navigate('/login', { state: { redirectTo: '/dashboard', selectedZone: zoneName } });
    }
  };

  const getZoneIcon = (zoneName: string) => {
    const name = zoneName.toLowerCase();
    if (name.includes('library')) return '📚';
    if (name.includes('cafeteria') || name.includes('cafe')) return '🍽️';
    if (name.includes('study')) return '📖';
    if (name.includes('game')) return '🎮';
    if (name.includes('gym')) return '🏋️';
    if (name.includes('lab')) return '💻';
    if (name.includes('common')) return '🛋️';
    return '🏛️';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-teal-900 mb-4">Campus Navigation System</h1>
          <p className="text-xl text-gray-700 mb-8">
            Real-time crowd density monitoring & smart campus navigation
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/signup"
              className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-lg font-semibold transition"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="border-2 border-teal-600 text-teal-600 hover:bg-teal-50 px-8 py-3 rounded-lg font-semibold transition"
            >
              Login
            </Link>
          </div>
        </div>

        {/* Problem Statement */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">The Problem</h2>
            <p className="text-gray-700 mb-4">
              Students waste 30-40 minutes daily searching for uncrowded spaces in libraries, cafeterias, labs, and common rooms.
            </p>
            <p className="text-gray-700">
              Without real-time information about crowd levels, it's impossible to make informed decisions about where to study or spend time.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-4xl text-center mb-4">⏱️</div>
            <p className="text-center text-gray-600">
              Average time wasted per student per day searching for space
            </p>
            <p className="text-center text-4xl font-bold text-red-500 mt-2">30-40 min</p>
          </div>
        </div>

        {/* Features */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon="📍"
              title="Real-Time Tracking"
              description="Live location updates from campus users"
            />
            <FeatureCard
              icon="📊"
              title="Crowd Density"
              description="Visual indicators (Green/Yellow/Red) for crowd levels"
            />
            <FeatureCard
              icon="🧭"
              title="Smart Recommendations"
              description="Find the best uncrowded location instantly"
            />
            <FeatureCard
              icon="📱"
              title="Multi-Platform"
              description="Works on web, Java client, and desktop apps"
            />
            <FeatureCard
              icon="🔐"
              title="Secure Authentication"
              description="Email or Student ID login"
            />
            <FeatureCard
              icon="📈"
              title="Analytics"
              description="View historical crowd statistics and trends"
            />
          </div>
        </div>

        {/* Zone Overview */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">Explore Campus Zones</h2>
          <p className="text-gray-600 text-center mb-8">Click on any zone to check real-time crowd density and navigate</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ZoneButton 
              name="Library" 
              capacity={100} 
              icon={getZoneIcon("Library")}
              onClick={() => handleZoneClick("Library")}
              description="Study and research resources"
            />
            <ZoneButton 
              name="Cafeteria" 
              capacity={60} 
              icon={getZoneIcon("Cafeteria")}
              onClick={() => handleZoneClick("Cafeteria")}
              description="Dining and refreshments"
            />
            <ZoneButton 
              name="Study Room" 
              capacity={40} 
              icon={getZoneIcon("Study Room")}
              onClick={() => handleZoneClick("Study Room")}
              description="Quiet study spaces"
            />
            <ZoneButton 
              name="Game Zone" 
              capacity={30} 
              icon={getZoneIcon("Game Zone")}
              onClick={() => handleZoneClick("Game Zone")}
              description="Recreation and gaming"
            />
            <ZoneButton 
              name="Gym" 
              capacity={25} 
              icon={getZoneIcon("Gym")}
              onClick={() => handleZoneClick("Gym")}
              description="Fitness and exercise"
            />
            <ZoneButton 
              name="Labs" 
              capacity={50} 
              icon={getZoneIcon("Labs")}
              onClick={() => handleZoneClick("Labs")}
              description="Computer and science labs"
            />
            <ZoneButton 
              name="Common Room" 
              capacity={35} 
              icon={getZoneIcon("Common Room")}
              onClick={() => handleZoneClick("Common Room")}
              description="Social and relaxation area"
            />
            <ZoneButton 
              name="Auditorium" 
              capacity={200} 
              icon="🎭"
              onClick={() => handleZoneClick("Auditorium")}
              description="Events and presentations"
            />
          </div>
          
          {/* Quick Action Buttons */}
          <div className="mt-12 flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => isAuthenticated ? navigate('/live-map') : navigate('/login')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2 shadow-md"
            >
              <span>🗺️</span>
              View Live Map
            </button>
            <button
              onClick={() => isAuthenticated ? navigate('/recommendations') : navigate('/login')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2 shadow-md"
            >
              <span>💡</span>
              Get Recommendations
            </button>
            <button
              onClick={() => isAuthenticated ? navigate('/statistics') : navigate('/login')}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2 shadow-md"
            >
              <span>📊</span>
              View Statistics
            </button>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-lg p-12 text-center text-white">
          <h3 className="text-3xl font-bold mb-4">Ready to Get Started?</h3>
          <p className="text-lg mb-8">Join thousands of students saving time every day</p>
          <Link
            to="/signup"
            className="bg-white text-teal-600 hover:bg-cyan-50 px-8 py-3 rounded-lg font-semibold transition inline-block"
          >
            Sign Up Now
          </Link>
        </div>
      </section>
    </div>
  );
};

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
    <div className="text-4xl mb-4">{icon}</div>
    <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

interface ZoneOverviewProps {
  name: string;
  capacity: number;
  icon: string;
  description: string;
  onClick: () => void;
}

const ZoneButton: React.FC<ZoneOverviewProps> = ({ name, capacity, icon, description, onClick }) => (
  <button
    onClick={onClick}
    className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 border-transparent hover:border-teal-500 group"
  >
    <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">{icon}</div>
    <h4 className="font-bold text-gray-900 mb-2 text-lg">{name}</h4>
    <p className="text-sm text-gray-600 mb-3">{description}</p>
    <div className="flex items-center justify-center gap-2 text-sm">
      <span className="text-gray-500">Capacity:</span>
      <span className="font-semibold text-teal-600">{capacity}</span>
    </div>
    <div className="mt-3 pt-3 border-t border-gray-200">
      <span className="text-xs text-teal-600 font-semibold group-hover:text-teal-700">
        Click to view details →
      </span>
    </div>
  </button>
);
