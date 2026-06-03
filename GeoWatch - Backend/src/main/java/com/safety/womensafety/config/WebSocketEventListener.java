package com.safety.womensafety.config;

import com.safety.womensafety.service.MetricsService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private final MetricsService metricsService;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectEvent event) {
        metricsService.recordWebSocketConnection();
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        metricsService.recordWebSocketDisconnection();
    }
}
