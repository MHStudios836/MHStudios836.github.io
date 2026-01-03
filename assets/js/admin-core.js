// assets/js/admin-core.js
// STATUS: SYNCED [VERSION 10.7.1]

// 1. IMPORT MASTER KEYS
import { auth, db, dbID } from './firebase-init.js';

// 2. IMPORT FIREBASE TOOLS (Updated to 10.7.1)
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { 
    doc, getDoc, collection, addDoc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// Import Sub-Modules
import { initUserGrid } from './admin-users.js';
import { initProducts } from './admin-products.js';
// import { initCharts } from './admin-charts.js'; // Uncomment if you want charts

// --- 1. SYSTEM LOGGING ---
function logSystem(msg, type='info') {
    const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
    let color = '#ddd';
    if(type === 'success') color = '#00ff41';
    if(type === 'alert') color = '#ff004c';
    
    // Safety check if terminal exists
    if($('#live-terminal').length) {
        const line = `<div class="log-entry" style="color:${color};"><span class="log-time">[${time}]</span> ${msg}</div>`;
        $('#live-terminal').prepend(line);
    } else {
        console.log(`[${type.toUpperCase()}] ${msg}`);
    }
}

// --- 2. INITIALIZATION ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        logSystem("OPERATIVE RECOGNIZED: " + user.email.toUpperCase(), 'success');
        
        // Load Sub-Systems
        initUserGrid(); // Load Users
        initProducts(); // Load Products
        
        // Reveal Interface
        $('#gatekeeper-screen').fadeOut(500);
        $('#admin-container').fadeIn(500); // Ensure this ID matches your HTML
        
    } else {
        console.log("SESSION EXPIRED.");
        window.location.href = 'DoD_Login_Style.html';
    }
});

// --- 3. MISSION CONTROL (Broadcast Logic) ---
$('#mission-form').on('submit', async (e) => {
    e.preventDefault();
    const btn = $('#mission-form button');
    btn.text("BROADCASTING...").prop('disabled', true);

    const missionData = {
        title: $('#mission-title').val(),
        budget: $('#mission-budget').val(),
        deadline: $('#mission-deadline').val(),
        type: $('#mission-type').val(),
        description: $('#mission-desc').val(),
        status: 'OPEN',
        postedBy: 'ADMIN',
        timestamp: serverTimestamp()
    };

    try {
        // USE 'dbID' to save to the correct folder
        await addDoc(collection(db, 'artifacts', dbID, 'missions'), missionData);
        logSystem("MISSION BROADCAST SUCCESSFUL.", 'success');
        alert("MISSION DEPLOYED TO FIELD OPERATIVES.");
        $('#mission-form')[0].reset();
    } catch (error) {
        console.error(error);
        logSystem("BROADCAST ERROR: " + error.message, 'alert');
        alert("ERROR: " + error.message);
    }
    btn.text("DEPLOY MISSION").prop('disabled', false);
});

// --- 4. LOGOUT ---
$('#btn-logout, #sidebar-logout').click(async () => {
    await signOut(auth);
    window.location.href = 'DoD_Login_Style.html';
});