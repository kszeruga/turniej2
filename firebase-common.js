import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getDatabase, ref, onValue, set, update, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
export const stateRef = ref(db, "tournament/state");
let serverOffset = 0;
onValue(ref(db, ".info/serverTimeOffset"), snap => {
  serverOffset = Number(snap.val()) || 0;
});
export const serverNow = () => Date.now() + serverOffset;

export { ref, onValue, set, update, serverTimestamp };
