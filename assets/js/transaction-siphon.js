/* assets/js/transaction-siphon.js */
/* STATUS: ACTIVE // FINANCIAL CORE */

import { db, dbID } from './firebase-init.js';
import { doc, runTransaction, serverTimestamp, increment } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const TAX_RATE = 0.20; // 20% Tax goes to MH Studios

/**
 * PROCESS MISSION PAYOUT (Split Payment)
 * 1. Takes money from Student (Simulation)
 * 2. Adds Net Pay to Freelancer's Wallet
 * 3. Adds Tax to Admin Vault
 * 4. Marks Mission as COMPLETED (Hiding it from feeds)
 */
export async function processMissionPayout(missionId, freelancerId, totalAmount) {
    const amount = parseFloat(totalAmount);
    const adminShare = Number((amount * TAX_RATE).toFixed(2));
    const freelancerShare = Number((amount - adminShare).toFixed(2));

    const missionRef = doc(db, 'artifacts', dbID, 'missions', missionId);
    const freelancerRef = doc(db, 'artifacts', dbID, 'users', freelancerId);
    const vaultRef = doc(db, 'artifacts', dbID, 'system', 'vault');

    try {
        await runTransaction(db, async (transaction) => {
            // 1. UPDATE FREELANCER WALLET
            transaction.update(freelancerRef, {
                balance: increment(freelancerShare),
                xp: increment(500) // Bonus XP for completion
            });

            // 2. UPDATE ADMIN VAULT
            transaction.update(vaultRef, {
                balance: increment(adminShare),
                totalRevenue: increment(adminShare)
            });

            // 3. CLOSE MISSION (This removes it from Broadcast/Student feeds)
            transaction.update(missionRef, {
                status: 'COMPLETED', // Changing status hides it from 'OPEN' queries
                paymentStatus: 'PAID',
                closedAt: serverTimestamp(),
                finalPayout: freelancerShare,
                adminTax: adminShare
            });
        });

        console.log(`[FINANCE] Payout Complete. Tax Siphoned: $${adminShare}`);
        return true;
    } catch (e) {
        console.error("[FINANCE] Transaction Failed:", e);
        throw e;
    }
}

/**
 * RECORD PRODUCT SALE (Armory)
 */
export async function recordProductSale(productId, price, buyerId) {
    const productRef = doc(db, 'artifacts', dbID, 'products', productId);
    const vaultRef = doc(db, 'artifacts', dbID, 'system', 'vault');

    try {
        await runTransaction(db, async (transaction) => {
            // 1. Add money to Vault
            transaction.update(vaultRef, {
                balance: increment(price),
                totalRevenue: increment(price)
            });

            // 2. Increment Product Sales Counter
            transaction.update(productRef, {
                salesCount: increment(1)
            });
        });
        return true;
    } catch (e) {
        console.error("[FINANCE] Product Sale Error:", e);
        return false;
    }
}