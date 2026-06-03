package com.safety.womensafety.config;

import com.safety.womensafety.service.MetricsService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.HandlerMapping;

@Component
@RequiredArgsConstructor
public class MetricsInterceptor implements HandlerInterceptor {

    private final MetricsService metricsService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        request.setAttribute("metricStartTime", System.currentTimeMillis());
        MetricsService.startRequest();
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        Long startTime = (Long) request.getAttribute("metricStartTime");
        long latencyMs = startTime == null ? 0 : (System.currentTimeMillis() - startTime);

        String pattern = (String) request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
        if (pattern == null) {
            pattern = request.getRequestURI();
        }

        String method = request.getMethod();
        String endpoint = method + " " + pattern;

        // An error occurred if exception was thrown or status code is 4xx/5xx
        boolean isError = (ex != null) || (response.getStatus() >= 400);

        MetricsService.RequestMetrics req = MetricsService.getRequestMetrics();
        if (req != null) {
            metricsService.processRequestMetrics(endpoint, req);
        }
        MetricsService.clearRequest();

        metricsService.recordApiRequest(endpoint, latencyMs, isError);
    }
}
