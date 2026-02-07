package com.uiu.campus.dto;

import com.uiu.campus.model.ZoneEntity;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for zone data with geographic coordinates and polygon.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Slf4j
public class ZoneResponse {
    private Long id;
    private String name;
    private Double latitude;
    private Double longitude;
    private Double radius;
    private Integer floor;
    private List<ZoneRequest.PolygonPointDto> polygon;
    private Integer capacity;
    private String description;
    private Integer currentCount;
    private Double occupancyPercentage;
    private String crowdLevel;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private static final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Create a ZoneResponse from ZoneEntity (without crowd data).
     * Deserializes polygonJson back to a list of points.
     */
    public static ZoneResponse fromEntity(ZoneEntity entity) {
        List<ZoneRequest.PolygonPointDto> polygonPoints = null;
        if (entity.getPolygonJson() != null && !entity.getPolygonJson().isEmpty()) {
            try {
                polygonPoints = objectMapper.readValue(
                        entity.getPolygonJson(),
                        new TypeReference<List<ZoneRequest.PolygonPointDto>>() {
                        });
            } catch (Exception e) {
                log.warn("Failed to deserialize polygon JSON for zone '{}': {}",
                        entity.getName(), e.getMessage());
            }
        }

        ZoneResponse response = new ZoneResponse();
        response.setId(entity.getId());
        response.setName(entity.getName());
        response.setLatitude(entity.getLatitude());
        response.setLongitude(entity.getLongitude());
        response.setRadius(entity.getRadius());
        response.setFloor(entity.getFloor());
        response.setPolygon(polygonPoints);
        response.setCapacity(entity.getCapacity());
        response.setDescription(entity.getDescription());
        response.setCurrentCount(0);
        response.setOccupancyPercentage(0.0);
        response.setCrowdLevel("LOW");
        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());
        return response;
    }
}
