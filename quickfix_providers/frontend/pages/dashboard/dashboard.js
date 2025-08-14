// Dashboard Map and Form Functionality
let map = L.map('provider-map').setView([20.5937, 78.9629], 5); // Default: India
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '© OpenStreetMap'
}).addTo(map);

let providerMarker = null;
let isSettingLocation = false;
let selectedLatLng = null;
let savedLatLng = null;
let providerData = null;

// Get authentication token
function getAuthToken() {
    const token = localStorage.getItem('providerToken') || sessionStorage.getItem('providerToken');
    console.log('Retrieved token:', token ? 'Token exists' : 'No token found');
    return token;
}

// Get provider ID from token
function getProviderId() {
    const token = getAuthToken();
    if (!token) return null;

    try {
        // Decode JWT token to get provider_id
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.provider_id;
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
}

// API call helper
async function apiCall(url, method = 'GET', data = null) {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json'
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
        method,
        headers
    };

    if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'API call failed');
        }

        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Load provider profile data
async function loadProviderProfile() {
    try {
        // First, try to get location data
        const locationResult = await apiCall('http://localhost:8002/api/providers/profile/location');

        if (locationResult.success && locationResult.location) {
            savedLatLng = locationResult.location;
            setProviderMarker(savedLatLng.lat, savedLatLng.lng);
            map.setView([savedLatLng.lat, savedLatLng.lng], 15);
            document.getElementById('set-location-btn').style.display = 'none';
            document.getElementById('edit-location-btn').style.display = 'inline-block';
            document.getElementById('map-status').textContent = 'Your business location is set.';
        } else {
            document.getElementById('set-location-btn').style.display = 'inline-block';
            document.getElementById('edit-location-btn').style.display = 'none';
            document.getElementById('map-status').textContent = '';
        }

        // Then, try to get business details
        const detailsResult = await apiCall('http://localhost:8002/api/providers/profile/details');

        if (detailsResult.success && detailsResult.details) {
            providerData = detailsResult.details;

            // Fill the form with existing data
            document.getElementById('business-name').value = providerData.business_name || '';
            document.getElementById('provider-type').value = providerData.provider_type || '';
            document.getElementById('phone').value = providerData.phone || '';
            document.getElementById('address').value = providerData.address || '';
            document.getElementById('services').value = providerData.services || '';
            document.getElementById('working-hours').value = providerData.working_hours || '';

            // Show the form with existing data
            document.getElementById('provider-details-form').style.display = 'block';

            // Update display
            if (providerData.business_name) {
                document.getElementById('provider-details').innerHTML =
                    `<strong>Business Name:</strong> <span id="business-name-display">${providerData.business_name}</span><br>` +
                    `<strong>Address:</strong> <span id="business-address-display">${providerData.address || 'Not set'}</span>`;
            }

            // Set form to read-only initially
            setFormReadOnly(true);

            console.log('Provider profile loaded successfully:', providerData);
        } else {
            console.log('No existing profile data found');
            // Show form for new provider setup
            document.getElementById('provider-details-form').style.display = 'block';
            setFormReadOnly(false);
        }
    } catch (error) {
        console.error('Error loading provider profile:', error);
        // Show form for new provider setup on error
        document.getElementById('provider-details-form').style.display = 'block';
        setFormReadOnly(false);
        document.getElementById('set-location-btn').style.display = 'inline-block';
        document.getElementById('edit-location-btn').style.display = 'none';
        document.getElementById('map-status').textContent = '';
    }
}

function setProviderMarker(lat, lng) {
    if (providerMarker) map.removeLayer(providerMarker);
    providerMarker = L.marker([lat, lng]).addTo(map).bindPopup('Your Business Location').openPopup();
}

// Set Location Button
document.getElementById('set-location-btn').onclick = function () {
    isSettingLocation = true;
    document.getElementById('map-status').textContent = 'Click on the map to set your business location.';
    map.getContainer().style.cursor = 'crosshair';
    document.getElementById('confirm-location-btn').style.display = 'none';
    document.getElementById('provider-details').innerHTML = '';
};

// Edit Location Button
document.getElementById('edit-location-btn').onclick = function () {
    isSettingLocation = true;
    document.getElementById('map-status').textContent = 'Click on the map to change your business location.';
    map.getContainer().style.cursor = 'crosshair';
    document.getElementById('confirm-location-btn').style.display = 'none';
};

// Map Click Handler
map.on('click', function (e) {
    if (!isSettingLocation) return;
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    selectedLatLng = e.latlng;
    setProviderMarker(lat, lng);
    map.setView([lat, lng], 15);
    document.getElementById('map-status').textContent = 'Location selected. Click Confirm Location to save.';
    document.getElementById('confirm-location-btn').style.display = 'inline-block';
    map.getContainer().style.cursor = '';
    isSettingLocation = false;
});

