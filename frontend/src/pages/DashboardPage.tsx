import { useState, useEffect } from 'react';
import { ZoneCard } from '../components/ZoneCard';
import { locationAPI } from '../services/api';
import { Zone } from '../types';
import { useAuth } from '../context/AuthContext';

export const DashboardPage: React.FC = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [action, setAction] = useState<'ENTER' | 'EXIT'>('ENTER');
  const { user } = useAuth();

  useEffect(() => {
    fetchCrowdStatus();
    const interval = setInterval(fetchCrowdStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchCrowdStatus = async () => {
    try {
      const response = await locationAPI.getCrowdStatus();
      setZones(response.data);
    } catch (err) {
      setError('Failed to fetch crowd status');
    }
  };

  const handleLocationUpdate = async () => {
    if (!selectedZone || !user) {
      setError('Please select a zone');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await locationAPI.updateLocation({
        userId: user.studentId ?? String(user.userId),
        zoneName: selectedZone.name,
        action,
      });
      await fetchCrowdStatus();
      setSelectedZone(null);
      alert(`Successfully ${action === 'ENTER' ? 'entered' : 'exited'} ${selectedZone.name}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update location');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-teal-900 mb-2">Dashboard</h1>
        <p className="text-gray-600 mb-8">Welcome, {user?.fullName}! Check out the live crowd status.</p>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

        {/* Update Location Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Update Your Location</h2>
          {selectedZone && (
            <div className="flex justify-between items-center mb-4">
              <p className="text-lg">
                Selected: <span className="font-bold text-teal-600">{selectedZone.name}</span>
              </p>
              <div className="flex gap-4">
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value as 'ENTER' | 'EXIT')}
                  className="border border-gray-300 rounded px-4 py-2"
                >
                  <option value="ENTER">Enter Zone</option>
                  <option value="EXIT">Exit Zone</option>
                </select>
                <button
                  onClick={handleLocationUpdate}
                  disabled={loading}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded font-semibold transition disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Location'}
                </button>
              </div>
            </div>
          )}
          {!selectedZone && <p className="text-gray-600">Select a zone below to update your location</p>}
        </div>

        {/* Zones Grid */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Live Crowd Status</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {zones.map((zone) => (
            <div
              key={zone.name}
              onClick={() => setSelectedZone(zone)}
              className={`cursor-pointer transition-all ${
                selectedZone?.name === zone.name ? 'ring-4 ring-teal-600' : ''
              }`}
            >
              <ZoneCard zone={zone} onSelect={setSelectedZone} />
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="mt-12 grid md:grid-cols-4 gap-6">
          <StatCard title="Total Capacity" value={zones.reduce((sum, z) => sum + z.capacity, 0).toString()} />
          <StatCard title="Total Occupancy" value={zones.reduce((sum, z) => sum + z.currentCount, 0).toString()} />
          <StatCard
            title="Average Occupancy"
            value={
              zones.length > 0
                ? ((zones.reduce((sum, z) => sum + z.occupancyPercentage, 0) / zones.length).toFixed(1) + '%')
                : '0%'
            }
          />
          <StatCard
            title="High Density Zones"
            value={zones.filter((z) => z.crowdLevel === 'HIGH').length.toString()}
          />
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value }) => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <p className="text-gray-600 text-sm mb-2">{title}</p>
    <p className="text-3xl font-bold text-teal-600">{value}</p>
  </div>
);
