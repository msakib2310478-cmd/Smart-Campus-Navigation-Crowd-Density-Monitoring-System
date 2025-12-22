package com.university.campus.dto;

import jakarta.validation.constraints.NotBlank;

public class RouteRequest {
    @NotBlank
    private String startZoneId;
    
    @NotBlank
    private String endZoneId;
    
    private boolean avoidCrowded;

    public RouteRequest() {
    }

    public String getStartZoneId() {
        return startZoneId;
    }

    public void setStartZoneId(String startZoneId) {
        this.startZoneId = startZoneId;
    }

    public String getEndZoneId() {
        return endZoneId;
    }

    public void setEndZoneId(String endZoneId) {
        this.endZoneId = endZoneId;
    }

    public boolean isAvoidCrowded() {
        return avoidCrowded;
    }

    public void setAvoidCrowded(boolean avoidCrowded) {
        this.avoidCrowded = avoidCrowded;
    }
}
