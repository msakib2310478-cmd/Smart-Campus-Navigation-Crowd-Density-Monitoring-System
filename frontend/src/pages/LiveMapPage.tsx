import React, { useEffect, useState } from "react";
import { locationAPI } from "../services/api";
import { Zone } from "../types";
import { useAuth } from "../context/AuthContext";
import { Navbar } from "../components/Navbar";
import { LiveCampusMap } from "../components/LiveCampusMap";

export const LiveMapPage: React.FC = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [updatingZone, setUpdatingZone] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<"gps" | "schematic">("gps");
  const { user } = useAuth();

  useEffect(() => {
    fetchCrowdStatus();
    const interval = setInterval(fetchCrowdStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchCrowdStatus = async () => {
    setLoading(true);
    try {
      const response = await locationAPI.getCrowdStatus();
      setZones(response.data);
    } catch (err) {
      setError("Failed to fetch crowd status");
    } finally {
      setLoading(false);
    }
  };

  const handleZoneClick = (zone: Zone) => {
    setSelectedZone(zone);
  };

  const handleUpdate = async (zoneName: string, action: "ENTER" | "EXIT") => {
    if (!user) {
      setActionError("Please log in first");
      return;
    }

    setUpdatingZone(zoneName + action);
    setActionError("");
    setActionMessage("");
    try {
      await locationAPI.updateLocation({
        userId: user.studentId ?? String(user.userId),
        zoneName,
        action,
      });
      setActionMessage(
        `Successfully ${action === "ENTER" ? "entered" : "exited"} ${zoneName}`,
      );
      await fetchCrowdStatus();
    } catch (err: any) {
      setActionError(
        err?.response?.data?.message || "Failed to update location",
      );
    } finally {
      setUpdatingZone(null);
    }
  };

  const getCrowdColor = (level: string) => {
    switch (level) {
      case "LOW":
        return "#10b981";
      case "MEDIUM":
        return "#eab308";
      case "HIGH":
        return "#ef4444";
      default:
        return "#999999";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50">
      <Navbar />
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-teal-900 mb-8">
            Live Campus Map
          </h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}
          {actionError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {actionError}
            </div>
          )}
          {actionMessage && (
            <div className="bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded mb-6">
              {actionMessage}
            </div>
          )}

          {/* Map Mode Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMapMode("gps")}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                mapMode === "gps"
                  ? "bg-teal-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              📍 GPS Map (Real Location)
            </button>
            <button
              onClick={() => setMapMode("schematic")}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                mapMode === "schematic"
                  ? "bg-teal-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              🗺️ Schematic Map
            </button>
          </div>

          {/* GPS Map with Real Location */}
          {mapMode === "gps" && (
            <div className="bg-white rounded-lg shadow-2xl p-4 mb-8">
              <LiveCampusMap
                height="500px"
                autoStartTracking={true}
                onZoneClick={(zone) => {
                  const matchedZone = zones.find((z) => z.name === zone.name);
                  if (matchedZone) setSelectedZone(matchedZone);
                }}
              />
            </div>
          )}

          {/* Schematic Campus Map Visualization */}
          {mapMode === "schematic" && (
            <div className="bg-white rounded-lg shadow-2xl p-8 mb-8">
              <svg
                viewBox="0 0 1000 600"
                className="w-full border border-gray-300 rounded"
              >
                {/* Campus buildings/zones layout */}
                {zones.map((zone) => {
                  const positions: { [key: string]: { x: number; y: number } } =
                    {
                      Library: { x: 150, y: 100 },
                      Cafeteria: { x: 400, y: 150 },
                      "Study Room": { x: 650, y: 100 },
                      "Game Zone": { x: 150, y: 350 },
                      Gym: { x: 400, y: 380 },
                      Labs: { x: 650, y: 350 },
                      "Common Room": { x: 400, y: 480 },
                    };

                  const pos = positions[zone.name];
                  if (!pos) return null;

                  const radius = 40;
                  const fillColor = getCrowdColor(zone.crowdLevel);
                  const isSelected = selectedZone?.name === zone.name;

                  return (
                    <g key={zone.name}>
                      {/* Building circle */}
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={radius}
                        fill={fillColor}
                        fillOpacity={isSelected ? "1" : "0.8"}
                        stroke={isSelected ? "#000" : "#333"}
                        strokeWidth={isSelected ? "4" : "2"}
                        className="cursor-pointer hover:fill-opacity-100 transition-all duration-200"
                        onClick={() => handleZoneClick(zone)}
                      />

                      {/* Building label */}
                      <text
                        x={pos.x}
                        y={pos.y}
                        textAnchor="middle"
                        dy="0.3em"
                        fill="white"
                        fontSize="14"
                        fontWeight="bold"
                        pointerEvents="none"
                      >
                        {zone.name.split(" ")[0]}
                      </text>

                      {/* Occupancy info below */}
                      <text
                        x={pos.x}
                        y={pos.y + 60}
                        textAnchor="middle"
                        fontSize="12"
                        fill="#333"
                        pointerEvents="none"
                      >
                        {zone.currentCount}/{zone.capacity}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}

          {/* Legend */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Legend</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500"></div>
                <span className="text-gray-700">
                  <span className="font-semibold">LOW</span> - Less than 50%
                  capacity
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-yellow-500"></div>
                <span className="text-gray-700">
                  <span className="font-semibold">MEDIUM</span> - 50-80%
                  capacity
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-red-500"></div>
                <span className="text-gray-700">
                  <span className="font-semibold">HIGH</span> - 80%+ capacity
                </span>
              </div>
            </div>
          </div>

          {/* Selected Zone Actions */}
          {selectedZone && (
            <div className="bg-white rounded-lg shadow-xl p-6 mb-8 border-2 border-teal-500">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-gray-900">
                  Navigate to {selectedZone.name}
                </h3>
                <button
                  onClick={() => setSelectedZone(null)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ✕
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold mb-3">
                    Zone Information
                  </h4>
                  <div className="space-y-2">
                    <p>
                      <span className="font-semibold">Status:</span>
                      <span
                        className="ml-2 font-bold"
                        style={{
                          color: getCrowdColor(selectedZone.crowdLevel),
                        }}
                      >
                        {selectedZone.crowdLevel}
                      </span>
                    </p>
                    <p>
                      <span className="font-semibold">Current Occupancy:</span>{" "}
                      {selectedZone.currentCount}/{selectedZone.capacity}
                    </p>
                    <p>
                      <span className="font-semibold">Occupancy Rate:</span>{" "}
                      {selectedZone.occupancyPercentage.toFixed(1)}%
                    </p>
                    <p>
                      <span className="font-semibold">Available Spots:</span>{" "}
                      {selectedZone.capacity - selectedZone.currentCount}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-3">
                    Navigation Actions
                  </h4>
                  <div className="space-y-3">
                    <button
                      onClick={() => handleUpdate(selectedZone.name, "ENTER")}
                      disabled={!!updatingZone}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updatingZone === selectedZone.name + "ENTER"
                        ? "Entering Zone..."
                        : "Enter Zone"}
                    </button>
                    <button
                      onClick={() => handleUpdate(selectedZone.name, "EXIT")}
                      disabled={!!updatingZone}
                      className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updatingZone === selectedZone.name + "EXIT"
                        ? "Exiting Zone..."
                        : "Exit Zone"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Detailed Zone Information */}
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Zone Details
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {zones.map((zone) => (
              <div
                key={zone.name}
                onClick={() => handleZoneClick(zone)}
                className={`bg-white rounded-lg shadow-md p-4 border-l-4 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  selectedZone?.name === zone.name
                    ? "ring-2 ring-teal-500 shadow-xl"
                    : ""
                }`}
                style={{ borderColor: getCrowdColor(zone.crowdLevel) }}
              >
                <h4 className="font-bold text-gray-900 mb-3">{zone.name}</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    <span className="font-semibold">Status:</span>{" "}
                    <span
                      className="font-bold"
                      style={{ color: getCrowdColor(zone.crowdLevel) }}
                    >
                      {zone.crowdLevel}
                    </span>
                  </p>
                  <p>
                    <span className="font-semibold">Occupancy:</span>{" "}
                    {zone.currentCount}/{zone.capacity}
                  </p>
                  <p>
                    <span className="font-semibold">Percentage:</span>{" "}
                    {zone.occupancyPercentage.toFixed(1)}%
                  </p>
                  <p>
                    <span className="font-semibold">Available:</span>{" "}
                    {zone.capacity - zone.currentCount}
                  </p>
                </div>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => handleUpdate(zone.name, "ENTER")}
                    disabled={!!updatingZone}
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2 rounded font-semibold transition disabled:opacity-50"
                  >
                    {updatingZone === zone.name + "ENTER"
                      ? "Entering..."
                      : "Enter"}
                  </button>
                  <button
                    onClick={() => handleUpdate(zone.name, "EXIT")}
                    disabled={!!updatingZone}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded font-semibold transition disabled:opacity-50"
                  >
                    {updatingZone === zone.name + "EXIT"
                      ? "Exiting..."
                      : "Exit"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {loading && (
            <div className="text-center py-12">
              <p className="text-gray-600">Updating map...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
