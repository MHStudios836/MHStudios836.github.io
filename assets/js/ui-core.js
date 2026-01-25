/* assets/js/ui-core.js - UNIFIED UI HANDLER */

$(document).ready(function() {
    console.log("UI CORE: ACTIVE");

    // 1. MENU FUNCTIONS
    $('#menu-toggle').click(function(e) {
        e.preventDefault();
        $('#sidebar').toggleClass('active');
        $(this).toggleClass('active');
    });

    // 2. SEARCH BOX LOGIC
    $('.search-trigger').click(function() {
        $('.search-box').toggleClass('visible').find('input').focus();
    });

    // 3. LANGUAGE DROPDOWN
    $('.lang-selector').click(function() {
        $('.lang-options').slideToggle(200);
    });
    
    // 4. SOCIAL INTERACTIONS
    $('.social-share').click(function() {
        const platform = $(this).data('platform');
        // Add your share logic here if needed
        console.log(`Sharing to ${platform}`);
    });

    // 5. SMOOTH SCROLL (Replaces jquery.scrolly)
    $('a[href^="#"]').on('click', function(e) {
        e.preventDefault();
        $('html, body').animate({
            scrollTop: $($(this).attr('href')).offset().top
        }, 500);
    });
});

import { db, DB_PATH, auth } from './firebase-init.js';
import { collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

/**
 * MISSION STATUS OBSERVER
 * Fastens the process by reacting to mission updates in real-time.
 */
export function startMissionObserver() {
    if (!auth.currentUser) return;

    const missionQuery = query(
        collection(db, `${DB_PATH}/missions`),
        where("client_id", "==", auth.currentUser.uid)
    );

    // Listen for changes
    onSnapshot(missionQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            const mission = change.doc.data();
            
            if (change.type === "modified") {
                console.log(`Mission ${change.doc.id} updated to: ${mission.status}`);

                // Visual Notification System
                if (mission.status === "PAID_CLOSED") {
                    showTacticalAlert(`MISSION FUNDS DISBURSED: Mission #${change.doc.id.slice(0,5)}`);
                }
                
                if (mission.status === "REVIEW_PENDING") {
                    showTacticalAlert("DELIVERABLES RECEIVED. AWAITING YOUR REVIEW.");
                }
            }
        });
    });
}

function showTacticalAlert(msg) {
    // This hooks into your Titan HUD
    const hud = document.getElementById('network-status');
    if (hud) {
        const originalText = hud.innerText;
        hud.innerText = `ALERT: ${msg}`;
        hud.style.color = "var(--mh-cyan)";
        setTimeout(() => { 
            hud.innerText = originalText; 
            hud.style.color = "";
        }, 5000);
    }
}