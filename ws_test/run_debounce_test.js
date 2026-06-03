const WebSocket = require('ws');
const http = require('http');

function randomString() {
    return Math.random().toString(36).substring(2, 10);
}

function postIncident(eventId, callback) {
    const phone = "+91" + Math.floor(1000000000 + Math.random() * 9000000000);
    const payload = JSON.stringify({
        eventId: eventId,
        name: "Debounce Test",
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
            callback(null, { statusCode: res.statusCode, body });
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

function connectClient(id, eventId, onMessage) {
    const serverId = Math.floor(Math.random() * 1000);
    const sessionId = randomString();
    const url = `ws://localhost:8082/ws/${serverId}/${sessionId}/websocket`;
    const ws = new WebSocket(url);

    return new Promise((resolve) => {
        ws.on('open', () => {});
        ws.on('message', (data) => {
            const msg = data.toString();
            if (msg === 'o') {
                const connectFrame = "CONNECT\naccept-version:1.1,1.0\nheart-beat:10000,10000\n\n\u0000";
                ws.send(JSON.stringify([connectFrame]));
            } else if (msg.startsWith('a')) {
                const frames = JSON.parse(msg.substring(1));
                frames.forEach(frame => {
                    if (frame.startsWith("CONNECTED")) {
                        const subscribeFrame = `SUBSCRIBE\nid:sub-${id}\ndestination:/topic/risk-updates/${eventId}\n\n\u0000`;
                        ws.send(JSON.stringify([subscribeFrame]));
                        resolve(ws);
                    } else if (frame.startsWith("MESSAGE")) {
                        onMessage(frame);
                    }
                });
            }
        });
    });
}

async function start() {
    console.log("Starting WebSocket Debouncing and Coalescing Test...");

    let clientMsgs = 0;
    const ws = await connectClient(1, 18, (frame) => {
        clientMsgs++;
        console.log(`[Client] Received broadcast update!`);
    });

    getMetrics((err, beforeMetrics) => {
        if (err) {
            console.error("Failed to fetch initial metrics", err);
            return;
        }

        const initialDbscan = beforeMetrics.dbscan.totalExecutions;
        const initialWs = beforeMetrics.websocket.messagesBroadcast;

        console.log(`Initial DBSCAN executions: ${initialDbscan}`);
        console.log(`Initial WebSocket broadcasts: ${initialWs}`);
        console.log("Firing 10 concurrent incident submissions for event 18...");

        const promises = [];
        for (let i = 0; i < 10; i++) {
            promises.push(new Promise((resolve) => {
                postIncident(18, (err, res) => {
                    resolve();
                });
            }));
        }

        Promise.all(promises).then(() => {
            console.log("All 10 incident reports submitted. Polling telemetry for async updates...");
            
            let pollCount = 0;
            const maxPolls = 30; // 15 seconds
            
            const interval = setInterval(() => {
                getMetrics((err, afterMetrics) => {
                    if (err) {
                        console.error("Poll error:", err);
                        return;
                    }

                    const dbscanDiff = afterMetrics.dbscan.totalExecutions - initialDbscan;
                    const wsDiff = afterMetrics.websocket.messagesBroadcast - initialWs;
                    
                    pollCount++;

                    if (dbscanDiff >= 1 || pollCount >= maxPolls) {
                        clearInterval(interval);
                        
                        console.log("\n--- COALESCING RESULTS ---");
                        console.log(`DBSCAN executions run: ${dbscanDiff} (Expected: 1)`);
                        console.log(`WebSocket broadcasts sent: ${wsDiff} (Expected: 1)`);
                        console.log(`WebSocket messages received by client: ${clientMsgs} (Expected: 1)`);

                        if (dbscanDiff === 1 && wsDiff === 1 && clientMsgs === 1) {
                            console.log("SUCCESS: 10 concurrent requests were successfully coalesced into exactly 1 execution!");
                        } else {
                            console.error("FAILURE: Coalescing did not group requests correctly.");
                        }

                        ws.close();
                    }
                });
            }, 500);
        });
    });
}

start();
