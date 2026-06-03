const WebSocket = require('ws');
const http = require('http');

function randomString() {
    return Math.random().toString(36).substring(2, 10);
}

function postIncident(callback) {
    const phone = "+91" + Math.floor(1000000000 + Math.random() * 9000000000);
    const payload = JSON.stringify({
        eventId: 18,
        name: "WS Client Benchmark",
        phoneNumber: phone,
        latitude: 12.9716,
        longitude: 77.5946
    });

    const req = http.request({
        hostname: 'localhost',
        port: 8082,
        path: '/api/incidents',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
        }
    }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
            callback(null, body);
        });
    });

    req.on('error', (err) => callback(err));
    req.write(payload);
    req.end();
}

function getMetrics(callback) {
    http.get('http://localhost:8082/api/admin/metrics', (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
            try {
                callback(null, JSON.parse(body));
            } catch (e) {
                callback(e);
            }
        });
    }).on('error', (err) => callback(err));
}

function runBenchmark(clientCount, eventId) {
    console.log(`\n=================== BENCHMARK FOR ${clientCount} CLIENTS ===================`);
    const clients = [];
    let connectedCount = 0;
    let messageReceivedCount = 0;
    let lastPayloadSize = 0;

    return new Promise((resolve) => {
        // 1. Establish N connections
        for (let i = 1; i <= clientCount; i++) {
            const serverId = Math.floor(Math.random() * 1000);
            const sessionId = randomString();
            const url = `ws://localhost:8082/ws/${serverId}/${sessionId}/websocket`;
            const ws = new WebSocket(url);
            const id = i;

            ws.on('open', () => {
                // Handshake open, wait for 'o' frame
            });

            ws.on('message', (data) => {
                const msg = data.toString();
                if (msg === 'o') {
                    // SockJS open, send CONNECT
                    const connectFrame = "CONNECT\naccept-version:1.1,1.0\nheart-beat:10000,10000\n\n\u0000";
                    ws.send(JSON.stringify([connectFrame]));
                } else if (msg.startsWith('a')) {
                    // SockJS message array
                    try {
                        const frames = JSON.parse(msg.substring(1));
                        frames.forEach(frame => {
                            if (frame.startsWith("CONNECTED")) {
                                const subscribeFrame = `SUBSCRIBE\nid:sub-${id}\ndestination:/topic/risk-updates/${eventId}\n\n\u0000`;
                                ws.send(JSON.stringify([subscribeFrame]));
                                connectedCount++;
                                if (connectedCount === clientCount) {
                                    // Wait for server to register connections
                                    setTimeout(triggerUpdate, 500);
                                }
                            } else if (frame.startsWith("MESSAGE")) {
                                messageReceivedCount++;
                                const bodyIndex = frame.indexOf("\n\n");
                                if (bodyIndex !== -1) {
                                    const body = frame.substring(bodyIndex + 2, frame.length - 1);
                                    lastPayloadSize = Buffer.byteLength(body);
                                }
                            }
                        });
                    } catch (e) {
                        console.error("Frame parse error", e);
                    }
                }
            });

            ws.on('error', (e) => {});
            clients.push(ws);
        }

        function triggerUpdate() {
            // Get metrics BEFORE
            getMetrics((err, beforeMetrics) => {
                if (err) {
                    console.error("Failed to get before metrics", err);
                    cleanup();
                    return;
                }

                console.log(`Active connections before update: ${beforeMetrics.websocket.activeConnections}`);

                // Submit incident
                postIncident((err, res) => {
                    if (err) {
                        console.error("Failed to post incident", err);
                        cleanup();
                        return;
                    }

                    // Wait 600ms (100ms debounce + dbscan + ws execution time)
                    setTimeout(() => {
                        getMetrics((err, afterMetrics) => {
                            if (err) {
                                console.error("Failed to get after metrics", err);
                                cleanup();
                                return;
                            }

                            const msgsSent = afterMetrics.websocket.messagesBroadcast - beforeMetrics.websocket.messagesBroadcast;
                            console.log(`\n--- RESULTS ---`);
                            console.log(`Simulated Client Count: ${clientCount}`);
                            console.log(`Active Connections Count in Telemetry: ${afterMetrics.websocket.activeConnections}`);
                            console.log(`Messages Broadcast Count in Telemetry: ${msgsSent}`);
                            console.log(`Messages Received by Test Clients: ${messageReceivedCount}`);
                            console.log(`Payload Size: ${lastPayloadSize} bytes`);
                            console.log(`Avg Broadcast Latency: ${afterMetrics.websocket.avgBroadcastLatencyMs} ms`);
                            console.log(`Max Broadcast Latency: ${afterMetrics.websocket.maxBroadcastLatencyMs} ms`);
                            cleanup();
                        });
                    }, 800);
                });
            });
        }

        function cleanup() {
            clients.forEach(ws => {
                try {
                    ws.close();
                } catch (e) {}
            });
            setTimeout(resolve, 500);
        }
    });
}

async function start() {
    await runBenchmark(1, 18);
    await runBenchmark(5, 18);
    await runBenchmark(10, 18);
    await runBenchmark(25, 18);
    await runBenchmark(50, 18);
}

start();
