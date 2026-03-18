const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

// 🔥 store connected users
let users = new Set();

wss.on('connection', function connection(ws) {
    console.log("New client connected");

    users.add(ws);
    broadcastUsers();

    ws.on('message', function incoming(message) {
        const data = JSON.parse(message);

        console.log('Received:', data);

        // 🟢 TYPING EVENT
        if (data.type === "typing") {
            wss.clients.forEach(client => {
                
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(data));
                }
            });
            return;
        }

        // 🔵 NORMAL MESSAGE
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
        }
    });

    ws.on('close', () => {
        console.log("Client disconnected");
        users.delete(ws);
        broadcastUsers();
    });
});

// 🔥 send online users count
function broadcastUsers() {
    const count = users.size;

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: "users",
                count: count
            }));
        }
    });
}

server.listen(process.env.PORT || 3000, () => {
    console.log("Server running...");
});