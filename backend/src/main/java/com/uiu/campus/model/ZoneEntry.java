package com.uiu.campus.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.Instant;

/**
 * Represents a user's entry into a zone with timestamp for TLV-based auto-exit.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ZoneEntry implements Serializable {
    private static final long serialVersionUID = 1L;

    private String userId;
    private String zoneName;
    private Instant entryTime;
    private Instant expectedExitTime;

    public ZoneEntry(String userId, String zoneName, long tlvSeconds) {
        this.userId = userId;
        this.zoneName = zoneName;
        this.entryTime = Instant.now();
        this.expectedExitTime = this.entryTime.plusSeconds(tlvSeconds);
    }

    /**
     * Check if this entry has expired based on TLV.
     */
    public boolean isExpired() {
        return Instant.now().isAfter(expectedExitTime);
    }

    /**
     * Get remaining time in seconds before auto-exit.
     */
    public long getRemainingSeconds() {
        long remaining = expectedExitTime.getEpochSecond() - Instant.now().getEpochSecond();
        return Math.max(0, remaining);
    }
}
