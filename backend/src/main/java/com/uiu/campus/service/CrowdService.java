package com.uiu.campus.service;

import com.uiu.campus.model.Zone;
import com.uiu.campus.util.CrowdBackupUtil;
import lombok.extern.slf4j.Slf4j;
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

    public CrowdService() {
        initializeZones();
    }

    private void initializeZones() {
        zones.put("Library", new Zone("Library", 100));
        zones.put("Cafeteria", new Zone("Cafeteria", 60));
        zones.put("Study Room", new Zone("Study Room", 40));
        zones.put("Game Zone", new Zone("Game Zone", 30));
        zones.put("Gym", new Zone("Gym", 25));
        zones.put("Labs", new Zone("Labs", 50));
        zones.put("Common Room", new Zone("Common Room", 35));
    }

    public void updateLocation(String userId, String zoneName, String action) {
        lock.writeLock().lock();
        try {
            Zone zone = zones.get(zoneName);
            if (zone == null) {
                log.warn("Zone not found: {}", zoneName);
                return;
            }

            if ("ENTER".equalsIgnoreCase(action)) {
                // Check if user is already in another zone
                String currentZoneName = userToZone.get(userId);
                if (currentZoneName != null && !currentZoneName.equals(zoneName)) {
                    // Remove from previous zone
                    Zone previousZone = zones.get(currentZoneName);
                    if (previousZone != null) {
                        previousZone.removeUser(userId);
                        log.info("User {} automatically exited from {}", userId, currentZoneName);
                    }
                }
                // Add to new zone
                zone.addUser(userId);
                userToZone.put(userId, zoneName);
                log.info("User {} entered {}", userId, zoneName);
            } else if ("EXIT".equalsIgnoreCase(action)) {
                // Remove from current zone
                String currentZoneName = userToZone.get(userId);
                if (currentZoneName != null) {
                    Zone currentZone = zones.get(currentZoneName);
                    if (currentZone != null) {
                        currentZone.removeUser(userId);
                    }
                    userToZone.remove(userId);
                    log.info("User {} exited {}", userId, currentZoneName);
                }
            }
        } finally {
            lock.writeLock().unlock();
        }
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
