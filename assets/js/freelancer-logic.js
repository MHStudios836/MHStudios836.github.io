/* assets/js/freelancer-logic.js */
// STATUS: MERGED & UNIFIED (New Cards + Notifications + Profile + HUD)

import { auth, db, dbID } from './firebase-init.js';
import { 
    collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, orderBy, arrayRemove 
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-storage.js";

// --- NEW: IMPORT THE UNIVERSAL CARD SYSTEM ---
import { renderTaskCard } from './task-card-logic.js'; 

const storage = getStorage();

// =========================================================
// 1. THE NERVOUS SYSTEM INITIALIZER (Main Entry Point)
// =========================================================
export function initConnectedSystem(userId) {
    console.log(`[NERVOUS SYSTEM] Connecting to User ID: ${userId}...`);
    
    // A. SETUP UI TRIGGERS (Notifications & Avatar)
    setupNotificationListeners(); 
    setupAvatarTriggers(userId);

    // B. START THE NEW ENGINES (Card Logic)
    startLiveOps(userId);       // Active Contracts (Green)
    initFreelancerSystem();     // Marketplace (Open Jobs)

    // C. START THE "BRAIN" LISTENER (Real-time Profile Data)
    onSnapshot(doc(db, "users", userId), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // REFLEX 1: SYNC AVATAR IMAGE
            if (data.photoURL) {
                updateAllAvatars(data.photoURL);
            }
            
            // REFLEX 2: SYNC NAME
            if (data.displayName) {
                const nameEl = document.getElementById('merc-name');
                if(nameEl) nameEl.innerText = data.displayName;
            }

            // REFLEX 3: RANK CHECK (The Operator Button)
            if (data.unlocked_features && data.unlocked_features.apply_operator === true) {
                const btnContainer = document.getElementById('operator-upgrade-container');
                if (btnContainer && btnContainer.style.display === 'none') {
                    btnContainer.classList.add('animate-unlock');
                    // Optional: Play sound if available
                    // playSound('rank_unlock'); 
                }
            }

            // REFLEX 4: NOTIFICATIONS (The HUD)
            if (data.notifications && data.notifications.length > 0) {
                updateNotificationPanel(data.notifications);
                
                // Show Toast for each new notification then clear it from 'new' status
                // (In a real app, you might flag them as 'seen' instead of removing)
                data.notifications.forEach(note => {
                    // Only show HUD if it's very recent (simple check) or just show all
                    showHUDNotification(note.title, note.message);
                });
            } else {
                updateNotificationPanel([]);
            }
        }
    });
}

// =========================================================
// 2. THE NEW ENGINE: LIVE OPS (Active Contracts)
// =========================================================
function startLiveOps(userId) {
    const grid = document.getElementById('active-ops-grid');
    if (!grid) return; 

    // QUERY: Missions Assigned to Me + Active
    const q = query(
        collection(db, 'artifacts', dbID, 'missions'),
        where("freelancerUid", "==", userId),
        where("status", "==", "ACTIVE")
    );

    onSnapshot(q, (snapshot) => {
        grid.innerHTML = ""; // Clear list

        if (snapshot.empty) {
            grid.innerHTML = `
                <div style="text-align:center; padding:40px; color:#666; border:1px dashed #333;">
                    <i class="fas fa-satellite-dish" style="font-size:2em; margin-bottom:10px;"></i><br>
                    NO ACTIVE CONTRACTS. STANDING BY.
                </div>`;
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            // USE THE NEW UNIVERSAL CARD (Mode: 'freelancer' shows DELIVER button)
            const cardHTML = renderTaskCard(data, doc.id, 'freelancer');
            grid.innerHTML += cardHTML;
        });
    });
}

// =========================================================
// 3. THE OLD ENGINE: MARKETPLACE (Available Jobs)
// =========================================================
export function initFreelancerSystem() {
    const marketGrid = document.querySelector('#panel-market .merc-card-container');
    if(!marketGrid) return;

    const q = query(
        collection(db, 'artifacts', dbID, 'missions'),
        where("status", "==", "OPEN"),
        orderBy("createdAt", "desc")
    );

    onSnapshot(q, (snapshot) => {
        marketGrid.innerHTML = "";
        
        if(snapshot.empty) {
            marketGrid.innerHTML = "<div style='padding:20px; color:#666; text-align:center;'>NO OPEN CONTRACTS AVAILABLE.</div>";
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            // USE THE NEW UNIVERSAL CARD (Mode: 'public' shows INSPECT button)
            const cardHTML = renderTaskCard(data, doc.id, 'public'); 
            marketGrid.innerHTML += cardHTML;
        });
    });
}

// =========================================================
// 4. NOTIFICATION LOGIC (The Bell & Panel)
// =========================================================
function setupNotificationListeners() {
    const alertBtn = document.getElementById('btn-alerts');
    const markReadBtn = document.getElementById('btn-mark-read');

    // Wire up the Bell
    if (alertBtn) {
        alertBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            const panel = document.getElementById('notification-dropdown');
            if (panel) panel.classList.toggle('active');
        });
    }

    // Wire up the "Mark All Read" button
    if (markReadBtn) {
        markReadBtn.addEventListener('click', markAllRead);
    }

    // Global Click to Close Panel
    window.addEventListener('click', (e) => {
        const wrapper = document.querySelector('.notification-wrapper');
        const panel = document.getElementById('notification-dropdown');
        if (wrapper && !wrapper.contains(e.target) && panel) {
            panel.classList.remove('active');
        }
    });
}

