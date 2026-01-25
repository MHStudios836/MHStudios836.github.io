/* assets/js/student-core.js */
// STATUS: SYNCHRONIZED WITH SECURITY RULES

import { auth, db, storage, DB_PATH } from './firebase-init.js'; 
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { 
    collection, addDoc, serverTimestamp, doc, getDoc, updateDoc 
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-storage.js";

// --- GLOBAL VARIABLES ---
let currentUser = null;

// 1. INITIALIZATION
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        console.log("STUDENT COMMAND: ONLINE");
        loadProfileData(user.uid);
    } else {
        // If not logged in, kick them out
        window.location.href = 'DoD_Login_Style.html'; 
    }
});

// 2. MISSION CREATION LOGIC
const deployBtn = document.getElementById('btn-deploy-mission');

if (deployBtn) {
    deployBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        // A. Form Validation
        const title = document.getElementById('task-title').value;
        const budget = document.getElementById('task-budget').value;
        const desc = document.getElementById('task-desc').value;
        
        if (!title || !budget || !desc) {
            alert("COMMAND ERROR: Title, Budget, and Description are required.");
            return;
        }

        deployBtn.innerText = "UPLOADING ASSETS...";
        deployBtn.disabled = true;

        try {
            // B. File Upload (Iterate through files)
            const fileInput = document.getElementById('task-files');
            let uploadedFiles = [];

            if (fileInput.files.length > 0) {
                for (let i = 0; i < fileInput.files.length; i++) {
                    const file = fileInput.files[i];
                    // Path: mission_files/User_ID/File_Name
                    const storageRef = ref(storage, `mission_files/${currentUser.uid}/${Date.now()}_${file.name}`);
                    
                    const snapshot = await uploadBytes(storageRef, file);
                    const url = await getDownloadURL(snapshot.ref);
                    uploadedFiles.push({ name: file.name, url: url });
                }
            }

            // C. Database Entry
            deployBtn.innerText = "TRANSMITTING TO HQ...";

            // CRITICAL: Uses DB_PATH to match your Security Rules
            const missionData = {
                title: title,
                type: document.getElementById('task-type').value,
                budget: parseFloat(budget),
                deadline: document.getElementById('task-deadline').value,
                priority: document.getElementById('task-priority').value,
                visibility: document.getElementById('task-visibility').value, // 'Global' or 'Private'
                description: desc,
                files: uploadedFiles,
                
                // System Metadata
                status: "OPEN", // This makes it visible to Freelancers
                client_id: currentUser.uid,
                client_email: currentUser.email,
                created_at: serverTimestamp(),
                chat_id: null // Will be generated when a Freelancer accepts
            };

            await addDoc(collection(db, `${DB_PATH}/missions`), missionData);

            // D. Success
            alert("MISSION CONFIRMED. DEPLOYMENT SUCCESSFUL.");
            window.location.reload(); // Reload to clear form and show new status

        } catch (error) {
            console.error("DEPLOYMENT FAILED:", error);
            alert("SYSTEM FAILURE: " + error.message);
            deployBtn.innerText = "RETRY DEPLOY";
            deployBtn.disabled = false;
        }
    });
}

// 3. PROFILE SYNC (Updated to include Images)
async function loadProfileData(uid) {
    try {
        const userRef = doc(db, `${DB_PATH}/users/${uid}`);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
            const data = snap.data();
            
            // Text Data
            if(document.getElementById('user-name-display')) 
                document.getElementById('user-name-display').innerText = data.name || "Unknown Student";
            if(document.getElementById('wallet-balance')) 
                document.getElementById('wallet-balance').innerText = `$${data.wallet_balance || '0.00'}`;
            
            // --- NEW: Image Data ---
            if (data.photoURL) {
                syncProfileImages(data.photoURL);
            }
			
			if (data.package_tier) {
				updateHeaderClearance(data.package_tier);
			}
        }
    } catch (e) {
        console.warn("Profile Sync Warning:", e);
    }
	
	// Inside your existing loadProfileData function
	if (data.package_tier) {
		const badgeEl = document.getElementById('user-badge-display');
		if (badgeEl) {
			badgeEl.innerText = `${data.package_tier} OPERATIVE`;
			// Add a gold glow if they are Gold Tier
			if (data.package_tier === 'GOLD') badgeEl.style.color = 'var(--mh-gold)';
		}
	}
}

// --- 4. PROFILE IDENTITY MODULE (Added per Request) ---

// A. The Synchronizer: Updates all avatar instances on screen
function syncProfileImages(url) {
    const mainAvatar = document.getElementById('user-avatar-img');
    const miniAvatar = document.getElementById('mini-avatar');

    // Update Main Sidebar Avatar
    if (mainAvatar) mainAvatar.src = url;
    
    // Update Menu Overlay Avatar
    if (miniAvatar) miniAvatar.src = url;
}

// B. The Listener: Watch for file selection
const avatarInput = document.getElementById('avatar-upload');

