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