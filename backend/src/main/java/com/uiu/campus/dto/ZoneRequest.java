package com.uiu.campus.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for creating/updating zones.
 * Supports polygon-based zone boundaries.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ZoneRequest {
    private String name;
    private Double latitude;
    private Double longitude;
    private Double radius; // 0 for polygon-based zones
    private Integer floor;
    private List<PolygonPointDto> polygon;
    private Integer capacity;
    private String description;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PolygonPointDto {
        private Double latitude;
        private Double longitude;
    }
}
