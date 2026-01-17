/* assets/js/transaction-siphon.js */
/* STATUS: CONNECTED TO CLOUD BACKEND */

import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-functions.js";
import { app } from './firebase-init.js';

const functions = getFunctions(app);

/**
 * PROCESS MISSION PAYOUT (Cloud Execution)
 * Calls the 'finalizeMission' function on the server.
 */
export async function processMissionPayout(missionId) {
    console.log("CONTACTING BANKING SERVER...");
    
    // Connect to the Cloud Function we just deployed
    const finalizeFn = httpsCallable(functions, 'finalizeMission');
    
    try {
        const result = await finalizeFn({ missionId: missionId });
        const data = result.data;
        
        console.log("PAYOUT SUCCESSFUL:", data);
        alert(`TRANSACTION CLEARED.\nFreelancer Recieved: $${data.freelancerGot}\nTax Siphoned: $${data.tax}`);
        return true;
    } catch (error) {
        console.error("PAYOUT FAILED:", error);
        alert("BANKING ERROR: " + error.message);
        throw error;
    }
}

// NOTE: recordProductSale is REMOVED. 
// The Cloud Function 'processOrder' now handles product sales automatically 
// whenever a document is created in the 'orders' collection.