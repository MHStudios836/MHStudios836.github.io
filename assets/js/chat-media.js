/* assets/js/chat-media.js */
import { storage } from './firebase-init.js';
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-storage.js";
import { notify } from './notification-hub.js';

// ALLOWED EXTENSIONS
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/zip'];
const MAX_SIZE_MB = 10;

/**
 * PROCESS & UPLOAD FILE
 * @param {File} file - The file object from input
 * @param {string} chatId - Where to store it
 */
export async function processAndUploadMedia(file, chatId) {
    // 1. TACTICAL SCAN: Check File Type
    if (!ALLOWED_TYPES.includes(file.type)) {
        notify("SECURITY BLOCK", `File type ${file.type} is restricted.`, "error");
        return null;
    }

    // 2. TACTICAL SCAN: Check Size
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        notify("SIZE ALERT", `File exceeds ${MAX_SIZE_MB}MB limit.`, "warn");
        return null;
    }

    // 3. (PLACEHOLDER) AI SAFETY SCAN (The 75% Decision)
    // In a real production app, you would send this file to a Cloud Function 
    // that runs Google Vision API to detect nudity/violence.
    // For now, we simulate a "Clean" scan.
    const isSafe = true; 
    if(!isSafe) {
        notify("HARMFUL CONTENT", "System flag: Content violation detected.", "error");
        return null;
    }

    // 4. UPLOAD EXECUTION
    try {
        const timestamp = Date.now();
        const storageRef = ref(storage, `chat_media/${chatId}/${timestamp}_${file.name}`);
        
        notify("UPLOADING", "Encrypting and transferring asset...", "info");
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        return {
            url: downloadURL,
            type: file.type,
            name: file.name
        };
    } catch (error) {
        console.error("Upload Failed:", error);
        notify("UPLOAD FAILED", error.message, "error");
        return null;
    }
}