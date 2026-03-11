package com.safety.womensafety.service;

import com.safety.womensafety.dto.AdminLoginRequest;
import com.safety.womensafety.dto.AdminLoginResponse;
import com.safety.womensafety.dto.AdminRegisterRequest;
import com.safety.womensafety.model.Admin;
import com.safety.womensafety.repository.AdminRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminAuthService {

    private final AdminRepository adminRepository;

    public String register(AdminRegisterRequest request) {

        Admin admin = new Admin();
        admin.setName(request.getName());
        admin.setEmail(request.getEmail());
        admin.setPassword(request.getPassword());

        adminRepository.save(admin);

        return "Admin registered successfully";
    }
    public AdminLoginResponse login(AdminLoginRequest request) {

        Admin admin = adminRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        if (!admin.getPassword().equals(request.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        return new AdminLoginResponse(
                "Login successful",
                admin.getId()
        );
    }
}