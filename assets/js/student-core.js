/* assets/js/student-core.js */
// STATUS: MERGED & SYNCHRONIZED (Profile + Banker + Task Cards)

import { auth, db, storage, dbID } from './firebase-init.js'; 
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { 
    collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, query, where, orderBy, onSnapshot 
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-storage.js";

// --- NEW IMPORT: THE UNIVERSAL CARD SYSTEM ---
import { renderTaskCard } from './task-card-logic.js'; 

let currentUser = null;

// =========================================================
// 1. INITIALIZATION & ROUTING
// =========================================================
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        console.log("STUDENT COMMAND: ONLINE");
        
        // A. Load Profile Header & Identity
        loadProfileData(user.uid);
        
        // B. Load My Posted Missions (The New Card System)
        loadMyMissions(user.uid);
        
    } else {
        // Security: Bounce to Login
        window.location.href = 'DoD_Login_Style.html'; 
    }
});

// =========================================================
// 2. MISSION DEPLOYMENT LOGIC (The Banker Compatible)
// =========================================================
const deployBtn = document.getElementById('btn-deploy-mission');
if (deployBtn) {
    deployBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        // A. Gather Intelligence (Updated Inputs)
        const title = document.getElementById('task-title').value;
        const budget = document.getElementById('task-budget').value;
        const desc = document.getElementById('task-desc').value;
        const deadline = document.getElementById('task-deadline').value;
        const location = document.getElementById('task-location').value; // NEW
        const tagsRaw = document.getElementById('task-tags').value;      // NEW
        const fileInput = document.getElementById('task-files');
		const visibility = document.getElementById('task-visibility').value;
		const targetUid = document.getElementById('target-operative-id').value;

		// LOGIC CHECK: If Private, force them to enter an ID
		if (visibility === 'PRIVATE' && !targetUid) {
			alert("COMMAND ERROR: You must specify a Target Operative ID for Classified Missions.");
			return; // Stop the code
		}

        // B. Validate
        if(!title || !budget || !desc || !deadline) return alert("MISSING INTEL. FILL ALL FIELDS.");

        // C. Process Tags (Split "Blender, 3D" into array ["Blender", "3D"])
        const tagsArray = tagsRaw ? tagsRaw.split(',').map(tag => tag.trim()) : ["General"];

        // D. UI Feedback
        deployBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> SECURING ASSETS...';
        deployBtn.disabled = true;

        try {
            // E. Upload Files (If any)
            let fileUrls = [];
            if(fileInput.files.length > 0) {
                for(const file of fileInput.files) {
                    const storageRef = ref(storage, `intel/${currentUser.uid}/${Date.now()}_${file.name}`);
                    await uploadBytes(storageRef, file);
                    const url = await getDownloadURL(storageRef);
                    fileUrls.push({ name: file.name, url: url });
                }
            }

            // F. Create Document (The Handshake)
            deployBtn.innerHTML = 'TRANSMITTING TO BANKER...';

            await addDoc(collection(db, 'artifacts', dbID, 'missions'), {
                // Core Data
                title: title,
                budget: parseFloat(budget),
                description: desc,
                deadline: deadline,
                location: location || "Remote", // New Data Point
                tags: tagsArray,                // New Data Point
                // NEW VISIBILITY LOGIC
				visibility: visibility, // 'PUBLIC' or 'PRIVATE'
				targetOperativeId: (visibility === 'PRIVATE') ? targetUid : null, // Save the ID if private
                files: fileUrls,

                // Metadata
                studentUid: currentUser.uid,
                studentName: currentUser.displayName || 'Client',
                studentRating: 5.0, // Placeholder: In future, fetch this from user profile
                createdAt: serverTimestamp(),
                
                // STATUS PROTOCOL
                status: 'PENDING_AUDIT' 
            });

            alert("MISSION SENT FOR FINANCIAL AUDIT.\nOnce funds are secured, it will go live.");
            window.location.reload();

        } catch(e) {
            console.error(e);
            alert("DEPLOYMENT FAILURE: " + e.message);
            deployBtn.innerHTML = 'RETRY DEPLOYMENT';
            deployBtn.disabled = false;
        }
    });
}

// =========================================================
// 3. PROFILE & IDENTITY SYSTEMS
// =========================================================

