import { useEffect, useState } from 'react';
import type { Zone } from '../types';
import { zoneApi } from '../api/zones';
import { crowdWebSocket } from '../realtime/websocket';

export default function LiveMap() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initial load
    loadZones();

    // Connect to WebSocket for real-time updates
    crowdWebSocket.connect((updatedZones) => {
      setZones(updatedZones);
    });

    return () => {
      crowdWebSocket.disconnect();
    };
  }, []);

  const loadZones = async () => {
    try {
      const data = await zoneApi.getAllZones();
      setZones(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load zones');
      setLoading(false);
    }
  };

  const getCrowdColor = (percentage: number) => {
    if (percentage < 30) return 'bg-green-500';
    if (percentage < 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getCrowdTextColor = (percentage: number) => {
    if (percentage < 30) return 'text-green-700';
    if (percentage < 70) return 'text-yellow-700';
    return 'text-red-700';
  };

  if (loading) {
    return (
      <div className="px-4">
        <div className="text-center py-12">
          <p className="text-xl text-gray-600">Loading zones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4">
        <div className="text-center py-12">
          <p className="text-xl text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Live Campus Map</h1>
      
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium">Legend:</span>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm">Low (&lt; 30%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-sm">Medium (30-70%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm">High (&gt; 70%)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {zones.map((zone) => {
          const percentage = zone.capacity > 0 
            ? (zone.currentCount / zone.capacity) * 100 
            : 0;

          return (
            <div
              key={zone.id}
              className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{zone.name}</h3>
                <span className={`px-2 py-1 text-xs font-semibold rounded ${getCrowdColor(percentage)} text-white`}>
                  {zone.crowdLevel || (percentage < 30 ? 'LOW' : percentage < 70 ? 'MEDIUM' : 'HIGH')}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-3 capitalize">{zone.type}</p>

              <div className="mb-2">
                <div className="flex justify-between text-sm mb-1">
                  <span>Occupancy</span>
                  <span className={`font-semibold ${getCrowdTextColor(percentage)}`}>
                    {percentage.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getCrowdColor(percentage)}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  ></div>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                {zone.currentCount} / {zone.capacity} people
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
