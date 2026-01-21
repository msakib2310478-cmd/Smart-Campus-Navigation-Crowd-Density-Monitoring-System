import React, { useState, useEffect, useCallback } from "react";
import { CampusMap, CampusZone } from "./CampusMap";
import { zonesAPI } from "../services/api";
import { ZoneWithCoordinates } from "../types";
import { CAMPUS_CENTER, DEFAULT_ZOOM } from "../config/zoneCoordinates";

interface CampusMapContainerProps {
  /** Refresh interval in milliseconds (default: 10000 = 10 seconds) */
  refreshInterval?: number;
  /** Map height (CSS value) */
  height?: string;
  /** Callback when a zone is clicked */
  onZoneClick?: (zone: ZoneWithCoordinates) => void;
  /** User's current position */
  userPosition?: [number, number] | null;
  /** Custom map center */
  center?: [number, number];
  /** Custom zoom level */
  zoom?: number;
}

/**
 * CampusMapContainer
 *
 * Fetches zone data from the backend and renders the CampusMap component.
 * Handles loading states, error handling, and periodic data refresh.
 */
export const CampusMapContainer: React.FC<CampusMapContainerProps> = ({
  refreshInterval = 10000,
  height = "500px",
  onZoneClick,
  userPosition,
  center = CAMPUS_CENTER,
  zoom = DEFAULT_ZOOM,
}) => {
  const [zones, setZones] = useState<ZoneWithCoordinates[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch zones from the backend
   */
  const fetchZones = useCallback(async () => {
    try {
      const data = await zonesAPI.getZonesWithCoordinates();
      setZones(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch zones:", err);
      setError("Failed to load zone data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and periodic refresh
  useEffect(() => {
    fetchZones();

    const interval = setInterval(fetchZones, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchZones, refreshInterval]);

  /**
   * Convert ZoneWithCoordinates to CampusZone for the map component
   */
  const mapZones: CampusZone[] = zones.map((zone) => ({
    id: zone.id,
    name: zone.name,
    latitude: zone.latitude,
    longitude: zone.longitude,
    radius: zone.radius,
  }));

  /**
   * Handle zone click and pass full zone data to parent
   */
  const handleZoneClick = (campusZone: CampusZone) => {
    const fullZone = zones.find((z) => z.id === campusZone.id);
    if (fullZone && onZoneClick) {
      onZoneClick(fullZone);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div
        className="flex items-center justify-center bg-gray-100 rounded-lg"
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading campus map...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className="flex items-center justify-center bg-red-50 rounded-lg border border-red-200"
        style={{ height }}
      >
        <div className="text-center p-6">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <p className="text-red-700 font-medium mb-2">{error}</p>
          <button
            onClick={fetchZones}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (zones.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200"
        style={{ height }}
      >
        <div className="text-center p-6">
          <div className="text-gray-400 text-4xl mb-4">🗺️</div>
          <p className="text-gray-600">No zones available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <CampusMap
        zones={mapZones}
        center={center}
        zoom={zoom}
        height={height}
        onZoneClick={handleZoneClick}
        userPosition={userPosition}
      />

      {/* Zone count indicator */}
      <div className="absolute top-4 right-4 z-[1000] bg-white px-3 py-1 rounded-full shadow-md text-sm font-medium text-gray-700">
        {zones.length} zones
      </div>
    </div>
  );
};

export default CampusMapContainer;
