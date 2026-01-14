// assets/js/admin-products.js
// STATUS: UPGRADED [FILE UPLOAD ENABLED]

import { db, dbID, storage } from './firebase-init.js';
import { 
    collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy 
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { 
    ref, uploadBytesResumable, getDownloadURL 
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-storage.js";

const $inventoryBody = $('#product-mini-list'); 

// --- 1. FILE UPLOAD LOGIC ---
window.triggerProductUpload = function(input) {
    const file = input.files[0];
    if (!file) return;

    // UI Feedback
    const progressBar = document.getElementById('upload-progress');
    const urlInput = document.getElementById('prod-img');
    progressBar.style.display = 'block';
    progressBar.style.width = '10%';

    // Create Storage Reference (artifacts/MH.../product_images/timestamp_name)
    const storageRef = ref(storage, `artifacts/${dbID}/product_images/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
        (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            progressBar.style.width = progress + '%';
            console.log('Upload is ' + progress + '% done');
        }, 
        (error) => {
            console.error("UPLOAD FAILED:", error);
            alert("UPLOAD ERROR: " + error.message);
            progressBar.style.background = 'red';
        }, 
        () => {
            // Upload completed successfully, get download URL
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                console.log('File available at', downloadURL);
                urlInput.value = downloadURL; // Auto-fill the text box
                window.updatePreview(); // Trigger the visual preview
                progressBar.style.background = '#00ff41'; // Green success
                setTimeout(() => progressBar.style.display = 'none', 2000);
            });
        }
    );
};

// --- 2. FORGE NEW ASSET ---
export async function forgeNewProduct(productData) {
    try {
        const productsRef = collection(db, 'artifacts', dbID, 'products');
        
        // Ensure we send 'imageUrl' and 'branch' to match the Armory's expectations
        await addDoc(productsRef, {
            name: productData.name,
            price: productData.price,
            branch: productData.branch,      // Maps to 'category' dropdown
            imageUrl: productData.imageUrl,  // Maps to 'image' input
            description: productData.description,
            
            createdAt: serverTimestamp(),
            salesCount: 0,
            status: 'ACTIVE'
        });
        
        console.log(">> ASSET DEPLOYED TO ARMORY.");
        refreshInventory(); 
        return true;
    } catch (error) {
        console.error("FORGE FAILURE:", error);
        return false;
    }
}

// --- 3. REFRESH INVENTORY ---
export async function refreshInventory() {
    if (!$inventoryBody.length) return;
    
    $inventoryBody.html('<tr><td colspan="3">SCANNING...</td></tr>');
    const q = query(collection(db, 'artifacts', dbID, 'products'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    $inventoryBody.empty();
    snapshot.forEach(docSnap => {
        const item = docSnap.data();
        $inventoryBody.append(`
            <tr>
                <td>${item.name}</td>
                <td class="text-gold">$${item.price}</td>
                <td>
                    <i class="fas fa-trash text-red" style="cursor:pointer;" 
                       onclick="window.scrapProduct('${docSnap.id}')"></i>
                </td>
            </tr>
        `);
    });
}

// --- 4. SCRAP PRODUCT ---
window.scrapProduct = async (id) => {
    if(!confirm("ARE YOU SURE YOU WANT TO SCRAP THIS ASSET?")) return;
    await deleteDoc(doc(db, 'artifacts', dbID, 'products', id));
    refreshInventory();
};