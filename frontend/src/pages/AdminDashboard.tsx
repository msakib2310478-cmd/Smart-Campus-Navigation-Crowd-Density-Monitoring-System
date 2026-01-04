import { useState, useEffect } from 'react';
import type { Zone } from '../types';
import { zoneApi } from '../api/zones';
import { simulationApi } from '../api/simulation';

export default function AdminDashboard() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [zoneCounts, setZoneCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    try {
      const data = await zoneApi.getAllZones();
      setZones(data);
      
      // Initialize counts with current values
      const counts: Record<string, number> = {};
      data.forEach(zone => {
        counts[zone.id] = zone.currentCount;
      });
      setZoneCounts(counts);
    } catch (err) {
      console.error('Failed to load zones:', err);
    }
  };

  const handleCountChange = (zoneId: string, value: number) => {
    setZoneCounts({
      ...zoneCounts,
      [zoneId]: value,
    });
  };

  const handleSimulate = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const result = await simulationApi.updateCrowd({ zoneCounts });
      setMessage(`✓ ${result.message}`);
      
      // Refresh zones to see updates
      setTimeout(() => {
        loadZones();
      }, 500);
    } catch (err) {
      setMessage('✗ Failed to update crowd simulation');
      console.error('Failed to update simulation:', err);
    } finally {
      setLoading(false);
    }
  };

  const randomizeAll = () => {
    const newCounts: Record<string, number> = {};
    zones.forEach(zone => {
      newCounts[zone.id] = Math.floor(Math.random() * zone.capacity);
    });
    setZoneCounts(newCounts);
  };

  const resetAll = () => {
    const newCounts: Record<string, number> = {};
    zones.forEach(zone => {
      newCounts[zone.id] = 0;
    });
    setZoneCounts(newCounts);
  };

  return (
    <div className="px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Crowd Simulation Controls</h2>
          <div className="space-x-2">
            <button
              onClick={randomizeAll}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
              Randomize All
            </button>
            <button
              onClick={resetAll}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
              Reset All
            </button>
          </div>
        </div>

        <p className="text-gray-600 mb-6">
          Adjust the crowd counts for each zone to simulate different scenarios. 
          Changes will be broadcast in real-time via WebSocket.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {zones.map((zone) => {
            const count = zoneCounts[zone.id] || 0;
            const percentage = zone.capacity > 0 ? (count / zone.capacity) * 100 : 0;
            
            return (
              <div key={zone.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{zone.name}</h3>
                    <p className="text-sm text-gray-500">Capacity: {zone.capacity}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded ${
                      percentage < 30
                        ? 'bg-green-100 text-green-800'
                        : percentage < 70
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {percentage.toFixed(0)}%
                  </span>
                </div>

                <div className="mb-2">
                  <input
                    type="range"
                    min="0"
                    max={zone.capacity}
                    value={count}
                    onChange={(e) => handleCountChange(zone.id, parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <input
                    type="number"
                    min="0"
                    max={zone.capacity}
                    value={count}
                    onChange={(e) => handleCountChange(zone.id, parseInt(e.target.value))}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <span className="text-sm text-gray-600">people</span>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleSimulate}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded disabled:bg-gray-400"
        >
          {loading ? 'Updating...' : 'Apply Simulation'}
        </button>

        {message && (
          <div
            className={`mt-4 p-3 rounded ${
              message.startsWith('✓')
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {message}
          </div>
        )}
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Tip:</strong> Open the Live Map page in another tab to see real-time updates when you apply the simulation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
