import { locationAPI } from "./api";
import { LocationUpdateResponse } from "../types";

/**
 * Tracks the last API call to prevent duplicate requests
 */
interface LastApiCall {
  zoneName: string;
  action: "ENTER" | "EXIT";
  timestamp: number;
}

/**
 * Minimum time between duplicate API calls (in milliseconds)
 */
const DEBOUNCE_TIME = 2000; // 2 seconds

/**
 * Location Service
 *
 * Handles automatic location updates to the backend when user enters/exits zones.
 * Provides idempotent, safe API calls with duplicate prevention.
 */
class LocationService {
  private lastCall: LastApiCall | null = null;
  private pendingRequest: Promise<LocationUpdateResponse> | null = null;
  private currentZone: string | null = null;

  /**
   * Check if a call should be debounced (duplicate prevention)
   */
  private shouldDebounce(zoneName: string, action: "ENTER" | "EXIT"): boolean {
    if (!this.lastCall) return false;

    const now = Date.now();
    const timeSinceLastCall = now - this.lastCall.timestamp;

    // Same zone and action within debounce window
    if (
      this.lastCall.zoneName === zoneName &&
      this.lastCall.action === action &&
      timeSinceLastCall < DEBOUNCE_TIME
    ) {
      console.log(
        `[LocationService] Debouncing duplicate ${action} for ${zoneName}`,
      );
      return true;
    }

    return false;
  }

  /**
   * Update the last call record
   */
  private recordCall(zoneName: string, action: "ENTER" | "EXIT"): void {
    this.lastCall = {
      zoneName,
      action,
      timestamp: Date.now(),
    };
  }

  /**
   * Enter a zone - calls POST /api/location/update with action ENTER
   *
   * @param userId - User's ID or student ID
   * @param zoneName - Name of the zone to enter
   * @returns Promise with the location update response
   */
  async enterZone(
    userId: string,
    zoneName: string,
  ): Promise<LocationUpdateResponse | null> {
    // Prevent duplicate calls
    if (this.shouldDebounce(zoneName, "ENTER")) {
      return null;
    }

    // Prevent entering same zone twice
    if (this.currentZone === zoneName) {
      console.log(
        `[LocationService] Already in zone ${zoneName}, skipping enter`,
      );
      return null;
    }

    // Wait for any pending request to complete
    if (this.pendingRequest) {
      try {
        await this.pendingRequest;
      } catch {
        // Ignore errors from pending request
      }
    }

    this.recordCall(zoneName, "ENTER");

    try {
      console.log(`[LocationService] Entering zone: ${zoneName}`);

      this.pendingRequest = locationAPI
        .updateLocation({
          userId,
          zoneName,
          action: "ENTER",
        })
        .then((res) => res.data);

      const response = await this.pendingRequest;
      this.currentZone = zoneName;

      console.log(
        `[LocationService] Successfully entered ${zoneName}`,
        response,
      );
      return response;
    } catch (error) {
      console.error(
        `[LocationService] Failed to enter zone ${zoneName}:`,
        error,
      );
      throw error;
    } finally {
      this.pendingRequest = null;
    }
  }

  /**
   * Exit a zone - calls POST /api/location/update with action EXIT
   *
   * @param userId - User's ID or student ID
   * @param zoneName - Name of the zone to exit
   * @returns Promise with the location update response
   */
  async exitZone(
    userId: string,
    zoneName: string,
  ): Promise<LocationUpdateResponse | null> {
    // Prevent duplicate calls
    if (this.shouldDebounce(zoneName, "EXIT")) {
      return null;
    }

    // Prevent exiting a zone we're not in
    if (this.currentZone !== zoneName) {
      console.log(`[LocationService] Not in zone ${zoneName}, skipping exit`);
      return null;
    }

    // Wait for any pending request to complete
    if (this.pendingRequest) {
      try {
        await this.pendingRequest;
      } catch {
        // Ignore errors from pending request
      }
    }

    this.recordCall(zoneName, "EXIT");

    try {
      console.log(`[LocationService] Exiting zone: ${zoneName}`);

      this.pendingRequest = locationAPI
        .updateLocation({
          userId,
          zoneName,
          action: "EXIT",
        })
        .then((res) => res.data);

      const response = await this.pendingRequest;
      this.currentZone = null;

      console.log(
        `[LocationService] Successfully exited ${zoneName}`,
        response,
      );
      return response;
    } catch (error) {
      console.error(
        `[LocationService] Failed to exit zone ${zoneName}:`,
        error,
      );
      throw error;
    } finally {
      this.pendingRequest = null;
    }
  }

  /**
   * Handle zone transition - automatically exits previous zone and enters new zone
   *
   * @param userId - User's ID or student ID
   * @param newZone - New zone to enter (null if exiting all zones)
   * @param previousZone - Previous zone to exit (null if entering from outside)
   */
  async handleZoneTransition(
    userId: string,
    newZone: string | null,
    previousZone: string | null,
  ): Promise<void> {
    // Exit previous zone first
    if (previousZone) {
      try {
        await this.exitZone(userId, previousZone);
      } catch (error) {
        console.error(
          `[LocationService] Failed to exit ${previousZone} during transition:`,
          error,
        );
        // Continue to enter new zone even if exit fails
      }
    }

    // Enter new zone
    if (newZone) {
      try {
        await this.enterZone(userId, newZone);
      } catch (error) {
        console.error(
          `[LocationService] Failed to enter ${newZone} during transition:`,
          error,
        );
      }
    }
  }

  /**
   * Get the currently tracked zone
   */
  getCurrentZone(): string | null {
    return this.currentZone;
  }

  /**
   * Sync current zone with backend
   * Useful when initializing or recovering from errors
   */
  async syncWithBackend(userId: string): Promise<string | null> {
    try {
      const response = await locationAPI.getUserCurrentZone(userId);
      this.currentZone = response.data.currentZone;
      console.log(
        `[LocationService] Synced with backend, current zone: ${this.currentZone}`,
      );
      return this.currentZone;
    } catch (error) {
      console.error("[LocationService] Failed to sync with backend:", error);
      return null;
    }
  }

  /**
   * Reset the service state
   */
  reset(): void {
    this.lastCall = null;
    this.pendingRequest = null;
    this.currentZone = null;
  }
}

// Export singleton instance
export const locationService = new LocationService();

export default locationService;
