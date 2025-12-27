/* Language Dropdown Toggle Logic */
(function($) {
    'use strict';
    $(document).ready(function() {
        
        const $toggleBtn = $('#lang-toggle-btn');
        const $dropdown = $('#language-list');

        // 1. Dropdown Toggle Click Handler
        $toggleBtn.on('click', function(e) {
            e.preventDefault();
            e.stopPropagation(); // Prevent main.js or other scripts from interfering
            
            // Toggle the 'active' class to show/hide the dropdown (CSS handles visibility)
            $dropdown.toggleClass('active');
            
            // Update the aria attribute for accessibility
            $(this).attr('aria-expanded', $dropdown.hasClass('active'));
        });

        // 2. Hide Dropdown on Outside Click
        // If the user clicks anywhere else on the page, hide the dropdown
        $(document).on('click', function(e) {
            // Check if the click target is NOT inside the dropdown container
            if (!$(e.target).closest('.lang-dropdown-container').length) {
                $dropdown.removeClass('active');
                $toggleBtn.attr('aria-expanded', 'false');
            }
        });

        // Note: The flags themselves use the .lang-btn-flag class, which your 
        // existing language-switcher.js already listens for!

    });
})(jQuery);