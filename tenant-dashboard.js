// Check if user is logged in
// Check if user is logged in
function checkAuth() {
    // Check sessionStorage first (current session), then localStorage (remembered login)
    let userDataString = sessionStorage.getItem('userData');
    let userData = null;
    
    if (userDataString) {
        userData = JSON.parse(userDataString);
    } else {
        userDataString = localStorage.getItem('userData');
        if (userDataString) {
            userData = JSON.parse(userDataString);
        }
    }
    
    if (!userData || !userData.loggedIn) {
        window.location.href = 'login.html';
        return null;
    }
    
    // Check if user is a tenant
    if (userData.userType !== 'tenant') {
        // Wrong dashboard - clear and redirect
        sessionStorage.removeItem('userData');
        alert('This is the tenant dashboard. Please login with a tenant account.');
        window.location.href = 'login.html';
        return null;
    }
    
    return userData;
}

// Load user data on page load
window.addEventListener('DOMContentLoaded', function() {
    const userData = checkAuth();
    
    if (userData) {
        // Display user name
        document.getElementById('userName').textContent = userData.fullName || userData.email;
        document.getElementById('userNameWelcome').textContent = userData.fullName?.split(' ')[0] || 'Tenant';
        
        // Load user profile
        loadUserProfile(userData);
        
        // Load dashboard data
        loadDashboardStats();
    }
});

