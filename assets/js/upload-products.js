import { db, appId } from './assets/js/firebase-init.js';
import { collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore.js';

const initialProducts = [
    {
        name: "Project: IRONCLAD - Alpha Access",
        branch: "MH Stores™",
        category: "Game Access",
        price: 29.99,
        description: "Early access pass for the IRONCLAD Mil-Sim tactical simulation.",
        imageUrl: "images/ironclad_thumb.png"
    },
    {
        name: "Creative Arts® Vector Pack v1",
        branch: "Creative Arts®",
        category: "Graphic Assets",
        price: 15.00,
        description: "100+ High-fidelity tactical vector icons and HUD elements.",
        imageUrl: "images/vector_pack_thumb.png"
    }
];

async function uploadInventory() {
    console.log("Checking Uplink...");
    const productRef = collection(db, 'artifacts', appId, 'products');

    for (const item of initialProducts) {
        try {
            await addDoc(productRef, {
                ...item,
                status: 'ACTIVE',
                createdAt: serverTimestamp()
            });
            console.log(`Deployed: ${item.name}`);
        } catch (error) {
            console.error(`Deployment Failed for ${item.name}:`, error);
        }
    }
}

// Run once to populate
// uploadInventory();