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

    public Zone(String name, int capacity) {
        this.name = name;
        this.capacity = capacity;
        this.activeUsers = new HashSet<>();
        this.crowdLevel = "LOW";
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

    /**
     * Add a user to this zone.
     * Uses Set so duplicates are automatically ignored.
     * @return true if user was added, false if already present
     */
    public boolean addUser(String userId) {
        boolean added = activeUsers.add(userId);
        if (added) {
            updateCrowdLevel();
        }
        return added;
    }

    /**
     * Remove a user from this zone.
     * @return true if user was removed, false if not present
     */
    public boolean removeUser(String userId) {
        boolean removed = activeUsers.remove(userId);
        if (removed) {
            updateCrowdLevel();
        }
        return removed;
    }

    /**
     * Safely remove a user, preventing negative counts.
     * Only removes if user is present and count > 0.
     * @return true if user was removed, false otherwise
     */
    public boolean safeRemoveUser(String userId) {
        if (activeUsers.contains(userId) && getCurrentCount() > 0) {
            return removeUser(userId);
        }
        return false;
    }

    /**
     * Check if a user is currently in this zone.
     */
    public boolean hasUser(String userId) {
        return activeUsers.contains(userId);
    }
}
