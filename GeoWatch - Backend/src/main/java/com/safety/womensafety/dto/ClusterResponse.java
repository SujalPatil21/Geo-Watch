package com.safety.womensafety.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClusterResponse {

    private double centerLat;
    private double centerLng;
    private int incidentCount;
    private String riskLevel;
}