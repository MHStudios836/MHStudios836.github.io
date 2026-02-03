/* functions/nervous_system/banker.js */
const admin = require("firebase-admin");

exports.validateMissionFunds = async (snap, context, db) => {
    const missionData = snap.data();
    const missionId = context.params.missionId;
    const studentId = missionData.creatorId || missionData.studentId; // Ensure your student-core.js sends this!
    const price = parseFloat(missionData.price) || 0;

    console.log(`[BANKER] Auditing Mission ${missionId} | Cost: $${price} | User: ${studentId}`);

    // IGNORE if price is 0 (Free task?) or if already processed
    if (price <= 0 || missionData.status === 'OPEN') return null;

    const userRef = db.collection('users').doc(studentId);
    const missionRef = snap.ref;
    
    // FORENSIC LOG REFERENCE
    const systemLogRef = db.collection('system_logs').doc();
    // FINANCIAL LEDGER REFERENCE (For Admin Spy)
    const transactionRef = db.collection('transactions').doc();

    try {
        await db.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            
            if (!userDoc.exists) {
                throw new Error("User Identity Missing");
            }

            const currentBalance = userDoc.data().wallet_balance || 0;

            // --- CHECK: INSUFFICIENT FUNDS ---
            if (currentBalance < price) {
                console.warn(`[BANKER] INSUFFICIENT FUNDS. Bal: ${currentBalance}, Req: ${price}`);
                
                // 1. DELETE THE MISSION (Reject it)
                t.delete(missionRef);

                // 2. LOG THE CRIME
                t.set(systemLogRef, {
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    event: "MISSION_REJECTED",
                    reason: "INSUFFICIENT_FUNDS",
                    actor_id: studentId,
                    target_id: missionId,
                    amount: price,
                    severity: "MEDIUM"
                });

                return; // Stop execution
            }

            // --- CHECK: APPROVED ---
            const newBalance = currentBalance - price;

            // 1. DEDUCT FUNDS
            t.update(userRef, { wallet_balance: newBalance });

            // 2. UPDATE MISSION (Open for Business)
            t.update(missionRef, { 
                status: 'OPEN', 
                payment_status: 'ESCROW_SECURED',
                audit_timestamp: admin.firestore.FieldValue.serverTimestamp()
            });

            // 3. CREATE FORENSIC TRAIL (Admin Spy Feed)
            t.set(transactionRef, {
                type: 'ESCROW_DEPOSIT',
                amount: price,
                user_id: studentId,
                mission_id: missionId,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                status: 'LOCKED_IN_VAULT'
            });

            // 4. SYSTEM LOG (The Black Box)
            t.set(systemLogRef, {
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                event: "MISSION_APPROVED",
                actor_id: studentId,
                target_id: missionId,
                amount: price,
                details: "Funds moved to escrow."
            });
        });

        console.log(`[BANKER] Mission ${missionId} SECURED.`);
    } catch (error) {
        console.error("[BANKER] Transaction Failed:", error);
        // Safety Net: If logic fails, delete mission to prevent free labor scams
        await missionRef.delete(); 
    }
};