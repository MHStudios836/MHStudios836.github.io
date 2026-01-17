/* assets/js/mission-control.js - COMBINED ULTIMATE VERSION */
import { auth, db, appId } from './firebase-init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { collection, addDoc, query, where, getDocs, orderBy, serverTimestamp, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// --- DOM ELEMENTS (Preserved from your original) ---
const terminals = {
    output: document.getElementById('terminal-output'),
    idDisplay: document.getElementById('op-id-display'),
    nameDisplay: document.getElementById('op-name-display'),
    roleDisplay: document.getElementById('op-role')
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    if(terminals.output) {
        writeLog("INITIALIZING MH_HUB OS...");
        writeLog("CONNECTING TO SATELLITE UPLINK...");
    }
    
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            writeLog(`AUTHORIZED: ${user.email}`);
            await loadOperatorData(user.uid);
        } else {
            writeLog("CRITICAL: UNAUTHORIZED ACCESS DETECTED.");
        }
    });
});

// --- LOAD OPERATOR DATA ---
async function loadOperatorData(uid) {
    try {
        const userDocRef = doc(db, 'artifacts', appId, 'users', uid, 'user_profile', 'role_data');
        const snap = await getDoc(userDocRef);
        
        if(snap.exists()) {
            const data = snap.data();
            if(terminals.nameDisplay) terminals.nameDisplay.innerText = data.name || "OPERATIVE";
            if(terminals.roleDisplay) terminals.roleDisplay.innerText = data.role.toUpperCase();
            writeLog(`CLEARANCE LEVEL: ${data.role.toUpperCase()}`);
        }
    } catch (e) {
        writeLog("ERROR: SECURE DATA RETRIEVAL FAILED.");
    }
}

// ======================================================
// NEW: THE TRANSMITTER (For Student_Room.html)
// ======================================================
export async function createMission(missionData) {
    writeLog("PREPARING MISSION PACKET...");
    
    const payload = {
        ...missionData,
        created_by: auth.currentUser.uid,
        status: "OPEN",
        assigned_to: null,
        tax_rate: 0.20,
        timestamp: serverTimestamp()
    };

    try {
        const docRef = await addDoc(collection(db, 'artifacts', appId, 'missions'), payload);
        writeLog(`MISSION BROADCASTED. ID: ${docRef.id}`);
        alert(">> MISSION BROADCASTED TO GLOBAL FREQUENCIES.");
        window.location.reload();
    } catch (error) {
        writeLog("TRANSMISSION INTERRUPTED.");
        console.error(error);
    }
}

// ======================================================
// NEW: THE RECEIVER (For Broadcast_Station.html)
// ======================================================
export async function loadGlobalMissions() {
    const feed = document.getElementById('mission-feed');
    if (!feed) return;

    writeLog("SCANNING GLOBAL FREQUENCIES...");
    
    const q = query(
        collection(db, 'artifacts', appId, 'missions'), 
        where("status", "==", "OPEN"), 
        orderBy("timestamp", "desc")
    );

    const querySnapshot = await getDocs(q);
    feed.innerHTML = ''; 

    querySnapshot.forEach((doc) => {
        const m = doc.data();
        const card = `
            <div class="mission-card urgency-${m.urgency.toLowerCase()}">
                <div class="card-header">
                    <span>SECTOR: ${m.sector}</span>
                    <span style="color:#00ff00">$${m.budget}</span>
                </div>
                <h3>${m.title}</h3>
                <p>${m.description}</p>
                <button class="titan-btn titan-access" onclick="engageMission('${doc.id}')">
                    ENGAGE CONTRACT
                </button>
            </div>
        `;
        feed.innerHTML += card;
    });
}

// --- UTILS ---
function writeLog(text) {
    if(!terminals.output) return;
    const time = new Date().toLocaleTimeString('en-US', {hour12: false});
    const line = document.createElement('div');
    line.innerHTML = `<span style="color:#0080FF">[${time}]</span> ${text}`;
    terminals.output.appendChild(line);
    terminals.output.scrollTop = terminals.output.scrollHeight;
}

window.engageMission = (id) => {
    alert("LOCKING CONTRACT: " + id);
    // Integration for Phase 3 (Chat/Acceptance) goes here
};