package com.safety.womensafety.service;

import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@Service
public class MetricsService {

    @Autowired
    @org.springframework.context.annotation.Lazy
    private EntityManagerFactory entityManagerFactory;

    // --- API Metrics ---
    private final AtomicLong totalRequests = new AtomicLong(0);
    private final AtomicLong totalErrors = new AtomicLong(0);
    private final ConcurrentHashMap<String, EndpointMetricTracker> endpointTrackers = new ConcurrentHashMap<>();

    // --- Incident Processing Metrics ---
    private final AtomicLong totalIncidentsProcessed = new AtomicLong(0);
    private final ConcurrentLinkedQueue<Long> incidentTimestamps = new ConcurrentLinkedQueue<>();
    private final AtomicLong peakIngestionRate = new AtomicLong(0); // Max incidents in 1 min

    // --- DBSCAN Metrics ---
    private final AtomicLong totalDbscanExecutions = new AtomicLong(0);
    private final AtomicLong totalDbscanExecutionTimeMs = new AtomicLong(0);
    private final AtomicLong maxDbscanExecutionTimeMs = new AtomicLong(0);
    private final AtomicLong totalIncidentsClustered = new AtomicLong(0);
    private final AtomicLong totalClustersGenerated = new AtomicLong(0);

    // --- WebSocket Metrics ---
    private final AtomicLong activeWebSocketConnections = new AtomicLong(0);
    private final AtomicLong totalWebSocketMessagesBroadcast = new AtomicLong(0);
    private final AtomicLong totalWebSocketBroadcastLatencyMs = new AtomicLong(0);

    // --- Database Metrics ---
    private final DbQueryTracker incidentQueryTracker = new DbQueryTracker();
    private final DbQueryTracker rateLimiterQueryTracker = new DbQueryTracker();
    private final DbQueryTracker eventLookupQueryTracker = new DbQueryTracker();

    // --- Hibernate/JPA Instrumentation Metrics ---
    private final AtomicLong totalSqlQueries = new AtomicLong(0);
    private final AtomicLong slowQueryCount = new AtomicLong(0);
    private final ConcurrentLinkedQueue<SlowQuerySample> slowestQueries = new ConcurrentLinkedQueue<>();
    private final ConcurrentHashMap<String, N1Hotspot> n1Hotspots = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, AtomicLong> serviceMethodQueries = new ConcurrentHashMap<>();

    // Thread-local context for recording queries in a single request execution thread
    private static final ThreadLocal<RequestMetrics> currentRequestMetrics = ThreadLocal.withInitial(RequestMetrics::new);

    public static void startRequest() {
        currentRequestMetrics.set(new RequestMetrics());
    }

    public static RequestMetrics getRequestMetrics() {
        return currentRequestMetrics.get();
    }

    public static void clearRequest() {
        currentRequestMetrics.remove();
    }

    // ----------------------------------------------------
    // HIBERNATE / SQL INSTRUMENTATION METHODS
    // ----------------------------------------------------
    public void recordSqlQuery(String sql, long durationMs) {
        totalSqlQueries.incrementAndGet();
        if (durationMs > 100) {
            slowQueryCount.incrementAndGet();
        }
        recordSlowQuerySample(sql, durationMs);

        // Record in the current request metrics if inside a request context
        RequestMetrics req = currentRequestMetrics.get();
        if (req != null) {
            req.queryCount++;
            req.totalQueryTimeMs += durationMs;
            req.queries.add(new QueryExecution(sql, durationMs));
        }

        // Trace stack-trace to determine which service method caused the query
        String serviceMethod = "UNKNOWN";
        for (StackTraceElement element : Thread.currentThread().getStackTrace()) {
            if (element.getClassName().startsWith("com.safety.womensafety.service.")
                    && !element.getClassName().contains("MetricsService")) {
                serviceMethod = element.getClassName().substring(element.getClassName().lastIndexOf(".") + 1)
                        + "." + element.getMethodName();
                break;
            }
        }
        if (!"UNKNOWN".equals(serviceMethod)) {
            serviceMethodQueries.computeIfAbsent(serviceMethod, k -> new AtomicLong(0)).incrementAndGet();
        }
    }

