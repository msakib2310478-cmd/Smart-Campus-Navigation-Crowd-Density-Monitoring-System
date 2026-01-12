package com.uiu.campus.controller;

import com.uiu.campus.dto.ZoneDto;
import com.uiu.campus.model.Zone;
import com.uiu.campus.service.CrowdService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/recommend")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://localhost:5173"})
public class RecommendationController {
    private final CrowdService crowdService;

    @GetMapping("/best")
    public ResponseEntity<?> getBestRecommendation() {
        try {
            Zone bestZone = crowdService.getQuietestZone();
            if (bestZone == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(convertToDto(bestZone));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @GetMapping("/ranked")
    public ResponseEntity<?> getRankedZones() {
        try {
            List<ZoneDto> rankedZones = crowdService.getRankedZones().stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(rankedZones);
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

    record ErrorResponse(String message) {}
}
