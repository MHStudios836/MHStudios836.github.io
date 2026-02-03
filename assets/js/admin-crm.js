/* assets/js/admin-crm.js - PORTABLE CRM ENGINE */
import { db, DB_PATH } from './firebase-init.js';
import { collection, query, where, onSnapshot, orderBy } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

/**
 * INITIALIZE CRM MONITOR
 * Connects to the Mainframe and starts listening for stats.
 */
export function initPortableCRM() {
    console.log("CRM: INITIALIZING CENSUS PROTOCOLS...");

    // 1. POPULATION MONITOR (Users)
    const userQ = query(collection(db, `${DB_PATH}/users`));
    
    onSnapshot(userQ, (snapshot) => {
        let students = 0;
        let mercs = 0;
        let operators = 0;
        let banned = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            
            // LOGIC GATES
            if (data.role === 'student') students++;
            if (data.role === 'freelancer') {
                if (data.tier === 'OPERATOR') {
                    operators++; // Elite
                } else {
                    mercs++; // Standard
                }
            }
            if (data.status === 'BANNED' || data.is_banned === true) banned++;
        });

        // UPDATE DASHBOARD UI (DOM Elements)
        updateVal('crm-count-student', students);
        updateVal('crm-count-merc', mercs);
        updateVal('crm-count-operator', operators);
        updateVal('crm-count-banned', banned);
        updateVal('crm-total-users', snapshot.size);
    });

    // 2. OPERATIONS MONITOR (Missions/Tasks)
    const missionQ = query(collection(db, `${DB_PATH}/missions`));

    onSnapshot(missionQ, (snapshot) => {
        let open = 0;
        let active = 0;
        let completed = 0;
        let disputes = 0;
        let totalValue = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            const budget = parseFloat(data.budget) || 0;

            if (data.status === 'OPEN') open++;
            if (data.status === 'IN_PROGRESS') {
                active++;
                totalValue += budget; // Calculate value of active contracts
            }
            if (data.status === 'COMPLETED') completed++;
            if (data.status === 'DISPUTED') disputes++;
        });

        // UPDATE DASHBOARD UI
        updateVal('crm-task-open', open);
        updateVal('crm-task-active', active);
        updateVal('crm-task-completed', completed);
        updateVal('crm-task-value', `$${totalValue.toFixed(2)}`);
    });
}

// Helper to safely update HTML
function updateVal(id, value) {
    const el = document.getElementById(id);
    if (el) {
        // Add a cool counting animation or just set text
        el.innerText = value;
        // Make it glow if it changed (Optional CSS class)
        el.classList.add('updated-flash');
        setTimeout(() => el.classList.remove('updated-flash'), 500);
    }
}