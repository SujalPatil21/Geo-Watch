    package com.safety.womensafety.controller;

    import com.safety.womensafety.dto.ClusterResponse;
    import com.safety.womensafety.service.AdminService;
    import org.springframework.beans.factory.annotation.Autowired;
    import org.springframework.http.ResponseEntity;
    import org.springframework.web.bind.annotation.*;

    import java.util.List;

    @RestController
    @RequestMapping("/api/admin")
    public class AdminController {

        private final AdminService adminService;

        @Autowired
        public AdminController(AdminService adminService) {
            this.adminService = adminService;
        }

        @GetMapping("/clusters/{eventId}")
        public ResponseEntity<List<ClusterResponse>> getClusters(@PathVariable Long eventId) {
            List<ClusterResponse> clusters = adminService.getClusters(eventId);
            return ResponseEntity.ok(clusters);
        }
    }
