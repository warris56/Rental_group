// Login Form Handler
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Clear previous errors
    clearErrors();
    
    // Get form values
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;
    
    // Validate inputs
    let isValid = true;
    
    if (!email) {
        showError('emailError', 'Email is required');
        isValid = false;
    } else if (!isValidEmail(email)) {
        showError('emailError', 'Please enter a valid email address');
        isValid = false;
    }
    
    if (!password) {
        showError('passwordError', 'Password is required');
        isValid = false;
    } else if (password.length < 6) {
        showError('passwordError', 'Password must be at least 6 characters');
        isValid = false;
    }
    
    if (!isValid) {
        return;
    }
    
    // Show loading state
    showLoading(true);
    
    // Send to backend API
    fetch('http://localhost:8000/api/login', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        email: email,
        password: password
       })
    })
    .then(response => response.json())
    .then(data => {
    showLoading(false);
    
    if (data.success) {
        // Login successful
        const userData = {
            email: data.user.email,
            fullName: data.user.fullName,
            userType: data.user.userType,
            userId: data.user.id,
            loggedIn: true,
            loginTime: new Date().toISOString()
        };
        
        // Save to sessionStorage or localStorage
        if (remember) {
            localStorage.setItem('userData', JSON.stringify(userData));
        } else {
            sessionStorage.setItem('userData', JSON.stringify(userData));
        }
        
        // Show success message
        showSuccess('Login successful! Redirecting...');
        
        // Redirect based on user type
        setTimeout(() => {
            if (data.user.userType === 'landlord') {
                window.location.href = 'landlord-dashboard.html';
            } else {
                window.location.href = 'tenant-dashboard.html';
            }
        }, 1500);
    } else {
        // Login failed
        showError('passwordError', data.message);
    }
    })
    .catch(error => {
    showLoading(false);
    console.error('Error:', error);
    showError('passwordError', 'Network error. Make sure backend is running.');
    });
});

// Toggle Password Visibility
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.querySelector('.toggle-password');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        toggleBtn.textContent = '👁️';
    }
}

// Validate Email Format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Authenticate User (Demo function - replace with real API)


// Show Error Message
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    const inputElement = errorElement.previousElementSibling;
    
    errorElement.textContent = message;
    errorElement.classList.add('show');
    
    if (inputElement.tagName === 'INPUT' || inputElement.classList.contains('password-input')) {
        const input = inputElement.querySelector('input') || inputElement;
        input.classList.add('error');
    }
}

// Clear All Errors
function clearErrors() {
    const errorMessages = document.querySelectorAll('.error-message');
    const errorInputs = document.querySelectorAll('.error');
    
    errorMessages.forEach(error => {
        error.classList.remove('show');
        error.textContent = '';
    });
    
    errorInputs.forEach(input => {
        input.classList.remove('error');
    });
}

// Show Loading State
function showLoading(isLoading) {
    const loginText = document.getElementById('loginText');
    const loginLoader = document.getElementById('loginLoader');
    const submitBtn = document.querySelector('.btn-submit');
    
    if (isLoading) {
        loginText.style.display = 'none';
        loginLoader.style.display = 'inline-block';
        submitBtn.disabled = true;
    } else {
        loginText.style.display = 'inline';
        loginLoader.style.display = 'none';
        submitBtn.disabled = false;
    }
}

// Show Success Message
function showSuccess(message) {
    // Create success notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Auto-focus email field on load
window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('email').focus();
});