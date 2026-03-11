package com.safety.womensafety.service;

import com.safety.womensafety.dto.CreateEventRequest;
import com.safety.womensafety.dto.EventDetailsResponse;
import com.safety.womensafety.dto.NearbyEventResponse;
import com.safety.womensafety.dto.OrganizerDTO;
import com.safety.womensafety.model.Admin;
import com.safety.womensafety.model.Event;
import com.safety.womensafety.model.Organizer;
import com.safety.womensafety.repository.AdminRepository;
import com.safety.womensafety.repository.EventRepository;
import com.safety.womensafety.util.GeoUtil;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EventService {

    private final AdminRepository adminRepository;
    private final EventRepository eventRepository;

    // ----------------------------
    // CREATE EVENT
    // ----------------------------
    public Long createEvent(CreateEventRequest request) {

        System.out.println("StartTime received: " + request.getStartTime());
        System.out.println("EndTime received: " + request.getEndTime());
        System.out.println("CenterLat: " + request.getCenterLat());
        System.out.println("CenterLng: " + request.getCenterLng());
        System.out.println("Radius: " + request.getRadius());
        System.out.println("Organizers: " + request.getOrganizers());

        LocalDateTime start = LocalDateTime.parse(request.getStartTime().replace("Z", ""));
        LocalDateTime end = LocalDateTime.parse(request.getEndTime().replace("Z", ""));

        if (start.isAfter(end)) {
            throw new RuntimeException("Start time must be before end time");
        }

        Event event = new Event();
        event.setName(request.getName());
        event.setCenterLat(request.getCenterLat());
        event.setCenterLng(request.getCenterLng());
        event.setRadius(request.getRadius());
        event.setStartTime(start);
        event.setEndTime(end);

        Admin admin = adminRepository.findById(request.getAdminId())
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        event.setAdmin(admin);

        List<Organizer> organizerList = new ArrayList<>();

        if (request.getOrganizers() != null) {

            for (OrganizerDTO dto : request.getOrganizers()) {

                Organizer organizer = new Organizer();
                organizer.setName(dto.getName());
                organizer.setPhoneNumber(dto.getPhoneNumber());

                organizer.setEvent(event);

                organizerList.add(organizer);
            }
        }

        event.setOrganizers(organizerList);

        Event savedEvent = eventRepository.save(event);

        return savedEvent.getId();
    }

    // ----------------------------
    // NEARBY EVENTS (Mobile App)
    // ----------------------------
    public List<NearbyEventResponse> getNearbyEvents(double lat, double lng) {

        LocalDateTime now = LocalDateTime.now();

        List<Event> activeEvents =
                eventRepository.findByStartTimeBeforeAndEndTimeAfter(now, now);

        List<NearbyEventResponse> responseList = new ArrayList<>();

        for (Event event : activeEvents) {

            double distance = GeoUtil.calculateDistance(
                    lat,
                    lng,
                    event.getCenterLat(),
                    event.getCenterLng()
            );

            if (distance <= event.getRadius() + 30) {

                List<OrganizerDTO> organizerDTOList = new ArrayList<>();

                if (event.getOrganizers() != null) {

                    for (Organizer organizer : event.getOrganizers()) {

                        OrganizerDTO dto = new OrganizerDTO();
                        dto.setName(organizer.getName());
                        dto.setPhoneNumber(organizer.getPhoneNumber());

                        organizerDTOList.add(dto);
                    }
                }

                NearbyEventResponse response = new NearbyEventResponse();

                response.setEventId(event.getId());
                response.setEventName(event.getName());

                response.setCenterLat(event.getCenterLat());
                response.setCenterLng(event.getCenterLng());
                response.setRadius(event.getRadius());
                response.setStartTime(event.getStartTime());
                response.setEndTime(event.getEndTime());

                response.setOrganizers(organizerDTOList);

                responseList.add(response);
            }
        }

        return responseList;
    }

    // ----------------------------
    // EVENT DETAILS
    // ----------------------------
    public EventDetailsResponse getEventDetails(Long eventId) {

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        List<OrganizerDTO> organizers = new ArrayList<>();

        if (event.getOrganizers() != null) {

            event.getOrganizers().forEach(organizer -> {

                organizers.add(
                        new OrganizerDTO(
                                organizer.getName(),
                                organizer.getPhoneNumber()
                        )
                );

            });
        }

        return new EventDetailsResponse(
                event.getId(),
                event.getName(),
                event.getCenterLat(),
                event.getCenterLng(),
                event.getRadius(),
                event.getStartTime(),
                event.getEndTime(),
                organizers
        );
    }

    // ----------------------------
    // ACTIVE EVENTS (AdminHome)
    // ----------------------------
    public List<EventDetailsResponse> getActiveEvents(Long adminId) {

        LocalDateTime now = LocalDateTime.now();

        List<Event> events = eventRepository.findByAdmin_IdAndEndTimeAfter(adminId, now);

        List<EventDetailsResponse> response = new ArrayList<>();

        for (Event event : events) {

            response.add(
                    new EventDetailsResponse(
                            event.getId(),
                            event.getName(),
                            event.getCenterLat(),
                            event.getCenterLng(),
                            event.getRadius(),
                            event.getStartTime(),
                            event.getEndTime(),
                            new ArrayList<>()
                    )
            );
        }

        return response;
    }

}
