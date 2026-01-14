/* assets/js/login-core.js */
import { auth, db, dbID } from './firebase-init.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup 
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// DOM ELEMENTS
const form = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passInput = document.getElementById('password');
const btnSubmit = document.getElementById('btn-submit');
const errorMsg = document.getElementById('login-error');
const googleBtn = document.getElementById('btn-google');

// ROUTING MATRIX
const DASHBOARDS = {
    'admin': 'Admin_Room.html',
    'student': 'Student_Room.html',
    'freelancer': 'Freelancers_Room.html'
};

// 1. LOGIN HANDLER
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value;
    const password = passInput.value;

    setLoading(true);

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        await routeUser(userCredential.user);
    } catch (error) {
        console.error(error);
        showError("ACCESS DENIED: " + error.message);
        setLoading(false);
    }
});

// 2. GOOGLE LOGIN HANDLER
googleBtn.addEventListener('click', async () => {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        await routeUser(result.user);
    } catch (error) {
        console.error(error);
        showError("GOOGLE LINK FAILED: " + error.message);
    }
});

// 3. THE ROUTER (CRITICAL LOGIC)
async function routeUser(user) {
    const uid = user.uid;
    const userRef = doc(db, 'artifacts', dbID, 'users', uid);
    
    try {
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            // User exists, check rank
            const role = userSnap.data().role || 'student';
            console.log(`IDENTITY CONFIRMED: ${role.toUpperCase()}`);
            window.location.href = DASHBOARDS[role];
        } else {
            // New User? Initialize as Student (Cow) by default
            console.log("NEW ENTITY DETECTED. REGISTERING AS STUDENT...");
            await setDoc(userRef, {
                email: user.email,
                name: user.displayName || "New Operative",
                role: 'student', // Default Role
                createdAt: serverTimestamp(),
                balance: 0,
                isOnline: true
            });
            window.location.href = DASHBOARDS['student'];
        }
    } catch (err) {
        showError("DATABASE CONNECTION FAILURE");
        setLoading(false);
    }
}

// UI UTILS
function setLoading(isLoading) {
    if(isLoading) {
        btnSubmit.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> VERIFYING...';
        btnSubmit.disabled = true;
    } else {
        btnSubmit.innerHTML = 'INITIATE SESSION';
        btnSubmit.disabled = false;
    }
}

function showError(msg) {
    errorMsg.innerText = msg;
    errorMsg.style.display = 'block';
}