package com.safety.womensafety.service;

import com.safety.womensafety.dto.ClusterResponse;
import com.safety.womensafety.dto.CreateIncidentRequest;
import com.safety.womensafety.model.Event;
import com.safety.womensafety.model.Incident;
import com.safety.womensafety.repository.EventRepository;
import com.safety.womensafety.repository.IncidentRepository;
import com.safety.womensafety.util.GeoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class IncidentService {

    private final EventRepository eventRepository;
    private final IncidentRepository incidentRepository;
    private final ClusteringService clusteringService;
    private final SimpMessagingTemplate messagingTemplate;

    // Return incident ID instead of String
    public Long submitIncident(CreateIncidentRequest request) {

        // Fetch event
        Optional<Event> optionalEvent = eventRepository.findById(request.getEventId());

        if (optionalEvent.isEmpty()) {
            throw new RuntimeException("Event not found");
        }

        Event event = optionalEvent.get();

        // Validate event active
        LocalDateTime now = LocalDateTime.now();

        if (now.isBefore(event.getStartTime()) || now.isAfter(event.getEndTime())) {
            throw new RuntimeException("Event is not active");
        }

        // Validate geofence
        double distance = GeoUtil.calculateDistance(
                request.getLatitude(),
                request.getLongitude(),
                event.getCenterLat(),
                event.getCenterLng()
        );

        if (distance > event.getRadius() + 30) {
            throw new RuntimeException("Incident outside event geofence");
        }

        // -----------------------------
        // RATE LIMIT CHECK (5 minutes)
        // -----------------------------
        LocalDateTime rateLimitWindow = LocalDateTime.now().minusMinutes(5);

        List<Incident> recentReports =
                incidentRepository.findByPhoneNumberAndTimestampAfter(
                        request.getPhoneNumber(),
                        rateLimitWindow
                );

        if (recentReports.size() >= 3) {
            throw new RuntimeException("Too many incident reports. Please wait before reporting again.");
        }

        // Create incident using SERVER TIME
        Incident incident = new Incident();
        incident.setEventId(request.getEventId());
        incident.setName(request.getName());
        incident.setPhoneNumber(request.getPhoneNumber());
        incident.setLatitude(request.getLatitude());
        incident.setLongitude(request.getLongitude());
        incident.setTimestamp(LocalDateTime.now());

        // Save incident and capture saved entity
        Incident savedIncident = incidentRepository.save(incident);

        // -----------------------------
        // CLUSTERING WINDOW (15 minutes)
        // -----------------------------
        LocalDateTime clusteringWindow = LocalDateTime.now().minusMinutes(15);

        List<Incident> recentIncidents =
                incidentRepository.findByEventIdAndTimestampAfterAndResolvedFalse(
                        request.getEventId(),
                        clusteringWindow
                );

        System.out.println("Incidents fetched for clustering: " + recentIncidents.size());

        List<ClusterResponse> clusters =
                clusteringService.performClustering(recentIncidents);

        System.out.println("Clusters created: " + clusters);

        // Broadcast cluster updates
        messagingTemplate.convertAndSend("/topic/risk-updates", clusters);

        // Return the incident ID to Flutter
        return savedIncident.getId();
    }

    public String resolveIncident(Long incidentId) {

        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new RuntimeException("Incident not found"));

        incident.setResolved(true);
        incident.setResolvedAt(LocalDateTime.now());

        incidentRepository.save(incident);

        // Recalculate clusters
        LocalDateTime clusteringWindow = LocalDateTime.now().minusMinutes(15);

        List<Incident> recentIncidents =
                incidentRepository.findByEventIdAndTimestampAfterAndResolvedFalse(
                        incident.getEventId(),
                        clusteringWindow
                );

        List<ClusterResponse> clusters =
                clusteringService.performClustering(recentIncidents);

        messagingTemplate.convertAndSend("/topic/risk-updates", clusters);
        System.out.println("Broadcasting clusters to websocket: " + clusters);
        return "Incident resolved successfully";
    }
}