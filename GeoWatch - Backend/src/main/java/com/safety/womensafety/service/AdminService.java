package com.safety.womensafety.service;

import com.safety.womensafety.dto.ClusterResponse;
import com.safety.womensafety.model.Incident;
import com.safety.womensafety.repository.IncidentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
public class AdminService {

    private final IncidentRepository incidentRepository;
    private final ClusteringService clusteringService;
    private final MetricsService metricsService;

    @Autowired
    public AdminService(IncidentRepository incidentRepository, ClusteringService clusteringService, MetricsService metricsService) {
        this.incidentRepository = incidentRepository;
        this.clusteringService = clusteringService;
        this.metricsService = metricsService;
    }

    public List<ClusterResponse> getClusters(Long eventId) {
        LocalDateTime windowStart = LocalDateTime.now().minusMinutes(15);

        long startIncident = System.nanoTime();
        List<Incident> incidents = incidentRepository.findByEventIdAndTimestampAfterAndResolvedFalse(eventId, windowStart);
        long dbIncidentTime = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startIncident);
        metricsService.recordDbQuery("IncidentQuery", dbIncidentTime);

        long startDbscan = System.nanoTime();
        List<ClusterResponse> clusters = clusteringService.performClustering(incidents);
        long dbscanTime = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startDbscan);
        metricsService.recordDbscanExecution(dbscanTime, incidents.size(), clusters.size());

        return clusters;
    }
}
