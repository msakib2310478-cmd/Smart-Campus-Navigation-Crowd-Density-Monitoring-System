package com.uiu.campus.controller;

import com.uiu.campus.dto.ZoneDto;
import com.uiu.campus.model.LocationUpdate;
import com.uiu.campus.model.Zone;
import com.uiu.campus.model.ZoneEntry;
import com.uiu.campus.service.CrowdService;
import com.uiu.campus.service.TLVSchedulerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/location")
@RequiredArgsConstructor
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001", "http://localhost:5173" })
public class LocationController {
    private final CrowdService crowdService;
    private final TLVSchedulerService tlvSchedulerService;

    @PostMapping("/update")
    public ResponseEntity<?> updateLocation(@RequestBody LocationUpdate update) {
        try {
            crowdService.updateLocation(update.getUserId(), update.getZoneName(), update.getAction());
            return ResponseEntity.ok(new SuccessResponse("Location updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @GetMapping("/crowd")
    public ResponseEntity<?> getCrowdStatus() {
        try {
            Map<String, Zone> zones = crowdService.getAllZones();
            List<ZoneDto> zoneDtos = zones.values().stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(zoneDtos);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @GetMapping("/quiet")
    public ResponseEntity<?> getQuietestZone() {
        try {
            Zone quietestZone = crowdService.getQuietestZone();
            if (quietestZone == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(convertToDto(quietestZone));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    /**
     * Get the remaining time before auto-exit for a user.
     */
    @GetMapping("/tlv/{userId}")
    public ResponseEntity<?> getUserTLVStatus(@PathVariable String userId) {
        try {
            ZoneEntry entry = tlvSchedulerService.getEntry(userId);
            if (entry == null) {
                return ResponseEntity.ok(new TLVStatusResponse(userId, null, 0, false));
            }
            return ResponseEntity.ok(new TLVStatusResponse(
                    userId,
                    entry.getZoneName(),
                    entry.getRemainingSeconds(),
                    true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    /**
     * Get TLV configuration for all zones.
     */
    @GetMapping("/tlv/config")
    public ResponseEntity<?> getTLVConfig() {
        try {
            Map<String, Zone> zones = crowdService.getAllZones();
            List<ZoneTLVConfig> configs = zones.values().stream()
                    .map(z -> new ZoneTLVConfig(z.getName(), z.getTlvSeconds()))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(configs);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    /**
     * Get active entry count (for monitoring).
     */
    @GetMapping("/tlv/active-count")
    public ResponseEntity<?> getActiveEntryCount() {
        try {
            int count = tlvSchedulerService.getActiveEntryCount();
            return ResponseEntity.ok(Map.of("activeEntries", count));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    private ZoneDto convertToDto(Zone zone) {
        return new ZoneDto(
                zone.getName(),
                zone.getCapacity(),
                zone.getCurrentCount(),
                zone.getOccupancyPercentage(),
                zone.getCrowdLevel());
    }

    record SuccessResponse(String message) {
    }

    record ErrorResponse(String message) {
    }

    record TLVStatusResponse(String userId, String zoneName, long remainingSeconds, boolean active) {
    }

    record ZoneTLVConfig(String zoneName, long tlvSeconds) {
    }
}
