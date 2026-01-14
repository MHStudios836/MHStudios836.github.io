/* assets/js/chat-core.js */
import { db, auth, dbID } from './firebase-init.js';
import { 
    collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, doc, setDoc, updateDoc, getDoc 
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { renderContactItem, renderMessage, scrollToBottom, toggleMobileChat } from './chat-ui.js';
import { processAndUploadMedia } from './chat-media.js';
import { notify } from './notification-hub.js';

let currentChatId = null;
let unsubscribeMessages = null;

// 1. INITIALIZE ENGINE
export function initChatSystem() {
    console.log("CHAT ENGINE: INITIALIZING...");
    const user = auth.currentUser;
    if(!user) return;

    loadSidebar(user.uid);
    
    // Global Window Assignments for HTML onclick events
    window.selectChat = (chatId) => loadChatMessages(chatId);
    window.triggerSend = () => sendMessage();
    window.triggerUpload = () => document.getElementById('chat-file-input').click();
    window.handleFileSelect = (e) => handleUpload(e);
    window.closeMobileChat = () => toggleMobileChat(false);
}

// 2. SIDEBAR LOGIC (Traffic Router)
function loadSidebar(userId) {
    const listEl = document.querySelector('.contact-list');
    
    // Listen for chats where I am a participant
    const q = query(
        collection(db, 'artifacts', dbID, 'chats'),
        where('participants', 'array-contains', userId),
        orderBy('lastMessageTime', 'desc')
    );

    onSnapshot(q, (snapshot) => {
        listEl.innerHTML = "";
        snapshot.forEach(docSnap => {
            const chat = docSnap.data();
            // In a real app, 'otherUser' data would be fetched from the 'users' collection based on ID
            // Here we assume basic data is stored in the chat doc for speed
            const otherUser = { 
                name: chat.names ? chat.names[chat.names.indexOf(chat.names.find(n => n !== auth.currentUser.displayName))] : "Unknown Agent", 
                avatar: null 
            }; 
            
            const isActive = (docSnap.id === currentChatId);
            listEl.innerHTML += renderContactItem(docSnap.id, otherUser, chat.lastMessage, isActive);
        });
    });
}

// 3. MESSAGE FEED LOGIC (The Core Logic)
function loadChatMessages(chatId) {
    currentChatId = chatId;
    const feed = document.getElementById('chat-feed');
    
    // UI Update
    toggleMobileChat(true); // Switch view on mobile
    feed.innerHTML = '<div style="text-align:center; padding:20px; color:#666;"><i class="fas fa-satellite-dish fa-spin"></i> ESTABLISHING UPLINK...</div>';

    if (unsubscribeMessages) unsubscribeMessages();

    const q = query(
        collection(db, 'artifacts', dbID, 'chats', chatId, 'messages'),
        orderBy('timestamp', 'asc')
    );

    unsubscribeMessages = onSnapshot(q, (snapshot) => {
        feed.innerHTML = "";
        snapshot.forEach(docSnap => {
            const msg = docSnap.data();
            const isMe = msg.senderId === auth.currentUser.uid;
            feed.innerHTML += renderMessage(msg, isMe);
        });
        scrollToBottom();
    });
}

// 4. SENDING LOGIC (Traffic Control)
/* IN assets/js/chat-core.js */

// 1. SECURITY ALGORITHM
function detectLeakage(text) {
    const content = text.toLowerCase();
    
    // PATTERNS (Phone, Email, Domains)
    const phonePattern = /(\+|00)[0-9]{1,3}|0[0-9]{9,}/g; // Detects international or local numbers
    const emailPattern = /\S+@\S+\.\S+/;
    const domainPattern = /\.(com|net|org|io|me)\b/;
    
    // FORBIDDEN KEYWORDS
    const forbidden = [
        "whatsapp", "telegram", "discord", "insta", "instagram", 
        "phone", "call me", "text me", "email me", "contact me", 
        "gmail", "yahoo", "hotmail", "outlook", "pay", "paypal", "cashapp"
    ];

    // CHECK 1: KEYWORDS
    for (let word of forbidden) {
        if (content.includes(word)) return "FORBIDDEN KEYWORD DETECTED: " + word.toUpperCase();
    }

    // CHECK 2: PATTERNS
    if (phonePattern.test(text.replace(/\s/g, ''))) return "PHONE NUMBER DETECTED"; // Remove spaces to catch "0 7 9..."
    if (emailPattern.test(text)) return "EMAIL ADDRESS DETECTED";
    if (domainPattern.test(text)) return "EXTERNAL LINK DETECTED";

    return null; // CLEAN
}

// 2. SECURE SEND FUNCTION
async function sendMessage() {
    const input = document.getElementById('chat-message-input');
    const text = input.value.trim();
    
    if (!text || !currentChatId) return;

    // --- SECURITY CHECK ---
    const violation = detectLeakage(text);
    if (violation) {
        // Play Error Sound
        alert(`SECURITY BLOCK: ${violation}.\n\nSharing contact information is a violation of Terms. Your account has been flagged.`);
        return; // STOP EXECUTION
    }
    // ----------------------

    try {
        input.value = ""; 
        
        await addDoc(collection(db, 'artifacts', dbID, 'chats', currentChatId, 'messages'), {
            text: text,
            type: 'text',
            senderId: auth.currentUser.uid,
            timestamp: serverTimestamp()
        });

        await updateDoc(doc(db, 'artifacts', dbID, 'chats', currentChatId), {
            lastMessage: text,
            lastMessageTime: serverTimestamp()
        });
        
    } catch (e) {
        console.error(e);
        notify("TRANSMISSION ERROR", "Message failed to send.", "error");
    }
}

// 5. UPLOAD HANDLER (Bridge to Media Vault)
async function handleUpload(event) {
    const file = event.target.files[0];
    if(!file || !currentChatId) return;

    const result = await processAndUploadMedia(file, currentChatId);
    
    if(result) {
        // Send a message containing the media
        await addDoc(collection(db, 'artifacts', dbID, 'chats', currentChatId, 'messages'), {
            text: "Sent an attachment",
            type: result.type.startsWith('image/') ? 'image' : 'file',
            mediaUrl: result.url,
            fileName: result.name,
            senderId: auth.currentUser.uid,
            timestamp: serverTimestamp()
        });
        notify("UPLOAD COMPLETE", "Asset transferred successfully.", "success");
    }
    
    // Reset input
    event.target.value = ''; 
}