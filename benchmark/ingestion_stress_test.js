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
  const lat = 12.9716 + (Math.random() - 0.5) * 0.02;
  const lng = 77.5946 + (Math.random() - 0.5) * 0.02;
  const phone = "+91" + Math.floor(1000000000 + Math.random() * 9000000000);

  const payload = JSON.stringify({
    eventId: targetEventId,
    name: "Ingestion Stress VU-" + __VU,
    phoneNumber: phone,
    latitude: lat,
    longitude: lng,
  });

  const params = {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'PostIncidentStress' },
  };

  const res = http.post('http://localhost:8082/api/incidents', payload, params);

  check(res, {
    'POST /api/incidents status is 200': (r) => r.status === 200,
  });

  // Short pause to control pace: 100ms think time
  sleep(0.1);
}
