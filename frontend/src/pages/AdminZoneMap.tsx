import React, { useEffect, useRef, useCallback, useState } from "react";
import { MapContainer, TileLayer, Circle, useMap, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet-draw";
import { Navbar } from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { CAMPUS_CENTER, DEFAULT_ZOOM } from "../config/zoneCoordinates";
import { adminZoneAPI } from "../services/api";

// Fix Leaflet default icon issue
import "../utils/leafletIconFix";

// Safety check constants
const MIN_RADIUS = 10; // meters
const MAX_RADIUS = 200; // meters

interface DrawnZone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number;
  isSaved?: boolean; // Flag to indicate if zone is saved to backend
}

interface ZoneWarning {
  type: "radius" | "duplicate" | "overlap";
  message: string;
}

/**
 * Draw Control Component
 * Adds circle-only drawing tools to the map with edit/delete support
 */
const DrawControl: React.FC<{
  onCircleDrawn: (lat: number, lng: number, radius: number) => void;
  onCircleEdited?: (layers: L.LayerGroup) => void;
  onCircleDeleted?: (layers: L.LayerGroup) => void;
}> = ({ onCircleDrawn, onCircleEdited, onCircleDeleted }) => {
  const map = useMap();
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);

  useEffect(() => {
    // Create feature group for drawn items
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;

    // Configure draw control - CIRCLE ONLY
    const drawControl = new L.Control.Draw({
      position: "topright",
      draw: {
        // Disable all except circle
        polygon: false,
        polyline: false,
        rectangle: false,
        marker: false,
        circlemarker: false,
        // Enable circle with custom styling
        circle: {
          shapeOptions: {
            color: "#0d9488",
            fillColor: "#14b8a6",
            fillOpacity: 0.3,
            weight: 2,
          },
          showRadius: true,
          metric: true,
          feet: false,
        },
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
        edit: {},
      },
    });

    map.addControl(drawControl);

    // Handle circle creation
    map.on(L.Draw.Event.CREATED, (event: any) => {
      const layer = event.layer;

      if (event.layerType === "circle") {
        const center = layer.getLatLng();
        const radius = Math.round(layer.getRadius());

        // Add to FeatureGroup
        drawnItems.addLayer(layer);

        // Notify parent
        onCircleDrawn(center.lat, center.lng, radius);
      }
    });

    // Handle circle edit
    map.on(L.Draw.Event.EDITED, (event: any) => {
      const layers = event.layers;
      if (onCircleEdited) {
        onCircleEdited(layers);
      }
      console.log("Circles edited:", layers.getLayers().length);
    });

    // Handle circle delete
    map.on(L.Draw.Event.DELETED, (event: any) => {
      const layers = event.layers;
      if (onCircleDeleted) {
        onCircleDeleted(layers);
      }
      console.log("Circles deleted:", layers.getLayers().length);
    });

    // Cleanup
    return () => {
      map.off(L.Draw.Event.CREATED);
      map.off(L.Draw.Event.EDITED);
      map.off(L.Draw.Event.DELETED);
      map.removeControl(drawControl);
      map.removeLayer(drawnItems);
    };
  }, [map, onCircleDrawn, onCircleEdited, onCircleDeleted]);

  return null;
};

/**
 * AdminZoneMap Page
 * Admin-only page for drawing and managing campus zones
 */
