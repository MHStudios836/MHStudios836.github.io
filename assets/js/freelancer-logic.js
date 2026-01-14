/* assets/js/freelancer-logic.js */
import { auth, db, dbID } from './firebase-init.js';
import { 
    collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, orderBy 
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { startChatWith } from './chat-core.js'; 

// DOM ELEMENTS
const marketGrid = $('#panel-market .merc-card-container'); // You might need to add this class to your HTML container
const activeGrid = $('#panel-active .merc-card-container'); 

// 1. INITIALIZE LISTENERS
export function initFreelancerSystem() {
    console.log("FREELANCER SYSTEM: ONLINE");
    
    // LOAD MARKET (OPEN JOBS)
    const marketQuery = query(
        collection(db, 'artifacts', dbID, 'missions'),
        where('status', '==', 'OPEN'),
        orderBy('timestamp', 'desc')
    );

    onSnapshot(marketQuery, (snapshot) => {
        renderMarket(snapshot);
    });

    // LOAD MY ACTIVE OPS
    if(auth.currentUser) {
        const myOpsQuery = query(
            collection(db, 'artifacts', dbID, 'missions'),
            where('freelancerId', '==', auth.currentUser.uid),
            orderBy('timestamp', 'desc')
        );
        onSnapshot(myOpsQuery, (snapshot) => {
            renderMyOps(snapshot);
        });
    }
}

// 2. RENDER MARKET (Jobs available to take)
/* IN assets/js/freelancer-logic.js */
function renderMarket(snapshot) {
    const listArea = document.querySelector('#market-list-area');
    if(!listArea) return;

    let html = '';
    
    snapshot.forEach(docSnap => {
        const m = docSnap.data();
        
        // --- IDENTITY MASKING ---
        // Instead of m.ownerName, we use a Code Name
        const shortID = m.ownerId ? m.ownerId.substring(0, 5).toUpperCase() : "XXXX";
        const codeName = `CLIENT-${shortID}`;
        // ------------------------

        html += `
            <div class="merc-card">
                <div class="mc-header">
                    <span class="mc-id">#MSN-${docSnap.id.substring(0,4).toUpperCase()}</span>
                    <span class="mc-status" style="color:#00ff41; border-color:#00ff41;">OPEN</span>
                </div>
                <div class="mc-body">
                    <h3>${m.title}</h3>
                    <p>${m.description || "Classified Intel."}</p>
                    <div class="mc-grid">
                        <div class="mc-data bounty"><label>BOUNTY</label><span>$${m.budget}</span></div>
                        
                        <div class="mc-data"><label>SOURCE</label><span style="color:var(--mh-blue);">${codeName}</span></div>
                    </div>
                    <div class="mc-actions">
                        <button class="btn btn-primary" onclick="window.acceptContract('${docSnap.id}')">
                            <i class="fas fa-check"></i> SECURE CONTRACT
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    listArea.innerHTML = html;
}

// 3. RENDER MY OPS (Jobs I am working on)
function renderMyOps(snapshot) {
    let html = '';
    
    snapshot.forEach(docSnap => {
        const m = docSnap.data();
        html += `
            <div class="merc-card active">
                <div class="mc-header">
                    <span class="mc-id">#${docSnap.id.substring(0,6).toUpperCase()}</span>
                    <span class="mc-status">IN PROGRESS</span>
                </div>
                <div class="mc-body">
                    <h3>${m.title}</h3>
                    <div class="mc-grid">
                        <div class="mc-data"><label>REWARD</label><span style="color:var(--mh-gold);">$${m.budget}</span></div>
                        <div class="mc-data"><label>CLIENT</label><span>${m.ownerName}</span></div>
                    </div>
                    <div class="mc-actions">
                        <button class="btn btn-outline" onclick="window.contactClient('${m.ownerId}')">
                            <i class="fas fa-comment-dots"></i> COMMS
                        </button>
                        <button class="btn btn-primary" onclick="window.completeContract('${docSnap.id}')">
                            <i class="fas fa-flag-checkered"></i> COMPLETE
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    const activeArea = document.querySelector('#active-list-area');
    if(activeArea) activeArea.innerHTML = html;
}

// 4. GLOBAL ACTIONS
window.acceptContract = async (id) => {
    if(!confirm("ACCEPT CONTRACT? This binds you to the mission.")) return;
    try {
        await updateDoc(doc(db, 'artifacts', dbID, 'missions', id), {
            status: 'IN_PROGRESS',
            freelancerId: auth.currentUser.uid,
            freelancerName: auth.currentUser.displayName || 'Mercenary',
            acceptedAt: serverTimestamp()
        });
        alert("CONTRACT SECURED. MOVED TO ACTIVE OPS.");
    } catch(e) {
        alert("ERROR: " + e.message);
    }
};

window.completeContract = (id) => {
    // Redirect to the Upload Zone instead of finishing immediately
    window.location.href = `Mission_Deliverables.html?id=${id}`;
};

window.contactClient = (clientId) => {
    // Switch to Chat Tab
    window.switchTab('panel-chat');
    // Initialize Chat (This function comes from chat-core.js)
    startChatWith(clientId);
};