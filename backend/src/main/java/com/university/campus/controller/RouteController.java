package com.university.campus.controller;

import com.university.campus.dto.RouteRequest;
import com.university.campus.dto.RouteResponse;
import com.university.campus.model.Zone;
import com.university.campus.service.ZoneService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/routes")
public class RouteController {

    @Autowired
    private ZoneService zoneService;

    @PostMapping
    public ResponseEntity<RouteResponse> calculateRoute(@Valid @RequestBody RouteRequest request) {
        Optional<Zone> startZone = zoneService.getZoneById(request.getStartZoneId());
        Optional<Zone> endZone = zoneService.getZoneById(request.getEndZoneId());

        if (startZone.isEmpty() || endZone.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        // Mock route calculation - in a real app, this would use a routing algorithm
        List<Zone> path = new ArrayList<>();
        path.add(startZone.get());
        path.add(endZone.get());

        double estimatedTime = 5.0; // minutes
        String crowdLevel = endZone.get().getCrowdLevel();

        RouteResponse response = new RouteResponse(path, estimatedTime, crowdLevel);

        // Add mock alternatives
        List<RouteResponse.RouteAlternative> alternatives = new ArrayList<>();
        alternatives.add(new RouteResponse.RouteAlternative("Fast Route", 3.5, "HIGH"));
        alternatives.add(new RouteResponse.RouteAlternative("Scenic Route", 7.0, "LOW"));
        response.setAlternatives(alternatives);

        return ResponseEntity.ok(response);
    }
}
