$(document).ready(function() {
    const $container = $('#auth-container');
    const $signInButton = $('#signIn');
    const $signUpButton = $('#signUp');

    // Desktop/Tablet (Slicing Transition) Logic
    if ($('#auth-container').width() > 768) {
        $signUpButton.on('click', () => {
            $container.addClass('is-signup');
        });

        $signInButton.on('click', () => {
            $container.removeClass('is-signup');
        });
    } 
    // Mobile Logic (Simple Toggle)
    else {
        const $loginForm = $('.sign-in-container');
        const $signupForm = $('.sign-up-container');
        
        // Show Signup Form
        $signUpButton.on('click', () => {
            $loginForm.fadeOut(300, function() {
                $signupForm.fadeIn(300);
            });
            $container.addClass('is-signup'); // Keep class for CSS overrides
        });

        // Show Login Form
        $signInButton.on('click', () => {
            $signupForm.fadeOut(300, function() {
                $loginForm.fadeIn(300);
            });
            $container.removeClass('is-signup'); // Keep class for CSS overrides
        });
        
        // Initial state for mobile
        $loginForm.show();
        $signupForm.hide();
    }
});