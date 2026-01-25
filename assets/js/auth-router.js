/* assets/js/auth-router.js */
/* STATUS: COORDINATED WITH CHECKPOINT SYSTEM & ROLES */

import { auth, db, DB_PATH } from './firebase-init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// 1. ROLE DESTINATIONS
const HQ_MAP = {
    'student': 'Student_Room.html',
    'admin': 'Admin_Room.html',
    'freelancer': 'Freelancers_Room.html'
};

// 2. PUBLIC ZONES (Green Zones)
const GREEN_ZONES = [
    'index.html',
    'DoD_Login_Style.html',
    'About_Us.html',
    'User_Registeration_Form.html', // Need to allow access to finish setup
    'Terms_Conditions.html',
    'Privacy_Policy.html',
    'Products_Services_Room.html',
    'Product_Room.html'
];

onAuthStateChanged(auth, async (user) => {
    const currentPath = window.location.pathname;
    const pageName = currentPath.split('/').pop();

    // --- SCENARIO A: GUEST (NOT LOGGED IN) ---
    if (!user) {
        // If trying to access a restricted page, kick to login
        if (!GREEN_ZONES.includes(pageName) && pageName !== '') {
            console.warn("UNAUTHORIZED. REDIRECTING TO LOGIN.");
            window.location.href = 'DoD_Login_Style.html';
        }
        return;
    }

    // --- SCENARIO B: OPERATIVE LOGGED IN ---
    try {
        const userRef = doc(db, `${DB_PATH}/users/${user.uid}`);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
            const data = snap.data();
            const role = data.role || 'student';
            const cp = data.checkpoint || 1; // Default to 1 (Registration)

            console.log(`>> ID: ${user.uid} | ROLE: ${role} | CP: ${cp}`);

            // 1. CHECKPOINT ENFORCEMENT (The "Lost Recruit" Logic)
            if (role === 'student') {
                if (cp === 1 && pageName !== 'User_Registeration_Form.html') {
                    window.location.href = 'User_Registeration_Form.html';
                    return;
                }
                if (cp === 2 && pageName !== 'Terms_Conditions.html') {
                    window.location.href = 'Terms_Conditions.html?mode=induction';
                    return;
                }
                if (cp === 3 && pageName !== 'Privacy_Policy.html') {
                    window.location.href = 'Privacy_Policy.html?mode=induction';
                    return;
                }
            }

            // 2. ROLE REDIRECTION (Stop Cows from entering Admin HQ)
            // If they are on a "Room" page, make sure it's THEIR room.
            if (pageName.includes('_Room.html')) {
                const authorizedHQ = HQ_MAP[role];
                if (pageName !== authorizedHQ && authorizedHQ) {
                    alert(`RESTRICTED SECTOR. RETURNING TO ${role.toUpperCase()} HQ.`);
                    window.location.href = authorizedHQ;
                }
            }

            // 3. LOGIN PAGE BOUNCE
            // If logged in and fully set up (CP=4), don't stay on Login page
            if (pageName === 'DoD_Login_Style.html' && cp >= 4) {
                window.location.href = HQ_MAP[role];
            }

        } else {
            console.error("USER AUTHENTICATED BUT NO DB PROFILE.");
        }

    } catch (e) {
        console.error("GATEKEEPER FAILURE:", e);
    }
});