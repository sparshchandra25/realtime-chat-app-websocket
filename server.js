const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

// 🔥 store connected users (username -> ws)
let clients = new Map();

wss.on('connection', function connection(ws) {
    console.log("New client connected");

    ws.on('message', function incoming(message) {
        const data = JSON.parse(message);

        console.log('Received:', data);

        // 🟢 USER JOIN (register username)
        if (data.type === "join") {
            clients.set(data.user, ws);
            ws.username = data.user;

            broadcastUsers();
            return;
        }

        // 🟡 TYPING EVENT
        if (data.type === "typing") {
            wss.clients.forEach(client => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(data));
                }
            });
            return;
        }

        // 🔵 GLOBAL MESSAGE
        if (data.type === "message") {
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: "message",
                        user: data.user,
                        message: data.message,
                        time: new Date().toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                        })
                    }));
                }
            });
            return;
        }

        // 🔴 PRIVATE MESSAGE
        if (data.type === "private") {
            const target = clients.get(data.to);

            if (target && target.readyState === WebSocket.OPEN) {
                target.send(JSON.stringify({
                    type: "private",
                    from: data.from,
                    message: data.message,
                    time: new Date().toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                    })
                }));
            }

            // also send back to sender (so they see their own msg)
            ws.send(JSON.stringify({
                type: "private",
                from: data.from,
                message: data.message,
                time: new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                })
            }));

            return;
        }
    });

    ws.on('close', () => {
        console.log("Client disconnected");

        if (ws.username) {
            clients.delete(ws.username);
        }

        broadcastUsers();
    });
});

// 🔥 send online users list (better than just count)
function broadcastUsers() {
    const userList = Array.from(clients.keys());

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: "users",
                users: userList
            }));
        }
    });
}

server.listen(process.env.PORT || 3000, () => {
    console.log("Server running...");
});