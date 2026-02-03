/* assets/js/finance-core.js */
// STATUS: UPGRADED TO v12.7.0 [MATCHING SYSTEM CORE]

import { db, DB_PATH } from './firebase-init.js';
// UPDATED CDN LINKS TO 12.7.0
import { 
    doc, collection, runTransaction, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// --- THE BANK VAULT ENGINE ---

/**
 * DEPOSIT FUNDS (The "Top Up")
 * Adds money to user wallet and creates a ledger record.
 */
export async function depositFunds(uid, amount, method, cardLast4) {
    const userRef = doc(db, `${DB_PATH}/users/${uid}`);
    const txRef = collection(db, `${DB_PATH}/transactions`);

    try {
        await runTransaction(db, async (transaction) => {
            // 1. Get current user data (Locking the document)
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) throw "User does not exist!";

            const currentBalance = Number(userDoc.data().wallet_balance) || 0;
            const newBalance = currentBalance + Number(amount);

            // 2. Write to Ledger (Create Transaction Record)
            const newTx = doc(txRef); // Generate ID
            transaction.set(newTx, {
                user_id: uid,
                type: "DEPOSIT",
                amount: Number(amount),
                method: method,
                status: "COMPLETED",
                timestamp: serverTimestamp(),
                description: `Deposit via ${method} (..${cardLast4})`
            });

            // 3. Update Wallet (Unlock and write)
            transaction.update(userRef, { 
                wallet_balance: newBalance 
            });
        });

        console.log("FUNDS SECURED. BALANCE UPDATED.");
        return true;

    } catch (e) {
        console.error("TRANSACTION FAILED:", e);
        throw e;
    }
}

/**
 * MISSION ESCROW (The "Freeze")
 * Deducts money from Student and holds it until mission complete.
 */
export async function escrowFunds(uid, amount, missionId) {
    const userRef = doc(db, `${DB_PATH}/users/${uid}`);
    const txRef = collection(db, `${DB_PATH}/transactions`);

    try {
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) throw "User missing";

            const currentBalance = Number(userDoc.data().wallet_balance) || 0;
            if (currentBalance < amount) {
                throw "INSUFFICIENT FUNDS"; // Stop the transaction!
            }

            const newBalance = currentBalance - Number(amount);

            // Create "HOLD" Record
            const newTx = doc(txRef);
            transaction.set(newTx, {
                user_id: uid,
                type: "MISSION_ESCROW",
                amount: -Number(amount), // Negative because it leaves the wallet
                status: "HELD",
                reference_id: missionId,
                timestamp: serverTimestamp(),
                description: `Funds held for Mission #${missionId}`
            });

            // Deduct Balance
            transaction.update(userRef, { wallet_balance: newBalance });
        });
        return true;
    } catch (e) {
        console.error("ESCROW FAILED:", e);
        throw e;
    }
}

/**
 * MISSION REFUND (The "Reverse Siphon")
 * Returns Escrow funds to the Student if a mission is aborted.
 */
