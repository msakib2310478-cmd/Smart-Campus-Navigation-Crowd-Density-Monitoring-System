package com.uiu.campus.service;

import com.uiu.campus.dto.LocationUpdateResponse;
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
    private static final Map<String, String> userCurrentZone = new ConcurrentHashMap<>(); // userId -> zoneName
    private static final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();
    private static final CrowdBackupUtil backupUtil = new CrowdBackupUtil();

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

    public LocationUpdateResponse updateLocation(String userId, String zoneName, String action) {
        lock.writeLock().lock();
        try {
            Zone zone = zones.get(zoneName);
            if (zone == null) {
                log.warn("Zone not found: {}", zoneName);
                return new LocationUpdateResponse("Zone not found: " + zoneName, null, null, false);
            }

            if ("ENTER".equalsIgnoreCase(action)) {
                // Automatically exit from previous zone if user is already in one
                String previousZone = userCurrentZone.get(userId);
                boolean autoExited = false;
                
                if (previousZone != null && !previousZone.equals(zoneName)) {
                    Zone prevZone = zones.get(previousZone);
                    if (prevZone != null) {
                        prevZone.removeUser(userId);
                        autoExited = true;
                        log.info("User {} auto-exited from {} before entering {}", userId, previousZone, zoneName);
                    }
                }
                
                zone.addUser(userId);
                userCurrentZone.put(userId, zoneName);
                log.info("User {} entered {}", userId, zoneName);
                
                String message = autoExited 
                    ? String.format("Automatically exited from %s and entered %s", previousZone, zoneName)
                    : String.format("Successfully entered %s", zoneName);
                    
                return new LocationUpdateResponse(message, zoneName, autoExited ? previousZone : null, autoExited);
                
            } else if ("EXIT".equalsIgnoreCase(action)) {
                zone.removeUser(userId);
                userCurrentZone.remove(userId);
                log.info("User {} exited {}", userId, zoneName);
                return new LocationUpdateResponse(String.format("Successfully exited %s", zoneName), null, zoneName, false);
            }
            
            return new LocationUpdateResponse("Invalid action", userCurrentZone.get(userId), null, false);
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
                log.info("Crowd data restored successfully");
            } finally {
                lock.writeLock().unlock();
            }
        }
    }

    public String getUserCurrentZone(String userId) {
        lock.readLock().lock();
        try {
            return userCurrentZone.get(userId);
        } finally {
            lock.readLock().unlock();
        }
    }
}
