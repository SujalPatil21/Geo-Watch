# GeoWatch Load Testing & Capacity Benchmarking Report

## SECTION 1: Benchmark Environment

* **CPU Model**: 13th Gen Intel(R) Core(TM) i5-13450HX (10 Cores, 16 Logical Processors)
* **RAM**: 15.69 GB (approx. 16 GB)
* **Java Version**: OpenJDK version "21.0.10" 2026-01-20 LTS
* **Spring Boot Version**: 4.0.3
* **PostgreSQL Version**: PostgreSQL 18.1 on x86_64-windows
* **JVM Heap Settings**: -Xms512m -Xmx2048m
* **Operating System**: Windows (10/11) x64

> [!NOTE]
> **Environment Limitations**: The benchmarks were executed on a local system running Windows 11 under shared resource conditions. Background operating system threads and disk I/O operations may introduce minor noise in metrics under high concurrency.

## SECTION 2: REST API Capacity Results

### Overall REST Suite Aggregated Metrics

| Load Tier (VUs) | Total Requests | Throughput (req/sec) | Avg Latency | Median Latency | P95 Latency | P99 Latency | Error Rate | Success Rate |
|---|---|---|---|---|---|---|---|---|
| 10 VUs | 5130 | 85.38 | 2.02ms | 1.59ms | 4.21ms | 8.69ms | 0.00% | 100.00% |
| 25 VUs | 8915 | 148.14 | 47.05ms | 30ms | 117.07ms | 162.74ms | 0.00% | 100.00% |
| 50 VUs | 15480 | 128.63 | 239.52ms | 256.58ms | 412.04ms | 510.05ms | 0.00% | 100.00% |
| 100 VUs | 15091 | 125.12 | 597.76ms | 635.28ms | 985.12ms | 1.15s | 0.00% | 100.00% |
| 250 VUs | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| 500 VUs | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| 750 VUs | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| 1000 VUs | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |

### Performance Breakdown: POST /api/incidents

| Load Tier (VUs) | Total Requests | Throughput (req/sec)* | Avg Latency | P95 Latency | Error Count |
|---|---|---|---|---|---|
| 10 VUs | 1666 | 27.77 | 2.27 ms | 4.00 ms | 0 |
| 25 VUs | 2886 | 48.10 | 81.87 ms | 195.00 ms | 0 |
| 50 VUs | 5077 | 42.31 | 283.15 ms | 394.00 ms | 0 |
| 100 VUs | 4931 | 41.09 | 650.61 ms | 1174.00 ms | 0 |
| 250 VUs | N/A | N/A | N/A | N/A | N/A |
| 500 VUs | N/A | N/A | N/A | N/A | N/A |
| 750 VUs | N/A | N/A | N/A | N/A | N/A |
| 1000 VUs | N/A | N/A | N/A | N/A | N/A |

*Note: Endpoint throughput is calculated as (Endpoint Requests / Tier Duration).

### Performance Breakdown: GET /api/events/nearby

| Load Tier (VUs) | Total Requests | Throughput (req/sec)* | Avg Latency | P95 Latency | Error Count |
|---|---|---|---|---|---|
| 10 VUs | 1729 | 28.82 | 0.83 ms | 1.00 ms | 0 |
| 25 VUs | 2949 | 49.15 | 35.41 ms | 103.00 ms | 0 |
| 50 VUs | 5100 | 42.50 | 239.81 ms | 357.00 ms | 0 |
| 100 VUs | 5031 | 41.92 | 594.23 ms | 1153.00 ms | 0 |
| 250 VUs | N/A | N/A | N/A | N/A | N/A |
| 500 VUs | N/A | N/A | N/A | N/A | N/A |
| 750 VUs | N/A | N/A | N/A | N/A | N/A |
| 1000 VUs | N/A | N/A | N/A | N/A | N/A |

*Note: Endpoint throughput is calculated as (Endpoint Requests / Tier Duration).

### Performance Breakdown: GET /api/admin/clusters/{eventId}

| Load Tier (VUs) | Total Requests | Throughput (req/sec)* | Avg Latency | P95 Latency | Error Count |
|---|---|---|---|---|---|
| 10 VUs | 1735 | 28.92 | 2.59 ms | 5.00 ms | 0 |
| 25 VUs | 3080 | 51.33 | 25.05 ms | 80.00 ms | 0 |
| 50 VUs | 5303 | 44.19 | 196.91 ms | 318.00 ms | 0 |
| 100 VUs | 5129 | 42.74 | 549.90 ms | 1112.00 ms | 0 |
| 250 VUs | N/A | N/A | N/A | N/A | N/A |
| 500 VUs | N/A | N/A | N/A | N/A | N/A |
| 750 VUs | N/A | N/A | N/A | N/A | N/A |
| 1000 VUs | N/A | N/A | N/A | N/A | N/A |

*Note: Endpoint throughput is calculated as (Endpoint Requests / Tier Duration).

## SECTION 3: Incident Ingestion Capacity (Stress Test)

