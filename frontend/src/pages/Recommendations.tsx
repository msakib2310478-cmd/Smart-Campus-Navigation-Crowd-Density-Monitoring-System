import { useEffect, useState } from 'react';
import type { Zone } from '../types';
import { zoneApi } from '../api/zones';

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      const data = await zoneApi.getRecommendations();
      setRecommendations(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load recommendations:', err);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="px-4"><p>Loading...</p></div>;
  }

  return (
    <div className="px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Recommended Locations</h1>
      <p className="text-gray-600 mb-6">
        These locations currently have the lowest crowd density
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((zone, index) => {
          const percentage = zone.capacity > 0 
            ? (zone.currentCount / zone.capacity) * 100 
            : 0;

          return (
            <div
              key={zone.id}
              className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="inline-block bg-blue-600 text-white text-xs px-2 py-1 rounded mb-2">
                    #{index + 1}
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900">{zone.name}</h3>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-3 capitalize">{zone.type}</p>

              <div className="mb-2">
                <div className="flex justify-between text-sm mb-1">
                  <span>Occupancy</span>
                  <span className="font-semibold text-green-700">
                    {percentage.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-green-500"
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