    private void recordSlowQuerySample(String sql, long durationMs) {
        slowestQueries.add(new SlowQuerySample(sql, durationMs));
        List<SlowQuerySample> sorted = slowestQueries.stream()
                .sorted()
                .limit(10)
                .collect(Collectors.toList());
        slowestQueries.clear();
        slowestQueries.addAll(sorted);
    }

    public void processRequestMetrics(String endpoint, RequestMetrics req) {
        // Log SQL profile metrics against the endpoint tracker
        EndpointMetricTracker tracker = endpointTrackers.computeIfAbsent(endpoint, k -> new EndpointMetricTracker());
        tracker.recordOrmMetrics(req.queryCount, req.totalQueryTimeMs);

        // Analyze for repeated SQL patterns in this request (N+1 query detection)
        Map<String, Integer> queryCounts = new HashMap<>();
        for (QueryExecution q : req.queries) {
            queryCounts.put(q.sql, queryCounts.getOrDefault(q.sql, 0) + 1);
        }

        for (Map.Entry<String, Integer> entry : queryCounts.entrySet()) {
            String sql = entry.getKey();
            int count = entry.getValue();
            if (count > 3) {
                String key = endpoint + "::" + sql;
                String desc = "N+1 query pattern detected: " + count + " executions of this SQL statement in a single request. " +
                        "This indicates a potential loop fetching lazy associations.";
                n1Hotspots.put(key, new N1Hotspot(endpoint, sql, count, desc));
            }
        }
    }

    private Statistics getHibernateStats() {
        try {
            SessionFactory sessionFactory = entityManagerFactory.unwrap(SessionFactory.class);
            return sessionFactory.getStatistics();
        } catch (Exception e) {
            return null;
        }
    }

    // ----------------------------------------------------
    // API INSTRUMENTATION METHODS
    // ----------------------------------------------------
    public void recordApiRequest(String endpoint, long latencyMs, boolean isError) {
        totalRequests.incrementAndGet();
        if (isError) {
            totalErrors.incrementAndGet();
        }
        endpointTrackers.computeIfAbsent(endpoint, k -> new EndpointMetricTracker())
                .recordRequest(latencyMs, isError);
    }

    // ----------------------------------------------------
    // INCIDENT PROCESSING INSTRUMENTATION METHODS
    // ----------------------------------------------------
    public void recordIncidentProcessed() {
        totalIncidentsProcessed.incrementAndGet();
        long now = System.currentTimeMillis();
        incidentTimestamps.add(now);

        pruneOldIncidentTimestamps(now);
        long currentWindowSize = incidentTimestamps.size();
        peakIngestionRate.accumulateAndGet(currentWindowSize, Math::max);
    }

    private void pruneOldIncidentTimestamps(long nowTime) {
        long limit = nowTime - 60000;
        while (!incidentTimestamps.isEmpty() && incidentTimestamps.peek() < limit) {
            incidentTimestamps.poll();
        }
    }

    public double getIncidentsPerMinute() {
        pruneOldIncidentTimestamps(System.currentTimeMillis());
        return (double) incidentTimestamps.size();
    }

    // ----------------------------------------------------
    // DBSCAN INSTRUMENTATION METHODS
    // ----------------------------------------------------
    public void recordDbscanExecution(long latencyMs, int incidentCount, int clusterCount) {
        totalDbscanExecutions.incrementAndGet();
        totalDbscanExecutionTimeMs.addAndGet(latencyMs);
        maxDbscanExecutionTimeMs.accumulateAndGet(latencyMs, Math::max);
        totalIncidentsClustered.addAndGet(incidentCount);
        totalClustersGenerated.addAndGet(clusterCount);
    }

    // ----------------------------------------------------
    // WEBSOCKET INSTRUMENTATION METHODS
    // ----------------------------------------------------
    public void recordWebSocketConnection() {
        activeWebSocketConnections.incrementAndGet();
    }

    public void recordWebSocketDisconnection() {
        activeWebSocketConnections.decrementAndGet();
    }

