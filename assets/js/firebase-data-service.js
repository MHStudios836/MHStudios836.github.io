// assets/js/firebase-data-service.js
// STATUS: UPGRADED [VERSION 12.7.0]

import { db, dbID } from './firebase-init.js';
import { doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

/**
 * Fetch a single product by ID
 */
export async function fetchProduct(productId) {
    const productRef = doc(db, 'artifacts', dbID, 'products', productId);
    try {
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
            return { id: productSnap.id, ...productSnap.data() };
        } else {
            console.log("Artifact not found.");
            return null;
        }
    } catch (error) {
        console.error("Error fetching artifact:", error);
        throw error;
    }
}

/**
 * Fetch all available products
 */
export async function fetchAvailableProducts() {
    const productsRef = collection(db, 'artifacts', dbID, 'products');
    // Example: Only show items that have price > 0 or status 'active'
    // For now, we fetch all to be safe
    const q = query(productsRef); 
    
    try {
        const querySnapshot = await getDocs(q);
        const products = [];
        querySnapshot.forEach((doc) => {
            products.push({ id: doc.id, ...doc.data() });
        });
        return products;
    } catch (error) {
        console.error("Error loading Armory:", error);
        return [];
    }
}

// MH Studios Data Uplink
// Handles submissions to Firestore

// 1. Initialize the Database Reference
const db = firebase.firestore();

// 2. The Main Function: Submit Service Request
async function submitServiceRequest(event) {
    // Prevent the page from refreshing (which kills the data)
    event.preventDefault();

    console.log("[UPLINK] Initiating transmission...");

    // 3. Grab the Data from the Form Inputs using their IDs
    // (We will make sure these IDs match your HTML in Phase 2)
    const requestData = {
        clientName: document.getElementById('client-name').value,
        clientEmail: document.getElementById('client-email').value,
        serviceType: document.getElementById('service-type').value, // e.g., "Web Design", "Hardware Fix"
        urgency: document.getElementById('urgency-level').value,
        details: document.getElementById('request-details').value,
        
        // Metadata (Crucial for tracking)
        status: "PENDING", // Default status
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        ip_tracker: "LOGGED" // Placeholder for security logging
    };

    try {
        // 4. Send to Firestore Collection "service_requests"
        const docRef = await db.collection('service_requests').add(requestData);
        
        console.log("[SUCCESS] Request logged with ID: ", docRef.id);
        
        // 5. Visual Feedback (The "BOOM" effect)
        alert("Transmission Received. MH Studios will contact you shortly.");
        
        // Optional: Clear the form
        document.getElementById('service-request-form').reset();

    } catch (error) {
        console.error("[FAILURE] Transmission blocked: ", error);
        alert("Error sending request. Check console.");
    }
}