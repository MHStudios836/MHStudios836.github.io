/* assets/js/admin-ops.js */
import { db, DB_PATH } from './firebase-init.js';
import { doc, updateDoc, onSnapshot, collection, query, where } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// 1. DEFCON LOGIC
window.toggleLockdown = async (checkbox) => {
    const status = checkbox.checked;
    const sysRef = doc(db, `${DB_PATH}/system/settings`); // Ensure this doc exists!
    
    try {
        await updateDoc(sysRef, { lockdown_mode: status });
        if(status) alert("⚠️ SYSTEM LOCKED. ALL NON-ADMINS EJECTED.");
        else alert("✅ SYSTEM NORMAL. ACCESS RESTORED.");
    } catch(e) {
        console.error("DEFCON ERROR:", e);
        checkbox.checked = !status; // Revert UI if failed
        alert("COMMAND FAILED: " + e.message);
    }
};

// 2. BROADCAST LOGIC
window.fireBroadcast = async () => {
    const msg = document.getElementById('broadcast-msg').value;
    const level = document.getElementById('broadcast-level').value;
    
    if(!msg) return;

    // Use the function from admin-command-console.js if available, or direct DB write
    if(window.COMMAND) {
        window.COMMAND.broadcast(msg, 'SYSTEM', level);
        document.getElementById('broadcast-msg').value = ''; // Clear input
        alert("BROADCAST DEPLOYED.");
    } else {
        alert("COMMAND CONSOLE OFFLINE.");
    }
};

// 3. VETTING BADGE MONITOR
export function initVettingMonitor() {
    const q = query(
        collection(db, `${DB_PATH}/users`), 
        where('status', 'in', ['PENDING_INTEL', 'REVIEW_PENDING'])
    );

    onSnapshot(q, (snap) => {
        const count = snap.size;
        const badge = document.getElementById('vetting-badge');
        
        if(badge) {
            if(count > 0) {
                badge.style.display = 'inline-block';
                badge.innerText = `${count} PENDING`;
                badge.style.boxShadow = "0 0 10px var(--mh-red)";
            } else {
                badge.style.display = 'none';
            }
        }
    });
}

// Auto-start monitor
initVettingMonitor();