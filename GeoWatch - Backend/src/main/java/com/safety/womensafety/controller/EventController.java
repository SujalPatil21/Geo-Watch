package com.safety.womensafety.controller;

import com.safety.womensafety.dto.CreateEventRequest;
import com.safety.womensafety.dto.EventDetailsResponse;
import com.safety.womensafety.dto.NearbyEventResponse;
import com.safety.womensafety.model.Event;
import com.safety.womensafety.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    // Create Event
    @PostMapping
    public ResponseEntity<?> createEvent(@Valid @RequestBody CreateEventRequest request) {

        System.out.println("EVENT API HIT");

        Long eventId = eventService.createEvent(request);

        return ResponseEntity.ok(
                Map.of(
                        "message", "Event created successfully",
                        "eventId", eventId
                )
        );
    }

    // Get Nearby Events
    @GetMapping("/nearby")
    public ResponseEntity<List<NearbyEventResponse>> getNearbyEvents(
            @RequestParam double lat,
            @RequestParam double lng
    ) {

        System.out.println("NEARBY API HIT");
        System.out.println("LAT: " + lat);
        System.out.println("LNG: " + lng);

        List<NearbyEventResponse> events = eventService.getNearbyEvents(lat, lng);

        return ResponseEntity.ok(events);
    }

    // Get Event Details
    @GetMapping("/{eventId}")
    public ResponseEntity<EventDetailsResponse> getEventDetails(@PathVariable Long eventId) {

        EventDetailsResponse response = eventService.getEventDetails(eventId);

        return ResponseEntity.ok(response);
    }

    // Get Active Events (for AdminHome)
    @GetMapping("/admin/active")
    public ResponseEntity<List<EventDetailsResponse>> getActiveEvents(@RequestParam Long adminId) {

        List<EventDetailsResponse> events = eventService.getActiveEvents(adminId);

        return ResponseEntity.ok(events);
    }

}
