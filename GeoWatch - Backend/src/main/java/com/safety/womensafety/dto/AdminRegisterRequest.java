package com.safety.womensafety.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AdminRegisterRequest {

    private String name;
    private String email;
    private String password;
}