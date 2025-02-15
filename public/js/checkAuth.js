function checkAuth() {
    const token = localStorage.getItem('token');
    const isLoginPage = window.location.pathname.includes('login.html');

    if (token && isLoginPage) {
        // If we have a token and we're on login page, redirect to test.html
        window.location.href = '/test.html';
    } else if (!token && !isLoginPage) {
        // If we don't have a token and we're not on login page, redirect to login
        window.location.href = '/login.html';
    }
    // If we're on the correct page for our auth status, do nothing
}

// Check authentication when page loads
document.addEventListener('DOMContentLoaded', checkAuth);

// Function to handle logout
function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
} 