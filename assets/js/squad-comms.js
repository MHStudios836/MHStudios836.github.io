/* assets/js/squad-comms.js */
import { getFirestore, collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { app } from "./firebase-init.js";
import { playSound } from "./sound-engine.js";
import { formatTacticalDate } from "./data-transformer.js";

const db = getFirestore(app);
const appId = 'mhstudios-836';

/**
 * INITIALIZE COMMS CHANNEL
 * @param {string} channelId - e.g., 'global' or 'squad-alpha'
 * @param {HTMLElement} displayContainer - The chat box
 */
export function initComms(channelId, displayContainer) {
    const q = query(
        collection(db, 'artifacts', appId, 'messages'),
        orderBy('timestamp', 'desc'),
        limit(50)
    );

    // REAL-TIME LISTENER
    onSnapshot(q, (snapshot) => {
        displayContainer.innerHTML = '';
        const docs = snapshot.docs.reverse(); // Show oldest at top
        
        docs.forEach(doc => {
            const data = doc.data();
            renderMessage(displayContainer, data);
        });
        
        displayContainer.scrollTop = displayContainer.scrollHeight;
        playSound('notify'); // Radio chirp on new message
    });
}

function renderMessage(container, data) {
    const time = data.timestamp ? formatTacticalDate(data.timestamp.toDate()) : "SENDING...";
    const msgDiv = document.createElement('div');
    msgDiv.className = 'comms-entry';
    msgDiv.style.marginBottom = '10px';
    
    // Check if it's an admin message for different coloring
    const isSystem = data.role === 'admin';
    const accent = isSystem ? 'var(--mh-red)' : 'var(--mh-cyan)';

    msgDiv.innerHTML = `
        <div style="font-size: 0.65rem; color: #666;">[${time}]</div>
        <span style="color: ${accent}; font-weight: bold;">${data.sender.toUpperCase()}:</span>
        <span style="color: #eee;">${data.text}</span>
    `;
    container.appendChild(msgDiv);
}

/**
 * TRANSMIT MESSAGE
 */
export async function transmitMessage(senderName, role, text) {
    if (!text.trim()) return;
    try {
        await addDoc(collection(db, 'artifacts', appId, 'messages'), {
            sender: senderName,
            role: role,
            text: text,
            timestamp: serverTimestamp()
        });
    } catch (err) {
        console.error("COMMS_FAILURE:", err);
    }
}