    public void recordWebSocketBroadcast(long latencyMs) {
        totalWebSocketMessagesBroadcast.incrementAndGet();
        totalWebSocketBroadcastLatencyMs.addAndGet(latencyMs);
    }

    // ----------------------------------------------------
    // DATABASE QUERY INSTRUMENTATION METHODS
    // ----------------------------------------------------
    public void recordDbQuery(String queryType, long latencyMs) {
        switch (queryType) {
            case "IncidentQuery":
                incidentQueryTracker.recordQuery(latencyMs);
                break;
            case "RateLimiterQuery":
                rateLimiterQueryTracker.recordQuery(latencyMs);
                break;
            case "EventLookupQuery":
                eventLookupQueryTracker.recordQuery(latencyMs);
                break;
            default:
                break;
        }
    }

    // ----------------------------------------------------
    // METRICS COMPILATION
    // ----------------------------------------------------
    public Map<String, Object> compileMetrics() {
        Map<String, Object> metrics = new LinkedHashMap<>();

        // API Metrics & ORM Profiling
        Map<String, Object> apiMetrics = new LinkedHashMap<>();
        apiMetrics.put("totalRequests", totalRequests.get());
        apiMetrics.put("errorCount", totalErrors.get());

        Map<String, Object> endpointMetrics = new LinkedHashMap<>();
        for (Map.Entry<String, EndpointMetricTracker> entry : endpointTrackers.entrySet()) {
            Map<String, Object> trackerMap = new LinkedHashMap<>();
            EndpointMetricTracker tracker = entry.getValue();
            long count = tracker.count.get();
            double avgLatency = count == 0 ? 0.0 : (double) tracker.totalLatencyMs.get() / count;
            double avgSql = count == 0 ? 0.0 : (double) tracker.totalSqlCount.get() / count;
            double avgOrm = count == 0 ? 0.0 : (double) tracker.totalOrmTimeMs.get() / count;

            trackerMap.put("requests", count);
            trackerMap.put("avgLatencyMs", Math.round(avgLatency * 100.0) / 100.0);
            trackerMap.put("p95LatencyMs", tracker.calculateP95());
            trackerMap.put("errorCount", tracker.errors.get());
            trackerMap.put("avgSqlQueries", Math.round(avgSql * 100.0) / 100.0);
            trackerMap.put("maxSqlQueries", tracker.maxSqlCount.get());
            trackerMap.put("avgOrmTimeMs", Math.round(avgOrm * 100.0) / 100.0);

            // Flag potential inefficiencies
            boolean isInefficient = avgSql > 4 || tracker.maxSqlCount.get() > 10;
            trackerMap.put("potentialInefficiency", isInefficient);
            if (isInefficient) {
                trackerMap.put("inefficiencyReason", avgSql > 4 ? "High query load (potential N+1 pattern)" : "Excessive max query executions");
            }
            endpointMetrics.put(entry.getKey(), trackerMap);
        }
        apiMetrics.put("endpoints", endpointMetrics);
        metrics.put("api", apiMetrics);

        // Incident Processing Metrics
        Map<String, Object> incidentMetrics = new LinkedHashMap<>();
        incidentMetrics.put("totalProcessed", totalIncidentsProcessed.get());
        incidentMetrics.put("incidentsPerMinute", getIncidentsPerMinute());
        incidentMetrics.put("peakIngestionRate", peakIngestionRate.get());
        metrics.put("incidentProcessing", incidentMetrics);

        // DBSCAN Metrics
        Map<String, Object> dbscanMetrics = new LinkedHashMap<>();
        long dbscanCount = totalDbscanExecutions.get();
        double avgDbscanTime = dbscanCount == 0 ? 0.0 : (double) totalDbscanExecutionTimeMs.get() / dbscanCount;
        double avgIncidents = dbscanCount == 0 ? 0.0 : (double) totalIncidentsClustered.get() / dbscanCount;
        double avgClusters = dbscanCount == 0 ? 0.0 : (double) totalClustersGenerated.get() / dbscanCount;

        dbscanMetrics.put("totalExecutions", dbscanCount);
        dbscanMetrics.put("avgExecutionTimeMs", Math.round(avgDbscanTime * 100.0) / 100.0);
        dbscanMetrics.put("maxExecutionTimeMs", maxDbscanExecutionTimeMs.get());
        dbscanMetrics.put("avgIncidentsClustered", Math.round(avgIncidents * 10.0) / 10.0);
        dbscanMetrics.put("avgClustersGenerated", Math.round(avgClusters * 10.0) / 10.0);
        metrics.put("dbscan", dbscanMetrics);

        // WebSocket Metrics
        Map<String, Object> wsMetrics = new LinkedHashMap<>();
        long wsBroadcasts = totalWebSocketMessagesBroadcast.get();
        double avgWsBroadcast = wsBroadcasts == 0 ? 0.0 : (double) totalWebSocketBroadcastLatencyMs.get() / wsBroadcasts;

        wsMetrics.put("activeConnections", activeWebSocketConnections.get());
        wsMetrics.put("messagesBroadcast", wsBroadcasts);
        wsMetrics.put("avgBroadcastLatencyMs", Math.round(avgWsBroadcast * 100.0) / 100.0);
        metrics.put("websocket", wsMetrics);

        // Database Metrics
        Map<String, Object> dbMetrics = new LinkedHashMap<>();
        dbMetrics.put("incidentQuery", compileQueryTracker(incidentQueryTracker));
        dbMetrics.put("rateLimiterQuery", compileQueryTracker(rateLimiterQueryTracker));
        dbMetrics.put("eventLookupQuery", compileQueryTracker(eventLookupQueryTracker));
        metrics.put("database", dbMetrics);

        // Hibernate & ORM Metrics
        Map<String, Object> hibernateMap = new LinkedHashMap<>();

        // Session metrics (from Hibernate Statistics)
        Statistics stats = getHibernateStats();
        if (stats != null) {
            Map<String, Object> sessionStats = new LinkedHashMap<>();
            sessionStats.put("entityLoadCount", stats.getEntityLoadCount());
            sessionStats.put("entityFetchCount", stats.getEntityFetchCount());
            sessionStats.put("collectionLoadCount", stats.getCollectionLoadCount());
            sessionStats.put("collectionFetchCount", stats.getCollectionFetchCount());
            sessionStats.put("entityInsertCount", stats.getEntityInsertCount());
            sessionStats.put("entityUpdateCount", stats.getEntityUpdateCount());
            sessionStats.put("entityDeleteCount", stats.getEntityDeleteCount());
            hibernateMap.put("sessionMetrics", sessionStats);
        }

        // Query count metrics
        Map<String, Object> queryCountsMap = new LinkedHashMap<>();
        queryCountsMap.put("totalSqlQueries", totalSqlQueries.get());
        queryCountsMap.put("slowQueryCount", slowQueryCount.get());
        
        long totalReqs = totalRequests.get();
        double avgQueriesPerRequest = totalReqs == 0 ? 0.0 : (double) totalSqlQueries.get() / totalReqs;
        queryCountsMap.put("avgQueriesPerRequest", Math.round(avgQueriesPerRequest * 100.0) / 100.0);
        
        // Add service method queries
        Map<String, Long> serviceQueries = new LinkedHashMap<>();
        for (Map.Entry<String, AtomicLong> entry : serviceMethodQueries.entrySet()) {
            serviceQueries.put(entry.getKey(), entry.getValue().get());
        }
        queryCountsMap.put("serviceMethodQueries", serviceQueries);
        hibernateMap.put("queryCountMetrics", queryCountsMap);

        // Slowest queries
        List<Map<String, Object>> slowQueriesList = slowestQueries.stream()
                .map(q -> {
                    Map<String, Object> qm = new LinkedHashMap<>();
                    qm.put("sql", q.sql);
                    qm.put("durationMs", q.durationMs);
                    return qm;
                })
                .collect(Collectors.toList());
        hibernateMap.put("queryPerformanceMetrics", slowQueriesList);

        // N+1 Detection
        List<Map<String, Object>> n1List = n1Hotspots.values().stream()
                .map(h -> {
                    Map<String, Object> hm = new LinkedHashMap<>();
                    hm.put("endpoint", h.endpoint);
                    hm.put("sql", h.sql);
                    hm.put("repeatedCount", h.repeatedCount);
                    hm.put("description", h.description);
                    return hm;
                })
                .collect(Collectors.toList());
        hibernateMap.put("n1Detection", n1List);

        metrics.put("hibernate", hibernateMap);

        return metrics;
    }

