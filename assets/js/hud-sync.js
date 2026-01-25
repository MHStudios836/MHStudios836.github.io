/* assets/js/hud-sync.js */
import { auth, db, dbID } from './firebase-init.js';
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

export function initHUDSync() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("HUD UPLINK ESTABLISHED FOR:", user.uid);
            
            // Watch the specific operative's document
            const userRef = doc(db, 'artifacts', dbID, 'users', user.uid);

            onSnapshot(userRef, (snap) => {
                if (snap.exists()) {
                    const data = snap.data();
                    
                    // 1. UPDATE WALLET (Real-time)
                    const walletEl = document.getElementById('hud-wallet');
                    if (walletEl) {
                        const balance = data.wallet_balance || 0;
                        walletEl.innerText = `$${balance.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
                        walletEl.classList.add('pulse-blue'); // Optional CSS animation
                        setTimeout(() => walletEl.classList.remove('pulse-blue'), 1000);
                    }

                    // 2. UPDATE COMBAT XP / RANK
                    const rankEl = document.getElementById('hud-rank');
                    const xpEl = document.getElementById('hud-xp');
                    if (rankEl) rankEl.innerText = (data.rank || "OPERATIVE").toUpperCase();
                    if (xpEl) xpEl.innerText = `${data.combat_xp || 0} XP`;
                }
            });
        }
    });
}