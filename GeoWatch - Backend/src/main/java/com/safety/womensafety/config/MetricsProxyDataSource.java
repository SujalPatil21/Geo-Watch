package com.safety.womensafety.config;

import com.safety.womensafety.service.MetricsService;

import javax.sql.DataSource;
import java.lang.reflect.Proxy;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.concurrent.TimeUnit;

public class MetricsProxyDataSource {

    public static DataSource wrap(DataSource originalDataSource, MetricsService metricsService) {
        return (DataSource) Proxy.newProxyInstance(
                MetricsProxyDataSource.class.getClassLoader(),
                new Class[]{DataSource.class},
                (proxy, method, args) -> {
                    if ("unwrap".equals(method.getName()) && args.length > 0 && args[0] instanceof Class) {
                        Class<?> iface = (Class<?>) args[0];
                        if (iface.isInstance(proxy)) {
                            return proxy;
                        }
                    }
                    if ("isWrapperFor".equals(method.getName()) && args.length > 0 && args[0] instanceof Class) {
                        Class<?> iface = (Class<?>) args[0];
                        if (iface.isInstance(proxy)) {
                            return true;
                        }
                    }

                    Object result = method.invoke(originalDataSource, args);
                    if ("getConnection".equals(method.getName()) && result instanceof Connection) {
                        return wrapConnection((Connection) result, metricsService);
                    }
                    return result;
                }
        );
    }

    private static Connection wrapConnection(Connection originalConnection, MetricsService metricsService) {
        return (Connection) Proxy.newProxyInstance(
                MetricsProxyDataSource.class.getClassLoader(),
                new Class[]{Connection.class},
                (proxy, method, args) -> {
                    if ("unwrap".equals(method.getName()) && args.length > 0 && args[0] instanceof Class) {
                        Class<?> iface = (Class<?>) args[0];
                        if (iface.isInstance(proxy)) {
                            return proxy;
                        }
                    }
                    if ("isWrapperFor".equals(method.getName()) && args.length > 0 && args[0] instanceof Class) {
                        Class<?> iface = (Class<?>) args[0];
                        if (iface.isInstance(proxy)) {
                            return true;
                        }
                    }

                    Object result = method.invoke(originalConnection, args);
                    if (("prepareStatement".equals(method.getName()) || "createStatement".equals(method.getName())) && result != null) {
                        String sql = (args.length > 0 && args[0] instanceof String) ? (String) args[0] : null;
                        return wrapStatement(result, sql, metricsService);
                    }
                    return result;
                }
        );
    }

    private static Object wrapStatement(Object originalStatement, String sql, MetricsService metricsService) {
        Class<?>[] interfaces;
        if (originalStatement instanceof PreparedStatement) {
            interfaces = new Class[]{PreparedStatement.class, Statement.class};
        } else {
            interfaces = new Class[]{Statement.class};
        }

        return Proxy.newProxyInstance(
                MetricsProxyDataSource.class.getClassLoader(),
                interfaces,
                (proxy, method, args) -> {
                    if ("unwrap".equals(method.getName()) && args.length > 0 && args[0] instanceof Class) {
                        Class<?> iface = (Class<?>) args[0];
                        if (iface.isInstance(proxy)) {
                            return proxy;
                        }
                    }
                    if ("isWrapperFor".equals(method.getName()) && args.length > 0 && args[0] instanceof Class) {
                        Class<?> iface = (Class<?>) args[0];
                        if (iface.isInstance(proxy)) {
                            return true;
                        }
                    }

                    if (method.getName().startsWith("execute") || method.getName().startsWith("addBatch")) {
                        String executionSql = sql;
                        if (executionSql == null && args.length > 0 && args[0] instanceof String) {
                            executionSql = (String) args[0];
                        }

                        long start = System.nanoTime();
                        try {
                            return method.invoke(originalStatement, args);
                        } finally {
                            long durationMs = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - start);
                            metricsService.recordSqlQuery(executionSql != null ? executionSql : "UNKNOWN SQL", durationMs);
                        }
                    }
                    return method.invoke(originalStatement, args);
                }
        );
    }
}
