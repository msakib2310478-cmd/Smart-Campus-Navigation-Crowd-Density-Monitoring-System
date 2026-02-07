package com.uiu.campus.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * Persistent zone entity for storing admin-defined campus zones.
 * Supports polygon-based zone boundaries and floor information.
 */
@Entity
@Table(name = "zones")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ZoneEntity implements Serializable {
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(nullable = false)
    private Double radius; // in meters (0 for polygon-based zones)

    @Column(nullable = false)
    private Integer floor;

    @Column(columnDefinition = "CLOB")
    private String polygonJson; // JSON array of {latitude, longitude} points

    @Column(nullable = false)
    private Integer capacity;

    private String description;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * Convert this entity to the in-memory Zone model used for crowd tracking
     */
    public Zone toZone() {
        return new Zone(this.name, this.capacity);
    }
}
