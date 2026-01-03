import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Zone } from '../types';
import { zoneApi } from '../api/zones';

export default function Zones() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    try {
      const data = await zoneApi.getAllZones();
      setZones(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load zones:', err);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="px-4"><p>Loading...</p></div>;
  }

  return (
    <div className="px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Campus Zones</h1>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {zones.map((zone) => (
            <li key={zone.id}>
              <Link
                to={`/zones/${zone.id}`}
                className="block hover:bg-gray-50 px-4 py-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-medium text-blue-600">{zone.name}</p>
                    <p className="text-sm text-gray-500 capitalize">{zone.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      Capacity: {zone.capacity}
                    </p>
                    <p className="text-sm text-gray-500">
                      Current: {zone.currentCount}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
