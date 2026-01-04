/* assets/js/session-monitor.js */
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { app } from "./firebase-init.js";
import { notify } from "./notification-hub.js";
import { playSound } from "./sound-engine.js";

const auth = getAuth(app);

// CONFIGURATION (Adjust times as needed)
const INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 Minutes until logout
const WARNING_THRESHOLD = 8 * 60 * 1000; // 8 Minutes until warning shows

let lastActivity = Date.now();
let warningTriggered = false;

/**
 * INITIALIZE MONITOR
 */
export function startSessionMonitor() {
    // Events to watch for activity
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];

    activityEvents.forEach(event => {
        document.addEventListener(event, resetTimer, true);
    });

    // Run the check every 30 seconds
    setInterval(checkSession, 30000);
    
    console.log("SESSION MONITOR: ACTIVE // UPLINK SECURE");
}

function resetTimer() {
    lastActivity = Date.now();
    
    // If they were warned and then moved, clear the warning state
    if (warningTriggered) {
        warningTriggered = false;
        notify("Security", "Session Re-established. Welcome back.", "success", 3000);
    }
}

function checkSession() {
    const elapsed = Date.now() - lastActivity;

    // Phase 1: Warning
    if (elapsed > WARNING_THRESHOLD && !warningTriggered) {
        warningTriggered = true;
        playSound('notify'); // Or use a 'warn' sound if you have one
        notify("Security Alert", "Terminal inactivity detected. Automatic logout in 2 minutes.", "warn", 10000);
    }

    // Phase 2: Forced Logout
    if (elapsed > INACTIVITY_LIMIT) {
        console.warn("SESSION EXPIRED. FORCING LOGOUT.");
        terminateSession();
    }
}

async function terminateSession() {
    try {
        await signOut(auth);
        // Direct jump to login with a reason code
        window.location.href = 'DoD_Login_Style.html?reason=timeout';
    } catch (error) {
        console.error("LOGOUT FAILURE:", error);
        window.location.reload(); // Fallback
    }
}