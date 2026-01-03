// assets/js/admin-users.js
// STATUS: SYNCED [VERSION 10.7.1]

import { db, dbID } from './firebase-init.js';
import { collection, getDocs, query, limit } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const $userTableBody = $('.mh-table tbody'); // Ensure your HTML table has this class

export async function initUserGrid() {
    console.log("[USERS] Scanning personnel database...");
    
    try {
        const usersRef = collection(db, 'artifacts', dbID, 'users');
        const q = query(usersRef, limit(20)); 

        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty && $userTableBody.length) {
            $userTableBody.empty(); // Clear dummy data
        }

        querySnapshot.forEach((doc) => {
            renderUserRow(doc.id, doc.data());
        });

        console.log(`[USERS] Loaded ${querySnapshot.size} operatives.`);

    } catch (error) {
        console.error("[USERS] Data retrieval failed:", error);
    }
}

function renderUserRow(uid, data) {
    if (!$userTableBody.length) return;

    let statusHtml = '<span class="status-dot online"></span> Online';
    let rowClass = '';

    if (data.role === 'admin') {
        statusHtml = '<span style="color:var(--mh-gold)">COMMANDER</span>';
    } else if (data.role === 'banned') {
        statusHtml = '<span style="color:var(--mh-red)">REVOKED</span>';
        rowClass = 'style="opacity:0.5;"';
    }

    const name = data.name || "Unknown Operative";
    const email = data.email || "No Email";
    const role = data.role ? data.role.toUpperCase() : "UNKNOWN";
    const shortId = uid.substring(0, 6).toUpperCase();

    const html = `
        <tr ${rowClass}>
            <td style="color:#666;">#${shortId}</td>
            <td><strong>${name}</strong></td>
            <td>${role}</td>
            <td>${email}</td>
            <td>${statusHtml}</td>
        </tr>
    `;
    $userTableBody.append(html);
}