// assets/js/firebase-data-service.js

import { db, appId } from './firebase-init.js'; // Use your initialised db object
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore.js';

/**
 * Standard function to get product data from the 'products' collection.
 * @param {string} productId - The ID of the product to fetch.
 * @returns {Promise<Object|null>} The product data or null if not found.
 */
async function fetchProduct(productId) {
    const productRef = doc(db, 'artifacts', appId, 'products', productId);
    try {
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
            return { id: productSnap.id, ...productSnap.data() };
        } else {
            console.log("No such product document!");
            return null;
        }
    } catch (error) {
        console.error("Error fetching product:", error);
        throw error;
    }
}

/**
 * Fetches all products marked as 'available'.
 * @returns {Promise<Array>} An array of product objects.
 */
async function fetchAvailableProducts() {
    const productsCollectionRef = collection(db, 'artifacts', appId, 'products');
    const q = query(productsCollectionRef, where("status", "==", "available"));
    
    try {
        const querySnapshot = await getDocs(q);
        const products = [];
        querySnapshot.forEach((doc) => {
            products.push({ id: doc.id, ...doc.data() });
        });
        return products;
    } catch (error) {
        console.error("Error fetching available products:", error);
        throw error;
    }
}

export { fetchProduct, fetchAvailableProducts };