// assets/js/admin-products.js
// STATUS: SYNCED [VERSION 10.7.1]

import { db, dbID } from './firebase-init.js';
import { collection, getDocs, limit, query } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const $terminal = $('#live-terminal');

function logToTerminal(msg) {
    const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
    if ($terminal.length) {
        $terminal.prepend(`<div class="log-entry"><span class="log-time">[${time}]</span> ${msg}</div>`);
    } else {
        console.log(msg);
    }
}

export async function initProducts() {
    logToTerminal("SCANNING ARMORY DATABASE...");

    try {
        // Correct Path: artifacts > MH_STUDIOS_V1 > products
        const productsRef = collection(db, 'artifacts', dbID, 'products');
        const q = query(productsRef, limit(50));
        
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            logToTerminal("[WARN] ARMORY EMPTY. NO ASSETS FOUND.");
            return;
        }

        const count = snapshot.size;
        logToTerminal(`[SUCCESS] ARMORY SYNCED. ${count} ASSETS LOADED.`);
        
        // If you have a table for products, you can render it here
        // renderProductTable(snapshot);

    } catch (error) {
        console.error("Product Sync Failed:", error);
        logToTerminal(`[ERR] SYNC FAILED: ${error.message}`);
    }
}