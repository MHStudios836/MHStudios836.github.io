/* assets/js/mission-control.js - ADMIN GOD MODE */
import { auth, db } from './firebase-init.js'; // Ensure path is correct
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { collection, onSnapshot, doc, updateDoc, getDoc, orderBy, query } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// --- DOM ELEMENTS ---
const terminals = {
    output: document.getElementById('terminal-output'), // For system logs
    feed: document.getElementById('mission-radar-feed') || document.querySelector('.mission-feed') // Where missions appear
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    writeLog("INITIALIZING TITAN OVERSIGHT PROTOCOL...");
    
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // 1. SECURITY CHECK: Are you actually the Admin?
            const userProfile = await getDoc(doc(db, "users", user.uid));
            const userData = userProfile.data();

            if (userData && userData.role === "admin") {
                writeLog(`COMMANDER RECOGNIZED: ${user.email}`);
                writeLog("ESTABLISHING GLOBAL SATELLITE UPLINK...");
                initGodModeRadar();
            } else {
                // IMMEDIATE LOCKOUT
                document.body.innerHTML = "<h1 style='color:red; text-align:center; margin-top:20%'>ACCESS DENIED // INCIDENT LOGGED</h1>";
                setTimeout(() => window.location.href = "DoD_Login_Style.html", 2000);
            }
        } else {
            window.location.href = "DoD_Login_Style.html";
        }
    });
});

// --- GOD MODE RADAR (Real-Time Surveillance) ---
function initGodModeRadar() {
    // Unlike Freelancers, we do NOT filter by 'OPEN'. We want EVERYTHING.
    const q = query(collection(db, "missions"), orderBy("timestamp", "desc"));

    onSnapshot(q, (snapshot) => {
        const feed = document.getElementById('mission-radar-feed'); // Make sure this ID exists in your HTML
        if(!feed) return; 
        
        feed.innerHTML = ''; // Clear scan

        snapshot.forEach((docSnap) => {
            const m = docSnap.data();
            const missionId = docSnap.id;
            
            // TAX CALCULATION (Your 20% Cut)
            const budget = parseFloat(m.budget) || 0;
            const adminCut = (budget * 0.20).toFixed(2);
            
            // STATUS COLOR CODING
            let statusColor = "#00ff41"; // Green (Open)
            if (m.status === "ACTIVE") statusColor = "#ffff00"; // Yellow
            if (m.status === "DISPUTE") statusColor = "#ff0000"; // Red
            if (m.status === "ABORTED") statusColor = "#555"; // Grey

            const card = `
                <div class="mission-card" style="border-left: 4px solid ${statusColor}; margin-bottom: 10px; padding: 10px; background: rgba(0,0,0,0.5);">
                    <div style="display:flex; justify-content:space-between;">
                        <span style="color:${statusColor}">[${m.status}]</span>
                        <span style="color:#00e5ff">ID: ${missionId.substring(0,6)}</span>
                    </div>
                    
                    <h3 style="margin: 5px 0;">${m.title}</h3>
                    
                    <div style="font-size: 0.9em; color: #aaa;">
                        CLIENT: ${m.client_email} <br>
                        MERC: ${m.freelancer_email || "NONE"}
                    </div>
                    
                    <div style="margin-top: 10px; border-top: 1px solid #333; padding-top: 5px;">
                        <span style="color: white;">Budget: $${budget}</span> | 
                        <span style="color: #00ff41; font-weight:bold;">TAX: +$${adminCut}</span>
                    </div>

                    <div style="margin-top: 10px; display:flex; gap: 10px;">
                        <button class="titan-btn" onclick="spyOnChat('${m.chat_id}')" style="background:rgba(0,128,255,0.3); color:white; border:1px solid #0080FF;">
                            <i class="fas fa-eye"></i> INTERCEPT
                        </button>
                        
                        <button class="titan-btn" onclick="forceAbort('${missionId}')" style="background:rgba(255,0,0,0.2); color:red; border:1px solid red;">
                            <i class="fas fa-ban"></i> TERMINATE
                        </button>
                    </div>
                </div>
            `;
            feed.innerHTML += card;
        });
    });
}

// --- GLOBAL FUNCTIONS (Must be attached to window to work in HTML onclick) ---

window.spyOnChat = function(chatId) {
    if (!chatId) {
        alert("SYSTEM ERROR: No Comms Channel Established for this Mission.");
        return;
    }
    // This launches the Interceptor
    // We will create 'Admin_Interceptor.html' later for this purpose
    const width = 600;
    const height = 800;
    const left = (screen.width/2)-(width/2);
    const top = (screen.height/2)-(height/2);
    window.open(`Admin_Interceptor.html?chat_id=${chatId}`, 'TitanIntercept', `width=${width},height=${height},top=${top},left=${left}`);
};

window.forceAbort = async function(missionId) {
    const confirmAction = confirm("WARNING: You are about to forcibly terminate this operation. This action is logged. Proceed?");
    if (confirmAction) {
        await updateDoc(doc(db, "missions", missionId), {
            status: "ABORTED_BY_ADMIN",
            aborted_at: new Date()
        });
        writeLog(`MISSION ${missionId} TERMINATED BY COMMAND.`);
    }
};

function writeLog(text) {
    const output = document.getElementById('terminal-output');
    if(!output) return;
    const time = new Date().toLocaleTimeString('en-US', {hour12: false});
    const line = document.createElement('div');
    line.innerHTML = `<span style="color:#0080FF">[${time}]</span> ${text}`;
    output.prepend(line);
}