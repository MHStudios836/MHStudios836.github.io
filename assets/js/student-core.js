// assets/js/student-core.js
// STATUS: SYNCED & SECURED

// 1. IMPORT MASTER KEYS (Borrowing from firebase-init.js)
import { auth, db, dbID } from './firebase-init.js';

// 2. IMPORT FIREBASE TOOLS
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    collection, addDoc, query, where, onSnapshot, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentUser = null;

// 3. SECURITY & DASHBOARD LOADER
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        console.log("STUDENT CONFIRMED: " + user.email);
        
        // Update Name on Screen
        $('#student-name').text(user.displayName || "Operative");
        
        // Load THEIR Missions
        loadStudentMissions(user);
    } else {
        console.log("NO USER. REDIRECTING...");
        window.location.href = 'DoD_Login_Style.html';
    }
});

// 4. LOAD MISSIONS FUNCTION
function loadStudentMissions(user) {
    const q = query(
        collection(db, 'artifacts', dbID, 'missions'), 
        where("ownerId", "==", user.uid)
    );

    onSnapshot(q, (snap) => {
        // Update the "Active Count" number
        $('#active-count').text(snap.size); 
        
        const list = $('#active-projects-list');
        list.empty();
        
        snap.forEach(doc => {
            const m = doc.data();
            
            // Status Color Logic
            let color = 'var(--mh-cyan)';
            if(m.status === 'IN_PROGRESS') color = 'var(--mh-orange)';
            if(m.status === 'COMPLETED') color = 'var(--mh-green)';

            list.append(`
                <div class="project-card" style="border-left: 3px solid ${color}; background:rgba(255,255,255,0.05); padding:15px; margin-bottom:10px;">
                    <div style="display:flex; justify-content:space-between;">
                        <h4 style="margin:0;">${m.title}</h4>
                        <span style="color:${color}; font-weight:bold; font-size:0.8em;">${m.status}</span>
                    </div>
                    <div style="font-size:0.8em; color:#aaa; margin-top:5px;">
                        ${m.type} | Budget: ${m.budget}
                    </div>
                </div>
            `);
        });
    });
}

// 5. DEPLOY NEW MISSION (Form Handler)
$('#student-mission-form').on('submit', async (e) => {
    e.preventDefault();
    const btn = $(e.target).find('button');
    btn.text("TRANSMITTING...").prop('disabled', true);

    try {
        if(!currentUser) throw new Error("Authentication Lost.");

        await addDoc(collection(db, 'artifacts', dbID, 'missions'), {
            title: $('#req-title').val(),
            budget: $('#req-budget').val(),
            deadline: $('#req-deadline').val(),
            type: $('#req-type').val(),
            description: $('#req-desc').val(),
            status: 'OPEN',
            ownerId: currentUser.uid,
            ownerName: currentUser.displayName || "Unknown Client",
            timestamp: serverTimestamp()
        });

        alert("MISSION UPLOADED TO HQ.");
        e.target.reset(); // Clear the form
        
    } catch (err) {
        console.error(err);
        alert("ERROR: " + err.message);
    }
    btn.text("TRANSMIT REQUEST").prop('disabled', false);
});

// 6. LOGOUT
$('#sidebar-logout, #menu-logout').click(async () => {
    await signOut(auth);
    window.location.href = 'DoD_Login_Style.html';
});