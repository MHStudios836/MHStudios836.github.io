// --- assets/js/admin-charts.js (INTELLIGENCE) ---

// Note: Chart.js is loaded via CDN in the HTML head, so 'Chart' is a global variable.

let mainTrafficChart = null;

export function initCharts() {
    const ctx = document.getElementById('mainChart');
    if (!ctx) return; // Safety check

    console.log("[CHARTS] Initializing Tactical Display...");

    // Destroy existing chart if re-initializing to prevent "glitching" overlay
    const chartStatus = Chart.getChart("mainChart"); 
    if (chartStatus != undefined) {
        chartStatus.destroy();
    }

    // --- 1. THE SETUP ---
    // Create a cool gradient for the line
    const context = ctx.getContext('2d');
    const gradient = context.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(0, 128, 255, 0.6)'); // MH Blue (Top)
    gradient.addColorStop(1, 'rgba(0, 128, 255, 0)');   // Transparent (Bottom)

    // --- 2. THE DATA (Simulated Real-Time) ---
    // In Phase 4, we will fetch this from Firestore Stats
    const dataPoints = [15, 25, 20, 45, 30, 60, 75]; 
    const labels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'];

    // --- 3. THE RENDER ---
    mainTrafficChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Encrypted Traffic',
                data: dataPoints,
                backgroundColor: gradient,
                borderColor: '#0080FF',
                borderWidth: 2,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#0080FF',
                pointHoverRadius: 6,
                fill: true,
                tension: 0.4 // Smooth curves
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Fits the container height
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleColor: '#0080FF',
                    bodyFont: { family: "'Courier New', monospace" }
                }
            },
            scales: {
                x: {
                    grid: { display: false }, // Cleaner look
                    ticks: { color: '#666' }
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#666' },
                    beginAtZero: true
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeOutQuart'
            }
        }
    });
}