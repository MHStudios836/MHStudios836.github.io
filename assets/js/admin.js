// ... existing imports ...
// inside $(document).ready:

// NEW TERMINATE BUTTON ID
$('#btn-terminate').on('click', async () => {
    logSystem("INITIATING SHUTDOWN SEQUENCE...");
    // Optional: Play a sound here
    await signOut(auth);
    window.location.href = 'DoD_Login_Style.html';
});

// Update the Dashboard Init to fill the new "Mini Profile"
function initializeDashboard(user, userData) {
    // Fill Sidebar Data
    $('#sidebar-name').text(userData.name || "COMMANDER");
    // ... rest of logic
    
    // Reveal Interface
    $('#gatekeeper-screen').fadeOut(500);
    $('#tos-interface').fadeIn(500).css('display', 'grid'); // Important for Grid layout
}