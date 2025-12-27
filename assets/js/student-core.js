// --- assets/js/student-core.js ---
// STATUS: CLIENT-SIDE LOGIC

import { auth, db, appId } from './firebase-init.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.6.0/firebase-auth.js';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, getDoc, doc } from 'https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore.js';

let currentUser = null;

// 1. AUTH & INIT
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        console.log("[STUDENT] Operative Identified:", user.uid);
        
        // Load Profile Name
        const userDoc = await getDoc(doc(db, 'artifacts', appId, 'users', user.uid));
        if (userDoc.exists()) {
            $('#student-name').text(userDoc.data().name.toUpperCase());
        }

        // Start Data Streams
        loadMyMissions(user.uid);
    } else {
        window.location.href = 'DoD_Login_Style.html';
    }
});

// 2. LOAD MISSIONS (REAL-TIME LISTENER)
function loadMyMissions(uid) {
    const q = query(collection(db, 'artifacts', appId, 'missions'), where('ownerId', '==', uid));
    
    onSnapshot(q, (snapshot) => {
        let activeHtml = '';
        let historyHtml = '';
        let activeCount = 0;
        let pendingCount = 0;

        snapshot.forEach((doc) => {
            const m = doc.data();
            const id = doc.id.substr(0,6).toUpperCase();
            
            // Status Badge Logic
            let badgeClass = 'status-open';
            if(m.status === 'ASSIGNED') badgeClass = 'status-assigned';
            if(m.status === 'CLOSED') badgeClass = 'status-closed';

            const row = `
                <tr>
                    <td style="font-family:monospace; color:var(--mh-cyan);">#${id}</td>
                    <td style="font-weight:bold; color:#fff;">${m.title}</td>
                    <td>${m.deadline || '---'}</td>
                    <td><span class="status-badge ${badgeClass}">${m.status}</span></td>
                </tr>
            `;

            if(m.status === 'CLOSED') {
                historyHtml += row;
            } else {
                activeHtml += row;
                activeCount++;
                if(m.status === 'OPEN') pendingCount++;
            }
        });

        // Update UI
        $('#mission-table-body').html(activeHtml);
        $('#history-table-body').html(historyHtml);
        $('#stat-active').text(activeCount);
        $('#stat-pending').text(pendingCount);

        if(activeCount === 0) $('#no-missions-msg').show();
        else $('#no-missions-msg').hide();
    });
}

// 3. DEPLOY MISSION HANDLER
$('#student-mission-form').on('submit', async (e) => {
    e.preventDefault();
    const btn = $(this).find('button');
    btn.text("TRANSMITTING...").prop('disabled', true);

    const missionData = {
        title: $('#req-title').val(),
        budget: $('#req-budget').val(),
        deadline: $('#req-deadline').val(),
        type: $('#req-type').val(),
        description: $('#req-desc').val(),
        status: 'OPEN',
        ownerId: currentUser.uid,
        ownerName: $('#student-name').text(),
        timestamp: serverTimestamp()
    };

    try {
        await addDoc(collection(db, 'artifacts', appId, 'missions'), missionData);
        alert("MISSION BROADCASTED SUCCESSFULLY.\nStand by for operative assignment.");
        $('#student-mission-form')[0].reset();
        
        // Switch back to dashboard to see the new mission
        $('.content-panel').removeClass('active');
        $('#dashboard-panel').addClass('active');
        $('.page-title').text("MISSION STATUS");
    } catch (error) {
        console.error(error);
        alert("DEPLOYMENT FAILED: " + error.message);
    }
    btn.text("INITIATE PROTOCOL").prop('disabled', false);
});

// 4. LOGOUT
$('#btn-logout').click(async () => {
    if(confirm("ABORT SESSION?")) {
        await signOut(auth);
        window.location.href = 'DoD_Login_Style.html';
    }
});