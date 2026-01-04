package com.uiu.campus.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ZoneDto {
    private String name;
    private int capacity;
    private int currentCount;
    private double occupancyPercentage;
    private String crowdLevel;
}
