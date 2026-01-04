import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [modalZone, setModalZone] = useState<Zone | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

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

  const handleZoneClick = (zone: Zone) => {
    setModalZone(zone);
    setShowZoneModal(true);
  };

  const handleQuickEnter = async (zone: Zone) => {
    if (!user) return;
    
    setLoading(true);
    setError('');
    
    try {
      await locationAPI.updateLocation({
        userId: user.studentId ?? String(user.userId),
        zoneName: zone.name,
        action: 'ENTER',
      });
      await fetchCrowdStatus();
      setShowZoneModal(false);
      alert(`Successfully entered ${zone.name}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update location');
    } finally {
      setLoading(false);
    }
  };

  const getZoneIcon = (zoneName: string) => {
    const name = zoneName.toLowerCase();
    if (name.includes('library')) return '📚';
    if (name.includes('cafeteria') || name.includes('cafe')) return '🍽️';
    if (name.includes('lab') || name.includes('computer')) return '💻';
    if (name.includes('gym') || name.includes('sports')) return '🏋️';
    if (name.includes('auditorium') || name.includes('hall')) return '🎭';
    if (name.includes('park') || name.includes('garden')) return '🌳';
    if (name.includes('classroom') || name.includes('class')) return '📖';
    if (name.includes('admin')) return '🏢';
    return '🏛️';
  };

  const getZoneDescription = (zoneName: string) => {
    const name = zoneName.toLowerCase();
    if (name.includes('library')) return 'Study and research resources';
    if (name.includes('cafeteria') || name.includes('cafe')) return 'Dining and refreshments';
    if (name.includes('lab')) return 'Practical learning and experiments';
    if (name.includes('gym')) return 'Fitness and sports activities';
    if (name.includes('auditorium')) return 'Events and presentations';
    if (name.includes('park')) return 'Outdoor relaxation area';
    if (name.includes('classroom')) return 'Learning and lectures';
    if (name.includes('admin')) return 'Administrative services';
    return 'Campus zone';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-teal-900 mb-2">Dashboard</h1>
        <p className="text-gray-600 mb-8">Welcome, {user?.fullName}! Check out the live crowd status.</p>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

        {/* Quick Access Campus Zones */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            🏫 Quick Access - Campus Zones
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {zones.map((zone) => (
              <button
                key={zone.name}
                onClick={() => handleZoneClick(zone)}
                className={`relative p-6 rounded-lg border-2 transition-all hover:shadow-lg hover:scale-105 ${
                  zone.crowdLevel === 'LOW'
                    ? 'border-green-300 bg-green-50 hover:bg-green-100'
                    : zone.crowdLevel === 'MEDIUM'
                    ? 'border-yellow-300 bg-yellow-50 hover:bg-yellow-100'
                    : 'border-red-300 bg-red-50 hover:bg-red-100'
                }`}
              >
                <div className="text-4xl mb-2">{getZoneIcon(zone.name)}</div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">{zone.name}</h3>
                <p className="text-xs text-gray-600 mb-2">{getZoneDescription(zone.name)}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700">
                    {zone.currentCount}/{zone.capacity}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      zone.crowdLevel === 'LOW'
                        ? 'bg-green-500 text-white'
                        : zone.crowdLevel === 'MEDIUM'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-red-500 text-white'
                    }`}
                  >
                    {zone.crowdLevel}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

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

        {/* Zone Detail Modal */}
        {showZoneModal && modalZone && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="text-6xl">{getZoneIcon(modalZone.name)}</div>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900">{modalZone.name}</h2>
                      <p className="text-gray-600">{getZoneDescription(modalZone.name)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowZoneModal(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ✕
                  </button>
                </div>

                {/* Zone Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Capacity</p>
                    <p className="text-2xl font-bold text-blue-600">{modalZone.capacity}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Current Count</p>
                    <p className="text-2xl font-bold text-purple-600">{modalZone.currentCount}</p>
                  </div>
                  <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Occupancy</p>
                    <p className="text-2xl font-bold text-teal-600">{modalZone.occupancyPercentage.toFixed(0)}%</p>
                  </div>
                </div>

                {/* Crowd Level Indicator */}
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-2">Crowd Level</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          modalZone.crowdLevel === 'LOW'
                            ? 'bg-green-500'
                            : modalZone.crowdLevel === 'MEDIUM'
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${modalZone.occupancyPercentage}%` }}
                      ></div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        modalZone.crowdLevel === 'LOW'
                          ? 'bg-green-500 text-white'
                          : modalZone.crowdLevel === 'MEDIUM'
                          ? 'bg-yellow-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}
                    >
                      {modalZone.crowdLevel}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => handleQuickEnter(modalZone)}
                    disabled={loading || modalZone.crowdLevel === 'HIGH'}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <span>🚪</span>
                    {loading ? 'Processing...' : 'Quick Enter'}
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowZoneModal(false);
                      navigate('/live-map');
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                  >
                    <span>🗺️</span>
                    View on Map
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowZoneModal(false);
                      navigate('/recommendations');
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                  >
                    <span>💡</span>
                    Get Recommendations
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowZoneModal(false);
                      navigate('/statistics');
                    }}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                  >
                    <span>📊</span>
                    View Statistics
                  </button>
                </div>

                {/* Recommendations */}
                {modalZone.crowdLevel === 'HIGH' && (
                  <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 font-semibold mb-2">⚠️ High Crowd Alert</p>
                    <p className="text-red-700 text-sm">
                      This zone is currently very crowded. Consider visiting during off-peak hours or check our recommendations for alternative zones.
                    </p>
                  </div>
                )}
                
                {modalZone.crowdLevel === 'LOW' && (
                  <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 font-semibold mb-2">✅ Perfect Time to Visit</p>
                    <p className="text-green-700 text-sm">
                      This zone has low crowd density right now. Great time to visit!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
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
