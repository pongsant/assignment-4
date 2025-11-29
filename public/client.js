// public/client.js
// Piano UI + sound + WebSocket + keyboard + chords

// 1. CHORD-SUPPORTING AUDIO FUNCTION
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

// activity log helper
function addActivityEntry(text, who) {
  const div = document.createElement("div");
  div.className = "activity-log-entry " + who;
  div.textContent = text;
  activityLog.appendChild(div);
  activityLog.scrollTop = activityLog.scrollHeight;
}

// highlight keys
function flashKey(noteName, who) {
  const key = document.querySelector(`.key[data-note="${noteName}"]`);
  if (!key) return;
  key.classList.add(who === "self" ? "self-active" : "partner-active");
  setTimeout(() => key.classList.remove("self-active", "partner-active"), 200);
}

// 3. WebSocket connection
const protocol = window.location.protocol === "https:" ? "wss" : "ws";
const socket = new WebSocket(`${protocol}://${window.location.host}`);

socket.addEventListener("open", () => {
  statusText.textContent = "Connected. Waiting for another player...";
});

socket.addEventListener("message", (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "playerCount") {
    statusText.textContent =
      data.count === 1
        ? "You are alone. Open another tab to test."
        : "Two players connected. Start playing!";
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

    playNote(noteName);
    flashKey(noteName, "self");
    addActivityEntry(`You played ${noteName}`, "self");

    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "note", note: noteName }));
    }
  });
});

// 5. KEYBOARD SUPPORT + CHORD SUPPORT
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

  playNote(noteName);
  flashKey(noteName, "self");
  addActivityEntry(`You played ${noteName}`, "self");

  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "note", note: noteName }));
  }
});
