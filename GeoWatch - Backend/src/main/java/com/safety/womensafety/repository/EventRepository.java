package com.safety.womensafety.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.safety.womensafety.model.Event;
import java.time.LocalDateTime;
import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByStartTimeBeforeAndEndTimeAfter(LocalDateTime now1, LocalDateTime now2);
    List<Event> findByEndTimeAfter(LocalDateTime now);
    List<Event> findByAdmin_IdAndEndTimeAfter(Long adminId, LocalDateTime now);
}
