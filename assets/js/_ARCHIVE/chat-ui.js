/* assets/js/chat-ui.js */
import { notify } from './notification-hub.js';

// --- DOM ELEMENTS ---
const elements = {
    feed: document.getElementById('chat-feed'),
    sidebar: document.querySelector('.chat-sidebar'),
    main: document.querySelector('.chat-main'),
    contactList: document.querySelector('.contact-list'),
    input: document.querySelector('#chat-message-input')
};

// --- RENDER FUNCTIONS ---

export function renderContactItem(chatId, otherUser, lastMsg, isActive) {
    const activeClass = isActive ? 'active' : '';
    // Tactical "Typing" or "Status" indicator logic could go here
    return `
        <div class="contact-item ${activeClass}" onclick="window.selectChat('${chatId}')">
            <div class="c-avatar" style="background-image: url('${otherUser.avatar || 'images/user_placeholder.png'}'); background-size:cover;"></div>
            <div class="c-info">
                <div>${otherUser.name}</div>
                <span>${lastMsg || "Encrypted Channel Ready"}</span>
            </div>
        </div>
    `;
}

export function renderMessage(msg, isMe) {
    const alignClass = isMe ? 'sent' : 'received';
    const time = new Date(msg.timestamp?.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    // Check if it's media or text
    let contentHtml = `<div class="msg-bubble">${msg.text}</div>`;
    
    if (msg.type === 'image') {
        contentHtml = `<div class="msg-bubble media"><img src="${msg.mediaUrl}" style="max-width:200px; border-radius:4px;"></div>`;
    } else if (msg.type === 'file') {
        contentHtml = `<div class="msg-bubble media"><a href="${msg.mediaUrl}" target="_blank" style="color:var(--mh-cyan);"><i class="fas fa-file-download"></i> ${msg.fileName}</a></div>`;
    }

    return `
        <div class="msg ${alignClass}">
            ${contentHtml}
            <span class="msg-time">${time}</span>
        </div>
    `;
}

// --- UI MANAGERS ---

export function scrollToBottom() {
    if(elements.feed) {
        elements.feed.scrollTop = elements.feed.scrollHeight;
    }
}

export function toggleMobileChat(showChat) {
    // Standard "WhatsApp" Mobile Logic
    if (window.innerWidth < 980) {
        if (showChat) {
            elements.sidebar.style.display = 'none';
            elements.main.style.display = 'flex';
        } else {
            elements.sidebar.style.display = 'flex';
            elements.main.style.display = 'none';
        }
    }
}