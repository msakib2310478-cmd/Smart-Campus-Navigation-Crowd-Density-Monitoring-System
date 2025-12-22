import { useState, useEffect, type FormEvent } from 'react';
import type { Zone, RouteResponse } from '../types';
import { zoneApi } from '../api/zones';
import { routeApi } from '../api/routes';

export default function RoutePlanner() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [startZoneId, setStartZoneId] = useState('');
  const [endZoneId, setEndZoneId] = useState('');
  const [avoidCrowded, setAvoidCrowded] = useState(false);
  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    try {
      const data = await zoneApi.getAllZones();
      setZones(data);
    } catch (err) {
      console.error('Failed to load zones:', err);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!startZoneId || !endZoneId) return;

    setLoading(true);
    try {
      const result = await routeApi.calculateRoute({
        startZoneId,
        endZoneId,
        avoidCrowded,
      });
      setRoute(result);
    } catch (err) {
      console.error('Failed to calculate route:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Route Planner</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Plan Your Route</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Location
              </label>
              <select
                value={startZoneId}
                onChange={(e) => setStartZoneId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select start location</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destination
              </label>
              <select
                value={endZoneId}
                onChange={(e) => setEndZoneId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select destination</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={avoidCrowded}
                  onChange={(e) => setAvoidCrowded(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Avoid crowded areas</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
            >
              {loading ? 'Calculating...' : 'Find Route'}
            </button>
          </form>
        </div>

        {route && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Route Details</h2>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">Estimated Time</p>
              <p className="text-2xl font-bold text-blue-600">{route.estimatedTime} min</p>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Crowd Level</p>
              <span
                className={`px-3 py-1 rounded text-sm font-semibold ${
                  route.crowdLevel === 'LOW'
                    ? 'bg-green-100 text-green-800'
                    : route.crowdLevel === 'MEDIUM'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {route.crowdLevel}
              </span>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Route Path</p>
              <ol className="list-decimal list-inside space-y-1">
                {route.path.map((zone) => (
                  <li key={zone.id} className="text-sm">
                    {zone.name}
                  </li>
                ))}
              </ol>
            </div>

            {route.alternatives && route.alternatives.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Alternative Routes</p>
                <div className="space-y-2">
                  {route.alternatives.map((alt, index) => (
                    <div key={index} className="border border-gray-200 rounded p-2">
                      <p className="text-sm font-medium">{alt.name}</p>
                      <p className="text-xs text-gray-600">
                        {alt.estimatedTime} min • {alt.crowdLevel}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
