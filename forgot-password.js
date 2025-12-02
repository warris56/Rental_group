// Global variables
let userEmail = '';

// Step 1: Verify Email
document.getElementById('requestResetForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    clearErrors();
    
    const email = document.getElementById('email').value.trim();
    
    if (!email) {
        showError('emailError', 'Email is required');
        return;
    }
    
    if (!isValidEmail(email)) {
        showError('emailError', 'Please enter a valid email address');
        return;
    }
    
    showLoading('request', true);
    
    try {
        const response = await fetch('http://localhost:8000/api/forgot-password/verify-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        showLoading('request', false);
        
        if (data.success) {
            userEmail = email;
            showSuccess('Email verified! Set your new password');
            goToStep(3); // Skip code verification, go straight to password reset
        } else {
            showError('emailError', data.message || 'Email not found');
        }
    } catch (error) {
        showLoading('request', false);
        console.error('Error:', error);
        showError('emailError', 'Network error. Please try again.');
    }
});

// Step 3: Reset Password
document.getElementById('resetPasswordForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    clearErrors();
    
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!newPassword) {
        showError('newPasswordError', 'Password is required');
        return;
    }
    
    if (newPassword.length < 8) {
        showError('newPasswordError', 'Password must be at least 8 characters');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showError('confirmPasswordError', 'Passwords do not match');
        return;
    }
    
    showLoading('reset', true);
    
    try {
        const response = await fetch('http://localhost:8000/api/forgot-password/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: userEmail, 
                newPassword 
            })
        });
        
        const data = await response.json();
        
        showLoading('reset', false);
        
        if (data.success) {
            showSuccess('Password reset successful!');
            goToStep(4);
        } else {
            showError('newPasswordError', data.message || 'Failed to reset password');
        }
    } catch (error) {
        showLoading('reset', false);
        console.error('Error:', error);
        showError('newPasswordError', 'Network error. Please try again.');
    }
});

// Password strength checker
document.getElementById('newPassword')?.addEventListener('input', function(e) {
    const password = e.target.value;
    const strength = calculatePasswordStrength(password);
    updateStrengthIndicator(strength);
});

function calculatePasswordStrength(password) {
    let strength = 0;
    
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 15;
    if (/[@$!%*?&#]/.test(password)) strength += 10;
    
    return Math.min(strength, 100);
}

function updateStrengthIndicator(strength) {
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');
    
    strengthBar.style.width = strength + '%';
    
    if (strength < 40) {
        strengthBar.style.background = '#e74c3c';
        strengthText.textContent = 'Weak password';
        strengthText.style.color = '#e74c3c';
    } else if (strength < 70) {
        strengthBar.style.background = '#f59e0b';
        strengthText.textContent = 'Medium strength';
        strengthText.style.color = '#f59e0b';
    } else {
        strengthBar.style.background = '#10b981';
        strengthText.textContent = 'Strong password';
        strengthText.style.color = '#10b981';
    }
}

// Navigation between steps
function goToStep(stepNumber) {
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById(`step${stepNumber}`).classList.add('active');
}

// Toggle password visibility
function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    const button = field.nextElementSibling;
    
    if (field.type === 'password') {
        field.type = 'text';
        button.textContent = '🙈';
    } else {
        field.type = 'password';
        button.textContent = '👁️';
    }
}

// Utility functions
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.classList.add('show');
}

function clearErrors() {
    document.querySelectorAll('.error-message').forEach(error => {
        error.classList.remove('show');
        error.textContent = '';
    });
}

function showLoading(type, isLoading) {
    const textEl = document.getElementById(`${type}Text`);
    const loaderEl = document.getElementById(`${type}Loader`);
    const btn = textEl.closest('button');
    
    if (isLoading) {
        textEl.style.display = 'none';
        loaderEl.style.display = 'inline-block';
        btn.disabled = true;
    } else {
        textEl.style.display = 'inline';
        loaderEl.style.display = 'none';
        btn.disabled = false;
    }
}

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