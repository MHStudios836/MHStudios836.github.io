// assets/js/task-core.js
import { db, storage } from './firebase-init.js';
import { 
    collection, addDoc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { 
    ref, uploadBytes, getDownloadURL 
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-storage.js";

const missionsRef = collection(db, "missions");

// --- UPDATED: DEPLOY MISSION (Supports your detailed form) ---
export async function deployMission(studentUid, missionData, files) {
    try {
        // 1. Upload Intel Files (if any)
        let intelUrls = [];
        if (files && files.length > 0) {
            for (const file of files) {
                // Safety: Upload to a specific 'intel' folder
                const storageRef = ref(storage, `intel/${studentUid}/${Date.now()}_${file.name}`);
                await uploadBytes(storageRef, file);
                const url = await getDownloadURL(storageRef);
                intelUrls.push({ name: file.name, url: url });
            }
        }

        // 2. Create Mission Document in Firestore
        const docRef = await addDoc(missionsRef, {
            ...missionData,
            intelFiles: intelUrls, // Store file links
            studentUid: studentUid,
            status: "OPEN",
            createdAt: serverTimestamp(),
            freelancerUid: null
        });

        console.log("Mission Deployed Successfully: ", docRef.id);
        return docRef.id;
    } catch (e) {
        console.error("Deployment Error: ", e);
        throw e; // Re-throw so the UI knows it failed
    }
}

// --- 2. BROADCAST STATION: LOAD OPEN MISSIONS ---
export function subscribeToOpenMissions(callback) {
    const q = query(missionsRef, where("status", "==", "OPEN"));
    return onSnapshot(q, (snapshot) => {
        const missions = [];
        snapshot.forEach((doc) => {
            missions.push({ id: doc.id, ...doc.data() });
        });
        callback(missions);
    });
}

// --- 3. FREELANCER: ACCEPT MISSION ---
export async function acceptMission(missionId, freelancerUid) {
    const missionRef = doc(db, "missions", missionId);
    await updateDoc(missionRef, {
        status: "ACTIVE",
        freelancerUid: freelancerUid,
        acceptedAt: serverTimestamp()
    });
}

// --- 4. FREELANCER: LOAD ACTIVE OPS ---
export function subscribeToActiveOps(freelancerUid, callback) {
    const q = query(
        missionsRef, 
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

// --- 5. DELIVERY: UPLOAD & COMPLETE ---
export async function deliverMission(missionId, files) {
    const fileUrls = [];
    
    // Safety Check: Client-side MIME type validation
    const allowedTypes = ['application/pdf', 'application/zip', 'application/x-zip-compressed'];
    
    for (const file of files) {
        if (!allowedTypes.includes(file.type)) {
            throw new Error(`Security Alert: File type ${file.type} is not authorized.`);
        }
        
        // Upload to Firebase Storage
        const storageRef = ref(storage, `deliveries/${missionId}/${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        fileUrls.push({ name: file.name, url: url });
    }

    // Update Firestore
    const missionRef = doc(db, "missions", missionId);
    await updateDoc(missionRef, {
        status: "DELIVERED",
        deliveryFiles: fileUrls,
        deliveredAt: serverTimestamp()
    });
}

// --- 6. STUDENT: NOTIFICATIONS ---
export function subscribeToNotifications(studentUid, callback) {
    // Listen for missions created by this student that are now DELIVERED
    const q = query(
        missionsRef, 
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