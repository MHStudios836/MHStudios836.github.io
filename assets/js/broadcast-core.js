import { db, dbID } from "./firebase-init.js";
import { collection, query, where, onSnapshot, orderBy } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { formatBounty, formatTacticalDate } from "./data-transformer.js"; // USING YOUR FILE

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
        const card = createBroadcastCard(data, doc.id);
        feedList.innerHTML += card;
    });
});

function createBroadcastCard(data, id) {
    // Priority Colors
    let border = "var(--bs-cyan)";
    if (data.priority === "HIGH") border = "var(--mh-orange)";
    if (data.priority === "CRITICAL") border = "var(--mh-red)";

    return `
    <div class="titan-panel" style="margin-bottom: 12px; padding: 15px; border-left: 4px solid ${border}; background: rgba(0,0,0,0.4); transition: all 0.2s;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            
            <div style="flex: 1;">
                <div style="margin-bottom: 5px;">
                    <span class="badge" style="background: rgba(255,255,255,0.1); color: #ccc;">${data.type}</span>
                    <span class="badge" style="background: ${border}; color: #000; font-weight: bold;">${data.priority || 'NORM'}</span>
                </div>
                <h3 style="margin: 0 0 5px 0; color: #fff; font-size: 1.1em;">${data.title}</h3>
                <div style="font-size: 0.8em; color: #888;">
                    <i class="fas fa-user-astronaut"></i> ${data.creatorName} &bull; 
                    <i class="fas fa-clock"></i> ${data.deadline ? new Date(data.deadline).toLocaleDateString() : 'ASAP'}
                </div>
            </div>

            <div style="text-align: right; min-width: 100px;">
                <div style="color: var(--mh-green); font-size: 1.3em; font-weight: 800;">${formatBounty(data.budget)}</div>
                
                <button class="titan-btn" style="margin-top: 8px; padding: 4px 12px; font-size: 0.8em; background: var(--bs-cyan); color: #000;" 
                    onclick="pingGlobalChat('${data.title}')">
                    <i class="fas fa-comments"></i> NEGOTIATE
                </button>
            </div>
        </div>
        
        ${data.files && data.files.length > 0 ? 
            `<div style="margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 5px; font-size: 0.8em; color: var(--mh-cyan);">
                <i class="fas fa-paperclip"></i> ${data.files.length} INTELLIGENCE FILE(S) ATTACHED
             </div>` : ''
        }
    </div>
    `;
}