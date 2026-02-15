/* assets/js/active-mission-core.js */
// STATUS: MERGED (Chat + Uploads + Capitalism Revision Engine)

import { auth, db, storage, dbID } from './firebase-init.js';
import { 
    doc, onSnapshot, updateDoc, arrayUnion, serverTimestamp, collection, addDoc, query, orderBy, limit, getDoc, increment, runTransaction 
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-storage.js";

const urlParams = new URLSearchParams(window.location.search);
const missionId = urlParams.get('id');

// =========================================================
// 1. INITIALIZATION & ROUTING
// =========================================================
if(missionId) {
    console.log(`[ACTIVE OPS] LINKED TO MISSION: ${missionId}`);
    initMissionData(missionId);     // Loads Title, Status, & REVISION LOGIC
    initChatSystem(missionId);      // Starts Chat
    initDeliverableSystem(missionId); // Starts File Uploads
}

// =========================================================
// 2. MISSION HEADER & REVISION HOOK
// =========================================================
// REPLACE your existing initMissionData function with this UPGRADED version:

async function initMissionData(mid) {
    const docSnap = await getDoc(doc(db, `artifacts/${dbID}/missions/${mid}`));
    
    if(docSnap.exists()) {
        const data = docSnap.data();
        
        // A. Update Basic UI
        if(document.getElementById('m-title')) document.getElementById('m-title').innerText = data.title;
        if(document.getElementById('m-status')) {
            const badge = document.getElementById('m-status');
            badge.innerText = `STATUS: ${data.status}`;
            badge.style.color = data.status === 'ACTIVE' ? '#00ff41' : '#ffae00';
        }

        // --- NEW: FETCH IDENTITIES (THE ID SYSTEM) ---
        fetchIdentity(data.studentUid, 'client');
        
        if(data.freelancerUid) {
            fetchIdentity(data.freelancerUid, 'merc');
        } else {
            // No freelancer yet
            document.getElementById('merc-id-display').innerText = "PENDING ASSIGNMENT";
            document.getElementById('merc-id-display').style.color = "#666";
            document.getElementById('merc-name-display').innerText = "WAITING FOR ACCEPTANCE";
        }

        // C. TRIGGER REVISION SYSTEM
        initRevisionSystem(data, mid);
    }
}

// --- HELPER FUNCTION: THE ID FETCH SYSTEM ---
// --- HELPER FUNCTION: THE ID FETCH SYSTEM (UPGRADED) ---
async function fetchIdentity(uid, type) {
    if(!uid) return;

    try {
        const userSnap = await getDoc(doc(db, `artifacts/${dbID}/users/${uid}`));
        if(userSnap.exists()) {
            const uData = userSnap.data();
            
            // 1. GET SERIAL ID
            const serialID = uData.titanId || uData.studentId || "UNREGISTERED";
            
            // 2. CLASSIFIED NAME LOGIC (First Name Only)
            // "Yuri Boyka" -> "Yuri [CLASSIFIED]"
            const fullName = uData.displayName || "Unknown";
            const firstName = fullName.split(' ')[0]; 
            const classifiedName = `${firstName.toUpperCase()} <span style="color:#444; font-size:0.8em;">// CLASSIFIED</span>`;

            // 3. ROLE COLOR CODING (Titan Protocol)
            let color = "#fff"; // Default
            switch(uData.role) {
                case 'student':    color = "#0080ff"; break; // Neon Blue
                case 'freelancer': color = "#ffae00"; break; // Plasma Orange
                case 'contractor': color = "#ffd700"; break; // Gold
                case 'admin':      color = "#00ff41"; break; // Green
                case 'operative':  color = "#ff004c"; break; // Red
            }

            // 4. RENDER TO UI
            const idEl = document.getElementById(`${type}-id-display`);
            const nameEl = document.getElementById(`${type}-name-display`);

            if(idEl) {
                idEl.innerText = serialID;
                idEl.style.color = color;
                idEl.style.textShadow = `0 0 10px ${color}40`; // 40 is opacity for glow
            }

            if(nameEl) {
                nameEl.innerHTML = classifiedName;
            }
        }
    } catch(e) {
        console.error("ID FETCH ERROR:", e);
    }
}

// =========================================================
// 3. SECURE COMMS (Chat System)
// =========================================================
function initChatSystem(mid) {
    const chatRef = collection(db, `artifacts/${dbID}/chats/${mid}/messages`);
    const q = query(chatRef, orderBy('timestamp', 'asc'), limit(50));

    // LISTENER
    onSnapshot(q, (snapshot) => {
        const chatBox = document.getElementById('chat-history');
        if(!chatBox) return;

        chatBox.innerHTML = '';
        snapshot.forEach(doc => {
            const msg = doc.data();
            const isMe = auth.currentUser && msg.senderId === auth.currentUser.uid;
            
            chatBox.innerHTML += `
                <div class="msg-row ${isMe ? 'msg-me' : 'msg-target'}">
                    <div class="msg-bubble">
                        <div class="msg-meta">${msg.senderName}</div>
                        <div class="msg-text">${msg.text}</div>
                    </div>
                </div>
            `;
        });
        chatBox.scrollTop = chatBox.scrollHeight; 
    });

    // SENDER
    document.getElementById('btn-send-chat')?.addEventListener('click', async () => {
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        if(!text) return;

        try {
            await addDoc(chatRef, {
                text: text,
                senderId: auth.currentUser.uid,
                senderName: auth.currentUser.displayName || "Operative",
                timestamp: serverTimestamp()
            });
            input.value = "";
        } catch(e) {
            alert("COMMS JAMMED: " + e.message);
        }
    });
}

// =========================================================
// 4. SUPPLY DROP (File Uploads)
// =========================================================
function initDeliverableSystem(mid) {
    // A. LISTEN FOR FILE UPDATES (Real-time List)
    onSnapshot(doc(db, `artifacts/${dbID}/missions/${mid}`), (docSnap) => {
        const data = docSnap.data();
        const list = document.getElementById('deliverable-list');
        
        if(list && data.deliverables) {
            list.innerHTML = ""; // Clear
            data.deliverables.forEach(file => {
                list.innerHTML += `
                    <div class="file-item">
                        <span><i class="fas fa-file-archive"></i> ${file.name}</span>
                        <a href="${file.url}" target="_blank"><i class="fas fa-download"></i> OPEN</a>
                    </div>
                `;
            });
        }
    });

    // B. HANDLE UPLOAD
    const fileInput = document.getElementById('file-upload-input');
    const uploadBtn = document.getElementById('btn-upload-file');
    
    if(uploadBtn) {
        uploadBtn.addEventListener('click', async () => {
            if(!fileInput.files[0]) return alert("NO PAYLOAD SELECTED.");

            const file = fileInput.files[0];
            uploadBtn.innerHTML = "UPLOADING...";
            uploadBtn.disabled = true;

            try {
                // Upload
                const storageRef = ref(storage, `artifacts/${dbID}/missions/${mid}/${file.name}`);
                await uploadBytes(storageRef, file);
                const url = await getDownloadURL(storageRef);

                // Link
                const missionRef = doc(db, `artifacts/${dbID}/missions/${mid}`);
                await updateDoc(missionRef, {
                    deliverables: arrayUnion({
                        name: file.name,
                        url: url,
                        uploadedAt: new Date().toISOString(),
                        uploader: auth.currentUser.displayName
                    }),
                    status: "IN_REVIEW" 
                });

                alert("PAYLOAD DELIVERED.");
                // Note: No reload needed because onSnapshot updates the list automatically now
                uploadBtn.innerHTML = '<i class="fas fa-upload"></i> UPLOAD ASSETS';
                uploadBtn.disabled = false;
                fileInput.value = ""; // Clear input

            } catch(e) {
                console.error(e);
                alert("UPLOAD FAILED.");
                uploadBtn.innerHTML = '<i class="fas fa-upload"></i> UPLOAD ASSETS';
                uploadBtn.disabled = false;
            }
        });
    }
}

// =========================================================
// 5. REVISION LOGIC (The Capitalism Engine)
// =========================================================
function initRevisionSystem(data, mid) {
    const revCount = data.revision_count || 0;
    const maxFree = 3;
    const revCost = 10.00; // Cost per extra revision

    const counterEl = document.getElementById('rev-counter');
    const reviseBtn = document.getElementById('btn-revise');

    // 1. UPDATE UI COUNTER
    if(counterEl) {
        counterEl.innerText = `REVISIONS: ${revCount}/${maxFree}`;
        if(revCount >= maxFree) {
            counterEl.innerText += " (PAID MODE)";
            counterEl.style.color = "var(--mh-gold)";
        }
    }

    // 2. BUTTON LOGIC GATE
    if(reviseBtn) {
        
        // --- CASE A: CAPITALISM MODE (Pay $10) ---
        if(revCount >= maxFree) {
            // Style the button to look "Premium"
            reviseBtn.style.border = "1px solid var(--mh-gold)";
            reviseBtn.style.color = "var(--mh-gold)";
            reviseBtn.innerHTML = `<i class="fas fa-coins"></i> BUY REVISION ($${revCost})`;
            
            reviseBtn.onclick = async () => {
                const reason = prompt(`PREMIUM REVISION ($${revCost})\n\nYou have used your free revisions.\nThis will deduct $${revCost} from your wallet and add it to the Mission Budget.\n\nState your requirements:`);
                if(!reason) return;

                if(!confirm(`CONFIRM TRANSACTION:\nPay $${revCost} for Revision #${revCount + 1}?`)) return;

                reviseBtn.innerHTML = "PROCESSING PAYMENT...";
                reviseBtn.disabled = true;

                try {
                    await executePaidRevision(mid, reason, revCost);
                    alert("PAYMENT CONFIRMED. REVISION ORDERED.");
                    location.reload();
                } catch(e) {
                    console.error(e);
                    alert("TRANSACTION FAILED: " + e.message);
                    reviseBtn.disabled = false;
                    reviseBtn.innerHTML = `<i class="fas fa-coins"></i> BUY REVISION ($${revCost})`;
                }
            };
        } 
        
        // --- CASE B: STANDARD MODE (Free) ---
        else {
            reviseBtn.onclick = async () => {
                const reason = prompt(`REVISION REQUEST (${revCount + 1}/${maxFree})\n\nState your specific changes:`);
                if(!reason) return;

                reviseBtn.innerHTML = "TRANSMITTING...";
                reviseBtn.disabled = true;

                try {
                    const missionRef = doc(db, `artifacts/${dbID}/missions/${mid}`);
                    await updateDoc(missionRef, {
                        status: "REVISION_REQUESTED",
                        revision_reason: reason,
                        revision_count: increment(1),
                        last_updated: serverTimestamp()
                    });
                    
                    // Chat Log
                    await addDoc(collection(db, `artifacts/${dbID}/chats/${mid}/messages`), {
                        text: `[SYSTEM]: REVISION #${revCount + 1} REQUESTED.\nREASON: "${reason}"`,
                        senderName: "TITAN AI",
                        senderId: "SYSTEM",
                        timestamp: serverTimestamp()
                    });

                    alert("ORDER SENT.");
                    location.reload();
                } catch(e) {
                    alert("ERROR: " + e.message);
                    reviseBtn.disabled = false;
                }
            };
        }
    }
}

// 6. THE MONEY MOVER (Helper Function)
async function executePaidRevision(mid, reason, cost) {
    const missionRef = doc(db, `artifacts/${dbID}/missions/${mid}`);
    const userRef = doc(db, `artifacts/${dbID}/users/${auth.currentUser.uid}`);
    
    await runTransaction(db, async (t) => {
        // A. Check Wallet
        const userDoc = await t.get(userRef);
        const currentBal = parseFloat(userDoc.data().wallet_balance) || 0;
        
        if(currentBal < cost) throw new Error(`INSUFFICIENT FUNDS. Balance: $${currentBal}`);

        // B. Deduct from Student
        t.update(userRef, { 
            wallet_balance: increment(-cost) 
        });

        // C. Add to Mission Budget (Incentivize the Freelancer!)
        t.update(missionRef, {
            budget: increment(cost), 
            status: "REVISION_REQUESTED",
            revision_reason: reason,
            revision_count: increment(1),
            last_updated: serverTimestamp()
        });
    });

    // E. Log Chat (Post-Transaction)
    await addDoc(collection(db, `artifacts/${dbID}/chats/${mid}/messages`), {
        text: `[SYSTEM]: PREMIUM REVISION PURCHASED ($${cost}).\nBUDGET INCREASED.\nREASON: "${reason}"`,
        senderName: "TITAN PAYMENTS",
        senderId: "SYSTEM",
        timestamp: serverTimestamp()
    });
}