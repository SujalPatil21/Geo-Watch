const WebSocket = require('ws');
const http = require('http');

function randomString() {
    return Math.random().toString(36).substring(2, 10);
}

function postIncident(eventId, callback) {
    const phone = "+91" + Math.floor(1000000000 + Math.random() * 9000000000);
    const payload = JSON.stringify({
        eventId: eventId,
        name: "Isolation Test",
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
    console.log("Starting WebSocket Topic Isolation Test...");

    let client18Msgs = 0;
    let client19Msgs = 0;

    const ws18 = await connectClient(1, 18, (frame) => {
        client18Msgs++;
        console.log(`[Event 18 Client] Received update!`);
    });

    const ws19 = await connectClient(2, 19, (frame) => {
        client19Msgs++;
        console.log(`[Event 19 Client] Received update!`);
    });

    console.log("Subscribed Event 18 and Event 19 clients. Submitting incident for Event 18...");

    postIncident(18, (err, res) => {
        if (err) {
            console.error("POST failed", err);
            return;
        }

        setTimeout(() => {
            console.log("\n--- ISOLATION VERIFICATION RESULTS ---");
            console.log(`Event 18 Client received messages: ${client18Msgs}`);
            console.log(`Event 19 Client received messages: ${client19Msgs}`);
            
            if (client18Msgs === 1 && client19Msgs === 0) {
                console.log("SUCCESS: WebSocket channels are perfectly isolated!");
            } else {
                console.error("FAILURE: Messages leaked between topics!");
            }

            ws18.close();
            ws19.close();
        }, 1000);
    });
}

start();
