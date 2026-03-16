/* assets/js/search-entity.js */
import { db, dbID } from './firebase-init.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// DOM ELEMENTS
const searchInput = document.getElementById('search-input');
const scanBtn = document.getElementById('btn-scan');
const resultPanel = document.getElementById('result-display');
const emptyState = document.getElementById('empty-state');

// INIT
document.addEventListener('DOMContentLoaded', () => {
    scanBtn.addEventListener('click', executeScan);
    
    // Allow "Enter" key to trigger scan
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') executeScan();
    });
});

async function executeScan() {
	
	// [NEW] PROTOCOL 4A: SECURITY CLEARANCE CHECK
    const user = auth.currentUser;
    // We need to fetch the role quickly (or store it in localStorage on login)
    // For now, assuming you have the role:
    const userRef = doc(db, 'artifacts', dbID, 'users', user.uid); 
    const snap = await getDoc(userRef);
    const myRole = snap.data().role;

    if (myRole !== 'admin' && myRole !== 'operative') {
        alert("SECURITY ALERT: UNAUTHORIZED ACCESS.");
        scanBtn.disabled = false;
        return;
    }
	
    const input = searchInput.value.trim();
    if(!input) return;

    // UI: Scanning State
    scanBtn.innerHTML = '<i class="fas fa-satellite-dish fa-spin"></i> TRIANGULATING TARGET...';
    scanBtn.disabled = true;
    resultPanel.style.display = 'none';
    emptyState.style.display = 'none';

    try {
        const usersRef = collection(db, 'artifacts', dbID, 'users');
        
        // STRATEGY: Dual Query (Titan ID OR Email)
        let q = query(usersRef, where('titanId', '==', input));
        let snap = await getDocs(q);

        if (snap.empty) {
            q = query(usersRef, where('email', '==', input));
            snap = await getDocs(q);
        }

        // RESET BUTTON
        scanBtn.innerHTML = '<i class="fas fa-crosshairs"></i> INITIATE DEEP SCAN';
        scanBtn.disabled = false;

        if (snap.empty) {
            alert("NEGATIVE CONTACT. TARGET NOT FOUND.");
            emptyState.style.display = 'block';
            emptyState.innerHTML = `<i class="fas fa-user-slash" style="font-size:3em; color:#333; margin-bottom:10px;"></i><br>NO RECORD FOUND`;
            return;
        }

        // --- RENDER DOSSIER CARD ---
        const data = snap.docs[0].data();
        const uid = snap.docs[0].id;

        // 1. Inject Data
        document.getElementById('res-id').innerText = data.titanId || "UNREGISTERED";
        document.getElementById('res-name').innerText = (data.first_name + " " + data.last_name).toUpperCase();
        document.getElementById('res-role').innerText = data.role ? data.role.toUpperCase() : "UNKNOWN";
        document.getElementById('res-nat').innerText = data.nationality || "UNKNOWN";
        document.getElementById('res-loc').innerText = data.location || "CLASSIFIED";
        document.getElementById('res-img').src = data.photoURL || 'images/profile_placeholder.png';

        // 2. Role Specifics (Color Coding)
        const badge = document.getElementById('res-badge');
        resultPanel.className = 'titan-panel dossier-card'; // Reset
        
        if(data.role === 'student') {
            resultPanel.classList.add('theme-student');
            badge.className = 'role-badge badge-blue';
            badge.innerHTML = '<i class="fas fa-user-graduate"></i> STUDENT';
        } else if (data.role === 'freelancer') {
            resultPanel.classList.add('theme-merc');
            badge.className = 'role-badge badge-orange';
            badge.innerHTML = '<i class="fas fa-code"></i> MERCENARY';
        } else if (data.role === 'admin') {
            resultPanel.classList.add('theme-admin');
            badge.className = 'role-badge badge-red';
            badge.innerHTML = '<i class="fas fa-shield-alt"></i> COMMAND';
        }

        // 3. Show Result
        resultPanel.style.display = 'block';

        // 4. Bind Action Button
        window.targetUid = uid; // Store globally for the view button

    } catch (e) {
        console.error(e);
        alert("SYSTEM FAILURE: " + e.message);
        scanBtn.innerHTML = 'RETRY SCAN';
        scanBtn.disabled = false;
    }
	
	// Inside executeScan...

	// [NEW] RULE: OPERATIVE CLEARANCE
	const user = auth.currentUser;
	const userDoc = await getDoc(doc(db, 'artifacts', dbID, 'users', user.uid));
	const myRole = userDoc.data().role;

	// RESTRICT ACCESS
	if (myRole !== 'admin' && myRole !== 'operative') {
		alert("SECURITY ALERT: YOU ARE NOT AUTHORIZED TO USE THE LOCATOR.");
		return;
	}

	// RESTRICT DATA VIEW (Operatives see less than Admins)
	// [NEW] PROTOCOL 4B: FINANCIAL CENSORSHIP
	let walletDisplay = "ENCRYPTED";
	if (myRole === 'admin') {
		walletDisplay = `$${(data.wallet_balance || 0).toFixed(2)}`;
	} else {
		// Operatives only see solvency status
		walletDisplay = (data.wallet_balance > 0) ? "SOLVENT" : "INSOLVENT";
	}

	// Update the HTML string to use walletDisplay
	<div>WALLET: ${walletDisplay}</div>
	}

	// Global Redirect Function
	window.viewDossier = () => {
		if(window.targetUid) {
			// Redirect to a detailed profile view (Intel Center)
			window.location.href = `Intel_Center.html?uid=${window.targetUid}`;
		}
};