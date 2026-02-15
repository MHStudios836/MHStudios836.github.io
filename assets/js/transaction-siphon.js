/* assets/js/transaction-siphon.js */
// STATUS: CLIENT-SIDE TRANSACTION ENGINE (DIRECT SIPHON)
// REPLACES: Cloud Function Dependency

import { db, dbID, auth } from './firebase-init.js';
import { 
    doc, runTransaction, serverTimestamp, increment 
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

/**
 * PROCESS MISSION PAYOUT
 * Moves funds from Student -> Admin Vault (Escrow) -> Closes Mission
 */
export async function processMissionPayout(missionId, mercId, amount) {
    const amountVal = parseFloat(amount);
    
    // SAFETY CHECK: Ensure User is Logged In
    if (!auth.currentUser) throw new Error("SECURITY ALERT: NO ACTIVE SESSION.");

    // REFERENCES
    // 1. The Mission Document
    const missionRef = doc(db, 'artifacts', dbID, 'missions', missionId);
    // 2. The Admin Vault (Revenue Stream)
    const vaultRef = doc(db, 'artifacts', dbID, 'system', 'vault');
    // 3. The Student's Wallet (The Payer)
    const studentRef = doc(db, 'artifacts', dbID, 'users', auth.currentUser.uid);
	const userDoc = await getDoc(doc(db, 'artifacts', dbID, 'users', auth.currentUser.uid));
    // [NEW] PROTOCOL 3B: CONTRACTOR FEE
    // We must fetch the user role to apply the fee
    const userSnap = await getDoc(studentRef); // We read this inside transaction usually, but reading here for the check
    const userRole = userSnap.data().role;
    
    let finalAmount = amountVal;
    
    if (userRole === 'contractor') {
        finalAmount += 10.00;
        console.log("VIP CONTRACTOR FEE APPLIED: +$10.00");
    }
    
    // NOTE: To pay the freelancer directly, you would uncomment this:
    // const mercRef = doc(db, 'artifacts', dbID, 'users', mercId);

    try {
        await runTransaction(db, async (transaction) => {
            
            // 1. CHECK STUDENT BALANCE (Read First)
            const studentDoc = await transaction.get(studentRef);
            if (!studentDoc.exists()) throw "User profile corrupted.";
            
            const currentBalance = parseFloat(studentDoc.data().wallet_balance || 0);
            if (currentBalance < amountVal) throw "INSUFFICIENT FUNDS. PLEASE DEPOSIT.";

            // 2. CHECK MISSION STATUS (Read Second)
            const mDoc = await transaction.get(missionRef);
            if (!mDoc.exists()) throw "Mission Log Not Found!";
            if (mDoc.data().status === "COMPLETED") throw "Mission already closed!";

            // 3. EXECUTE TRANSFER (Writes)
            
            // A. Deduct from Student & Update Stats
            transaction.update(studentRef, {
                wallet_balance: currentBalance - finalAmount,
                "stats.tasks_completed": increment(1) // Syncs the "12 Completed" card in Student Room // Use finalAmount, not amountVal
            });

            // B. Close Mission & Record Payout
            transaction.update(missionRef, {
                status: "COMPLETED",
                completed_at: serverTimestamp(),
                final_payout: amountVal
            });

            // C. Add to Admin Vault (Escrow/Revenue)
            const vaultDoc = await transaction.get(vaultRef);
            const currentRev = vaultDoc.exists() ? (parseFloat(vaultDoc.data().total_revenue) || 0) : 0;

            transaction.set(vaultRef, {
                total_revenue: currentRev + amountVal,
                last_update: serverTimestamp()
            }, { merge: true });
        });

        console.log("SIPHON COMPLETE: FUNDS SECURED.");
        return true; // Signal Success to UI

    } catch (e) {
        console.error("SIPHON JAMMED:", e);
        throw e; // Pass error back to Task_Checkout.html to show alert
    }
}

