// MH STUDIOS: THE OVERSEER (Rank & Logic Module)
// Triggers on: /users/{userId} document updates

exports.checkPromotion = async (change, context, db) => {
    const newData = change.after.data();
    const oldData = change.before.data();
    const userId = context.params.userId;

    // Safety Check: If data was deleted, do nothing
    if (!newData) return null;

    const stats = newData.stats || {};
    const oldStats = oldData.stats || {};
    const role = newData.role; // "student" or "freelancer"

    // --- LOGIC GATE 1: THE MONEY COW (Student -> Freelancer) ---
    // Rule: Must create 50 tasks to unlock "Become Freelancer"
    if (role === "student") {
        const tasksCreated = stats.tasks_created || 0;
        const oldTasksCreated = oldStats.tasks_created || 0;

        // Only run if the number just crossed the threshold
        if (tasksCreated >= 50 && oldTasksCreated < 50) {
            console.log(`[OVERSEER] Student ${userId} has evolved! Unlocking Freelancer option.`);
            
            // Update the Database: Unlock the capability
            await db.collection('users').doc(userId).update({
                "unlocked_features.become_freelancer": true,
                "notifications": admin.firestore.FieldValue.arrayUnion({
                    title: "Level Up!",
                    message: "You have created 50 Missions. You can now apply to become a Freelancer!",
                    timestamp: new Date()
                })
            });
        }
    }

    // --- LOGIC GATE 2: THE MERCENARY (Merc -> Operator) ---
    // Rule: Must complete 10 tasks to unlock "Apply for Operator"
    if (role === "freelancer") {
        const tasksCompleted = stats.tasks_completed || 0;
        const oldTasksCompleted = oldStats.tasks_completed || 0;

        // Only run if they just hit the milestone
        if (tasksCompleted >= 10 && oldTasksCompleted < 10) {
            console.log(`[OVERSEER] Merc ${userId} is ready for Operator Status.`);

            // Update the Database: Unlock the button
            await db.collection('users').doc(userId).update({
                "unlocked_features.apply_operator": true,
                "notifications": admin.firestore.FieldValue.arrayUnion({
                    title: "Promotion Available",
                    message: "Excellent work, Merc. You have cleared 10 Hostiles. You may now apply for Operator Status.",
                    timestamp: new Date()
                })
            });
        }
    }

    return null;
};