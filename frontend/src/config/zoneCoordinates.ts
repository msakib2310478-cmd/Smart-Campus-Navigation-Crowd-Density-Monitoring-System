/**
 * Zone Coordinates Configuration
 *
 * Maps zone names to their geographic coordinates.
 * These coordinates define the center and radius of each zone's geofence.
 *
 * Note: Update these coordinates to match your actual campus layout.
 * Default coordinates are set for UIU, Dhaka, Bangladesh campus area.
 */

export interface ZoneCoordinateConfig {
  latitude: number;
  longitude: number;
  radius: number; // meters
}

/**
 * Campus center coordinates
 * Used as the default map center
 */
export const CAMPUS_CENTER: [number, number] = [23.8103, 90.4125];

/**
 * Default map zoom level
 */
export const DEFAULT_ZOOM = 17;

/**
 * Zone coordinate mappings
 * Key: Zone name (must match backend zone names exactly)
 * Value: Geographic coordinates and geofence radius
 */
export const ZONE_COORDINATES: Record<string, ZoneCoordinateConfig> = {
  Library: {
    latitude: 23.8108,
    longitude: 90.412,
    radius: 40,
  },
  Cafeteria: {
    latitude: 23.81,
    longitude: 90.413,
    radius: 35,
  },
  "Study Room": {
    latitude: 23.8105,
    longitude: 90.4135,
    radius: 25,
  },
  "Game Zone": {
    latitude: 23.8095,
    longitude: 90.4118,
    radius: 30,
  },
  Gym: {
    latitude: 23.8098,
    longitude: 90.4125,
    radius: 28,
  },
  Labs: {
    latitude: 23.811,
    longitude: 90.4128,
    radius: 45,
  },
  "Common Room": {
    latitude: 23.8102,
    longitude: 90.4115,
    radius: 30,
  },
};

/**
 * Get coordinates for a zone by name
 * Returns default coordinates if zone not found
 */
export const getZoneCoordinates = (
  zoneName: string,
): ZoneCoordinateConfig | null => {
  return ZONE_COORDINATES[zoneName] || null;
};

/**
 * Check if a point is within a zone's geofence
 * Uses Haversine formula for distance calculation
 */
export const isPointInZone = (
  point: { latitude: number; longitude: number },
  zone: ZoneCoordinateConfig,
): boolean => {
  const distance = calculateDistance(
    point.latitude,
    point.longitude,
    zone.latitude,
    zone.longitude,
  );
  return distance <= zone.radius;
};

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in meters
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (deg: number): number => deg * (Math.PI / 180);
