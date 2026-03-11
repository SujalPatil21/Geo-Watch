package com.safety.womensafety.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AdminLoginRequest {

    private String email;
    private String password;
}