// assets/js/comms-system.js
import { db, auth, appId } from './firebase-init.js';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// 1. OPEN A CHAT CHANNEL
export async function openCommsChannel(targetUserId) {
    const currentUserId = auth.currentUser.uid;
    // Logic: Check if a chat already exists between these two IDs...
    // If not, create a new document in 'chats' collection
}

// 2. LISTEN FOR MESSAGES (Real-time)
export function listenToFrequency(chatId) {
    const messagesRef = collection(db, 'artifacts', appId, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    // onSnapshot is the magic: It runs every time the DB changes!
    onSnapshot(q, (snapshot) => {
        const chatBox = document.getElementById('chat-display');
        chatBox.innerHTML = ''; // Clear old

        snapshot.forEach((doc) => {
            const msg = doc.data();
            const isMe = msg.sender_id === auth.currentUser.uid;
            
            chatBox.innerHTML += `
                <div class="message ${isMe ? 'sent' : 'received'}">
                    <span>${msg.text}</span>
                </div>
            `;
        });
    });
}

// 3. SEND MESSAGE
export async function transmitMessage(chatId, text) {
    await addDoc(collection(db, 'artifacts', appId, 'chats', chatId, 'messages'), {
        text: text,
        sender_id: auth.currentUser.uid,
        timestamp: serverTimestamp()
    });
}