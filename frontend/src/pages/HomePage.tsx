import React from 'react';
import { Link } from 'react-router-dom';

export const HomePage: React.FC = () => {
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
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Campus Zones</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ZoneOverview name="Library" capacity={100} />
            <ZoneOverview name="Cafeteria" capacity={60} />
            <ZoneOverview name="Study Room" capacity={40} />
            <ZoneOverview name="Game Zone" capacity={30} />
            <ZoneOverview name="Gym" capacity={25} />
            <ZoneOverview name="Labs" capacity={50} />
            <ZoneOverview name="Common Room" capacity={35} />
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
}

const ZoneOverview: React.FC<ZoneOverviewProps> = ({ name, capacity }) => (
  <div className="bg-white rounded-lg shadow-md p-6 text-center">
    <p className="text-2xl mb-2">📍</p>
    <h4 className="font-bold text-gray-900 mb-2">{name}</h4>
    <p className="text-sm text-gray-600">Capacity: {capacity}</p>
  </div>
);
