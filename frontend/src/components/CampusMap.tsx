import React from "react";
import { MapContainer, TileLayer, Circle, Popup } from "react-leaflet";
import "../utils/leafletIconFix";

/**
 * Zone with geofence data for map display
 */
export interface CampusZone {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // radius in meters
}

interface CampusMapProps {
  /** Array of campus zones to display as circular geofences */
  zones: CampusZone[];
  /** Map center coordinates [latitude, longitude] */
  center?: [number, number];
  /** Initial zoom level */
  zoom?: number;
  /** Map height (CSS value) */
  height?: string;
  /** Callback when a zone is clicked */
  onZoneClick?: (zone: CampusZone) => void;
  /** Optional user position to highlight */
  userPosition?: [number, number] | null;
}

/** Default campus center (UIU, Dhaka, Bangladesh) */
const DEFAULT_CENTER: [number, number] = [23.8103, 90.4125];
const DEFAULT_ZOOM = 17;

/**
 * Get geofence color based on zone index for visual distinction
 */
const getZoneColor = (index: number): string => {
  const colors = [
    "#3b82f6", // blue
    "#10b981", // green
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#06b6d4", // cyan
  ];
  return colors[index % colors.length];
};

/**
 * CampusMap Component
 *
 * Displays an interactive OpenStreetMap with circular geofences
 * for each campus zone.
 */
export const CampusMap: React.FC<CampusMapProps> = ({
  zones,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  height = "500px",
  onZoneClick,
  userPosition,
}) => {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height, width: "100%" }}
      className="rounded-lg shadow-lg z-0"
    >
      {/* OpenStreetMap Tile Layer */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Render circular geofences for each zone */}
      {zones.map((zone, index) => {
        const color = getZoneColor(index);
        const position: [number, number] = [zone.latitude, zone.longitude];

        return (
          <Circle
            key={zone.id}
            center={position}
            radius={zone.radius}
            pathOptions={{
              color: color,
              fillColor: color,
              fillOpacity: 0.25,
              weight: 3,
            }}
            eventHandlers={{
              click: () => onZoneClick?.(zone),
            }}
          >
            <Popup>
              <div className="p-2 min-w-[120px]">
                <h3 className="font-bold text-base mb-1">{zone.name}</h3>
                <p className="text-sm text-gray-600">Radius: {zone.radius}m</p>
                <p className="text-xs text-gray-500 mt-1">
                  {zone.latitude.toFixed(5)}, {zone.longitude.toFixed(5)}
                </p>
              </div>
            </Popup>
          </Circle>
        );
      })}

      {/* User position marker */}
      {userPosition && (
        <Circle
          center={userPosition}
          radius={5}
          pathOptions={{
            color: "#2563eb",
            fillColor: "#3b82f6",
            fillOpacity: 1,
            weight: 3,
          }}
        >
          <Popup>
            <div className="p-1">
              <span className="font-semibold">Your Location</span>
            </div>
          </Popup>
        </Circle>
      )}
    </MapContainer>
  );
};

export default CampusMap;
