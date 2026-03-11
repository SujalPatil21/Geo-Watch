package com.safety.womensafety.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class NearbyEventResponse {

    private Long eventId;

    private String eventName;

    private Double centerLat;

    private Double centerLng;

    private Double radius;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private List<OrganizerDTO> organizers;
}