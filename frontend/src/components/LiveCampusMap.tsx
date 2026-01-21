import React, { useState, useEffect, useCallback } from "react";
import { EnhancedCampusMap } from "./EnhancedCampusMap";
import { useAutoLocation } from "../hooks/useAutoLocation";
import { zonesAPI } from "../services/api";
import { ZoneWithCoordinates } from "../types";
import { CAMPUS_CENTER, DEFAULT_ZOOM } from "../config/zoneCoordinates";

interface LiveCampusMapProps {
  /** Map height */
  height?: string;
  /** Refresh interval for zone data (ms) */
  refreshInterval?: number;
  /** Whether to auto-start location tracking */
  autoStartTracking?: boolean;
  /** Callback when zone is clicked */
  onZoneClick?: (zone: ZoneWithCoordinates) => void;
}

/**
 * LiveCampusMap Component
 *
 * Fully integrated map with:
 * - Real-time user location tracking
 * - Automatic zone detection (geofencing)
 * - Live crowd data from backend
 * - Auto backend sync on zone enter/exit
 */
export const LiveCampusMap: React.FC<LiveCampusMapProps> = ({
  height = "500px",
  refreshInterval = 5000,
  autoStartTracking = false,
  onZoneClick,
}) => {
  // Zone data state
  const [zones, setZones] = useState<ZoneWithCoordinates[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auto location with geofencing and backend sync
  const {
    activeZone,
    confirmedZone,
    position,
    isTracking,
    isUpdating,
    isSupported,
    permissionGranted,
    geolocationError,
    startTracking,
    stopTracking,
  } = useAutoLocation({
    autoStart: autoStartTracking,
    enableHighAccuracy: true,
    onEnterSuccess: (zone) => {
      console.log(`✅ Entered ${zone}`);
    },
    onExitSuccess: (zone) => {
      console.log(`✅ Exited ${zone}`);
    },
    onError: (err, action, zone) => {
      console.error(`❌ ${action} ${zone} failed:`, err);
    },
  });

  // Fetch zone data
  const fetchZones = useCallback(async () => {
    try {
      const data = await zonesAPI.getZonesWithCoordinates();
      setZones(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch zones:", err);
      setError("Failed to load zones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchZones();
    const interval = setInterval(fetchZones, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchZones, refreshInterval]);

  // Convert position to tuple
  const userPosition: [number, number] | null = position
    ? [position.latitude, position.longitude]
    : null;

  // Loading state
  if (loading) {
    return (
      <div
        className="flex items-center justify-center bg-gray-100 rounded-lg"
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mx-auto mb-3" />
          <p className="text-gray-600 text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && zones.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-red-50 rounded-lg border border-red-200"
        style={{ height }}
      >
        <div className="text-center p-4">
          <p className="text-red-600 mb-2">{error}</p>
          <button
            onClick={fetchZones}
            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Map */}
      <EnhancedCampusMap
        zones={zones}
        userPosition={userPosition}
        activeZone={activeZone}
        center={CAMPUS_CENTER}
        zoom={DEFAULT_ZOOM}
        height={height}
        onZoneClick={onZoneClick}
        followUser={isTracking}
      />

      {/* Control panel overlay */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-2">
        {/* Tracking toggle */}
        <button
          onClick={isTracking ? stopTracking : startTracking}
          disabled={!isSupported}
          className={`px-3 py-2 rounded-lg shadow-md text-sm font-medium transition flex items-center gap-2 ${
            isTracking
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-white text-gray-700 hover:bg-gray-50"
          } ${!isSupported ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isTracking ? (
            <>
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              Tracking
            </>
          ) : (
            <>
              <span className="w-2 h-2 bg-gray-400 rounded-full" />
              Start Tracking
            </>
          )}
        </button>

        {/* Permission denied warning */}
        {permissionGranted === false && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded-lg text-xs max-w-[200px]">
            📍 Location access denied. Enable in browser settings.
          </div>
        )}

        {/* Geolocation error */}
        {geolocationError && permissionGranted !== false && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs max-w-[200px]">
            {geolocationError.message}
          </div>
        )}
      </div>

      {/* Status panel overlay */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2 items-end">
        {/* Zone count */}
        <div className="bg-white px-3 py-1 rounded-full shadow-md text-sm text-gray-600">
          {zones.length} zones
        </div>

        {/* Current zone indicator */}
        {(activeZone || confirmedZone) && (
          <div className="bg-blue-600 text-white px-3 py-1.5 rounded-lg shadow-md text-sm flex items-center gap-2">
            <span className="w-2 h-2 bg-white rounded-full" />
            {activeZone || confirmedZone}
            {isUpdating && (
              <span className="text-xs opacity-75">(syncing...)</span>
            )}
          </div>
        )}

        {/* Accuracy indicator */}
        {position && (
          <div className="bg-white/90 px-2 py-1 rounded text-xs text-gray-500">
            ±{position.accuracy.toFixed(0)}m accuracy
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 px-3 py-2 rounded-lg shadow-md">
        <div className="text-xs text-gray-500 mb-1 font-medium">
          Crowd Level
        </div>
        <div className="flex gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            Low
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            Medium
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            High
          </span>
        </div>
      </div>
    </div>
  );
};

export default LiveCampusMap;
