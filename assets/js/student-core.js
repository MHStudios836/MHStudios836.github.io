// assets/js/student-core.js
// STATUS: FINAL // PROFILE SYNC ACTIVE

import { auth, db, dbID, storage } from './firebase-init.js'; // Ensure storage is exported in init
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { 
    collection, addDoc, query, where, onSnapshot, serverTimestamp, doc, updateDoc 
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-storage.js";
import { startChatWith } from './chat-core.js'; 
import { notify } from './notification-hub.js';

let currentUser = null;

// 1. INITIALIZATION & AUTH LISTENER
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        console.log("STUDENT COMMAND: ONLINE");
        
        // A. Load Real-Time Profile Stats (Money, Rank, Level)
        loadProfileData(user.uid);

        // B. Load Missions
        loadMyMissions(user.uid);
    } else {
        window.location.href = 'DoD_Login_Style.html';
    }
});

// 2. NEW FUNCTION: LOAD PROFILE DATA (The Fix for "Level 4")
function loadProfileData(uid) {
    // Listen to the specific user document in 'users' collection
    const userRef = doc(db, 'artifacts', dbID, 'users', uid);

    onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();

            // INJECT REAL DATA (Or Default to Zero if new)
            $('#student-name').text(data.name || "OPERATIVE");
            $('#student-id').text("ID: " + uid.substring(0,6).toUpperCase());
            
            // Stats
            $('#student-rank').text(data.rank || "PRIVATE"); 
            $('#student-level').text("LVL " + (data.level || 1)); 

            // Money (Formatted)
            const balance = data.balance || 0;
            $('#student-balance').text("$" + balance.toLocaleString('en-US', {minimumFractionDigits: 2}));
        } else {
            console.log("Profile initializing...");
        }
    });
}

// 3. CREATE MISSION (BROADCAST)
$('#btn-transmit').click(async (e) => {
    e.preventDefault();
    const btn = $(e.target);
    const title = $('#req-title').val();
    const budget = $('#req-budget').val();

    if(!title || !budget) return notify("ERROR", "Missing Mission Intel", "error");

    btn.text("ENCRYPTING...").prop('disabled', true);

    try {
        await addDoc(collection(db, 'artifacts', dbID, 'missions'), {
            title: title,
            budget: Number(budget),
            deadline: $('#req-deadline').val(),
            type: $('#req-type').val(),
            description: $('#req-desc').val(),
            status: 'OPEN',
            ownerId: currentUser.uid,
            ownerName: currentUser.displayName || "Unknown Client", // Stored for Admin
            timestamp: serverTimestamp()
        });

        notify("SUCCESS", "Mission broadcast to Global Network.", "success");
        $('#req-title').val(''); // Clear form
        $('#req-budget').val('');
        
    } catch (err) {
        console.error(err);
        notify("ERROR", "Transmission blocked.", "error");
    }
    btn.text("TRANSMIT REQUEST").prop('disabled', false);
});

// 4. LOAD MY MISSIONS
function loadMyMissions(uid) {
    const q = query(
        collection(db, 'artifacts', dbID, 'missions'), 
        where("ownerId", "==", uid)
    );

    onSnapshot(q, (snapshot) => {
        const list = $('#my-mission-list');
        list.empty();

        if(snapshot.empty) {
            list.html('<div style="padding:20px; text-align:center; color:#555;">NO ACTIVE OPERATIONS</div>');
            return;
        }

        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const id = docSnap.id;
            
            // Logic for Buttons (Pay, Chat, etc)
            let actionBtn = '';
            let mercDisplay = "PENDING ASSIGNMENT";

            // Status: IN PROGRESS
            if (data.status === 'IN_PROGRESS') {
                const mercCode = data.freelancerId ? data.freelancerId.substring(0,5).toUpperCase() : "???";
                mercDisplay = `<span style="color:var(--mh-gold);">ASSIGNED: OP-${mercCode}</span>`;
                
                actionBtn = `
                    <div style="display:flex; gap:5px; margin-top:10px;">
                        <button class="btn-small" onclick="window.openComms('${data.freelancerId}')">
                            <i class="fas fa-comment-medical"></i> CHAT
                        </button>
                    </div>
                `;
            }
            // Status: REVIEW PENDING (File Uploaded)
            else if (data.status === 'REVIEW_PENDING') {
                mercDisplay = `<span style="color:var(--mh-cyan);">FILE UPLOADED</span>`;
                actionBtn = `
                    <div style="display:flex; gap:5px; margin-top:10px;">
                        <a href="${data.fileUrl}" target="_blank" class="btn-small" style="border-color:var(--mh-cyan);">DOWNLOAD</a>
                        <a href="Task_Checkout.html?id=${id}&title=${encodeURIComponent(data.title)}&price=${data.budget}&merc=${data.freelancerId}" 
                           class="btn-small" style="background:var(--mh-green); border:none; color:#000;">
                           PAY & CLOSE
                        </a>
                    </div>
                `;
            }
            // Status: COMPLETED
            else if (data.status === 'COMPLETED') {
                mercDisplay = `<span style="color:var(--mh-green);">MISSION COMPLETE</span>`;
                actionBtn = `<span style="color:#666; font-size:0.8em;">ARCHIVED</span>`;
            }

            const card = `
                <div class="mission-node">
                    <div style="display:flex; justify-content:space-between;">
                        <strong>${data.title}</strong>
                        <span style="color:var(--mh-gold);">$${data.budget}</span>
                    </div>
                    <div style="font-size:0.8em; margin-top:5px; color:#aaa;">${mercDisplay}</div>
                    ${actionBtn}
                </div>
            `;
            list.append(card);
        });
    });
}

