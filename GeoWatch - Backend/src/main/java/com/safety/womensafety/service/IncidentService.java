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
import java.util.concurrent.*;

@Service
@RequiredArgsConstructor
public class IncidentService {

    private final EventRepository eventRepository;
    private final IncidentRepository incidentRepository;
    private final ClusteringService clusteringService;
    private final SimpMessagingTemplate messagingTemplate;
    private final MetricsService metricsService;

    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
    private final ConcurrentHashMap<Long, ScheduledFuture<?>> pendingTasks = new ConcurrentHashMap<>();

    // Return incident ID instead of String
    public Long submitIncident(CreateIncidentRequest request) {

        // Fetch event
        long startEvent = System.nanoTime();
        Optional<Event> optionalEvent = eventRepository.findById(request.getEventId());
        long dbEventTime = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startEvent);
        metricsService.recordDbQuery("EventLookupQuery", dbEventTime);

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

        long startRate = System.nanoTime();
        List<Incident> recentReports =
                incidentRepository.findByPhoneNumberAndTimestampAfter(
                        request.getPhoneNumber(),
                        rateLimitWindow
                );
        long dbRateTime = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startRate);
        metricsService.recordDbQuery("RateLimiterQuery", dbRateTime);

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
        metricsService.recordIncidentProcessed();

        // Trigger background calculation and broadcast
        triggerClusteringAndBroadcast(request.getEventId());

        // Return the incident ID to Flutter
        return savedIncident.getId();
    }

    public String resolveIncident(Long incidentId) {

        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new RuntimeException("Incident not found"));

        incident.setResolved(true);
        incident.setResolvedAt(LocalDateTime.now());

        incidentRepository.save(incident);

        // Trigger background calculation and broadcast
        triggerClusteringAndBroadcast(incident.getEventId());

        return "Incident resolved successfully";
    }

    public void triggerClusteringAndBroadcast(Long eventId) {
        pendingTasks.compute(eventId, (key, existingTask) -> {
            if (existingTask != null && !existingTask.isDone()) {
                return existingTask;
            }
            return scheduler.schedule(() -> {
                try {
                    runClusteringAndBroadcast(eventId);
                } finally {
                    pendingTasks.remove(eventId);
                }
            }, 100, TimeUnit.MILLISECONDS);
        });
    }

    private void runClusteringAndBroadcast(Long eventId) {
        LocalDateTime clusteringWindow = LocalDateTime.now().minusMinutes(15);

        long startIncident = System.nanoTime();
        List<Incident> recentIncidents =
                incidentRepository.findByEventIdAndTimestampAfterAndResolvedFalse(
                        eventId,
                        clusteringWindow
                );
        long dbIncidentTime = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startIncident);
        metricsService.recordDbQuery("IncidentQuery", dbIncidentTime);

        long startDbscan = System.nanoTime();
        List<ClusterResponse> clusters =
                clusteringService.performClustering(recentIncidents);
        long dbscanTime = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startDbscan);
        metricsService.recordDbscanExecution(dbscanTime, recentIncidents.size(), clusters.size());

        long startWs = System.nanoTime();
        messagingTemplate.convertAndSend("/topic/risk-updates/" + eventId, clusters);
        long wsTime = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startWs);
        metricsService.recordWebSocketBroadcast(wsTime);
    }

    @jakarta.annotation.PreDestroy
    public void shutdown() {
        scheduler.shutdown();
    }
}