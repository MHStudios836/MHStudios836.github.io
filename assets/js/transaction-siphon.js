/* assets/js/transaction-siphon.js */
import { getFirestore, doc, runTransaction, serverTimestamp, arrayUnion } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { app } from "./firebase-init.js";
import { notify } from "./notification-hub.js";
import { playSound } from "./sound-engine.js";

const db = getFirestore(app);
const appId = 'mhstudios-836';

// CONFIGURATION
const TAX_RATE = 0.20; // The Warlord's Cut (20%)

/**
 * EXECUTE PAYMENT SIPHON
 * Triggers when a Student releases funds for a completed mission.
 * * @param {string} missionId - The Mission Document ID
 * @param {string} freelancerId - The Mercenary getting paid
 * @param {number} totalAmount - The Budget (e.g., 500.00)
 */
export async function processMissionPayment(missionId, freelancerId, totalAmount) {
    const amount = parseFloat(totalAmount);
    const adminCut = Number((amount * TAX_RATE).toFixed(2));
    const freelancerNet = Number((amount - adminCut).toFixed(2));

    const missionRef = doc(db, 'artifacts', appId, 'missions', missionId);
    const freelancerRef = doc(db, 'artifacts', appId, 'users', freelancerId);
    const vaultRef = doc(db, 'artifacts', appId, 'system', 'vault'); // YOUR WALLET
    const logRef = doc(db, 'artifacts', appId, 'financials', `TX_${Date.now()}`);

    console.log(`SIPHONING FUNDS... TOTAL: $${amount} | CUT: $${adminCut} | MERC: $${freelancerNet}`);

    try {
        await runTransaction(db, async (transaction) => {
            // 1. Verify Mission is still unpaid
            const missionDoc = await transaction.get(missionRef);
            if (!missionDoc.exists()) throw "Mission does not exist!";
            if (missionDoc.data().paymentStatus === 'PAID') throw "Funds already released!";

            // 2. Pay the Mercenary
            transaction.update(freelancerRef, {
                balance: (missionDoc.data().balance || 0) + freelancerNet, // Add to withdrawable balance
                totalEarnings: (missionDoc.data().totalEarnings || 0) + freelancerNet
            });

            // 3. Fill the Warlord's Vault
            transaction.set(vaultRef, {
                totalRevenue: (await getVaultBalance(transaction, vaultRef)) + adminCut,
                lastDeposit: serverTimestamp()
            }, { merge: true });

            // 4. Mark Mission as Paid
            transaction.update(missionRef, {
                status: 'COMPLETED',
                paymentStatus: 'PAID',
                closedDate: serverTimestamp()
            });

            // 5. Create Financial Log (The Paper Trail)
            transaction.set(logRef, {
                type: 'MISSION_PAYOUT',
                missionId: missionId,
                gross: amount,
                adminTax: adminCut,
                netPayout: freelancerNet,
                timestamp: serverTimestamp()
            });
        });

        // SUCCESS
        playSound('granted'); // Or a 'ching' sound if you have it
        notify("Transaction Secure", `Funds Released. Tax Siphoned: $${adminCut}`, "success");
        return true;

    } catch (e) {
        console.error("SIPHON JAMMED:", e);
        notify("Payment Error", e.toString(), "error");
        return false;
    }
}

// Helper to safely get vault balance inside transaction
async function getVaultBalance(t, ref) {
    const doc = await t.get(ref);
    return doc.exists() ? (doc.data().totalRevenue || 0) : 0;
}