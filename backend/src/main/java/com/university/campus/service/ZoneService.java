package com.university.campus.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.university.campus.model.Zone;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ZoneService {

    private final Map<String, Zone> zones = new ConcurrentHashMap<>();
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @PostConstruct
    public void loadZones() {
        try {
            ClassPathResource resource = new ClassPathResource("data/zones-capacity.json");
            List<Zone> zoneList = objectMapper.readValue(resource.getInputStream(), new TypeReference<List<Zone>>() {});
            
            for (Zone zone : zoneList) {
                zones.put(zone.getId(), zone);
            }
            
            System.out.println("Loaded " + zones.size() + " zones from zones-capacity.json");
        } catch (IOException e) {
            System.err.println("Failed to load zones: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public List<Zone> getAllZones() {
        return new ArrayList<>(zones.values());
    }

    public Optional<Zone> getZoneById(String id) {
        return Optional.ofNullable(zones.get(id));
    }

    public void updateZoneCounts(Map<String, Integer> zoneCounts) {
        for (Map.Entry<String, Integer> entry : zoneCounts.entrySet()) {
            Zone zone = zones.get(entry.getKey());
            if (zone != null) {
                zone.setCurrentCount(Math.min(entry.getValue(), zone.getCapacity()));
            }
        }
        
        // Broadcast update via WebSocket
        broadcastCrowdUpdate();
    }

    public void broadcastCrowdUpdate() {
        List<Zone> allZones = getAllZones();
        messagingTemplate.convertAndSend("/topic/crowd", allZones);
    }

    public List<Zone> getRecommendations() {
        List<Zone> allZones = new ArrayList<>(zones.values());
        allZones.sort(Comparator.comparingDouble(Zone::getCrowdPercentage));
        return allZones.subList(0, Math.min(5, allZones.size()));
    }
}
