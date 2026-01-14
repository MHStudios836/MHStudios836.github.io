/* assets/js/rank-engine.js */
// STATUS: UPDATED [LOGIC ONLY]

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
 * CALCULATE RANK FROM XP
 */
export function calculateRank(currentXP) {
    return [...RANK_TIERS].reverse().find(tier => currentXP >= tier.minXP) || RANK_TIERS[0];
}

/**
 * CALCULATE PROGRESS BAR STATS
 */
export function getNextRankProgress(currentXP) {
    const currentTier = calculateRank(currentXP);
    const currentIndex = RANK_TIERS.findIndex(t => t.id === currentTier.id);
    const nextTier = RANK_TIERS[currentIndex + 1];

    if (!nextTier) return { percent: 100, remaining: 0, nextTitle: 'MAX RANK' };

    const range = nextTier.minXP - currentTier.minXP;
    const progress = currentXP - currentTier.minXP;
    const percent = Math.floor((progress / range) * 100);

    return {
        percent,
        remaining: nextTier.minXP - currentXP,
        nextTitle: nextTier.title
    };
}