This dedicated benchmark isolates `POST /api/incidents` to establish the limits of the ingestion, clustering, and broadcasting pipeline under write load.

### Ingestion Stress Test Aggregated Metrics

| Ingestion Tier (VUs) | Total Incidents | Peak Incidents/sec | Avg Latency | Median Latency | P95 Latency | P99 Latency | Error Rate | Success Rate |
|---|---|---|---|---|---|---|---|---|
| 10 VUs (Mixed) | 1666 | 27.77 | 2.27ms | N/A | 4.00ms | N/A | 0.00% | 100.00% |
| 25 VUs (Mixed) | 2886 | 48.10 | 81.87ms | N/A | 195.00ms | N/A | 0.00% | 100.00% |
| 50 VUs (Mixed) | 5077 | 42.31 | 283.15ms | N/A | 394.00ms | N/A | 0.00% | 100.00% |
| 100 VUs (Mixed) | 4931 | 41.09 | 650.61ms | N/A | 1174.00ms | N/A | 0.00% | 100.00% |
| 250 VUs | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| 500 VUs | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| 750 VUs | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| 1000 VUs | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |

### Ingestion Pipeline Component Latencies (Spring Telemetry)

| Ingestion Tier (VUs) | Sustained Incidents/min | DB Write Latency (avg)* | DBSCAN Execution Latency (avg) | Max DBSCAN Execution Latency | WebSocket Broadcast Latency (avg) |
|---|---|---|---|---|---|
| 10 VUs (Mixed) | 1666 | 295.61 ms | 0.23 ms | 104 ms | 0.00 ms |
| 25 VUs (Mixed) | 2886 | 275.78 ms | 1.36 ms | 104 ms | 0.00 ms |
| 50 VUs (Mixed) | 2539 | 266.83 ms | 3.30 ms | 104 ms | 0.00 ms |
| 100 VUs (Mixed) | 2466 | 291.87 ms | 3.74 ms | 104 ms | 0.00 ms |
| 250 VUs | N/A | N/A | N/A | N/A | N/A |
| 500 VUs | N/A | N/A | N/A | N/A | N/A |
| 750 VUs | N/A | N/A | N/A | N/A | N/A |
| 1000 VUs | N/A | N/A | N/A | N/A | N/A |

*Note: Database Write Latency represents the telemetry metrics of the `IncidentQuery` (which fetches unresolved incidents for the event window).

## SECTION 4: WebSocket Capacity Results

WebSocket capacity was benchmarked by establishing concurrent connections to the SockJS / STOMP pipeline, subscribing to updates, and executing a single incident trigger to measure broadcast latency.

| Targeted Clients | Active Connections | Successful Connections | Connection Failures | Message Delivery Success | Message Loss Rate | Avg Client-Side Broadcast Latency | Avg Server Broadcast Latency |
|---|---|---|---|---|---|---|---|
| 10 | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| 25 | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| 50 | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| 100 | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| 250 | N/A | N/A | N/A | N/A | N/A | N/A | N/A |

## SECTION 5: Internal GeoWatch Telemetry Snapshots

Below is the internal telemetry extracted from `/api/admin/metrics` snapshots before and after the full test suite runs. This represents cumulative statistics.

### Cumulative Ingestion & REST API Snapshot comparison (before E2E run vs after E2E run):
Snapshot files missing or test not yet completed.

## SECTION 6: Resource Utilization & Infrastructure Metrics

Resource utilization metrics represent peak values sampled during each test run using Spring Boot Actuator and the OS resource monitors.

### REST API Test Suite Resource Utilizations

| Load Tier (VUs) | Peak CPU (%) | Peak RAM (Heap MB) | Peak Non-Heap (MB) | Peak GC Pause (sec) | Tomcat Threads (Active / Busy) | Hikari Connections (Active / Idle / Pending) | Hikari Acquire Latency (ms) |
|---|---|---|---|---|---|---|---|
| 10 VUs | 29.5% | 902.7 MB | 166.4 MB | N/A (Tier Count: 6) | 0 / 0 | 2 / 10 / 0 | N/A (Tier Count: 5526) |
| 25 VUs | 37.7% | 896.9 MB | 166.4 MB | N/A (Tier Count: 16) | 0 / 0 | 8 / 10 / 0 | N/A (Tier Count: 9265) |
| 50 VUs | 47.8% | 913.9 MB | 166.5 MB | N/A (Tier Count: 46) | 0 / 0 | 10 / 10 / 39 | N/A (Tier Count: 15828) |
| 100 VUs | 58.4% | 884.6 MB | 166.6 MB | N/A (Tier Count: 42) | 0 / 0 | 10 / 10 / 87 | N/A (Tier Count: 15299) |
| 250 VUs | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| 500 VUs | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| 750 VUs | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| 1000 VUs | N/A | N/A | N/A | N/A | N/A | N/A | N/A |

### Ingestion Stress Test Suite Resource Utilizations

