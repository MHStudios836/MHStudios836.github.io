/* assets/js/admin-charts.js - TACTICAL ANALYTICS */
import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { app } from "./firebase-init.js";

const db = getFirestore(app);
const appId = 'mhstudios-836';

export async function initDashboardCharts() {
    console.log("INITIALIZING WAR ROOM ANALYTICS...");

    // 1. FETCH DATA (Parallel Fetch for Speed)
    const [usersSnap, missionsSnap] = await Promise.all([
        getDocs(collection(db, 'artifacts', appId, 'users')),
        getDocs(collection(db, 'artifacts', appId, 'missions'))
    ]);

    // 2. PROCESS USER DATA
    let students = 0, freelancers = 0, admins = 0;
    usersSnap.forEach(doc => {
        const role = doc.data().role;
        if (role === 'student') students++;
        if (role === 'freelancer') freelancers++;
        if (role === 'admin') admins++;
    });

    // 3. PROCESS MISSION DATA
    let active = 0, completed = 0, open = 0;
    missionsSnap.forEach(doc => {
        const status = doc.data().status;
        if (status === 'OPEN') open++;
        if (status === 'ASSIGNED') active++;
        if (status === 'COMPLETED') completed++;
    });

    // 4. RENDER CHARTS
    renderUserChart(students, freelancers, admins);
    renderMissionChart(open, active, completed);
}

function renderUserChart(s, f, a) {
    const ctx = document.getElementById('chart-users');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['INFANTRY (Students)', 'MERCENARIES (Freelancers)', 'COMMAND (Admins)'],
            datasets: [{
                data: [s, f, a],
                backgroundColor: ['#0080FF', '#ffae00', '#ff004c'],
                borderColor: '#000',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom', labels: { color: '#fff' } } }
        }
    });
}

function renderMissionChart(open, active, comp) {
    const ctx = document.getElementById('chart-ops');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['OPEN BOUNTIES', 'ACTIVE OPS', 'COMPLETED'],
            datasets: [{
                label: 'Mission Status',
                data: [open, active, comp],
                backgroundColor: ['#00e5ff', '#ffae00', '#00ff41']
            }]
        },
        options: {
            scales: {
                y: { grid: { color: '#333' }, ticks: { color: '#fff' } },
                x: { ticks: { color: '#fff' } }
            },
            plugins: { legend: { display: false } }
        }
    });
}