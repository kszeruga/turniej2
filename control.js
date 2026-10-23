import { db, auth, stateRef, ref, onValue, set, update, serverTimestamp } from "./firebase-common.js";
import {
  signInWithEmailAndPassword, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

const $ = id => document.getElementById(id);
const loginPanel = $("loginPanel");
const controlPanel = $("controlPanel");
const loginError = $("loginError");
const actionStatus = $("actionStatus");
let state = null;
let stopStateListener = null;

function say(message, isError = false) {
  actionStatus.textContent = message;
  actionStatus.classList.toggle("error", isError);
}

$("loginForm").addEventListener("submit", async event => {
  event.preventDefault();
  loginError.textContent = "";
  try {
    await signInWithEmailAndPassword(auth, $("email").value.trim(), $("password").value);
  } catch (error) {
    loginError.textContent = readableAuthError(error);
  }
});

$("logoutButton").addEventListener("click", () => signOut(auth));

onAuthStateChanged(auth, async user => {
  loginPanel.hidden = !!user;
  controlPanel.hidden = !user;
  if (!user) {
    if (stopStateListener) stopStateListener();
    stopStateListener = null;
    state = null;
    return;
  }
  $("signedInAs").textContent = user.email || "Zalogowano";
  if (stopStateListener) stopStateListener();
  stopStateListener = onValue(stateRef, snapshot => {
    state = snapshot.val();
    if (!state) {
      state = defaultState();
      say("Brak stanu — ustaw czas i zapisz, aby zainicjować turniej.");
    }
    syncFormFromState();
    renderPreview();
  }, error => say("Nie udało się odczytać stanu: " + error.message, true));
});

function defaultState() {
  return {
    durationMs: 300000,
    remainingMs: 300000,
    endsAt: null,
    running: false,
    message: "",
    messageVisible: false,
    timerVisible: true,
    updatedAt: Date.now()
  };
}

function syncFormFromState() {
  const duration = Math.max(0, Number(state.durationMs) || 0) / 1000;
  $("durationMinutes").value = Math.floor(duration / 60);
  $("durationSeconds").value = Math.floor(duration % 60);
  $("messageInput").value = state.message || "";
  $("messageVisible").checked = !!state.messageVisible;
  $("timerVisible").checked = state.timerVisible !== false;
}

function remainingMs() {
  if (!state) return 0;
  if (state.running && Number.isFinite(state.endsAt)) return Math.max(0, state.endsAt - Date.now());
  return Math.max(0, Number(state.remainingMs) || 0);
}

function renderPreview() {
  const secondsTotal = Math.ceil(remainingMs() / 1000);
  $("timerPreview").textContent = `${String(Math.floor(secondsTotal / 60)).padStart(2, "0")}:${String(secondsTotal % 60).padStart(2, "0")}`;
}
setInterval(renderPreview, 200);

async function savePatch(patch, message = "Zapisano.") {
  try {
    await update(stateRef, { ...patch, updatedAt: serverTimestamp() });
    say(message);
  } catch (error) {
    say("Nie udało się zapisać: " + error.message, true);
  }
}

$("durationForm").addEventListener("submit", async event => {
  event.preventDefault();
  const minutes = Number($("durationMinutes").value);
  const seconds = Number($("durationSeconds").value);
  if (!Number.isInteger(minutes) || minutes < 0 || minutes > 999 ||
      !Number.isInteger(seconds) || seconds < 0 || seconds > 59 ||
      (minutes === 0 && seconds === 0)) {
    say("Podaj czas większy od zera (sekundy 0–59).", true);
    return;
  }
  const durationMs = (minutes * 60 + seconds) * 1000;
  await savePatch({
    durationMs,
    remainingMs: durationMs,
    endsAt: null,
    running: false
  }, "Ustawiono nowy czas i zatrzymano timer.");
});

$("startButton").addEventListener("click", async () => {
  if (!state) return;
  const remaining = remainingMs();
  if (remaining <= 0) {
    say("Timer doszedł do zera. Ustaw czas lub użyj Reset.", true);
    return;
  }
  await savePatch({
    remainingMs: remaining,
    endsAt: Date.now() + remaining,
    running: true
  }, "Timer uruchomiony.");
});

$("pauseButton").addEventListener("click", async () => {
  if (!state) return;
  await savePatch({
    remainingMs: remainingMs(),
    endsAt: null,
    running: false
  }, "Timer zatrzymany.");
});

$("resetButton").addEventListener("click", async () => {
  if (!state) return;
  const durationMs = Math.max(1000, Number(state.durationMs) || 300000);
  await savePatch({
    remainingMs: durationMs,
    endsAt: null,
    running: false
  }, "Timer zresetowany do ustawionego czasu.");
});

$("messageForm").addEventListener("submit", async event => {
  event.preventDefault();
  await savePatch({
    message: $("messageInput").value,
    messageVisible: $("messageVisible").checked
  }, "Zapisano komunikat.");
});

$("saveVisibilityButton").addEventListener("click", async () => {
  await savePatch({ timerVisible: $("timerVisible").checked }, "Zapisano widoczność timera.");
});

function readableAuthError(error) {
  const code = error?.code || "";
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) {
    return "Nieprawidłowy e-mail lub hasło.";
  }
  if (code.includes("too-many-requests")) return "Za dużo prób. Spróbuj później.";
  if (code.includes("unauthorized-domain")) return "Ta domena nie jest dozwolona w Firebase Authentication.";
  return "Logowanie nie powiodło się: " + (error.message || code);
}
