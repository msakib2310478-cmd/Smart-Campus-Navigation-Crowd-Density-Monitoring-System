package com.university.campus.dto;

import java.util.Map;

public class SimulationRequest {
    private Map<String, Integer> zoneCounts;

    public SimulationRequest() {
    }

    public SimulationRequest(Map<String, Integer> zoneCounts) {
        this.zoneCounts = zoneCounts;
    }

    public Map<String, Integer> getZoneCounts() {
        return zoneCounts;
    }

    public void setZoneCounts(Map<String, Integer> zoneCounts) {
        this.zoneCounts = zoneCounts;
    }
}
