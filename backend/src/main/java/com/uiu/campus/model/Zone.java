package com.uiu.campus.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.HashSet;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Zone implements Serializable {
    private static final long serialVersionUID = 1L;

    private String name;
    private int capacity;
    private Set<String> activeUsers;
    private String crowdLevel;

    /**
     * Time Limit Value in seconds - estimated average stay duration.
     * After this duration, users are automatically removed from the zone.
     */
    private long tlvSeconds;

    public Zone(String name, int capacity) {
        this.name = name;
        this.capacity = capacity;
        this.activeUsers = new HashSet<>();
        this.crowdLevel = "LOW";
        this.tlvSeconds = 1800; // Default 30 minutes
    }

    public Zone(String name, int capacity, long tlvSeconds) {
        this.name = name;
        this.capacity = capacity;
        this.activeUsers = new HashSet<>();
        this.crowdLevel = "LOW";
        this.tlvSeconds = tlvSeconds;
    }

    public int getCurrentCount() {
        return activeUsers.size();
    }

    public double getOccupancyPercentage() {
        return (double) getCurrentCount() / capacity * 100;
    }

    public void updateCrowdLevel() {
        double occupancy = getOccupancyPercentage();
        if (occupancy >= 80) {
            this.crowdLevel = "HIGH";
        } else if (occupancy >= 50) {
            this.crowdLevel = "MEDIUM";
        } else {
            this.crowdLevel = "LOW";
        }
    }

    public void addUser(String userId) {
        activeUsers.add(userId);
        updateCrowdLevel();
    }

    public void removeUser(String userId) {
        activeUsers.remove(userId);
        updateCrowdLevel();
    }

    public boolean hasUser(String userId) {
        return activeUsers.contains(userId);
    }
}
