// Property Details Page JavaScript

let currentProperty = null;
let currentLandlord = null;
let currentImages = [];
let currentImageIndex = 0;
let map = null;
let userData = null;

// Update navigation based on authentication status
function updateAuthUI() {
    const userDataString = localStorage.getItem('userData') || sessionStorage.getItem('userData');
    const userData = userDataString ? JSON.parse(userDataString) : null;
    
    const loginLink = document.getElementById('loginLink');
    const registerBtn = document.querySelector('a.btn-primary[href*="register"]');
    
    if (!loginLink) return;
    
    if (userData && userData.loggedIn) {
        // User is logged in - Show Dashboard link
        loginLink.innerHTML = `
            <i class="fas fa-user-circle"></i> ${userData.fullName?.split(' ')[0] || 'Dashboard'}
        `;
        loginLink.href = userData.userType === 'tenant' ? 'tenant-dashboard.html' : 'landlord-dashboard.html';
        loginLink.style.cssText = `
            background: #667eea;
            color: white;
            padding: 0.5rem 1.5rem;
            border-radius: 20px;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 500;
            transition: all 0.3s ease;
        `;
        
        // Hide register button
        if (registerBtn) {
            registerBtn.style.display = 'none';
        }
    } else {
        // User is not logged in - Show Login link
        loginLink.textContent = 'Login';
        loginLink.href = 'login.html';
        loginLink.style.cssText = ''; // Reset styles
        
        // Show register button
        if (registerBtn) {
            registerBtn.style.display = 'inline-block';
        }
    }
}

// Then call it in your DOMContentLoaded:
document.addEventListener('DOMContentLoaded', async function() {
    const propertyId = getPropertyIdFromURL();
    
    updateAuthUI(); // Add this line
    
    // ... rest of your code
});
// Get property ID from URL
function getPropertyIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    const propertyId = getPropertyIdFromURL();
    
    if (!propertyId) {
        showError('No property ID specified');
        return;
    }
    
    // Check if user is logged in
    userData = JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData') || '{}');
    
    // Load property details
    await loadPropertyDetails(propertyId);
    
    // Initialize mobile menu
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
        });
    }
    
    // Update login link based on auth status
    updateAuthLinks();
});

// Update authentication links
function updateAuthLinks() {
    const loginLink = document.getElementById('loginLink');
    if (userData && userData.loggedIn) {
        if (userData.userType === 'tenant') {
            loginLink.href = 'tenant-dashboard.html';
            loginLink.innerHTML = '<i class="fas fa-user"></i> Dashboard';
        } else if (userData.userType === 'landlord') {
            loginLink.href = 'landlord-dashboard.html';
            loginLink.innerHTML = '<i class="fas fa-user-tie"></i> Dashboard';
        }
    }
}

// Load property details from backend
async function loadPropertyDetails(propertyId) {
    try {
        const response = await fetch(`http://localhost:8000/api/properties`);
        const data = await response.json();
        
        if (data.success) {
            // Find the specific property
            const property = data.properties.find(p => p._id === propertyId);
            
            if (!property) {
                showError('Property not found');
                return;
            }
            
            currentProperty = property;
            currentImages = property.images || [];
            
            // Load landlord details
            await loadLandlordDetails(property.landlordId?._id || property.landlordId);
            
            // Display property
            displayPropertyDetails();
            
            // Hide loading, show content
            document.getElementById('loading').style.display = 'none';
            document.getElementById('propertyDetails').style.display = 'block';
            
            // Initialize gallery
            initializeGallery();
            
            // Load similar properties
            loadSimilarProperties();
        } else {
            showError('Failed to load property details');
        }
    } catch (error) {
        console.error('Error loading property:', error);
        showError('Error loading property details');
    }
}

// Load landlord details
async function loadLandlordDetails(landlordId) {
    try {
        const response = await fetch(`http://localhost:8000/api/users/${landlordId}`);
        const data = await response.json();
        
        if (data.success) {
            currentLandlord = data.user;
        } else {
            // Create a placeholder landlord object
            currentLandlord = {
                fullName: 'Unknown Landlord',
                email: 'Not available',
                phone: 'Not provided',
                userType: 'landlord'
            };
        }
    } catch (error) {
        console.error('Error loading landlord:', error);
        currentLandlord = {
            fullName: 'Unknown Landlord',
            email: 'Not available',
            phone: 'Not provided',
            userType: 'landlord'
        };
    }
}

