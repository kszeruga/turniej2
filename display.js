import { db, ref, onValue, serverNow } from "./firebase-common.js";

const timerEl = document.querySelector("#timer");
const timerStatusEl = document.querySelector("#timerStatus");
const messageRegion = document.querySelector("#messageRegion");
const messageText = document.querySelector("#messageText");
const connectionStatus = document.querySelector("#connectionStatus");
const timerRegion = document.querySelector(".timer-region");

let state = null;
let connected = false;

onValue(ref(db, ".info/connected"), snapshot => {
  connected = snapshot.val() === true;
  connectionStatus.textContent = connected ? "Połączono" : "Brak połączenia — oczekiwanie na synchronizację";
  connectionStatus.classList.toggle("offline", !connected);
}, () => {
  connectionStatus.textContent = "Nie można połączyć się z Firebase";
  connectionStatus.classList.add("offline");
});

onValue(ref(db, "tournament/state"), snapshot => {
  state = snapshot.val();
  if (!state) {
    timerEl.textContent = "--:--";
    timerStatusEl.textContent = "Oczekiwanie na konfigurację";
    return;
  }
  timerRegion.hidden = state.timerVisible === false;
  messageRegion.hidden = !(state.messageVisible && state.message && state.message.trim());
  messageText.textContent = state.message || "";
  renderTimer();
}, error => {
  connectionStatus.textContent = "Błąd odczytu: " + error.message;
  connectionStatus.classList.add("offline");
});

function getRemainingMs() {
  if (!state) return 0;
  if (state.running && Number.isFinite(state.endsAt)) {
    return Math.max(0, state.endsAt - serverNow());
  }
  return Math.max(0, Number(state.remainingMs) || 0);
}

function renderTimer() {
  if (!state) return;
  const totalSeconds = Math.ceil(getRemainingMs() / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  timerEl.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  if (state.running && totalSeconds > 0) {
    timerStatusEl.textContent = "ODLICZANIE";
  } else if (totalSeconds === 0) {
    timerStatusEl.textContent = "KONIEC CZASU";
  } else {
    timerStatusEl.textContent = "PAUZA";
  }
}
setInterval(renderTimer, 200);
