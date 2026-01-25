/* assets/js/admin-finance-spy.js */
import { db, DB_PATH } from './firebase-init.js';
import { collection, query, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

export function initGlobalFinanceMonitor() {
    const txRef = collection(db, `${DB_PATH}/transactions`);
    const q = query(txRef, orderBy("timestamp", "desc"), limit(10));

    onSnapshot(q, (snapshot) => {
        const adminFeed = document.getElementById('admin-revenue-feed');
        if (!adminFeed) return;

        let html = '';
        snapshot.forEach((doc) => {
            const tx = doc.data();
            const color = tx.type === "DEPOSIT" ? "var(--mh-green)" : "var(--mh-red)";
            html += `
                <div class="log-entry" style="border-left: 2px solid ${color}; padding: 10px; margin-bottom: 5px; font-size: 0.8em;">
                    [${tx.type}] Operative ${tx.user_id.slice(0,5)}...: ${tx.amount} USD
                </div>
            `;
        });
        adminFeed.innerHTML = html;
    });
}