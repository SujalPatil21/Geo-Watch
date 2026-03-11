package com.safety.womensafety.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.safety.womensafety.model.Incident;

import java.time.LocalDateTime;
import java.util.List;

public interface IncidentRepository extends JpaRepository<Incident, Long> {

    List<Incident> findByEventIdAndTimestampAfterAndResolvedFalse(
            Long eventId,
            LocalDateTime time
    );

    List<Incident> findByPhoneNumberAndTimestampAfter(
            String phoneNumber,
            LocalDateTime timestamp
    );
}