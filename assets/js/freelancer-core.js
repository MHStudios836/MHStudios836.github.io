// --- assets/js/freelancer-core.js ---
// STATUS: MERCENARY LOGIC

import { auth, db, appId } from './firebase-init.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.6.0/firebase-auth.js';
import { collection, query, where, onSnapshot, getDoc, doc, updateDoc } from 'https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore.js';

let currentUser = null;

// 1. AUTH CHECK
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        console.log("[MERCENARY] ID Verified:", user.uid);
        
        // Load Profile Name
        const userDoc = await getDoc(doc(db, 'artifacts', appId, 'users', user.uid));
        if (userDoc.exists()) {
            $('#freelancer-name').text(userDoc.data().name.toUpperCase());
        }

        // Initialize Streams
        loadOpenJobs();
        loadMyOps(user.uid);
    } else {
        window.location.href = 'DoD_Login_Style.html';
    }
});

// 2. LOAD JOB BOARD (OPEN MISSIONS)
function loadOpenJobs() {
    const q = query(collection(db, 'artifacts', appId, 'missions'), where('status', '==', 'OPEN'));
    
    onSnapshot(q, (snapshot) => {
        let html = '';
        let count = 0;

        snapshot.forEach((doc) => {
            const m = doc.data();
            const id = doc.id;
            count++;

            html += `
                <div class="job-card">
                    <div class="job-header">
                        <span class="job-id">MISSION: #${id.substr(0,6).toUpperCase()}</span>
                        <span class="job-bounty">$${m.budget}</span>
                    </div>
                    <div class="job-title">${m.title}</div>
                    <div class="job-meta">
                        <span><i class="fas fa-clock"></i> ${m.deadline}</span>
                        <span><i class="fas fa-tag"></i> ${m.type.toUpperCase()}</span>
                    </div>
                    <div class="job-desc">${m.description}</div>
                    // NEW LINE (Linking to Contract Form):
					<button class="accept-btn" onclick="window.location.href='Contract_Form.html?id=${id}'">INSPECT INTEL</button>
                </div>
            `;
        });

        $('#job-board-grid').html(html);
        $('#stat-available').text(count);

        if(count === 0) $('#no-jobs-msg').show();
        else $('#no-jobs-msg').hide();
    });
}

// 3. LOAD MY OPS (ASSIGNED TO ME)
function loadMyOps(uid) {
    const q = query(collection(db, 'artifacts', appId, 'missions'), where('freelancerId', '==', uid));
    
    onSnapshot(q, (snapshot) => {
        let activeHtml = '';
        let earningsHtml = '';
        let activeCount = 0;
        let totalEarnings = 0;

        snapshot.forEach((doc) => {
            const m = doc.data();
            const id = doc.id.substr(0,6).toUpperCase();

            // Active Missions Table
            if(m.status === 'ASSIGNED') {
                activeHtml += `
                    <tr>
                        <td style="color:var(--mh-orange);">#${id}</td>
                        <td style="font-weight:bold;">${m.title}</td>
                        <td>${m.deadline}</td>
                        <td style="color:var(--mh-green);">$${m.budget}</td>
                        <td><span style="color:var(--mh-orange); border:1px solid var(--mh-orange); padding:2px 5px; font-size:0.7em;">IN PROGRESS</span></td>
                        <td><button style="background:var(--mh-green); border:none; color:#000; padding:5px 10px; font-weight:bold; cursor:pointer;" onclick="window.completeMission('${doc.id}')">COMPLETE</button></td>
                    </tr>
                `;
                activeCount++;
            }

            // Completed / Earnings
            if(m.status === 'COMPLETED') {
                earningsHtml += `
                    <tr>
                        <td>${m.completedDate || '---'}</td>
                        <td>${m.title}</td>
                        <td style="color:var(--mh-green); font-weight:bold;">$${m.budget}</td>
                        <td>PAID</td>
                    </tr>
                `;
                totalEarnings += parseFloat(m.budget || 0);
            }
        });

        $('#my-missions-body').html(activeHtml);
        $('#earnings-body').html(earningsHtml);
        $('#stat-active').text(activeCount);
        $('#stat-earnings').text('$' + totalEarnings.toFixed(2));
    });
}

// 4. GLOBAL ACTIONS (ACCEPT / COMPLETE)
// We attach these to 'window' so the HTML onclick="" can see them
window.acceptMission = async (missionId) => {
    if(!confirm("ACCEPT THIS CONTRACT? It will be assigned to your profile.")) return;
    
    try {
        const missionRef = doc(db, 'artifacts', appId, 'missions', missionId);
        await updateDoc(missionRef, {
            status: 'ASSIGNED',
            freelancerId: currentUser.uid,
            freelancerName: $('#freelancer-name').text()
        });
        alert("CONTRACT SECURED. Check 'My Missions'.");
    } catch (e) {
        console.error(e);
        alert("ERROR: Could not accept mission.");
    }
};

window.completeMission = async (missionId) => {
    if(!confirm("MARK MISSION AS COMPLETE? Ensure deliverables are sent.")) return;
    
    try {
        const missionRef = doc(db, 'artifacts', appId, 'missions', missionId);
        await updateDoc(missionRef, {
            status: 'COMPLETED',
            completedDate: new Date().toISOString().split('T')[0]
        });
        alert("MISSION COMPLETE. Funds pending transfer.");
    } catch (e) {
        console.error(e);
        alert("ERROR: System failure.");
    }
};

// 5. LOGOUT
$('#btn-logout').click(async () => {
    if(confirm("ABORT SESSION?")) {
        await signOut(auth);
        window.location.href = 'DoD_Login_Style.html';
    }
});