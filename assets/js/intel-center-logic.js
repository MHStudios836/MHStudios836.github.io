/* assets/js/intel-center-logic.js */
import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { app } from "./firebase-init.js";
import { requireAuth } from "./auth-guard.js";
import { formatBounty, formatTacticalDate } from "./data-transformer.js";
import { decryptEffect } from "./ui-terminal-fx.js";
import { attachHoverSounds } from "./sound-engine.js";

const db = getFirestore(app);
const appId = 'mhstudios-836';

requireAuth(async (user) => {
    // 1. Get User Role to set the theme
    const userDoc = await getDocs(query(collection(db, 'artifacts', appId, 'users'), where("__name__", "==", user.uid)));
    const userData = userDoc.docs[0].data();
    const role = userData.role || 'student';

    setupUI(role);
    loadContent(role);
});

function setupUI(role) {
    document.body.className = `theme-${role}`;
    const title = document.getElementById('board-title');
    const subtitle = document.getElementById('board-subtitle');
    
    if (role === 'freelancer' || role === 'admin') {
        decryptEffect(title, "MISSION_BOARD");
        subtitle.innerText = "SQUAD_OBJECTIVES // AVAILABLE_CONTRACTS";
    } else {
        decryptEffect(title, "ACADEMIC_GRID");
        subtitle.innerText = "COURSE_PROGRESS // TRAINING_MODULES";
    }
    
    document.getElementById('loader').style.display = 'none';
}

async function loadContent(role) {
    const grid = document.getElementById('main-grid');
    grid.innerHTML = ''; // Clear

    let colName = (role === 'freelancer' || role === 'admin') ? 'missions' : 'courses';
    
    try {
        const querySnapshot = await getDocs(collection(db, 'artifacts', appId, colName));
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const card = createCard(data, doc.id, role);
            grid.appendChild(card);
        });

        attachHoverSounds('.intel-card');
    } catch (err) {
        console.error("UPLINK FAILURE:", err);
    }
}

function createCard(data, id, role) {
    const div = document.createElement('div');
    div.className = 'intel-card';
    
    // Link to either Contract Form or Course View
    const targetUrl = role === 'freelancer' ? `Contract_Form.html?id=${id}` : `Course_View.html?id=${id}`;
    div.onclick = () => window.location.href = targetUrl;

    const bottomValue = role === 'freelancer' ? formatBounty(data.budget) : `${data.progress || 0}% COMPLETE`;
    const tagLabel = role === 'freelancer' ? data.type : "MODULE";
	
	// Add this inside the HTML template literal of createCard()
	const progress = data.progress || 0;
	const progressBarHTML = `
		<div class="progress-container">
			<div class="progress-bar" style="width: ${progress}%"></div>
		</div>
	`;

	// Inject into the card's body
	div.innerHTML = `
		<span class="tag">${tagLabel.toUpperCase()}</span>
		<h3>${data.title.toUpperCase()}</h3>
		${progressBarHTML} 
		<p>${data.description.substring(0, 100)}...</p>
		...
	`;
	
    div.innerHTML = `
        <span class="tag">${tagLabel.toUpperCase()}</span>
        <h3>${data.title.toUpperCase()}</h3>
        <p>${data.description ? data.description.substring(0, 100) + '...' : 'No data available.'}</p>
        <div class="card-footer">
            <span>REF: ${id.substring(0,6).toUpperCase()}</span>
            <span>${bottomValue}</span>
        </div>
    `;
    return div;
	
}