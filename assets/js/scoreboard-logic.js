/* assets/js/scoreboard-logic.js */
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { app } from "./firebase-init.js";
import { formatBounty } from "./data-transformer.js";

const db = getFirestore(app);
const appId = 'mhstudios-836';

document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.getElementById('leaderboard-body');
    tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center">DECRYPTING_DATA...</td></tr>';

    try {
        const q = query(collection(db, 'artifacts', appId, 'users'), orderBy('xp', 'desc'));
        const querySnapshot = await getDocs(q);
        
        tableBody.innerHTML = ''; // Clear

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const row = createScoreRow(data);
            tableBody.appendChild(row);
        });
    } catch (err) {
        console.error("Scoreboard Failure:", err);
        tableBody.innerHTML = '<tr><td colspan="6" style="color:red">CONNECTION_LOST</td></tr>';
    }
});

function createScoreRow(data) {
    const tr = document.createElement('tr');

    // REDACTION LOGIC: Split name, keep first, redact second
    const nameParts = (data.name || "Unknown Operative").split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? '<span class="redacted">XXXXX</span>' : '';
	// Normalize rank for file path (e.g., "SGT" -> "sgt")
    const rankKey = (data.rank || "pvt").toLowerCase();
    const rankIconPath = `assets/images/ranks/${rankKey}.png`;

    tr.innerHTML = `
        <td>${firstName.toUpperCase()} ${lastName}</td>
        <td class="rank-tag">${(data.rank || "PVT").toUpperCase()}</td>
        <td>${(data.type || "INFANTRY").toUpperCase()}</td>
        <td><span class="faction-tag">${(data.faction || "KILO_ONE").toUpperCase()}</span></td>
        <td>${(data.group || "ALPHA").toUpperCase()}</td>
        <td style="color: var(--mh-cyan)">${data.xp || 0}</td>
    `;
    return tr;
}

function redactName(fullName) {
    const parts = fullName.split(" ");
    const firstName = parts[0].toUpperCase();
    
    // Replace all subsequent names with a black block
    const redactedParts = parts.slice(1).map(() => 
        `<span style="background:#fff; color:#fff; padding:0 3px; margin-left:5px;">XXXXX</span>`
    ).join("");

    return `${firstName} ${redactedParts}`;
}

// Usage in table generation
tr.innerHTML = `<td>${redactName(data.name)}</td>...`;