// public/client.js
// Handles piano UI, sounds, and WebSocket communication

// 1. Load sounds
const notes = {
    C: new Audio("sounds/C.mp3"),
    Csharp: new Audio("sounds/Csharp.mp3"),
    D: new Audio("sounds/D.mp3"),
    Dsharp: new Audio("sounds/Dsharp.mp3"),
    E: new Audio("sounds/E.mp3"),
    F: new Audio("sounds/F.mp3"),
    Fsharp: new Audio("sounds/Fsharp.mp3"),
    G: new Audio("sounds/G.mp3"),
    Gsharp: new Audio("sounds/Gsharp.mp3"),
    A: new Audio("sounds/A.mp3"),
    Asharp: new Audio("sounds/Asharp.mp3"),
    B: new Audio("sounds/B.mp3"),
  };
  
  // Restart sound from beginning and play
  function playNote(noteName) {
    const sound = notes[noteName];
    if (!sound) return;
    sound.currentTime = 0;
    sound.play().catch(() => {
      // ignore play errors (e.g. auto-play restrictions)
    });
  }
  
  // 2. DOM references
  const keys = document.querySelectorAll(".key");
  const statusText = document.getElementById("statusText");
  const activityLog = document.getElementById("activityLog");
  
  // Helper: log activity text
  function addActivityEntry(text, who) {
    const div = document.createElement("div");
    div.classList.add("activity-log-entry");
    if (who === "self") div.classList.add("self");
    if (who === "partner") div.classList.add("partner");
    div.textContent = text;
    activityLog.appendChild(div);
    activityLog.scrollTop = activityLog.scrollHeight;
  
    // Optional: limit number of entries
    const maxEntries = 40;
    while (activityLog.children.length > maxEntries) {
      activityLog.removeChild(activityLog.firstChild);
    }
  }
  
  // Helper: highlight keys
  function flashKey(noteName, who) {
    const key = document.querySelector(`.key[data-note="${noteName}"]`);
    if (!key) return;
  
    if (who === "self") {
      key.classList.add("self-active");
      setTimeout(() => key.classList.remove("self-active"), 150);
    } else if (who === "partner") {
      key.classList.add("partner-active");
      setTimeout(() => key.classList.remove("partner-active"), 150);
    }
  }
  
  // 3. WebSocket connection
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const socket = new WebSocket(`${protocol}://${window.location.host}`);
  
  socket.addEventListener("open", () => {
    statusText.textContent = "Connected. Waiting for another player...";
  });
  
  socket.addEventListener("message", (event) => {
    let data;
    try {
      data = JSON.parse(event.data);
    } catch (e) {
      console.log("Invalid message from server:", event.data);
      return;
    }
  
    if (data.type === "playerCount") {
      if (data.count === 1) {
        statusText.textContent = "You are alone. Share this link with a friend.";
      } else if (data.count === 2) {
        statusText.textContent = "Two players connected. Start playing!";
      } else if (data.count > 2) {
        statusText.textContent = "Room has extra connections.";
      }
    }
  
    if (data.type === "roomFull") {
      statusText.textContent = "Room is full. Only two players allowed.";
    }
  
    if (data.type === "note") {
      const noteName = data.note;
      playNote(noteName);
      flashKey(noteName, "partner");
      addActivityEntry(`Partner played ${noteName}`, "partner");
    }
  });
  
  socket.addEventListener("close", () => {
    statusText.textContent = "Disconnected from server.";
  });
  
  // 4. Handle clicks on keys (your notes)
  keys.forEach((key) => {
    key.addEventListener("click", () => {
      const noteName = key.getAttribute("data-note");
      if (!noteName) return;
  
      // Play locally
      playNote(noteName);
      flashKey(noteName, "self");
      addActivityEntry(`You played ${noteName}`, "self");
  
      // Send note to partner
      if (socket.readyState === WebSocket.OPEN) {
        const msg = {
          type: "note",
          note: noteName,
        };
        socket.send(JSON.stringify(msg));
      }
    });
  });
  