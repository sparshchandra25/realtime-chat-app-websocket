const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws) {
    console.log("New client connected");

    ws.on('message', function incoming(message) {
        console.log('Received:', message.toString());

        // Broadcast to all clients
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message.toString());
            }
        });
    });

    ws.on('close', () => {
        console.log("Client disconnected");
    });
});

server.listen(process.env.PORT || 3000, () => {
    console.log("Server running...");
});