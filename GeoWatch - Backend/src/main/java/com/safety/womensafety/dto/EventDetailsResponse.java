package com.safety.womensafety.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EventDetailsResponse {
    private Long eventId;
    private String name;
    private Double centerLat;
    private Double centerLng;
    private Double radius;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private List<OrganizerDTO> organizers;
}
