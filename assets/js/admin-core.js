/* assets/js/admin-core.js - MASTER CONTROL */
import { getFirestore, collection, addDoc, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { app } from "./firebase-init.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const db = getFirestore(app);
const auth = getAuth(app);
const appId = 'mhstudios-836';

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("ADMIN CORE: ONLINE");
    
    // LOGOUT
    document.getElementById('admin-logout')?.addEventListener('click', () => {
        signOut(auth).then(() => window.location.href = 'DoD_Login_Style.html');
    });

    // LOAD DASHBOARD DATA
    refreshUserGrid();
    refreshProductList();
});

// --- USER MANAGEMENT LOGIC ---
async function refreshUserGrid() {
    const grid = document.getElementById('user-grid-body'); // Ensure table ID matches
    if(!grid) return;
    
    grid.innerHTML = '<tr><td>SCANNING...</td></tr>';
    const snapshot = await getDocs(collection(db, 'artifacts', appId, 'users'));
    
    grid.innerHTML = '';
    snapshot.forEach(doc => {
        const user = doc.data();
        grid.innerHTML += `
            <tr>
                <td>${user.name || 'UNKNOWN'}</td>
                <td>${user.role || 'CIVILIAN'}</td>
                <td>${user.email}</td>
                <td><button onclick="banUser('${doc.id}')" style="color:red">PURGE</button></td>
            </tr>`;
    });
}

// --- PRODUCT/MISSION LOGIC ---
async function refreshProductList() {
    // Add similar logic here for your products table if you have one
    console.log("Product List Synced");
}

// --- BROADCAST LOGIC ---
window.deployMission = async function() {
    const title = document.getElementById('mission-title').value;
    const budget = document.getElementById('mission-budget').value;
    
    if(!title || !budget) return alert("MISSING INTEL");

    await addDoc(collection(db, 'artifacts', appId, 'missions'), {
        title, budget, status: 'OPEN', timestamp: serverTimestamp()
    });
    alert("MISSION BROADCAST SUCCESSFUL");
};

/* INJECT THIS INTO admin-core.js */

// 1. Add this to your DOMContentLoaded listener at the top:
// updateVaultDisplay(); 

// 2. Add this function at the bottom of the file:
async function updateVaultDisplay() {
    // We reference the 'system/vault' document where the siphon saves the money
    const vaultRef = doc(db, 'artifacts', appId, 'system', 'vault');
    const vaultSnap = await getDoc(vaultRef);
    
    if (vaultSnap.exists()) {
        const revenue = vaultSnap.data().totalRevenue || 0;
        // Search for an element with ID 'vault-display' and update it
        const display = document.getElementById('vault-display');
        if(display) {
            display.innerText = `$${revenue.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
            // Optional: Add a green glow effect when money is found
            display.style.textShadow = "0 0 15px var(--mh-green)";
            display.style.color = "var(--mh-green)";
        }
    }
}