document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const showSignupLink = document.getElementById('show-signup');
    const showLoginLink = document.getElementById('show-login');
    const formContainer = document.querySelector('.form-container');

    // Function to handle the form transition using CSS classes
    function switchForms(e, formToHide, formToShow, hideClass) {
        e.preventDefault();
        
        // 1. Hide the current form using the specific transition class
        formToHide.classList.remove('active');
        formToHide.classList.add(hideClass); 

        // 2. Adjust container height to prevent jarring jumps
        // Get the height of the form we are switching TO
        formContainer.style.height = formToShow.offsetHeight + 'px';

        // 3. Wait briefly for the exit animation to start (100ms)
        setTimeout(() => {
            // Remove the temporary class from the form that just slid out
            formToHide.classList.remove(hideClass);

            // Activate the new form (it slides in due to the 'active' class CSS)
            formToShow.classList.add('active');
            
        }, 100); 
    }

    // Event handler for switching to Sign-up
    const switchToSignup = (e) => switchForms(e, loginForm, signupForm, 'hidden-left');

    // Event handler for switching to Login
    const switchToLogin = (e) => switchForms(e, signupForm, loginForm, 'hidden-right');

    // Attach event listeners
    showSignupLink.addEventListener('click', switchToSignup);
    showLoginLink.addEventListener('click', switchToLogin);

    // Initial setup: Set the container height to the initial form height
    formContainer.style.height = loginForm.offsetHeight + 'px';
});