/* assets/js/mission-control.js */
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { app } from "./firebase-init.js"; // Assuming you have your app exported here, if not, use standard init

const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'mhstudios-836'; // Your Project ID context

// --- DOM ELEMENTS ---
const terminals = {
    output: document.getElementById('terminal-output'),
    idDisplay: document.getElementById('op-id-display'),
    nameDisplay: document.getElementById('op-name-display'),
    roleDisplay: document.getElementById('op-role'),
    avatar: document.getElementById('op-avatar') // If you add an image later
};

const portals = {
    student: document.getElementById('s-portal'),
    freelancer: document.getElementById('f-portal'),
    admin: document.getElementById('a-portal')
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    writeLog("INITIALIZING MH_HUB OS...");
    writeLog("CONNECTING TO SATELLITE UPLINK...");
    
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            handleUserLogin(user);
        } else {
            writeLog("NO ACTIVE TOKEN FOUND. REDIRECTING...");
            setTimeout(() => {
                window.location.href = 'DoD_Login_Style.html';
            }, 1500);
        }
    });

    // Logout Listener
    document.getElementById('btn-logout').addEventListener('click', () => {
        writeLog("TERMINATING SESSION...");
        signOut(auth).then(() => window.location.href = 'index.html');
    });
});

// --- CORE LOGIC ---
async function handleUserLogin(user) {
    writeLog(`OPERATIVE TOKEN VERIFIED: ${user.uid.substring(0,8)}`);
    terminals.idDisplay.innerText = `ID: ${user.uid.substring(0,12)}...`;

    try {
        const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const data = userSnap.data();
            updateInterface(data);
        } else {
            writeLog("WARNING: USER DATA CORRUPTED OR MISSING.");
        }
    } catch (error) {
        console.error("Database Error:", error);
        writeLog("CRITICAL ERROR: CONNECTION SEVERED.");
    }
}

function updateInterface(userData) {
    // Update Text Data
    terminals.nameDisplay.innerText = userData.name ? userData.name.toUpperCase() : "UNKNOWN";
    terminals.roleDisplay.innerText = userData.role ? userData.role.toUpperCase() : "UNRANKED";
    
    writeLog(`PROFILE LOADED. ROLE: ${userData.role.toUpperCase()}`);

    // Unlock Sectors based on Role
    unlockSectors(userData.role);
}

function unlockSectors(role) {
    // Reset all first
    Object.values(portals).forEach(p => p.classList.add('locked'));

    // Admin Logic (God Mode)
    if (role === 'admin') {
        unlock(portals.student, "ADMIN OVERRIDE");
        unlock(portals.freelancer, "ADMIN OVERRIDE");
        unlock(portals.admin, "ROOT ACCESS");
        writeLog("ROOT ACCESS GRANTED. ALL SECTORS OPEN.");
        return;
    }

    // Student/Client Logic
    if (role === 'student' || role === 'client') {
        unlock(portals.student, "AUTHORIZED");
    }

    // Freelancer Logic
    if (role === 'freelancer') {
        unlock(portals.freelancer, "AUTHORIZED");
        // Freelancers might also need student access to view jobs?
        unlock(portals.student, "VIEW ONLY"); 
    }
}

function unlock(element, statusText) {
    if(!element) return;
    element.classList.remove('locked');
    element.classList.add('unlocked'); // For extra CSS effects
    const statusSpan = element.querySelector('.sector-status');
    if(statusSpan) {
        statusSpan.innerText = statusText;
        statusSpan.style.color = "var(--mh-green)";
        statusSpan.style.textShadow = "0 0 10px var(--mh-green)";
    }
}

// --- UTILS ---
function writeLog(text) {
    const time = new Date().toLocaleTimeString('en-US', {hour12: false});
    const line = document.createElement('div');
    line.innerHTML = `<span style="color:#666">[${time}]</span> ${text}`;
    terminals.output.appendChild(line);
    terminals.output.scrollTop = terminals.output.scrollHeight;
}

/* assets/js/mission-control.js - Update */
import { decryptEffect, logToTerminal } from './ui-terminal-fx.js';
// ... (your other imports)

// Inside your updateInterface function:
function updateInterface(userData) {
    const nameEl = document.getElementById('op-name-display');
    const roleEl = document.getElementById('op-role');
    const terminal = document.getElementById('terminal-output');

    // Use the Decrypt Effect for the Operator Name
    decryptEffect(nameEl, userData.name ? userData.name.toUpperCase() : "UNKNOWN");
    
    // Log the event to the terminal
    logToTerminal(terminal, `SECURITY CLEARANCE GRANTED: ${userData.role.toUpperCase()}`);
    logToTerminal(terminal, "UPDATING HUD INTERFACE...", "info");