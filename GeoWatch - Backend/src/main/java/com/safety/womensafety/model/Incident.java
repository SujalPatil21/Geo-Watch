package com.safety.womensafety.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Incident {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long eventId;

    private String name;

    private String phoneNumber;

    private Double latitude;

    private Double longitude;

    private LocalDateTime timestamp;

    // NEW FIELD
    private boolean resolved = false;

    // NEW FIELD
    private LocalDateTime resolvedAt;
}