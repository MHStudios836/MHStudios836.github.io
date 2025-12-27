// --- assets/js/admin-products.js (INVENTORY CONTROL) ---

import { db, appId } from './firebase-init.js';
import { collection, getDocs, limit, query, where } from 'https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore.js';

// UI Reference
const $terminal = $('#live-terminal');

/**
 * Initialize Product Scan
 */
export async function initProducts() {
    logToTerminal("Scanning Inventory Databases...");

    try {
        const productsRef = collection(db, 'artifacts', appId, 'products');
        // Fetch up to 50 items
        const q = query(productsRef, limit(50));
        
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            logToTerminal("[WARN] Inventory Empty. No artifacts found.");
            return;
        }

        const count = snapshot.size;
        logToTerminal(`[SUCCESS] Inventory Synced. ${count} items loaded.`);

        // In the future, this is where we render the "Products Table"
        // snapshot.forEach(doc => { ...render logic... });

    } catch (error) {
        console.error("Product Sync Failed:", error);
        logToTerminal(`[ERR] Inventory Sync Failed: ${error.message}`);
    }
}

/**
 * Helper to write to the dashboard terminal
 */
function logToTerminal(msg) {
    const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
    // Check if terminal exists before appending
    if ($terminal.length) {
        $terminal.append(`<div class="log-line"><span style="color:#555;">[${time}]</span> ${msg}</div>`);
        $terminal.scrollTop($terminal[0].scrollHeight);
    }
}