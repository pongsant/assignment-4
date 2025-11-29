// server.js
// Node.js + Express + WebSocket server

const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve files from the "public" folder
app.use(express.static("public"));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let clients = []; // store up to 2 clients

wss.on("connection", (ws) => {
  console.log("New client connected");

  if (clients.length >= 2) {
    // Room full
    ws.send(JSON.stringify({ type: "roomFull" }));
    ws.close();
    return;
  }

  clients.push(ws);
  updatePlayerCount();

  ws.on("message", (message) => {
    // message is a Buffer, convert to string
    let data;
    try {
      data = JSON.parse(message.toString());
    } catch (e) {
      console.log("Invalid message:", message);
      return;
    }

    // Broadcast note or other events to the OTHER client
    if (data.type === "note") {
      broadcastToOthers(ws, data);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    clients = clients.filter((c) => c !== ws);
    updatePlayerCount();
  });
});

// Send updated number of players to all clients
function updatePlayerCount() {
  const msg = JSON.stringify({
    type: "playerCount",
    count: clients.length,
  });
  clients.forEach((c) => c.send(msg));
}

// Send a message to all clients except the sender
function broadcastToOthers(sender, data) {
  const msg = JSON.stringify(data);
  clients.forEach((client) => {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
