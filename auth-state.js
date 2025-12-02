// auth-state.js - Shared authentication state management

// Get current user data
function getCurrentUser() {
    const userDataString = localStorage.getItem('userData') || sessionStorage.getItem('userData');
    return userDataString ? JSON.parse(userDataString) : null;
}

// Check if user is logged in
function isLoggedIn() {
    const user = getCurrentUser();
    return user && user.loggedIn;
}

// Get user type
function getUserType() {
    const user = getCurrentUser();
    return user ? user.userType : null;
}

// Update navigation bar based on login status
function updateNavigationAuth() {
    const user = getCurrentUser();
    const loginLink = document.getElementById('loginLink');
    const registerLink = document.querySelector('a[href="register-choice.html"]');
    const navLinks = document.querySelector('.nav-links');
    
    if (!loginLink || !navLinks) return;
    
    if (user && user.loggedIn) {
        // User is logged in
        loginLink.href = user.userType === 'tenant' ? 'tenant-dashboard.html' : 'landlord-dashboard.html';
        loginLink.innerHTML = `<i class="fas fa-user"></i> Dashboard`;
        
        // Hide register link
        if (registerLink) {
            registerLink.style.display = 'none';
        }
        
        // Optional: Add user dropdown
        addUserDropdown(user);
    } else {
        // User is not logged in
        loginLink.href = 'login.html';
        loginLink.innerHTML = 'Login';
        
        // Show register link
        if (registerLink) {
            registerLink.style.display = 'inline-block';
        }
        
        // Remove user dropdown if exists
        removeUserDropdown();
    }
}

// Add user dropdown to navigation
function addUserDropdown(user) {
    // Remove existing dropdown if any
    removeUserDropdown();
    
    // Create dropdown container
    const dropdownContainer = document.createElement('div');
    dropdownContainer.className = 'user-dropdown';
    dropdownContainer.style.cssText = `
        position: relative;
        display: inline-block;
        margin-left: 1rem;
    `;
    
    // Create user button
    const userButton = document.createElement('button');
    userButton.className = 'user-btn';
    userButton.innerHTML = `
        <i class="fas fa-user-circle"></i>
        <span>${user.fullName?.split(' ')[0] || 'Account'}</span>
        <i class="fas fa-caret-down"></i>
    `;
    userButton.style.cssText = `
        background: #667eea;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 500;
    `;
    
    // Create dropdown menu
    const dropdownMenu = document.createElement('div');
    dropdownMenu.className = 'dropdown-menu';
    dropdownMenu.style.cssText = `
        position: absolute;
        top: 100%;
        right: 0;
        background: white;
        min-width: 200px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        border-radius: 8px;
        padding: 0.5rem 0;
        display: none;
        z-index: 1000;
    `;
    
    const dashboardLink = user.userType === 'tenant' ? 'tenant-dashboard.html' : 'landlord-dashboard.html';
    
    dropdownMenu.innerHTML = `
        <div class="dropdown-header" style="padding: 0.75rem 1rem; border-bottom: 1px solid #f0f0f0;">
            <p style="margin: 0; font-weight: 500; color: #333;">${user.fullName || 'User'}</p>
            <p style="margin: 0.25rem 0 0 0; font-size: 0.85rem; color: #666;">${user.email}</p>
        </div>
        <a href="${dashboardLink}" class="dropdown-item" style="display: block; padding: 0.75rem 1rem; color: #333; text-decoration: none; transition: background 0.2s;">
            <i class="fas fa-tachometer-alt"></i> Dashboard
        </a>
        <a href="${user.userType === 'tenant' ? 'tenant-dashboard.html#profile' : 'landlord-dashboard.html#profile'}" class="dropdown-item" style="display: block; padding: 0.75rem 1rem; color: #333; text-decoration: none; transition: background 0.2s;">
            <i class="fas fa-user"></i> Profile
        </a>
        <div class="dropdown-divider" style="height: 1px; background: #f0f0f0; margin: 0.5rem 0;"></div>
        <a href="#" class="dropdown-item" onclick="logoutFromNav()" style="display: block; padding: 0.75rem 1rem; color: #e74c3c; text-decoration: none; transition: background 0.2s;">
            <i class="fas fa-sign-out-alt"></i> Logout
        </a>
    `;
    
    // Add hover effect
    const dropdownItems = dropdownMenu.querySelectorAll('.dropdown-item');
    dropdownItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.background = '#f8f9fa';
        });
        item.addEventListener('mouseleave', () => {
            item.style.background = 'transparent';
        });
    });
    
    // Toggle dropdown on click
    userButton.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        dropdownMenu.style.display = 'none';
    });
    
    dropdownContainer.appendChild(userButton);
    dropdownContainer.appendChild(dropdownMenu);
    
    // Add to navigation
    const navLinks = document.querySelector('.nav-links');
    if (navLinks) {
        // Remove login link
        const loginLink = document.getElementById('loginLink');
        if (loginLink) {
            loginLink.style.display = 'none';
        }
        
        // Add dropdown before register link
        const registerLink = document.querySelector('a[href="register-choice.html"]');
        if (registerLink) {
            navLinks.insertBefore(dropdownContainer, registerLink);
        } else {
            navLinks.appendChild(dropdownContainer);
        }
    }
}

// Remove user dropdown
function removeUserDropdown() {
    const dropdown = document.querySelector('.user-dropdown');
    if (dropdown) {
        dropdown.remove();
    }
    
    // Show login link again
    const loginLink = document.getElementById('loginLink');
    if (loginLink) {
        loginLink.style.display = 'inline-block';
    }
}

// Logout from navigation
function logoutFromNav() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('userData');
        sessionStorage.removeItem('userData');
        window.location.href = 'index.html';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    updateNavigationAuth();
});

// Export functions for use in other files
window.authState = {
    getCurrentUser,
    isLoggedIn,
    getUserType,
    updateNavigationAuth
};