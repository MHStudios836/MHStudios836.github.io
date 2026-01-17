/* assets/js/auth-guard.js */
// FIXED: Now uses v12.7.0 to match the rest of the fleet
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
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
 * Specific check for roles if needed later
 */
export function requireRole(allowedRoles, userRole) {
    if (!allowedRoles.includes(userRole)) {
        alert("ACCESS DENIED: INSUFFICIENT CLEARANCE.");
        // Redirect to a neutral ground or back to their specific HQ
        window.location.href = 'index.html'; 
        return false;
    }
    return true;
}