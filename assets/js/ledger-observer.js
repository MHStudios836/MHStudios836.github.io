/* assets/js/ledger-observer.js */
import { db, DB_PATH, auth } from './firebase-init.js';
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
    if (user) {
        // --- LIVE WALLET SYNC ---
        const userRef = doc(db, `${DB_PATH}/users/${user.uid}`);
        
        onSnapshot(userRef, (doc) => {
            const data = doc.data();
            if (data && data.wallet_balance !== undefined) {
                const balanceElements = [
                    document.getElementById('wallet-balance'),
                    document.getElementById('wallet-balance-big')
                ];

                balanceElements.forEach(el => {
                    if (el) {
                        el.innerText = `$${parseFloat(data.wallet_balance).toFixed(2)}`;
                        // Tactical Visual Ping
                        el.style.color = "var(--mh-cyan)";
                        el.style.textShadow = "0 0 15px var(--mh-cyan)";
                        setTimeout(() => { 
                            el.style.color = ""; 
                            el.style.textShadow = "";
                        }, 2000);
                    }
                });
            }
        });
    }
});