// public/client.js
// Piano UI + sound + WebSocket + keyboard + chords

// 1. CHORD-SUPPORTING AUDIO
function playNote(noteName) {
  const file = `sounds/${noteName}.mp3`;
  const sound = new Audio(file);
  sound.currentTime = 0;
  sound.play().catch(() => {});
}

// 2. DOM references
const keys = document.querySelectorAll(".key");
const statusText = document.getElementById("statusText");
const activityLog = document.getElementById("activityLog");

// Activity log helper
function addActivityEntry(text, who) {
  const div = document.createElement("div");
  div.className = "activity-log-entry " + who;
  div.textContent = text;
  activityLog.appendChild(div);
  activityLog.scrollTop = activityLog.scrollHeight;
}

// Highlight keys visually
function flashKey(noteName, who) {
  const key = document.querySelector(`.key[data-note="${noteName}"]`);
  if (!key) return;

  if (who === "self") key.classList.add("self-active");
  if (who === "partner") key.classList.add("partner-active");

  setTimeout(() => {
    key.classList.remove("self-active");
    key.classList.remove("partner-active");
  }, 200);
}

// 3. WebSocket connection (fixed to localhost:3000)
const socket = new WebSocket("ws://localhost:3000");

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
      statusText.textContent = "You are alone. Open another tab to test.";
    } else if (data.count === 2) {
      statusText.textContent = "Two players connected. Start playing!";
    }
  }

  if (data.type === "note") {
    playNote(data.note);
    flashKey(data.note, "partner");
    addActivityEntry(`Partner played ${data.note}`, "partner");
  }
});

// 4. Mouse click
keys.forEach((key) => {
  key.addEventListener("click", () => {
    const noteName = key.dataset.note;

    // You play locally
    playNote(noteName);
    flashKey(noteName, "self");
    addActivityEntry(`You played ${noteName}`, "self");

    // Send to partner
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "note", note: noteName }));
    }
  });
});

// 5. Keyboard + chords
const keyToNote = {
  a: "C",
  w: "Csharp",
  s: "D",
  e: "Dsharp",
  d: "E",
  f: "F",
  t: "Fsharp",
  g: "G",
  y: "Gsharp",
  h: "A",
  u: "Asharp",
  j: "B",
};

document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  const noteName = keyToNote[key];
  if (!noteName) return;

  // You play
  playNote(noteName);
  flashKey(noteName, "self");
  addActivityEntry(`You played ${noteName}`, "self");

  // Send to partner
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "note", note: noteName }));
  }
});
