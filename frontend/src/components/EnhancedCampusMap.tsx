import React, { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Circle,
  Popup,
  Marker,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "../utils/leafletIconFix";
import { ZoneWithCoordinates } from "../types";

/**
 * Props for the enhanced campus map
 */
interface EnhancedCampusMapProps {
  /** Zones with crowd data */
  zones: ZoneWithCoordinates[];
  /** User's current position [lat, lng] */
  userPosition?: [number, number] | null;
  /** Name of the zone user is currently inside */
  activeZone?: string | null;
  /** Map center [lat, lng] */
  center?: [number, number];
  /** Zoom level */
  zoom?: number;
  /** Map height */
  height?: string;
  /** Callback when zone is clicked */
  onZoneClick?: (zone: ZoneWithCoordinates) => void;
  /** Whether to follow user position */
  followUser?: boolean;
}

/** Default center (UIU campus) */
const DEFAULT_CENTER: [number, number] = [23.8103, 90.4125];
const DEFAULT_ZOOM = 17;

/**
 * Get color based on crowd level
 */
const getCrowdColor = (level: string): string => {
  switch (level) {
    case "LOW":
      return "#10b981"; // green
    case "MEDIUM":
      return "#f59e0b"; // amber
    case "HIGH":
      return "#ef4444"; // red
    default:
      return "#6b7280"; // gray
  }
};

/**
 * Get crowd level label with emoji
 */
const getCrowdLabel = (level: string): string => {
  switch (level) {
    case "LOW":
      return "🟢 Low";
    case "MEDIUM":
      return "🟡 Medium";
    case "HIGH":
      return "🔴 High";
    default:
      return "⚪ Unknown";
  }
};

/**
 * User location marker icon
 */
const createUserIcon = () =>
  L.divIcon({
    className: "user-marker",
    html: `
      <div style="
        position: relative;
        width: 24px;
        height: 24px;
      ">
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          width: 24px;
          height: 24px;
          background: #3b82f6;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.5);
        "></div>
        <div style="
          position: absolute;
          top: -4px;
          left: -4px;
          width: 32px;
          height: 32px;
          background: rgba(59, 130, 246, 0.3);
          border-radius: 50%;
          animation: pulse 2s infinite;
        "></div>
      </div>
      <style>
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
      </style>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

/**
 * Component to follow user position
 */
const FollowUser: React.FC<{
  position: [number, number] | null;
  follow: boolean;
}> = ({ position, follow }) => {
  const map = useMap();

  useEffect(() => {
    if (follow && position) {
      map.setView(position, map.getZoom());
    }
  }, [position, follow, map]);

  return null;
};

/**
 * EnhancedCampusMap Component
 *
 * An improved map showing:
 * - User's live location with pulsing marker
 * - Highlighted active zone
 * - Crowd levels with color coding
 * - Zone popups with name and crowd count
 */
export const EnhancedCampusMap: React.FC<EnhancedCampusMapProps> = ({
  zones,
  userPosition,
  activeZone,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  height = "500px",
  onZoneClick,
  followUser = false,
}) => {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height, width: "100%" }}
      className="rounded-lg shadow-lg"
    >
      {/* Follow user position */}
      <FollowUser position={userPosition ?? null} follow={followUser} />

      {/* OpenStreetMap tiles */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Zone circles */}
      {zones.map((zone) => {
        const isActive = zone.name === activeZone;
        const color = getCrowdColor(zone.crowdLevel);
        const position: [number, number] = [zone.latitude, zone.longitude];

        return (
          <React.Fragment key={zone.id}>
            {/* Outer highlight ring for active zone */}
            {isActive && (
              <Circle
                center={position}
                radius={zone.radius + 8}
                pathOptions={{
                  color: "#3b82f6",
                  fillColor: "transparent",
                  fillOpacity: 0,
                  weight: 4,
                  dashArray: "8, 8",
                }}
              />
            )}

            {/* Main zone circle */}
            <Circle
              center={position}
              radius={zone.radius}
              pathOptions={{
                color: isActive ? "#1d4ed8" : color,
                fillColor: color,
                fillOpacity: isActive ? 0.4 : 0.25,
                weight: isActive ? 4 : 2,
              }}
              eventHandlers={{
                click: () => onZoneClick?.(zone),
              }}
            >
              {/* Always-visible tooltip with zone name */}
              <Tooltip permanent direction="center" className="zone-label">
                <span className="font-semibold text-xs">{zone.name}</span>
              </Tooltip>

              {/* Popup with detailed info */}
              <Popup>
                <div className="p-1 min-w-[140px]">
                  <h3 className="font-bold text-base mb-2 border-b pb-1">
                    {zone.name}
                    {isActive && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        You're here
                      </span>
                    )}
                  </h3>

                  <div className="space-y-1.5 text-sm">
                    {/* Crowd count */}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Crowd:</span>
                      <span className="font-semibold">
                        {zone.currentCount} / {zone.capacity}
                      </span>
                    </div>

                    {/* Occupancy bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(zone.occupancyPercentage, 100)}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>

                    {/* Crowd level */}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium" style={{ color }}>
                        {getCrowdLabel(zone.crowdLevel)}
                      </span>
                    </div>

                    {/* Available spots */}
                    <div className="flex justify-between items-center text-xs text-gray-500 pt-1 border-t">
                      <span>Available:</span>
                      <span>{zone.capacity - zone.currentCount} spots</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Circle>
          </React.Fragment>
        );
      })}

      {/* User location marker */}
      {userPosition && (
        <Marker position={userPosition} icon={createUserIcon()}>
          <Popup>
            <div className="p-1 text-center">
              <span className="font-semibold text-blue-600">
                📍 Your Location
              </span>
              {activeZone && (
                <p className="text-xs text-gray-600 mt-1">
                  Inside: <span className="font-medium">{activeZone}</span>
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
};

export default EnhancedCampusMap;