// Display property details
function displayPropertyDetails() {
    if (!currentProperty) return;
    
    // Basic info
    document.getElementById('propertyTitle').textContent = currentProperty.title;
    document.getElementById('propertyPrice').textContent = `GH₵ ${currentProperty.price.toLocaleString()}/month`;
    document.getElementById('propertyLocation').textContent = `${currentProperty.location}, ${currentProperty.city}`;
    document.getElementById('propertyDescription').textContent = currentProperty.description || 'No description available';
    document.getElementById('bedroomsCount').textContent = currentProperty.bedrooms;
    document.getElementById('bathroomsCount').textContent = currentProperty.bathrooms;
    document.getElementById('propertyType').textContent = currentProperty.propertyType?.charAt(0).toUpperCase() + currentProperty.propertyType?.slice(1) || 'Unknown';
    document.getElementById('propertyCity').textContent = currentProperty.city?.charAt(0).toUpperCase() + currentProperty.city?.slice(1) || 'Unknown';
    document.getElementById('listedDate').textContent = new Date(currentProperty.createdAt).toLocaleDateString();
    
    // Status
    const statusElement = document.getElementById('propertyStatus');
    const statusTextElement = document.getElementById('statusText');
    
    if (currentProperty.isAvailable) {
        statusElement.className = 'status-badge available';
        statusElement.innerHTML = '<i class="fas fa-check-circle"></i> Available';
        statusTextElement.textContent = 'This property is currently available for rent';
        document.getElementById('applyBtn').disabled = false;
    } else {
        statusElement.className = 'status-badge unavailable';
        statusElement.innerHTML = '<i class="fas fa-times-circle"></i> Unavailable';
        statusTextElement.textContent = 'This property is currently not available for rent';
        document.getElementById('applyBtn').disabled = true;
        document.getElementById('applyBtn').innerHTML = '<i class="fas fa-ban"></i> Property Unavailable';
    }
    
    // Landlord info
    document.getElementById('landlordName').textContent = currentLandlord?.fullName || 'Unknown Landlord';
    document.getElementById('landlordEmail').textContent = currentLandlord?.email || 'Not available';
    document.getElementById('landlordPhone').textContent = currentLandlord?.phone || 'Not provided';
    
    // Amenities
    const amenitiesList = document.getElementById('amenitiesList');
    const amenities = currentProperty.amenities || [];
    
    if (amenities.length > 0) {
        amenitiesList.innerHTML = amenities.map(amenity => `
            <div class="amenity-item">
                <div class="amenity-icon">
                    <i class="fas fa-check"></i>
                </div>
                <span class="amenity-name">${amenity}</span>
            </div>
        `).join('');
    } else {
        amenitiesList.innerHTML = `
            <div class="empty-state">
                <p>No amenities listed for this property</p>
            </div>
        `;
    }
    
    // Update save button if user is logged in
    if (userData && userData.loggedIn && userData.userType === 'tenant') {
        checkIfPropertyIsSaved();
    }
    
    // Initialize map after property is loaded
    setTimeout(initializeMap, 1000);
}

// Initialize Google Maps
function initMap() {
    // This function is called by Google Maps API
    if (currentProperty) {
        initializeMap();
    }
}

function initializeMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;
    
    // Use a default location if no specific coordinates
    const defaultLocation = { lat: 5.6037, lng: -0.1870 }; // Accra coordinates
    
    map = new google.maps.Map(mapElement, {
        center: defaultLocation,
        zoom: 14,
        styles: [
            {
                featureType: "all",
                elementType: "labels.text.fill",
                stylers: [{ color: "#7c93a3" }]
            },
            {
                featureType: "all",
                elementType: "labels.text.stroke",
                stylers: [{ visibility: "on" }, { color: "#ffffff" }, { weight: 2 }]
            }
        ]
    });
    
    // Add marker
    new google.maps.Marker({
        position: defaultLocation,
        map: map,
        title: currentProperty?.title || 'Property Location',
        icon: {
            url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
        }
    });
    
    // Try to geocode the address if available
    if (currentProperty?.location) {
        geocodeAddress(currentProperty.location + ', ' + currentProperty.city);
    }
}

// Geocode address to get coordinates
function geocodeAddress(address) {
    if (!window.google || !window.google.maps) return;
    
    const geocoder = new google.maps.Geocoder();
    
    geocoder.geocode({ address: address }, (results, status) => {
        if (status === 'OK' && results[0]) {
            map.setCenter(results[0].geometry.location);
            
            // Update marker
            new google.maps.Marker({
                map: map,
                position: results[0].geometry.location,
                title: currentProperty.title
            });
        }
    });
}

