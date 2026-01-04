/* assets/js/auth-guard.js */
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { app } from "./firebase-init.js";

const auth = getAuth(app);

/**
 * Verifies if a user is logged in.
 * If not, redirects to the login page.
 * @param {Function} onSuccess - Callback function to run if user is authenticated.
 */
export function requireAuth(onSuccess) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is present, proceed with the mission
            if (onSuccess) onSuccess(user);
        } else {
            // User is MIA, redirect to base
            console.warn("UNAUTHORIZED ACCESS ATTEMPT. REDIRECTING...");
            window.location.href = 'DoD_Login_Style.html';
        }
    });
}

/**
 * specific check for roles if needed later
 */
export function requireRole(allowedRoles, userRole) {
    if (!allowedRoles.includes(userRole)) {
        alert("ACCESS DENIED: INSUFFICIENT CLEARANCE.");
        window.location.href = 'Mission_Control.html'; // Fallback
        return false;
    }
    return true;
}

import { notify } from './notification-hub.js';

// Replace: alert("CONTRACT CONFIRMED");
notify("Contract", "Transmission Secure. Mission Accepted.", "success");

// Replace: alert("ERROR: PLEASE RETRY");
notify("System Error", "Uplink Failed. Check your connection.", "error");