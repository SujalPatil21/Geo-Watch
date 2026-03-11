package com.safety.womensafety.dto;

import jakarta.validation.Valid;
import lombok.*;
import jakarta.validation.constraints.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateEventRequest {

    @NotBlank
    private String name;

    @NotNull
    private Double centerLat;

    @NotNull
    private Double centerLng;

    @Positive
    private Double radius;

    @NotNull
    private Long adminId;

    @NotBlank
    private String startTime;   // <-- change

    @NotBlank
    private String endTime;     // <-- change

    @NotNull
    private List<@Valid OrganizerDTO> organizers;
}
