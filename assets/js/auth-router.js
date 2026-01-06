// assets/js/auth-router.js
import { auth, db, appId } from './firebase-init.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// Mapping Roles to Rooms
const DASHBOARD_MAP = {
    'admin': 'Admin_Room.html',
    'student': 'Student_Room.html',
    'freelancer': 'Freelancers_Room.html',
    'corporate': 'Corporates_Room.html'
};

// Public Pages (No Login Needed)
const PUBLIC_PAGES = [
    'index.html', 
    'DoD_Login_Style.html', 
    'About_Us.html', 
    'Service_Request_Form.html',
    'Products_Services_Room.html', // The Armory is public for viewing
    'Packages.html'
];

// Main Security Function
onAuthStateChanged(auth, async (user) => {
    const currentPage = window.location.pathname.split("/").pop();

    // 1. If User is NOT Logged In
    if (!user) {
        if (!PUBLIC_PAGES.includes(currentPage)) {
            console.warn("Access Denied. Redirecting to Login...");
            window.location.href = 'DoD_Login_Style.html';
        }
        return;
    }

    // 2. If User IS Logged In -> Get their Role
    try {
        const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'user_profile', 'role_data');
        const userSnapshot = await getDoc(userDocRef);

        if (userSnapshot.exists()) {
            const userData = userSnapshot.data();
            const userRole = userData.role;
            const targetPage = DASHBOARD_MAP[userRole];

            console.log(`[AUTH] Operator Identified: ${userRole}`);

            // 3. Logic: Prevent Cross-Room Infiltration
            // If I am a Student, but I am on Admin_Room.html -> KICK ME OUT
            if (currentPage.includes('_Room.html') && currentPage !== targetPage && !PUBLIC_PAGES.includes(currentPage)) {
                 // Exception: Everyone can view Broadcast Station? Or just specific rooms?
                 // For now, strict redirection to their HQ.
                 if (currentPage !== 'Broadcast_Station.html') {
                     console.warn(`[SECURITY] Unauthorized Sector. Redirecting to ${targetPage}`);
                     window.location.href = targetPage;
                 }
            }

        } else {
            console.error("[CRITICAL] User exists in Auth but has NO DATABASE PROFILE.");
            // Optional: Redirect to a "Complete Profile" page
        }

    } catch (error) {
        console.error("Security Check Failed:", error);
    }
});

// Logout Function (Attach this to your Logout buttons)
window.logoutOperative = async () => {
    await signOut(auth);
    window.location.href = 'DoD_Login_Style.html';
};

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
    'Service_Request_Form.html', // Anyone can request service
    'Products_Services_Room.html', // The Armory is open to public
    'Packages.html',
    'Product_Room.html',
    'Privacy_Policy.html'
];

// 3. MAIN SECURITY LOOP
onAuthStateChanged(auth, async (user) => {
    // Get the current file name (e.g., "Student_Room.html")
    const currentPath = window.location.pathname;
    const currentPage = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'index.html';

    console.log(`[GATEKEEPER] Scanning: ${currentPage}`);

    // --- SCENARIO A: NO ID (Not Logged In) ---
    if (!user) {
        // If they are on a Public Page, let them stay.
        if (PUBLIC_SECTORS.includes(currentPage) || currentPage === "") {
            return; 
        }
        // If they are in a Restricted Room, KICK THEM OUT.
        console.warn(">> UNAUTHORIZED ENTITY DETECTED. REDIRECTING TO LOGIN.");
        window.location.href = 'DoD_Login_Style.html';
        return;
    }

    // --- SCENARIO B: OPERATIVE LOGGED IN (Check Clearance) ---
    try {
        // Fetch their Personnel File from Firestore
        const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'user_profile', 'role_data');
        const snapshot = await getDoc(userDocRef);

        if (snapshot.exists()) {
            const userData = snapshot.data();
            const myRole = userData.role; // e.g., 'student'
            const myHQ = ROLE_DESTINATIONS[myRole]; // e.g., 'Student_Room.html'

            console.log(`>> OPERATIVE ID: ${user.uid} | RANK: ${myRole}`);

            // SECURITY CHECK: Are they in the wrong HQ?
            // Logic: If I am on a *_Room.html page, AND it is NOT my HQ, AND it is NOT a public room...
            if (currentPage.includes('_Room.html') && currentPage !== myHQ && !PUBLIC_SECTORS.includes(currentPage)) {
                
                // Exception: Broadcast_Station is global? (If so, add to PUBLIC_SECTORS or handle here)
                if (currentPage !== 'Broadcast_Station.html') {
                     alert(`>> RESTRICTED SECTOR. RETURNING TO ${myRole.toUpperCase()} HQ.`);
                     window.location.href = myHQ;
                }
            }

            // OPTIONAL: If they are on Login Page but already logged in, send them to HQ
            if (currentPage === 'DoD_Login_Style.html') {
                window.location.href = myHQ;
            }

        } else {
            console.error(">> CRITICAL ERROR: User has Auth but no Database Profile.");
            // Ideally, send them to a "Setup Profile" page
        }

    } catch (error) {
        console.error(">> GATEKEEPER SYSTEM FAILURE:", error);
    }
});

// 4. LOGOUT PROTOCOL (Call this function from your Logout Buttons)
window.executeLogout = async () => {
    const confirmExit = confirm(">> CONFIRM DISENGAGEMENT?");
    if (confirmExit) {
        await signOut(auth);
        window.location.href = 'DoD_Login_Style.html';
    }
};