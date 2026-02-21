import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  useGeolocation,
  GeolocationPosition,
  UseGeolocationOptions,
} from "./useGeolocation";
import {
  ZONE_COORDINATES,
  ZoneCoordinateConfig,
  calculateDistance,
  isInCampusArea,
} from "../config/zoneCoordinates";
import { BoundingBox, bboxContains, computeBoundingBox } from "../utils/geoUtils";

/**
 * Geofence zone with distance information
 */
export interface GeofenceZone {
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  distance: number; // Current distance from user in meters
  isInside: boolean;
}

/**
 * Geofence event triggered on zone enter/exit
 */
export interface GeofenceEvent {
  type: "ENTER" | "EXIT";
  zoneName: string;
  timestamp: Date;
  position: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Geofencing hook options
 */
export interface UseGeofencingOptions extends UseGeolocationOptions {
  /** Callback when user enters a zone */
  onEnter?: (event: GeofenceEvent) => void;
  /** Callback when user exits a zone */
  onExit?: (event: GeofenceEvent) => void;
  /** Custom zones to monitor (uses ZONE_COORDINATES if not provided) */
  zones?: Record<string, ZoneCoordinateConfig>;
  /** Hysteresis buffer in meters to prevent rapid enter/exit at boundaries */
  hysteresisBuffer?: number;
}

/**
 * Geofencing hook return value
 */
export interface UseGeofencingReturn {
  /** Currently active zone (user is inside) - only one at a time */
  activeZone: string | null;
  /** All zones with distance and inside/outside status */
  zones: GeofenceZone[];
  /** Current user position */
  position: GeolocationPosition | null;
  /** Whether location tracking is active */
  isTracking: boolean;
  /** Whether geolocation is supported */
  isSupported: boolean;
  /** Permission granted status */
  permissionGranted: boolean | null;
  /** Any geolocation error */
  error: { type: string; message: string } | null;
  /** History of geofence events */
  eventHistory: GeofenceEvent[];
  /** Whether the user is currently inside the UIU campus area */
  isInsideCampus: boolean;
  /** Start tracking location */
  startTracking: () => void;
  /** Stop tracking location */
  stopTracking: () => void;
  /** Clear event history */
  clearHistory: () => void;
}

/**
 * Default hysteresis buffer (5 meters)
 * Prevents rapid enter/exit events when user is at zone boundary
 */
const DEFAULT_HYSTERESIS = 5;

/**
 * useGeofencing Hook
 *
 * Monitors user location and detects when they enter or exit defined zones.
 * Uses Haversine distance formula for accurate distance calculations.
 * Only one zone can be active at a time (closest zone if overlapping).
 *
 * @example
 * ```tsx
 * const { activeZone, zones, startTracking } = useGeofencing({
 *   onEnter: (event) => console.log(`Entered ${event.zoneName}`),
 *   onExit: (event) => console.log(`Exited ${event.zoneName}`),
 *   autoStart: true,
 * });
 * ```
 */
export const useGeofencing = (
  options: UseGeofencingOptions = {},
): UseGeofencingReturn => {
  const {
    onEnter,
    onExit,
    zones: customZones,
    hysteresisBuffer = DEFAULT_HYSTERESIS,
    ...geolocationOptions
  } = options;

  // Zone configuration to use
  const zoneConfig = customZones || ZONE_COORDINATES;

  // -----------------------------------------------------------------------
  // Bounding-box pre-computation (runs once per zone config change)
  // -----------------------------------------------------------------------
  // For every zone (circle-based in ZONE_COORDINATES), we pre-compute an
  // axis-aligned bounding box so that the per-update loop can skip zones
  // whose bbox does not contain the user's position — a simple four-
  // comparison check that avoids expensive Haversine trigonometry for the
  // vast majority (90%+) of zones on each tick.
  // -----------------------------------------------------------------------
  const zoneBBoxes = useMemo<Record<string, BoundingBox>>(() => {
    const bboxes: Record<string, BoundingBox> = {};
    for (const [name, config] of Object.entries(zoneConfig)) {
      bboxes[name] = computeBoundingBox({
        center: { latitude: config.latitude, longitude: config.longitude },
        radiusMeters: config.radius,
      });
    }
    return bboxes;
  }, [zoneConfig]);

  // Geolocation hook
  const {
    position,
    error,
    isTracking,
    isSupported,
    permissionGranted,
    startTracking,
    stopTracking,
  } = useGeolocation(geolocationOptions);

  // State
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [zonesWithDistance, setZonesWithDistance] = useState<GeofenceZone[]>(
    [],
  );
  const [eventHistory, setEventHistory] = useState<GeofenceEvent[]>([]);
  const [isInsideCampus, setIsInsideCampus] = useState<boolean>(false);

  // Refs to track previous state and prevent duplicate events
  const previousActiveZoneRef = useRef<string | null>(null);
  const isInsideMapRef = useRef<Map<string, boolean>>(new Map());

  /**
   * Calculate distances and determine zone status for all zones.
   *
   * Optimization: before running the expensive Haversine distance formula,
   * each zone's pre-computed bounding box is tested with a simple lat/lon
   * comparison (O(1), no trig). Zones whose bbox does NOT contain the
   * user's position are immediately marked as "outside" and skipped,
   * avoiding the costly trigonometric Haversine call for the vast majority
   * of zones on every GPS tick.
   */
  const calculateZoneDistances = useCallback(
    (userLat: number, userLng: number): GeofenceZone[] => {
      return Object.entries(zoneConfig).map(([name, config]) => {
        // --- Fast bounding-box reject ---
        // If the user is outside the zone's bbox, skip the expensive
        // Haversine distance calculation and report as "outside" with
        // Infinity distance so this zone never wins the closest-zone tie.
        const bbox = zoneBBoxes[name];
        if (
          bbox &&
          !bboxContains({ latitude: userLat, longitude: userLng }, bbox)
        ) {
          return {
            name,
            latitude: config.latitude,
            longitude: config.longitude,
            radius: config.radius,
            distance: Infinity,
            isInside: false,
          };
        }

        // --- Precise Haversine check (only for bbox-passing candidates) ---
        const distance = calculateDistance(
          userLat,
          userLng,
          config.latitude,
          config.longitude,
        );

        // Apply hysteresis: if already inside, use larger radius to exit
        const wasInside = isInsideMapRef.current.get(name) || false;
        const effectiveRadius = wasInside
          ? config.radius + hysteresisBuffer
          : config.radius;

        const isInside = distance <= effectiveRadius;

        return {
          name,
          latitude: config.latitude,
          longitude: config.longitude,
          radius: config.radius,
          distance,
          isInside,
        };
      });
    },
    [zoneConfig, zoneBBoxes, hysteresisBuffer],
  );

  /**
   * Determine the active zone (closest zone if multiple overlap)
   */
  const determineActiveZone = useCallback(
    (zones: GeofenceZone[]): string | null => {
      const insideZones = zones.filter((z) => z.isInside);

      if (insideZones.length === 0) {
        return null;
      }

      // If multiple zones overlap, pick the closest one
      insideZones.sort((a, b) => a.distance - b.distance);
      return insideZones[0].name;
    },
    [],
  );

  /**
   * Create and dispatch a geofence event
   */
  const dispatchEvent = useCallback(
    (type: "ENTER" | "EXIT", zoneName: string, lat: number, lng: number) => {
      const event: GeofenceEvent = {
        type,
        zoneName,
        timestamp: new Date(),
        position: { latitude: lat, longitude: lng },
      };

      setEventHistory((prev) => [...prev, event]);

      if (type === "ENTER" && onEnter) {
        onEnter(event);
      } else if (type === "EXIT" && onExit) {
        onExit(event);
      }
    },
    [onEnter, onExit],
  );

  /**
   * Process location update and check geofences
   */
  useEffect(() => {
    if (!position) return;

    const { latitude, longitude } = position;

    // Check if user is inside the UIU campus area
    const inCampus = isInCampusArea(latitude, longitude);
    setIsInsideCampus(inCampus);

    // If user is outside campus, auto-exit from any active zone
    if (!inCampus) {
      const previousActiveZone = previousActiveZoneRef.current;
      if (previousActiveZone !== null) {
        dispatchEvent("EXIT", previousActiveZone, latitude, longitude);
        setActiveZone(null);
        previousActiveZoneRef.current = null;
      }
      // Clear zone inside states
      isInsideMapRef.current.clear();
      setZonesWithDistance((prev) =>
        prev.map((z) => ({ ...z, isInside: false })),
      );
      return;
    }

    // Calculate distances for all zones
    const updatedZones = calculateZoneDistances(latitude, longitude);
    setZonesWithDistance(updatedZones);

    // Update isInside map for hysteresis
    updatedZones.forEach((zone) => {
      isInsideMapRef.current.set(zone.name, zone.isInside);
    });

    // Determine current active zone
    const currentActiveZone = determineActiveZone(updatedZones);
    const previousActiveZone = previousActiveZoneRef.current;

    // Check for zone changes
    if (currentActiveZone !== previousActiveZone) {
      // Exit previous zone
      if (previousActiveZone !== null) {
        dispatchEvent("EXIT", previousActiveZone, latitude, longitude);
      }

      // Enter new zone
      if (currentActiveZone !== null) {
        dispatchEvent("ENTER", currentActiveZone, latitude, longitude);
      }

      // Update state and ref
      setActiveZone(currentActiveZone);
      previousActiveZoneRef.current = currentActiveZone;
    }
  }, [position, calculateZoneDistances, determineActiveZone, dispatchEvent]);

  /**
   * Clear event history
   */
  const clearHistory = useCallback(() => {
    setEventHistory([]);
  }, []);

  return {
    activeZone,
    zones: zonesWithDistance,
    position,
    isTracking,
    isSupported,
    permissionGranted,
    error,
    eventHistory,
    isInsideCampus,
    startTracking,
    stopTracking,
    clearHistory,
  };
};

export default useGeofencing;
