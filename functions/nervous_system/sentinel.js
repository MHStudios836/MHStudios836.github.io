// The Sentinel: Intercepts faulty chats and bad behavior
const BANNED_WORDS = ["scam", "outside payment", "whatsapp", "telegram", "stupid"];

exports.interceptFaultyChat = async (snap, context, db) => {
    const data = snap.data();
    const text = data.text.toLowerCase();
    const userId = data.senderId;

    // 1. Check for Violation
    let violationDetected = false;
    for (const word of BANNED_WORDS) {
        if (text.includes(word)) {
            violationDetected = true;
            break;
        }
    }

    if (violationDetected) {
        console.log(`[SENTINEL] Violation detected from User: ${userId}`);

        // 2. Action: Redact the message
        await snap.ref.update({
            text: "🚫 [MESSAGE REDACTED: VIOLATION DETECTED]",
            is_flagged: true
        });

        // 3. Action: Warn the User
        // FIX: Point to the Artifact Path, not the root collection
        const userRef = db.doc(`artifacts/mhstudios-836/users/${userId}`);
        
        // We use a transaction to safely increment the warning counter
        await db.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) return;

            const currentWarnings = userDoc.data().stats.warnings || 0;
            const newWarnings = currentWarnings + 1;

            t.update(userRef, { "stats.warnings": newWarnings });

            // 4. Action: The Ban Hammer
            if (newWarnings >= 3) {
                t.update(userRef, { 
                    "is_banned": true, 
                    "ban_reason": "Automated Ban: Exceeded warning limit." 
                });
                console.log(`[SENTINEL] User ${userId} has been BANNED.`);
            }
        });
    }
    return null;
};