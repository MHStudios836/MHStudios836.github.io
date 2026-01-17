/**
 * TITAN CLASS BANKING SYSTEM (GEN 1 - FORCED LEGACY MODE)
 * Uses explicit V1 import to fix "is not a function" error in SDK v7.
 */

// CRITICAL FIX: We force the v1 namespace
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// CONSTANTS
const DB_ID = "mhstudios-836";
const TAX_RATE = 0.20; 

// --- 1. THE WATCHDOG (Orders) ---
exports.processOrder = functions.firestore
    .document(`artifacts/${DB_ID}/orders/{orderId}`)
    .onCreate(async (snap, context) => {
        const order = snap.data();
        if (order.status !== 'PAID' && order.status !== 'PENDING') return null;

        const buyerRef = db.doc(`artifacts/${DB_ID}/users/${order.buyerId}`);
        const vaultRef = db.doc(`artifacts/${DB_ID}/system/vault`);

        return db.runTransaction(async (t) => {
            const buyerDoc = await t.get(buyerRef);
            const vaultDoc = await t.get(vaultRef);

            if (!buyerDoc.exists) return;

            const buyerWallet = buyerDoc.data().wallet_balance || 0;
            const price = parseFloat(order.price);

            if (buyerWallet < price) {
                t.update(snap.ref, { status: "FAILED", notes: "Insufficient Funds" });
                return;
            }

            const newBalance = buyerWallet - price;
            const currentRevenue = (vaultDoc.exists ? vaultDoc.data().totalRevenue : 0) || 0;
            const currentVaultBalance = (vaultDoc.exists ? vaultDoc.data().balance : 0) || 0;

            t.update(buyerRef, { wallet_balance: newBalance });
            
            if (!vaultDoc.exists) {
                t.set(vaultRef, { totalRevenue: price, balance: price });
            } else {
                t.update(vaultRef, { 
                    totalRevenue: currentRevenue + price,
                    balance: currentVaultBalance + price 
                });
            }

            t.update(snap.ref, { 
                status: "COMPLETED", 
                processedAt: admin.firestore.FieldValue.serverTimestamp() 
            });
        });
    });

// --- 2. THE PAYMASTER (Mission Payouts) ---
exports.finalizeMission = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required.');

    const missionId = data.missionId;
    const uid = context.auth.uid;

    const missionRef = db.doc(`artifacts/${DB_ID}/missions/${missionId}`);
    const vaultRef = db.doc(`artifacts/${DB_ID}/system/vault`);

    return db.runTransaction(async (t) => {
        const missionDoc = await t.get(missionRef);
        if (!missionDoc.exists) throw new functions.https.HttpsError('not-found', 'Mission not found.');

        const mission = missionDoc.data();

        if (mission.createdBy !== uid) {
             throw new functions.https.HttpsError('permission-denied', 'Only the mission owner can release funds.');
        }

        if (mission.status === 'COMPLETED') {
            throw new functions.https.HttpsError('failed-precondition', 'Mission already paid.');
        }

        const budget = parseFloat(mission.budget);
        const adminShare = Number((budget * TAX_RATE).toFixed(2));
        const freelancerShare = Number((budget - adminShare).toFixed(2));
        
        const freelancerRef = db.doc(`artifacts/${DB_ID}/users/${mission.freelancerId}`);
        const vaultDoc = await t.get(vaultRef);

        t.update(freelancerRef, { 
            wallet_balance: admin.firestore.FieldValue.increment(freelancerShare),
            'stats.earnings': admin.firestore.FieldValue.increment(freelancerShare),
            'stats.missions_completed': admin.firestore.FieldValue.increment(1)
        });

        const currentVaultBalance = (vaultDoc.exists ? vaultDoc.data().balance : 0) || 0;
        
        if (!vaultDoc.exists) {
            t.set(vaultRef, { totalRevenue: adminShare, balance: adminShare });
        } else {
             t.update(vaultRef, { 
                totalRevenue: admin.firestore.FieldValue.increment(adminShare),
                balance: admin.firestore.FieldValue.increment(adminShare)
            });
        }

        t.update(missionRef, { 
            status: 'COMPLETED',
            paymentStatus: 'PAID',
            finalPayout: freelancerShare,
            taxSiphoned: adminShare,
            completedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return { success: true, freelancerGot: freelancerShare, tax: adminShare };
    });
});

// --- 3. THE CONTRACTOR (Assign Mission) ---
exports.acceptMission = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required.');

    const missionId = data.missionId;
    const uid = context.auth.uid;
    const name = context.auth.token.name || "Operative";

    const missionRef = db.doc(`artifacts/${DB_ID}/missions/${missionId}`);

    return db.runTransaction(async (t) => {
        const missionDoc = await t.get(missionRef);
        if (!missionDoc.exists) throw new functions.https.HttpsError('not-found', 'Mission lost.');

        const mission = missionDoc.data();

        if (mission.status !== 'OPEN') {
            throw new functions.https.HttpsError('failed-precondition', 'Contract already taken.');
        }

        t.update(missionRef, {
            status: 'IN_PROGRESS',
            freelancerId: uid,
            freelancerName: name,
            acceptedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return { success: true };
    });
});