import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import {
  ZoneDrawingMap,
  ZoneDrawingMapHandle,
} from "../components/ZoneDrawingMap";
import { ZoneFormModal } from "../components/ZoneFormModal";
import { adminZoneAPI } from "../services/api";
import { AdminZone, ZoneRequest, PolygonPoint } from "../types";
import { useAuth } from "../context/AuthContext";

export const AdminZonePage: React.FC = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const mapRef = useRef<ZoneDrawingMapHandle>(null);

  const [zones, setZones] = useState<AdminZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<AdminZone | null>(null);
  const [drawnPolygon, setDrawnPolygon] = useState<PolygonPoint[] | null>(null);

  // Redirect non-admin users
  useEffect(() => {
    if (!isAdmin) {
      navigate("/dashboard");
    }
  }, [isAdmin, navigate]);

  // Fetch zones
  const fetchZones = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminZoneAPI.getAllZones();
      setZones(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to load zones");
      console.error("Error fetching zones:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  // Handle polygon drawn on map
  const handlePolygonDrawn = (polygon: PolygonPoint[]) => {
    console.log(
      "[AdminZonePage] Polygon received:",
      JSON.stringify(polygon, null, 2),
    );
    console.log(`[AdminZonePage] Total vertices: ${polygon.length}`);
    setDrawnPolygon(polygon);
    setEditingZone(null);
    setIsModalOpen(true);
  };

  // Handle zone edit
  const handleEditZone = (zone: AdminZone) => {
    setEditingZone(zone);
    setDrawnPolygon(null);
    setIsModalOpen(true);
  };

  // Handle zone save
  const handleSaveZone = async (zoneData: ZoneRequest) => {
    try {
      if (editingZone) {
        await adminZoneAPI.updateZone(editingZone.id, zoneData);
      } else {
        await adminZoneAPI.createZone(zoneData);
      }
      // Clear drawn polygon from the map
      mapRef.current?.clearDrawnItems();
      setIsModalOpen(false);
      setEditingZone(null);
      setDrawnPolygon(null);
      await fetchZones();
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to save zone";
      throw new Error(message);
    }
  };

  // Handle zone delete
  const handleDeleteZone = async (zoneId: number) => {
    if (!window.confirm("Are you sure you want to delete this zone?")) {
      return;
    }

    try {
      await adminZoneAPI.deleteZone(zoneId);
      await fetchZones();
    } catch (err) {
      console.error("Error deleting zone:", err);
      setError("Failed to delete zone");
    }
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingZone(null);
    setDrawnPolygon(null);
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Zone Management</h1>
          <p className="text-gray-600 mt-2">
            Draw polygons on the map to define campus zones. Click to place
            vertices, then complete the shape to fill in zone details.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-4 text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
                <h2 className="text-xl font-semibold">Campus Map</h2>
                <p className="text-sm opacity-90">
                  Use the polygon tool (▱) to draw new zones
                </p>
              </div>
              <div className="h-[500px]">
                <ZoneDrawingMap
                  ref={mapRef}
                  zones={zones}
                  onPolygonDrawn={handlePolygonDrawn}
                  onZoneClick={handleEditZone}
                />
              </div>
            </div>
          </div>

          {/* Zone List Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg">
              <div className="p-4 bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
                <h2 className="text-xl font-semibold">
                  Zones ({zones.length})
                </h2>
              </div>

              <div className="p-4 max-h-[500px] overflow-y-auto">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
                    <p className="mt-2 text-gray-500">Loading zones...</p>
                  </div>
                ) : zones.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No zones created yet.</p>
                    <p className="text-sm mt-2">
                      Draw a polygon on the map to create a zone.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {zones.map((zone) => (
                      <div
                        key={zone.id}
                        className="border rounded-lg p-3 hover:bg-gray-50 transition"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-800">
                              {zone.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Capacity: {zone.capacity} | Floor:{" "}
                              {zone.floor ?? "-"}
                            </p>
                            <div className="flex items-center mt-1">
                              <span
                                className={`inline-block w-2 h-2 rounded-full mr-2 ${
                                  zone.crowdLevel === "LOW"
                                    ? "bg-green-500"
                                    : zone.crowdLevel === "MEDIUM"
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                                }`}
                              />
                              <span className="text-xs text-gray-500">
                                {zone.currentCount}/{zone.capacity} (
                                {zone.occupancyPercentage.toFixed(0)}%)
                              </span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditZone(zone)}
                              className="text-blue-500 hover:text-blue-700 text-sm"
                              title="Edit zone"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteZone(zone.id)}
                              className="text-red-500 hover:text-red-700 text-sm"
                              title="Delete zone"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Zone Form Modal */}
      <ZoneFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveZone}
        editingZone={editingZone}
        drawnPolygon={drawnPolygon}
        existingZones={zones}
      />
    </div>
  );
};
