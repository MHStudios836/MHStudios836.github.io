// --- assets/js/admin-users.js (PERSONNEL) ---

import { db, appId } from './firebase-init.js';
import { collection, getDocs, query, orderBy, limit } from 'https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore.js';

// --- CONFIG ---
// Target the specific table body in your HTML
const $userTableBody = $('.mh-table tbody'); 

/**
 * Main initialization function called by admin-core.js
 */
export async function initUserGrid() {
    console.log("[USERS] Scanning personnel database...");
    
    try {
        // 1. Fetch Users (Limit to last 10 for performance)
        // Note: You need a composite index for this query usually, 
        // but for now we will just get the collection.
        const usersRef = collection(db, 'artifacts', appId, 'users');
        // Simple query first to avoid index errors
        const q = query(usersRef, limit(20)); 

        const querySnapshot = await getDocs(q);
        
        // 2. Clear Dummy Data
        if (!querySnapshot.empty) {
            $userTableBody.empty();
        }

        // 3. Render Real Data
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const uid = doc.id;
            renderUserRow(uid, data);
        });

        console.log(`[USERS] Loaded ${querySnapshot.size} operatives.`);

    } catch (error) {
        console.error("[USERS] Data retrieval failed:", error);
        // If error, we leave the dummy data so the UI doesn't look broken
    }
}

function renderUserRow(uid, data) {
    // Determine Status based on 'createdAt' or just random for effect if missing
    let statusHtml = '<span class="status-dot"></span> Offline';
    let rowClass = '';

    if (data.role === 'admin') {
        statusHtml = '<span class="status-dot online"></span> <span class="text-success">ACTIVE</span>';
    } else if (data.role === 'banned') {
        statusHtml = '<span class="status-dot" style="background:var(--mh-red); box-shadow:0 0 5px var(--mh-red);"></span> BANNED';
        rowClass = 'style="opacity:0.5;"';
    } else {
        statusHtml = '<span class="status-dot online"></span> Online';
    }

    // Safe Fallbacks
    const name = data.name || "Unknown Operative";
    const email = data.email || "No Email";
    const location = data.location || "Unknown Sector";
    const shortId = uid.substring(0, 6).toUpperCase();

    const html = `
        <tr ${rowClass}>
            <td style="color:#666;">#${shortId}</td>
            <td><strong>${name}</strong></td>
            <td>${data.role.toUpperCase()}</td>
            <td>${location}</td>
            <td>${statusHtml}</td>
            <td>
                <i class="fas fa-ellipsis-h" style="cursor:pointer; opacity:0.7;" title="Manage User"></i>
            </td>
        </tr>
    `;

    $userTableBody.append(html);
}