    private Map<String, Object> compileQueryTracker(DbQueryTracker tracker) {
        Map<String, Object> queryMap = new LinkedHashMap<>();
        long count = tracker.count.get();
        double avgTime = count == 0 ? 0.0 : (double) tracker.totalLatencyMs.get() / count;

        queryMap.put("count", count);
        queryMap.put("avgLatencyMs", Math.round(avgTime * 100.0) / 100.0);
        queryMap.put("maxLatencyMs", tracker.maxLatencyMs.get());
        return queryMap;
    }

    // ----------------------------------------------------
    // INNER CLASSES FOR THREAD-SAFE TRACKING
    // ----------------------------------------------------
    private static class EndpointMetricTracker {
        private final AtomicLong count = new AtomicLong(0);
        private final AtomicLong errors = new AtomicLong(0);
        private final AtomicLong totalLatencyMs = new AtomicLong(0);
        private final ConcurrentLinkedQueue<Long> latencies = new ConcurrentLinkedQueue<>();
        private static final int MAX_SAMPLES = 1000;

        // ORM Specific profiling
        private final AtomicLong totalSqlCount = new AtomicLong(0);
        private final AtomicLong maxSqlCount = new AtomicLong(0);
        private final AtomicLong totalOrmTimeMs = new AtomicLong(0);

