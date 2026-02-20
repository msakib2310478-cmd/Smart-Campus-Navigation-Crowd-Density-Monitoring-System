package com.uiu.campus.service;

import com.uiu.campus.model.ZoneEntry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service that manages TLV (Time Limit Value) based auto-exit scheduling.
 * Users are automatically removed from zones after their TLV duration expires.
 */
@Service
@Slf4j
public class TLVSchedulerService {

    // Map of userId -> ZoneEntry for tracking active entries
    private final Map<String, ZoneEntry> activeEntries = new ConcurrentHashMap<>();

    private final CrowdService crowdService;
    private final WebSocketService webSocketService;

    public TLVSchedulerService(@Lazy CrowdService crowdService, @Lazy WebSocketService webSocketService) {
        this.crowdService = crowdService;
        this.webSocketService = webSocketService;
    }

    /**
     * Record a user entry into a zone with TLV-based auto-exit scheduling.
     */
    public void scheduleAutoExit(String userId, String zoneName, long tlvSeconds) {
        ZoneEntry entry = new ZoneEntry(userId, zoneName, tlvSeconds);
        activeEntries.put(userId, entry);
        log.info("Scheduled auto-exit for user {} from zone {} in {} seconds",
                userId, zoneName, tlvSeconds);
    }

    /**
     * Cancel auto-exit for a user (e.g., when they manually exit).
     */
    public void cancelAutoExit(String userId) {
        ZoneEntry removed = activeEntries.remove(userId);
        if (removed != null) {
            log.info("Cancelled auto-exit for user {} from zone {}", userId, removed.getZoneName());
        }
    }

    /**
     * Get the current zone entry for a user.
     */
    public ZoneEntry getEntry(String userId) {
        return activeEntries.get(userId);
    }

    /**
     * Check if a user has an active entry.
     */
    public boolean hasActiveEntry(String userId) {
        return activeEntries.containsKey(userId);
    }

    /**
     * Scheduled task that runs every 10 seconds to check for expired entries.
     * Removes expired entries and broadcasts updates via WebSocket.
     */
    @Scheduled(fixedRate = 10000) // Check every 10 seconds
    public void processExpiredEntries() {
        List<ZoneEntry> expiredEntries = new ArrayList<>();

        // Find all expired entries
        for (ZoneEntry entry : activeEntries.values()) {
            if (entry.isExpired()) {
                expiredEntries.add(entry);
            }
        }

        // Process expired entries
        for (ZoneEntry entry : expiredEntries) {
            String userId = entry.getUserId();
            String zoneName = entry.getZoneName();

            try {
                // Remove from active entries
                activeEntries.remove(userId);

                // Remove user from zone via CrowdService
                crowdService.removeUserFromZone(userId, zoneName);

                // Broadcast auto-exit event
                webSocketService.broadcastAutoExit(userId, zoneName);

                // Broadcast updated crowd data
                webSocketService.broadcastCrowdUpdate(crowdService.getAllZones());

                log.info("Auto-exited user {} from zone {} due to TLV expiration", userId, zoneName);
            } catch (Exception e) {
                log.error("Error processing auto-exit for user {} from zone {}: {}",
                        userId, zoneName, e.getMessage());
            }
        }

        if (!expiredEntries.isEmpty()) {
            log.info("Processed {} expired TLV entries", expiredEntries.size());
        }
    }

    /**
     * Get count of active entries (for monitoring).
     */
    public int getActiveEntryCount() {
        return activeEntries.size();
    }

    /**
     * Get all active entries (for debugging/monitoring).
     */
    public Map<String, ZoneEntry> getAllActiveEntries() {
        return new ConcurrentHashMap<>(activeEntries);
    }
}
