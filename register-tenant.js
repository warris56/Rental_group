// Tenant Registration Form Handler
document.getElementById('tenantRegisterForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Clear previous errors
    clearErrors();
    
    // Get form values
    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const idNumber = document.getElementById('idNumber').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const terms = document.getElementById('terms').checked;
    
    // Validate inputs
    let isValid = true;
    
    // Validate Full Name
    if (!fullName) {
        showError('fullNameError', 'Full name is required');
        isValid = false;
    } else if (fullName.length < 3) {
        showError('fullNameError', 'Name must be at least 3 characters');
        isValid = false;
    }
    
    // Validate Email
    if (!email) {
        showError('emailError', 'Email is required');
        isValid = false;
    } else if (!isValidEmail(email)) {
        showError('emailError', 'Please enter a valid email address');
        isValid = false;
    }
    
    // Validate Phone
    if (!phone) {
        showError('phoneError', 'Phone number is required');
        isValid = false;
    } else if (!isValidPhone(phone)) {
        showError('phoneError', 'Please enter a valid phone number');
        isValid = false;
    }
    
    // Validate Password
    if (!password) {
        showError('passwordError', 'Password is required');
        isValid = false;
    } else if (password.length < 8) {
        showError('passwordError', 'Password must be at least 8 characters');
        isValid = false;
    } else if (!isStrongPassword(password)) {
        showError('passwordError', 'Password must include uppercase, lowercase, and number');
        isValid = false;
    }
    
    // Validate Confirm Password
    if (!confirmPassword) {
        showError('confirmPasswordError', 'Please confirm your password');
        isValid = false;
    } else if (password !== confirmPassword) {
        showError('confirmPasswordError', 'Passwords do not match');
        isValid = false;
    }
    
    // Validate Terms
    if (!terms) {
        showError('termsError', 'You must agree to the terms and conditions');
        isValid = false;
    }
    
    if (!isValid) {
        return;
    }
    
    // Show loading state
    showLoading(true);
    
    // Prepare registration data
    const registrationData = {
        fullName: fullName,
        email: email,
        phone: phone,
        idNumber: idNumber,
        password: password,
        userType: 'tenant',
        registeredAt: new Date().toISOString()
    };
    
    // Send to backend API
    fetch('http://localhost:8000/api/register/tenant', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(registrationData)
    })
    .then(response => response.json())
    .then(data => {
    showLoading(false);
    
    if (data.success) {
        // Registration successful
        showSuccess(data.message + ' Redirecting to login...');
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    } else {
        // Registration failed
        showError('emailError', data.message);
    }
    })
    .catch(error => {
    showLoading(false);
    console.error('Error:', error);
    showError('emailError', 'Network error. Make sure backend is running.');
    });
});

// Toggle Password Visibility
function togglePassword(fieldId) {
    const passwordInput = document.getElementById(fieldId);
    const toggleBtn = passwordInput.nextElementSibling;
    
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

// Validate Phone Format (Ghana format)
function isValidPhone(phone) {
    // Accept formats: +233XXXXXXXXX, 0XXXXXXXXX, or just numbers
    const phoneRegex = /^(\+233|0)?[2-9]\d{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Check Password Strength
function isStrongPassword(password) {
    // At least one uppercase, one lowercase, and one number
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    return hasUpperCase && hasLowerCase && hasNumber;
}

// Check if Email Already Exists (Demo function)
function checkEmailExists(email) {
    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    return users.some(user => user.email === email);
}

// Save User to Storage (Demo function - replace with API call)
function saveUserToStorage(userData) {
    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    
    // Don't store the actual password in production - this is just for demo
    const userToSave = {
        ...userData,
        password: btoa(userData.password) // Simple encoding for demo only
    };
    
    users.push(userToSave);
    localStorage.setItem('registeredUsers', JSON.stringify(users));
}

// Show Error Message
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    const formGroup = errorElement.closest('.form-group');
    const inputElement = formGroup.querySelector('input, select');
    
    errorElement.textContent = message;
    errorElement.classList.add('show');
    
    if (inputElement) {
        inputElement.classList.add('error');
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
    const registerText = document.getElementById('registerText');
    const registerLoader = document.getElementById('registerLoader');
    const submitBtn = document.querySelector('.btn-submit');
    
    if (isLoading) {
        registerText.style.display = 'none';
        registerLoader.style.display = 'inline-block';
        submitBtn.disabled = true;
    } else {
        registerText.style.display = 'inline';
        registerLoader.style.display = 'none';
        submitBtn.disabled = false;
    }
}

// Show Success Message
function showSuccess(message) {
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
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Real-time password strength indicator
document.getElementById('password').addEventListener('input', function(e) {
    const password = e.target.value;
    const strengthIndicator = document.getElementById('passwordStrength');
    
    if (password.length === 0) {
        if (strengthIndicator) strengthIndicator.remove();
        return;
    }
    
    // Create or update strength indicator
    let indicator = strengthIndicator;
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'passwordStrength';
        indicator.style.cssText = 'margin-top: 0.5rem; font-size: 0.85rem;';
        e.target.parentElement.parentElement.appendChild(indicator);
    }
    
    const strength = getPasswordStrength(password);
    indicator.textContent = `Password strength: ${strength.text}`;
    indicator.style.color = strength.color;
});

function getPasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z\d]/.test(password)) score++;
    
    if (score <= 2) return { text: 'Weak', color: '#e74c3c' };
    if (score <= 4) return { text: 'Medium', color: '#f39c12' };
    return { text: 'Strong', color: '#10b981' };
}

// Auto-focus first field on load
window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('fullName').focus();
});