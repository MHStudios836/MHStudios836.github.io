// --- TITAN HEADER LOGIC ---
$(document).ready(function() {
    
    // 1. OPEN MENU
    $('#menu-btn').on('click', function() {
        $('#menu-overlay').addClass('active');
        // Optional: Blur the background content
        $('#page-wrapper, #hero, section').css('filter', 'blur(5px)');
    });

    // 2. CLOSE MENU
    $('.menu-close').on('click', function() {
        $('#menu-overlay').removeClass('active');
         // Remove blur
        $('#page-wrapper, #hero, section').css('filter', 'none');
    });

    // 3. DROPDOWN TOGGLE
    $('.menu-dropdown-btn').on('click', function() {
        $(this).toggleClass('active'); // Rotates arrow via CSS
        $(this).next('.dropdown-container').slideToggle(300);
    });

    // 4. STICKY NAV EFFECT
    $(window).on('scroll', function() {
        if ($(window).scrollTop() > 50) {
            $('#tactical-nav').addClass('scrolled');
        } else {
            $('#tactical-nav').removeClass('scrolled');
        }
    });

    // 5. LANGUAGE SELECTOR
    $('.lang-btn').on('click', function(e) {
        e.preventDefault();
        $('.lang-btn').removeClass('active');
        $(this).addClass('active');
    });
});