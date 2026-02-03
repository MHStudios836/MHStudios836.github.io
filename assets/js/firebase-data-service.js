// assets/js/firebase-data-service.js
// STATUS: REPAIRED & STANDARDIZED

import { db, DB_PATH } from './firebase-init.js'; // Changed dbID to DB_PATH
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

/**
 * Fetch a single product by ID
 */
export async function fetchProduct(productId) {
    const productRef = doc(db, `${DB_PATH}/products/${productId}`);
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
    // UPDATED: Uses DB_PATH
    const productsRef = collection(db, `${DB_PATH}/products`);
    const q = query(productsRef); 
    
    try {
        const querySnapshot = await getDocs(q);
        const products = [];
        querySnapshot.forEach((doc) => {
            products.push({ id: doc.id, ...doc.data() });
        });
        return products;
    } catch (error) {
        console.error("Error fetching arsenal:", error);
        return [];
    }
}

// MH Studios Data Uplink
// Handles submissions to Firestore

// 1. Initialize the Database Reference
const db = firebase.firestore();

// 2. The Main Function: Submit Service Request
/**
 * Submit a Service Request
 */
export async function submitServiceRequest(requestData) {
    try {
        // UPDATED: Uses DB_PATH
        const requestsRef = collection(db, `${DB_PATH}/service_requests`);
        
        const docRef = await addDoc(requestsRef, {
            ...requestData,
            timestamp: serverTimestamp(),
            status: "PENDING"
        });
        
        console.log("Transmission Successful. ID:", docRef.id);
        return { success: true, id: docRef.id };

    } catch (error) {
        console.error("Transmission Blocked:", error);
        return { success: false, error: error.message };
    }
}