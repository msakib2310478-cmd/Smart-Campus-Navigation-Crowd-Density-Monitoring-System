import React, { useState, useEffect } from 'react';
import { locationAPI } from '../services/api';
import { Zone } from '../types';

export const StatisticsPage: React.FC = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCrowdStatus();
    const interval = setInterval(fetchCrowdStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchCrowdStatus = async () => {
    setLoading(true);
    try {
      const response = await locationAPI.getCrowdStatus();
      setZones(response.data);
    } catch (err) {
      setError('Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  const totalCapacity = zones.reduce((sum, z) => sum + z.capacity, 0);
  const totalOccupancy = zones.reduce((sum, z) => sum + z.currentCount, 0);
  const averageOccupancy = zones.length > 0 ? totalOccupancy / totalCapacity * 100 : 0;
  const lowDensityZones = zones.filter((z) => z.crowdLevel === 'LOW').length;
  const mediumDensityZones = zones.filter((z) => z.crowdLevel === 'MEDIUM').length;
  const highDensityZones = zones.filter((z) => z.crowdLevel === 'HIGH').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-teal-900 mb-8">Campus Statistics</h1>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

        {/* Overview Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard label="Total Capacity" value={totalCapacity} unit="people" color="bg-blue-500" />
          <StatCard label="Current Occupancy" value={totalOccupancy} unit="people" color="bg-teal-500" />
          <StatCard
            label="Average Occupancy"
            value={averageOccupancy.toFixed(1)}
            unit="%"
            color="bg-cyan-500"
          />
          <StatCard label="Zones Monitored" value={zones.length} unit="zones" color="bg-indigo-500" />
        </div>

        {/* Crowd Level Distribution */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <CrowdLevelCard level="LOW" count={lowDensityZones} color="bg-green-500" emoji="🟢" />
          <CrowdLevelCard level="MEDIUM" count={mediumDensityZones} color="bg-yellow-500" emoji="🟡" />
          <CrowdLevelCard level="HIGH" count={highDensityZones} color="bg-red-500" emoji="🔴" />
        </div>

        {/* Zone Rankings by Occupancy */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Zone Rankings (by Occupancy)</h2>
          <div className="space-y-4">
            {zones
              .sort((a, b) => b.occupancyPercentage - a.occupancyPercentage)
              .map((zone, idx) => (
                <div key={zone.name} className="flex items-center gap-6 pb-4 border-b last:border-b-0">
                  <span className="text-2xl font-bold text-gray-400 w-8">{idx + 1}</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900">{zone.name}</h4>
                    <p className="text-sm text-gray-600">{zone.currentCount} of {zone.capacity} people</p>
                  </div>
                  <div className="w-48 bg-gray-300 rounded-full h-2 overflow-hidden">
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
                  <div className="text-right w-24">
                    <p className="font-bold text-gray-900">{zone.occupancyPercentage.toFixed(1)}%</p>
                    <p className="text-xs text-gray-600">{zone.crowdLevel}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Capacity Analysis */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Capacity Analysis</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-gray-900 mb-4">Zone Capacities</h3>
              <div className="space-y-3">
                {zones
                  .sort((a, b) => b.capacity - a.capacity)
                  .map((zone) => (
                    <div key={zone.name} className="flex justify-between items-center">
                      <span className="text-gray-700">{zone.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 w-16 text-right">{zone.capacity}</span>
                        <div className="w-32 bg-gray-200 rounded h-2">
                          <div
                            className="bg-teal-500 h-2 rounded"
                            style={{ width: `${(zone.capacity / totalCapacity) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-4">Current Distribution</h3>
              <div className="space-y-3">
                {zones
                  .sort((a, b) => b.currentCount - a.currentCount)
                  .map((zone) => (
                    <div key={zone.name} className="flex justify-between items-center">
                      <span className="text-gray-700">{zone.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 w-16 text-right">{zone.currentCount}</span>
                        <div className="w-32 bg-gray-200 rounded h-2">
                          <div
                            className="bg-cyan-500 h-2 rounded"
                            style={{ width: `${(zone.currentCount / totalOccupancy) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-600">Updating statistics...</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: number | string;
  unit: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, unit, color }) => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <p className="text-gray-600 text-sm mb-2">{label}</p>
    <div className={`${color} text-white rounded-lg p-4 text-center`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm opacity-90">{unit}</p>
    </div>
  </div>
);

interface CrowdLevelCardProps {
  level: string;
  count: number;
  color: string;
  emoji: string;
}

const CrowdLevelCard: React.FC<CrowdLevelCardProps> = ({ level, count, color, emoji }) => (
  <div className={`${color} text-white rounded-lg shadow-lg p-8 text-center`}>
    <p className="text-4xl mb-2">{emoji}</p>
    <p className="text-2xl font-bold">{count}</p>
    <p className="text-lg opacity-90">{level} Density Zones</p>
  </div>
);
