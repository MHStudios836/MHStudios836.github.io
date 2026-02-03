/* assets/js/payment-handler.js */
import { auth } from './firebase-init.js';
import { executeStorePurchase } from './finance-core.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

// DOM ELEMENTS
const btnPay = document.getElementById('execute-btn');
const statusText = document.getElementById('payment-status'); // Ensure you have a div/p with this ID

// 1. LOAD DATA FROM URL (The Handshake)
const urlParams = new URLSearchParams(window.location.search);
const itemData = {
    id: urlParams.get('id'),
    name: urlParams.get('name'),
    price: parseFloat(urlParams.get('price')) || 0
};

// 2. RENDER RECEIPT
if (itemData.id) {
    document.getElementById('item-name').innerText = itemData.name || "Unknown Asset";
    document.getElementById('total-price').innerText = `$${itemData.price.toFixed(2)}`;
} else {
    alert("INVALID ACCESS: No Order ID Detected.");
    window.location.href = 'Products_Services_Room.html';
}

// 3. PAYMENT TRIGGER
btnPay.addEventListener('click', async (e) => {
    e.preventDefault();
    
    // Auth Check
    const user = auth.currentUser;
    if (!user) {
        alert("IDENTITY REQUIRED. PLEASE LOG IN.");
        return;
    }

    // UI Feedback
    btnPay.disabled = true;
    btnPay.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> SECURING FUNDS...';
    if(statusText) statusText.innerText = "CONTACTING BANKING MAINFRAME...";

    try {
        // CALL THE ENGINE
        await executeStorePurchase(user.uid, itemData);

        // SUCCESS SEQUENCE
        if(statusText) {
            statusText.innerText = "TRANSACTION CLEARED. UPDATING LEDGER...";
            statusText.style.color = "#00ff41";
        }
        
        // Play Sound (Optional if you have sound-engine)
        // playSound('cash_register'); 

        setTimeout(() => {
            alert(`ACQUISITION CONFIRMED.\n\nItem: ${itemData.name}\nCost: $${itemData.price}`);
            window.location.href = 'Student_Room.html'; // Or Inventory Page
        }, 1500);

    } catch (error) {
        // FAILURE SEQUENCE
        console.error(error);
        btnPay.disabled = false;
        btnPay.innerHTML = '<i class="fas fa-exclamation-triangle"></i> RETRY PAYMENT';
        if(statusText) {
            statusText.innerText = "ERROR: " + error;
            statusText.style.color = "#ff004c";
        }
        alert("TRANSACTION DECLINED: " + error);
    }
});