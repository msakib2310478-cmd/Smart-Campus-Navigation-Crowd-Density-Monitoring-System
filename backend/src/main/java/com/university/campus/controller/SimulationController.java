package com.university.campus.controller;

import com.university.campus.dto.SimulationRequest;
import com.university.campus.service.ZoneService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/simulate")
public class SimulationController {

    @Autowired
    private ZoneService zoneService;

    @PostMapping("/crowd")
    public ResponseEntity<Map<String, Object>> updateCrowd(@RequestBody SimulationRequest request) {
        if (request.getZoneCounts() == null || request.getZoneCounts().isEmpty()) {
            return ResponseEntity.badRequest().body(
                Map.of("error", "Zone counts cannot be empty")
            );
        }

        zoneService.updateZoneCounts(request.getZoneCounts());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Crowd simulation updated successfully");
        response.put("updatedZones", request.getZoneCounts().size());

        return ResponseEntity.ok(response);
    }
}
