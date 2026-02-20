package com.uiu.campus.service;

import com.uiu.campus.dto.ZoneDto;
import com.uiu.campus.model.Zone;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for broadcasting real-time crowd updates via WebSocket.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Broadcast updated crowd data to all connected clients.
     */
    public void broadcastCrowdUpdate(Map<String, Zone> zones) {
        List<ZoneDto> zoneDtos = zones.values().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());

        messagingTemplate.convertAndSend("/topic/crowd", zoneDtos);
        log.debug("Broadcasted crowd update to /topic/crowd");
    }

    /**
     * Broadcast a single zone update.
     */
    public void broadcastZoneUpdate(Zone zone) {
        ZoneDto zoneDto = convertToDto(zone);
        messagingTemplate.convertAndSend("/topic/zone/" + zone.getName(), zoneDto);
        log.debug("Broadcasted zone update for {}", zone.getName());
    }

    /**
     * Broadcast auto-exit event for a user.
     */
    public void broadcastAutoExit(String userId, String zoneName) {
        AutoExitEvent event = new AutoExitEvent(userId, zoneName, System.currentTimeMillis());
        messagingTemplate.convertAndSend("/topic/auto-exit", event);
        log.info("Broadcasted auto-exit event: user {} from zone {}", userId, zoneName);
    }

    private ZoneDto convertToDto(Zone zone) {
        return new ZoneDto(
                zone.getName(),
                zone.getCapacity(),
                zone.getCurrentCount(),
                zone.getOccupancyPercentage(),
                zone.getCrowdLevel());
    }

    /**
     * Event sent when a user is automatically removed due to TLV expiration.
     */
    public record AutoExitEvent(String userId, String zoneName, long timestamp) {
    }
}
