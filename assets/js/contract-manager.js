/* assets/js/contract-manager.js */
import { db, auth, dbID } from './firebase-init.js';
import { 
    doc, getDoc, updateDoc, serverTimestamp, collection, addDoc 
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";

// 1. GET MISSION ID
const urlParams = new URLSearchParams(window.location.search);
const missionId = urlParams.get('id');

// 2. INJECT THE "HUD WINDOW" (Hidden by default)
const hudHTML = `
<div id="mission-hud" style="display:none; position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:rgba(0, 20, 0, 0.95); border:2px solid #00ff41; padding:30px; text-align:center; z-index:9999; box-shadow:0 0 50px rgba(0,255,65,0.2);">
    <i class="fas fa-check-circle" style="font-size:3em; color:#00ff41; margin-bottom:15px;"></i>
    <h2 style="color:#fff; margin:0;">MISSION ACCEPTED SUCCESSFULLY!</h2>
    <p style="color:#ccc; font-size:0.8em; margin-top:10px;">
        Go back to the "Active Ops" to view the Accepted Tasks
    </p>
    <div style="margin-top:20px; font-size:0.4em; color:#00ff41; animation: blink 1s infinite;">
        REDIRECTING TO DASHBOARD...
    </div>
</div>
`;
document.body.insertAdjacentHTML('beforeend', hudHTML);

// 3. LOAD DATA
document.addEventListener('DOMContentLoaded', () => {
    if(!missionId) return window.location.href = 'Broadcast_Station.html';
    
    // Bind Button
    const btn = document.getElementById('btn-execute');
    if(btn) btn.addEventListener('click', executeContract);

    loadMissionIntel(missionId);
});

async function loadMissionIntel(id) {
    const docRef = doc(db, 'artifacts', dbID, 'missions', id);
    const snap = await getDoc(docRef);
    if(snap.exists()) {
        const data = snap.data();
        if(document.getElementById('m-desc')) 
            document.getElementById('m-desc').innerText = data.description;
    }
}

// 4. THE ACCEPT LOGIC
async function executeContract() {
    const user = auth.currentUser;
    if (!user) return alert("LOGIN REQUIRED");
    
    const checkbox = document.getElementById('agree-check');
    if (checkbox && !checkbox.checked) return alert("YOU MUST AGREE TO TERMS.");

    const btn = document.getElementById('btn-execute');
    btn.disabled = true;
    btn.innerText = "SECURING CONTRACT...";

    try {
        // A. LOCK MISSION (Assign to Freelancer)
        await updateDoc(doc(db, 'artifacts', dbID, 'missions', missionId), {
            status: 'ACTIVE',
            freelancerUid: user.uid,
            freelancerName: user.displayName || 'Operative',
            acceptedAt: serverTimestamp()
        });

        // B. CREATE CHAT (Student <> Freelancer)
        // Note: We create a chat doc so it appears in the list
        await addDoc(collection(db, 'artifacts', dbID, 'chats'), {
            missionId: missionId,
            participants: [user.uid], // Add student UID here if available in mission data
            lastMessage: "MISSION ACCEPTED. AWAITING ORDERS.",
            timestamp: serverTimestamp()
        });

        // C. SHOW THE HUD (Your Specific Request)
        document.getElementById('mission-hud').style.display = 'block';

        // D. REDIRECT TO ACTIVE OPS (After 3 seconds)
        setTimeout(() => {
            window.location.href = 'Freelancers_Room.html';
        }, 3000);

    } catch (e) {
        console.error(e);
        alert("ERROR: " + e.message);
        btn.disabled = false;
    }
}