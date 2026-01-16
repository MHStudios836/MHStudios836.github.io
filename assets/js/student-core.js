// assets/js/student-core.js
// STATUS: OPTIMIZED FOR TITAN V2 & PROTOCOL PHANTOM

import { auth, db, dbID } from './firebase-init.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { 
    collection, addDoc, query, where, onSnapshot, serverTimestamp, doc, updateDoc
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { startChatWith } from './chat-core.js'; 
import { notify } from './notification-hub.js';

let currentUser = null;

// 1. INITIALIZATION
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        console.log("STUDENT COMMAND: ONLINE");
        $('#student-name').text("Client " + user.uid.substring(0,4).toUpperCase());
        
        loadMyMissions(user.uid);
    } else {
        window.location.href = 'DoD_Login_Style.html';
    }
});

// 2. CREATE MISSION (BROADCAST)
$('#btn-transmit').click(async (e) => {
    e.preventDefault();
    const btn = $(e.target);
    btn.text("ENCRYPTING...").prop('disabled', true);

    try {
        await addDoc(collection(db, 'artifacts', dbID, 'missions'), {
            title: $('#req-title').val(),
            budget: Number($('#req-budget').val()), // Ensure number
            deadline: $('#req-deadline').val(),
            type: $('#req-type').val(),
            description: $('#req-desc').val(),
            status: 'OPEN',
            ownerId: currentUser.uid,
            ownerName: currentUser.displayName || "Unknown Client", // Stored for Admin, masked for Mercs
            timestamp: serverTimestamp()
        });

        notify("SUCCESS", "Mission broadcast to Global Network.", "success");
        $('#req-title').val(''); // Clear main input
        
    } catch (err) {
        console.error(err);
        notify("ERROR", "Transmission blocked.", "error");
    }
    btn.text("TRANSMIT REQUEST").prop('disabled', false);
});

// 3. LOAD MY MISSIONS
function loadMyMissions(uid) {
    const q = query(
        collection(db, 'artifacts', dbID, 'missions'), 
        where("ownerId", "==", uid) // Only show MY missions
    );

    onSnapshot(q, (snapshot) => {
        const list = $('#my-mission-list');
        list.empty();

        if(snapshot.empty) {
            list.html('<div style="padding:20px; text-align:center; color:#555;">NO ACTIVE OPERATIONS</div>');
            return;
        }

        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const id = docSnap.id;
            
            // PROTOCOL PHANTOM: Mask the Freelancer's Name
            let mercDisplay = "PENDING ASSIGNMENT";
            let actionBtn = `<span style="color:var(--mh-cyan); font-size:0.8em;">WAITING FOR OPERATIVE...</span>`;

			// CASE 1: Mission Accepted (In Progress)
            if (data.status === 'IN_PROGRESS') {
                actionBtn = `
                    <div style="display:flex; gap:5px;">
                        <button class="btn-small" onclick="window.openComms('${data.freelancerId}')">CHAT</button>
                        <a href="Task_Checkout.html?id=${id}&title=${encodeURIComponent(data.title)}&price=${data.budget}&merc=${data.freelancerId}" 
                           class="btn-small" style="background:var(--mh-green); border:none; color:#000;">
                           FINISH & PAY
                        </a>
                    </div>
                `;
            }
            
            // CASE 2: Completed (Paid)
            else if (data.status === 'COMPLETED') {
                actionBtn = `<span style="color:var(--mh-green); font-size:0.8em;">PAID & ARCHIVED</span>`;
            } 
            
            // CASE 3: Still Open
            else {
                actionBtn = `<span style="color:#666; font-size:0.8em;">WAITING FOR OPERATIVE...</span>`;
            }

            // ... append card ...
			
            const card = `
                <div class="mission-node">
                    <div style="display:flex; justify-content:space-between;">
                        <strong>${data.title}</strong>
                        <span style="color:var(--mh-gold);">$${data.budget}</span>
                    </div>
                    <div style="font-size:0.8em; margin-top:5px; color:#aaa;">${mercDisplay}</div>
                    <div style="margin-top:10px;">${actionBtn}</div>
                </div>
            `;
            list.append(card);
        });
    });
}

// 4. GLOBAL ACTIONS
window.openComms = (mercId) => {
    // Switch to Chat Tab or Modal
    startChatWith(mercId);
    // You might need UI logic here to open the chat panel
    notify("CONNECTING", "Establishing secure link...", "info");
};

// 5. LOGOUT
$('#btn-logout').click(async () => {
    await signOut(auth);
    window.location.reload();
});