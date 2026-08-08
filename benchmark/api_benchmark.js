import http from 'k6/http';
import { check, sleep } from 'k6';

// ============================================================
// GeoWatch Live REST API Load Test
// ============================================================

const BASE_URL =
  __ENV.BASE_URL || 'https://geo-watch-production-c873.up.railway.app';

const vus = parseInt(__ENV.VUS || '10');
const duration = __ENV.DURATION || '60s';
const rampUp = __ENV.RAMP_UP || '15s';

const targetEventId = 999;

// ============================================================
// K6 OPTIONS
// ============================================================

export const options = {
  stages: [
    {
      duration: rampUp,
      target: vus,
    },
    {
      duration: duration,
      target: vus,
    },
  ],

  thresholds: {
    http_req_failed: ['rate<0.05'],
  },
};

// ============================================================
// MAIN TEST
// ============================================================

export default function () {

  // Random coordinates around Bangalore
  const lat =
    12.9716 + (Math.random() - 0.5) * 0.02;

  const lng =
    77.5946 + (Math.random() - 0.5) * 0.02;

  const rand = Math.random();

  // ========================================================
  // 1. POST /api/incidents
  // ========================================================

  if (rand < 0.33) {

    const phone =
      '+91' +
      Math.floor(
        1000000000 +
        Math.random() * 9000000000
      );

    // Request body
    const payload = JSON.stringify({
      eventId: targetEventId,
      name: 'REST API Load VU-' + __VU,
      phoneNumber: phone,
      latitude: lat,
      longitude: lng,
    });

    const params = {
      headers: {
        'Content-Type': 'application/json',
      },
      tags: {
        name: 'PostIncident',
      },
    };

    const res = http.post(
      `${BASE_URL}/api/incidents`,
      payload,
      params
    );

    // Print the SERVER'S response when the request fails
    if (res.status !== 200) {
      console.log(
        `POST FAILED | status=${res.status} | body=${res.body}`
      );
    }

    check(res, {
      'POST /api/incidents status is 200':
        (r) => r.status === 200,
    });

    // ========================================================
    // 2. GET /api/events/nearby
    // ========================================================

  } else if (rand < 0.66) {

    const params = {
      tags: {
        name: 'GetNearby',
      },
    };

    const res = http.get(
      `${BASE_URL}/api/events/nearby?lat=${lat}&lng=${lng}`,
      params
    );

    check(res, {
      'GET /api/events/nearby status is 200':
        (r) => r.status === 200,
    });

    // ========================================================
    // 3. GET /api/admin/clusters/{eventId}
    // ========================================================

  } else {

    const params = {
      tags: {
        name: 'GetClusters',
      },
    };

    const res = http.get(
      `${BASE_URL}/api/admin/clusters/${targetEventId}`,
      params
    );

    check(res, {
      'GET /api/admin/clusters status is 200':
        (r) => r.status === 200,
    });
  }

  // Think time
  sleep(0.1);
}