        public void recordRequest(long latencyMs, boolean isError) {
            count.incrementAndGet();
            if (isError) {
                errors.incrementAndGet();
            }
            totalLatencyMs.addAndGet(latencyMs);
            latencies.add(latencyMs);

            while (latencies.size() > MAX_SAMPLES) {
                latencies.poll();
            }
        }

        public void recordOrmMetrics(int sqlCount, long ormTimeMs) {
            totalSqlCount.addAndGet(sqlCount);
            maxSqlCount.accumulateAndGet(sqlCount, Math::max);
            totalOrmTimeMs.addAndGet(ormTimeMs);
        }

        public double calculateP95() {
            List<Long> list = new ArrayList<>(latencies);
            if (list.isEmpty()) {
                return 0.0;
            }
            Collections.sort(list);
            int index = (int) Math.ceil(0.95 * list.size()) - 1;
            index = Math.max(0, Math.min(index, list.size() - 1));
            return list.get(index);
        }
    }

    private static class DbQueryTracker {
        private final AtomicLong count = new AtomicLong(0);
        private final AtomicLong totalLatencyMs = new AtomicLong(0);
        private final AtomicLong maxLatencyMs = new AtomicLong(0);

        public void recordQuery(long latencyMs) {
            count.incrementAndGet();
            totalLatencyMs.addAndGet(latencyMs);
            maxLatencyMs.accumulateAndGet(latencyMs, Math::max);
        }
    }

    public static class RequestMetrics {
        public int queryCount = 0;
        public long totalQueryTimeMs = 0;
        public final List<QueryExecution> queries = new CopyOnWriteArrayList<>();
    }

    public static class QueryExecution {
        public final String sql;
        public final long durationMs;
        public QueryExecution(String sql, long durationMs) {
            this.sql = sql;
            this.durationMs = durationMs;
        }
    }

    public static class SlowQuerySample implements Comparable<SlowQuerySample> {
        public final String sql;
        public final long durationMs;
        public SlowQuerySample(String sql, long durationMs) {
            this.sql = sql;
            this.durationMs = durationMs;
        }
        @Override
        public int compareTo(SlowQuerySample o) {
            return Long.compare(o.durationMs, this.durationMs);
        }
    }

    public static class N1Hotspot {
        public final String endpoint;
        public final String sql;
        public final int repeatedCount;
        public final String description;
        public N1Hotspot(String endpoint, String sql, int repeatedCount, String description) {
            this.endpoint = endpoint;
            this.sql = sql;
            this.repeatedCount = repeatedCount;
            this.description = description;
        }
    }
}
