import { db, dbID } from "./firebase-init.js";
import { collection, query, where, onSnapshot, orderBy } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { formatBounty, formatTacticalDate } from "./data-transformer.js"; // USING YOUR FILE
import { renderTaskCard } from './task-card-logic.js'; // Import it

// DOM
const feedList = document.getElementById('global-task-list');

// QUERY: Status OPEN, Ordered by Newest
const q = query(
    collection(db, 'artifacts', dbID, 'missions'),
    where("status", "==", "OPEN"),
    where("visibility", "==", "PUBLIC"), // Only show public
    orderBy("createdAt", "desc")
);

onSnapshot(q, (snapshot) => {
    if(snapshot.empty) {
        feedList.innerHTML = "<div style='text-align:center; padding:20px; color:#666;'>NO ACTIVE SIGNALS</div>";
        return;
    }

    feedList.innerHTML = ""; // Clear loader

    snapshot.forEach(doc => {
        const data = doc.data();
        const cardHTML = renderTaskCard(data, doc.id, 'public');
        feedList.innerHTML += cardHTML;
    });
});

/* REPLACE createBroadcastCard FUNCTION */

function createBroadcastCard(data, id) {
    // 1. DETERMINE PRIORITY CLASS
    let pClass = 'p-standard'; // Default Green
    if (data.priority === 'High') pClass = 'p-high'; // Yellow
    if (data.priority === 'Critical') pClass = 'p-critical'; // Red

    return `
    <div class="titan-card ${pClass}">
        <div class="tc-header">
            <span class="tc-id">OP-${id.substring(0,6).toUpperCase()}</span>
            <span class="tc-badge">${data.priority || 'NORM'}</span>
        </div>
        
        <div class="tc-body">
            <h3>${data.title}</h3>
            <p>${data.description.substring(0, 100)}...</p>
            <div class="tc-meta">
                <span><i class="fas fa-user"></i> ${data.clientName || 'Unknown'}</span>
                <span><i class="fas fa-clock"></i> ${data.deadline || 'ASAP'}</span>
            </div>
        </div>

        <div class="tc-footer">
            <div class="tc-price">$${data.budget}</div>
            <button class="titan-btn" style="padding: 5px 15px; font-size: 0.8em;" 
                onclick="window.location.href='Contract_Form.html?id=${id}'">
                INSPECT
            </button>
        </div>
    </div>
    `;
}