// Confirm Location Button
document.getElementById('confirm-location-btn').onclick = async function () {
    if (!selectedLatLng) return;
    document.getElementById('map-status').textContent = 'Fetching address...';

    // Reverse geocode using Nominatim
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${selectedLatLng.lat}&lon=${selectedLatLng.lng}&accept-language=en`;
    let address = '';
    try {
        const res = await fetch(url);
        const data = await res.json();
        address = data.display_name || `${selectedLatLng.lat.toFixed(5)}, ${selectedLatLng.lng.toFixed(5)}`;
    } catch {
        address = `${selectedLatLng.lat.toFixed(5)}, ${selectedLatLng.lng.toFixed(5)}`;
    }

    document.getElementById('map-status').textContent = 'Saving location...';

    try {
        // Update the address field in the form
        document.getElementById('address').value = address;

        // Create location data
        const locationData = {
            lat: selectedLatLng.lat,
            lng: selectedLatLng.lng,
            address: address
        };

        // Save location to backend
        await apiCall('http://localhost:8002/api/providers/profile/location', 'POST', locationData);

        // Update the display
        if (providerData && providerData.business_name) {
            document.getElementById('business-address-display').textContent = address;
        }

        savedLatLng = locationData;

        document.getElementById('set-location-btn').style.display = 'none';
        document.getElementById('edit-location-btn').style.display = 'inline-block';
        document.getElementById('confirm-location-btn').style.display = 'none';
        document.getElementById('map-status').textContent = 'Location saved!';

        // Show business name and address
        if (providerData && providerData.business_name) {
            document.getElementById('provider-details').innerHTML =
                `<strong>Business Name:</strong> <span id="business-name-display">${providerData.business_name}</span><br>` +
                `<strong>Address:</strong> <span id="business-address-display">${address}</span>`;
        }

        if (typeof showToast === 'function') showToast('Location saved successfully!');

    } catch (error) {
        document.getElementById('map-status').textContent = 'Error saving location. Please try again.';
        if (typeof showToast === 'function') showToast('Error saving location');
        console.error('Error saving location:', error);
    }
};

function setFormReadOnly(readOnly) {
    const inputs = document.querySelectorAll('#provider-details-form input, #provider-details-form select, #provider-details-form textarea');
    inputs.forEach(input => {
        input.readOnly = readOnly;
        input.disabled = readOnly;
    });

    if (readOnly) {
        document.getElementById('edit-details-btn').style.display = 'inline-block';
        document.getElementById('save-details-btn').style.display = 'none';
    } else {
        document.getElementById('edit-details-btn').style.display = 'none';
        document.getElementById('save-details-btn').style.display = 'inline-block';
    }
}

// Edit button functionality
document.getElementById('edit-details-btn').onclick = function () {
    setFormReadOnly(false);
    if (typeof showToast === 'function') showToast('Edit mode enabled');
};

// Form submission
document.getElementById('provider-details-form').onsubmit = async function (e) {
    e.preventDefault();

    // Collect form data
    const formData = {
        business_name: document.getElementById('business-name').value,
        provider_type: document.getElementById('provider-type').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        services: document.getElementById('services').value,
        working_hours: document.getElementById('working-hours').value
    };

    try {
        // Save to backend
        await apiCall('http://localhost:8002/api/providers/profile/details', 'POST', formData);

        providerData = formData;
        setFormReadOnly(true);

        // Update display
        if (document.getElementById('business-name-display')) {
            document.getElementById('business-name-display').textContent = formData.business_name;
        }
        if (document.getElementById('business-address-display')) {
            document.getElementById('business-address-display').textContent = formData.address;
        }

        if (typeof showToast === 'function') showToast('Profile updated successfully!');

    } catch (error) {
        console.error('Error saving details:', error);
        if (typeof showToast === 'function') showToast('Error saving details. Please try again.');
    }
};

// Logout functionality
document.getElementById('logout-btn').onclick = function () {
    // Clear any stored tokens/session data
    localStorage.removeItem('providerToken');
    sessionStorage.removeItem('providerToken');

    // Show logout message
    if (typeof showToast === 'function') {
        showToast('Logged out successfully!');
    }

    // Redirect to index page after a short delay
    setTimeout(() => {
        window.location.href = '../../index.html';
    }, 1000);
};

// Initialize on page load
window.addEventListener('DOMContentLoaded', function () {
    // Load provider profile data first
    loadProviderProfile();
});
