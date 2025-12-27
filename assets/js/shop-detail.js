// assets/js/shop-detail.js
import { db, appId } from './firebase-init.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore.js';

// Fallback Simulation Data (Matches the Catalog)
const simulationData = {
    's1': { title: 'Titan UI Kit', category: 'Web Systems', price: 49.99, description: 'A massive collection of high-end UI components designed for administrative dashboards. Fully responsive, neon-optimized, and built for speed.', image: 'images/pic01.jpg' },
    's2': { title: 'Neon Logo Pack', category: 'Design', price: 29.00, description: 'Vector assets for tech startups. Includes 20 unique high-energy logo concepts with full color control.', image: 'images/pic02.jpg' },
    's3': { title: 'Cyber Audio', category: 'Audio FX', price: 15.00, description: 'The ultimate sound library for interface designers. Contains glitches, sweeps, and mechanical clicks.', image: 'images/pic03.jpg' }
};

$(document).ready(async () => {
    // 1. GET ID FROM URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        window.location.href = 'Products_Services_Room.html';
        return;
    }

    console.log("Inspecting Artifact:", productId);

    // 2. FETCH DATA
    let productData = null;

    // Check if it's a simulation ID (starts with 's')
    if (productId.startsWith('s')) {
        productData = simulationData[productId];
    } else {
        // Fetch from Real Firebase
        try {
            const docRef = doc(db, 'artifacts', appId, 'products', productId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                productData = docSnap.data();
            }
        } catch (e) { console.error("Firebase fetch failed."); }
    }

    // 3. RENDER OR ERROR
    if (productData) {
        renderProduct(productId, productData);
    } else {
        $('#target-title').text("ID NOT FOUND");
        $('#loading-screen').fadeOut();
    }
});

function renderProduct(id, data) {
    $('#target-id').text(id.toUpperCase());
    $('#target-title').text(data.title);
    $('#target-price').text(`$${data.price}`);
    $('#target-desc').text(data.description);
    $('#target-cat').text(data.category);
    $('#target-img').attr('src', data.image || 'images/overlay.png');

    // Reveal
    setTimeout(() => {
        $('#loading-screen').fadeOut(500);
    }, 1000);
}

// Purchase Handler
$('#buy-btn').on('click', () => {
    const title = $('#target-title').text();
    alert(`PURCHASE PROTOCOL INITIATED: ${title}\nRedirecting to secure gateway...`);
    window.location.href = 'Payment_Gateway.html';
});

// Add these to the end of your assets/js/shop-detail.js

// 1. Wishlist Protocol
$('#wish-btn').on('click', function() {
    $(this).find('i').toggleClass('far fas');
    $(this).css('color', '#FF4500');
    alert("ARTIFACT SAVED TO SECURE WISHLIST.");
});

// 2. Like Protocol
$('.social-action:contains("LIKE")').on('click', function() {
    $(this).css('color', '#00e5ff');
    logToTerminal("Positive signal sent to database.");
});

// 3. Share Protocol
$('.social-action:contains("SHARE")').on('click', function() {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl);
    alert("SECURE LINK COPIED TO CLIPBOARD.");
});