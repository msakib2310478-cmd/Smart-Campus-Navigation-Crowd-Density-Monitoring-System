package com.university.campus.model;

import java.time.LocalDateTime;

public class Report {
    private String id;
    private String zoneId;
    private String zoneName;
    private String issue;
    private String description;
    private String reportedBy;
    private LocalDateTime timestamp;
    private String status;

    public Report() {
        this.timestamp = LocalDateTime.now();
        this.status = "PENDING";
    }

    public Report(String id, String zoneId, String zoneName, String issue, String description, String reportedBy) {
        this.id = id;
        this.zoneId = zoneId;
        this.zoneName = zoneName;
        this.issue = issue;
        this.description = description;
        this.reportedBy = reportedBy;
        this.timestamp = LocalDateTime.now();
        this.status = "PENDING";
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getZoneId() {
        return zoneId;
    }

    public void setZoneId(String zoneId) {
        this.zoneId = zoneId;
    }

    public String getZoneName() {
        return zoneName;
    }

    public void setZoneName(String zoneName) {
        this.zoneName = zoneName;
    }

    public String getIssue() {
        return issue;
    }

    public void setIssue(String issue) {
        this.issue = issue;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getReportedBy() {
        return reportedBy;
    }

    public void setReportedBy(String reportedBy) {
        this.reportedBy = reportedBy;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
