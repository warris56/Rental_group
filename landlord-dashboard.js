// Check if user is logged in as landlord
function checkAuth() {
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
    
    if (userData.userType !== 'landlord') {
        sessionStorage.removeItem('userData');
        alert('This is the landlord dashboard. Please login with a landlord account.');
        window.location.href = 'login.html';
        return null;
    }
    
    return userData;
}

let allApplications = [];
let allMaintenance = [];

// Load user data on page load
window.addEventListener('DOMContentLoaded', function() {
    const userData = checkAuth();
    
    if (userData) {
        document.getElementById('userName').textContent = userData.fullName || userData.email;
        document.getElementById('userNameWelcome').textContent = userData.fullName?.split(' ')[0] || 'Landlord';
        
        loadUserProfile(userData);
        loadDashboardStats();
    }
});

// Load user profile
async function loadUserProfile(userData) {
    try {
        const response = await fetch(`http://localhost:8000/api/users/${userData.userId}`);
        const data = await response.json();
        
        if (data.success) {
            const user = data.user;
            document.getElementById('profileName').textContent = user.fullName;
            document.getElementById('profileEmail').textContent = user.email;
            document.getElementById('profilePhone').textContent = user.phone || 'Not provided';
            document.getElementById('profileBusinessReg').textContent = user.businessReg || 'Not provided';
            document.getElementById('profileAddress').textContent = user.address || 'Not provided';
            document.getElementById('profileDate').textContent = new Date(user.createdAt).toLocaleDateString();
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Load dashboard statistics
async function loadDashboardStats() {
    let userDataString = sessionStorage.getItem('userData');
    if (!userDataString) {
        userDataString = localStorage.getItem('userData');
    }
    const userData = userDataString ? JSON.parse(userDataString) : {};
    
    if (!userData.userId) return;
    
    try {
        loadProperties();
        loadApplications();
        loadMaintenance();
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// ==================== PROPERTIES ====================

async function loadProperties() {
    let userDataString = sessionStorage.getItem('userData');
    if (!userDataString) {
        userDataString = localStorage.getItem('userData');
    }
    const userData = JSON.parse(userDataString);
    
    try {
        const response = await fetch(`http://localhost:8000/api/properties/landlord/${userData.userId}`);
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('propertiesCount').textContent = data.count;
            displayProperties(data.properties);
            
            // Calculate revenue
            const revenue = data.properties.reduce((sum, p) => sum + p.price, 0);
            document.getElementById('revenueCount').textContent = `GH₵ ${revenue.toLocaleString()}`;
        }
    } catch (error) {
        console.error('Error loading properties:', error);
    }
}

function displayProperties(properties) {
    const container = document.getElementById('propertiesList');
    
    if (properties.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">🏠</span>
                <h3>No properties listed yet</h3>
                <p>Add your first property to start receiving applications</p>
                <button class="btn-primary" onclick="openAddPropertyModal()">+ Add Property</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = properties.map(prop => {
        // Use first image if available, otherwise use gradient
        // FIX: Add full server URL for uploaded images
        const imageUrl = prop.images && prop.images.length > 0 
            ? (prop.images[0].startsWith('http') 
                ? prop.images[0] 
                : `http://localhost:8000${prop.images[0]}`)
            : null;
        
        return `
        <div class="property-card">
            <div class="property-image" style="${imageUrl ? `background-image: url('${imageUrl}'); background-size: cover; background-position: center;` : 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);'} height: 200px; border-radius: 12px 12px 0 0; position: relative;">
                ${!imageUrl ? '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 3rem; opacity: 0.3;">🏠</div>' : ''}
                <span class="image-count" style="position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">
                    📷 ${prop.images ? prop.images.length : 0}
                </span>
            </div>
            <div class="property-details">
                <div class="property-header">
                    <h3>${prop.title}</h3>
                    <span class="status-badge" style="background: ${prop.isAvailable ? '#10b981' : '#6c757d'}20; color: ${prop.isAvailable ? '#10b981' : '#6c757d'}">
                        ${prop.isAvailable ? '✓ Available' : '✗ Unavailable'}
                    </span>
                </div>
                <p class="property-location">📍 ${prop.location}, ${prop.city}</p>
                <div class="property-info">
                    <span>🛏️ ${prop.bedrooms} Beds</span>
                    <span>🚿 ${prop.bathrooms} Baths</span>
                    <span>🏷️ ${prop.propertyType}</span>
                </div>
                <div class="property-footer">
                    <div class="property-price">GH₵ ${prop.price.toLocaleString()}/month</div>
                    <div class="property-actions">
                        <button class="btn-secondary" onclick="editProperty('${prop._id}')">✏️ Edit</button>
                        <button class="btn-danger" onclick="deleteProperty('${prop._id}')">🗑️ Delete</button>
                        <button class="btn-primary" onclick="openPropertyDetails('${prop._id}')">👁️ View</button>
                    </div>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

// Add this function to view property details
function openPropertyDetails(propertyId) {
    showNotification('Property details page coming soon!', 'info');
}

function openAddPropertyModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 700px;">
            <div class="modal-header">
                <h2>Add New Property</h2>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <form id="addPropertyForm" class="application-form">
                <div class="form-group">
                    <label>Upload Property Images *</label>
                    <input type="file" id="newPropImages" multiple accept="image/*" style="padding: 0.5rem; border: 1px solid #ddd; border-radius: 6px; width: 100%;">
                    <small style="color: #666;">Select up to 10 images (JPG, PNG)</small>
                    <div id="imagePreview" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 0.5rem; margin-top: 0.5rem;"></div>
                </div>
                
                <div class="form-group">
                    <label>Property Title *</label>
                    <input type="text" id="propTitle" placeholder="e.g., Modern 2 Bedroom Apartment" required>
                </div>
                
                <div class="form-group">
                    <label>Description *</label>
                    <textarea id="propDescription" rows="3" placeholder="Describe your property..." required></textarea>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div class="form-group">
                        <label>Price (GH₵/month) *</label>
                        <input type="number" id="propPrice" placeholder="2000" required>
                    </div>
                    <div class="form-group">
                        <label>City *</label>
                        <select id="propCity" required>
                            <option value="">Select city</option>
                            <option value="accra">Accra</option>
                            <option value="kumasi">Kumasi</option>
                            <option value="takoradi">Takoradi</option>
                            <option value="tamale">Tamale</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Specific Location *</label>
                    <input type="text" id="propLocation" placeholder="e.g., East Legon, Accra" required>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
                    <div class="form-group">
                        <label>Bedrooms *</label>
                        <input type="number" id="propBedrooms" min="1" required>
                    </div>
                    <div class="form-group">
                        <label>Bathrooms *</label>
                        <input type="number" id="propBathrooms" min="1" required>
                    </div>
                    <div class="form-group">
                        <label>Type *</label>
                        <select id="propType" required>
                            <option value="">Select</option>
                            <option value="apartment">Apartment</option>
                            <option value="house">House</option>
                            <option value="studio">Studio</option>
                            <option value="villa">Villa</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Amenities (comma-separated)</label>
                    <input type="text" id="propAmenities" placeholder="Parking, Security, Pool, etc.">
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn-primary">Add Property</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Image preview handler
    document.getElementById('newPropImages').addEventListener('change', function(e) {
        const preview = document.getElementById('imagePreview');
        preview.innerHTML = '';
        
        Array.from(e.target.files).forEach(file => {
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = document.createElement('img');
                img.src = event.target.result;
                img.style.cssText = 'width: 100%; height: 100px; object-fit: cover; border-radius: 6px;';
                preview.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
    });
    
    document.getElementById('addPropertyForm').addEventListener('submit', addProperty);
}

async function addProperty(e) {
    e.preventDefault();
    let userDataString = sessionStorage.getItem('userData');
    if (!userDataString) {
        userDataString = localStorage.getItem('userData');
    }
    const userData = JSON.parse(userDataString);
    
    const amenitiesText = document.getElementById('propAmenities').value;
    const amenities = amenitiesText ? amenitiesText.split(',').map(a => a.trim()) : [];
    
    const propertyData = {
        title: document.getElementById('propTitle').value,
        description: document.getElementById('propDescription').value,
        price: parseFloat(document.getElementById('propPrice').value),
        city: document.getElementById('propCity').value,
        location: document.getElementById('propLocation').value,
        bedrooms: parseInt(document.getElementById('propBedrooms').value),
        bathrooms: parseInt(document.getElementById('propBathrooms').value),
        propertyType: document.getElementById('propType').value,
        amenities: amenities,
        landlordId: userData.userId
    };
    
    try {
        // First create the property
        const response = await fetch('http://localhost:8000/api/properties', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(propertyData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            const propertyId = data.property._id;
            
            // Upload images if any
            const imageInput = document.getElementById('newPropImages');
            if (imageInput.files.length > 0) {
                const formData = new FormData();
                Array.from(imageInput.files).forEach(file => {
                    formData.append('images', file);
                });
                
                await fetch(`http://localhost:8000/api/properties/${propertyId}/upload-images`, {
                    method: 'POST',
                    body: formData
                });
            }
            
            showNotification('Property added successfully!', 'success');
            closeModal();
            loadProperties();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Error adding property:', error);
        showNotification('Error adding property', 'error');
    }
}

async function editProperty(propertyId) {
    let userDataString = sessionStorage.getItem('userData');
    if (!userDataString) {
        userDataString = localStorage.getItem('userData');
    }
    const userData = JSON.parse(userDataString);
    
    // Fetch current property data
    try {
        const response = await fetch(`http://localhost:8000/api/properties/landlord/${userData.userId}`);
        const data = await response.json();
        
        if (data.success) {
            const property = data.properties.find(p => p._id === propertyId);
            if (!property) {
                showNotification('Property not found', 'error');
                return;
            }
            
            openEditPropertyModal(property);
        }
    } catch (error) {
        console.error('Error fetching property:', error);
        showNotification('Error loading property data', 'error');
    }
}

function openEditPropertyModal(property) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 700px;">
            <div class="modal-header">
                <h2>Edit Property</h2>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <form id="editPropertyForm" class="application-form">
                <div class="form-group">
                    <label>Property Title *</label>
                    <input type="text" id="editPropTitle" value="${property.title}" required>
                </div>
                
                <div class="form-group">
                    <label>Description *</label>
                    <textarea id="editPropDescription" rows="3" required>${property.description || ''}</textarea>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div class="form-group">
                        <label>Price (GH₵/month) *</label>
                        <input type="number" id="editPropPrice" value="${property.price}" required>
                    </div>
                    <div class="form-group">
                        <label>City *</label>
                        <select id="editPropCity" required>
                            <option value="accra" ${property.city === 'accra' ? 'selected' : ''}>Accra</option>
                            <option value="kumasi" ${property.city === 'kumasi' ? 'selected' : ''}>Kumasi</option>
                            <option value="takoradi" ${property.city === 'takoradi' ? 'selected' : ''}>Takoradi</option>
                            <option value="tamale" ${property.city === 'tamale' ? 'selected' : ''}>Tamale</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Specific Location *</label>
                    <input type="text" id="editPropLocation" value="${property.location}" required>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
                    <div class="form-group">
                        <label>Bedrooms *</label>
                        <input type="number" id="editPropBedrooms" value="${property.bedrooms}" min="1" required>
                    </div>
                    <div class="form-group">
                        <label>Bathrooms *</label>
                        <input type="number" id="editPropBathrooms" value="${property.bathrooms}" min="1" required>
                    </div>
                    <div class="form-group">
                        <label>Type *</label>
                        <select id="editPropType" required>
                            <option value="apartment" ${property.propertyType === 'apartment' ? 'selected' : ''}>Apartment</option>
                            <option value="house" ${property.propertyType === 'house' ? 'selected' : ''}>House</option>
                            <option value="studio" ${property.propertyType === 'studio' ? 'selected' : ''}>Studio</option>
                            <option value="villa" ${property.propertyType === 'villa' ? 'selected' : ''}>Villa</option>
                        </select>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                    <div class="form-group">
                        <label>Availability</label>
                        <select id="editPropAvailability">
                            <option value="true" ${property.isAvailable ? 'selected' : ''}>Available</option>
                            <option value="false" ${!property.isAvailable ? 'selected' : ''}>Unavailable</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Amenities (comma-separated)</label>
                    <input type="text" id="editPropAmenities" value="${property.amenities ? property.amenities.join(', ') : ''}" placeholder="Parking, Security, Pool, etc.">
                </div>
                
                <div class="form-group">
                    <label>Property Images (one per line - URL format)</label>
                    <textarea id="editPropImages" rows="3" placeholder="https://example.com/image1.jpg">${property.images ? property.images.join('\n') : ''}</textarea>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn-primary">Save Changes</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.getElementById('editPropertyForm').addEventListener('submit', (e) => updateProperty(e, property._id));
}

async function updateProperty(e, propertyId) {
    e.preventDefault();
    
    const imagesText = document.getElementById('editPropImages').value;
    const images = imagesText ? imagesText.split('\n').map(img => img.trim()).filter(img => img) : [];
    
    const amenitiesText = document.getElementById('editPropAmenities').value;
    const amenities = amenitiesText ? amenitiesText.split(',').map(a => a.trim()) : [];
    
    const propertyData = {
        title: document.getElementById('editPropTitle').value,
        description: document.getElementById('editPropDescription').value,
        price: parseFloat(document.getElementById('editPropPrice').value),
        city: document.getElementById('editPropCity').value,
        location: document.getElementById('editPropLocation').value,
        bedrooms: parseInt(document.getElementById('editPropBedrooms').value),
        bathrooms: parseInt(document.getElementById('editPropBathrooms').value),
        propertyType: document.getElementById('editPropType').value,
        isAvailable: document.getElementById('editPropAvailability').value === 'true',
        amenities: amenities,
        images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2']
    };
    
    try {
        const response = await fetch(`http://localhost:8000/api/properties/${propertyId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(propertyData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Property updated successfully!', 'success');
            closeModal();
            loadProperties();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Error updating property:', error);
        showNotification('Error updating property', 'error');
    }
}

async function deleteProperty(propertyId) {
    if (!confirm('Are you sure you want to delete this property?')) return;
    
    try {
        const response = await fetch(`http://localhost:8000/api/properties/${propertyId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Property deleted successfully', 'success');
            loadProperties();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Error deleting property:', error);
        showNotification('Error deleting property', 'error');
    }
}

// ==================== APPLICATIONS ====================

async function loadApplications() {
    let userDataString = sessionStorage.getItem('userData');
    if (!userDataString) {
        userDataString = localStorage.getItem('userData');
    }
    const userData = userDataString ? JSON.parse(userDataString) : {};
    
    if (!userData || !userData.userId) {
        console.error('No user data found');
        return;
    }
    
    try {
        console.log('Loading applications for landlord:', userData.userId);
        const response = await fetch(`http://localhost:8000/api/applications/landlord/${userData.userId}`);
        const data = await response.json();
        
        console.log('Applications response:', data);
        
        if (data.success) {
            allApplications = data.applications;
            const pendingCount = data.applications.filter(app => app.status === 'pending').length;
            document.getElementById('applicationsCount').textContent = pendingCount;
            displayApplications(data.applications);
        } else {
            console.error('Failed to load applications:', data.message);
            showNotification('Failed to load applications', 'error');
        }
    } catch (error) {
        console.error('Error loading applications:', error);
        showNotification('Error loading applications', 'error');
    }
}

function displayApplications(applications) {
    const container = document.getElementById('applicationsList');
    
    if (!container) {
        console.error('Applications list container not found');
        return;
    }
    
    if (applications.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📝</span>
                <h3>No applications yet</h3>
                <p>Applications from tenants will appear here</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = applications.map(app => {
        const property = app.propertyId;
        const tenant = app.tenantId;
        
        if (!property || !tenant) {
            console.warn('Missing property or tenant data:', app);
            return '';
        }
        
        const statusColors = {
            'pending': '#f59e0b',
            'approved': '#10b981',
            'rejected': '#e74c3c'
        };
        
        return `
            <div class="application-card">
                <div class="application-header">
                    <div>
                        <h3>${tenant.fullName}</h3>
                        <p class="property-location">📧 ${tenant.email} | 📞 ${tenant.phone}</p>
                        <p class="property-location">🏠 ${property.title}</p>
                    </div>
                    <span class="status-badge" style="background: ${statusColors[app.status]}20; color: ${statusColors[app.status]}">
                        ${app.status.toUpperCase()}
                    </span>
                </div>
                
                <div class="application-body">
                    <div class="application-info">
                        <div class="info-item">
                            <span class="label">Move-in Date:</span>
                            <span class="value">${new Date(app.moveInDate).toLocaleDateString()}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Employment:</span>
                            <span class="value">${app.employmentStatus}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Income:</span>
                            <span class="value">GH₵ ${app.monthlyIncome ? app.monthlyIncome.toLocaleString() : 'Not provided'}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Applied:</span>
                            <span class="value">${new Date(app.appliedAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                    
                    <div class="application-message">
                        <strong>Tenant's Message:</strong>
                        <p>${app.message}</p>
                    </div>
                    
                    ${app.landlordResponse ? `
                        <div class="landlord-response">
                            <strong>Your Response:</strong>
                            <p>${app.landlordResponse}</p>
                            <small>Responded: ${new Date(app.respondedAt).toLocaleDateString()}</small>
                        </div>
                    ` : ''}
                </div>
                
                <div class="application-actions">
                    ${app.status === 'pending' ? `
                        <button class="btn-primary" onclick="respondToApplication('${app._id}', 'approved')">✓ Approve</button>
                        <button class="btn-danger" onclick="respondToApplication('${app._id}', 'rejected')">✗ Reject</button>
                    ` : `
                        <span style="color: #666;">Responded: ${new Date(app.respondedAt).toLocaleDateString()}</span>
                    `}
                </div>
            </div>
        `;
    }).join('');
}

async function respondToApplication(applicationId, status) {
    const message = status === 'approved' 
        ? 'Congratulations! Your application has been approved.' 
        : 'Thank you for your interest. Unfortunately, we cannot proceed with your application at this time.';
    
    const landlordResponse = prompt(`Add a message to the tenant:`, message);
    
    if (landlordResponse === null) return; // User cancelled
    
    try {
        const res = await fetch(`http://localhost:8000/api/applications/${applicationId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                status, 
                landlordResponse: landlordResponse || message 
            })
        });
        
        const data = await res.json();
        
        if (data.success) {
            showNotification(`Application ${status}!`, 'success');
            loadApplications(); // Reload applications
            loadDashboardStats(); // Update counts
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Error responding to application:', error);
        showNotification('Error responding to application', 'error');
    }
}

function filterApplications() {
    const filter = document.getElementById('appStatusFilter').value;
    const filtered = filter === 'all' ? allApplications : allApplications.filter(app => app.status === filter);
    displayApplications(filtered);
}

// ==================== MAINTENANCE ====================

async function loadMaintenance() {
    let userDataString = sessionStorage.getItem('userData');
    if (!userDataString) {
        userDataString = localStorage.getItem('userData');
    }
    const userData = userDataString ? JSON.parse(userDataString) : {};
    
    if (!userData || !userData.userId) {
        console.error('No user data found');
        return;
    }
    
    try {
        console.log('Loading maintenance for landlord:', userData.userId);
        const response = await fetch(`http://localhost:8000/api/maintenance/landlord/${userData.userId}`);
        const data = await response.json();
        
        console.log('Maintenance response:', data);
        
        if (data.success) {
            allMaintenance = data.maintenance;
            const openCount = data.maintenance.filter(m => m.status === 'open' || m.status === 'in-progress').length;
            document.getElementById('maintenanceCount').textContent = openCount;
            displayMaintenance(data.maintenance);
        } else {
            console.error('Failed to load maintenance:', data.message);
            showNotification('Failed to load maintenance requests', 'error');
        }
    } catch (error) {
        console.error('Error loading maintenance:', error);
        showNotification('Error loading maintenance requests', 'error');
    }
}

function displayMaintenance(maintenanceRequests) {
    const container = document.getElementById('maintenanceList');
    
    if (!container) {
        console.error('Maintenance list container not found');
        return;
    }
    
    if (maintenanceRequests.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">🔧</span>
                <h3>No maintenance requests</h3>
                <p>Maintenance requests from tenants will appear here</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = maintenanceRequests.map(request => {
        const property = request.propertyId;
        const tenant = request.tenantId;
        
        if (!property || !tenant) {
            console.warn('Missing property or tenant data:', request);
            return '';
        }
        
        const statusColors = {
            'open': '#f59e0b',
            'in-progress': '#3b82f6',
            'completed': '#10b981',
            'cancelled': '#6c757d'
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
                        <p class="property-location">👤 ${tenant.fullName} | 📞 ${tenant.phone}</p>
                        <p class="property-location">🏠 ${property.title} - ${property.location}</p>
                    </div>
                    <div class="badges">
                        <span class="status-badge" style="background: ${statusColors[request.status]}20; color: ${statusColors[request.status]}">
                            ${request.status.toUpperCase().replace('-', ' ')}
                        </span>
                        <span class="priority-badge" style="background: ${priorityColors[request.priority]}20; color: ${priorityColors[request.priority]}; margin-left: 0.5rem;">
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
                        <strong>Issue Description:</strong>
                        <p>${request.description}</p>
                    </div>
                    
                    ${request.landlordNotes ? `
                        <div class="landlord-notes">
                            <strong>Your Notes:</strong>
                            <p>${request.landlordNotes}</p>
                        </div>
                    ` : ''}
                </div>
                
                <div class="maintenance-actions">
                    ${request.status === 'open' ? `
                        <button class="btn-secondary" onclick="updateMaintenanceStatus('${request._id}', 'in-progress')">🔧 Start Work</button>
                        <button class="btn-primary" onclick="updateMaintenanceStatus('${request._id}', 'completed')">✓ Mark Complete</button>
                    ` : request.status === 'in-progress' ? `
                        <button class="btn-primary" onclick="updateMaintenanceStatus('${request._id}', 'completed')">✓ Mark Complete</button>
                    ` : `
                        <span style="color: #10b981;">✓ ${request.status.charAt(0).toUpperCase() + request.status.slice(1)}</span>
                    `}
                </div>
            </div>
        `;
    }).join('');
}

async function updateMaintenanceStatus(maintenanceId, status) {
    const defaultNote = status === 'completed' 
        ? 'The maintenance issue has been resolved.' 
        : 'We have started working on your maintenance request.';
    
    const landlordNotes = prompt(`Add notes for the tenant (optional):`, defaultNote);
    
    if (landlordNotes === null) return; // User cancelled
    
    try {
        const res = await fetch(`http://localhost:8000/api/maintenance/${maintenanceId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                status, 
                landlordNotes: landlordNotes || defaultNote 
            })
        });
        
        const data = await res.json();
        
        if (data.success) {
            showNotification(`Maintenance ${status === 'in-progress' ? 'in progress' : status}!`, 'success');
            loadMaintenance(); // Reload maintenance
            loadDashboardStats(); // Update counts
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Error updating maintenance:', error);
        showNotification('Error updating maintenance', 'error');
    }
}

function filterMaintenance() {
    const filter = document.getElementById('maintStatusFilter').value;
    const filtered = filter === 'all' ? allMaintenance : allMaintenance.filter(m => m.status === filter);
    displayMaintenance(filtered);
}

// ==================== UTILITIES ====================

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

function showSection(sectionName) {
    const titles = {
        'overview': 'Dashboard Overview',
        'properties': 'Saved Properties',
        'applications': 'My Applications',
        'maintenance': 'Maintenance Requests',
        'notifications': '🔔 Notifications',  // ← THIS LINE
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
    } else if (sectionName === 'notifications') {
        loadNotifications();
    }
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('userData');
        sessionStorage.removeItem('userData');
        window.location.href = 'login.html';
    }
}

function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();
}

function enableEdit() {
    showNotification('Edit profile feature coming soon!', 'success');
}

document.addEventListener('click', function(event) {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.querySelector('.menu-toggle');
    
    if (window.innerWidth <= 968) {
        if (!sidebar.contains(event.target) && event.target !== menuToggle) {
            sidebar.classList.remove('active');
        }
    }
});

// ==================== MESSAGING FUNCTIONS (Same as tenant) ====================

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
            badge.style.display = 'flex';
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

// ==================== PROFILE EDITING ====================

// Enable profile editing
function enableEdit() {
    showEditProfileForm();
}

// Show edit profile form
function showEditProfileForm() {
    const userData = getCurrentUser();
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h2>Edit Profile</h2>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <form id="editProfileForm" class="application-form">
                <div class="form-group">
                    <label>Full Name / Business Name *</label>
                    <input type="text" id="editFullName" value="${document.getElementById('profileName').textContent}" required>
                </div>
                
                <div class="form-group">
                    <label>Email (Cannot be changed)</label>
                    <input type="email" value="${document.getElementById('profileEmail').textContent}" disabled style="background: #f5f5f5; cursor: not-allowed;">
                    <small style="color: #666;">Email address cannot be changed for security reasons</small>
                </div>
                
                <div class="form-group">
                    <label>Phone Number *</label>
                    <input type="tel" id="editPhone" value="${document.getElementById('profilePhone').textContent === 'Not provided' ? '' : document.getElementById('profilePhone').textContent}" required>
                </div>
                
                <div class="form-group">
                    <label>Business Registration (Cannot be changed)</label>
                    <input type="text" value="${document.getElementById('profileBusinessReg').textContent === 'Not provided' ? 'Not provided' : document.getElementById('profileBusinessReg').textContent}" disabled style="background: #f5f5f5; cursor: not-allowed;">
                    <small style="color: #666;">Business registration number cannot be changed</small>
                </div>
                
                <div class="form-group">
                    <label>Address</label>
                    <textarea id="editAddress" rows="3" placeholder="Enter your business address">${document.getElementById('profileAddress').textContent === 'Not provided' ? '' : document.getElementById('profileAddress').textContent}</textarea>
                </div>
                
                <hr style="margin: 1.5rem 0; border: none; border-top: 1px solid #e0e0e0;">
                
                <h3 style="margin-bottom: 1rem; color: #667eea;">Change Password (Optional)</h3>
                
                <div class="form-group">
                    <label>Current Password</label>
                    <div style="position: relative;">
                        <input type="password" id="editCurrentPassword" placeholder="Enter current password" style="width: 100%; padding-right: 40px;">
                        <button type="button" class="password-toggle" onclick="togglePasswordVisibility('editCurrentPassword', this)" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #666;">👁️</button>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>New Password</label>
                    <div style="position: relative;">
                        <input type="password" id="editNewPassword" placeholder="Enter new password (minimum 8 characters)" style="width: 100%; padding-right: 40px;">
                        <button type="button" class="password-toggle" onclick="togglePasswordVisibility('editNewPassword', this)" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #666;">👁️</button>
                    </div>
                    <small style="color: #666;">Leave blank if you don't want to change password</small>
                </div>
                
                <div class="form-group">
                    <label>Confirm New Password</label>
                    <div style="position: relative;">
                        <input type="password" id="editConfirmPassword" placeholder="Confirm new password" style="width: 100%; padding-right: 40px;">
                        <button type="button" class="password-toggle" onclick="togglePasswordVisibility('editConfirmPassword', this)" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #666;">👁️</button>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn-primary">Save Changes</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.getElementById('editProfileForm').addEventListener('submit', updateLandlordProfile);
}

// Toggle password visibility
function togglePasswordVisibility(fieldId, button) {
    const input = document.getElementById(fieldId);
    if (input.type === 'password') {
        input.type = 'text';
        button.textContent = '🙈';
    } else {
        input.type = 'password';
        button.textContent = '👁️';
    }
}

// Get current user data
function getCurrentUser() {
    let userDataString = sessionStorage.getItem('userData');
    if (!userDataString) {
        userDataString = localStorage.getItem('userData');
    }
    return userDataString ? JSON.parse(userDataString) : null;
}

// Update landlord profile
async function updateLandlordProfile(e) {
    e.preventDefault();
    
    const userData = getCurrentUser();
    if (!userData) {
        showNotification('Please login again', 'error');
        return;
    }
    
    const fullName = document.getElementById('editFullName').value.trim();
    const phone = document.getElementById('editPhone').value.trim();
    const address = document.getElementById('editAddress').value.trim();
    const currentPassword = document.getElementById('editCurrentPassword').value;
    const newPassword = document.getElementById('editNewPassword').value;
    const confirmPassword = document.getElementById('editConfirmPassword').value;
    
    // Validation
    if (!fullName || !phone) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Password validation if trying to change
    if (newPassword) {
        if (!currentPassword) {
            showNotification('Please enter your current password to change it', 'error');
            return;
        }
        
        if (newPassword.length < 8) {
            showNotification('New password must be at least 8 characters', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showNotification('New passwords do not match', 'error');
            return;
        }
    }
    
    // Prepare update data
    const updateData = {
        fullName,
        phone,
        address: address || undefined
    };
    
    // Add password data if changing
    if (newPassword) {
        updateData.currentPassword = currentPassword;
        updateData.newPassword = newPassword;
    }
    
    try {
        const response = await fetch(`http://localhost:8000/api/users/${userData.userId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
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
            updateProfileDisplay(data.user);
            updateDashboardName(data.user.fullName);
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification('Error updating profile', 'error');
    }
}

// Update profile display after edit
function updateProfileDisplay(user) {
    document.getElementById('profileName').textContent = user.fullName;
    document.getElementById('profilePhone').textContent = user.phone || 'Not provided';
    document.getElementById('profileAddress').textContent = user.address || 'Not provided';
    document.getElementById('profileBusinessReg').textContent = user.businessReg || 'Not provided';
    document.getElementById('profileDate').textContent = new Date(user.createdAt).toLocaleDateString();
}

// Update dashboard name
function updateDashboardName(fullName) {
    document.getElementById('userName').textContent = fullName;
    document.getElementById('userNameWelcome').textContent = fullName.split(' ')[0] || 'Landlord';
}










// Poll for new notifications
setInterval(() => {
    loadNotifications();
}, 30000); // Every 30 seconds

// Load notifications on page load
window.addEventListener('DOMContentLoaded', function() {
    // Existing code runs first, then:
    setTimeout(() => {
        loadNotifications();
    }, 1000);
});