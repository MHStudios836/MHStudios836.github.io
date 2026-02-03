/* assets/js/admin-datacenter.js */
import { db } from './firebase-init.js';
import { 
    collection, query, where, getDocs, doc, getDoc, orderBy, limit 
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// --- 1. INITIALIZE VAULT METRICS ---
// We calculate this on load to give you a financial snapshot
async function initVault() {
    try {
        // A. Get Admin Tax Revenue (From System Doc)
        const vaultDoc = await getDoc(doc(db, 'artifacts/mhstudios-836/system/vault'));
        const revenue = vaultDoc.exists() ? (vaultDoc.data().total_revenue || 0).toFixed(2) : "0.00";
        document.getElementById('vault-revenue').innerText = `$${revenue}`;

        // B. Calculate Escrow & User Cash (Heavy Operation - Requires reading active missions/users)
        // For efficiency, we scan the last 50 users/missions in a real app, 
        // but here we'll scan all for accuracy (assuming < 1000 users for now).
        
        let escrowTotal = 0;
        let userCashTotal = 0;

        // Scan Users for Cash
        const usersSnap = await getDocs(collection(db, 'users'));
        usersSnap.forEach(u => {
            userCashTotal += (u.data().wallet_balance || 0);
        });

        // Scan Missions for Escrow (OPEN or IN_PROGRESS means money is held)
        const missionSnap = await getDocs(query(collection(db, 'artifacts/mhstudios-836/missions'), where('payment_status', '==', 'ESCROW_SECURED')));
        missionSnap.forEach(m => {
            if(m.data().status !== 'COMPLETED') { // Only count if not paid out yet
                escrowTotal += (m.data().price || 0);
            }
        });

        document.getElementById('vault-users').innerText = `$${userCashTotal.toFixed(2)}`;
        document.getElementById('vault-escrow').innerText = `$${escrowTotal.toFixed(2)}`;

    } catch (e) {
        console.error("VAULT SYNC ERROR:", e);
    }
}

// --- 2. SEARCH ENGINE ---
async function executeSearch() {
    const term = document.getElementById('search-input').value.toLowerCase().trim();
    const resultsArea = document.getElementById('results-area');
    
    if(!term) return;

    resultsArea.innerHTML = '<div style="text-align:center; padding:20px;">SCANNING DATABASE...</div>';
    let html = '';

    try {
        // STRATEGY: We search Users first, then Missions.
        // Note: Firestore doesn't do "contains" search natively easily. 
        // We will fetch all users (if small DB) or use exact match for ID/Email.
        // For this demo, we assume we fetch a batch and filter client-side for "Name Contains".
        
        const usersSnap = await getDocs(collection(db, 'users'));
        let foundUsers = [];

        usersSnap.forEach(docSnap => {
            const data = docSnap.data();
            const name = (data.displayName || "").toLowerCase();
            const email = (data.email || "").toLowerCase();
            const uid = docSnap.id.toLowerCase();
            
            if (uid.includes(term) || name.includes(term) || email.includes(term)) {
                foundUsers.push({ id: docSnap.id, ...data });
            }
        });

        if (foundUsers.length > 0) {
            html += `<h3 style="border-bottom:1px solid #333; padding-bottom:5px;">PERSONNEL (${foundUsers.length})</h3>`;
            
            for (const user of foundUsers) {
                // Determine Role Badge
                let roleClass = 'role-student';
                if(user.role === 'freelancer') roleClass = 'role-freelancer';
                if(user.role === 'admin') roleClass = 'role-admin';

                // Stats
                const completed = user.stats?.tasks_completed || 0;
                const dropped = user.stats?.tasks_dropped || 0; // Ensure you track this in DB!

                html += `
                <div class="dossier-card">
                    <img src="${user.photoURL || 'images/default_merc.png'}" class="dc-avatar">
                    
                    <div class="dc-info">
                        <h3>${user.displayName || "Unknown"} <span class="dc-role ${roleClass}">${user.role.toUpperCase()}</span></h3>
                        <span>ID: ${user.id}</span>
                        <span>MAIL: ${user.email}</span>
                        <div class="action-bar">
                            <a href="#" class="btn-mini" onclick="window.open('Chat_Viewer.html?uid=${user.id	}', '_blank')">
								<i class="fas fa-comments"></i> INTERCEPT
							</a>
                            <a href="#" class="btn-mini" onclick="alert('BAN FEATURE INTEGRATED IN ADMIN ROOM')"><i class="fas fa-ban"></i> SUSPEND</a>
                        </div>
                    </div>

                    <div class="dc-stats">
                        <div class="stat-row">
                            <span>WALLET</span>
                            <span class="val-money">$${(user.wallet_balance || 0).toFixed(2)}</span>
                        </div>
                        <div class="stat-row">
                            <span>COMPLETED</span>
                            <span style="color:#fff;">${completed}</span>
                        </div>
                        <div class="stat-row">
                            <span>DROPPED</span>
                            <span style="color:#ff4444;">${dropped}</span>
                        </div>
                    </div>
                </div>`;
            }
        } else {
            html += '<div style="padding:20px; color:#666;">NO PERSONNEL FOUND.</div>';
        }

        resultsArea.innerHTML = html;

    } catch (e) {
        console.error("SEARCH FAILED:", e);
        resultsArea.innerHTML = `<div style="color:red;">SYSTEM ERROR: ${e.message}</div>`;
    }
}

// --- 3. BIND EVENTS ---
document.getElementById('btn-search').addEventListener('click', executeSearch);
document.getElementById('search-input').addEventListener('keypress', (e) => {
    if(e.key === 'Enter') executeSearch();
});

// START
initVault();