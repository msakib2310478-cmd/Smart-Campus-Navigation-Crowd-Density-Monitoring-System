package com.uiu.campus.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Table(name = "login_attempts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginAttempt implements Serializable {
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String identifier; // email or studentId or IP address

    private Integer attemptCount;

    private LocalDateTime lastAttemptTime;

    private LocalDateTime blockedUntil;

    @PrePersist
    protected void onCreate() {
        if (lastAttemptTime == null) {
            lastAttemptTime = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        lastAttemptTime = LocalDateTime.now();
    }
}
