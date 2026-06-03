const WebSocket = require('../ws_test/node_modules/ws');
const http = require('http');

function randomString() {
    return Math.random().toString(36).substring(2, 10);
}

function postIncident(callback) {
    const phone = "+91" + Math.floor(1000000000 + Math.random() * 9000000000);
    const payload = JSON.stringify({
        eventId: 999,
        name: "WS Capacity Benchmark",
        phoneNumber: phone,
        latitude: 12.9716,
        longitude: 77.5946
    });

    const startTime = Date.now();
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
            callback(null, body, Date.now() - startTime);
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

function runBenchmark(clientCount) {
    return new Promise((resolve) => {
        console.log(`\n=================== WEBSOCKET BENCHMARK FOR ${clientCount} CLIENTS ===================`);
        const clients = [];
        let connectionsAttempted = 0;
        let connectionsOpened = 0;
        let connectionsFailed = 0;
        let messageReceivedCount = 0;
        let receivedLatencies = [];
        let postTime = 0;

        // Establish connections
        for (let i = 1; i <= clientCount; i++) {
            const serverId = Math.floor(Math.random() * 1000);
            const sessionId = randomString();
            const url = `ws://localhost:8082/ws/${serverId}/${sessionId}/websocket`;
            const ws = new WebSocket(url);
            const id = i;
            let connected = false;

            ws.on('open', () => {
                // Connection established, wait for SockJS 'o' frame
            });

            ws.on('message', (data) => {
                const msg = data.toString();
                if (msg === 'o') {
                    // Send STOMP CONNECT frame
                    const connectFrame = "CONNECT\naccept-version:1.1,1.0\nheart-beat:10000,10000\n\n\u0000";
                    ws.send(JSON.stringify([connectFrame]));
                } else if (msg.startsWith('a')) {
                    try {
                        const frames = JSON.parse(msg.substring(1));
                        frames.forEach(frame => {
                            if (frame.startsWith("CONNECTED")) {
                                const subscribeFrame = `SUBSCRIBE\nid:sub-${id}\ndestination:/topic/risk-updates/999\n\n\u0000`;
                                ws.send(JSON.stringify([subscribeFrame]));
                                connected = true;
                                connectionsOpened++;
                                checkAllConnected();
                            } else if (frame.startsWith("MESSAGE")) {
                                messageReceivedCount++;
                                if (postTime > 0) {
                                    receivedLatencies.push(Date.now() - postTime);
                                }
                            }
                        });
                    } catch (e) {
                        console.error(`[Client ${id}] Frame parse error`, e);
                    }
                }
            });

            ws.on('error', (e) => {
                if (!connected) {
                    connectionsFailed++;
                    checkAllConnected();
                }
            });

            ws.on('close', () => {
                if (!connected) {
                    connectionsFailed++;
                    checkAllConnected();
                }
            });

            clients.push(ws);
        }

        // Timeout to handle connection phase
        const connectionTimeout = setTimeout(() => {
            const missing = clientCount - (connectionsOpened + connectionsFailed);
            connectionsFailed += missing;
            console.log(`Connection setup timed out. Proceeding with ${connectionsOpened} connected and ${connectionsFailed} failed.`);
            triggerUpdate();
        }, 15000);

        function checkAllConnected() {
            if (connectionsOpened + connectionsFailed === clientCount) {
                clearTimeout(connectionTimeout);
                // Brief pause to stabilize
                setTimeout(triggerUpdate, 1000);
            }
        }

        function triggerUpdate() {
            console.log(`Connections Established: ${connectionsOpened} / ${clientCount}`);
            console.log(`Connection Failures: ${connectionsFailed}`);

            // Fetch metrics BEFORE
            getMetrics((err, beforeMetrics) => {
                if (err) {
                    console.error("Failed to fetch pre-run metrics", err.message);
                }

                const telemetryActiveBefore = beforeMetrics ? beforeMetrics.websocket.activeConnections : 0;
                console.log(`Active connections reported by server telemetry: ${telemetryActiveBefore}`);

                // Record start time and Post incident
                postTime = Date.now();
                postIncident((err, res, httpTime) => {
                    if (err) {
                        console.error("Failed to post incident for WebSocket broadcast", err.message);
                        cleanup();
                        return;
                    }

                    console.log(`Incident posted successfully in ${httpTime} ms. Waiting for broadcasts...`);

                    // Wait 3 seconds for all broadcasts to complete
                    setTimeout(() => {
                        getMetrics((err, afterMetrics) => {
                            if (err) {
                                console.error("Failed to fetch post-run metrics", err.message);
                            }

                            const msgsSent = afterMetrics && beforeMetrics ? 
                                (afterMetrics.websocket.messagesBroadcast - beforeMetrics.websocket.messagesBroadcast) : 0;
                            const avgLatency = afterMetrics ? afterMetrics.websocket.avgBroadcastLatencyMs : 0;
                            const messageLoss = connectionsOpened - messageReceivedCount;
                            const successRate = connectionsOpened > 0 ? (messageReceivedCount / connectionsOpened) * 100 : 0;

                            let clientAvgLatency = 0;
                            if (receivedLatencies.length > 0) {
                                clientAvgLatency = receivedLatencies.reduce((a, b) => a + b, 0) / receivedLatencies.length;
                            }

                            console.log(`\n--- RESULTS FOR ${clientCount} CLIENTS ---`);
                            console.log(`Active Connections (Actual): ${connectionsOpened}`);
                            console.log(`Connection Failures: ${connectionsFailed}`);
                            console.log(`Telemetry Active Connections: ${afterMetrics ? afterMetrics.websocket.activeConnections : 'N/A'}`);
                            console.log(`Telemetry Messages Broadcast: ${msgsSent}`);
                            console.log(`Messages Received by Test Clients: ${messageReceivedCount}`);
                            console.log(`Message Loss: ${messageLoss < 0 ? 0 : messageLoss}`);
                            console.log(`Message Delivery Success Rate: ${successRate.toFixed(2)}%`);
                            console.log(`Telemetry Avg Broadcast Latency: ${avgLatency} ms`);
                            console.log(`Client-Side Avg Broadcast Latency: ${clientAvgLatency.toFixed(2)} ms`);

                            // Print results in a single parsable line for easier data extraction
                            console.log(`DATA_SUMMARY: clients=${clientCount} active=${connectionsOpened} failures=${connectionsFailed} received=${messageReceivedCount} loss=${messageLoss < 0 ? 0 : messageLoss} success=${successRate.toFixed(2)} telemetryLat=${avgLatency} clientLat=${clientAvgLatency.toFixed(2)}`);
                            
                            cleanup();
                        });
                    }, 3000);
                });
            });
        }

        function cleanup() {
            clients.forEach(ws => {
                try {
                    ws.close();
                } catch (e) {}
            });
            setTimeout(resolve, 1000);
        }
    });
}

async function start() {
    await runBenchmark(10);
    await runBenchmark(25);
    await runBenchmark(50);
    await runBenchmark(100);
    await runBenchmark(250);
}

start();
