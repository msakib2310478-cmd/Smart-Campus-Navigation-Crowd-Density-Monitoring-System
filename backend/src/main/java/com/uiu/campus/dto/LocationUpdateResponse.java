package com.uiu.campus.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LocationUpdateResponse {
    private String message;
    private String currentZone;
    private String previousZone; // null if no previous zone or same zone
    private boolean autoExited; // true if user was auto-exited from previous zone
}
