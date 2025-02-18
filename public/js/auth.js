// Configuration
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3003/api'
    : '/api';  // I produktion använder vi relativ sökväg

class Auth {
    constructor() {
        this.token = localStorage.getItem('token');
        this.checkAuth();
    }

    checkAuth() {
        const isLoginPage = window.location.pathname === '/' || 
                           window.location.pathname === '/index.html';
        
        if (this.token) {
            // Om vi har en token och är på login-sidan, omdirigera till app
            if (isLoginPage) {
                window.location.href = '/AppBrfManager.html';
            }
        } else {
            // Om vi inte har en token och inte är på login-sidan, omdirigera till login
            if (!isLoginPage) {
                window.location.href = '/index.html';
            }
        }
    }

    async login(email, password) {
        try {
            console.log('Attempting login with:', { email, password }); // Temporary debug log
            
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            // Logga hela svaret
            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Server response:', data);

            if (response.ok) {
                console.log('Token received:', data.token); // Debug log
                localStorage.setItem('token', data.token);
                // Redirect eller andra åtgärder efter inloggning
                console.log('Login successful, storing token');
                console.log('Redirecting to AppBrfManager.html');
                // Redirect to AppBrfManager.html
                window.location.href = '/AppBrfManager.html';
            } else {
                throw new Error(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            const errorDiv = document.getElementById('loginError');
            errorDiv.textContent = error.message;
            errorDiv.classList.remove('d-none');
        }
    }

    logout() {
        localStorage.removeItem('token');
        this.token = null;
        window.location.href = 'index.html';
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
if (!window.location.pathname.includes('index.html')) {
    const nav = document.querySelector('.container');
    if (nav) {
        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'btn btn-outline-light position-absolute top-0 end-0 m-3';
        logoutBtn.textContent = 'Logga ut';
        logoutBtn.onclick = () => auth.logout();
        nav.appendChild(logoutBtn);
    }
}

function isLoggedIn() {
    const token = localStorage.getItem('token');
    console.log('Current token:', token); // Debug log
    return !!token;
} 