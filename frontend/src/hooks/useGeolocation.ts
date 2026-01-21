import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Geolocation position data
 */
export interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number; // meters
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

/**
 * Geolocation error types
 */
export type GeolocationErrorType =
  | "PERMISSION_DENIED"
  | "POSITION_UNAVAILABLE"
  | "TIMEOUT"
  | "NOT_SUPPORTED"
  | "UNKNOWN";

/**
 * Geolocation error object
 */
export interface GeolocationError {
  type: GeolocationErrorType;
  message: string;
  code?: number;
}

/**
 * Geolocation hook options
 */
export interface UseGeolocationOptions {
  /** Enable high accuracy mode (uses GPS, slower but more accurate) */
  enableHighAccuracy?: boolean;
  /** Maximum age of cached position in milliseconds */
  maximumAge?: number;
  /** Timeout for position request in milliseconds */
  timeout?: number;
  /** Whether to start tracking immediately */
  autoStart?: boolean;
}

/**
 * Geolocation hook return value
 */
export interface UseGeolocationReturn {
  /** Current position (null if not available) */
  position: GeolocationPosition | null;
  /** Current error (null if no error) */
  error: GeolocationError | null;
  /** Whether geolocation is currently being tracked */
  isTracking: boolean;
  /** Whether geolocation is supported by the browser */
  isSupported: boolean;
  /** Whether permission has been granted */
  permissionGranted: boolean | null;
  /** Start tracking location */
  startTracking: () => void;
  /** Stop tracking location */
  stopTracking: () => void;
  /** Get current position once (not continuous) */
  getCurrentPosition: () => Promise<GeolocationPosition | null>;
}

/**
 * Default options for geolocation
 */
const DEFAULT_OPTIONS: UseGeolocationOptions = {
  enableHighAccuracy: true,
  maximumAge: 10000, // 10 seconds
  timeout: 15000, // 15 seconds
  autoStart: false,
};

/**
 * Convert GeolocationPositionError code to error type
 */
const getErrorType = (code: number): GeolocationErrorType => {
  switch (code) {
    case 1:
      return "PERMISSION_DENIED";
    case 2:
      return "POSITION_UNAVAILABLE";
    case 3:
      return "TIMEOUT";
    default:
      return "UNKNOWN";
  }
};

/**
 * Get user-friendly error message
 */
const getErrorMessage = (type: GeolocationErrorType): string => {
  switch (type) {
    case "PERMISSION_DENIED":
      return "Location permission was denied. Please enable location access in your browser settings.";
    case "POSITION_UNAVAILABLE":
      return "Unable to determine your location. Please check your device's location services.";
    case "TIMEOUT":
      return "Location request timed out. Please try again.";
    case "NOT_SUPPORTED":
      return "Geolocation is not supported by your browser.";
    default:
      return "An unknown error occurred while getting your location.";
  }
};

/**
 * useGeolocation Hook
 *
 * Provides real-time user location tracking using the browser's Geolocation API.
 * Handles permission states, errors, and provides start/stop controls.
 *
 * @example
 * ```tsx
 * const { position, error, isTracking, startTracking, stopTracking } = useGeolocation({
 *   enableHighAccuracy: true,
 *   autoStart: true,
 * });
 *
 * if (position) {
 *   console.log(`Location: ${position.latitude}, ${position.longitude}`);
 * }
 * ```
 */
export const useGeolocation = (
  options: UseGeolocationOptions = {},
): UseGeolocationReturn => {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<GeolocationError | null>(null);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(
    null,
  );

  const watchIdRef = useRef<number | null>(null);

  // Check if geolocation is supported
  const isSupported =
    typeof navigator !== "undefined" && "geolocation" in navigator;

  /**
   * Handle successful position update
   */
  const handleSuccess = useCallback((pos: globalThis.GeolocationPosition) => {
    const { coords, timestamp } = pos;

    setPosition({
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
      altitude: coords.altitude,
      altitudeAccuracy: coords.altitudeAccuracy,
      heading: coords.heading,
      speed: coords.speed,
      timestamp,
    });

    setError(null);
    setPermissionGranted(true);
  }, []);

  /**
   * Handle position error
   */
  const handleError = useCallback((err: GeolocationPositionError) => {
    const errorType = getErrorType(err.code);

    setError({
      type: errorType,
      message: getErrorMessage(errorType),
      code: err.code,
    });

    if (errorType === "PERMISSION_DENIED") {
      setPermissionGranted(false);
    }
  }, []);

  /**
   * Start watching position
   */
  const startTracking = useCallback(() => {
    if (!isSupported) {
      setError({
        type: "NOT_SUPPORTED",
        message: getErrorMessage("NOT_SUPPORTED"),
      });
      return;
    }

    // Clear any existing watch
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setIsTracking(true);
    setError(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: mergedOptions.enableHighAccuracy,
        maximumAge: mergedOptions.maximumAge,
        timeout: mergedOptions.timeout,
      },
    );
  }, [
    isSupported,
    handleSuccess,
    handleError,
    mergedOptions.enableHighAccuracy,
    mergedOptions.maximumAge,
    mergedOptions.timeout,
  ]);

  /**
   * Stop watching position
   */
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  /**
   * Get current position once (not continuous tracking)
   */
  const getCurrentPosition =
    useCallback((): Promise<GeolocationPosition | null> => {
      return new Promise((resolve) => {
        if (!isSupported) {
          setError({
            type: "NOT_SUPPORTED",
            message: getErrorMessage("NOT_SUPPORTED"),
          });
          resolve(null);
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const position: GeolocationPosition = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              altitude: pos.coords.altitude,
              altitudeAccuracy: pos.coords.altitudeAccuracy,
              heading: pos.coords.heading,
              speed: pos.coords.speed,
              timestamp: pos.timestamp,
            };
            setPosition(position);
            setError(null);
            setPermissionGranted(true);
            resolve(position);
          },
          (err) => {
            handleError(err);
            resolve(null);
          },
          {
            enableHighAccuracy: mergedOptions.enableHighAccuracy,
            maximumAge: mergedOptions.maximumAge,
            timeout: mergedOptions.timeout,
          },
        );
      });
    }, [
      isSupported,
      handleError,
      mergedOptions.enableHighAccuracy,
      mergedOptions.maximumAge,
      mergedOptions.timeout,
    ]);

  // Auto-start tracking if enabled
  useEffect(() => {
    if (mergedOptions.autoStart && isSupported) {
      startTracking();
    }

    // Cleanup on unmount
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [mergedOptions.autoStart, isSupported, startTracking]);

  return {
    position,
    error,
    isTracking,
    isSupported,
    permissionGranted,
    startTracking,
    stopTracking,
    getCurrentPosition,
  };
};

export default useGeolocation;
