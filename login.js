// Static Login Credentials
const VALID_USER_ID = '01122007';
const VALID_PASSWORD = '02102007';

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    const userIdInput = document.getElementById('userId');
    const passwordInput = document.getElementById('password');

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const userId = userIdInput.value.trim();
        const password = passwordInput.value.trim();
        
        // Validate credentials
        if (userId === VALID_USER_ID && password === VALID_PASSWORD) {
            // Set login flag in localStorage (persists across refreshes)
            localStorage.setItem('isLoggedIn', 'true');
            // Successful login - redirect to chef order display
            window.location.href = 'chef.html';
        } else {
            // Show error message
            errorMessage.textContent = 'Invalid User ID or Password. Please try again.';
            errorMessage.classList.add('show');
            
            // Clear inputs
            userIdInput.value = '';
            passwordInput.value = '';
            userIdInput.focus();
            
            // Hide error message after 3 seconds
            setTimeout(() => {
                errorMessage.classList.remove('show');
            }, 3000);
        }
    });
    
    // Remove error message when user starts typing
    userIdInput.addEventListener('input', function() {
        errorMessage.classList.remove('show');
    });
    
    passwordInput.addEventListener('input', function() {
        errorMessage.classList.remove('show');
    });
});
