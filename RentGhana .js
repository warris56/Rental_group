// Properties will be loaded from backend
let propertiesData = [];
let filteredProperties = [];
let currentPage = 1;
const propertiesPerPage = 9;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadPropertiesFromBackend();
    updateAuthUI(); // Add this line to update navigation based on login status
});

// Update navigation based on authentication status
// Update navigation based on authentication status
function updateAuthUI() {
    const userDataString = localStorage.getItem('userData') || sessionStorage.getItem('userData');
    const userData = userDataString ? JSON.parse(userDataString) : null;
    
    // Get the nav-links container
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;
    
    // Find existing login and register links
    const loginLink = navLinks.querySelector('a[href*="login"]');
    const registerLink = navLinks.querySelector('a[href*="register"]');
    
    if (userData && userData.loggedIn) {
        // User is logged in - Update navigation
        
        // Remove existing login/register links if they exist
        if (loginLink) loginLink.remove();
        if (registerLink) registerLink.remove();
        
        // Check if dashboard link already exists
        let dashboardLink = navLinks.querySelector('.dashboard-link');
        
        if (!dashboardLink) {
            // Create dashboard link
            dashboardLink = document.createElement('a');
            dashboardLink.className = 'dashboard-link';
            dashboardLink.href = userData.userType === 'tenant' ? 'tenant-dashboard.html' : 'landlord-dashboard.html';
            dashboardLink.innerHTML = `👤 ${userData.fullName?.split(' ')[0] || 'Dashboard'}`;
            dashboardLink.style.cssText = `
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 0.75rem 1.5rem;
                border-radius: 25px;
                text-decoration: none;
                font-weight: 500;
                transition: all 0.3s ease;
                display: inline-block;
            `;
            
            dashboardLink.onmouseenter = function() {
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
            };
            
            dashboardLink.onmouseleave = function() {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = 'none';
            };
            
            navLinks.appendChild(dashboardLink);
        } else {
            // Update existing dashboard link
            dashboardLink.href = userData.userType === 'tenant' ? 'tenant-dashboard.html' : 'landlord-dashboard.html';
            dashboardLink.innerHTML = `👤 ${userData.fullName?.split(' ')[0] || 'Dashboard'}`;
        }
        
        // Check if logout button already exists
        let logoutBtn = navLinks.querySelector('.logout-btn');
        
        if (!logoutBtn) {
            // Create logout button
            logoutBtn = document.createElement('a');
            logoutBtn.href = '#';
            logoutBtn.className = 'logout-btn';
            logoutBtn.innerHTML = '🚪 Logout';
            logoutBtn.style.cssText = `
                background: #e74c3c;
                color: white;
                padding: 0.75rem 1.5rem;
                border-radius: 25px;
                text-decoration: none;
                font-weight: 500;
                transition: all 0.3s ease;
                display: inline-block;
            `;
            
            logoutBtn.onmouseenter = function() {
                this.style.background = '#c0392b';
                this.style.transform = 'translateY(-2px)';
            };
            
            logoutBtn.onmouseleave = function() {
                this.style.background = '#e74c3c';
                this.style.transform = 'translateY(0)';
            };
            
            logoutBtn.onclick = function(e) {
                e.preventDefault();
                if (confirm(`Logout ${userData.fullName?.split(' ')[0] || ''}?`)) {
                    localStorage.removeItem('userData');
                    sessionStorage.removeItem('userData');
                    window.location.href = 'index.html';
                }
            };
            
            navLinks.appendChild(logoutBtn);
        }
        
    } else {
        // User is NOT logged in - Show Login/Register
        
        // Remove dashboard and logout if they exist
        const dashboardLink = navLinks.querySelector('.dashboard-link');
        const logoutBtn = navLinks.querySelector('.logout-btn');
        
        if (dashboardLink) dashboardLink.remove();
        if (logoutBtn) logoutBtn.remove();
        
        // Restore login link if it doesn't exist
        if (!loginLink) {
            const newLoginLink = document.createElement('a');
            newLoginLink.href = 'login.html';
            newLoginLink.textContent = 'Login';
            navLinks.appendChild(newLoginLink);
        }
        
        // Restore register link if it doesn't exist
        if (!registerLink) {
            const newRegisterLink = document.createElement('a');
            newRegisterLink.href = 'register-choice.html';
            newRegisterLink.className = 'btn-primary';
            newRegisterLink.textContent = 'Register';
            navLinks.appendChild(newRegisterLink);
        }
    }
}