export const AdminZoneMap: React.FC = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [zones, setZones] = useState<DrawnZone[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [pendingCircle, setPendingCircle] = useState<{
    lat: number;
    lng: number;
    radius: number;
  } | null>(null);
  const [zoneName, setZoneName] = useState("");
  const [zoneCapacity, setZoneCapacity] = useState(50);

  // API state
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<ZoneWarning[]>([]);

  // Safety check functions
  const checkRadiusRange = (radius: number): ZoneWarning | null => {
    if (radius < MIN_RADIUS) {
      const msg = `⚠️ Radius ${radius}m is below minimum (${MIN_RADIUS}m). Consider increasing.`;
      console.warn("[ZONE SAFETY] Radius too small:", msg);
      return { type: "radius", message: msg };
    }
    if (radius > MAX_RADIUS) {
      const msg = `⚠️ Radius ${radius}m exceeds maximum (${MAX_RADIUS}m). Consider reducing.`;
      console.warn("[ZONE SAFETY] Radius too large:", msg);
      return { type: "radius", message: msg };
    }
    return null;
  };

  const checkDuplicateName = (name: string): ZoneWarning | null => {
    const duplicate = zones.find(
      (z) => z.name.toLowerCase().trim() === name.toLowerCase().trim(),
    );
    if (duplicate) {
      const msg = `⚠️ Zone name "${name}" already exists. Consider using a unique name.`;
      console.warn("[ZONE SAFETY] Duplicate name:", msg);
      return { type: "duplicate", message: msg };
    }
    return null;
  };

  const checkOverlappingZones = (
    lat: number,
    lng: number,
    radius: number,
  ): ZoneWarning | null => {
    // Calculate distance between two points using Haversine formula
    const getDistanceMeters = (
      lat1: number,
      lng1: number,
      lat2: number,
      lng2: number,
    ): number => {
      const R = 6371000; // Earth's radius in meters
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLng = ((lng2 - lng1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const overlapping = zones.filter((zone) => {
      const distance = getDistanceMeters(lat, lng, zone.lat, zone.lng);
      const combinedRadius = radius + zone.radius;
      return distance < combinedRadius; // Circles overlap if distance < sum of radii
    });

    if (overlapping.length > 0) {
      const names = overlapping.map((z) => z.name).join(", ");
      const msg = `⚠️ New zone overlaps with: ${names}. Consider adjusting position or radius.`;
      console.warn("[ZONE SAFETY] Overlapping zones:", msg);
      return { type: "overlap", message: msg };
    }
    return null;
  };

  const runSafetyChecks = (
    name: string,
    lat: number,
    lng: number,
    radius: number,
  ): ZoneWarning[] => {
    const newWarnings: ZoneWarning[] = [];

    const radiusWarning = checkRadiusRange(radius);
    if (radiusWarning) newWarnings.push(radiusWarning);

    const duplicateWarning = checkDuplicateName(name);
    if (duplicateWarning) newWarnings.push(duplicateWarning);

    const overlapWarning = checkOverlappingZones(lat, lng, radius);
    if (overlapWarning) newWarnings.push(overlapWarning);

    return newWarnings;
  };

  // Redirect non-admin users
  useEffect(() => {
    if (!isAdmin) {
      navigate("/dashboard");
    }
  }, [isAdmin, navigate]);

  // Fetch existing zones from backend on mount
  useEffect(() => {
    const fetchZones = async () => {
      try {
        setLoading(true);
        const response = await adminZoneAPI.getAllZones();
        const savedZones: DrawnZone[] = response.data.map((zone) => ({
          id: zone.id.toString(),
          name: zone.name,
          lat: zone.latitude,
          lng: zone.longitude,
          radius: zone.radius,
          isSaved: true, // Mark as saved from backend
        }));
        setZones(savedZones);
        console.log("=== LOADED ZONES FROM BACKEND ===");
        console.log("Zones:", savedZones);
      } catch (err: any) {
        console.error("Error fetching zones:", err);
        setError("Failed to load existing zones");
      } finally {
        setLoading(false);
      }
    };

    fetchZones();
  }, []);

  // Handle circle drawn on map - extract and log zone data
  const handleCircleDrawn = useCallback(
    (lat: number, lng: number, radius: number) => {
      // Extract zone data
      const zoneData = {
        latitude: lat,
        longitude: lng,
        radius: radius,
      };

      // Log extracted values for verification
      console.log("=== ZONE DATA EXTRACTED (DRAW) ===");
      console.log("Center Latitude:", zoneData.latitude);
      console.log("Center Longitude:", zoneData.longitude);
      console.log("Radius (meters):", zoneData.radius);
      console.log("Raw data:", zoneData);

      // Store in React state
      setPendingCircle({ lat, lng, radius });
      setShowForm(true);
      setZoneName("");
      setZoneCapacity(50);
    },
    [],
  );

  // Handle circle edited - extract updated zone data
  const handleCircleEdited = useCallback((layers: L.LayerGroup) => {
    layers.eachLayer((layer: any) => {
      if (layer instanceof L.Circle) {
        const center = layer.getLatLng();
        const radius = Math.round(layer.getRadius());

        // Extract updated zone data
        const updatedZoneData = {
          latitude: center.lat,
          longitude: center.lng,
          radius: radius,
        };

        // Log extracted values for verification
        console.log("=== ZONE DATA EXTRACTED (EDIT) ===");
        console.log("Center Latitude:", updatedZoneData.latitude);
        console.log("Center Longitude:", updatedZoneData.longitude);
        console.log("Radius (meters):", updatedZoneData.radius);
        console.log("Raw data:", updatedZoneData);

        // Update zone in state if it exists
        setZones((prev) =>
          prev.map((zone) => {
            // Find matching zone by approximate location
            const latMatch = Math.abs(zone.lat - center.lat) < 0.0001;
            const lngMatch = Math.abs(zone.lng - center.lng) < 0.0001;
            if (latMatch && lngMatch) {
              return { ...zone, lat: center.lat, lng: center.lng, radius };
            }
            return zone;
          }),
        );
      }
    });
  }, []);

  // Handle circle deleted - log deletion
  const handleCircleDeleted = useCallback((layers: L.LayerGroup) => {
    layers.eachLayer((layer: any) => {
      if (layer instanceof L.Circle) {
        const center = layer.getLatLng();
        const radius = Math.round(layer.getRadius());

        console.log("=== ZONE DATA EXTRACTED (DELETE) ===");
        console.log("Deleted - Latitude:", center.lat);
        console.log("Deleted - Longitude:", center.lng);
        console.log("Deleted - Radius (meters):", radius);

        // Remove from state
        setZones((prev) =>
          prev.filter((zone) => {
            const latMatch = Math.abs(zone.lat - center.lat) < 0.0001;
            const lngMatch = Math.abs(zone.lng - center.lng) < 0.0001;
            return !(latMatch && lngMatch);
          }),
        );
      }
    });
  }, []);

  // Save zone to backend API
  const handleSaveZone = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();

    if (!pendingCircle || !zoneName.trim()) return;

    // Clear previous messages
    setError(null);
    setSuccessMessage(null);
    setWarnings([]);

    // Run safety checks (warnings only - don't block saving)
    const safetyWarnings = runSafetyChecks(
      zoneName.trim(),
      pendingCircle.lat,
      pendingCircle.lng,
      pendingCircle.radius,
    );

    if (safetyWarnings.length > 0) {
      setWarnings(safetyWarnings);
      console.log(
        "[ZONE SAFETY] Warnings detected but continuing with save:",
        safetyWarnings,
      );
    }

    setSaving(true);

    try {
      // Prepare zone data for API
      const zoneRequest = {
        name: zoneName.trim(),
        latitude: pendingCircle.lat,
        longitude: pendingCircle.lng,
        radius: pendingCircle.radius,
        floor: 0,
        capacity: zoneCapacity,
      };

      console.log("=== SENDING TO BACKEND ===");
      console.log("POST /api/zones", zoneRequest);

      // Call backend API
      const response = await adminZoneAPI.createZone(zoneRequest);
      const savedZone = response.data;

      console.log("=== ZONE SAVED TO BACKEND ===");
      console.log("Response:", savedZone);

      // Add to local state with isSaved flag
      const newZone: DrawnZone = {
        id: savedZone.id?.toString() || Date.now().toString(),
        name: savedZone.name,
        lat: savedZone.latitude,
        lng: savedZone.longitude,
        radius: savedZone.radius,
        isSaved: true,
      };

      setZones((prev) => [...prev, newZone]);

      // Clear form and drawn circle
      setShowForm(false);
      setPendingCircle(null);
      setZoneName("");
      setZoneCapacity(50);

      // Show success message
      setSuccessMessage(`Zone "${savedZone.name}" created successfully!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error("=== ERROR SAVING ZONE ===", err);

      // Extract error message
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to save zone. Please try again.";

      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Cancel zone creation
  const handleCancel = () => {
    setShowForm(false);
    setPendingCircle(null);
    setZoneName("");
    setZoneCapacity(50);
    setError(null);
    setWarnings([]);
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            🗺️ Admin Zone Map
          </h1>
          <p className="text-gray-600 mt-2">
            Draw circles on the map to define campus zones. Use the circle tool
            (○) in the top-right corner.
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg flex justify-between items-center">
            <span>✅ {successMessage}</span>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-green-500 hover:text-green-700"
            >
              ✕
            </button>
          </div>
        )}

        {/* Safety Warnings */}
        {warnings.length > 0 && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-amber-800 mb-2">
                  🚧 Safety Warnings (zone was saved)
                </h4>
                <ul className="space-y-1">
                  {warnings.map((warning, index) => (
                    <li key={index} className="text-amber-700 text-sm">
                      {warning.message}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => setWarnings([])}
                className="text-amber-500 hover:text-amber-700"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg flex justify-between items-center">
            <span>❌ {error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}

        {/* Zone Creation Panel - Inline */}
        <div className="mb-4 bg-white rounded-lg shadow-lg p-4">
          <div className="flex flex-wrap items-end gap-4">
            {/* Zone Name Input */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zone Name
              </label>
              <input
                type="text"
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                placeholder="Enter zone name (e.g., Library)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            {/* Capacity Input */}
            <div className="w-32">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capacity
              </label>
              <input
                type="number"
                value={zoneCapacity}
                onChange={(e) => setZoneCapacity(parseInt(e.target.value) || 1)}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            {/* Circle Info Display */}
            <div className="w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Drawn Circle
              </label>
              <div
                className={`px-3 py-2 rounded-lg text-sm ${
                  pendingCircle
                    ? "bg-teal-50 text-teal-700 border border-teal-200"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {pendingCircle
                  ? `📍 ${pendingCircle.radius}m radius`
                  : "No circle drawn"}
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveZone}
              disabled={!pendingCircle || !zoneName.trim() || saving}
              className={`px-6 py-2 rounded-lg font-medium transition ${
                pendingCircle && zoneName.trim() && !saving
                  ? "bg-teal-600 text-white hover:bg-teal-700 cursor-pointer"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span> Saving...
                </span>
              ) : (
                "💾 Save Zone"
              )}
            </button>

            {/* Clear Button */}
            {pendingCircle && (
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
              >
                ✕ Clear
              </button>
            )}
          </div>

          {/* Help Text */}
          {!pendingCircle && (
            <p className="mt-3 text-sm text-gray-500">
              👆 Draw a circle on the map using the circle tool, then enter a
              name and click Save.
            </p>
          )}
          {pendingCircle && !zoneName.trim() && (
            <p className="mt-3 text-sm text-amber-600">
              ⚠️ Enter a zone name to save this circle.
            </p>
          )}

          {/* Real-time Safety Warnings Preview */}
          {pendingCircle && zoneName.trim() && (
            <div className="mt-3">
              {(() => {
                const previewWarnings = runSafetyChecks(
                  zoneName.trim(),
                  pendingCircle.lat,
                  pendingCircle.lng,
                  pendingCircle.radius,
                );
                if (previewWarnings.length === 0) return null;
                return (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm font-medium text-amber-800 mb-1">
                      ⚠️ Warnings (will not block saving):
                    </p>
                    <ul className="text-sm text-amber-700 space-y-0.5">
                      {previewWarnings.map((w, i) => (
                        <li key={i}>• {w.message}</li>
                      ))}
                    </ul>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Map Container */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden relative">
          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-[1000]">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                <span className="text-gray-600">Loading zones...</span>
              </div>
            </div>
          )}
          <div className="h-[600px]">
            <MapContainer
              center={CAMPUS_CENTER}
              zoom={DEFAULT_ZOOM}
              className="h-full w-full"
              zoomControl={true}
            >
              {/* OpenStreetMap Tiles */}
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
              />

              {/* Draw Control - Circle Only */}
              <DrawControl
                onCircleDrawn={handleCircleDrawn}
                onCircleEdited={handleCircleEdited}
                onCircleDeleted={handleCircleDeleted}
              />

              {/* Render saved zones (from backend - green, not editable) */}
              {zones
                .filter((zone) => zone.isSaved)
                .map((zone) => (
                  <Circle
                    key={`saved-${zone.id}`}
                    center={[zone.lat, zone.lng]}
                    radius={zone.radius}
                    pathOptions={{
                      color: "#22c55e",
                      fillColor: "#22c55e",
                      fillOpacity: 0.3,
                      weight: 2,
                    }}
                    eventHandlers={{
                      click: () => {
                        console.log("Saved zone clicked:", zone.name);
                      },
                    }}
                  >
                    <Popup>
                      <div className="text-center">
                        <h3 className="font-semibold">{zone.name}</h3>
                        <p className="text-sm text-gray-500">
                          Radius: {zone.radius}m
                        </p>
                        <p className="text-xs text-gray-400">
                          Saved to backend
                        </p>
                      </div>
                    </Popup>
                  </Circle>
                ))}

              {/* Render pending zones (not yet saved - blue, editable) */}
              {zones
                .filter((zone) => !zone.isSaved)
                .map((zone) => (
                  <Circle
                    key={`pending-${zone.id}`}
                    center={[zone.lat, zone.lng]}
                    radius={zone.radius}
                    pathOptions={{
                      color: "#3b82f6",
                      fillColor: "#3b82f6",
                      fillOpacity: 0.3,
                      weight: 2,
                      dashArray: "5, 5",
                    }}
                  >
                    <Popup>
                      <div className="text-center">
                        <h3 className="font-semibold">{zone.name}</h3>
                        <p className="text-sm text-gray-500">
                          Radius: {zone.radius}m
                        </p>
                        <p className="text-xs text-orange-500">Not yet saved</p>
                      </div>
                    </Popup>
                  </Circle>
                ))}
            </MapContainer>
          </div>
        </div>

        {/* Zone List */}
        {zones.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-lg p-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Created Zones ({zones.length})
            </h2>
            <div className="flex gap-4 mb-3 text-sm">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                Saved ({zones.filter((z) => z.isSaved).length})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                Pending ({zones.filter((z) => !z.isSaved).length})
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {zones.map((zone) => (
                <div
                  key={zone.id}
                  className={`border rounded-lg p-3 ${
                    zone.isSaved
                      ? "bg-green-50 border-green-200"
                      : "bg-blue-50 border-blue-200 border-dashed"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-800">{zone.name}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        zone.isSaved
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {zone.isSaved ? "Saved" : "Pending"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Radius: {zone.radius}m
                  </p>
                  <p className="text-xs text-gray-400">
                    {zone.lat.toFixed(6)}, {zone.lng.toFixed(6)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Zone Name Modal */}
      {showForm && pendingCircle && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={handleCancel}
          />
          <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Name Your Zone
            </h2>

            <form onSubmit={handleSaveZone}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zone Name *
                </label>
                <input
                  type="text"
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="e.g., Library, Cafeteria"
                  autoFocus
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity
                </label>
                <input
                  type="number"
                  value={zoneCapacity}
                  onChange={(e) => setZoneCapacity(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  min="1"
                />
              </div>

              <div className="text-sm text-gray-500 mb-4">
                <p>
                  📍 Location: {pendingCircle.lat.toFixed(6)},{" "}
                  {pendingCircle.lng.toFixed(6)}
                </p>
                <p>📏 Radius: {pendingCircle.radius}m</p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  Save Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
