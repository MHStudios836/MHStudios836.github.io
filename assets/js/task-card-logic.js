/* assets/js/task-card-logic.js */
// THE UNIVERSAL TASK CARD GENERATOR

/**
 * 1. PRIORITY CALCULATOR
 * Calculates urgency based on Deadline vs Now
 */
function calculatePriority(deadlineStr) {
    if (!deadlineStr) return { label: "LOW", class: "p-low" };
    
    const deadline = new Date(deadlineStr);
    const now = new Date();
    const diffTime = deadline - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) return { label: "CRITICAL", class: "p-critical" }; // < 1 Day
    if (diffDays <= 3) return { label: "HIGH", class: "p-high" };         // < 3 Days
    if (diffDays <= 7) return { label: "INTERMEDIATE", class: "p-inter" };// < 1 Week
    return { label: "LOW", class: "p-low" };                              // > 1 Week
}

/**
 * 2. RELATIVE TIME CALCULATOR
 * "Posted 2 months ago"
 */
function timeAgo(dateObj) {
    if (!dateObj) return "Just now";
    const date = dateObj.toDate ? dateObj.toDate() : new Date(dateObj); // Handle Firebase Timestamp
    const seconds = Math.floor((new Date() - date) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    return "Just now";
}

/**
 * 3. THE MASTER RENDER FUNCTION
 * @param {Object} data - Firebase Mission Data
 * @param {String} id - Mission ID
 * @param {String} mode - 'public' (Broadcast), 'student' (My Posts), 'freelancer' (Active)
 */
export function renderTaskCard(data, id, mode = 'public') {
    
    // A. CALCULATE DERIVED DATA
    const priority = calculatePriority(data.deadline);
    const postedTime = timeAgo(data.createdAt);
    const location = data.university || "Unknown Location";
    const budget = data.budget ? `$${data.budget}` : "Negotiable";
    const proposals = data.proposals ? data.proposals.length : 0;
    
    // B. ACTION BUTTON LOGIC (Changes based on page)
    let actionButton = "";
    if (mode === 'public') {
        actionButton = `<button class="ttc-btn-mini" onclick="window.location.href='Contract_Form.html?id=${id}'">INSPECT</button>`;
    } else if (mode === 'freelancer') {
        actionButton = `<button class="ttc-btn-mini" style="background:#00ff41; color:#000;" onclick="window.location.href='Mission_Deliverables.html?id=${id}'">DELIVER</button>`;
    } else if (mode === 'student') {
        actionButton = `<button class="ttc-btn-mini" style="background:#444;" onclick="alert('Manage Feature Coming Soon')">MANAGE</button>`;
    }

    // C. GENERATE HTML
    return `
    <div class="titan-task-card" id="card-${id}">
        
        <div class="ttc-header">
            <span>Posted ${postedTime}</span>
            <div class="ttc-socials">
                <i class="fas fa-heart" onclick="togglePanel('${id}', 'like', this)"></i>
                <i class="fas fa-share-alt" onclick="togglePanel('${id}', 'share')"></i>
                <i class="fas fa-comment-alt" onclick="togglePanel('${id}', 'comment')"></i>
            </div>
        </div>

        <div id="share-${id}" class="ttc-panel">
            <i class="fab fa-facebook"></i> <i class="fab fa-twitter"></i> <i class="fab fa-whatsapp"></i>
            <span style="font-size:0.8em; margin-left:10px;">Link Copied!</span>
        </div>
        <div id="comment-${id}" class="ttc-panel">
            <input type="text" class="ttc-input" placeholder="Ask a question...">
            <button class="ttc-btn-mini">SEND</button>
        </div>

        <div class="ttc-title-row">
            <h3 class="ttc-title" onclick="window.location.href='Contract_Form.html?id=${id}'">${data.title}</h3>
            <span class="ttc-priority ${priority.class}">${priority.label}</span>
        </div>

        <div class="ttc-meta-row">
            <span class="ttc-meta-item"><i class="fas fa-money-bill"></i> <strong>${budget}</strong> (Fixed)</span>
            <span class="ttc-meta-item"><i class="fas fa-layer-group"></i> Intermediate</span>
            <span class="ttc-meta-item"><i class="fas fa-map-marker-alt"></i> ${location}</span>
        </div>

        <div class="ttc-desc">
            ${data.description.substring(0, 200)}... <a href="Contract_Form.html?id=${id}" style="color:var(--mh-blue)">more</a>
        </div>

        <div class="ttc-tags">
            ${(data.tags || ["General", "Task"]).map(tag => `<span class="ttc-tag">${tag}</span>`).join('')}
        </div>

        <div class="ttc-footer">
            <span><i class="fas fa-check-circle verified-badge"></i> Payment Verified</span>
            <span><span class="rating-stars"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i></span> 5.0</span>
            <span><i class="fas fa-file-contract"></i> Proposals: ${proposals}</span>
            <span style="margin-left:auto; color:#fff;">Deadline: ${data.deadline || 'ASAP'}</span>
            
            <div style="margin-left: 15px;">${actionButton}</div>
        </div>

        <div style="font-size:0.6em; color:#444; margin-top:10px;">ID: ${id}</div>

    </div>
    `;
}

/**
 * 4. INTERACTION TOGGLES (Global Scope)
 */
window.togglePanel = function(id, type, iconElement) {
    if (type === 'like') {
        iconElement.classList.toggle('liked');
        // Add firebase logic here later
        return;
    }

    const panel = document.getElementById(`${type}-${id}`);
    if (panel) {
        panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
    }
};