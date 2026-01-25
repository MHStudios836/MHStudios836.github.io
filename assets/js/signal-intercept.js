/* assets/js/signal-intercept.js */
import { db, dbID } from './firebase-init.js';
import { collection, query, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

export function initSignalIntercept() {
    // SECURITY CHECK: Ensure only the Leader can run this
    if (!window.hasIntelClearance) {
        console.error(">> CRITICAL: UNAUTHORIZED INTERCEPT ATTEMPT DETECTED.");
        return;
    }

    const feed = document.getElementById('intercept-feed');
    
    // THE MASTER QUERY: Listen to EVERY message in the artifacts tree
    const q = query(
        collection(db, 'artifacts', dbID, 'chats'), 
        orderBy('timestamp', 'desc'), 
        limit(100)
    );

    onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
                const msg = change.doc.data();
                renderInterceptedPacket(msg);
            }
        });
    });
}

function renderInterceptedPacket(msg) {
    const feed = document.getElementById('intercept-feed');
    const time = msg.timestamp ? msg.timestamp.toDate().toLocaleTimeString() : "NOW";
    
    const packet = document.createElement('div');
    packet.className = 'intercept-packet';
    packet.innerHTML = `
        <div style="border-left: 2px solid #0080FF; padding-left: 10px; margin-bottom: 10px; background: rgba(0,128,255,0.05);">
            <span style="color: #666;">[${time}]</span> 
            <span style="color: var(--mh-cyan);">SOURCE:</span> ${msg.senderName} 
            <span style="color: var(--mh-cyan);">CHANNEL:</span> ${msg.chatId || 'GLOBAL'}
            <p style="margin: 5px 0; color: #fff;">> ${msg.text}</p>
        </div>
    `;
    
    feed.prepend(packet);
}