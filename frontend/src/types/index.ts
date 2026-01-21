export interface Zone {
  name: string;
  capacity: number;
  currentCount: number;
  occupancyPercentage: number;
  crowdLevel: "LOW" | "MEDIUM" | "HIGH";
}

// Geographic zone with coordinates for map display
export interface ZoneWithCoordinates {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // meters
  capacity: number;
  currentCount: number;
  occupancyPercentage: number;
  crowdLevel: "LOW" | "MEDIUM" | "HIGH";
}

// Geographic types for location-based features
export interface GeoCoordinate {
  lat: number;
  lng: number;
}

export interface ZoneBoundary {
  name: string;
  center: GeoCoordinate;
  polygon: GeoCoordinate[]; // Array of coordinates forming the zone boundary
  radius?: number; // Optional radius for circular zones (meters)
}

export interface GeofenceEvent {
  zoneName: string;
  action: "ENTER" | "EXIT";
  timestamp: Date;
  coordinates: GeoCoordinate;
}

export interface ZoneWithPosition extends Zone {
  position: [number, number]; // [lat, lng] for map display
}

export interface User {
  id: number;
  email: string;
  studentId: string;
  fullName: string;
}

export interface AuthResponse {
  token: string;
  userId: number;
  email: string;
  studentId: string;
  fullName: string;
}

export interface LocationUpdate {
  userId: string;
  zoneName: string;
  action: "ENTER" | "EXIT";
}

export interface LocationUpdateResponse {
  message: string;
  currentZone: string | null;
  previousZone: string | null;
  autoExited: boolean;
}
