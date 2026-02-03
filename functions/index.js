/* MH STUDIOS: MASTER CONTROL PROGRAM (MCP) */
// CRITICAL FIX: We add "/v1" to force the classic syntax compatibility
const functions = require("firebase-functions/v1"); 
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// --- [1] THE NERVOUS SYSTEM MODULES ---
// Ensure these files exist in 'functions/nervous_system/'
const sentinel = require('./nervous_system/sentinel');
const overseer = require('./nervous_system/overseer');
const banker = require('./nervous_system/banker');

// --- [2] AUTOMATED REFLEXES (Triggers) ---

// A. SECURITY: Chat Monitor (The Sentinel)
exports.monitorChat = functions.firestore
    .document('chats/{chatId}/messages/{messageId}')
    .onCreate((snap, context) => sentinel.interceptFaultyChat(snap, context, db));

// B. RANK LOGIC: Promotions (The Overseer)
exports.monitorStats = functions.firestore
    .document('users/{userId}')
    .onUpdate((change, context) => overseer.checkPromotion(change, context, db));

// C. ECONOMY: Mission Audit (The Banker)
// Triggers when a student creates a mission to check funds
exports.auditMission = functions.firestore
    .document('artifacts/mhstudios-836/missions/{missionId}') 
    .onCreate((snap, context) => banker.validateMissionFunds(snap, context, db));

// --- [3] MANUAL OPERATIONS (Callables) ---

// D. STORE: Process Order (Legacy Logic)
exports.processOrder = functions.firestore
    .document('artifacts/mhstudios-836/orders/{orderId}')
    .onCreate(async (snap, context) => {
        const order = snap.data();
        if (order.status !== 'PENDING') return null;

        const buyerRef = db.doc(`users/${order.buyerId}`);
        // Simple logic: Deduct funds for items
        await db.runTransaction(async (t) => {
            const userDoc = await t.get(buyerRef);
            if (!userDoc.exists) return;
            const bal = userDoc.data().wallet_balance || 0;
            if (bal >= order.price) {
                t.update(buyerRef, { wallet_balance: bal - order.price });
                t.update(snap.ref, { status: 'PAID' });
            } else {
                t.update(snap.ref, { status: 'FAILED_FUNDS' });
            }
        });
    });

// E. MISSION: Accept Contract (Freelancer Action)
exports.acceptMission = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required.');
    
    const missionId = data.missionId;
    const uid = context.auth.uid;
    const name = context.auth.token.name || "Operative";
    
    // Note: Adjust path if you use a specific Artifact ID
    const missionRef = db.doc(`artifacts/mhstudios-836/missions/${missionId}`);

    return db.runTransaction(async (t) => {
        const doc = await t.get(missionRef);
        if (!doc.exists) throw new functions.https.HttpsError('not-found', 'Mission lost.');
        if (doc.data().status !== 'OPEN') throw new functions.https.HttpsError('failed-precondition', 'Taken.');

        t.update(missionRef, {
            status: 'IN_PROGRESS',
            freelancerId: uid,
            freelancerName: name,
            acceptedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return { success: true };
    });
});

// F. MISSION: Finalize Payout (Called by transaction-siphon.js)
exports.finalizeMission = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required.');
    
    const missionId = data.missionId;
    const missionRef = db.doc(`artifacts/mhstudios-836/missions/${missionId}`);

    return db.runTransaction(async (t) => {
        const doc = await t.get(missionRef);
        const mission = doc.data();
        
        // Ensure mission is valid for payout
        if (mission.status !== 'IN_PROGRESS') return { error: "Mission not active" };

        const price = mission.price;
        const tax = price * 0.20; // 20% Tax
        const payout = price - tax;

        // Pay the Freelancer
        const freelancerRef = db.doc(`users/${mission.freelancerId}`);
        t.update(freelancerRef, { 
            wallet_balance: admin.firestore.FieldValue.increment(payout),
            "stats.tasks_completed": admin.firestore.FieldValue.increment(1)
        });

        // Pay the House (Admin Vault)
        const vaultRef = db.doc(`artifacts/mhstudios-836/system/vault`);
        t.set(vaultRef, { 
            total_revenue: admin.firestore.FieldValue.increment(tax) 
        }, { merge: true });

        // Close Mission
        t.update(missionRef, { status: 'COMPLETED', payment_status: 'PAID_OUT' });

        return { freelancerGot: payout, tax: tax };
    });
});