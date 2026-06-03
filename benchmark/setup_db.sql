-- Setup benchmark event
INSERT INTO event (id, name, center_lat, center_lng, radius, start_time, end_time)
VALUES (999, 'Benchmark Event', 12.9716, 77.5946, 5000, '2026-01-01 00:00:00', '2030-12-31 23:59:59')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    center_lat = EXCLUDED.center_lat,
    center_lng = EXCLUDED.center_lng,
    radius = EXCLUDED.radius,
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time;

-- Clear previous incidents to ensure clean test state
DELETE FROM incident;
