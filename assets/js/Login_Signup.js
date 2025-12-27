// --- Firebase Imports (MUST be at the top) ---
// We need to import the Firebase functions using their CDN URLs for a single HTML file setup.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// --- Firebase Initialization (can run immediately) ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
let auth;

if (firebaseConfig) {
    // Initialize Firebase app and auth instance
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
} else {
    // Log a warning if config is missing, but allow the rest of the script to run
    console.error("Firebase configuration is missing. Authentication features are disabled.");
}

// --- GUARANTEED EXECUTION: Wait until the entire page is loaded before trying to find elements ---
document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Element Selection (Only forms and message box needed now) ---
    const container = document.getElementById('container'); // Still needed for class removal on sign-up success
    const signUpForm = document.getElementById('signUpForm');
    const signInForm = document.getElementById('signInForm');
    const messageBox = document.getElementById('auth-message-box');

    // **CRITICAL:** The signUpButton and signInButton listeners are now handled in HTML 'onclick' and removed from here.

    // --- Helper Functions (Defined inside the scope of the elements) ---

    /**
     * Helper function to display authentication status messages (errors/success).
     */
    function showMessage(message, isError = true) {
        if (messageBox) {
            messageBox.textContent = message;
            // Apply appropriate colors
            messageBox.style.padding = '10px';
            messageBox.style.marginBottom = '20px';
            messageBox.style.borderRadius = '5px';
            messageBox.style.textAlign = 'center';
            messageBox.style.border = '1px solid';
            
            if (isError) {
                messageBox.style.backgroundColor = '#f8d7da'; // Light red
                messageBox.style.color = '#721c24'; // Dark red text
                messageBox.style.borderColor = '#f5c6cb';
            } else {
                messageBox.style.backgroundColor = '#d4edda'; // Light green
                messageBox.style.color = '#155724'; // Dark green text
                messageBox.style.borderColor = '#c3e6cb';
            }
            
            messageBox.style.display = 'block';

            // Automatically hide the message after 5 seconds
            setTimeout(() => {
                messageBox.style.display = 'none';
                messageBox.textContent = '';
            }, 5000);
        } else {
            console.log(`Auth Message: ${message}`);
        }
    }

    /**
     * Handles the user sign-up process with Firebase.
     */
    const handleSignUp = async (e) => {
        e.preventDefault();

        const emailInput = document.getElementById('su-email');
        const passwordInput = document.getElementById('su-password');

        const email = emailInput ? emailInput.value : '';
        const password = passwordInput ? passwordInput.value : '';

        if (!auth) {
            showMessage("Authentication service not available.", true);
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // Signed up successfully
            console.log("User Signed Up:", userCredential.user);
            showMessage(`Account created for ${userCredential.user.email}! Switching to Login...`, false);
            
            // Automatically switch back to the sign in panel (Using class removal here)
            if (container) {
                container.classList.remove("right-panel-active");
            }
            
            // Clear the form
            if (signUpForm) {
                signUpForm.reset();
            }
            
        } catch (error) {
            console.error("Sign Up Error:", error.code, error.message);
            
            // Provide user-friendly error messages
            let userMessage = 'Sign Up Failed. Please check the input fields.';
            if (error.code === 'auth/weak-password') {
                userMessage = 'Password should be at least 6 characters.';
            } else if (error.code === 'auth/email-already-in-use') {
                userMessage = 'This email is already in use.';
            } else if (error.code === 'auth/invalid-email') {
                userMessage = 'The email address is not valid.';
            }
            showMessage(userMessage, true);
        }
    };

    /**
     * Handles the user sign-in process with Firebase.
     */
    const handleSignIn = async (e) => {
        e.preventDefault();

        const emailInput = document.getElementById('si-email');
        const passwordInput = document.getElementById('si-password');

        const email = emailInput ? emailInput.value : '';
        const password = passwordInput ? passwordInput.value : '';

        if (!auth) {
            showMessage("Authentication service not available.", true);
            return;
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            // Signed in successfully
            console.log("User Signed In:", userCredential.user);
            showMessage(`Welcome back, ${userCredential.user.email}! Redirecting to Admin Room...`, false);
            
            // Use a slight delay before redirecting for a better user experience
            setTimeout(() => {
                window.location.href = 'Admin_Room.html';
            }, 1500);
            
        } catch (error) {
            console.error("Sign In Error:", error.code, error.message);
            
            // Provide user-friendly error messages
            let userMessage = 'Sign In Failed. Please check your email and password.';
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                 userMessage = 'Invalid email or password.';
            } else if (error.code === 'auth/invalid-email') {
                 userMessage = 'The email address is not valid.';
            }
            showMessage(userMessage, true);
        }
    };

    // --- Attach Form Submission Event Listeners ---
    if (signUpForm) {
        signUpForm.addEventListener('submit', handleSignUp);
    } else {
        console.warn("Sign Up form element (#signUpForm) not found. Check your HTML.");
    }

    if (signInForm) {
        signInForm.addEventListener('submit', handleSignIn);
    } else {
        console.warn("Sign In form element (#signInForm) not found. Check your HTML.");
    }

}); // End of DOMContentLoaded