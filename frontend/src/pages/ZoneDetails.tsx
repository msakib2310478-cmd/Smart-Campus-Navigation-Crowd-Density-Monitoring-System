import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Zone } from '../types';
import { zoneApi } from '../api/zones';

export default function ZoneDetails() {
  const { zoneId } = useParams<{ zoneId: string }>();
  const navigate = useNavigate();
  const [zone, setZone] = useState<Zone | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (zoneId) {
      loadZone(zoneId);
    }
  }, [zoneId]);

  const loadZone = async (id: string) => {
    try {
      const data = await zoneApi.getZoneById(id);
      setZone(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load zone:', err);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="px-4"><p>Loading...</p></div>;
  }

  if (!zone) {
    return (
      <div className="px-4">
        <p className="text-red-600">Zone not found</p>
        <button
          onClick={() => navigate('/zones')}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
        >
          Back to Zones
        </button>
      </div>
    );
  }

  const percentage = zone.capacity > 0 ? (zone.currentCount / zone.capacity) * 100 : 0;

  return (
    <div className="px-4">
      <button
        onClick={() => navigate('/zones')}
        className="mb-4 text-blue-600 hover:text-blue-800"
      >
        ← Back to Zones
      </button>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h1 className="text-3xl font-bold text-gray-900">{zone.name}</h1>
          <p className="mt-1 text-sm text-gray-500 capitalize">{zone.type}</p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Capacity</dt>
              <dd className="mt-1 text-sm text-gray-900">{zone.capacity} people</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Current Occupancy</dt>
              <dd className="mt-1 text-sm text-gray-900">{zone.currentCount} people</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Crowd Level</dt>
              <dd className="mt-1">
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded ${
                    percentage < 30
                      ? 'bg-green-100 text-green-800'
                      : percentage < 70
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {zone.crowdLevel || (percentage < 30 ? 'LOW' : percentage < 70 ? 'MEDIUM' : 'HIGH')} ({percentage.toFixed(0)}%)
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Location</dt>
              <dd className="mt-1 text-sm text-gray-900">
                Lat: {zone.location.lat.toFixed(4)}, Lng: {zone.location.lng.toFixed(4)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
