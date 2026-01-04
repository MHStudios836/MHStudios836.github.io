/* assets/js/social-interactions.js - ENGAGEMENT ENGINE */
import { getFirestore, doc, updateDoc, arrayUnion, arrayRemove, getDoc, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { app } from "./firebase-init.js";
import { playSound } from "./sound-engine.js";
import { notify } from "./notification-hub.js";

const db = getFirestore(app);
const appId = 'mhstudios-836';

/**
 * TOGGLE LIKE ON A MISSION/PROJECT
 * @param {string} collectionName - 'missions' or 'projects'
 * @param {string} docId - The ID of the item
 * @param {string} userId - The current user's ID
 */
export async function toggleLike(collectionName, docId, userId) {
    const ref = doc(db, 'artifacts', appId, collectionName, docId);
    
    try {
        const snapshot = await getDoc(ref);
        if (!snapshot.exists()) return;

        const data = snapshot.data();
        const likes = data.likes || [];
        const isLiked = likes.includes(userId);

        if (isLiked) {
            // UNLIKE logic
            await updateDoc(ref, {
                likes: arrayRemove(userId),
                likeCount: increment(-1)
            });
            updateLikeButton(docId, false);
        } else {
            // LIKE logic
            await updateDoc(ref, {
                likes: arrayUnion(userId),
                likeCount: increment(1)
            });
            playSound('notify'); // Satisfying 'blip' sound
            updateLikeButton(docId, true);
        }
    } catch (err) {
        console.error("INTERACTION ERROR:", err);
        notify("Error", "Like system jamming. Retrying...", "error");
    }
}

/**
 * MARK INTEREST (For Freelancers claiming a task)
 */
export async function toggleInterest(docId, userId) {
    const ref = doc(db, 'artifacts', appId, 'missions', docId);
    // Logic similar to likes, but adds to an 'interestedUsers' array
    // This allows the Admin to see who wants the job
    try {
        await updateDoc(ref, {
            interestedOperatives: arrayUnion(userId)
        });
        playSound('granted');
        notify("Interest Registered", "The Admin has been notified.", "success");
        
        // Update UI to show "PENDING"
        $(`#btn-interest-${docId}`).text("INTEREST SENT").addClass('disabled');
    } catch (err) {
        notify("System Error", "Could not register interest.", "error");
    }
}

// UI HELPER
function updateLikeButton(id, isActive) {
    const btn = $(`#btn-like-${id}`);
    const countSpan = $(`#count-like-${id}`);
    let currentCount = parseInt(countSpan.text()) || 0;

    if (isActive) {
        btn.addClass('active').css('color', 'var(--mh-red)');
        btn.find('i').removeClass('far').addClass('fas'); // Solid heart
        countSpan.text(currentCount + 1);
    } else {
        btn.removeClass('active').css('color', 'inherit');
        btn.find('i').removeClass('fas').addClass('far'); // Outline heart
        countSpan.text(currentCount - 1);
    }
}