// Add logout option (simple version)
function addLogoutOption(userData) {
    // Remove existing logout if any
    removeLogoutOption();
    
    // Create logout button
    const logoutBtn = document.createElement('a');
    logoutBtn.href = '#';
    logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i>';
    logoutBtn.title = 'Logout';
    logoutBtn.style.cssText = `
        background: #e74c3c;
        color: white;
        padding: 0.5rem;
        border-radius: 50%;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        margin-left: 0.5rem;
        transition: all 0.3s ease;
    `;
    
    logoutBtn.onmouseenter = function() {
        this.style.background = '#c0392b';
        this.style.transform = 'scale(1.1)';
    };
    
    logoutBtn.onmouseleave = function() {
        this.style.background = '#e74c3c';
        this.style.transform = 'scale(1)';
    };
    
    logoutBtn.onclick = function(e) {
        e.preventDefault();
        if (confirm(`Logout ${userData.fullName?.split(' ')[0] || ''}?`)) {
            localStorage.removeItem('userData');
            sessionStorage.removeItem('userData');
            window.location.href = 'index.html';
        }
    };
    
    // Add to navigation
    const navLinks = document.querySelector('.nav-links');
    if (navLinks) {
        navLinks.appendChild(logoutBtn);
    }
}

// Remove logout option
function removeLogoutOption() {
    const logoutBtn = document.querySelector('.nav-links a[href="#"]:last-child');
    if (logoutBtn && logoutBtn.innerHTML.includes('fa-sign-out-alt')) {
        logoutBtn.remove();
    }
}

// Load properties from backend
async function loadPropertiesFromBackend() {
    try {
        const response = await fetch('http://localhost:8000/api/properties');
        const data = await response.json();
        
        if (data.success) {
            propertiesData = data.properties.map(prop => ({
                id: prop._id,
                title: prop.title,
                price: prop.price,
                location: prop.location,
                city: prop.city,
                bedrooms: prop.bedrooms,
                bathrooms: prop.bathrooms,
                type: prop.propertyType,
                image: prop.images[0] || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500",
                description: prop.description,
                amenities: prop.amenities,
                landlordId: prop.landlordId
            }));
            
            filteredProperties = [...propertiesData];
            displayProperties();
            updatePagination();
            
            console.log(`✅ Loaded ${propertiesData.length} properties from database`);
        }
    } catch (error) {
        console.error('Error loading properties:', error);
        document.getElementById('propertiesGrid').innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                <h3 style="color: #e74c3c;">Error loading properties</h3>
                <p style="color: #999;">Please make sure the backend server is running</p>
            </div>
        `;
    }
}

// Search Properties
function searchProperties() {
    const location = document.getElementById('searchLocation').value.toLowerCase();
    const type = document.getElementById('propertyType').value;
    const bedrooms = document.getElementById('bedrooms').value;

    filteredProperties = propertiesData.filter(property => {
        const matchLocation = location === '' || 
            property.location.toLowerCase().includes(location) ||
            property.city.toLowerCase().includes(location);
        const matchType = type === '' || property.type === type;
        const matchBedrooms = bedrooms === '' || property.bedrooms >= parseInt(bedrooms);

        return matchLocation && matchType && matchBedrooms;
    });

    currentPage = 1;
    displayProperties();
    updatePagination();
    
    document.getElementById('properties').scrollIntoView({ behavior: 'smooth' });
}

// Apply Filters
function applyFilters() {
    const minPrice = parseFloat(document.getElementById('minPrice').value) || 0;
    const maxPrice = parseFloat(document.getElementById('maxPrice').value) || Infinity;
    const city = document.getElementById('cityFilter').value;

    filteredProperties = propertiesData.filter(property => {
        const matchPrice = property.price >= minPrice && property.price <= maxPrice;
        const matchCity = city === '' || property.city === city;

        return matchPrice && matchCity;
    });

    currentPage = 1;
    displayProperties();
    updatePagination();
}

// Clear Filters
function clearFilters() {
    document.getElementById('searchLocation').value = '';
    document.getElementById('propertyType').value = '';
    document.getElementById('bedrooms').value = '';
    document.getElementById('minPrice').value = '';
    document.getElementById('maxPrice').value = '';
    document.getElementById('cityFilter').value = '';

    filteredProperties = [...propertiesData];
    currentPage = 1;
    displayProperties();
    updatePagination();
}

// Display Properties
function displayProperties() {
    const grid = document.getElementById('propertiesGrid');
    const start = (currentPage - 1) * propertiesPerPage;
    const end = start + propertiesPerPage;
    const propertiesToShow = filteredProperties.slice(start, end);

    if (propertiesToShow.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                <h3 style="color: #666; font-size: 1.5rem;">No properties found</h3>
                <p style="color: #999; margin-top: 0.5rem;">Try adjusting your search criteria</p>
            </div>
        `;
        document.getElementById('propertyCount').textContent = 'No properties found';
        return;
    }

    grid.innerHTML = propertiesToShow.map(property => `
        <div class="property-card">
            <img src="${property.image}" alt="${property.title}" class="property-image">
            <div class="property-info">
                <div class="property-price">GH₵ ${property.price.toLocaleString()}/month</div>
                <div class="property-location">📍 ${property.location}</div>
                <div class="property-details">
                    <div class="detail-item">🛏️ ${property.bedrooms} Bed</div>
                    <div class="detail-item">🚿 ${property.bathrooms} Bath</div>
                </div>
                <span class="property-type">${property.type.charAt(0).toUpperCase() + property.type.slice(1)}</span>
                <div class="property-actions">
                    <button class="save-btn" onclick="saveProperty('${property.id}')">💙 Save</button>
                    <button class="view-btn" onclick="viewProperty('${property.id}')">View Details</button>
                </div>
            </div>
        </div>
    `).join('');

    document.getElementById('propertyCount').textContent = 
        `Showing ${start + 1}-${Math.min(end, filteredProperties.length)} of ${filteredProperties.length} properties`;
}

