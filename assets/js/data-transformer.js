/* assets/js/data-transformer.js */

/**
 * TACTICAL TIMESTAMP CONVERTER
 * Converts ISO/Firebase dates to: DD-MMM-YYYY // HH:MM:SS
 * @param {string|Date} input 
 */
export function formatTacticalDate(input) {
    if (!input) return "UNKNOWN_TIME";
    const date = new Date(input);
    
    const day = String(date.getDate()).padStart(2, '0');
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    const hours = String(date.getHours()).padStart(2, '0');
    const mins = String(date.getMinutes()).padStart(2, '0');
    const secs = String(date.getSeconds()).padStart(2, '0');

    return `${day}-${month}-${year} // ${hours}:${mins}:${secs}`;
}

/**
 * BOUNTY / CURRENCY FORMATTER
 * Converts numbers to: $XX.XXX,00
 */
export function formatBounty(amount) {
    const num = parseFloat(amount) || 0;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(num).toUpperCase();
}

/**
 * OPERATIVE ID SHORTENER
 * Truncates long Firebase UIDs to a tactical reference
 */
export function formatOpID(uid) {
    if (!uid) return "OP_ANONYMOUS";
    return `OP_${uid.substring(0, 8).toUpperCase()}`;
}

/**
 * STATUS STYLER
 * Normalizes status text for the HUD
 */
export function formatStatus(status) {
    if (!status) return "PENDING";
    return status.replace(/_/g, ' ').toUpperCase();
}

import { formatTacticalDate, formatBounty, formatOpID } from './data-transformer.js';

// Inside your renderIntel(data) function:
function renderIntel(data) {
    // Before: data.budget (500) -> After: $500.00
    setText('#m-budget', formatBounty(data.budget));
    
    // Before: data.deadline (2026-05-01) -> After: 01-MAY-2026 // 00:00:00
    setText('#m-deadline', formatTacticalDate(data.deadline));
    
    // Set a tactical Mission Reference ID
    setText('#mission-ref', formatOpID(missionId));
}