package com.uiu.campus.service;

import com.uiu.campus.model.Zone;
import com.uiu.campus.util.CrowdBackupUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantReadWriteLock;

@Service
@Slf4j
public class CrowdService {
    private static final Map<String, Zone> zones = new ConcurrentHashMap<>();
    private static final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();
    private static final CrowdBackupUtil backupUtil = new CrowdBackupUtil();
    private static final Map<String, String> userToZone = new ConcurrentHashMap<>();

    private final TLVSchedulerService tlvSchedulerService;
    private final WebSocketService webSocketService;

    public CrowdService(@Lazy TLVSchedulerService tlvSchedulerService,
            @Lazy WebSocketService webSocketService) {
        this.tlvSchedulerService = tlvSchedulerService;
        this.webSocketService = webSocketService;
        initializeZones();
    }

    private void initializeZones() {
        // Zone name, capacity, TLV in seconds
        zones.put("Library", new Zone("Library", 100, 1800)); // 30 minutes
        zones.put("Cafeteria", new Zone("Cafeteria", 60, 80)); // 1 min 20 sec
        zones.put("Study Room", new Zone("Study Room", 40, 3600)); // 1 hour
        zones.put("Game Zone", new Zone("Game Zone", 30, 1200)); // 20 minutes
        zones.put("Gym", new Zone("Gym", 25, 2700)); // 45 minutes
        zones.put("Labs", new Zone("Labs", 50, 5400)); // 1.5 hours
        zones.put("Common Room", new Zone("Common Room", 35, 900)); // 15 minutes
    }

    /**
     * Add a user to a zone and schedule auto-exit based on TLV.
     */
    public void addUserToZone(String userId, String zoneName) {
        lock.writeLock().lock();
        try {
            Zone zone = zones.get(zoneName);
            if (zone == null) {
                log.warn("Zone not found: {}", zoneName);
                return;
            }

            // Check if user is already in another zone
            String currentZoneName = userToZone.get(userId);
            if (currentZoneName != null && !currentZoneName.equals(zoneName)) {
                // Remove from previous zone
                Zone previousZone = zones.get(currentZoneName);
                if (previousZone != null) {
                    previousZone.removeUser(userId);
                    tlvSchedulerService.cancelAutoExit(userId);
                    log.info("User {} automatically exited from {}", userId, currentZoneName);
                }
            }

            // Add to new zone
            zone.addUser(userId);
            userToZone.put(userId, zoneName);

            // Schedule auto-exit based on zone's TLV
            tlvSchedulerService.scheduleAutoExit(userId, zoneName, zone.getTlvSeconds());

            log.info("User {} entered {} (TLV: {} seconds)", userId, zoneName, zone.getTlvSeconds());

            // Broadcast update
            webSocketService.broadcastCrowdUpdate(getAllZones());
        } finally {
            lock.writeLock().unlock();
        }
    }

    /**
     * Remove a user from a zone (manual exit or auto-exit).
     */
    public void removeUserFromZone(String userId, String zoneName) {
        lock.writeLock().lock();
        try {
            Zone zone = zones.get(zoneName);
            if (zone != null) {
                zone.removeUser(userId);
            }
            userToZone.remove(userId);
            // Cancel any pending auto-exit
            tlvSchedulerService.cancelAutoExit(userId);
            log.info("User {} removed from {}", userId, zoneName);
        } finally {
            lock.writeLock().unlock();
        }
    }

    /**
     * Legacy method for compatibility - handles ENTER/EXIT actions.
     */
    public void updateLocation(String userId, String zoneName, String action) {
        if ("ENTER".equalsIgnoreCase(action)) {
            addUserToZone(userId, zoneName);
        } else if ("EXIT".equalsIgnoreCase(action)) {
            String currentZoneName = userToZone.get(userId);
            if (currentZoneName != null) {
                removeUserFromZone(userId, currentZoneName);
                webSocketService.broadcastCrowdUpdate(getAllZones());
            }
        }
    }

    /**
     * Get TLV duration for a zone in seconds.
     */
    public long getZoneTLV(String zoneName) {
        Zone zone = zones.get(zoneName);
        return zone != null ? zone.getTlvSeconds() : 1800; // Default 30 min
    }

    public Map<String, Zone> getAllZones() {
        lock.readLock().lock();
        try {
            return new HashMap<>(zones);
        } finally {
            lock.readLock().unlock();
        }
    }

    public Zone getZone(String zoneName) {
        lock.readLock().lock();
        try {
            return zones.get(zoneName);
        } finally {
            lock.readLock().unlock();
        }
    }

    public Zone getQuietestZone() {
        lock.readLock().lock();
        try {
            return zones.values().stream()
                    .min(Comparator.comparingDouble(Zone::getOccupancyPercentage))
                    .orElse(null);
        } finally {
            lock.readLock().unlock();
        }
    }

    public List<Zone> getRankedZones() {
        lock.readLock().lock();
        try {
            return zones.values().stream()
                    .sorted(Comparator.comparingDouble(Zone::getOccupancyPercentage))
                    .toList();
        } finally {
            lock.readLock().unlock();
        }
    }

    public void backupCrowdData() {
        lock.readLock().lock();
        try {
            backupUtil.saveToFile(new HashMap<>(zones));
            log.info("Crowd data backed up successfully");
        } finally {
            lock.readLock().unlock();
        }
    }

    public void restoreCrowdData() {
        Map<String, Zone> restoredData = backupUtil.loadFromFile();
        if (restoredData != null) {
            lock.writeLock().lock();
            try {
                zones.clear();
                zones.putAll(restoredData);
                // Rebuild userToZone mapping
                userToZone.clear();
                for (Zone zone : zones.values()) {
                    for (String userId : zone.getActiveUsers()) {
                        userToZone.put(userId, zone.getName());
                    }
                }
                log.info("Crowd data restored successfully");
            } finally {
                lock.writeLock().unlock();
            }
        }
    }
}
