// REPLACE THE TOP IMPORTS WITH THIS:
import { auth, db } from "./firebase-init.js"; // Switched to standard init
import { 
    doc, onSnapshot, collection, query, where, orderBy, limit, getDoc 
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

// !!! CRITICAL: THE MASTER PATH !!!
const DB_PATH = "artifacts/mhstudios-836"; 

// HELPER: Use this to get the right collection instantly
function getColl(name) { return collection(db, DB_PATH, name); }
function getRef(col, id) { return doc(db, DB_PATH, col, id); }

// =============================================================================
// TITAN REACTOR: CENTRAL STATE SYNC ENGINE
// =============================================================================

auth.onAuthStateChanged(user => {
    if (user) {
        console.log(`[REACTOR] ONLINE: ${user.uid}`);
        
        // 1. DETERMINE CURRENT ROOM
        const path = window.location.pathname;

        if (path.includes("Admin_Room"))        initAdminRoom();
        if (path.includes("Contractor_Room"))   initContractorRoom(user.uid);
        if (path.includes("Student_Room"))      initStudentRoom(user.uid);
        if (path.includes("Freelancers_Room"))  initFreelancerRoom(user.uid);
        if (path.includes("Broadcast_Station")) initBroadcastStation();
        if (path.includes("Search_Entity"))     initSearchEntity();
    }
});

// =============================================================================
// SECTOR 1: ADMIN ROOM LOGIC
// =============================================================================
function initAdminRoom() {
    // A. SYNC REVENUE (Vault Display)
    const vaultRef = doc(db, "system", "vault"); // You need to create this doc in Firebase
    onSnapshot(vaultRef, (doc) => {
        if(doc.exists()) {
            document.getElementById('vault-display').innerText = formatMoney(doc.data().total_revenue || 0);
        }
    });

    // B. COUNT TOTAL OPERATIVES
    const usersRef = collection(db, "users");
    onSnapshot(usersRef, (snap) => {
        document.getElementById('stat-users').innerText = snap.size; // Total docs in 'users'
    });
}

// =============================================================================
// SECTOR 2: CONTRACTOR ROOM LOGIC
// =============================================================================
function initContractorRoom(uid) {
    // A. SYNC PROFILE & WALLET
    const userRef = doc(db, "users", uid);
    onSnapshot(userRef, (doc) => {
        const data = doc.data();
        document.getElementById('hero-user-name').innerText = (data.displayName || "EXECUTIVE").toUpperCase();
        document.getElementById('hero-comp-name').innerText = (data.company || "INDEPENDENT").toUpperCase();
        document.getElementById('wallet-balance').innerText = formatMoney(data.wallet_balance || 0);
    });

    // B. SYNC ACTIVE CONTRACTS (Tasks owned by this Contractor)
    const tasksQuery = query(collection(db, "tasks"), where("owner_id", "==", uid));
    onSnapshot(tasksQuery, (snap) => {
        const feed = document.getElementById('mission-feed');
        if(!feed) return;
        
        if (snap.empty) {
            feed.innerHTML = `<div style="text-align:center; padding:40px; color:#666;">NO ACTIVE CONTRACTS DEPLOYED.</div>`;
            return;
        }

        feed.innerHTML = ""; // Clear loader
        snap.forEach(taskDoc => {
            const task = taskDoc.data();
            // Inject HTML Card (Reuse your existing structure)
            feed.innerHTML += `
                <div class="holo-card">
                    <div class="status-strip ${task.status === 'OPEN' ? 'pending' : 'active'}"></div>
                    <div class="card-body">
                        <div class="c-header">
                            <span class="c-id">${taskDoc.id.substring(0,8).toUpperCase()}</span>
                            <span class="c-date">${new Date(task.created_at?.toDate()).toLocaleDateString()}</span>
                        </div>
                        <div class="c-title">${task.title}</div>
                        <div class="c-footer">
                            <div class="c-price">${formatMoney(task.budget)}</div>
                            <span class="c-status">${task.status}</span>
                        </div>
                    </div>
                </div>
            `;
        });
    });
}

// =============================================================================
// SECTOR 3: STUDENT ROOM LOGIC
// =============================================================================
function initStudentRoom(uid) {
    const userRef = doc(db, "users", uid);
    
    onSnapshot(userRef, (doc) => {
        const data = doc.data();
        
        // 1. Profile Sync
        setText('student-name', data.displayName);
        setText('student-id', `ID: ${uid.substring(0,8).toUpperCase()}`);
        setText('student-balance', formatMoney(data.wallet_balance || 0));
        
        // 2. Avatar Sync
        if(data.photoURL) document.getElementById('user-avatar-img').src = data.photoURL;

        // 3. Stats Sync (Tasks Completed/Created)
        // You need to update these numbers in Firebase when a task changes status!
        const createdCount = data.stats?.tasks_created || 0;
        const completedCount = data.stats?.tasks_completed || 0;
        
        // Find the cards (You might need to add IDs to your HTML cards for easier targeting)
        // For now, let's assume you add id="stat-created" and id="stat-completed" to the numbers
        if(document.getElementById('stat-created')) document.getElementById('stat-created').innerText = createdCount;
        if(document.getElementById('stat-completed')) document.getElementById('stat-completed').innerText = completedCount;
    });
}

// =============================================================================
// SECTOR 4: FREELANCER ROOM LOGIC
// =============================================================================
function initFreelancerRoom(uid) {
    // A. SYNC PROFILE
    const userRef = doc(db, "users", uid);
    onSnapshot(userRef, (doc) => {
        const data = doc.data();
        setText('merc-name', data.displayName);
        // ... sync rating, jobs done, etc from data.stats object
    });

    // B. JOB MARKET (Active Tasks) - REALTIME
    // Only show tasks that are OPEN
    const marketQuery = query(collection(db, "tasks"), where("status", "==", "OPEN"));
    
    onSnapshot(marketQuery, (snap) => {
        const marketGrid = document.getElementById('active-ops-grid'); // Ensure this ID exists in your HTML
        if(!marketGrid) return;

        marketGrid.innerHTML = ""; 
        snap.forEach(doc => {
            const task = doc.data();
            marketGrid.innerHTML += `
                <div class="merc-card">
                     <div class="mc-header">
                        <span class="mc-id">#${doc.id.substring(0,6)}</span>
                        <span class="mc-status">OPEN</span>
                    </div>
                    <div class="mc-body">
                        <h3>${task.title}</h3>
                        <div class="mc-grid">
                            <div class="mc-data bounty"><label>BOUNTY</label><span>${formatMoney(task.budget)}</span></div>
                        </div>
                        <div class="mc-actions">
                            <button class="btn btn-primary" onclick="window.location.href='Task_View.html?id=${doc.id}'">VIEW INTEL</button>
                        </div>
                    </div>
                </div>
            `;
        });
    });
}

// =============================================================================
// SECTOR 5: BROADCAST STATION (Global Feed)
// =============================================================================
function initBroadcastStation() {
    // A. GLOBAL TASK FEED (Limit to last 20)
    const feedQuery = query(collection(db, "tasks"), orderBy("created_at", "desc"), limit(20));
    
    onSnapshot(feedQuery, (snap) => {
        const list = document.getElementById('global-task-list');
        if(!list) return;

        list.innerHTML = "";
        snap.forEach(doc => {
            const task = doc.data();
            list.innerHTML += `
                <div class="titan-task-card">
                    <div class="ttc-header">
                        <span><i class="fas fa-satellite"></i> ${new Date(task.created_at?.toDate()).toLocaleTimeString()}</span>
                        <span class="ttc-priority p-high">${task.category || 'OPS'}</span>
                    </div>
                    <div class="ttc-title">${task.title}</div>
                    <div class="ttc-meta-row">
                        <span class="ttc-meta-item" style="color:var(--mh-gold);">${formatMoney(task.budget)}</span>
                        <span class="ttc-meta-item">CLIENT: ${task.owner_name || 'UNKNOWN'}</span>
                    </div>
                </div>
            `;
        });
    });

    // B. ELITE ROSTER (Top Freelancers)
    const eliteQuery = query(collection(db, "users"), where("role", "==", "freelancer"), orderBy("stats.rating", "desc"), limit(10));
    onSnapshot(eliteQuery, (snap) => {
        const roster = document.getElementById('elite-roster');
        if(!roster) return;
        
        roster.innerHTML = "";
        snap.forEach(doc => {
            const u = doc.data();
            roster.innerHTML += `
                <div class="elite-card">
                    <div class="ec-avatar"><img src="${u.photoURL || 'images/default.jpg'}" style="width:100%; height:100%; border-radius:50%;"></div>
                    <div class="ec-info">
                        <h4>${u.displayName}</h4>
                        <span>RATING: ${u.stats?.rating || '0.0'}</span>
                    </div>
                </div>
            `;
        });
    });
}

// =============================================================================
// SECTOR 6: SEARCH ENTITY (Tracking System)
// =============================================================================

async function initSearchEntity() {
    window.performSearch = async () => {
        const queryID = document.getElementById('search-input').value.trim();
        const resBox = document.getElementById('results-area'); // Ensure this ID exists in HTML
        
        if(!queryID) return;
        if(resBox) resBox.innerHTML = '<div style="color:var(--mh-cyan)">SCANNING DATABASE...</div>';

        try {
            // A. CHECK IF IT IS A MISSION (TSK-...)
            if(queryID.startsWith("TSK")) {
                const docSnap = await getDoc(getRef("missions", queryID)); // Uses Custom ID as Key
                if(docSnap.exists()) {
                    renderResult(docSnap.data(), 'MISSION', resBox);
                    return;
                }
            }

            // B. CHECK IF IT IS A USER (Direct ID or Titan ID)
            // 1. Try Direct Doc ID
            let userSnap = await getDoc(getRef("users", queryID));
            
            // 2. If not found, search by the "titanId" field
            if (!userSnap.exists()) {
                const q = query(getColl("users"), where("titanId", "==", queryID));
                const querySnap = await getDocs(q);
                if (!querySnap.empty) userSnap = querySnap.docs[0];
            }

            if (userSnap && userSnap.exists()) {
                renderResult(userSnap.data(), 'USER', resBox);
            } else {
                if(resBox) resBox.innerHTML = '<div style="color:var(--mh-red)">TARGET NOT FOUND.</div>';
            }

        } catch(e) {
            console.error(e);
            if(resBox) resBox.innerHTML = `<div style="color:red">SYSTEM ERROR: ${e.message}</div>`;
        }
    };
}

// HELPER: Renders the Card to the UI
function renderResult(data, type, container) {
    if(!container) return;
    
    let html = '';
    if(type === 'USER') {
        html = `
            <div class="dossier-card theme-${data.role}">
                <h2>${data.displayName}</h2>
                <div class="dc-badge">${data.rank || data.role.toUpperCase()}</div>
                <div>ID: ${data.titanId || 'N/A'}</div>
                <div>WALLET: $${(data.wallet_balance || 0).toFixed(2)}</div>
            </div>`;
    } else {
        html = `
            <div class="dossier-card theme-mission">
                <h2>${data.title}</h2>
                <div class="dc-badge">${data.status}</div>
                <div>BUDGET: $${data.budget}</div>
                <div>CLIENT: ${data.studentName}</div>
            </div>`;
    }
    container.innerHTML = html;
}

// --- UTILS ---
function formatMoney(amount) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function setText(id, val) {
    const el = document.getElementById(id);
    if(el) el.innerText = val;
}