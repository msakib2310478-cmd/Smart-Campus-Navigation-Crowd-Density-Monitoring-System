import React from 'react';
import { Zone } from '../types';

interface ZoneCardProps {
  zone: Zone;
  onSelect?: (zone: Zone) => void;
}

export const ZoneCard: React.FC<ZoneCardProps> = ({ zone, onSelect }) => {
  const getColor = (level: string) => {
    switch (level) {
      case 'LOW':
        return 'bg-green-100 border-green-500 text-green-900';
      case 'MEDIUM':
        return 'bg-yellow-100 border-yellow-500 text-yellow-900';
      case 'HIGH':
        return 'bg-red-100 border-red-500 text-red-900';
      default:
        return 'bg-gray-100 border-gray-500 text-gray-900';
    }
  };

  const getStatusDot = (level: string) => {
    switch (level) {
      case 'LOW':
        return '🟢';
      case 'MEDIUM':
        return '🟡';
      case 'HIGH':
        return '🔴';
      default:
        return '⚪';
    }
  };

  return (
    <div
      onClick={() => onSelect?.(zone)}
      className={`border-2 rounded-lg p-6 cursor-pointer transition hover:shadow-lg ${getColor(
        zone.crowdLevel
      )}`}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold">{zone.name}</h3>
        <span className="text-2xl">{getStatusDot(zone.crowdLevel)}</span>
      </div>

      <div className="space-y-2">
        <p className="font-semibold text-lg">{zone.crowdLevel}</p>
        <p className="text-sm">Capacity: {zone.capacity}</p>
        <p className="text-sm">Current: {zone.currentCount}/{zone.capacity}</p>

        <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden mt-2">
          <div
            className={`h-full ${
              zone.crowdLevel === 'LOW'
                ? 'bg-green-500'
                : zone.crowdLevel === 'MEDIUM'
                ? 'bg-yellow-500'
                : 'bg-red-500'
            } transition-all duration-300`}
            style={{ width: `${Math.min(zone.occupancyPercentage, 100)}%` }}
          />
        </div>

        <p className="text-xs text-gray-600 mt-1">{zone.occupancyPercentage.toFixed(1)}% occupied</p>
      </div>
    </div>
  );
};
