/* assets/js/notification-hub.js */

// Create the container on the fly if it doesn't exist
const createContainer = () => {
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        document.body.appendChild(container);
    }
    return container;
};

/**
 * TRIGGER TACTICAL NOTIFICATION
 * @param {string} title - Header text (e.g., "SYSTEM", "SECURITY", "CONTRACT")
 * @param {string} message - The main body text
 * @param {string} type - 'info', 'warn', 'error', 'success'
 * @param {number} duration - How long to stay on screen (ms)
 */
export function notify(title, message, type = 'info', duration = 5000) {
    const container = createContainer();
    
    // Icon Logic
    const icons = {
        info: 'fa-info-circle',
        warn: 'fa-exclamation-triangle',
        error: 'fa-radiation',
        success: 'fa-check-double'
    };

    const toast = document.createElement('div');
    toast.className = `mh-notification ${type}`;
    
    toast.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <div class="mh-notification-content">
            <h5>${title.toUpperCase()}</h5>
            <p>${message}</p>
        </div>
    `;

    container.appendChild(toast);

    // Trigger Slide-in
    setTimeout(() => toast.classList.add('show'), 100);

    // Auto-remove
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500);
    }, duration);
}

import { playSound } from './sound-engine.js'; // Import the engine

export function notify(title, message, type = 'info', duration = 5000) {
    const container = createContainer();
    
    // ... (rest of your existing logic) ...

    container.appendChild(toast);
    
    // --- TACTICAL AUDIO TRIGGER ---
    playSound('notify'); 

    setTimeout(() => toast.classList.add('show'), 100);
    // ...
}