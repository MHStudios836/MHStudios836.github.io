/* assets/js/rank-engine.js */

// TACTICAL RANK DEFINITIONS
export const RANK_TIERS = [
    { id: 'pvt', minXP: 0, title: 'Private' },
    { id: 'cpl', minXP: 500, title: 'Corporal' },
    { id: 'sgt', minXP: 1500, title: 'Sergeant' },
    { id: 'lt',  minXP: 3000, title: 'Lieutenant' },
    { id: 'cpt', minXP: 6000, title: 'Captain' },
    { id: 'col', minXP: 12000, title: 'Colonel' },
    { id: 'gen', minXP: 25000, title: 'General' }
];

/**
 * DETERMINES RANK BASED ON XP
 * @param {number} currentXP 
 * @returns {Object} The rank object
 */
export function calculateRank(currentXP) {
    // Reverse search the array to find the highest tier met
    return [...RANK_TIERS].reverse().find(tier => currentXP >= tier.minXP) || RANK_TIERS[0];
}

/**
 * CALCULATES PROGRESS TO NEXT RANK
 * @param {number} currentXP 
 */
export function getNextRankProgress(currentXP) {
    const currentTier = calculateRank(currentXP);
    const currentIndex = RANK_TIERS.findIndex(t => t.id === currentTier.id);
    const nextTier = RANK_TIERS[currentIndex + 1];

    if (!nextTier) return { percent: 100, remaining: 0 }; // Max rank

    const range = nextTier.minXP - currentTier.minXP;
    const progress = currentXP - currentTier.minXP;
    const percent = Math.floor((progress / range) * 100);

    return {
        percent,
        remaining: nextTier.minXP - currentXP,
        nextTitle: nextTier.title
    };
}

/* Add this to your mission completion logic */
import { calculateRank } from './rank-engine.js';
import { notify } from './notification-hub.js';
import { playSound } from './sound-engine.js';
import { getFirestore, doc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

async function awardMissionXP(userId, xpAmount) {
    const db = getFirestore();
    const userRef = doc(db, 'artifacts', 'mhstudios-836', 'users', userId);

    // 1. Get current data to check for rank-up before updating
    // (Logic: If calculateRank(oldXP) != calculateRank(newXP) -> PROMOTION!)
    
    try {
        await updateDoc(userRef, {
            xp: increment(xpAmount)
        });

        notify("Intel Update", `Combat XP Gained: +${xpAmount}`, "success");
        playSound('notify');

        // Check for promotion (Implementation in your core script)
        // triggerPromotionCheck(userId); 
    } catch (err) {
        console.error("XP Sync Error:", err);
    }
}