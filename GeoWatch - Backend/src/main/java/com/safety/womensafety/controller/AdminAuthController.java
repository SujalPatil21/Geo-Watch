package com.safety.womensafety.controller;

import com.safety.womensafety.dto.AdminLoginRequest;
import com.safety.womensafety.dto.AdminLoginResponse;
import com.safety.womensafety.dto.AdminRegisterRequest;
import com.safety.womensafety.service.AdminAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminAuthController {

    private final AdminAuthService adminAuthService;

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody AdminRegisterRequest request) {

        return ResponseEntity.ok(adminAuthService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AdminLoginResponse> login(@RequestBody AdminLoginRequest request){
        return ResponseEntity.ok(adminAuthService.login(request));
    }
}