import axios, { AxiosError } from "axios";
import {
  AuthResponse,
  Zone,
  LocationUpdate,
  LocationUpdateResponse,
  ZoneWithCoordinates,
  AdminZone,
  ZoneRequest,
} from "../types";
import {
  ZONE_COORDINATES,
  ZoneCoordinateConfig,
} from "../config/zoneCoordinates";

const API_BASE_URL = "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;

      if (status === 401) {
        // Unauthorized - clear auth data and redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        // Only redirect if not already on login/signup page
        if (
          !window.location.pathname.includes("/login") &&
          !window.location.pathname.includes("/signup")
        ) {
          window.location.href = "/login";
        }
      } else if (status === 403) {
        console.error("Access forbidden");
      } else if (status === 429) {
        // Too many requests - rate limited
        console.error("Too many requests. Please try again later.");
      } else if (status >= 500) {
        console.error("Server error. Please try again later.");
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error("Network error. Please check your connection.");
    }

    return Promise.reject(error);
  },
);

// Auth APIs
export const authAPI = {
  signup: (
    email: string | null,
    studentId: string | null,
    password: string,
    fullName: string,
    adminCode?: string,
  ) =>
    api.post<AuthResponse>("/auth/signup", {
      email,
      studentId,
      password,
      fullName,
      adminCode: adminCode || null,
    }),
  login: (email: string, studentId: string, password: string) =>
    api.post<AuthResponse>("/auth/login", { email, studentId, password }),
  getCurrentUser: () => api.get("/auth/me"),
};

// Location APIs
export const locationAPI = {
  updateLocation: (update: LocationUpdate) =>
    api.post<LocationUpdateResponse>("/location/update", update),
  getCrowdStatus: () => api.get<Zone[]>("/location/crowd"),
  getQuietestZone: () => api.get<Zone>("/location/quiet"),
  getUserCurrentZone: (userId: string) =>
    api.get<{ currentZone: string | null }>(`/location/current/${userId}`),
};

// Zones API - fetches zones with coordinates for map display
export const zonesAPI = {
  /**
   * Get all zones with their geographic coordinates
   * Fetches crowd data from /api/location/crowd and polygon geometry from /api/zones,
   * then merges them. Polygon zones use backend geometry; legacy zones fall back to
   * hardcoded ZONE_COORDINATES.
   */
  getZonesWithCoordinates: async (): Promise<ZoneWithCoordinates[]> => {
    // Fetch crowd data and admin zone data in parallel
    const [crowdResponse, adminResponse] = await Promise.all([
      api.get<Zone[]>("/location/crowd"),
      api.get<AdminZone[]>("/zones").catch(() => ({ data: [] as AdminZone[] })),
    ]);

    const crowdZones = crowdResponse.data;
    const adminZones = adminResponse.data;

    // Build lookup of admin zones by name for polygon/floor data
    const adminZoneMap = new Map<string, AdminZone>();
    for (const az of adminZones) {
      adminZoneMap.set(az.name, az);
    }

    // Track zone names we've already added (from crowd data)
    const seenNames = new Set<string>();

    // First pass: merge crowd data with admin polygon/coordinate data
    const mapped = crowdZones.map((zone, index) => {
      seenNames.add(zone.name);
      const adminZone = adminZoneMap.get(zone.name);

      // Prefer admin zone geometry if available
      if (adminZone) {
        const result: ZoneWithCoordinates = {
          id: adminZone.id,
          name: zone.name,
          latitude: adminZone.latitude,
          longitude: adminZone.longitude,
          radius: adminZone.radius,
          floor: adminZone.floor,
          polygon: adminZone.polygon,
          capacity: zone.capacity,
          currentCount: zone.currentCount,
          occupancyPercentage: zone.occupancyPercentage,
          crowdLevel: zone.crowdLevel,
        };
        return result;
      }

      // Fall back to hardcoded coordinates
      const coords: ZoneCoordinateConfig | undefined =
        ZONE_COORDINATES[zone.name];
      if (!coords) {
        console.warn(`No coordinates configured for zone: ${zone.name}`);
        return null;
      }
      const result: ZoneWithCoordinates = {
        id: index + 1,
        name: zone.name,
        latitude: coords.latitude,
        longitude: coords.longitude,
        radius: coords.radius,
        capacity: zone.capacity,
        currentCount: zone.currentCount,
        occupancyPercentage: zone.occupancyPercentage,
        crowdLevel: zone.crowdLevel,
      };
      return result;
    });

    const merged: ZoneWithCoordinates[] = mapped.filter(
      (zone): zone is ZoneWithCoordinates => zone !== null,
    );

    // Second pass: add admin-only polygon zones not present in crowd data
    for (const az of adminZones) {
      if (!seenNames.has(az.name)) {
        merged.push({
          id: az.id,
          name: az.name,
          latitude: az.latitude,
          longitude: az.longitude,
          radius: az.radius,
          floor: az.floor,
          polygon: az.polygon,
          capacity: az.capacity,
          currentCount: az.currentCount ?? 0,
          occupancyPercentage: az.occupancyPercentage ?? 0,
          crowdLevel: az.crowdLevel ?? "LOW",
        });
      }
    }

    return merged;
  },
};

// Recommendation APIs
export const recommendationAPI = {
  getBestRecommendation: () => api.get<Zone>("/recommend/best"),
  getRankedZones: () => api.get<Zone[]>("/recommend/ranked"),
};

// Admin Zone Management APIs
export const adminZoneAPI = {
  /**
   * Get all zones (with geographic data)
   */
  getAllZones: () => api.get<AdminZone[]>("/zones"),

  /**
   * Get a specific zone by ID
   */
  getZone: (id: number) => api.get<AdminZone>(`/zones/${id}`),

  /**
   * Create a new zone (admin only)
   */
  createZone: (zone: ZoneRequest) => api.post<AdminZone>("/zones", zone),

  /**
   * Update an existing zone (admin only)
   */
  updateZone: (id: number, zone: ZoneRequest) =>
    api.put<AdminZone>(`/zones/${id}`, zone),

  /**
   * Delete a zone (admin only)
   */
  deleteZone: (id: number) => api.delete(`/zones/${id}`),
};

export default api;
