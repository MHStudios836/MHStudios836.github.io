/* assets/js/global-alert-ticker.js */
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { app } from "./firebase-init.js";

const db = getFirestore(app);
const appId = 'mhstudios-836';

/**
 * INITIALIZE GLOBAL BROADCAST
 * Places a scrolling ticker at the very top of the screen.
 */
export function initGlobalTicker() {
    // 1. Create the Ticker DOM elements if they don't exist
    if (!document.getElementById('mh-ticker-wrap')) {
        const wrap = document.createElement('div');
        wrap.id = 'mh-ticker-wrap';
        wrap.innerHTML = `<div class="ticker-content" id="ticker-text">INITIALIZING UPLINK...</div>`;
        document.body.prepend(wrap); // Put it at the very top
    }

    const tickerText = document.getElementById('ticker-text');
    const tickerWrap = document.getElementById('mh-ticker-wrap');

    // 2. Listen for Commands from the Nerve Center
    const alertRef = doc(db, 'artifacts', appId, 'system', 'alerts');
    
    onSnapshot(alertRef, (doc) => {
        if (doc.exists()) {
            const data = doc.data();
            
            if (data.active) {
                // Show the ticker
                tickerWrap.style.display = 'block';
                tickerText.innerHTML = `<span class="alert-prefix">${data.type || 'SYSTEM'}:</span> ${data.message.toUpperCase()}`;
                
                // Color Coding based on urgency
                if (data.level === 'critical') {
                    tickerWrap.style.borderBottom = '2px solid var(--mh-red)';
                    tickerText.style.color = 'var(--mh-red)';
                } else if (data.level === 'profit') {
                    tickerWrap.style.borderBottom = '2px solid var(--mh-gold)'; // Money Alert
                    tickerText.style.color = 'var(--mh-gold)';
                } else {
                    tickerWrap.style.borderBottom = '2px solid var(--mh-cyan)';
                    tickerText.style.color = 'var(--mh-cyan)';
                }

            } else {
                // Hide if Admin turns it off
                tickerWrap.style.display = 'none';
            }
        }
    });
}