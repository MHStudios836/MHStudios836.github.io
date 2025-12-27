// --- assets/js/admin-core.js (TITAN V4.1) ---

import { auth, db, appId } from './firebase-init.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.6.0/firebase-auth.js';
import { doc, getDoc, collection, getDocs, query, orderBy, limit } from 'https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore.js';

// --- 1. SYSTEM LOGGING ---
function logSystem(msg, type='info') {
    const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
    let color = '#ddd';
    if(type === 'success') color = '#00ff41';
    if(type === 'alert') color = '#ff004c';
    
    const line = `<div class="log-entry" style="color:${color};"><span class="log-time">[${time}]</span> ${msg}</div>`;
    $('#live-terminal').prepend(line);
}

// --- 2. AUTH & INITIALIZATION ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        logSystem("Operative Detected: " + user.email.split('@')[0].toUpperCase(), 'success');
        
        // Load User Profile
        try {
            const userDoc = await getDoc(doc(db, 'artifacts', appId, 'users', user.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                $('#sidebar-name').text(data.name || "COMMANDER");
                
                // Initialize Data Streams
                loadStats();
                loadUsers();
                loadOrders();
            }
        } catch (e) {
            console.error(e);
            logSystem("Profile Sync Failed", 'alert');
        }
    } else {
        // Force Redirect if not logged in (Optional - you can disable this for testing)
        // window.location.href = 'DoD_Login_Style.html';
        logSystem("Running in Guest/Demo Mode", 'alert');
    }
});

// --- 3. DATA STREAMS ---

async function loadStats() {
    // In a real app, you might use 'count' aggregation. 
    // For now, we simulate stats or pull real collection sizes.
    // This is a lightweight check.
    
    const usersSnap = await getDocs(collection(db, 'artifacts', appId, 'users'));
    $('#stat-users').text(usersSnap.size);

    const ordersSnap = await getDocs(collection(db, 'artifacts', appId, 'orders'));
    $('#stat-orders').text(ordersSnap.size);

    // Calculate Revenue (Simple Loop)
    let totalRevenue = 0;
    ordersSnap.forEach(doc => {
        const amt = parseFloat(doc.data().billing?.amount?.replace('$','') || 0);
        totalRevenue += amt;
    });
    $('#stat-revenue').text('$' + totalRevenue.toFixed(2));
    
    logSystem("Tactical Data Streams: SYNCHRONIZED", 'success');
}

async function loadUsers() {
    const q = query(collection(db, 'artifacts', appId, 'users'), limit(10));
    const snap = await getDocs(q);
    
    let html = '';
    snap.forEach(doc => {
        const u = doc.data();
        html += `
            <tr>
                <td style="font-family:monospace; color:#666;">${doc.id.substr(0,5)}...</td>
                <td style="font-weight:bold; color:#fff;">${u.name}</td>
                <td>${u.role?.toUpperCase() || 'UNKNOWN'}</td>
                <td><span class="status-badge status-active">ACTIVE</span></td>
                <td><button class="action-btn">EDIT</button></td>
            </tr>
        `;
    });
    $('#users-table-body').html(html);
}

async function loadOrders() {
    const q = query(collection(db, 'artifacts', appId, 'orders'), orderBy('timestamp', 'desc'), limit(5));
    const snap = await getDocs(q);
    
    let html = '';
    snap.forEach(doc => {
        const o = doc.data();
        html += `
            <tr>
                <td style="font-family:monospace; color:var(--mh-cyan);">${o.transactionId || '---'}</td>
                <td>${o.billing?.fullName || 'Guest'}</td>
                <td>${o.billing?.productName || 'Artifact'}</td>
                <td style="color:var(--mh-green);">${o.billing?.amount || '$0.00'}</td>
                <td><span class="status-badge status-active">COMPLETED</span></td>
            </tr>
        `;
    });
    $('#orders-table-body').html(html);
}

// --- 4. LOGOUT LOGIC ---
$('#btn-logout').click(async () => {
    await signOut(auth);
    window.location.href = 'DoD_Login_Style.html';
});

// --- MISSION CONTROL LOGIC ---
import { addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore.js';

$('#mission-form').on('submit', async (e) => {
    e.preventDefault();
    const btn = $(this).find('button');
    btn.text("BROADCASTING...").prop('disabled', true);

    const missionData = {
        title: $('#mission-title').val(),
        budget: $('#mission-budget').val(),
        deadline: $('#mission-deadline').val(),
        type: $('#mission-type').val(),
        description: $('#mission-desc').val(),
        status: 'OPEN',
        postedBy: 'ADMIN',
        timestamp: serverTimestamp()
    };

    try {
        await addDoc(collection(db, 'artifacts', appId, 'missions'), missionData);
        alert("MISSION BROADCASTED SUCCESSFULLY.");
        $('#mission-form')[0].reset();
        logSystem(`New Mission Deployed: ${missionData.title}`, 'success');
    } catch (error) {
        console.error(error);
        alert("DEPLOYMENT FAILED.");
    }
    btn.text("BROADCAST MISSION").prop('disabled', false);
});