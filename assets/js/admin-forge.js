/* assets/js/admin-forge.js - THE ARMORY FACTORY */
import { db, storage, DB_PATH } from './firebase-init.js';
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-storage.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

/**
 * FORGE NEW PRODUCT
 * Handles Image Upload -> URL Retrieval -> Database Entry
 * @param {Object} data - { title, price, type, description, imageFile }
 */
export async function forgeNewProduct(data) {
    console.log("FORGE: INITIATING PRODUCTION...", data);

    try {
        let imageUrl = ""; 

        // 1. UPLOAD IMAGE (If provided)
        if (data.imageFile) {
            // Create a unique filename: products/TIMESTAMP_filename
            const fileName = `products/${Date.now()}_${data.imageFile.name}`;
            const storageRef = ref(storage, fileName);
            
            console.log("FORGE: UPLOADING ASSET...");
            const snapshot = await uploadBytes(storageRef, data.imageFile);
            imageUrl = await getDownloadURL(snapshot.ref);
        } else {
            // Use a default placeholder if no image
            imageUrl = "assets/images/placeholder_product.jpg"; 
        }

        // 2. CREATE DATABASE ENTRY
        // Saves to: artifacts/mhstudios-836/products
        const productRef = collection(db, `${DB_PATH}/products`);
        
        await addDoc(productRef, {
            title: data.title,
            type: data.type.toUpperCase(), // 'PHYSICAL', 'SERVICE', 'MERC_HIRE'
            price: parseFloat(data.price),
            description: data.description,
            image_url: imageUrl,
            stock: 100, // Default stock
            likes: 0,
            status: 'ACTIVE',
            created_at: serverTimestamp()
        });

        console.log("FORGE: ASSET DEPLOYED SUCCESSFULLY.");
        return true;

    } catch (error) {
        console.error("FORGE ERROR:", error);
        alert("PRODUCTION FAILED: " + error.message);
        return false;
    }
}