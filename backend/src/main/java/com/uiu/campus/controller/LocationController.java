package com.uiu.campus.controller;

import com.uiu.campus.dto.ZoneDto;
import com.uiu.campus.model.LocationUpdate;
import com.uiu.campus.model.Zone;
import com.uiu.campus.service.CrowdService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/location")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class LocationController {
    private final CrowdService crowdService;

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

    private ZoneDto convertToDto(Zone zone) {
        return new ZoneDto(
                zone.getName(),
                zone.getCapacity(),
                zone.getCurrentCount(),
                zone.getOccupancyPercentage(),
                zone.getCrowdLevel()
        );
    }

    record SuccessResponse(String message) {}
    record ErrorResponse(String message) {}
}
