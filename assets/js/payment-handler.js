/* assets/js/payment-handler.js */
import { auth, db, dbID } from './firebase-init.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { recordProductSale } from './transaction-siphon.js';

$(document).ready(() => {
    // 1. LOAD URL PARAMS (Populate the Receipt)
    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('id');
    const itemName = urlParams.get('name');
    const itemPrice = urlParams.get('price');

    if(itemId) {
        $('#item-name').text(itemName || "Unknown Artifact");
        $('#total-price').text("$" + itemPrice);
    } else {
        alert("ERROR: No Invoice Detected.");
        window.location.href = 'Products_Services_Room.html';
    }

    // 2. EXECUTE PAYMENT
    $('#execute-btn').on('click', async function(e) {
        e.preventDefault();
        const btn = $(this);
        
        if(!auth.currentUser) return alert("LOGIN REQUIRED");

        btn.prop('disabled', true).text("VERIFYING FUNDS...");

        try {
            // A. Create Order Record
            await addDoc(collection(db, 'artifacts', dbID, 'orders'), {
                buyerId: auth.currentUser.uid,
                itemId: itemId,
                itemName: itemName,
                price: parseFloat(itemPrice),
                timestamp: serverTimestamp(),
                status: 'PAID'
            });

            // B. Update Vault & Analytics
            await recordProductSale(itemId, parseFloat(itemPrice), auth.currentUser.uid);

            // C. Success
            alert("PAYMENT SUCCESSFUL. ASSET TRANSFERRED.");
            window.location.href = 'Products_Services_Room.html';

        } catch (error) {
            console.error(error);
            alert("TRANSACTION DECLINED: " + error.message);
            btn.prop('disabled', false).text("RE-TRY TRANSACTION");
        }
    });
});