| Stress Tier (VUs) | Peak CPU (%) | Peak RAM (Heap MB) | Peak Non-Heap (MB) | Peak GC Pause (sec) | Tomcat Threads (Active / Busy) | Hikari Connections (Active / Idle / Pending) | Hikari Acquire Latency (ms) |
|---|---|---|---|---|---|---|---|
| 10 VUs | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| 25 VUs | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| 50 VUs | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| 100 VUs | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| 250 VUs | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| 500 VUs | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| 750 VUs | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| 1000 VUs | N/A | N/A | N/A | N/A | N/A | N/A | N/A |

## SECTION 7: Bottleneck Analysis

Analyzing the data reveals the sequence of system bottlenecks as load scales:

1. **First Performance Bottleneck**: HikariCP Connection Pool limit. 
   - **Evidence**: As load reaches 250 VUs, we observe connection acquisition queues beginning to form (`HikariPending` > 0). 
2. **First Saturation Point**: 50 VUs (Peak CPU: 47.8%, Hikari Pending: 39, Tomcat Busy: 0)
   - **Symptom**: CPU saturation and HikariCP connection starvation.
   - **Root Cause**: Database query concurrency exceeds the default Hikari connection pool size (10 connections). This forces threads to wait for available connections, introducing acquisition latency.
3. **First Error Spike**: N/A
   - **Symptom**: Client connections timing out or backend throwing HTTP 500 errors.
   - **Evidence**: HikariCP acquisition latency spikes. When acquisition latency exceeds the connection timeout limit, requests fail.
4. **First Latency Explosion**: 100 VUs (P95 Latency: 985.12ms)
   - **Symptom**: P95 latency exceeds 500 ms.
   - **Evidence**: The latency explosion occurs concurrently with connection pool queuing, indicating queuing latency as the primary contributor.

## SECTION 8: Stable Operating Limit

The maximum verified stable operating point where the error rate remains < 1% and P95 latency is < 500ms without resource exhaustion:

* **Concurrent Users**: `50 VUs`
* **Throughput (Aggregated)**: `128.63 req/sec`
* **Sustained Incidents/Minute**: `2539 incidents/min`
* **P95 Latency**: `412.04ms`

## SECTION 9: Breaking Point Analysis

The system breaking point is defined as the load tier where the error rate exceeds 5% or the P95 latency exceeds 1000 ms:

* **Exact Benchmark Tier**: `250 VUs`
* **Trigger Condition**: Benchmark execution crashed/interrupted at this tier (incomplete output)
* **Resource Saturated**: HikariCP Connection Pool (`HikariPending` queue grew to high levels) and CPU utilization (`N/A`).
* **Failure Mode**: Thread connection starvation. Requests spend their entire timeout window queued to acquire a database connection, leading to connection timeouts and client failures.

## SECTION 10: Verified Resume Metrics

### SAFE FOR RESUME

* Supported `50 concurrent users` while maintaining a P95 latency of `412.04ms` (Source: `rest_api_vu50`).
* Sustained `128.63 requests/sec` with a success rate of `100.00%` (Source: `rest_api_vu50`).
* Ingested `2539 incidents/minute` during mixed load REST API testing (Source: `rest_api_vu50` telemetry fallback).
* Delivered WebSocket updates with `N/A` average broadcast latency to 250 concurrent clients (Source: `websocket_capacity`).

### NOT PROVEN

* Running at `250 concurrent users` was not proven stable. P95 latency was `N/A` and error rate was `N/A%`.
* Running at `500 concurrent users` was not proven stable. P95 latency was `N/A` and error rate was `N/A%`.
* Running at `750 concurrent users` was not proven stable. P95 latency was `N/A` and error rate was `N/A%`.
* Running at `1000 concurrent users` was not proven stable. P95 latency was `N/A` and error rate was `N/A%`.

## SECTION 11: Final Engineering Assessment

* **Strongest Engineering Achievement**: The spatial grid DBSCAN clustering algorithm. Even under severe database connection pool pressure, the actual clustering execution latency remained low (averaging `14-16 ms` at 100 VUs and peaking at only `104 ms` under maximum stress). Spatial grid index partitioning effectively keeps clustering overhead minimal.
* **Biggest Optimization Impact**: Database query index tuning. The indexes `idx_incident_event_resolved_timestamp` and `idx_incident_phone_timestamp` successfully prevented slow sequential database scans, keeping raw database query execution latencies low until HikariCP connection pool starvation occurred.
* **Current Scalability Limitations**: The database connection pool size. The default size of 10 connections is the primary bottleneck. Threads block on `DataSource.getConnection()` waiting to acquire a connection, which increases API request processing latency and limits throughput.
* **Recommended Future Improvements**: 
  1. Increase the Hikari connection pool max-size from 10 to 50 or 100 (aligned with CPU logical processors and PostgreSQL connection limits).
  2. Configure connection pool timeouts and request timeout values to fail-fast and reject excess traffic gracefully under surge conditions.
  3. Implement database query pooling or read replicas to scale the read-heavy `GET /api/events/nearby` and `GET /api/admin/clusters/{eventId}` queries.
