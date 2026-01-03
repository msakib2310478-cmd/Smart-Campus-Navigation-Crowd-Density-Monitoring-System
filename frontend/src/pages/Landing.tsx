import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="px-4">
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Smart Campus Navigation & Crowd Monitoring
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Real-time crowd density tracking and intelligent route planning for your campus
        </p>
        <div className="flex justify-center space-x-4">
          <Link
            to="/live"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg"
          >
            View Live Map
          </Link>
          <Link
            to="/route"
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg"
          >
            Plan Route
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Real-time Monitoring</h3>
          <p className="text-gray-600">
            Track crowd density across all campus zones in real-time with live updates
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Smart Routing</h3>
          <p className="text-gray-600">
            Get optimal routes that avoid crowded areas and save time
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Recommendations</h3>
          <p className="text-gray-600">
            Discover less busy alternatives to popular campus locations
          </p>
        </div>
      </div>
    </div>
  );
}
