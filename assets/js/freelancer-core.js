// assets/js/freelancer-core.js
// STATUS: SYNCED & SECURED

// 1. IMPORT MASTER KEYS (Borrowing from firebase-init.js)
import { auth, db, dbID } from './firebase-init.js';

// 2. IMPORT FIREBASE TOOLS
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { 
    collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

let currentUser = null;

// 3. SECURITY & DASHBOARD LOADER
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        console.log("MERCENARY ACTIVE: " + user.email);
        
        // Update Name
        $('#freelancer-name').text(user.displayName || "Contractor");
        
        // Start Job Feeds
        loadJobBoard();     // Available Jobs
        loadMyActiveJobs(); // My Current Jobs
    } else {
        console.log("NO USER. REDIRECTING...");
        window.location.href = 'DoD_Login_Style.html';
    }
});

// 4. LOAD "OPEN" JOBS (The Public Board)
function loadJobBoard() {
    // Query: Show me missions that are OPEN
    const q = query(
        collection(db, 'artifacts', dbID, 'missions'),
        where("status", "==", "OPEN")
    );

    onSnapshot(q, (snap) => {
        $('#available-jobs-count').text(snap.size);
        const list = $('#job-board-list'); // Make sure you have this ID in HTML
        
        if(list.length) {
            list.empty();
            snap.forEach(docSnap => {
                const m = docSnap.data();
                const id = docSnap.id;

                list.append(`
                    <div class="job-card" style="border:1px solid #333; padding:15px; margin-bottom:10px; border-radius:5px; background:rgba(0,0,0,0.5);">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <h4 style="color:var(--mh-gold); margin:0;">${m.title}</h4>
                            <span style="background:#333; padding:2px 8px; font-size:0.7em;">${m.budget}</span>
                        </div>
                        <p style="color:#aaa; font-size:0.9em; margin:5px 0;">${m.description}</p>
                        <button onclick="window.acceptMission('${id}')" style="width:100%; background:var(--mh-blue); border:none; color:white; padding:8px; cursor:pointer; margin-top:10px;">
                            ACCEPT CONTRACT
                        </button>
                    </div>
                `);
            });
        }
    });
}

// 5. LOAD "MY" JOBS (Active Contracts)
function loadMyActiveJobs() {
    if(!currentUser) return;

    // Query: Show missions where I am the freelancer AND status is IN_PROGRESS
    const q = query(
        collection(db, 'artifacts', dbID, 'missions'),
        where("freelancerId", "==", currentUser.uid),
        where("status", "==", "IN_PROGRESS")
    );

    onSnapshot(q, (snap) => {
        const list = $('#my-active-list'); // Make sure you have this ID in HTML
        if(list.length) {
            list.empty();
            snap.forEach(docSnap => {
                const m = docSnap.data();
                const id = docSnap.id;

                list.append(`
                    <div class="job-card" style="border-left:3px solid var(--mh-orange); padding:15px; margin-bottom:10px; background:rgba(255,174,0,0.05);">
                        <h4 style="margin:0;">${m.title}</h4>
                        <div style="font-size:0.8em; color:#aaa;">Client: ${m.ownerName}</div>
                        <button onclick="window.markComplete('${id}')" style="margin-top:10px; background:var(--mh-green); color:#000; border:none; padding:5px 15px; cursor:pointer;">
                            MARK COMPLETE
                        </button>
                    </div>
                `);
            });
        }
    });
}

// 6. GLOBAL ACTIONS (Attach to window for button clicks)
window.acceptMission = async (missionId) => {
    if(!confirm("Confirm Contract Acceptance? This binds you to the mission.")) return;
    try {
        const missionRef = doc(db, 'artifacts', dbID, 'missions', missionId);
        await updateDoc(missionRef, {
            status: "IN_PROGRESS",
            freelancerId: currentUser.uid,
            freelancerName: currentUser.displayName || "Unknown",
            startDate: serverTimestamp()
        });
        alert("CONTRACT SECURED. Mission moved to 'Active' tab.");
    } catch(e) { 
        console.error(e);
        alert("ERROR: " + e.message); 
    }
};

window.markComplete = async (missionId) => {
    if(!confirm("Confirm Mission Completion? Client will be notified.")) return;
    try {
        const missionRef = doc(db, 'artifacts', dbID, 'missions', missionId);
        await updateDoc(missionRef, {
            status: "COMPLETED",
            completedDate: serverTimestamp()
        });
        alert("MISSION ACCOMPLISHED. Payment pending verification.");
    } catch(e) { 
        console.error(e);
        alert("ERROR: " + e.message); 
    }
};

// 7. LOGOUT
$('#sidebar-logout, #menu-logout').click(async () => {
    await signOut(auth);
    window.location.href = 'DoD_Login_Style.html';
});