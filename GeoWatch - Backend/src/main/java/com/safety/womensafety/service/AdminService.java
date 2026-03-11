package com.safety.womensafety.service;

import com.safety.womensafety.dto.ClusterResponse;
import com.safety.womensafety.model.Incident;
import com.safety.womensafety.repository.IncidentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AdminService {

    private final IncidentRepository incidentRepository;
    private final ClusteringService clusteringService;

    @Autowired
    public AdminService(IncidentRepository incidentRepository, ClusteringService clusteringService) {
        this.incidentRepository = incidentRepository;
        this.clusteringService = clusteringService;
    }

    public List<ClusterResponse> getClusters(Long eventId) {
        LocalDateTime windowStart = LocalDateTime.now().minusMinutes(15);
        List<Incident> incidents = incidentRepository.findByEventIdAndTimestampAfterAndResolvedFalse(eventId, windowStart);
        return clusteringService.performClustering(incidents);
    }
}
