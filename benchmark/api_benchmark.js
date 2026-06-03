import http from 'k6/http';
import { check, sleep } from 'k6';

// Retrieve config from environment variables
const vus = parseInt(__ENV.VUS || '10');
const duration = __ENV.DURATION || '60s';
const rampUp = __ENV.RAMP_UP || '15s';
const targetEventId = 999;

export const options = {
  stages: [
    { duration: rampUp, target: vus }, // Linear ramp-up
    { duration: duration, target: vus }, // Steady-state load
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'], // Success rate threshold (error rate < 5%)
  },
};

export default function () {
  // Distribute load evenly (33.3% each) or execute sequentially
  const rand = Math.random();
  const lat = 12.9716 + (Math.random() - 0.5) * 0.02;
  const lng = 77.5946 + (Math.random() - 0.5) * 0.02;

  if (rand < 0.33) {
    // 1. POST /api/incidents
    const phone = "+91" + Math.floor(1000000000 + Math.random() * 9000000000);
    const payload = JSON.stringify({
      eventId: targetEventId,
      name: "REST API Load VU-" + __VU,
      phoneNumber: phone,
      latitude: lat,
      longitude: lng,
    });
    const params = {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'PostIncident' },
    };
    const res = http.post('http://localhost:8082/api/incidents', payload, params);
    check(res, {
      'POST /api/incidents status is 200': (r) => r.status === 200,
    });
  } else if (rand < 0.66) {
    // 2. GET /api/events/nearby
    const params = {
      tags: { name: 'GetNearby' },
    };
    const res = http.get(`http://localhost:8082/api/events/nearby?lat=${lat}&lng=${lng}`, params);
    check(res, {
      'GET /api/events/nearby status is 200': (r) => r.status === 200,
    });
  } else {
    // 3. GET /api/admin/clusters/{eventId}
    const params = {
      tags: { name: 'GetClusters' },
    };
    const res = http.get(`http://localhost:8082/api/admin/clusters/${targetEventId}`, params);
    check(res, {
      'GET /api/admin/clusters status is 200': (r) => r.status === 200,
    });
  }

  // Think time: 100ms between requests per user
  sleep(0.1);
}