// Load user profile from backend
async function loadUserProfile(userData) {
    try {
        const response = await fetch(`http://localhost:8000/api/users/${userData.userId}`);
        const data = await response.json();
        
        if (data.success) {
            const user = data.user;
            
            // Update profile section
            document.getElementById('profileName').textContent = user.fullName;
            document.getElementById('profileEmail').textContent = user.email;
            document.getElementById('profilePhone').textContent = user.phone || 'Not provided';
            document.getElementById('profileId').textContent = user.idNumber || 'Not provided';
            document.getElementById('profileDate').textContent = new Date(user.createdAt).toLocaleDateString();
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Load dashboard statistics
// Load dashboard statistics
async function loadDashboardStats() {
    let userDataString = sessionStorage.getItem('userData');
    if (!userDataString) {
        userDataString = localStorage.getItem('userData');
    }
    const userData = userDataString ? JSON.parse(userDataString) : {};
    
    if (!userData.userId) return;
    
    try {
        // Load saved properties
        const savedResponse = await fetch(`http://localhost:8000/api/saved-properties/${userData.userId}`);
        const savedData = await savedResponse.json();
        
        if (savedData.success) {
            document.getElementById('savedCount').textContent = savedData.count;
            displaySavedProperties(savedData.savedProperties);
        }
        
        // Load applications - ADD THIS LINE
        loadApplications();
        
        // Load maintenance requests
        loadMaintenance();
        
        // Completed tasks (demo)
        document.getElementById('completedCount').textContent = '0';
        
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// Display saved properties
// Display saved properties
function displaySavedProperties(savedProperties) {
    const container = document.getElementById('savedPropertiesList');
    
    if (savedProperties.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">🏠</span>
                <h3>No saved properties yet</h3>
                <p>Browse properties and save your favorites to view them here</p>
                <button class="btn-primary" onclick="window.location.href='index.html'">
                    Browse Properties
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = savedProperties.map(saved => {
        const property = saved.propertyId;
        if (!property) return '';
        
        // FIX: Get the first image with proper URL handling
        const imageUrl = property.images && property.images.length > 0 
            ? (property.images[0].startsWith('http') 
                ? property.images[0] 
                : `http://localhost:8000${property.images[0]}`)
            : null;
        
        return `
            <div class="property-card">
                <div class="property-image" style="${imageUrl ? `background-image: url('${imageUrl}'); background-size: cover; background-position: center;` : 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);'} height: 200px; border-radius: 12px 12px 0 0; position: relative;">
                    ${!imageUrl ? '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 3rem; opacity: 0.3;">🏠</div>' : ''}
                    ${property.images && property.images.length > 0 ? `
                        <span style="position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">
                            📷 ${property.images.length}
                        </span>
                    ` : ''}
                </div>
                <div class="property-details">
                    <div class="property-header">
                        <h3>${property.title || 'Property'}</h3>
                        <button class="remove-btn" onclick="removeSavedProperty('${property._id}')" title="Remove from saved">
                            ❌
                        </button>
                    </div>
                    <p class="property-location">📍 ${property.location}</p>
                    <div class="property-info">
                        <span>🛏️ ${property.bedrooms} Beds</span>
                        <span>🚿 ${property.bathrooms} Baths</span>
                        <span>🏷️ ${property.propertyType}</span>
                    </div>
                    <div class="property-footer">
                        <div class="property-price">GH₵ ${property.price.toLocaleString()}/month</div>
                        <button class="btn-view" onclick="viewPropertyDetails('${property._id}')">
                            View Details
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Remove saved property
async function removeSavedProperty(propertyId) {
    let userDataString = sessionStorage.getItem('userData');
    if (!userDataString) {
        userDataString = localStorage.getItem('userData');
    }
    const userData = userDataString ? JSON.parse(userDataString) : {};
    
    if (!confirm('Remove this property from your saved list?')) return;
    
    try {
        const response = await fetch(`http://localhost:8000/api/saved-properties/${userData.userId}/${propertyId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Show success message
            showNotification('Property removed from saved list', 'success');
            // Reload dashboard stats
            loadDashboardStats();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Error removing property:', error);
        showNotification('Error removing property', 'error');
    }
}

// In tenant-dashboard.js, update the viewPropertyDetails function:
function viewPropertyDetails(propertyId) {
    window.location.href = `property-details.html?id=${propertyId}`;
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#e74c3c'};
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

// Show specific section
function showSection(sectionName) {
    const titles = {
        'overview': 'Dashboard Overview',
        'properties': 'Saved Properties',
        'applications': 'My Applications',
        'maintenance': 'Maintenance Requests',
        'documents': '📄 My Documents',  // ← ADD THIS LINE
        'notifications': '🔔 Notifications',
        'profile': 'My Profile'
    };
    
    document.getElementById('pageTitle').textContent = titles[sectionName];
    
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.classList.remove('active'));
    
    document.getElementById(`${sectionName}-section`).classList.add('active');
    
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    
    if (event && event.target) {
        event.target.closest('.nav-item')?.classList.add('active');
    }
    
    if (sectionName === 'applications') {
        loadApplications();
    } else if (sectionName === 'maintenance') {
        loadMaintenance();
    } else if (sectionName === 'documents') {  // ← ADD THIS
        loadUserDocuments();
    } else if (sectionName === 'notifications') {
        loadNotifications();
    }
}

// Toggle sidebar on mobile
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');
}

// Open application modal (placeholder)
function openApplicationModal() {
    alert('Application submission feature coming soon!\n\nThis will allow you to:\n- Apply for properties\n- Upload documents\n- Track application status');
}

// Open maintenance modal (placeholder)
function openMaintenanceModal() {
    alert('Maintenance request feature coming soon!\n\nThis will allow you to:\n- Submit maintenance issues\n- Upload photos\n- Track request status');
}

// Enable profile editing (placeholder)
// Enable profile editing
function enableEdit() {
    showEditProfileForm();
}

// Show edit profile form
function showEditProfileForm() {
    let userDataString = sessionStorage.getItem('userData');
    if (!userDataString) {
        userDataString = localStorage.getItem('userData');
    }
    const userData = userDataString ? JSON.parse(userDataString) : {};
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Edit Profile</h2>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <form id="editProfileForm" class="application-form">
                <div class="form-group">
                    <label>Full Name *</label>
                    <input type="text" id="editFullName" value="${document.getElementById('profileName').textContent}" required>
                </div>
                
                <div class="form-group">
                    <label>Email (Cannot be changed)</label>
                    <input type="email" value="${document.getElementById('profileEmail').textContent}" disabled>
                </div>
                
                <div class="form-group">
                    <label>Phone Number *</label>
                    <input type="tel" id="editPhone" value="${document.getElementById('profilePhone').textContent}" required>
                </div>
                
                <div class="form-group">
                    <label>ID Number</label>
                    <input type="text" id="editIdNumber" value="${document.getElementById('profileId').textContent === 'Not provided' ? '' : document.getElementById('profileId').textContent}">
                </div>
                
                <hr style="margin: 1.5rem 0; border: none; border-top: 1px solid #e0e0e0;">
                
                <h3 style="margin-bottom: 1rem; color: #667eea;">Change Password (Optional)</h3>
                
                <div class="form-group">
                    <label>Current Password</label>
                    <div class="password-input">
                        <input type="password" id="editCurrentPassword" placeholder="Enter current password">
                        <button type="button" class="toggle-password" onclick="togglePasswordField('editCurrentPassword')">
                            👁️
                        </button>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>New Password</label>
                    <div class="password-input">
                        <input type="password" id="editNewPassword" placeholder="Enter new password">
                        <button type="button" class="toggle-password" onclick="togglePasswordField('editNewPassword')">
                            👁️
                        </button>
                    </div>
                    <small style="color: #666;">Leave blank if you don't want to change password</small>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn-primary">Save Changes</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle form submission
    document.getElementById('editProfileForm').addEventListener('submit', updateProfile);
}

// Toggle password visibility in edit form
function togglePasswordField(fieldId) {
    const input = document.getElementById(fieldId);
    const button = input.nextElementSibling;
    
    if (input.type === 'password') {
        input.type = 'text';
        button.textContent = '🙈';
    } else {
        input.type = 'password';
        button.textContent = '👁️';
    }
}

// Update profile
async function updateProfile(e) {
    e.preventDefault();
    
    let userDataString = sessionStorage.getItem('userData');
    if (!userDataString) {
        userDataString = localStorage.getItem('userData');
    }
    const userData = userDataString ? JSON.parse(userDataString) : {};
    
    const fullName = document.getElementById('editFullName').value.trim();
    const phone = document.getElementById('editPhone').value.trim();
    const idNumber = document.getElementById('editIdNumber').value.trim();
    const currentPassword = document.getElementById('editCurrentPassword').value;
    const newPassword = document.getElementById('editNewPassword').value;
    
    // Validation
    if (!fullName || !phone) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    if (newPassword && !currentPassword) {
        showNotification('Please enter your current password to change it', 'error');
        return;
    }
    
    if (newPassword && newPassword.length < 8) {
        showNotification('New password must be at least 8 characters', 'error');
        return;
    }
    
    const updateData = {
        fullName,
        phone,
        idNumber
    };
    
    if (newPassword) {
        updateData.currentPassword = currentPassword;
        updateData.newPassword = newPassword;
    }
    
    try {
        const response = await fetch(`http://localhost:8000/api/users/${userData.userId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Update local storage
            userData.fullName = data.user.fullName;
            if (localStorage.getItem('userData')) {
                localStorage.setItem('userData', JSON.stringify(userData));
            } else {
                sessionStorage.setItem('userData', JSON.stringify(userData));
            }
            
            showNotification('Profile updated successfully!', 'success');
            closeModal();
            
            // Refresh profile display
            document.getElementById('userName').textContent = data.user.fullName;
            document.getElementById('userNameWelcome').textContent = data.user.fullName.split(' ')[0];
            document.getElementById('profileName').textContent = data.user.fullName;
            document.getElementById('profilePhone').textContent = data.user.phone;
            document.getElementById('profileId').textContent = data.user.idNumber || 'Not provided';
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification('Error updating profile', 'error');
    }
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear session data
        localStorage.removeItem('userData');
        sessionStorage.removeItem('userData');
        
        // Redirect to login page
        window.location.href = 'login.html';
    }
}

// Close sidebar when clicking outside on mobile
document.addEventListener('click', function(event) {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.querySelector('.menu-toggle');
    
    if (window.innerWidth <= 968) {
        if (!sidebar.contains(event.target) && event.target !== menuToggle) {
            sidebar.classList.remove('active');
        }
    }
});

// ==================== APPLICATIONS FUNCTIONS ====================

// Load applications
async function loadApplications() {
    let userDataString = sessionStorage.getItem('userData');
    if (!userDataString) {
        userDataString = localStorage.getItem('userData');
    }
    const userData = userDataString ? JSON.parse(userDataString) : {};
    
    if (!userData.userId) return;
    
    try {
        const response = await fetch(`http://localhost:8000/api/applications/tenant/${userData.userId}`);
        const data = await response.json();
        
        if (data.success) {
            displayApplications(data.applications);
            
            // Update count on overview
            const pendingCount = data.applications.filter(app => app.status === 'pending').length;
            document.getElementById('applicationsCount').textContent = pendingCount;
        }
    } catch (error) {
        console.error('Error loading applications:', error);
    }
}

// Display applications
function displayApplications(applications) {
    const container = document.getElementById('applicationsList');
    
    if (applications.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📝</span>
                <h3>No applications submitted yet</h3>
                <p>When you apply for properties, you'll see them here</p>
                <button class="btn-primary" onclick="window.location.href='index.html'">
                    Find Properties
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = applications.map(app => {
    const property = app.propertyId;
    if (!property) return '';
    
    const statusColors = {
        'pending': '#f59e0b',
        'approved': '#10b981',
        'rejected': '#e74c3c'
    };
    
    const statusIcons = {
        'pending': '⏳',
        'approved': '✅',
        'rejected': '❌'
    };
    
    return `
        <div class="application-card">
            <div class="application-header">
                <div>
                    <h3>${property.title}</h3>
                    <p class="property-location">📍 ${property.location}</p>
                </div>
                <span class="status-badge" style="background: ${statusColors[app.status]}20; color: ${statusColors[app.status]}">
                    ${statusIcons[app.status]} ${app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                </span>
            </div>
            
            <div class="application-body">
                <div class="application-info">
                    <div class="info-item">
                        <span class="label">Applied:</span>
                        <span class="value">${new Date(app.appliedAt).toLocaleDateString()}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Move-in Date:</span>
                        <span class="value">${new Date(app.moveInDate).toLocaleDateString()}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Property Price:</span>
                        <span class="value">GH₵ ${property.price.toLocaleString()}/month</span>
                    </div>
                </div>
                
                ${app.message ? `
                    <div class="application-message">
                        <strong>Your Message:</strong>
                        <p>${app.message}</p>
                    </div>
                ` : ''}
                
                ${app.landlordResponse ? `
                    <div class="landlord-response">
                        <strong>Landlord Response:</strong>
                        <p>${app.landlordResponse}</p>
                        <small>Responded: ${new Date(app.respondedAt).toLocaleDateString()}</small>
                    </div>
                ` : ''}
                
                <!-- Documents Section -->
                <div class="application-documents" style="margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                    <h4 style="margin: 0 0 0.5rem 0;">📎 Documents</h4>
                    <div id="docs-${app._id}">
                        <button class="btn-secondary" onclick="uploadApplicationDocument('${app._id}')">
                            Upload Documents
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="application-actions">
                <button class="btn-secondary" onclick="viewApplicationDetails('${app._id}')">
                    View Details
                </button>
                ${app.status === 'pending' ? `
                    <button class="btn-danger" onclick="cancelApplication('${app._id}')">
                        Cancel Application
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}).join('');

// Load documents for each application
applications.forEach(app => {
    loadApplicationDocuments(app._id);
});
}

// Open application modal
function openApplicationModal() {
    // For now, show message. We'll build the full form next
    showApplicationForm();
}

// Show application form
function showApplicationForm() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Submit Rental Application</h2>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <form id="applicationForm" class="application-form">
                <div class="form-group">
                    <label>Select Property *</label>
                    <select id="appPropertyId" required>
                        <option value="">-- Choose a property --</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Desired Move-in Date *</label>
                    <input type="date" id="appMoveInDate" required>
                </div>
                
                <div class="form-group">
                    <label>Employment Status *</label>
                    <select id="appEmploymentStatus" required>
                        <option value="">-- Select --</option>
                        <option value="employed">Employed</option>
                        <option value="self-employed">Self-Employed</option>
                        <option value="student">Student</option>
                        <option value="unemployed">Unemployed</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Monthly Income (GH₵)</label>
                    <input type="number" id="appMonthlyIncome" placeholder="Optional">
                </div>
                
                <div class="form-group">
                    <label>Message to Landlord *</label>
                    <textarea id="appMessage" rows="4" placeholder="Tell the landlord why you're interested in this property..." required></textarea>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn-primary">Submit Application</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Load available properties
    loadPropertiesForApplication();
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('appMoveInDate').min = today;
    
    // Handle form submission
    document.getElementById('applicationForm').addEventListener('submit', submitApplication);
}

// Load properties for application dropdown
async function loadPropertiesForApplication() {
    try {
        const response = await fetch('http://localhost:8000/api/properties');
        const data = await response.json();
        
        if (data.success) {
            const select = document.getElementById('appPropertyId');
            select.innerHTML = '<option value="">-- Choose a property --</option>' + 
                data.properties.map(prop => `
                    <option value="${prop._id}" data-landlord="${prop.landlordId._id}">
                        ${prop.title} - GH₵${prop.price.toLocaleString()}/month (${prop.location})
                    </option>
                `).join('');
        }
    } catch (error) {
        console.error('Error loading properties:', error);
    }
}

// Submit application
async function submitApplication(e) {
    e.preventDefault();
    
    const userDataString = localStorage.getItem('userData') || sessionStorage.getItem('userData');
    const userData = userDataString ? JSON.parse(userDataString) : {};
    
    const propertySelect = document.getElementById('appPropertyId');
    const selectedOption = propertySelect.options[propertySelect.selectedIndex];
    
    const applicationData = {
        tenantId: userData.userId,
        propertyId: propertySelect.value,
        landlordId: selectedOption.dataset.landlord,
        moveInDate: document.getElementById('appMoveInDate').value,
        employmentStatus: document.getElementById('appEmploymentStatus').value,
        monthlyIncome: document.getElementById('appMonthlyIncome').value || 0,
        message: document.getElementById('appMessage').value
    };
    
    try {
        const response = await fetch('http://localhost:8000/api/applications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(applicationData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Application submitted successfully!', 'success');
            closeModal();
            loadApplications();
            loadDashboardStats();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Error submitting application:', error);
        showNotification('Error submitting application', 'error');
    }
}

// View application details
function viewApplicationDetails(applicationId) {
    showNotification('Application details view coming soon!', 'success');
}

// Cancel application
async function cancelApplication(applicationId) {
    if (!confirm('Are you sure you want to cancel this application?')) return;
    
    try {
        const response = await fetch(`http://localhost:8000/api/applications/${applicationId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Application cancelled successfully', 'success');
            loadApplications();
            loadDashboardStats();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Error cancelling application:', error);
        showNotification('Error cancelling application', 'error');
    }
}

// Close modal
function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();
}

// ==================== MAINTENANCE FUNCTIONS ====================

// Load maintenance requests
async function loadMaintenance() {
    let userDataString = sessionStorage.getItem('userData');
    if (!userDataString) {
        userDataString = localStorage.getItem('userData');
    }
    const userData = userDataString ? JSON.parse(userDataString) : {};
    
    if (!userData.userId) return;
    
    try {
        const response = await fetch(`http://localhost:8000/api/maintenance/tenant/${userData.userId}`);
        const data = await response.json();
        
        if (data.success) {
            displayMaintenance(data.maintenance);
            
            // Update count on overview (open requests only)
            const openCount = data.maintenance.filter(m => m.status === 'open' || m.status === 'in-progress').length;
            document.getElementById('maintenanceCount').textContent = openCount;
        }
    } catch (error) {
        console.error('Error loading maintenance:', error);
    }
}

// Display maintenance requests
function displayMaintenance(maintenanceRequests) {
    const container = document.getElementById('maintenanceList');
    
    if (maintenanceRequests.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">🔧</span>
                <h3>No maintenance requests</h3>
                <p>Submit a maintenance request when you need repairs</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = maintenanceRequests.map(request => {
        const property = request.propertyId;
        if (!property) return '';
        
        const statusColors = {
            'open': '#f59e0b',
            'in-progress': '#3b82f6',
            'completed': '#10b981',
            'cancelled': '#6c757d'
        };
        
        const statusIcons = {
            'open': '🔓',
            'in-progress': '⚙️',
            'completed': '✅',
            'cancelled': '❌'
        };
        
        const priorityColors = {
            'low': '#10b981',
            'medium': '#f59e0b',
            'high': '#e74c3c',
            'urgent': '#dc2626'
        };
        
        return `
            <div class="maintenance-card">
                <div class="maintenance-header">
                    <div>
                        <h3>${request.title}</h3>
                        <p class="property-location">🏠 ${property.title} - ${property.location}</p>
                    </div>
                    <div class="badges">
                        <span class="status-badge" style="background: ${statusColors[request.status]}20; color: ${statusColors[request.status]}">
                            ${statusIcons[request.status]} ${request.status.replace('-', ' ').toUpperCase()}
                        </span>
                        <span class="priority-badge" style="background: ${priorityColors[request.priority]}20; color: ${priorityColors[request.priority]}">
                            ${request.priority.toUpperCase()} PRIORITY
                        </span>
                    </div>
                </div>
                
                <div class="maintenance-body">
                    <div class="maintenance-info">
                        <div class="info-item">
                            <span class="label">Category:</span>
                            <span class="value">${request.category.charAt(0).toUpperCase() + request.category.slice(1)}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Submitted:</span>
                            <span class="value">${new Date(request.createdAt).toLocaleDateString()}</span>
                        </div>
                        ${request.completedAt ? `
                            <div class="info-item">
                                <span class="label">Completed:</span>
                                <span class="value">${new Date(request.completedAt).toLocaleDateString()}</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="maintenance-description">
                        <strong>Description:</strong>
                        <p>${request.description}</p>
                    </div>
                    
                    ${request.landlordNotes ? `
                        <div class="landlord-notes">
                            <strong>Landlord Notes:</strong>
                            <p>${request.landlordNotes}</p>
                        </div>
                    ` : ''}
                </div>
                
                <div class="maintenance-actions">
                    <button class="btn-secondary" onclick="viewMaintenanceDetails('${request._id}')">
                        View Details
                    </button>
                    ${request.status === 'open' ? `
                        <button class="btn-danger" onclick="cancelMaintenance('${request._id}')">
                            Cancel Request
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Open maintenance modal
function openMaintenanceModal() {
    showMaintenanceForm();
}

// Show maintenance form
function showMaintenanceForm() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Submit Maintenance Request</h2>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <form id="maintenanceForm" class="application-form">
                <div class="form-group">
                    <label>Select Property *</label>
                    <select id="maintPropertyId" required>
                        <option value="">-- Choose a property --</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Issue Title *</label>
                    <input type="text" id="maintTitle" placeholder="e.g., Leaking faucet in kitchen" required>
                </div>
                
                <div class="form-group">
                    <label>Category *</label>
                    <select id="maintCategory" required>
                        <option value="">-- Select category --</option>
                        <option value="plumbing">Plumbing</option>
                        <option value="electrical">Electrical</option>
                        <option value="appliance">Appliance</option>
                        <option value="structural">Structural</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Priority *</label>
                    <select id="maintPriority" required>
                        <option value="low">Low - Can wait</option>
                        <option value="medium" selected>Medium - Should be fixed soon</option>
                        <option value="high">High - Needs attention</option>
                        <option value="urgent">Urgent - Emergency</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Detailed Description *</label>
                    <textarea id="maintDescription" rows="5" placeholder="Please describe the issue in detail..." required></textarea>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn-primary">Submit Request</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Load properties for dropdown
    loadPropertiesForMaintenance();
    
    // Handle form submission
    document.getElementById('maintenanceForm').addEventListener('submit', submitMaintenance);
}

async function loadPropertiesForMaintenance() {
    try {
        const response = await fetch('http://localhost:8000/api/properties');
        const data = await response.json();
        
        if (data.success) {
            const select = document.getElementById('maintPropertyId');
            select.innerHTML = '<option value="">-- Choose a property --</option>' + 
                data.properties.map(prop => {
                    // ← FIX: Handle both populated and non-populated landlordId
                    const landlordId = prop.landlordId._id || prop.landlordId;
                    return `
                        <option value="${prop._id}" data-landlord="${landlordId}">
                            ${prop.title} (${prop.location})
                        </option>
                    `;
                }).join('');
        }
    } catch (error) {
        console.error('Error loading properties:', error);
    }
}

// Submit maintenance request
async function submitMaintenance(e) {
    e.preventDefault();
    
    const userDataString = localStorage.getItem('userData') || sessionStorage.getItem('userData');
    const userData = userDataString ? JSON.parse(userDataString) : {};
    
    const propertySelect = document.getElementById('maintPropertyId');
    const selectedOption = propertySelect.options[propertySelect.selectedIndex];
    
    const maintenanceData = {
        tenantId: userData.userId,
        propertyId: propertySelect.value,
        landlordId: selectedOption.dataset.landlord,
        title: document.getElementById('maintTitle').value,
        category: document.getElementById('maintCategory').value,
        priority: document.getElementById('maintPriority').value,
        description: document.getElementById('maintDescription').value
    };
    
    try {
        const response = await fetch('http://localhost:8000/api/maintenance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(maintenanceData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Maintenance request submitted successfully!', 'success');
            closeModal();
            loadMaintenance();
            loadDashboardStats();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Error submitting maintenance:', error);
        showNotification('Error submitting maintenance request', 'error');
    }
}

// View maintenance details
function viewMaintenanceDetails(maintenanceId) {
    showNotification('Maintenance details view coming soon!', 'success');
}

// Cancel maintenance request
async function cancelMaintenance(maintenanceId) {
    if (!confirm('Are you sure you want to cancel this maintenance request?')) return;
    
    try {
        const response = await fetch(`http://localhost:8000/api/maintenance/${maintenanceId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Maintenance request cancelled successfully', 'success');
            loadMaintenance();
            loadDashboardStats();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Error cancelling maintenance:', error);
        showNotification('Error cancelling maintenance request', 'error');
    }
}
// ==================== DOCUMENTS FUNCTIONS ====================

// Upload document for application
async function uploadApplicationDocument(applicationId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
    input.multiple = true;
    
    input.onchange = async (e) => {
        const files = e.target.files;
        if (files.length === 0) return;
        
        let userDataString = sessionStorage.getItem('userData');
        if (!userDataString) {
            userDataString = localStorage.getItem('userData');
        }
        const userData = userDataString ? JSON.parse(userDataString) : {};
        
        for (const file of files) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('uploadedBy', userData.userId);
            formData.append('relatedTo', 'application');
            formData.append('relatedId', applicationId);
            formData.append('category', 'other');
            
            try {
                const response = await fetch('http://localhost:8000/api/documents/upload', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showNotification(`${file.name} uploaded successfully!`, 'success');
                } else {
                    showNotification(`Failed to upload ${file.name}`, 'error');
                }
            } catch (error) {
                console.error('Error uploading document:', error);
                showNotification(`Error uploading ${file.name}`, 'error');
            }
        }
        
        // Reload documents
        loadApplicationDocuments(applicationId);
    };
    
    input.click();
}

// Load documents for application
async function loadApplicationDocuments(applicationId) {
    try {
        const response = await fetch(`http://localhost:8000/api/documents/application/${applicationId}`);
        const data = await response.json();
        
        if (data.success) {
            displayApplicationDocuments(data.documents, applicationId);
        }
    } catch (error) {
        console.error('Error loading documents:', error);
    }
}

// Display application documents
function displayApplicationDocuments(documents, applicationId) {
    const container = document.getElementById(`docs-${applicationId}`);
    if (!container) return;
    
    if (documents.length === 0) {
        container.innerHTML = `
            <div style="padding: 1rem; background: #f8f9fa; border-radius: 8px; text-align: center;">
                <p style="margin: 0; color: #666;">No documents uploaded yet</p>
                <button class="btn-secondary" style="margin-top: 0.5rem;" onclick="uploadApplicationDocument('${applicationId}')">
                    📎 Upload Documents
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div style="margin-bottom: 0.5rem;">
            <button class="btn-secondary" onclick="uploadApplicationDocument('${applicationId}')">
                📎 Add More Documents
            </button>
        </div>
        <div class="documents-list">
            ${documents.map(doc => `
                <div class="document-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: #f8f9fa; border-radius: 6px; margin-bottom: 0.5rem;">
                    <div>
                        <a href="http://localhost:8000${doc.fileUrl}" target="_blank" style="color: #667eea; text-decoration: none;">
                            📄 ${doc.fileName}
                        </a>
                        <small style="display: block; color: #666;">
                            ${(doc.fileSize / 1024).toFixed(2)} KB
                        </small>
                    </div>
                    <button class="btn-danger" style="padding: 0.25rem 0.5rem; font-size: 0.875rem;" onclick="deleteDocument('${doc._id}', '${applicationId}')">
                        🗑️
                    </button>
                </div>
            `).join('')}
        </div>
    `;
}

// Delete document
async function deleteDocument(documentId, applicationId) {
    if (!confirm('Delete this document?')) return;
    
    try {
        const response = await fetch(`http://localhost:8000/api/documents/${documentId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Document deleted successfully', 'success');
            loadApplicationDocuments(applicationId);
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Error deleting document:', error);
        showNotification('Error deleting document', 'error');
    }
}

// ==================== MESSAGING FUNCTIONS ====================

// Load notifications
async function loadNotifications() {
    let userDataString = sessionStorage.getItem('userData');
    if (!userDataString) {
        userDataString = localStorage.getItem('userData');
    }
    const userData = userDataString ? JSON.parse(userDataString) : {};
    if (!userData.userId) return;
    
    try {
        const response = await fetch(`http://localhost:8000/api/notifications/${userData.userId}`);
        const data = await response.json();
        
        if (data.success) {
            displayNotifications(data.notifications);
            updateNotificationBadge(data.notifications.filter(n => !n.read).length);
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

// Display notifications
function displayNotifications(notifications) {
    const container = document.getElementById('notificationsList');
    if (!container) return;
    
    if (notifications.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">🔔</span>
                <h3>No notifications</h3>
                <p>You're all caught up!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = notifications.map(notif => `
        <div class="notification-item ${notif.read ? 'read' : 'unread'}" style="padding: 1rem; border-bottom: 1px solid #e0e0e0; cursor: pointer; background: ${notif.read ? '#fff' : '#f0f4ff'};" onclick="markNotificationRead('${notif._id}')">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                    <h4 style="margin: 0 0 0.25rem 0; color: #333;">${notif.title}</h4>
                    <p style="margin: 0; color: #666; font-size: 0.9rem;">${notif.content}</p>
                    <small style="color: #999;">${new Date(notif.createdAt).toLocaleString()}</small>
                </div>
                <button class="btn-danger" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="event.stopPropagation(); deleteNotification('${notif._id}')">
                    🗑️
                </button>
            </div>
        </div>
    `).join('');
}

// Update notification badge
function updateNotificationBadge(count) {
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        if (count > 0) {
            badge.textContent = count > 9 ? '9+' : count;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    }
}

// Mark notification as read
async function markNotificationRead(notificationId) {
    try {
        await fetch(`http://localhost:8000/api/notifications/${notificationId}/read`, {
            method: 'PATCH'
        });
        loadNotifications();
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

// Delete notification
async function deleteNotification(notificationId) {
    try {
        const response = await fetch(`http://localhost:8000/api/notifications/${notificationId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadNotifications();
        }
    } catch (error) {
        console.error('Error deleting notification:', error);
    }
}

// Mark all notifications as read
async function markAllNotificationsRead() {
    let userDataString = sessionStorage.getItem('userData');
    if (!userDataString) {
        userDataString = localStorage.getItem('userData');
    }
    const userData = userDataString ? JSON.parse(userDataString) : {};
    
    try {
        const response = await fetch(`http://localhost:8000/api/notifications/mark-all-read/${userData.userId}`, {
            method: 'PATCH'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('All notifications marked as read', 'success');
            loadNotifications();
        }
    } catch (error) {
        console.error('Error marking all as read:', error);
    }
}

// ==================== DOCUMENT MANAGEMENT FUNCTIONS ====================

// Show documents section
function showDocumentsSection() {
    showSection('documents');
    loadUserDocuments();
}

// Load all user documents
async function loadUserDocuments() {
    let userDataString = sessionStorage.getItem('userData');
    if (!userDataString) {
        userDataString = localStorage.getItem('userData');
    }
    const userData = userDataString ? JSON.parse(userDataString) : {};
    if (!userData.userId) return;
    
    try {
        const response = await fetch(`http://localhost:8000/api/documents/user/${userData.userId}`);
        const data = await response.json();
        
        if (data.success) {
            displayUserDocuments(data.documents);
        }
    } catch (error) {
        console.error('Error loading documents:', error);
        showNotification('Error loading documents', 'error');
    }
}

// Display user documents
function displayUserDocuments(documents) {
    const container = document.getElementById('userDocumentsList');
    if (!container) return;
    
    if (documents.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📄</span>
                <h3>No documents uploaded yet</h3>
                <p>Upload important documents like IDs, proof of income, etc.</p>
                <button class="btn-primary" onclick="openUploadDocumentModal()">
                    📤 Upload Document
                </button>
            </div>
        `;
        return;
    }
    
    // Group documents by category
    const grouped = {
        'lease': documents.filter(d => d.category === 'lease'),
        'id': documents.filter(d => d.category === 'id'),
        'proof-of-income': documents.filter(d => d.category === 'proof-of-income'),
        'other': documents.filter(d => d.category === 'other')
    };
    
    const categoryNames = {
        'lease': '📜 Lease Agreements',
        'id': '🪪 ID Documents',
        'proof-of-income': '💰 Proof of Income',
        'other': '📁 Other Documents'
    };
    
    const categoryDescriptions = {
        'lease': 'Rental agreements and contracts',
        'id': 'National ID, Passport, Driver\'s License',
        'proof-of-income': 'Pay slips, bank statements, employment letters',
        'other': 'Additional documents'
    };
    
    container.innerHTML = `
        <div style="margin-bottom: 2rem;">
            <button class="btn-primary" onclick="openUploadDocumentModal()">
                📤 Upload New Document
            </button>
        </div>
        
        ${Object.keys(grouped).map(category => {
            const docs = grouped[category];
            if (docs.length === 0) return '';
            
            return `
                <div class="document-category" style="margin-bottom: 2rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid #667eea;">
                        <div>
                            <h3 style="margin: 0; color: #667eea;">${categoryNames[category]}</h3>
                            <p style="margin: 0.25rem 0 0 0; color: #666; font-size: 0.875rem;">${categoryDescriptions[category]}</p>
                        </div>
                        <span style="background: #667eea; color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.875rem; font-weight: bold;">
                            ${docs.length} ${docs.length === 1 ? 'file' : 'files'}
                        </span>
                    </div>
                    
                    <div class="documents-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">
                        ${docs.map(doc => `
                            <div class="document-card" style="background: white; border: 1px solid #e0e0e0; border-radius: 12px; padding: 1rem; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                                <div style="display: flex; align-items: start; margin-bottom: 0.75rem;">
                                    <div style="font-size: 2.5rem; margin-right: 1rem;">
                                        ${getFileIcon(doc.fileType)}
                                    </div>
                                    <div style="flex: 1; min-width: 0;">
                                        <h4 style="margin: 0; font-size: 0.95rem; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${doc.fileName}">
                                            ${doc.fileName}
                                        </h4>
                                        <p style="margin: 0.25rem 0 0 0; color: #999; font-size: 0.75rem;">
                                            ${formatFileSize(doc.fileSize)}
                                        </p>
                                    </div>
                                </div>
                                
                                ${doc.description ? `
                                    <p style="margin: 0 0 0.75rem 0; color: #666; font-size: 0.875rem; line-height: 1.4;">
                                        ${doc.description}
                                    </p>
                                ` : ''}
                                
                                <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 0.75rem; border-top: 1px solid #f0f0f0;">
                                    <small style="color: #999;">
                                        ${new Date(doc.uploadedAt).toLocaleDateString()}
                                    </small>
                                    <div style="display: flex; gap: 0.5rem;">
                                        <button class="btn-secondary" style="padding: 0.35rem 0.75rem; font-size: 0.813rem;" onclick="downloadDocument('${doc._id}', '${doc.fileName}', '${doc.fileUrl}')">
                                            ⬇️ Download
                                        </button>
                                        <button class="btn-danger" style="padding: 0.35rem 0.75rem; font-size: 0.813rem;" onclick="deleteUserDocument('${doc._id}')">
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('')}
    `;
}

// Get file icon based on file type
function getFileIcon(fileType) {
    if (fileType.includes('pdf')) return '📕';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('word') || fileType.includes('document')) return '📘';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    return '📄';
}

// Format file size
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Open upload document modal
function openUploadDocumentModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Upload Document</h2>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <form id="uploadDocumentForm" class="application-form">
                <div class="form-group">
                    <label>Select File *</label>
                    <input type="file" id="docFile" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt" required style="padding: 0.5rem; border: 1px solid #ddd; border-radius: 6px; width: 100%;">
                    <small style="color: #666;">Supported: PDF, DOC, DOCX, JPG, PNG (Max 10MB)</small>
                </div>
                
                <div class="form-group">
                    <label>Document Category *</label>
                    <select id="docCategory" required>
                        <option value="">-- Select category --</option>
                        <option value="lease">Lease Agreement</option>
                        <option value="id">ID Document</option>
                        <option value="proof-of-income">Proof of Income</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Description (Optional)</label>
                    <textarea id="docDescription" rows="3" placeholder="Add a brief description of this document..."></textarea>
                </div>
                
                <div class="form-group">
                    <label style="display: flex; align-items: center; cursor: pointer;">
                        <input type="checkbox" id="docPrivate" checked style="margin-right: 0.5rem;">
                        <span>Keep this document private (only visible to you)</span>
                    </label>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn-primary">📤 Upload Document</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.getElementById('uploadDocumentForm').addEventListener('submit', uploadUserDocument);
}

// Upload user document
async function uploadUserDocument(e) {
    e.preventDefault();
    
    let userDataString = sessionStorage.getItem('userData');
    if (!userDataString) {
        userDataString = localStorage.getItem('userData');
    }
    const userData = userDataString ? JSON.parse(userDataString) : {};
    
    const fileInput = document.getElementById('docFile');
    const file = fileInput.files[0];
    
    if (!file) {
        showNotification('Please select a file', 'error');
        return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
        showNotification('File size must be less than 10MB', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploadedBy', userData.userId);
    formData.append('relatedTo', 'user');
    formData.append('relatedId', userData.userId);
    formData.append('category', document.getElementById('docCategory').value);
    formData.append('description', document.getElementById('docDescription').value);
    formData.append('isPrivate', document.getElementById('docPrivate').checked);
    
    try {
        const response = await fetch('http://localhost:8000/api/documents/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Document uploaded successfully!', 'success');
            closeModal();
            loadUserDocuments();
        } else {
            showNotification(data.message || 'Failed to upload document', 'error');
        }
    } catch (error) {
        console.error('Error uploading document:', error);
        showNotification('Error uploading document', 'error');
    }
}

// Download document
function downloadDocument(documentId, fileName, fileUrl) {
    const link = document.createElement('a');
    link.href = `http://localhost:8000${fileUrl}`;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification(`Downloading ${fileName}...`, 'success');
}

// Delete user document
async function deleteUserDocument(documentId) {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) return;
    
    try {
        const response = await fetch(`http://localhost:8000/api/documents/${documentId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Document deleted successfully', 'success');
            loadUserDocuments();
        } else {
            showNotification(data.message || 'Failed to delete document', 'error');
        }
    } catch (error) {
        console.error('Error deleting document:', error);
        showNotification('Error deleting document', 'error');
    }
}










// Poll for new notifications and messages
setInterval(() => {
    loadNotifications();
}, 30000); // Every 30 seconds

// Load notifications on page load
window.addEventListener('DOMContentLoaded', function() {
    // ... existing code ...
    loadNotifications();
});