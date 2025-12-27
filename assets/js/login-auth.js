// --- assets/js/login-auth.js (FIXED & ALIGNED) ---

import { auth, db, getUserDocRef } from './firebase-init.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword 
} from 'https://www.gstatic.com/firebasejs/9.6.0/firebase-auth.js';
import { setDoc } from 'https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore.js';

// --- UI HELPERS ---
function showMessageBox(message, type) {
    const $messageBox = $('#auth-message'); // Ensure this ID exists in your HTML
    if ($messageBox.length === 0) return; // specific safety check
    
    $messageBox.text(message).removeClass('success error loading').addClass(type).fadeIn(300);
    if (type === 'success') {
        setTimeout(() => $messageBox.fadeOut(500), 4000);
    }
}

// --- HANDLERS ---

// 1. SIGN UP (Register)
async function handleSignup(event) {
    event.preventDefault();
    showMessageBox("Creating account...", 'loading');

    const email = $('#signup-email').val();
    const password = $('#signup-password').val();

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Securely set the role as 'user' in the database
        await setDoc(getUserDocRef(user.uid), {
            role: 'user', 
            email: email,
            createdAt: new Date().toISOString()
        });

        showMessageBox("Account created! Redirecting...", 'success');
        setTimeout(() => { window.location.href = 'index.html'; }, 1500);

    } catch (error) {
        console.error("Signup error:", error);
        showMessageBox(error.message, 'error');
    }
}

// 2. LOGIN
async function handleLogin(event) {
    event.preventDefault();
    showMessageBox("Logging in...", 'loading');

    const email = $('#login-email').val();
    const password = $('#login-password').val();

    try {
        await signInWithEmailAndPassword(auth, email, password);
        showMessageBox("Welcome back!", 'success');
        setTimeout(() => { window.location.href = 'index.html'; }, 1500);
    } catch (error) {
        console.error("Login error:", error);
        showMessageBox("Login failed. Check your email and password.", 'error');
    }
}

// --- INITIALIZATION ---
$(function() {
    // Correctly mapped event listeners
    $('#signup-form').on('submit', handleSignup); // Fixed the name mismatch
    $('#login-form').on('submit', handleLogin);

    // Social Logins (Commented out until you are ready)
    // $('#google-login-btn').on('click', handleGoogleLogin);
    // $('#github-login-btn').on('click', handleGitHubLogin);
});