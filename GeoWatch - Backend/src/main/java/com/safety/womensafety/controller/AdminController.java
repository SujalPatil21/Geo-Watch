    package com.safety.womensafety.controller;

    import com.safety.womensafety.dto.ClusterResponse;
    import com.safety.womensafety.service.AdminService;
    import com.safety.womensafety.service.MetricsService;
    import org.springframework.beans.factory.annotation.Autowired;
    import org.springframework.http.ResponseEntity;
    import org.springframework.web.bind.annotation.*;

    import java.util.List;
    import java.util.Map;

    @RestController
    @RequestMapping("/api/admin")
    public class AdminController {

        private final AdminService adminService;
        private final MetricsService metricsService;

        @Autowired
        public AdminController(AdminService adminService, MetricsService metricsService) {
            this.adminService = adminService;
            this.metricsService = metricsService;
        }

        @GetMapping("/clusters/{eventId}")
        public ResponseEntity<List<ClusterResponse>> getClusters(@PathVariable Long eventId) {
            List<ClusterResponse> clusters = adminService.getClusters(eventId);
            return ResponseEntity.ok(clusters);
        }

        @GetMapping("/metrics")
        public ResponseEntity<Map<String, Object>> getMetrics() {
            return ResponseEntity.ok(metricsService.compileMetrics());
        }
    }