// Save Property Function
async function saveProperty(propertyId) {
    const userDataString = localStorage.getItem('userData') || sessionStorage.getItem('userData');
    const userData = userDataString ? JSON.parse(userDataString) : {};
    
    if (!userData.loggedIn) {
        alert('Please login to save properties!');
        window.location.href = 'login.html';
        return;
    }
    
    if (userData.userType !== 'tenant') {
        alert('Only tenants can save properties!');
        return;
    }
    
    try {
        const response = await fetch('http://localhost:8000/api/saved-properties', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: userData.userId,
                propertyId: propertyId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Property saved successfully!\n\nView your saved properties in your dashboard.');
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error saving property:', error);
        alert('Error saving property. Please try again.');
    }
}

// View Property Details
// In RentGhana.js, replace the viewProperty function:
function viewProperty(id) {
    window.location.href = `property-details.html?id=${id}`;
}

// Pagination Functions
function updatePagination() {
    const totalPages = Math.ceil(filteredProperties.length / propertiesPerPage);
    document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
    
    const prevBtn = document.querySelector('.pagination .page-btn:first-child');
    const nextBtn = document.querySelector('.pagination .page-btn:last-child');
    
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        displayProperties();
        updatePagination();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function nextPage() {
    const totalPages = Math.ceil(filteredProperties.length / propertiesPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        displayProperties();
        updatePagination();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Mobile Menu Toggle
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
    });
}

// Add Enter key support for search
document.getElementById('searchLocation')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') searchProperties();
});

document.getElementById('minPrice')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') applyFilters();
});

document.getElementById('maxPrice')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') applyFilters();
});

// Also update auth when page becomes visible (if user logs in/out in another tab)
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        updateAuthUI();
    }
});

// Update auth when storage changes (login/logout in another tab)
window.addEventListener('storage', function(e) {
    if (e.key === 'userData' || e.key === null) {
        updateAuthUI();
    }
});