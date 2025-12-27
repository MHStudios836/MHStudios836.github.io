// assets/js/shop-catalog.js
import { db, appId } from './firebase-init.js';
import { collection, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore.js';

// INJECT CSS VIA JS (Emergency Fix for visibility)
const style = document.createElement('style');
style.innerHTML = `
    .product-card { opacity: 0; transform: translateY(20px); transition: all 0.6s ease-out; }
    .product-card.visible { opacity: 1; transform: translateY(0); }
`;
document.head.appendChild(style);

const $grid = $('#catalog-grid');

const simulationData = [
    { id: 's1', title: 'Titan UI Kit', category: 'web', price: 49.99, description: 'Pro Dashboard components.', image: 'images/pic01.jpg' },
    { id: 's2', title: 'Neon Logo Pack', category: 'design', price: 29.00, description: 'Tech branding assets.', image: 'images/pic02.jpg' },
    { id: 's3', title: 'Cyber Audio', category: 'audio', price: 15.00, description: 'Interface sound FX.', image: 'images/pic03.jpg' }
];

function renderGrid(products) {
    $grid.empty();
    products.forEach((item, index) => {
        const html = `
            <div class="product-card" id="card-${index}">
                <div class="card-image" style="background-image: url('${item.image || 'images/overlay.png'}'); height: 200px; background-size: cover; position: relative;">
                    <span style="position: absolute; top: 10px; right: 10px; background: #000; color: #00e5ff; padding: 5px; border: 1px solid #00e5ff; font-size:12px;">${item.category}</span>
                </div>
                <div class="card-body" style="padding: 20px; background: rgba(20,24,35,0.95); border: 1px solid rgba(0,128,255,0.3); border-top:none;">
                    <h3 style="color:#fff; margin-bottom:10px;">${item.title}</h3>
                    <p style="color:#888; font-size: 0.9em; min-height:40px;">${item.description}</p>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:15px; border-top: 1px solid #333; padding-top:10px;">
                        <span style="color:#0080FF; font-weight:bold; font-size:1.2em;">$${item.price}</span>
                        <a href="Product_Room.html?id=${item.id}" style="border: 1px solid #0080FF; padding: 5px 12px; color: #0080FF; text-decoration: none; font-size:0.8em; font-weight:bold;">INSPECT</a>
                    </div>
                </div>
            </div>`;
        $grid.append(html);
        
        // Trigger animation after a tiny delay
        setTimeout(() => {
            $(`#card-${index}`).addClass('visible');
        }, 100 * index);
    });
}

$(document).ready(async () => {
    console.log("MH Armory: System Online.");
    renderGrid(simulationData); // Show immediately

    try {
        const q = query(collection(db, 'artifacts', appId, 'products'), where("status", "==", "available"));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            const realData = [];
            snapshot.forEach(doc => realData.push({ id: doc.id, ...doc.data() }));
            renderGrid(realData);
        }
    } catch (e) { console.warn("Firebase restricted. Staying in simulation."); }
});