if (avatarInput) {
    avatarInput.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Security Check
        if (!currentUser) {
            alert("ACCESS DENIED: No Operative Signed In.");
            return;
        }

        try {
            // Visual Feedback (Optional: dim image to show loading)
            const mainAvatar = document.getElementById('user-avatar-img');
            if(mainAvatar) mainAvatar.style.opacity = "0.5";

            console.log("UPLOADING IDENTITY...");
            
            // 1. Upload to Firebase Storage
            // Path: avatars/USER_ID/profile.jpg
            const storageRef = ref(storage, `avatars/${currentUser.uid}/profile_pic`);
            const snapshot = await uploadBytes(storageRef, file);
            
            // 2. Get the new secure URL
            const photoURL = await getDownloadURL(snapshot.ref);

            // 3. Update User Profile in Firestore
            const userRef = doc(db, `${DB_PATH}/users/${currentUser.uid}`);
            await updateDoc(userRef, {
                photoURL: photoURL
            });

            // 4. Update Screens
            syncProfileImages(photoURL);
            alert("IDENTITY UPDATED SUCCESSFULLY.");

        } catch (error) {
            console.error("UPLOAD ERROR:", error);
            alert("UPLOAD FAILED: " + error.message);
        } finally {
             // Reset opacity
             const mainAvatar = document.getElementById('user-avatar-img');
             if(mainAvatar) mainAvatar.style.opacity = "1";
        }
    });
}

// --- 5. DASHBOARD LOGIC (Tasks & Chat) ---

// A. LOAD MISSIONS
window.loadMissions = async function() {
    const container = document.getElementById('mission-feed-container');
    if(!container) return;

    container.innerHTML = '<div style="text-align:center; padding:20px;"><i class="fas fa-spinner fa-spin"></i> SCANNING...</div>';

    try {
        // Query: Get missions where client_id == Current User
        // Note: You need a composite index in Firebase for this specific query sometimes
        const q = query(collection(db, `${DB_PATH}/missions`), where("client_id", "==", currentUser.uid), orderBy("created_at", "desc"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            container.innerHTML = '<div style="text-align:center; color:#666; padding:20px;">NO ACTIVE MISSIONS FOUND.</div>';
            return;
        }

        let html = '';
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const statusColor = data.status === 'Active' ? 'var(--mh-green)' : (data.status === 'Pending' ? 'orange' : '#666');
            const statusClass = data.status === 'Active' ? 'status-active' : 'status-pending';

            html += `
            <div class="mission-card ${statusClass}" onclick="openMissionDetails('${doc.id}')">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <strong style="color:#fff;">${data.title}</strong>
                    <span style="color:${statusColor}; font-size:0.8em; border:1px solid ${statusColor}; padding:2px 8px; border-radius:4px;">${data.status}</span>
                </div>
                <div style="font-size:0.8em; color:#888;">
                    <i class="fas fa-calendar-alt"></i> Deadline: ${data.deadline || 'N/A'} &bull; 
                    <i class="fas fa-coins"></i> Budget: $${data.budget || '0'}
                </div>
            </div>
            `;
        });
        container.innerHTML = html;

    } catch (error) {
        console.error("Error loading missions:", error);
        container.innerHTML = `<div style="color:red; text-align:center;">ERROR RETRIEVING DATA</div>`;
    }
}

// B. CHAT LOGIC (Simplified)
// 1. Send Message
document.getElementById('btn-send-chat')?.addEventListener('click', async () => {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text || !currentChatID) return; // 'currentChatID' needs to be set when selecting a channel

    try {
        await addDoc(collection(db, `${DB_PATH}/chats/${currentChatID}/messages`), {
            text: text,
            senderId: currentUser.uid,
            timestamp: serverTimestamp()
        });
        input.value = ''; // Clear input
    } catch (e) {
        console.error("Send Error:", e);
    }
});

/**
 * RECOGNITION PROTOCOL: HEADER BADGE
 * Manifests the subscription tier beside the Logo.
 */
function updateHeaderClearance(tier) {
    const badge = document.getElementById('clearance-badge');
    const text = document.getElementById('tier-text');
    const icon = document.getElementById('tier-icon');

    if (!badge || !tier) return;

    badge.style.display = "flex";
    text.innerText = tier;

    // Reset classes
    badge.className = ""; 
    
    // Assign Identity
    if (tier === "Elite") {
        badge.classList.add('badge-elite');
        icon.className = "fas fa-crown"; // Elite Icon
    } else if (tier === "Commander") {
        badge.classList.add('badge-commander');
        icon.className = "fas fa-star"; // Commander Icon
    } else if (tier === "Scout") {
        badge.classList.add('badge-scout');
        icon.className = "fas fa-bolt"; // Scout Icon
    }
}

/* Add this to the bottom of assets/js/student-core.js */

function enforceClearance(tier) {
    // Select all elements that require ELITE status
    const eliteElements = document.querySelectorAll('.restricted-elite');
    
    eliteElements.forEach(el => {
        if (tier === "Elite") {
            el.style.display = "block"; // or 'flex'
        } else {
            el.style.display = "none";
        }
    });
}

// Note: To make the Chat fully functional, you need a function that lists 
// the user's active missions in the sidebar, and when clicked, 
// sets 'currentChatID' and starts an 'onSnapshot' listener for messages.