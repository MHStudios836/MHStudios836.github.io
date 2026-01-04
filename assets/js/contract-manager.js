/* assets/js/contract-manager.js */
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { app } from "./firebase-init.js";
import { requireAuth } from "./auth-guard.js";

const db = getFirestore(app);
const appId = 'mhstudios-836';
let currentOperative = null;
let missionId = null;

// INIT
document.addEventListener('DOMContentLoaded', () => {
    // 1. Get Mission ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    missionId = urlParams.get('id');

    if (!missionId) {
        alert("CRITICAL ERROR: MISSING MISSION PARAMETERS.");
        window.location.href = 'Freelancers_Room.html';
        return;
    }

    // 2. Run Security Check
    requireAuth((user) => {
        currentOperative = user;
        loadMissionIntel(missionId);
    });

    // 3. Bind UI Events
    bindInterfaceEvents();
});

async function loadMissionIntel(id) {
    try {
        const missionRef = doc(db, 'artifacts', appId, 'missions', id);
        const missionSnap = await getDoc(missionRef);

        if (missionSnap.exists()) {
            const data = missionSnap.data();
            renderIntel(data);
        } else {
            throw new Error("Mission data deleted or corrupted.");
        }
    } catch (err) {
        console.error("INTEL FAILURE:", err);
        alert("MISSION DATA UNREACHABLE.");
        window.location.href = 'Freelancers_Room.html';
    }
}

function renderIntel(data) {
    // Inject Text
    setText('#m-title', data.title);
    setText('#m-type', data.type);
    setText('#m-deadline', data.deadline);
    setText('#m-budget', `$${data.budget}`);

    // Description Animation
    const descBox = document.getElementById('m-desc');
    descBox.style.opacity = 0;
    descBox.innerText = data.description;
    
    // Simple fade in
    setTimeout(() => { descBox.style.opacity = 1; }, 300);
}

function setText(selector, text) {
    const el = document.querySelector(selector);
    if(el) el.innerText = text ? text.toUpperCase() : "---";
}

function bindInterfaceEvents() {
    const checkbox = document.getElementById('agree-check');
    const btn = document.getElementById('btn-execute');

    checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            btn.classList.add('active');
            btn.innerText = "SIGN & EXECUTE (READY)";
        } else {
            btn.classList.remove('active');
            btn.innerText = "SIGN & EXECUTE";
        }
    });

    btn.addEventListener('click', async () => {
        if (!checkbox.checked) return;
        
        btn.innerText = "ENCRYPTING SIGNATURE...";
        btn.disabled = true;

        await executeContract();
    });
}

async function executeContract() {
    try {
        // Fetch User Name for the signature
        const userDoc = await getDoc(doc(db, 'artifacts', appId, 'users', currentOperative.uid));
        const opName = userDoc.exists() ? userDoc.data().name : "UNKNOWN_MERCENARY";

        // Update Mission Status
        await updateDoc(doc(db, 'artifacts', appId, 'missions', missionId), {
            status: 'ASSIGNED',
            freelancerId: currentOperative.uid,
            freelancerName: opName,
            activationDate: new Date().toISOString()
        });

        alert("CONTRACT CONFIRMED. FUNDS HELD IN ESCROW. GOOD HUNTING.");
        window.location.href = 'Freelancers_Room.html';

    } catch (error) {
        console.error("SIGNATURE FAILED:", error);
        alert("CONTRACT ERROR: PLEASE RETRY.");
        const btn = document.getElementById('btn-execute');
        btn.innerText = "SIGN & EXECUTE (READY)";
        btn.disabled = false;
    }
}