// 5. GLOBAL ACTIONS
window.openComms = (mercId) => {
    startChatWith(mercId);
};

// 6. LOGOUT
$('#btn-logout').click(async () => {
    await signOut(auth);
    window.location.reload();
});

/* --- MISSION DEPLOYMENT LOGIC (INJECTED) --- */

let selectedFiles = [];
const fileInput = document.getElementById('task-files');
const fileListDisplay = document.getElementById('file-list');

// 1. Handle File Selection
if(fileInput) {
    fileInput.addEventListener('change', (e) => {
        selectedFiles = Array.from(e.target.files);
        fileListDisplay.innerHTML = selectedFiles.map(f => 
            `<div><i class="fas fa-file-code"></i> ${f.name} (${(f.size/1024/1024).toFixed(2)} MB)</div>`
        ).join('');
    });
}

// 2. Handle Deploy Button
document.getElementById('btn-deploy-task')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-deploy-task');
    const title = document.getElementById('task-title').value;
    const budget = document.getElementById('task-budget').value;
    
    if(!title || !budget) return notify("Mission Aborted", "Title and Budget are required.", "warn");

    try {
        btn.innerText = "UPLOADING ASSETS...";
        btn.disabled = true;
        document.getElementById('upload-progress-container').style.display = 'block';

        const uploadedFiles = [];

        // A. Upload Files to Storage
        if (selectedFiles.length > 0) {
            for (const file of selectedFiles) {
                const storageRef = ref(storage, `missions/${auth.currentUser.uid}/${Date.now()}_${file.name}`);
                const uploadTask = uploadBytesResumable(storageRef, file);

                await new Promise((resolve, reject) => {
                    uploadTask.on('state_changed', 
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            document.getElementById('upload-progress-bar').style.width = progress + "%";
                        }, 
                        (error) => reject(error), 
                        async () => {
                            const url = await getDownloadURL(uploadTask.snapshot.ref);
                            uploadedFiles.push({ name: file.name, url: url });
                            resolve();
                        }
                    );
                });
            }
        }

        // B. Save to Firestore
        btn.innerText = "TRANSMITTING DATA...";
        
        await addDoc(collection(db, 'artifacts', dbID, 'missions'), {
            title: title,
            type: document.getElementById('task-type').value,
            budget: parseFloat(budget),
            deadline: document.getElementById('task-deadline').value,
            priority: document.getElementById('task-priority').value,
            visibility: document.getElementById('task-visibility').value,
            description: document.getElementById('task-desc').value,
            status: "OPEN",
            createdBy: auth.currentUser.uid,
            creatorName: auth.currentUser.displayName || "Anonymous",
            createdAt: serverTimestamp(),
            files: uploadedFiles, // The URLs we just got
            likes: 0
        });

        notify("Success", "Mission Broadcasted to Global Network.", "success");
        btn.innerText = "DEPLOY MISSION";
        btn.disabled = false;
        // Optional: clear form logic here

    } catch (e) {
        console.error(e);
        notify("Error", "Transmission Failed: " + e.message, "error");
        btn.innerText = "RETRY DEPLOY";
        btn.disabled = false;
    }
});