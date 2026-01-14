/* assets/js/admin-missions.js */
import { db, dbID } from './firebase-init.js';
import { 
    collection, getDocs, query, orderBy, limit, deleteDoc, doc 
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const $grid = $('#mission-grid-body');

export async function initMissionGrid() {
    console.log("SCANNING MISSION PROTOCOLS...");
    
    if(!$grid.length) return;
    $grid.html('<tr><td colspan="6" style="text-align:center; color:#666;"><i class="fas fa-circle-notch fa-spin"></i> DOWNLOADING INTEL...</td></tr>');

    try {
        const q = query(
            collection(db, 'artifacts', dbID, 'missions'), 
            orderBy('timestamp', 'desc'), 
            limit(50)
        );
        
        const snapshot = await getDocs(q);
        
        $grid.empty();
        
        if (snapshot.empty) {
            $grid.html('<tr><td colspan="6" style="text-align:center;">NO ACTIVE MISSIONS DETECTED.</td></tr>');
            return;
        }

        snapshot.forEach(docSnap => {
            const m = docSnap.data();
            const id = docSnap.id;
            
            // Status Coloring
            let statusColor = '#888';
            if(m.status === 'OPEN') statusColor = '#00e5ff'; // Cyan
            if(m.status === 'IN_PROGRESS') statusColor = '#ffae00'; // Orange
            if(m.status === 'COMPLETED') statusColor = '#00ff41'; // Green

            const row = `
                <tr>
                    <td style="font-family:monospace; color:#666;">#${id.substr(0,5)}</td>
                    <td>
                        <strong style="color:#fff;">${m.ownerName || 'Unknown Agent'}</strong><br>
                        <span style="font-size:0.7em; color:#555;">UID: ${m.ownerId ? m.ownerId.substr(0,5) : 'N/A'}...</span>
                    </td>
                    <td style="color:#ddd;">${m.title}</td>
                    <td style="color:var(--mh-gold); font-weight:bold;">$${m.budget}</td>
                    <td><span class="badge" style="background:${statusColor}20; color:${statusColor}; border:1px solid ${statusColor};">${m.status}</span></td>
                    <td>
                        <button class="btn-red" onclick="window.deleteMission('${id}')" title="Terminate Mission">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
            $grid.append(row);
        });

    } catch (e) {
        console.error(e);
        $grid.html(`<tr><td colspan="6" style="color:red;">DATA LINK SEVERED: ${e.message}</td></tr>`);
    }
}

// DELETE LOGIC (Global Scope)
window.deleteMission = async (id) => {
    if(!confirm("WARNING: THIS WILL PERMANENTLY ERASE THE MISSION. PROCEED?")) return;
    
    try {
        await deleteDoc(doc(db, 'artifacts', dbID, 'missions', id));
        // Reload grid
        initMissionGrid();
    } catch(e) {
        alert("TERMINATION FAILED: " + e.message);
    }
};