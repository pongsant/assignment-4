// server.js
// Node + Express + WebSocket server for Soft Hands Mini Piano

const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve ALL files from this folder (index.html, client.js, sounds/, etc.)
app.use(express.static(__dirname));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let clients = []; // max 2 clients

wss.on("connection", (ws) => {
  console.log("Client connected");

  // allow only two clients
  if (clients.length >= 2) {
    ws.send(JSON.stringify({ type: "roomFull" }));
    ws.close();
    return;
  }

  clients.push(ws);
  updatePlayerCount();

  ws.on("message", (message) => {
    let data;
    try {
      data = JSON.parse(message.toString());
    } catch (e) {
      console.log("Invalid message:", message.toString());
      return;
    }

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

function updatePlayerCount() {
  const msg = JSON.stringify({
    type: "playerCount",
    count: clients.length,
  });

  clients.forEach((c) => {
    if (c.readyState === WebSocket.OPEN) c.send(msg);
  });
}

function broadcastToOthers(sender, data) {
  const msg = JSON.stringify(data);
  clients.forEach((client) => {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
