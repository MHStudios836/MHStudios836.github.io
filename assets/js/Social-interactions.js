// assets/js/Social-Interactions.js

// Ensure the code runs after the page structure is loaded using jQuery
$(document).ready(function() {
    
    // --- 1. Like Button Logic (Existing) ---
    const $likeButton = $('#like-button');
    
    $likeButton.on('click', function(e) {
        e.preventDefault(); 
        $(this).toggleClass('liked'); // Toggles the 'liked' class for the blue color
        console.log($(this).hasClass('liked') ? 'Post liked!' : 'Post un-liked.');
    });


    // --- 2. Share and Comment Button Logic (New) ---

    // Function to handle the click interaction for sharing and commenting
    function handleMicroInteraction(e) {
        e.preventDefault(); 
        const $button = $(this);

        // For Share and Comment, we simply toggle a generic 'active' state
        $button.toggleClass('active'); 
        
        // Custom logic for the console/server action
        if ($button.attr('id') === 'share-button') {
            console.log($button.hasClass('active') ? 'Share initiated/saved.' : 'Share action cancelled.');
            // Add specific sharing API call here if needed (e.g., window.open(shareUrl))
        } else if ($button.attr('id') === 'comment-button') {
            console.log($button.hasClass('active') ? 'Comment box opened/active.' : 'Comment action closed.');
            // Add specific logic here to reveal a comment input field
        }
    }
			// Attach the new handler to the Share and Comment buttons
			$('#share-button').on('click', handleMicroInteraction);
			$('#comment-button').on('click', handleMicroInteraction);
			
			// --- Language Dropdown Toggle Logic ---
		$('#lang-toggle-btn').on('click', function(e) {
			e.preventDefault();
			e.stopPropagation(); // Prevent main.js or other scripts from interfering
			
			const $dropdown = $('#language-list');
			
			// Toggle the 'active' class to show/hide the dropdown
			$dropdown.toggleClass('active');
			
			// Update the aria attribute for accessibility
			$(this).attr('aria-expanded', $dropdown.hasClass('active'));
		});

		// Hide the dropdown if the user clicks anywhere else on the page
		$(document).on('click', function(e) {
			if (!$(e.target).closest('.lang-dropdown-container').length) {
				$('#language-list').removeClass('active');
				$('#lang-toggle-btn').attr('aria-expanded', 'false');
			}
		});
			
});