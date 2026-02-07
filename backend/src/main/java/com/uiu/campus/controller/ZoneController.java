package com.uiu.campus.controller;

import com.uiu.campus.dto.ZoneRequest;
import com.uiu.campus.dto.ZoneResponse;
import com.uiu.campus.model.User;
import com.uiu.campus.service.AuthService;
import com.uiu.campus.service.ZoneService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for admin zone management.
 * Provides CRUD operations for campus zones.
 * All endpoints require admin authentication.
 */
@RestController
@RequestMapping("/api/zones")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://localhost:5173"})
@Slf4j
public class ZoneController {

    private final ZoneService zoneService;
    private final AuthService authService;

    /**
     * Get all zones with geographic data and crowd status
     */
    @GetMapping
    public ResponseEntity<?> getAllZones() {
        try {
            List<ZoneResponse> zones = zoneService.getAllZones();
            return ResponseEntity.ok(zones);
        } catch (Exception e) {
            log.error("Error fetching zones", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to fetch zones"));
        }
    }

    /**
     * Get a specific zone by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getZone(@PathVariable Long id) {
        try {
            return zoneService.getZoneById(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error fetching zone {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to fetch zone"));
        }
    }

    /**
     * Create a new zone (admin only)
     */
    @PostMapping
    public ResponseEntity<?> createZone(
            @RequestBody ZoneRequest request,
            @RequestHeader("Authorization") String authHeader) {
        try {
            User admin = getAdminUser(authHeader);
            ZoneResponse created = zoneService.createZone(request, admin);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Error creating zone", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to create zone"));
        }
    }

    /**
     * Update an existing zone (admin only)
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateZone(
            @PathVariable Long id,
            @RequestBody ZoneRequest request,
            @RequestHeader("Authorization") String authHeader) {
        try {
            User admin = getAdminUser(authHeader);
            ZoneResponse updated = zoneService.updateZone(id, request, admin);
            return ResponseEntity.ok(updated);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Error updating zone {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to update zone"));
        }
    }

    /**
     * Delete a zone (admin only)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteZone(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {
        try {
            User admin = getAdminUser(authHeader);
            zoneService.deleteZone(id, admin);
            return ResponseEntity.ok(new SuccessResponse("Zone deleted successfully"));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Error deleting zone {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to delete zone"));
        }
    }

    /**
     * Extract and validate admin user from JWT token
     */
    private User getAdminUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new SecurityException("Authorization token required");
        }

        String token = authHeader.replace("Bearer ", "");
        User user = authService.getUserFromToken(token);

        if (!user.isAdmin()) {
            throw new SecurityException("Admin access required");
        }

        return user;
    }

    record ErrorResponse(String message) {}
    record SuccessResponse(String message) {}
}
