package com.uiu.campus.service;

import com.uiu.campus.dto.ZoneRequest;
import com.uiu.campus.dto.ZoneResponse;
import com.uiu.campus.model.User;
import com.uiu.campus.model.Zone;
import com.uiu.campus.model.ZoneEntity;
import com.uiu.campus.repository.ZoneRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service for managing admin-defined campus zones.
 * Handles CRUD operations for zones and syncs with CrowdService.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ZoneService {

    private final ZoneRepository zoneRepository;
    private final CrowdService crowdService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Initialize zones from database on startup
     */
    @PostConstruct
    public void initializeZonesFromDatabase() {
        List<ZoneEntity> savedZones = zoneRepository.findAll();
        if (!savedZones.isEmpty()) {
            log.info("Loading {} zones from database", savedZones.size());
            for (ZoneEntity zoneEntity : savedZones) {
                crowdService.addOrUpdateZone(zoneEntity.getName(), zoneEntity.getCapacity());
            }
        } else {
            log.info("No saved zones found, using default zones from CrowdService");
        }
    }

    /**
     * Get all zones with their current crowd data
     */
    @Transactional(readOnly = true)
    public List<ZoneResponse> getAllZones() {
        List<ZoneEntity> entities = zoneRepository.findAll();
        return entities.stream()
                .map(this::enrichWithCrowdData)
                .collect(Collectors.toList());
    }

    /**
     * Get a zone by ID
     */
    @Transactional(readOnly = true)
    public Optional<ZoneResponse> getZoneById(Long id) {
        return zoneRepository.findById(id)
                .map(this::enrichWithCrowdData);
    }

    /**
     * Create a new zone (admin only)
     */
    @Transactional
    public ZoneResponse createZone(ZoneRequest request, User admin) {
        // Validate request
        validateZoneRequest(request);

        // Check for duplicate name
        if (zoneRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException("Zone with name '" + request.getName() + "' already exists");
        }

        // Create entity
        ZoneEntity entity = new ZoneEntity();
        applyRequestToEntity(entity, request);
        entity.setCreatedBy(admin);

        // Save to database
        ZoneEntity saved = zoneRepository.save(entity);
        log.info("Zone '{}' created by admin {} (floor={}, polygon={}pts)",
                saved.getName(), admin.getEmail(), saved.getFloor(),
                request.getPolygon() != null ? request.getPolygon().size() : 0);

        // Sync with CrowdService for real-time tracking
        crowdService.addOrUpdateZone(saved.getName(), saved.getCapacity());

        return enrichWithCrowdData(saved);
    }

    /**
     * Update an existing zone (admin only)
     */
    @Transactional
    public ZoneResponse updateZone(Long id, ZoneRequest request, User admin) {
        // Find existing zone
        ZoneEntity entity = zoneRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Zone not found with id: " + id));

        // Validate request
        validateZoneRequest(request);

        // Check for duplicate name (excluding current zone)
        if (zoneRepository.existsByNameAndIdNot(request.getName(), id)) {
            throw new IllegalArgumentException("Zone with name '" + request.getName() + "' already exists");
        }

        String oldName = entity.getName();

        // Update entity
        applyRequestToEntity(entity, request);

        // Save to database
        ZoneEntity saved = zoneRepository.save(entity);
        log.info("Zone '{}' updated by admin {}", saved.getName(), admin.getEmail());

        // Sync with CrowdService
        if (!oldName.equals(saved.getName())) {
            crowdService.renameZone(oldName, saved.getName());
        }
        crowdService.addOrUpdateZone(saved.getName(), saved.getCapacity());

        return enrichWithCrowdData(saved);
    }

    /**
     * Delete a zone (admin only)
     */
    @Transactional
    public void deleteZone(Long id, User admin) {
        ZoneEntity entity = zoneRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Zone not found with id: " + id));

        String zoneName = entity.getName();

        // Remove from database
        zoneRepository.delete(entity);
        log.info("Zone '{}' deleted by admin {}", zoneName, admin.getEmail());

        // Remove from CrowdService
        crowdService.removeZone(zoneName);
    }

    /**
     * Apply request fields to a ZoneEntity, including polygon serialization.
     */
    private void applyRequestToEntity(ZoneEntity entity, ZoneRequest request) {
        entity.setName(request.getName());
        entity.setLatitude(request.getLatitude());
        entity.setLongitude(request.getLongitude());
        entity.setRadius(request.getRadius() != null ? request.getRadius() : 0.0);
        entity.setFloor(request.getFloor() != null ? request.getFloor() : 0);
        entity.setCapacity(request.getCapacity());
        entity.setDescription(request.getDescription());

        // Serialize polygon to JSON
        if (request.getPolygon() != null && !request.getPolygon().isEmpty()) {
            try {
                entity.setPolygonJson(objectMapper.writeValueAsString(request.getPolygon()));
            } catch (Exception e) {
                log.error("Failed to serialize polygon", e);
                throw new IllegalArgumentException("Invalid polygon data");
            }
        } else {
            entity.setPolygonJson(null);
        }
    }

    /**
     * Validate zone request
     */
    private void validateZoneRequest(ZoneRequest request) {
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Zone name is required");
        }
        if (request.getLatitude() == null || request.getLatitude() < -90 || request.getLatitude() > 90) {
            throw new IllegalArgumentException("Valid latitude (-90 to 90) is required");
        }
        if (request.getLongitude() == null || request.getLongitude() < -180 || request.getLongitude() > 180) {
            throw new IllegalArgumentException("Valid longitude (-180 to 180) is required");
        }
        // Polygon-based zones may have radius=0, so only validate radius if no polygon
        // is provided
        boolean hasPolygon = request.getPolygon() != null && request.getPolygon().size() >= 3;
        if (!hasPolygon && (request.getRadius() == null || request.getRadius() <= 0)) {
            throw new IllegalArgumentException("Either a polygon (>=3 points) or a radius > 0 is required");
        }
        if (hasPolygon) {
            // Validate each polygon point
            for (ZoneRequest.PolygonPointDto point : request.getPolygon()) {
                if (point.getLatitude() == null || point.getLatitude() < -90 || point.getLatitude() > 90) {
                    throw new IllegalArgumentException("All polygon points must have valid latitude (-90 to 90)");
                }
                if (point.getLongitude() == null || point.getLongitude() < -180 || point.getLongitude() > 180) {
                    throw new IllegalArgumentException("All polygon points must have valid longitude (-180 to 180)");
                }
            }
        }
        if (request.getCapacity() == null || request.getCapacity() <= 0) {
            throw new IllegalArgumentException("Capacity must be greater than 0");
        }
    }

    /**
     * Enrich zone entity with real-time crowd data from CrowdService
     */
    private ZoneResponse enrichWithCrowdData(ZoneEntity entity) {
        ZoneResponse response = ZoneResponse.fromEntity(entity);

        Zone crowdZone = crowdService.getZone(entity.getName());
        if (crowdZone != null) {
            response.setCurrentCount(crowdZone.getCurrentCount());
            response.setOccupancyPercentage(crowdZone.getOccupancyPercentage());
            response.setCrowdLevel(crowdZone.getCrowdLevel());
        }

        return response;
    }
}
