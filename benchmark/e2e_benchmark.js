import http from 'k6/http';
import { check, sleep } from 'k6';

// Fixed configuration for 100 VUs E2E scenario
const vus = 100;
const rampUp = '30s';
const duration = '90s';
const targetEventId = 999;

export const options = {
  stages: [
    { duration: rampUp, target: vus }, // Ramp up to 100 users
    { duration: duration, target: vus }, // Hold for remaining duration
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'], // Success rate threshold (error rate < 5%)
  },
};

export default function () {
  const rand = Math.random();
  const lat = 12.9716 + (Math.random() - 0.5) * 0.02;
  const lng = 77.5946 + (Math.random() - 0.5) * 0.02;

  if (rand < 0.70) {
    // 70% Incident Submissions
    const phone = "+91" + Math.floor(1000000000 + Math.random() * 9000000000);
    const payload = JSON.stringify({
      eventId: targetEventId,
      name: "E2E Mix User VU-" + __VU,
      phoneNumber: phone,
      latitude: lat,
      longitude: lng,
    });
    const params = {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'E2E_PostIncident' },
    };
    const res = http.post('http://localhost:8082/api/incidents', payload, params);
    check(res, {
      'E2E POST /api/incidents status is 200': (r) => r.status === 200,
    });
  } else if (rand < 0.90) {
    // 20% Nearby Event Requests
    const params = {
      tags: { name: 'E2E_GetNearby' },
    };
    const res = http.get(`http://localhost:8082/api/events/nearby?lat=${lat}&lng=${lng}`, params);
    check(res, {
      'E2E GET /api/events/nearby status is 200': (r) => r.status === 200,
    });
  } else {
    // 10% Cluster Dashboard Requests
    const params = {
      tags: { name: 'E2E_GetClusters' },
    };
    const res = http.get(`http://localhost:8082/api/admin/clusters/${targetEventId}`, params);
    check(res, {
      'E2E GET /api/admin/clusters status is 200': (r) => r.status === 200,
    });
  }

  // Think time: 100ms
  sleep(0.1);
}
