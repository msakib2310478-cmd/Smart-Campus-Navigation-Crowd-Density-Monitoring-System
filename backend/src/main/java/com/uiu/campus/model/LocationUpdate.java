package com.uiu.campus.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LocationUpdate {
    private String userId;
    private String zoneName;
    private String action; // "ENTER" or "EXIT"
}
