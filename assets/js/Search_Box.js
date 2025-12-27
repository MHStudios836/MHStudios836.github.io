$(document).ready(function() {
    const $form = $('#header-search-form');
    const $input = $form.find('input[type="text"]');

    // Hover expand
    $form.on('mouseenter', function() {
        $form.addClass('active-focus');
    }).on('mouseleave', function() {
        if (!$input.is(':focus')) {
            $form.removeClass('active-focus');
        }
    });

    // Focus expand (keyboard/tab)
    $input.on('focus', function() {
        $form.addClass('active-focus');
    }).on('blur', function() {
        $form.removeClass('active-focus');
    });

    // Scroll icon color
    const $header = $('#header');
    let isScrolled = false;
    $(window).on('scroll', function() {
        const scrollTop = $(this).scrollTop();
        if (scrollTop > 50 && !isScrolled) {
            $header.addClass('scrolled');
            isScrolled = true;
        } else if (scrollTop <= 50 && isScrolled) {
            $header.removeClass('scrolled');
            isScrolled = true;
        }
    }).trigger('scroll');
});