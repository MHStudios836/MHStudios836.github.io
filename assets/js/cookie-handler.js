/**
 * assets/js/cookie-handler.js
 * Manages the user consent cookie ('user_consent') with 'yes' or 'no' values.
 */

// --- 1. CORE FUNCTION: SET COOKIE ---
/**
 * Sets a cookie named 'user_consent' to 'yes' or 'no'.
 * The cookie is set to expire in 1 year and is valid across the entire site.
 * @param {string} consentValue - The value to set: 'yes' or 'no'.
 */
function setCookieConsent(consentValue) {
    const cookieName = "user_consent";
    // Set expiration to 1 year for persistence
    const oneYearInMilliseconds = 365 * 24 * 60 * 60 * 1000;
    const expirationDate = new Date();
    expirationDate.setTime(expirationDate.getTime() + oneYearInMilliseconds);
    const expires = "expires=" + expirationDate.toUTCString();

    // Set the cookie. Important attributes: path=/, Secure (if using HTTPS), SameSite=Lax.
    document.cookie = `${cookieName}=${consentValue}; ${expires}; path=/; Secure; SameSite=Lax`;

    // DEBUG LOG:
    console.log(`Cookie '${cookieName}' set to: ${consentValue}`);
}


// --- 2. CORE FUNCTION: GET COOKIE ---
/**
 * Retrieves the value of the 'user_consent' cookie.
 * @returns {string|null} - 'yes', 'no', or null if the cookie is not found.
 */
function getCookie() {
    const nameEQ = "user_consent=";
    const ca = document.cookie.split(';');

    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length); // Remove leading spaces
        if (c.indexOf(nameEQ) === 0) {
            return c.substring(nameEQ.length, c.length);
        }
    }
    return null;
}


// --- 3. HANDLER FUNCTIONS (Called by HTML Buttons) ---

// Function attached to the 'Accept' button
function handleAccept() {
    setCookieConsent('yes');
    // Hide the banner after acceptance
    const banner = document.getElementById('cookie-consent-banner');
    if (banner) {
        banner.style.display = 'none';
    }
    // You can now load tracking/analytics scripts here if consent is 'yes'
}

// Function attached to the 'Decline' button
function handleDecline() {
    setCookieConsent('no');
    // Hide the banner after decline
    const banner = document.getElementById('cookie-consent-banner');
    if (banner) {
        banner.style.display = 'none';
    }
    // Ensure all non-essential scripts (like tracking) are blocked/removed
}


// --- 4. INITIALIZATION LOGIC (Checks on Page Load) ---
document.addEventListener('DOMContentLoaded', () => {
    const userConsent = getCookie();
    const banner = document.getElementById('cookie-consent-banner');

    if (banner) {
        if (userConsent === 'yes' || userConsent === 'no') {
            // User has already made a decision, hide the banner
            banner.style.display = 'none';
        } else {
            // No decision yet, show the banner
            banner.style.display = 'block';
        }
    } else {
        // DEBUG LOG:
        console.warn('Cookie consent banner element with ID "cookie-consent-banner" not found.');
    }
});