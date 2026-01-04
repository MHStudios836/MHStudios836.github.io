/* assets/js/ui-core.js - UNIFIED UI HANDLER */

$(document).ready(function() {
    console.log("UI CORE: ACTIVE");

    // 1. MENU FUNCTIONS
    $('#menu-toggle').click(function(e) {
        e.preventDefault();
        $('#sidebar').toggleClass('active');
        $(this).toggleClass('active');
    });

    // 2. SEARCH BOX LOGIC
    $('.search-trigger').click(function() {
        $('.search-box').toggleClass('visible').find('input').focus();
    });

    // 3. LANGUAGE DROPDOWN
    $('.lang-selector').click(function() {
        $('.lang-options').slideToggle(200);
    });
    
    // 4. SOCIAL INTERACTIONS
    $('.social-share').click(function() {
        const platform = $(this).data('platform');
        // Add your share logic here if needed
        console.log(`Sharing to ${platform}`);
    });

    // 5. SMOOTH SCROLL (Replaces jquery.scrolly)
    $('a[href^="#"]').on('click', function(e) {
        e.preventDefault();
        $('html, body').animate({
            scrollTop: $($(this).attr('href')).offset().top
        }, 500);
    });
});