// Initialize image gallery
function initializeGallery() {
    if (currentImages.length === 0) {
        currentImages = ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'];
    }
    
    displayMainImage();
    displayThumbnails();
}

// Display main image
function displayMainImage() {
    const mainImage = document.getElementById('mainImage');
    if (currentImages[currentImageIndex]) {
        mainImage.src = currentImages[currentImageIndex];
        mainImage.alt = currentProperty.title;
    }
}

// Display thumbnails
function displayThumbnails() {
    const container = document.getElementById('thumbnailContainer');
    container.innerHTML = '';
    
    currentImages.forEach((image, index) => {
        const thumbnail = document.createElement('img');
        thumbnail.src = image;
        thumbnail.alt = `Property image ${index + 1}`;
        thumbnail.className = index === currentImageIndex ? 'thumbnail active' : 'thumbnail';
        thumbnail.onclick = () => {
            currentImageIndex = index;
            displayMainImage();
            updateThumbnailSelection();
        };
        container.appendChild(thumbnail);
    });
}

// Update thumbnail selection
function updateThumbnailSelection() {
    const thumbnails = document.querySelectorAll('.thumbnail');
    thumbnails.forEach((thumb, index) => {
        thumb.className = index === currentImageIndex ? 'thumbnail active' : 'thumbnail';
    });
}

// Gallery navigation
function prevImage() {
    currentImageIndex = currentImageIndex > 0 ? currentImageIndex - 1 : currentImages.length - 1;
    displayMainImage();
    updateThumbnailSelection();
}

function nextImage() {
    currentImageIndex = currentImageIndex < currentImages.length - 1 ? currentImageIndex + 1 : 0;
    displayMainImage();
    updateThumbnailSelection();
}

// Check if property is already saved by the user
async function checkIfPropertyIsSaved() {
    if (!userData || !userData.userId) return;
    
    try {
        const response = await fetch(`http://localhost:8000/api/saved-properties/${userData.userId}`);
        const data = await response.json();
        
        if (data.success) {
            const isSaved = data.savedProperties.some(saved => saved.propertyId._id === currentProperty._id);
            updateSaveButton(isSaved);
        }
    } catch (error) {
        console.error('Error checking saved status:', error);
    }
}

// Update save button based on saved status
function updateSaveButton(isSaved) {
    const saveBtn = document.getElementById('saveBtn');
    if (isSaved) {
        saveBtn.innerHTML = '<i class="fas fa-heart"></i> Saved';
        saveBtn.classList.remove('btn-secondary');
        saveBtn.classList.add('btn-primary');
        saveBtn.onclick = () => removeSavedProperty();
    } else {
        saveBtn.innerHTML = '<i class="far fa-heart"></i> Save Property';
        saveBtn.classList.remove('btn-primary');
        saveBtn.classList.add('btn-secondary');
        saveBtn.onclick = () => saveProperty();
    }
}

// Save property to user's saved list
async function saveProperty() {
    if (!userData || !userData.loggedIn) {
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userData.userId,
                propertyId: currentProperty._id
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Property saved successfully!');
            updateSaveButton(true);
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error saving property:', error);
        alert('Error saving property. Please try again.');
    }
}

