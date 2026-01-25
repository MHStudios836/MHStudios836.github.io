/* assets/js/admin-dashboard.js */
import { db, dbID } from './firebase-init.js';
import { collection, getDocs, onSnapshot, query, orderBy, limit, where } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// --- 1. ACTIVATE CHARTS (Live Data) ---
export async function initDashboardCharts() {
    const mChart = document.getElementById('missionChart');
    const rChart = document.getElementById('revenueChart');

    if (!mChart || !rChart) return;

    // A. FETCH COUNTS (Real)
    const missionsRef = collection(db, 'artifacts', dbID, 'missions');
    const snap = await getDocs(missionsRef);
    
    let active = 0, completed = 0, pending = 0;
    snap.forEach(doc => {
        const s = doc.data().status;
        if (s === 'IN_PROGRESS') active++;
        else if (s === 'COMPLETED') completed++;
        else pending++;
    });

    // B. RENDER MISSION CHART
    new Chart(mChart.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Active', 'Done', 'Pending'],
            datasets: [{
                data: [active, completed, pending],
                backgroundColor: ['#00e5ff', '#00ff41', '#333'],
                borderWidth: 0
            }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });

    // C. RENDER REVENUE CHART (Simulated projection for now)
    new Chart(rChart.getContext('2d'), {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Vault Growth',
                data: [1000, 1500, 1200, 2200, 2800, 3500], // Replace with real aggregation later
                borderColor: '#FFD700',
                backgroundColor: 'rgba(255, 215, 0, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: { grid: { color: '#222' } },
                y: { display: false }
            },
            plugins: { legend: { display: false } }
        }
    });
}

// --- 2. ACTIVATE MISSION GRID (Live Table) ---
export function initLiveMissionFeed() {
    const tableBody = document.querySelector('.mh-table tbody');
    if (!tableBody) return;

    // Listen to latest 10 missions
    const q = query(collection(db, 'artifacts', dbID, 'missions'), orderBy('uploadedAt', 'desc'), limit(10));

    onSnapshot(q, (snapshot) => {
        tableBody.innerHTML = ''; // WIPE DUMMY DATA
        
        snapshot.forEach(doc => {
            const m = doc.data();
            const color = m.status === 'COMPLETED' ? '#00ff41' : (m.status === 'IN_PROGRESS' ? '#00e5ff' : '#666');
            
            const row = `
                <tr>
                    <td>#${doc.id.substring(0,6).toUpperCase()}</td>
                    <td style="color:#fff">${m.title || 'CLASSIFIED'}</td>
                    <td><span style="color:${color}">● ${m.status}</span></td>
                    <td class="text-gold">$${m.budget || 0}</td>
                    <td>${m.freelancerName || 'UNASSIGNED'}</td>
                    <td>
                        <button class="btn-action" onclick="alert('Viewing Mission: ${doc.id}')"><i class="fas fa-eye"></i></button>
                    </td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });
    });
}

// --- 3. ACTIVATE LOGS (Live System Events) ---
export function initSystemLogs() {
    // We target the container that holds the .log-entry divs
    const container = document.getElementById('real-time-logs'); 
    if (!container) return;

    // Generate Fake "Live" Traffic (or connect to a real 'logs' collection)
    const events = [
        { msg: "FIREWALL SCAN COMPLETE", type: "info" },
        { msg: "NEW USER REGISTERED", type: "success" },
        { msg: "DB LATENCY: 24ms", type: "warn" }
    ];

    container.innerHTML = ''; // Clear dummies
    
    events.forEach(e => {
        addLogEntry(e.msg, e.type);
    });

    // Simulate incoming traffic every 5 seconds
    setInterval(() => {
        const sysMsg = `PACKET SYNC: ${Math.floor(Math.random() * 999)}MB`;
        addLogEntry(sysMsg, 'info');
    }, 5000);
}

function addLogEntry(text, type) {
    const container = document.getElementById('real-time-logs');
    if(!container) return;

    const div = document.createElement('div');
    div.className = 'log-entry';
    let color = type === 'success' ? 'var(--mh-green)' : (type === 'warn' ? 'var(--mh-gold)' : 'var(--mh-cyan)');
    
    div.innerHTML = `
        <span class="log-time">[${new Date().toLocaleTimeString('en-US',{hour12:false})}]</span>
        <span style="color:${color}">> ${text}</span>
    `;
    
    container.prepend(div); // Add to top
    if (container.children.length > 20) container.lastElementChild.remove(); // Keep clean
}