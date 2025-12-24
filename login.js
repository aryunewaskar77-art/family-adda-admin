// Login Credentials
const USERS = {
    chef: {
        id: 'chef@family.com',
        password: 'chef321',
        redirect: 'chef.html'
    },
    cashier: {
        id: 'cash@family.com',
        password: 'cash321',
        redirect: 'cashier.html'
    }
};

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    const userIdInput = document.getElementById('userId');
    const passwordInput = document.getElementById('password');

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const userId = userIdInput.value.trim();
        const password = passwordInput.value.trim();
        
        // Check credentials against all users
        let validUser = null;
        for (const [role, credentials] of Object.entries(USERS)) {
            if (userId === credentials.id && password === credentials.password) {
                validUser = credentials;
                break;
            }
        }
        
        if (validUser) {
            // Set login flag in localStorage (persists across refreshes)
            localStorage.setItem('isLoggedIn', 'true');
            // Successful login - redirect to appropriate page
            window.location.href = validUser.redirect;
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