async function loadProfileData(uid) {
    try {
        const userRef = doc(db, 'artifacts', dbID, 'users', uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
            const data = snap.data();
            
            // 1. Update Text Info
            if(document.getElementById('user-name-display')) 
                document.getElementById('user-name-display').innerText = data.name || "Unknown Student";
            if(document.getElementById('wallet-balance')) 
                document.getElementById('wallet-balance').innerText = `$${(data.wallet_balance || 0).toFixed(2)}`;
            
            // 2. Sync Profile Images (The visual polish)
            if (data.photoURL) {
                syncProfileImages(data.photoURL);
            }
            
            // 3. Update Rank/Clearance Badges
            if (data.package_tier) {
                updateHeaderClearance(data.package_tier);
                enforceClearance(data.package_tier);
            }
        }
    } catch (e) {
        console.warn("Profile Sync Warning:", e);
    }
}

// A. The Synchronizer: Updates all avatar instances on screen
function syncProfileImages(url) {
    const mainAvatar = document.getElementById('user-avatar-img');
    const miniAvatar = document.getElementById('mini-avatar');

    if (mainAvatar) mainAvatar.src = url;
    if (miniAvatar) miniAvatar.src = url;
}

// B. The Rank Badge Logic
function updateHeaderClearance(tier) {
    const badge = document.getElementById('clearance-badge');
    const text = document.getElementById('tier-text');
    const icon = document.getElementById('tier-icon');

    if (!badge || !tier) return;

    badge.style.display = "flex";
    text.innerText = tier;
    badge.className = ""; // Reset
    
    if (tier === "Elite") {
        badge.classList.add('badge-elite');
        icon.className = "fas fa-crown";
    } else if (tier === "Commander") {
        badge.classList.add('badge-commander');
        icon.className = "fas fa-star";
    } else if (tier === "Scout") {
        badge.classList.add('badge-scout');
        icon.className = "fas fa-bolt";
    }
}

function enforceClearance(tier) {
    const eliteElements = document.querySelectorAll('.restricted-elite');
    eliteElements.forEach(el => {
        el.style.display = (tier === "Elite") ? "block" : "none";
    });
}

// =========================================================
// 4. AVATAR UPLOAD LISTENER
// =========================================================
const avatarInput = document.getElementById('avatar-upload');
if (avatarInput) {
    avatarInput.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (!file || !currentUser) return;

        try {
            // Visual Feedback
            const mainAvatar = document.getElementById('user-avatar-img');
            if(mainAvatar) mainAvatar.style.opacity = "0.5";
            console.log("UPLOADING IDENTITY...");
            
            // 1. Upload
            const storageRef = ref(storage, `avatars/${currentUser.uid}/profile_pic`);
            const snapshot = await uploadBytes(storageRef, file);
            const photoURL = await getDownloadURL(snapshot.ref);

            // 2. Update DB
            await updateDoc(doc(db, 'artifacts', dbID, 'users', currentUser.uid), {
                photoURL: photoURL
            });

            // 3. Update UI
            syncProfileImages(photoURL);
            alert("IDENTITY UPDATED SUCCESSFULLY.");

        } catch (error) {
            console.error("UPLOAD ERROR:", error);
            alert("UPLOAD FAILED: " + error.message);
        } finally {
             if(document.getElementById('user-avatar-img')) 
                document.getElementById('user-avatar-img').style.opacity = "1";
        }
    });
}

// =========================================================
// 5. MY MISSIONS MONITOR (The "Upwork" Card Logic)
// =========================================================
function loadMyMissions(userId) {
    const grid = document.getElementById('my-mission-grid'); // Ensure this ID exists in Student_Room.html
    if (!grid) return;

    // QUERY: Missions created by ME (Regardless of status)
    const q = query(
        collection(db, 'artifacts', dbID, 'missions'),
        where("studentUid", "==", userId),
        orderBy("createdAt", "desc")
    );

    onSnapshot(q, (snapshot) => {
        grid.innerHTML = "";
        
        if (snapshot.empty) {
            grid.innerHTML = "<div style='color:#666; padding:20px; text-align:center;'>NO ACTIVE OPERATIONS.</div>";
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            
            // --- THE MERGE: RENDER USING UNIVERSAL CARD ---
            // Mode 'student' hides 'Inspect' and adds 'Manage' buttons
            const cardHTML = renderTaskCard(data, doc.id, 'student');
            
            grid.innerHTML += cardHTML;
        });
    });
}