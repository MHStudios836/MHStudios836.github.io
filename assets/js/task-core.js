/* assets/js/task-core.js */
// STATUS: MERGED & SYNCHRONIZED (Form Logic + Backend Library)

import { auth, db, storage, dbID } from './firebase-init.js';
import { generateTaskID } from './id-generator.js';
import { 
    collection, addDoc, serverTimestamp, doc, updateDoc, increment, getDoc, query, where, onSnapshot 
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import { 
    ref, uploadBytes, getDownloadURL 
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-storage.js";

// =============================================================================
// PART 1: STUDENT FORM LOGIC (Service_Request_Form.html)
// =============================================================================
const btnSubmit = document.getElementById('btn-submit-request'); 

document.addEventListener('DOMContentLoaded', () => {
    if(btnSubmit) {
        btnSubmit.addEventListener('click', async (e) => {
            e.preventDefault();
            const user = auth.currentUser;
            if(!user) return alert("ACCESS DENIED. PLEASE LOGIN.");

            // 1. GATHER INTEL
            const title = document.getElementById('req-title').value;
			
			// [NEW] PROTOCOL 1: SOLVENCY CHECK
			const userDoc = await getDoc(doc(db, 'artifacts', dbID, 'users', user.uid));
			const userData = userDoc.data();
			const currentBalance = parseFloat(userData.wallet_balance) || 0;

			if (userData.role === 'student' && currentBalance < budget) {
				alert(`INSUFFICIENT FUNDS.\n\nYour Wallet: $${currentBalance.toFixed(2)}\nRequired: $${budget.toFixed(2)}\n\nPlease deposit funds to deploy this operation.`);
				btnSubmit.disabled = false;
				btnSubmit.innerHTML = 'DEPLOYMENT FAILED';
				return; // STOP EXECUTION
			}
			
            const category = document.getElementById('req-category').value;
            const budget = parseFloat(document.getElementById('req-budget').value);
			
			// [NEW] RULE: SOLVENCY CHECK
			// We read the student's wallet BEFORE generating the ID
			const userDoc = await getDoc(doc(db, 'artifacts', dbID, 'users', user.uid));
			const userData = userDoc.data();
			const currentBalance = parseFloat(userData.wallet_balance) || 0;
			
			// THE GUARD
			if (userData.role === 'student' && currentBalance < budget) {
				alert(`INSUFFICIENT FUNDS.\n\nWallet: $${currentBalance}\nRequired: $${budget}\n\nPlease Deposit Funds to Gain Trust.`);
				btnSubmit.disabled = false;
				btnSubmit.innerHTML = 'DEPLOYMENT FAILED';
				return; // STOP THE SCRIPT
			}
			
            const deadline = document.getElementById('req-deadline').value;
            const desc = document.getElementById('req-desc').value;

            if(!title || !budget) return alert("MISSING CRITICAL DATA.");

            // UI LOADING
            btnSubmit.innerHTML = '<i class="fas fa-satellite-dish fa-spin"></i> TRANSMITTING...';
            btnSubmit.disabled = true;

            try {
                // 2. GENERATE TITAN ID
                const userDoc = await getDoc(doc(db, 'artifacts', dbID, 'users', user.uid));
                const userData = userDoc.data();
                
                const titanTaskId = generateTaskID(category); 

                // 3. PUSH TO DATABASE (Correct Path)
                await addDoc(collection(db, 'artifacts', dbID, 'missions'), {
                    id: titanTaskId,               // VISUAL ID
                    title: title,
                    category: category,
                    budget: budget,
                    deadline: deadline,
                    description: desc,
                    status: "OPEN",                // Ready for Freelancers
                    studentUid: user.uid,
                    studentName: userData.displayName || "Unknown Client",
                    created_at: serverTimestamp(),
                    applicants: []
                });

                // 4. UPDATE STUDENT STATS (Total Sync!)
                await updateDoc(doc(db, 'artifacts', dbID, 'users', user.uid), {
                    "stats.tasks_created": increment(1)
                });

                // 5. SUCCESS
                alert(`OPERATION LAUNCHED: ${titanTaskId}`);
                window.location.href = "Student_Room.html";

            } catch (err) {
                console.error(err);
                alert("DEPLOYMENT FAILED: " + err.message);
                btnSubmit.innerHTML = 'RETRY LAUNCH';
                btnSubmit.disabled = false;
            }
        });
    }
});

// =============================================================================
// PART 2: FREELANCER & SYSTEM FUNCTIONS (Library)
// =============================================================================

// --- BROADCAST STATION: LOAD OPEN MISSIONS ---
export function subscribeToOpenMissions(callback) {
    const q = query(
        collection(db, 'artifacts', dbID, 'missions'), 
        where("status", "==", "OPEN")
    );
    return onSnapshot(q, (snapshot) => {
        const missions = [];
        snapshot.forEach((doc) => {
            missions.push({ id: doc.id, ...doc.data() });
        });
        callback(missions);
    });
}

// --- FREELANCER: ACCEPT MISSION ---
export async function acceptMission(missionId, freelancerUid) {
    const missionRef = doc(db, 'artifacts', dbID, 'missions', missionId);
    await updateDoc(missionRef, {
        status: "ACTIVE",
        freelancerUid: freelancerUid,
        acceptedAt: serverTimestamp()
    });
}

// --- FREELANCER: LOAD ACTIVE OPS ---
export function subscribeToActiveOps(freelancerUid, callback) {
    const q = query(
        collection(db, 'artifacts', dbID, 'missions'), 
        where("freelancerUid", "==", freelancerUid),
        where("status", "==", "ACTIVE")
    );
    return onSnapshot(q, (snapshot) => {
        const missions = [];
        snapshot.forEach((doc) => {
            missions.push({ id: doc.id, ...doc.data() });
        });
        callback(missions);
    });
}

// --- DELIVERY: UPLOAD & COMPLETE (Supports File Uploads) ---
export async function deliverMission(missionId, files) {
    const fileUrls = [];
    
    // Safety Check: Client-side MIME type validation
    const allowedTypes = ['application/pdf', 'application/zip', 'application/x-zip-compressed', 'image/png', 'image/jpeg'];
    
    for (const file of files) {
        if (!allowedTypes.includes(file.type)) {
            throw new Error(`Security Alert: File type ${file.type} is not authorized.`);
        }
        
        // Upload to Firebase Storage (Correct Path)
        const storageRef = ref(storage, `artifacts/${dbID}/deliveries/${missionId}/${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        fileUrls.push({ name: file.name, url: url });
    }

    // Update Firestore
    const missionRef = doc(db, 'artifacts', dbID, 'missions', missionId);
    await updateDoc(missionRef, {
        status: "DELIVERED",
        deliveryFiles: fileUrls,
        deliveredAt: serverTimestamp()
    });
}

// --- STUDENT: NOTIFICATIONS (Delivered Tasks) ---
export function subscribeToNotifications(studentUid, callback) {
    const q = query(
        collection(db, 'artifacts', dbID, 'missions'), 
        where("studentUid", "==", studentUid),
        where("status", "==", "DELIVERED")
    );
    return onSnapshot(q, (snapshot) => {
        const updates = [];
        snapshot.forEach((doc) => {
            updates.push({ id: doc.id, ...doc.data() });
        });
        callback(updates);
    });
}