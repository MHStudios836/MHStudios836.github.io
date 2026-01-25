$(document).ready(function() {
    // Select the 'Services' opener button
    const $servicesOpener = $('.services-menu .opener');

    // Ensure sublist is hidden initially (fallback if CSS fails)
    $('.services-menu ul').hide();

    // 1. Handle click on the 'Services' button
    $servicesOpener.on('click', function(e) {
        e.preventDefault();
        e.stopPropagation(); // Prevents the click from activating other handlers

        const $parentLi = $(this).parent('.services-menu');
        const $subMenu = $parentLi.children('ul'); // Select the nested <ul> (the submenu)

        // Toggle the 'active' class on the parent <li>, which handles the CSS arrow rotation
        $parentLi.toggleClass('active');

        // Use slideToggle() for the smooth drop-down/slide-up animation
        // We use .stop(true, true) to ensure the animation is not queued if the user clicks rapidly
        $subMenu.stop(true, true).slideToggle(300); // 300ms duration for a smooth effect
    });

    // 2. Close the dropdown when clicking anywhere outside the menu
    $(document).on('click', function(e) {
        const $target = $(e.target);

        // If the click target is NOT inside the 'services-menu'
        if (!$target.closest('.services-menu').length) {
            const $servicesLi = $('.services-menu');
            
            // Check if it's open before closing
            if ($servicesLi.hasClass('active')) {
                // Remove the 'active' class
                $servicesLi.removeClass('active');
                
                // Slide up the submenu
                $servicesLi.children('ul').slideUp(300);
            }
        }
    });
});