/* functions/nervous_system/banker.js */
const admin = require("firebase-admin");

exports.validateMissionFunds = async (snap, context, db) => {
    const missionData = snap.data();
    const missionId = context.params.missionId;
    
    // SYNC: Variables match 'task-core.js'
    const studentUid = missionData.studentUid; 
    const budget = parseFloat(missionData.budget) || 0;

    console.log(`[BANKER] Auditing Mission ${missionId} | Budget: $${budget} | User: ${studentUid}`);

    if (budget <= 0) return null;

    // PATH UPDATE: Correct Security Path
    const userRef = db.doc(`artifacts/mhstudios-836/users/${studentUid}`);
    
    try {
        const userDoc = await userRef.get();
        if (!userDoc.exists) throw new Error("User Identity Missing");

        const balance = parseFloat(userDoc.data().wallet_balance) || 0;

        // AUDIT CHECK: Do they have enough money?
        if (balance < budget) {
            console.warn(`[BANKER] ALERT: INSUFFICIENT FUNDS for Mission ${missionId}`);
            
            // ACTION: Flag the mission as "Risk" (Don't delete, just warn)
            await snap.ref.update({
                financial_status: 'UNVERIFIED',
                admin_flag: 'LOW_FUNDS_WARNING',
                audit_timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
        } else {
            console.log(`[BANKER] Funds Verified. Mission ${missionId} is solvent.`);
            
            // ACTION: Verify the mission
            await snap.ref.update({
                financial_status: 'VERIFIED',
                audit_timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
        }
    } catch (error) {
        console.error("[BANKER] Audit Failed:", error);
    }
};