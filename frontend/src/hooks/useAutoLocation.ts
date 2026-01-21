import { useEffect, useCallback, useRef, useState } from "react";
import {
  useGeofencing,
  UseGeofencingOptions,
  GeofenceEvent,
} from "./useGeofencing";
import { locationService } from "../services/locationService";
import { useAuth } from "../context/AuthContext";

/**
 * Options for the auto location hook
 */
export interface UseAutoLocationOptions extends Omit<
  UseGeofencingOptions,
  "onEnter" | "onExit"
> {
  /** Whether to automatically sync with backend on mount */
  syncOnMount?: boolean;
  /** Callback after successful zone enter */
  onEnterSuccess?: (zoneName: string) => void;
  /** Callback after successful zone exit */
  onExitSuccess?: (zoneName: string) => void;
  /** Callback on API error */
  onError?: (error: Error, action: "ENTER" | "EXIT", zoneName: string) => void;
}

/**
 * Return type for auto location hook
 */
export interface UseAutoLocationReturn {
  /** Currently active zone from geofencing */
  activeZone: string | null;
  /** Backend-confirmed current zone */
  confirmedZone: string | null;
  /** Whether location tracking is active */
  isTracking: boolean;
  /** Whether an API call is in progress */
  isUpdating: boolean;
  /** Last error from API calls */
  lastError: Error | null;
  /** User's current position */
  position: { latitude: number; longitude: number; accuracy: number } | null;
  /** All zones with distance info */
  zones: Array<{
    name: string;
    distance: number;
    isInside: boolean;
  }>;
  /** Start location tracking */
  startTracking: () => void;
  /** Stop location tracking */
  stopTracking: () => void;
  /** Manually sync with backend */
  syncWithBackend: () => Promise<void>;
  /** Whether geolocation is supported */
  isSupported: boolean;
  /** Permission status */
  permissionGranted: boolean | null;
  /** Geolocation error */
  geolocationError: { type: string; message: string } | null;
}

/**
 * useAutoLocation Hook
 *
 * Combines geofencing with automatic backend API calls.
 * When user enters/exits a zone, it automatically updates the backend.
 *
 * Features:
 * - Automatic zone enter/exit API calls
 * - Duplicate prevention
 * - Error handling
 * - Backend sync on mount
 * - Only one zone at a time
 *
 * @example
 * ```tsx
 * const { activeZone, isTracking, startTracking } = useAutoLocation({
 *   autoStart: true,
 *   onEnterSuccess: (zone) => toast.success(`Entered ${zone}`),
 *   onExitSuccess: (zone) => toast.info(`Exited ${zone}`),
 * });
 * ```
 */
export const useAutoLocation = (
  options: UseAutoLocationOptions = {},
): UseAutoLocationReturn => {
  const {
    syncOnMount = true,
    onEnterSuccess,
    onExitSuccess,
    onError,
    ...geofencingOptions
  } = options;

  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);
  const [confirmedZone, setConfirmedZone] = useState<string | null>(null);

  // Track previous zone to detect transitions
  const previousZoneRef = useRef<string | null>(null);
  const isInitializedRef = useRef(false);

  /**
   * Get user ID for API calls
   */
  const getUserId = useCallback((): string | null => {
    if (!user) return null;
    return user.studentId ?? String(user.userId);
  }, [user]);

  /**
   * Handle zone enter
   */
  const handleEnter = useCallback(
    async (event: GeofenceEvent) => {
      const userId = getUserId();
      if (!userId) {
        console.warn("[useAutoLocation] No user ID available, skipping enter");
        return;
      }

      setIsUpdating(true);
      setLastError(null);

      try {
        const response = await locationService.enterZone(
          userId,
          event.zoneName,
        );
        if (response) {
          setConfirmedZone(event.zoneName);
          onEnterSuccess?.(event.zoneName);
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setLastError(err);
        onError?.(err, "ENTER", event.zoneName);
      } finally {
        setIsUpdating(false);
      }
    },
    [getUserId, onEnterSuccess, onError],
  );

  /**
   * Handle zone exit
   */
  const handleExit = useCallback(
    async (event: GeofenceEvent) => {
      const userId = getUserId();
      if (!userId) {
        console.warn("[useAutoLocation] No user ID available, skipping exit");
        return;
      }

      setIsUpdating(true);
      setLastError(null);

      try {
        const response = await locationService.exitZone(userId, event.zoneName);
        if (response) {
          setConfirmedZone(null);
          onExitSuccess?.(event.zoneName);
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setLastError(err);
        onError?.(err, "EXIT", event.zoneName);
      } finally {
        setIsUpdating(false);
      }
    },
    [getUserId, onExitSuccess, onError],
  );

  // Use geofencing with our handlers
  const geofencing = useGeofencing({
    ...geofencingOptions,
    onEnter: handleEnter,
    onExit: handleExit,
  });

  /**
   * Sync with backend
   */
  const syncWithBackend = useCallback(async () => {
    const userId = getUserId();
    if (!userId) return;

    try {
      const currentZone = await locationService.syncWithBackend(userId);
      setConfirmedZone(currentZone);
      previousZoneRef.current = currentZone;
    } catch (error) {
      console.error("[useAutoLocation] Failed to sync with backend:", error);
    }
  }, [getUserId]);

  // Sync on mount
  useEffect(() => {
    if (syncOnMount && user && !isInitializedRef.current) {
      isInitializedRef.current = true;
      syncWithBackend();
    }
  }, [syncOnMount, user, syncWithBackend]);

  // Track zone changes for the ref
  useEffect(() => {
    previousZoneRef.current = geofencing.activeZone;
  }, [geofencing.activeZone]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      locationService.reset();
    };
  }, []);

  return {
    activeZone: geofencing.activeZone,
    confirmedZone,
    isTracking: geofencing.isTracking,
    isUpdating,
    lastError,
    position: geofencing.position
      ? {
          latitude: geofencing.position.latitude,
          longitude: geofencing.position.longitude,
          accuracy: geofencing.position.accuracy,
        }
      : null,
    zones: geofencing.zones.map((z) => ({
      name: z.name,
      distance: z.distance,
      isInside: z.isInside,
    })),
    startTracking: geofencing.startTracking,
    stopTracking: geofencing.stopTracking,
    syncWithBackend,
    isSupported: geofencing.isSupported,
    permissionGranted: geofencing.permissionGranted,
    geolocationError: geofencing.error,
  };
};

export default useAutoLocation;
