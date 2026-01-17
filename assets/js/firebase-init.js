// assets/js/firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyATOnkG8yomjUFdKnNiPPJO24z0tF6e5wo",
    authDomain: "mhstudios-836.firebaseapp.com",
    projectId: "mhstudios-836",
    storageBucket: "mhstudios-836.firebasestorage.app",
    messagingSenderId: "172610798643",
    appId: "1:172610798643:web:eaa7b218e8efa3aee64f46",
    measurementId: "G-6EMB5KYCTK"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const dbID = "MH_Studios_Project"; // Make sure this matches your Firestore path exactly!