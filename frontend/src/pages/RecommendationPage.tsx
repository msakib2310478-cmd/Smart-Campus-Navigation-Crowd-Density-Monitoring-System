import React, { useState, useEffect } from 'react';
import { recommendationAPI } from '../services/api';
import { Zone } from '../types';

export const RecommendationPage: React.FC = () => {
  const [bestZone, setBestZone] = useState<Zone | null>(null);
  const [rankedZones, setRankedZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRecommendations();
    const interval = setInterval(fetchRecommendations, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const [bestRes, rankedRes] = await Promise.all([
        recommendationAPI.getBestRecommendation(),
        recommendationAPI.getRankedZones(),
      ]);
      setBestZone(bestRes.data);
      setRankedZones(rankedRes.data);
    } catch (err) {
      setError('Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-teal-900 mb-8">Recommendations</h1>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

        {/* Best Recommendation */}
        {bestZone && (
          <div className="bg-gradient-to-r from-green-400 to-cyan-400 rounded-lg shadow-2xl p-8 mb-12 text-white">
            <h2 className="text-3xl font-bold mb-4">✨ Best Place Right Now</h2>
            <div className="bg-white bg-opacity-20 rounded-lg p-6">
              <h3 className="text-4xl font-bold mb-4">{bestZone.name}</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-lg mb-2">Occupancy Rate</p>
                  <p className="text-3xl font-bold">{bestZone.occupancyPercentage.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-lg mb-2">Available Seats</p>
                  <p className="text-3xl font-bold">{bestZone.capacity - bestZone.currentCount}</p>
                </div>
              </div>
              <p className="text-lg mt-6">👥 {bestZone.currentCount} out of {bestZone.capacity} people</p>
            </div>
          </div>
        )}

        {/* Ranked Zones */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">All Zones (Ranked by Availability)</h2>
        <div className="space-y-4">
          {rankedZones.map((zone, index) => (
            <div
              key={zone.name}
              className="bg-white rounded-lg shadow-md p-6 flex justify-between items-center hover:shadow-lg transition"
            >
              <div className="flex items-center gap-6">
                <div className="text-3xl font-bold text-gray-400 w-8">{index + 1}</div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{zone.name}</h3>
                  <p className="text-sm text-gray-600">{zone.currentCount}/{zone.capacity} people</p>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1">Occupancy</p>
                  <p className="text-2xl font-bold text-teal-600">{zone.occupancyPercentage.toFixed(1)}%</p>
                </div>

                <div className="w-32 bg-gray-300 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full ${
                      zone.crowdLevel === 'LOW'
                        ? 'bg-green-500'
                        : zone.crowdLevel === 'MEDIUM'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(zone.occupancyPercentage, 100)}%` }}
                  />
                </div>

                <div className="text-center">
                  <p className="text-2xl">
                    {zone.crowdLevel === 'LOW' ? '🟢' : zone.crowdLevel === 'MEDIUM' ? '🟡' : '🔴'}
                  </p>
                  <p className="text-xs font-semibold text-gray-700">{zone.crowdLevel}</p>
                </div>

                <p className="text-sm text-gray-600 font-semibold w-12 text-right">
                  {zone.capacity - zone.currentCount} free
                </p>
              </div>
            </div>
          ))}
        </div>

        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading latest recommendations...</p>
          </div>
        )}
      </div>
    </div>
  );
};
