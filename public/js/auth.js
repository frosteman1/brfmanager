// Configuration
const API_URL = 'http://localhost:3002/api';

class Auth {
    constructor() {
        this.token = localStorage.getItem('token');
        this.checkAuth();
    }

    checkAuth() {
        if (this.token) {
            // If we have a token but we're on login page, redirect to main page
            if (window.location.pathname.includes('login.html')) {
                window.location.href = 'index.html';
            }
        } else if (!window.location.pathname.includes('login.html')) {
            // If we don't have a token and we're not on login page, redirect to login
            window.location.href = 'login.html';
        }
    }

    async login(email, password) {
        console.log('Login attempt with:', { email }); // Don't log passwords
        
        try {
            console.log('Sending request to:', `${API_URL}/auth/login`);
            
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Login response:', data);

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            console.log('Login successful, storing token');
            // Store token and update instance
            this.token = data.token;
            localStorage.setItem('token', data.token);
            
            console.log('Redirecting to AppBrfManager.html');
            // Redirect to AppBrfManager.html
            window.location.href = '/AppBrfManager.html';
        } catch (error) {
            console.error('Login error:', error);
            // Show error message
            const errorDiv = document.getElementById('loginError');
            errorDiv.textContent = error.message;
            errorDiv.classList.remove('d-none');
        }
    }

    logout() {
        localStorage.removeItem('token');
        this.token = null;
        window.location.href = 'login.html';
    }

    // Helper method to get headers for authenticated requests
    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'x-auth-token': this.token
        };
    }


    // Method to check if token is still valid
    async validateToken() {
        try {
            const response = await fetch(`${API_URL}/auth/validate`, {
                headers: this.getHeaders()
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

// Initialize authentication
const auth = new Auth();

// Setup login form handler
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Form submitted');
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    await auth.login(email, password);
});

// Add logout button to main page
if (!window.location.pathname.includes('login.html')) {
    const nav = document.querySelector('.container');
    if (nav) {
        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'btn btn-outline-light position-absolute top-0 end-0 m-3';
        logoutBtn.textContent = 'Logga ut';
        logoutBtn.onclick = () => auth.logout();
        nav.appendChild(logoutBtn);
    }
} 