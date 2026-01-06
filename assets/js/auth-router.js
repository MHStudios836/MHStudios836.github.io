// assets/js/auth-router.js
// THE GATEKEEPER: Manages Access Control based on User Roles

import { auth, db, appId } from './firebase-init.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// 1. THE MAP: Where does each Rank belong?
const ROLE_DESTINATIONS = {
    'admin': 'Admin_Room.html',
    'student': 'Student_Room.html',
    'freelancer': 'Freelancers_Room.html',
    'corporate': 'Corporates_Room.html'
};

// 2. THE GREEN ZONES: Pages anyone can visit (Logged in or not)
const PUBLIC_SECTORS = [
    'index.html',
    'DoD_Login_Style.html',
    'About_Us.html',
    'Service_Request_Form.html',
    'Products_Services_Room.html',
    'Packages.html',
    'Product_Room.html',
    'Privacy_Policy.html'
];

// 3. MAIN SECURITY LOOP
onAuthStateChanged(auth, async (user) => {
    const currentPath = window.location.pathname;
    const currentPage = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'index.html';

    console.log(`[GATEKEEPER] Scanning: ${currentPage}`);

    // --- SCENARIO A: NO ID (Not Logged In) ---
    if (!user) {
        if (PUBLIC_SECTORS.includes(currentPage) || currentPage === "") {
            return; 
        }
        console.warn(">> UNAUTHORIZED ENTITY DETECTED. REDIRECTING TO LOGIN.");
        window.location.href = 'DoD_Login_Style.html';
        return;
    }

    // --- SCENARIO B: OPERATIVE LOGGED IN (Check Clearance) ---
    try {
        const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'user_profile', 'role_data');
        const snapshot = await getDoc(userDocRef);

        if (snapshot.exists()) {
            const userData = snapshot.data();
            const myRole = userData.role;
            const myHQ = ROLE_DESTINATIONS[myRole];

            console.log(`>> OPERATIVE ID: ${user.uid} | RANK: ${myRole}`);

            // SECURITY CHECK: Are they in the wrong HQ?
            if (currentPage.includes('_Room.html') && currentPage !== myHQ && !PUBLIC_SECTORS.includes(currentPage)) {
                if (currentPage !== 'Broadcast_Station.html') {
                     alert(`>> RESTRICTED SECTOR. RETURNING TO ${myRole.toUpperCase()} HQ.`);
                     window.location.href = myHQ;
                }
            }

            // If on Login Page but already logged in, send them to HQ
            if (currentPage === 'DoD_Login_Style.html') {
                window.location.href = myHQ;
            }

        } else {
            console.error(">> CRITICAL ERROR: User has Auth but no Database Profile.");
        }

    } catch (error) {
        console.error(">> GATEKEEPER SYSTEM FAILURE:", error);
    }
});

// 4. LOGOUT PROTOCOL
window.executeLogout = async () => {
    const confirmExit = confirm(">> CONFIRM DISENGAGEMENT?");
    if (confirmExit) {
        await signOut(auth);
        window.location.href = 'DoD_Login_Style.html';
    }
};