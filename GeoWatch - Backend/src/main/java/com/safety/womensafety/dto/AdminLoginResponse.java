package com.safety.womensafety.dto;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class AdminLoginResponse {

    private String message;
    private Long adminId;
}