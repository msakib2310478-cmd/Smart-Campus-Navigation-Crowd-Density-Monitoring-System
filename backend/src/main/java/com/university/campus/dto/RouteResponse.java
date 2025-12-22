package com.university.campus.dto;

import com.university.campus.model.Zone;
import java.util.List;

public class RouteResponse {
    private List<Zone> path;
    private double estimatedTime;
    private String crowdLevel;
    private List<RouteAlternative> alternatives;

    public RouteResponse() {
    }

    public RouteResponse(List<Zone> path, double estimatedTime, String crowdLevel) {
        this.path = path;
        this.estimatedTime = estimatedTime;
        this.crowdLevel = crowdLevel;
    }

    public List<Zone> getPath() {
        return path;
    }

    public void setPath(List<Zone> path) {
        this.path = path;
    }

    public double getEstimatedTime() {
        return estimatedTime;
    }

    public void setEstimatedTime(double estimatedTime) {
        this.estimatedTime = estimatedTime;
    }

    public String getCrowdLevel() {
        return crowdLevel;
    }

    public void setCrowdLevel(String crowdLevel) {
        this.crowdLevel = crowdLevel;
    }

    public List<RouteAlternative> getAlternatives() {
        return alternatives;
    }

    public void setAlternatives(List<RouteAlternative> alternatives) {
        this.alternatives = alternatives;
    }

    public static class RouteAlternative {
        private String name;
        private double estimatedTime;
        private String crowdLevel;

        public RouteAlternative() {
        }

        public RouteAlternative(String name, double estimatedTime, String crowdLevel) {
            this.name = name;
            this.estimatedTime = estimatedTime;
            this.crowdLevel = crowdLevel;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public double getEstimatedTime() {
            return estimatedTime;
        }

        public void setEstimatedTime(double estimatedTime) {
            this.estimatedTime = estimatedTime;
        }

        public String getCrowdLevel() {
            return crowdLevel;
        }

        public void setCrowdLevel(String crowdLevel) {
            this.crowdLevel = crowdLevel;
        }
    }
}
