/* assets/js/admin-command-console.js */
import { getFirestore, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { app } from "./firebase-init.js";

const db = getFirestore(app);
const appId = 'mhstudios-836';

// Expose this to the window so you can type it in the console
window.COMMAND = {
    broadcast: async (msg, type = 'SYSTEM', level = 'normal') => {
        await updateDoc(doc(db, 'artifacts', appId, 'system', 'alerts'), {
            active: true,
            message: msg,
            type: type,
            level: level
        });
        console.log(">> BROADCAST DEPLOYED");
    },
    silence: async () => {
        await updateDoc(doc(db, 'artifacts', appId, 'system', 'alerts'), {
            active: false
        });
        console.log(">> BROADCAST SILENCED");
    }
};

console.log(">> ADMIN COMMAND CONSOLE READY. USE: COMMAND.broadcast('message')");