async function markAllRead() {
    if(!auth.currentUser) return;
    try {
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
            notifications: [] 
        });
    } catch(e) {
        console.error("Could not clear notifications", e);
    }
}

function updateNotificationPanel(notifs) {
    const list = document.getElementById('notif-list');
    const badge = document.getElementById('notif-badge');
    const dateSpan = document.getElementById('notif-last-update');
    
    if(!list || !badge) return;

    // Update Date
    if(dateSpan) dateSpan.innerText = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // Update Badge
    if (notifs.length > 0) {
        badge.innerText = notifs.length > 9 ? "9+" : notifs.length;
        badge.style.display = "block";
    } else {
        badge.style.display = "none";
        list.innerHTML = `<div style="padding: 20px; text-align: center; color: #666; font-size: 0.8em;">NO NEW INTEL</div>`;
        return;
    }

    // Generate HTML for List
    let html = '';
    [...notifs].reverse().forEach(n => {
        let icon = 'fa-info-circle';
        let typeClass = 'type-system';
        
        if (n.title.includes('System') || n.title.includes('Update')) {
            icon = 'fa-gear';
            typeClass = 'type-system';
        } else if (n.title.includes('Mission') || n.title.includes('Task')) {
            icon = 'fa-satellite-dish';
            typeClass = 'type-broadcast';
        } else if (n.title.includes('Message') || n.title.includes('Student')) {
            icon = 'fa-comment-alt';
            typeClass = 'type-chat';
        }

        html += `
        <a href="${n.link || '#'}" class="notif-item ${typeClass}">
            <i class="fas ${icon}"></i>
            <div>
                <span class="ni-title">${n.title}</span>
                <span class="ni-msg">${n.message}</span>
            </div>
        </a>
        `;
    });

    list.innerHTML = html;
}

// =========================================================
// 5. PROFILE & AVATAR ACTIONS
// =========================================================
function setupAvatarTriggers(userId) {
    const fileInput = document.getElementById('avatar-input-trigger') || document.getElementById('avatar-upload');
    const profileCardAvatar = document.querySelector('.profile-avatar-container');
    const navbarAvatar = document.querySelector('#menu-overlay .avatar'); 
    const mainAvatar = document.getElementById('merc-avatar');

    // Helper to trigger click
    const trigger = () => fileInput && fileInput.click();

    // Attach Listeners
    if (profileCardAvatar) profileCardAvatar.addEventListener('click', trigger);
    if (navbarAvatar) navbarAvatar.addEventListener('click', trigger);
    if (mainAvatar) mainAvatar.addEventListener('click', trigger);

    // File Upload Logic
    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            showHUDNotification("UPLOADING", "Encrypting bio-metric data...");

            try {
                // Upload to Firebase Storage
                const storageRef = ref(storage, `avatars/${userId}/${Date.now()}_${file.name}`);
                const snap = await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(snap.ref);

                // Update Firestore Profile
                await updateDoc(doc(db, "users", userId), {
                    photoURL: downloadURL
                });

                showHUDNotification("SUCCESS", "Profile Identity Updated.");
            } catch (error) {
                console.error("Upload Failed:", error);
                showHUDNotification("ERROR", "Upload Failed. Check Console.");
            }
        });
    }
}

function updateAllAvatars(url) {
    document.querySelectorAll('img').forEach(img => {
        if (img.closest('.profile-avatar-container') || img.closest('.avatar') || img.id === 'merc-avatar' || img.classList.contains('user-avatar-img')) {
            img.src = url;
        }
    });
}

// =========================================================
// 6. HUD UTILITIES (Toasts)
// =========================================================
function showHUDNotification(title, message) {
    const container = document.getElementById('hud-toast-container') || document.body;
    
    // Create container if missing (Safety fallback)
    if (container === document.body && !document.getElementById('hud-toast-container')) {
        const div = document.createElement('div');
        div.id = 'hud-toast-container';
        div.style.position = 'fixed';
        div.style.bottom = '20px';
        div.style.right = '20px';
        div.style.zIndex = '9999';
        document.body.appendChild(div);
    }
    
    const target = document.getElementById('hud-toast-container');
    const toast = document.createElement('div');
    toast.className = 'hud-toast';
    // Ensure you have CSS for .hud-toast, or add inline style here:
    toast.style.background = 'rgba(0, 0, 0, 0.9)';
    toast.style.borderLeft = '4px solid #00ff41';
    toast.style.padding = '15px';
    toast.style.marginBottom = '10px';
    toast.style.color = '#fff';
    toast.innerHTML = `<strong style="color:#00ff41">[${title}]</strong><br>${message}`;
    
    target.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

// Make globally available
window.acceptContract = (id) => {
    window.location.href = `Contract_Form.html?id=${id}`;
};
window.markAllRead = markAllRead;
window.toggleNotificationPanel = () => {
    const panel = document.getElementById('notification-dropdown');
    if(panel) panel.classList.toggle('active');
};