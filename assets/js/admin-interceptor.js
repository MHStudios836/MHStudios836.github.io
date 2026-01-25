/* assets/js/admin_interceptor.js */
// 1. Import DB_PATH from your init file
import { auth, db, DB_PATH } from './firebase-init.js'; 
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { collection, doc, onSnapshot, addDoc, serverTimestamp, query, orderBy, getDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// 2. GET THE FREQUENCY (Chat ID)
const urlParams = new URLSearchParams(window.location.search);
const chatId = urlParams.get('chat_id');

if (!chatId) {
    document.body.innerHTML = "<h2 style='color:red; text-align:center'>ERROR: NO TARGET SIGNAL FOUND</h2>";
}

// 3. CONNECT USING THE VARIABLE
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // We use DB_PATH here instead of hardcoding the string
        const userRef = doc(db, `${DB_PATH}/users/${user.uid}`);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists() && userSnap.data().role === 'admin') {
            console.log("INTERCEPTOR: AUTHORIZED");
            initWiretap(user);
        } else {
            document.body.innerHTML = "ACCESS DENIED.";
        }
    }
});

function initWiretap(adminUser) {
    document.getElementById('target-id').innerText = `TARGET FREQUENCY: ${chatId}`;
    
    // Connect to Messages Subcollection
    const msgsRef = collection(db, `${BASE_PATH}/chats/${chatId}/messages`);
    const q = query(msgsRef, orderBy("timestamp", "asc"));

    // LISTEN (Real-time)
    onSnapshot(q, (snapshot) => {
        const feed = document.getElementById('chat-feed');
        feed.innerHTML = ""; // Clear for redraw (simple approach)

        snapshot.forEach(docSnap => {
            const msg = docSnap.data();
            const div = document.createElement('div');
            
            // Logic to color code the bubbles
            let type = "target"; // Default
            if (msg.role === "admin") type = "admin"; // You
            if (msg.role === "freelancer") type = "merc"; 
            
            div.className = `msg-bubble ${type}`;
            div.innerHTML = `
                <strong style="font-size:0.7em; color:#aaa">${msg.senderName || 'Unknown'}</strong><br>
                ${msg.text}
            `;
            feed.appendChild(div);
        });
        
        // Auto-scroll to bottom
        feed.scrollTop = feed.scrollHeight;
    });
}

// 3. INJECT MESSAGE (The Voice of God)
window.injectMessage = async function() {
    const input = document.getElementById('admin-msg');
    const text = input.value;
    
    if (!text) return;

    const msgsRef = collection(db, `${BASE_PATH}/chats/${chatId}/messages`);
    
    await addDoc(msgsRef, {
        text: `[ADMIN OVERRIDE]: ${text}`, // Adds a prefix so they know it's serious
        senderId: auth.currentUser.uid,
        senderName: "SYSTEM ADMIN",
        role: "admin",
        timestamp: serverTimestamp()
    });

    input.value = "";
};

// Allow "Enter" key to send
document.getElementById('admin-msg').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        window.injectMessage();
    }
});