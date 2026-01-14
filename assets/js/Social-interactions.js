/* assets/js/social-interactions.js */
/* STATUS: UPGRADED [LIKES | COMMENTS | SHARES] */

import { db, dbID } from './firebase-init.js';
import { 
    doc, updateDoc, arrayUnion, arrayRemove, getDoc, increment, 
    collection, addDoc, serverTimestamp, query, orderBy, onSnapshot 
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { notify } from "./notification-hub.js";

// =================================================================
// 1. LIKE SYSTEM (HEART BEAT)
// =================================================================
export async function toggleLike(collectionName, docId, userId) {
    if(!userId) return notify("ACCESS DENIED", "Please login to vote.", "warn");
    
    // Path: artifacts > MH_STUDIOS_V1 > [missions/products] > docId
    const ref = doc(db, 'artifacts', dbID, collectionName, docId);
    
    try {
        const snap = await getDoc(ref);
        if (!snap.exists()) return;

        const data = snap.data();
        const likes = data.likes || [];
        const isLiked = likes.includes(userId);

        // OPTIMISTIC UI UPDATE (Instant visual feedback)
        updateLikeUI(docId, !isLiked, likes.length + (isLiked ? -1 : 1));

        if (isLiked) {
            // UNLIKE
            await updateDoc(ref, {
                likes: arrayRemove(userId),
                likeCount: increment(-1)
            });
        } else {
            // LIKE
            await updateDoc(ref, {
                likes: arrayUnion(userId),
                likeCount: increment(1)
            });
            notify("ACKNOWLEDGED", "Vote registered.", "success");
        }
    } catch (err) {
        console.error(err);
        notify("ERROR", "Like system jamming.", "error");
        // Revert UI if failed
        updateLikeUI(docId, false, 0); 
    }
}

function updateLikeUI(id, active, count) {
    const btn = $(`#btn-like-${id}`);
    const lbl = $(`#count-like-${id}`);
    
    if(active) {
        btn.addClass('active').css('color', '#ff004c'); // Red
        btn.find('i').removeClass('far').addClass('fas');
    } else {
        btn.removeClass('active').css('color', '');
        btn.find('i').removeClass('fas').addClass('far');
    }
    lbl.text(count);
}


// =================================================================
// 2. COMMENT SYSTEM (TACTICAL COMMS)
// =================================================================
/**
 * Post a comment to a sub-collection
 */
export async function postComment(collectionName, docId, user, text) {
    if(!text.trim()) return;

    try {
        // Path: artifacts > MH_STUDIOS_V1 > [collection] > [doc] > comments > [newID]
        await addDoc(collection(db, 'artifacts', dbID, collectionName, docId, 'comments'), {
            userId: user.uid,
            userName: user.displayName || "Operative",
            text: text,
            timestamp: serverTimestamp()
        });
        
        notify("SENT", "Comment encrypted and uploaded.", "success");
    } catch (e) {
        console.error(e);
        notify("FAILURE", "Comment failed to send.", "error");
    }
}

/**
 * Load comments live
 */
export function loadComments(collectionName, docId, containerId) {
    const q = query(
        collection(db, 'artifacts', dbID, collectionName, docId, 'comments'),
        orderBy('timestamp', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const container = $(`#${containerId}`);
        container.empty();

        snapshot.forEach(doc => {
            const c = doc.data();
            const time = c.timestamp ? new Date(c.timestamp.seconds * 1000).toLocaleString() : 'Just now';
            
            container.append(`
                <div class="comment-node" style="border-bottom:1px solid #333; padding:10px; margin-bottom:5px;">
                    <div style="font-size:0.8em; color:#00e5ff; font-weight:bold;">
                        ${c.userName} <span style="color:#666; font-weight:normal;">- ${time}</span>
                    </div>
                    <div style="color:#ddd; font-size:0.9em; margin-top:5px;">${c.text}</div>
                </div>
            `);
        });
    });
}


// =================================================================
// 3. SHARE SYSTEM (GLOBAL BROADCAST)
// =================================================================
export function shareContent(title, text) {
    const shareData = {
        title: "MH Studios Intel",
        text: `${title}: ${text}`,
        url: window.location.href
    };

    if (navigator.share) {
        // Mobile Native Share
        navigator.share(shareData).catch(console.error);
    } else {
        // Desktop Clipboard Fallback
        navigator.clipboard.writeText(`${title} - ${window.location.href}`);
        notify("COPIED", "Link secured to clipboard.", "info");
    }
}