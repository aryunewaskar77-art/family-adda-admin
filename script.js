// Chef Order Display - Card Removal Functionality

// Check if user is logged in (using localStorage for persistence)
if (localStorage.getItem('isLoggedIn') !== 'true') {
    // Redirect to login page if not authenticated
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', function() {
    // Get all PREPARED buttons
    const preparedButtons = document.querySelectorAll('.prepared-btn');
    
    // Add click event listener to each button
    preparedButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Find the parent order card
            const orderCard = this.closest('.order-card');
            
            // Add fade-out animation
            orderCard.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            orderCard.style.opacity = '0';
            orderCard.style.transform = 'scale(0.95)';
            
            // Remove the card from DOM after animation completes
            setTimeout(() => {
                orderCard.remove();
            }, 300);
        });
    });
    
    // Logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            // Clear login state from localStorage
            localStorage.removeItem('isLoggedIn');
            // Redirect to login page
            window.location.href = 'index.html';
        });
    }
});