export async function refundMissionFunds(uid, amount, missionId) {
    const userRef = doc(db, `${DB_PATH}/users/${uid}`);
    const txRef = collection(db, `${DB_PATH}/transactions`);
    const missionRef = doc(db, `${DB_PATH}/missions/${missionId}`);

    try {
        await runTransaction(db, async (transaction) => {
            // 1. Check Mission Status
            const missionDoc = await transaction.get(missionRef);
            if (!missionDoc.exists()) throw "Mission Record Missing.";
            
            // Security: Only allow refund if mission is not already 'Paid' or 'Completed'
            if (missionDoc.data().status === 'COMPLETED') throw "Mission already finalized. Refund denied.";

            // 2. Calculate New Balance
            const userDoc = await transaction.get(userRef);
            const currentBalance = Number(userDoc.data().wallet_balance) || 0;
            const refundedAmount = Number(amount);
            const newBalance = currentBalance + refundedAmount;

            // 3. Create Refund Ledger Entry
            const refundTx = doc(txRef);
            transaction.set(refundTx, {
                user_id: uid,
                type: "MISSION_REFUND",
                amount: refundedAmount,
                status: "COMPLETED",
                reference_id: missionId,
                timestamp: serverTimestamp(),
                description: `Refund for Failed/Aborted Mission #${missionId.slice(0,5)}`
            });

            // 4. Execute Balance Restoration
            transaction.update(userRef, { wallet_balance: newBalance });
            
            // 5. Update Mission Status to Terminated
            transaction.update(missionRef, { status: "ABORTED_REFUNDED" });
        });

        console.log("REFUND SUCCESSFUL. FUNDS RETURNED TO OPERATIVE.");
        return true;
    } catch (e) {
        console.error("REFUND OPERATION FAILED:", e);
        throw e;
    }
	
	/**
 * FREELANCER PAYOUT (The "Tax Split")
 * Splits Escrow between Freelancer (80%) and Admin (20%).
 */
export async function executeMissionPayout(missionId, totalBudget, freelancerId) {
    const adminUid = "ADMIN_USER_ID_HERE"; // Your specific UID
    const freelancerRef = doc(db, `${DB_PATH}/users/${freelancerId}`);
    const adminRef = doc(db, `${DB_PATH}/users/${adminUid}`);
    const missionRef = doc(db, `${DB_PATH}/missions/${missionId}`);
    const txRef = collection(db, `${DB_PATH}/transactions`);

    try {
        await runTransaction(db, async (transaction) => {
            // 1. Calculations
            const taxAmount = Number(totalBudget) * 0.20;
            const freelancerNet = Number(totalBudget) - taxAmount;

            // 2. Fetch Current Balances
            const freeSnap = await transaction.get(freelancerRef);
            const adminSnap = await transaction.get(adminRef);

            const freeNewBal = (Number(freeSnap.data().wallet_balance) || 0) + freelancerNet;
            const adminNewBal = (Number(adminSnap.data().wallet_balance) || 0) + taxAmount;

            // 3. Create Ledger Entries
            const freeTx = doc(txRef);
            transaction.set(freeTx, {
                user_id: freelancerId,
                type: "MISSION_PAYOUT",
                amount: freelancerNet,
                mission_id: missionId,
                timestamp: serverTimestamp(),
                description: `Payout for Mission #${missionId.slice(0,5)}`
            });

            const adminTx = doc(txRef);
            transaction.set(adminTx, {
                user_id: adminUid,
                type: "ADMIN_TAX",
                amount: taxAmount,
                mission_id: missionId,
                timestamp: serverTimestamp(),
                description: `20% Fee from Mission #${missionId.slice(0,5)}`
            });

            // 4. Finalize Wallets & Mission Status
            transaction.update(freelancerRef, { wallet_balance: freeNewBal });
            transaction.update(adminRef, { wallet_balance: adminNewBal });
            transaction.update(missionRef, { status: "PAID_CLOSED" });
        });

        console.log("PAYOUT SEQUENCE COMPLETE. TAX SIPHONED.");
        return true;
    } catch (e) {
        console.error("PAYOUT FAILED:", e);
        throw e;
    }
}

/**
 * ARTIFACT ACQUISITION (The Armory Purchase)
 * Deducts fixed price from Buyer and splits 80/20 to Seller/Admin.
 */
export async function purchaseArtifact(buyerUid, productId, price, sellerUid) {
    const adminUid = "ADMIN_USER_ID_HERE"; // Your HQ UID
    const buyerRef = doc(db, `${DB_PATH}/users/${buyerUid}`);
    const sellerRef = doc(db, `${DB_PATH}/users/${sellerUid}`);
    const adminRef = doc(db, `${DB_PATH}/users/${adminUid}`);
    const txRef = collection(db, `${DB_PATH}/transactions`);

    try {
        await runTransaction(db, async (transaction) => {
            // 1. Check Buyer's Funds
            const buyerSnap = await transaction.get(buyerRef);
            const currentBal = Number(buyerSnap.data().wallet_balance) || 0;
            
            if (currentBal < price) throw "INSUFFICIENT_CREDITS";

            // 2. Calculate the Split
            const tax = price * 0.20;
            const sellerNet = price - tax;

            // 3. Update Wallets
            const sellerSnap = await transaction.get(sellerRef);
            const adminSnap = await transaction.get(adminRef);

            transaction.update(buyerRef, { wallet_balance: currentBal - price });
            transaction.update(sellerRef, { wallet_balance: (Number(sellerSnap.data().wallet_balance) || 0) + sellerNet });
            transaction.update(adminRef, { wallet_balance: (Number(adminSnap.data().wallet_balance) || 0) + tax });

            // 4. Record the Purchase in the Ledger
            const buyTx = doc(txRef);
            transaction.set(buyTx, {
                user_id: buyerUid,
                type: "ARMORY_PURCHASE",
                amount: -price,
                product_id: productId,
                timestamp: serverTimestamp(),
                description: `Acquired Artifact #${productId.slice(0,5)}`
            });
        });

        console.log("ASSET TRANSFERRED. CREDITS DISTRIBUTED.");
        return true;
    } catch (e) {
        console.error("ACQUISITION FAILED:", e);
        throw e;
    }
}

/**
 * SUBSCRIPTION UPGRADE (The "Promotion")
 * Deducts package price and upgrades user tier/badge.
 */
export async function upgradeSubscription(uid, packageType, price) {
    const userRef = doc(db, `${DB_PATH}/users/${uid}`);
    const txRef = collection(db, `${DB_PATH}/transactions`);
    const adminUid = "ADMIN_USER_ID_HERE"; // Your Warlord UID
    const adminRef = doc(db, `${DB_PATH}/users/${adminUid}`);

    try {
        await runTransaction(db, async (transaction) => {
            const userSnap = await transaction.get(userRef);
            const currentBal = Number(userSnap.data().wallet_balance) || 0;

            if (currentBal < price) throw "INSUFFICIENT_CREDITS";

            // 1. Deduct from User & Pay Admin (You take 100% of Package sales)
            const adminSnap = await transaction.get(adminRef);
            transaction.update(userRef, { 
                wallet_balance: currentBal - price,
                package_tier: packageType, // e.g., "GOLD"
                badge: `${packageType} Member` 
            });
            
            transaction.update(adminRef, { 
                wallet_balance: (Number(adminSnap.data().wallet_balance) || 0) + price 
            });

            // 2. Record the Ledger Entry
            const subTx = doc(txRef);
            transaction.set(subTx, {
                user_id: uid,
                type: "SUBSCRIPTION_PURCHASE",
                amount: -price,
                tier: packageType,
                timestamp: serverTimestamp(),
                description: `Upgrade to ${packageType} Induction Package`
            });
        });

        console.log(`PROMOTION GRANTED: ${packageType}`);
        return true;
    } catch (e) {
        console.error("SUBSCRIPTION FAILURE:", e);
        throw e;
    }
}

/* --- APPEND THIS TO assets/js/finance-core.js --- */

/**
 * EXECUTE STORE PURCHASE (The Atomic Transfer)
 * 1. Checks Buyer Balance.
 * 2. Deducts Price.
 * 3. Adds to Admin Vault.
 * 4. Creates Transaction Log.
 */
export async function executeStorePurchase(buyerUid, itemData) {
    const buyerRef = doc(db, `${DB_PATH}/users/${buyerUid}`);
    // The "Vault" is a special document where we store the Empire's Revenue
    const vaultRef = doc(db, `${DB_PATH}/system/vault`); 
    const txRef = collection(db, `${DB_PATH}/transactions`);
    const ordersRef = collection(db, `${DB_PATH}/orders`);

    try {
        await runTransaction(db, async (transaction) => {
            // A. READ (Lock the documents)
            const buyerDoc = await transaction.get(buyerRef);
            const vaultDoc = await transaction.get(vaultRef);

            if (!buyerDoc.exists()) throw "Buyer profile corrupted.";
            
            // Calculate Math
            const currentBal = Number(buyerDoc.data().wallet_balance) || 0;
            const price = Number(itemData.price);

            // B. VERIFY FUNDS
            if (currentBal < price) {
                throw "INSUFFICIENT FUNDS. PLEASE TOP UP.";
            }

            // C. WRITE (The Transfer)
            // 1. Deduct from Buyer
            transaction.update(buyerRef, { 
                wallet_balance: currentBal - price 
            });

            // 2. Add to Vault (Create vault if it doesn't exist yet)
            const currentVault = vaultDoc.exists() ? (Number(vaultDoc.data().totalRevenue) || 0) : 0;
            transaction.set(vaultRef, { 
                totalRevenue: currentVault + price,
                lastUpdate: serverTimestamp()
            }, { merge: true });

            // 3. Log the Transaction (For Admin Spy)
            const newTx = doc(txRef);
            transaction.set(newTx, {
                type: 'STORE_PURCHASE',
                amount: price,
                user_id: buyerUid,
                item_name: itemData.name,
                timestamp: serverTimestamp(),
                status: 'CLEARED'
            });

            // 4. Create the Order Record
            const newOrder = doc(ordersRef);
            transaction.set(newOrder, {
                buyerId: buyerUid,
                itemId: itemData.id,
                itemName: itemData.name,
                price: price,
                status: 'COMPLETED', // Auto-complete for digital goods
                timestamp: serverTimestamp()
            });
        });

        console.log("TRANSACTION SECURED.");
        return true;

    } catch (error) {
        console.error("TRANSACTION FAILED:", error);
        throw error; // Throw it back to the UI to handle
    }
}