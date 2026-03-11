package com.safety.womensafety.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.safety.womensafety.model.Organizer;

public interface OrganizerRepository extends JpaRepository<Organizer, Long> {
    // Additional query methods can be added here if needed
}
