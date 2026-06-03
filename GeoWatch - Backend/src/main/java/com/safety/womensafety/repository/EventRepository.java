package com.safety.womensafety.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.safety.womensafety.model.Event;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;

public interface EventRepository extends JpaRepository<Event, Long> {
    @EntityGraph(attributePaths = {"organizers"})
    List<Event> findByStartTimeBeforeAndEndTimeAfter(LocalDateTime now1, LocalDateTime now2);
    List<Event> findByEndTimeAfter(LocalDateTime now);
    List<Event> findByAdmin_IdAndEndTimeAfter(Long adminId, LocalDateTime now);
}
