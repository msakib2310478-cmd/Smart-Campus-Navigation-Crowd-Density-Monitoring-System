package com.university.campus.model;

public class Zone {
    private String id;
    private String name;
    private int capacity;
    private Location location;
    private String type;
    private int currentCount;

    public Zone() {
    }

    public Zone(String id, String name, int capacity, Location location, String type) {
        this.id = id;
        this.name = name;
        this.capacity = capacity;
        this.location = location;
        this.type = type;
        this.currentCount = 0;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getCapacity() {
        return capacity;
    }

    public void setCapacity(int capacity) {
        this.capacity = capacity;
    }

    public Location getLocation() {
        return location;
    }

    public void setLocation(Location location) {
        this.location = location;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public int getCurrentCount() {
        return currentCount;
    }

    public void setCurrentCount(int currentCount) {
        this.currentCount = currentCount;
    }

    public double getCrowdPercentage() {
        return capacity > 0 ? (double) currentCount / capacity * 100 : 0;
    }

    public String getCrowdLevel() {
        double percentage = getCrowdPercentage();
        if (percentage < 30) return "LOW";
        if (percentage < 70) return "MEDIUM";
        return "HIGH";
    }
}
