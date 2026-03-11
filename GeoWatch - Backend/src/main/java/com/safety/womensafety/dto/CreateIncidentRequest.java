package com.safety.womensafety.dto;

import lombok.*;
import jakarta.validation.constraints.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateIncidentRequest {

    @NotNull
    private Long eventId;

    @NotBlank
    private String name;

    @NotBlank
    private String phoneNumber;

    @NotNull
    private Double latitude;

    @NotNull
    private Double longitude;
}