// server.js
// Node.js + Express + WebSocket server for Soft Hands Mini Piano

const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();

// Use port 4000 to avoid conflicts
const PORT = process.env.PORT || 4000;

// Serve files from the "public" folder
app.use(express.static("public"));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let clients = []; // store up to 2 clients max

wss.on("connection", (ws) => {
  console.log("New client connected");

  // limit room to 2 clients
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
      console.log("Invalid message from client:", message.toString());
      return;
    }

    // only handle "note" messages for now
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

// send how many players are connected
function updatePlayerCount() {
  const msg = JSON.stringify({
    type: "playerCount",
    count: clients.length,
  });

  clients.forEach((c) => {
    if (c.readyState === WebSocket.OPEN) {
      c.send(msg);
    }
  });
}

// send a message to all clients except the sender
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
