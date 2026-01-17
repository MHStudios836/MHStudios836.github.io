/* assets/js/payment-handler.js */
import { auth, db, dbID } from './firebase-init.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

$(document).ready(() => {
    // 1. LOAD URL PARAMS
    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('id');
    const itemName = urlParams.get('name');
    const itemPrice = urlParams.get('price');

    if(itemId) {
        $('#item-name').text(itemName || "Unknown Artifact");
        $('#total-price').text("$" + itemPrice);
    } else {
        console.warn("No Item ID found in URL.");
    }

    // 2. EXECUTE PAYMENT
    $('#execute-btn').on('click', async function(e) {
        e.preventDefault();
        const btn = $(this);
        
        if(!auth.currentUser) return alert("LOGIN REQUIRED");

        btn.prop('disabled', true).text("PROCESSING...");

        try {
            // A. Create Order Record
            // THIS TRIGGER IS WHAT WAKES UP THE CLOUD FUNCTION 'processOrder'
            await addDoc(collection(db, 'artifacts', dbID, 'orders'), {
                buyerId: auth.currentUser.uid,
                itemId: itemId,
                itemName: itemName,
                price: parseFloat(itemPrice),
                timestamp: serverTimestamp(),
                status: 'PENDING' // The Cloud Function will change this to COMPLETED or FAILED
            });

            // B. Success Message (UI Only)
            // We assume success here, but the real logic happens in the background
            alert("ORDER PLACED. VERIFYING FUNDS & TRANSFERRING ASSET...");
            window.location.href = 'Products_Services_Room.html';

        } catch (error) {
            console.error(error);
            alert("CONNECTION ERROR: " + error.message);
            btn.prop('disabled', false).text("CONFIRM PAYMENT");
        }
    });
});