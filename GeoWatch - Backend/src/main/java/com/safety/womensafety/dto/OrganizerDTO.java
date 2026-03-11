package com.safety.womensafety.dto;

import lombok.*;
import jakarta.validation.constraints.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OrganizerDTO {

    @NotBlank
    private String name;

    @NotBlank
    private String phoneNumber;
}
