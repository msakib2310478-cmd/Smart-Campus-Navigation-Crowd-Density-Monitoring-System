import React, { useState, useEffect, useMemo } from "react";
import { AdminZone, ZoneRequest, PolygonPoint } from "../types";
import { validateZone, ZoneWarning } from "../utils/geoUtils";

interface ZoneFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (zone: ZoneRequest) => Promise<void>;
  editingZone: AdminZone | null;
  drawnPolygon: PolygonPoint[] | null;
  /** All existing zones — used for duplicate-name and overlap warnings */
  existingZones?: AdminZone[];
}

export const ZoneFormModal: React.FC<ZoneFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingZone,
  drawnPolygon,
  existingZones = [],
}) => {
  const [name, setName] = useState("");
  const [floor, setFloor] = useState(0);
  const [polygon, setPolygon] = useState<PolygonPoint[]>([]);
  const [capacity, setCapacity] = useState(50);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Live validation warnings (advisory — do not block saving)
  const warnings: ZoneWarning[] = useMemo(() => {
    if (!isOpen) return [];
    return validateZone(
      { name, floor, polygon },
      existingZones,
      editingZone?.id ?? null,
    );
  }, [isOpen, name, floor, polygon, existingZones, editingZone]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (editingZone) {
        // Editing existing zone
        setName(editingZone.name);
        setFloor(editingZone.floor ?? 0);
        setPolygon(editingZone.polygon ?? []);
        setCapacity(editingZone.capacity);
        setDescription(editingZone.description || "");
      } else if (drawnPolygon && drawnPolygon.length >= 3) {
        // New zone from drawn polygon
        setName("");
        setFloor(0);
        setPolygon(drawnPolygon);
        setCapacity(50);
        setDescription("");
      }
      setError(null);
    }
  }, [isOpen, editingZone, drawnPolygon]);

  // Compute centroid from polygon for latitude/longitude
  const computeCentroid = (
    coords: PolygonPoint[],
  ): { latitude: number; longitude: number } => {
    if (coords.length === 0) return { latitude: 0, longitude: 0 };
    const sum = coords.reduce(
      (acc, c) => ({
        latitude: acc.latitude + c.latitude,
        longitude: acc.longitude + c.longitude,
      }),
      { latitude: 0, longitude: 0 },
    );
    return {
      latitude: sum.latitude / coords.length,
      longitude: sum.longitude / coords.length,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError("Zone name is required");
      return;
    }
    if (polygon.length < 3) {
      setError("Polygon must have at least 3 points");
      return;
    }
    if (capacity <= 0) {
      setError("Capacity must be greater than 0");
      return;
    }

    const centroid = computeCentroid(polygon);

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        latitude: centroid.latitude,
        longitude: centroid.longitude,
        radius: 0,
        floor,
        polygon,
        capacity,
        description: description.trim() || undefined,
      });
    } catch (err: any) {
      setError(err.message || "Failed to save zone");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 z-10">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {editingZone ? "Edit Zone" : "Create New Zone"}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Validation warnings (advisory only) */}
          {warnings.length > 0 && (
            <div className="mb-4 space-y-2">
              {warnings.map((w, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-300 text-amber-800 rounded-lg text-sm"
                >
                  <span className="mt-0.5">⚠</span>
                  <span>{w.message}</span>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Zone Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zone Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="e.g., Library, Cafeteria"
                required
              />
            </div>

            {/* Floor */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Floor *
              </label>
              <select
                value={floor}
                onChange={(e) => setFloor(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                required
              >
                {Array.from({ length: 12 }, (_, i) => i - 1).map((f) => (
                  <option key={f} value={f}>
                    {f === -1
                      ? "B1 (Basement)"
                      : f === 0
                        ? "Ground Floor"
                        : `Floor ${f}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Polygon status */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Polygon
              </label>
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${
                  polygon.length >= 3
                    ? "bg-green-50 border-green-300 text-green-700"
                    : "bg-amber-50 border-amber-300 text-amber-700"
                }`}
              >
                <span>{polygon.length >= 3 ? "\u2713" : "\u26A0"}</span>
                <span>
                  {polygon.length >= 3
                    ? `${polygon.length} vertices defined`
                    : "Draw a polygon on the map first"}
                </span>
              </div>
            </div>

            {/* Capacity */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capacity *
              </label>
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value))}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              />
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Brief description of this zone"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || polygon.length < 3 || !name.trim()}
                className="px-6 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:from-teal-700 hover:to-cyan-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving
                  ? "Saving..."
                  : editingZone
                    ? "Update Zone"
                    : "Create Zone"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
