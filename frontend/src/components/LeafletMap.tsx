import React, { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "../utils/leafletIconFix"; // Apply icon fix

// Zone interface for map display
interface ZoneMarker {
  name: string;
  position: [number, number]; // [lat, lng]
  crowdLevel: "LOW" | "MEDIUM" | "HIGH";
  currentCount: number;
  capacity: number;
  occupancyPercentage: number;
}

interface LeafletMapProps {
  zones: ZoneMarker[];
  userPosition?: [number, number] | null;
  center?: [number, number];
  zoom?: number;
  onZoneClick?: (zoneName: string) => void;
  selectedZone?: string | null;
}

// Custom hook to update map view when center changes
const MapUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({
  center,
  zoom,
}) => {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  return null;
};

// Get color based on crowd level
const getCrowdColor = (level: string): string => {
  switch (level) {
    case "LOW":
      return "#10b981"; // green
    case "MEDIUM":
      return "#eab308"; // yellow
    case "HIGH":
      return "#ef4444"; // red
    default:
      return "#6b7280"; // gray
  }
};

// Create custom marker icon with crowd level color
const createZoneIcon = (crowdLevel: string, isSelected: boolean): L.DivIcon => {
  const color = getCrowdColor(crowdLevel);
  const size = isSelected ? 40 : 32;
  const borderWidth = isSelected ? 4 : 2;

  return L.divIcon({
    className: "custom-zone-marker",
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: ${borderWidth}px solid ${isSelected ? "#000" : "#fff"};
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform 0.2s;
      "></div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

// Create user location icon
const userLocationIcon = L.divIcon({
  className: "user-location-marker",
  html: `
    <div style="
      width: 20px;
      height: 20px;
      background-color: #3b82f6;
      border: 3px solid #fff;
      border-radius: 50%;
      box-shadow: 0 0 0 2px #3b82f6, 0 2px 6px rgba(0,0,0,0.3);
    "></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

export const LeafletMap: React.FC<LeafletMapProps> = ({
  zones,
  userPosition,
  center = [23.8103, 90.4125], // Default: Dhaka, Bangladesh (UIU area)
  zoom = 17,
  onZoneClick,
  selectedZone,
}) => {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: "100%", width: "100%", minHeight: "400px" }}
      className="rounded-lg shadow-lg"
    >
      <MapUpdater center={center} zoom={zoom} />

      {/* OpenStreetMap Tile Layer */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Zone Markers with Crowd Density Circles */}
      {zones.map((zone) => (
        <React.Fragment key={zone.name}>
          {/* Crowd density circle */}
          <Circle
            center={zone.position}
            radius={30 + zone.occupancyPercentage * 0.5} // Dynamic radius based on occupancy
            pathOptions={{
              color: getCrowdColor(zone.crowdLevel),
              fillColor: getCrowdColor(zone.crowdLevel),
              fillOpacity: 0.2,
              weight: 2,
            }}
          />

          {/* Zone marker */}
          <Marker
            position={zone.position}
            icon={createZoneIcon(zone.crowdLevel, selectedZone === zone.name)}
            eventHandlers={{
              click: () => onZoneClick?.(zone.name),
            }}
          >
            <Popup>
              <div className="p-2 min-w-[150px]">
                <h3 className="font-bold text-lg mb-2">{zone.name}</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-semibold">Status: </span>
                    <span
                      style={{
                        color: getCrowdColor(zone.crowdLevel),
                        fontWeight: "bold",
                      }}
                    >
                      {zone.crowdLevel}
                    </span>
                  </p>
                  <p>
                    <span className="font-semibold">Occupancy: </span>
                    {zone.currentCount}/{zone.capacity}
                  </p>
                  <p>
                    <span className="font-semibold">Usage: </span>
                    {zone.occupancyPercentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            </Popup>
          </Marker>
        </React.Fragment>
      ))}

      {/* User Location Marker */}
      {userPosition && (
        <Marker position={userPosition} icon={userLocationIcon}>
          <Popup>
            <div className="p-2">
              <h3 className="font-bold">Your Location</h3>
              <p className="text-sm text-gray-600">
                {userPosition[0].toFixed(6)}, {userPosition[1].toFixed(6)}
              </p>
            </div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
};

export default LeafletMap;