// Remove property from saved list
async function removeSavedProperty() {
    if (!confirm('Remove this property from your saved list?')) return;
    
    try {
        const response = await fetch(`http://localhost:8000/api/saved-properties/${userData.userId}/${currentProperty._id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Property removed from saved list');
            updateSaveButton(false);
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error removing property:', error);
        alert('Error removing property');
    }
}

// Apply for property
function applyForProperty() {
    if (!currentProperty.isAvailable) {
        alert('This property is currently not available for rent.');
        return;
    }
    
    if (!userData || !userData.loggedIn) {
        alert('Please login to apply for this property!');
        window.location.href = 'login.html';
        return;
    }
    
    if (userData.userType !== 'tenant') {
        alert('Only tenants can apply for properties!');
        return;
    }
    
    // Check if user already applied
    checkExistingApplication();
}

// Check if user already applied for this property
async function checkExistingApplication() {
    try {
        const response = await fetch(`http://localhost:8000/api/applications/tenant/${userData.userId}`);
        const data = await response.json();
        
        if (data.success) {
            const existingApp = data.applications.find(app => 
                app.propertyId._id === currentProperty._id && 
                app.status === 'pending'
            );
            
            if (existingApp) {
                if (confirm('You already have a pending application for this property. View your application?')) {
                    window.location.href = `tenant-dashboard.html?section=applications`;
                }
                return;
            }
            
            // Redirect to application form
            window.location.href = `tenant-dashboard.html?apply=${currentProperty._id}`;
        }
    } catch (error) {
        console.error('Error checking applications:', error);
        // Still redirect to dashboard
        window.location.href = `tenant-dashboard.html?apply=${currentProperty._id}`;
    }
}

// Contact landlord
function contactLandlord() {
    if (!userData || !userData.loggedIn) {
        alert('Please login to contact the landlord!');
        window.location.href = 'login.html';
        return;
    }
    
    // Create a simple contact form modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    `;
    
    modal.innerHTML = `
        <div class="modal-content" style="background: white; padding: 2rem; border-radius: 12px; max-width: 500px; width: 90%;">
            <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h3 style="margin: 0; color: #333;">Contact Landlord</h3>
                <button onclick="this.closest('.modal-overlay').remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666;">&times;</button>
            </div>
            <form id="contactForm">
                <div class="form-group" style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; color: #555;">Subject</label>
                    <input type="text" value="Inquiry about ${currentProperty.title}" style="width: 100%; padding: 0.75rem; border: 2px solid #e0e0e0; border-radius: 6px;" required>
                </div>
                <div class="form-group" style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; color: #555;">Message</label>
                    <textarea rows="5" placeholder="Write your message here..." style="width: 100%; padding: 0.75rem; border: 2px solid #e0e0e0; border-radius: 6px; resize: vertical;" required></textarea>
                </div>
                <div style="display: flex; gap: 1rem;">
                    <button type="button" onclick="this.closest('.modal-overlay').remove()" style="flex: 1; padding: 0.75rem; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer;">Cancel</button>
                    <button type="submit" style="flex: 1; padding: 0.75rem; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">Send Message</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle form submission
    modal.querySelector('#contactForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // In a real app, you would send this to your backend
        alert('Message feature will be available soon!');
        modal.remove();
    });
}

// Share property
function shareProperty() {
    const shareUrl = window.location.href;
    const shareText = `Check out this property on RentGhana: ${currentProperty.title}`;
    
    if (navigator.share) {
        navigator.share({
            title: currentProperty.title,
            text: shareText,
            url: shareUrl
        });
    } else {
        // Fallback: Copy to clipboard
        navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
            .then(() => alert('Link copied to clipboard!'))
            .catch(() => prompt('Copy this link:', shareUrl));
    }
}

// Load similar properties
async function loadSimilarProperties() {
    try {
        const response = await fetch('http://localhost:8000/api/properties');
        const data = await response.json();
        
        if (data.success) {
            // Filter similar properties (same city, different property)
            const similar = data.properties.filter(p => 
                p._id !== currentProperty._id && 
                p.city === currentProperty.city
            ).slice(0, 3); // Show max 3
            
            if (similar.length > 0) {
                displaySimilarProperties(similar);
            }
        }
    } catch (error) {
        console.error('Error loading similar properties:', error);
    }
}

// Display similar properties
function displaySimilarProperties(properties) {
    const container = document.getElementById('similarList');
    const section = document.getElementById('similarProperties');
    
    container.innerHTML = properties.map(prop => `
        <a href="property-details.html?id=${prop._id}" class="similar-property">
            <img src="${prop.images[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=200'}" alt="${prop.title}">
            <div>
                <h4>${prop.title}</h4>
                <p>GH₵ ${prop.price.toLocaleString()}/month</p>
                <p>${prop.bedrooms} bed • ${prop.bathrooms} bath</p>
            </div>
        </a>
    `).join('');
    
    section.style.display = 'block';
}

// Show error message
function showError(message) {
    const loading = document.getElementById('loading');
    loading.innerHTML = `
        <h3 style="color: #e74c3c;">Error</h3>
        <p>${message}</p>
        <a href="index.html" style="display: inline-block; margin-top: 1rem; padding: 0.75rem 1.5rem; background: #667eea; color: white; text-decoration: none; border-radius: 6px;">
            Back to Properties
        </a>
    `;
}

// Update the index.html "View Details" button to link to property details page
// In your RentGhana.js, update the viewProperty function:
function viewProperty(id) {
    window.location.href = `property-details.html?id=${id}`;
}