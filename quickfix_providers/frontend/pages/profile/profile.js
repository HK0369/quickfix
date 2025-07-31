import { showToast } from '../../js/toast.js';

const API_URL = 'http://localhost:8002/api/providers/profile';

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    const providerName = localStorage.getItem('providerName');
    const providerEmail = localStorage.getItem('providerEmail');
    const providerId = localStorage.getItem('providerId');

    console.log('DOMContentLoaded - localStorage values:');
    console.log('authToken:', token);
    console.log('providerName:', providerName);
    console.log('providerEmail:', providerEmail);
    console.log('providerId:', providerId);

    if (!token) {
        window.location.href = '../auth/login.html';
        return;
    }

    // Update welcome message
    const welcomeMessage = document.getElementById('welcome-message');
    if (welcomeMessage && providerName) {
        welcomeMessage.textContent = `Welcome, ${providerName}!`;
    }

    // Logout functionality
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('authToken');
            localStorage.removeItem('providerName');
            localStorage.removeItem('providerEmail');
            localStorage.removeItem('providerId');
            window.location.href = '../auth/login.html';
        });
    }

    // Load profile data
    loadProfileData();

    // Setup form event listeners
    setupFormListeners();
});

async function loadProfileData() {
    try {
        const authToken = localStorage.getItem('authToken');
        console.log('Auth token from localStorage:', authToken ? 'Present' : 'Missing');

        if (!authToken) {
            showToast('Authentication token not found. Please log in again.', true);
            return;
        }

        console.log('Fetching profile from:', `${API_URL}/details`);
        const response = await fetch(`${API_URL}/details`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('Response status:', response.status);

        const data = await response.json();
        console.log('Profile data received:', data);

        if (data.success) {
            displayProfileData(data.details);
        } else {
            showToast(data.message || 'Failed to load profile', true);
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showToast('Network error. Please try again.', true);
    }
}

function displayProfileData(details) {
    // Update profile header
    document.getElementById('provider-name').textContent = details.business_name || 'Not set';
    document.getElementById('provider-email').textContent = localStorage.getItem('providerEmail') || 'Not set';
    document.getElementById('provider-type').textContent = details.provider_type || 'Not set';

    // Update form fields
    document.getElementById('name').value = details.business_name || '';
    document.getElementById('email').value = localStorage.getItem('providerEmail') || '';
    document.getElementById('provider_type').value = details.provider_type || '';
    document.getElementById('phone').value = details.phone || '';
    document.getElementById('address').value = details.address || '';
    document.getElementById('services_provided').value = details.services || '';
    document.getElementById('license_number').value = ''; // Not available in current API
    document.getElementById('working_hours').value = details.working_hours || '';

    // Set default dates since they're not available in the current API
    document.getElementById('created-at').value = 'Not available';
    document.getElementById('last-updated').value = 'Not updated';

    // Store original values for cancel functionality
    window.originalProfileData = {
        name: details.business_name || '',
        email: localStorage.getItem('providerEmail') || '',
        provider_type: details.provider_type || '',
        phone: details.phone || '',
        address: details.address || '',
        services_provided: details.services || '',
        license_number: '',
        working_hours: details.working_hours || ''
    };
}

function setupFormListeners() {
    const editBtn = document.getElementById('edit-btn');
    const saveBtn = document.getElementById('save-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const profileForm = document.getElementById('profile-form');

    // Edit button functionality
    editBtn.addEventListener('click', () => {
        enableEditing();
    });

    // Cancel button functionality
    cancelBtn.addEventListener('click', () => {
        cancelEditing();
    });

    // Save button functionality
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveProfile();
    });
}

function enableEditing() {
    const inputs = document.querySelectorAll('#profile-form input:not([readonly]), #profile-form select');
    const editBtn = document.getElementById('edit-btn');
    const saveBtn = document.getElementById('save-btn');
    const cancelBtn = document.getElementById('cancel-btn');

    // Enable form inputs
    inputs.forEach(input => {
        input.removeAttribute('readonly');
        input.style.backgroundColor = 'white';
    });

    // Show/hide buttons
    editBtn.style.display = 'none';
    saveBtn.style.display = 'inline-flex';
    cancelBtn.style.display = 'inline-flex';

    // Focus on name input
    document.getElementById('name').focus();
}

function cancelEditing() {
    const inputs = document.querySelectorAll('#profile-form input:not([readonly]), #profile-form select');
    const editBtn = document.getElementById('edit-btn');
    const saveBtn = document.getElementById('save-btn');
    const cancelBtn = document.getElementById('cancel-btn');

    // Restore original values
    if (window.originalProfileData) {
        document.getElementById('name').value = window.originalProfileData.name;
        document.getElementById('email').value = window.originalProfileData.email;
        document.getElementById('provider_type').value = window.originalProfileData.provider_type;
        document.getElementById('phone').value = window.originalProfileData.phone;
        document.getElementById('address').value = window.originalProfileData.address;
        document.getElementById('services_provided').value = window.originalProfileData.services_provided;
        document.getElementById('license_number').value = window.originalProfileData.license_number;
        document.getElementById('working_hours').value = window.originalProfileData.working_hours;
    }

    // Disable form inputs
    inputs.forEach(input => {
        if (input.id === 'created-at' || input.id === 'last-updated') {
            input.setAttribute('readonly', true);
            input.style.backgroundColor = '#f8f9fa';
        }
    });

    // Show/hide buttons
    editBtn.style.display = 'inline-flex';
    saveBtn.style.display = 'none';
    cancelBtn.style.display = 'none';
}

async function saveProfile() {
    try {
        const authToken = localStorage.getItem('authToken');
        const formData = new FormData(document.getElementById('profile-form'));

        const profileData = {
            business_name: formData.get('name').trim(),
            provider_type: formData.get('provider_type'),
            phone: formData.get('phone').trim(),
            address: formData.get('address').trim(),
            services: formData.get('services_provided').trim(),
            working_hours: formData.get('working_hours').trim()
        };

        // Validate required fields
        if (!profileData.business_name || !profileData.provider_type || !profileData.phone) {
            showToast('Please fill in all required fields.', true);
            return;
        }

        const response = await fetch(`${API_URL}/details`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(profileData)
        });

        const data = await response.json();

        if (data.success) {
            showToast('Profile updated successfully!', false);

            // Update localStorage
            localStorage.setItem('providerName', profileData.business_name);

            // Update welcome message
            const welcomeMessage = document.getElementById('welcome-message');
            if (welcomeMessage) {
                welcomeMessage.textContent = `Welcome, ${profileData.business_name}!`;
            }

            // Update profile header
            document.getElementById('provider-name').textContent = profileData.business_name;
            document.getElementById('provider-type').textContent = profileData.provider_type;

            // Store new original values
            window.originalProfileData = {
                name: profileData.business_name,
                email: localStorage.getItem('providerEmail') || '',
                provider_type: profileData.provider_type,
                phone: profileData.phone,
                address: profileData.address,
                services_provided: profileData.services,
                license_number: '',
                working_hours: profileData.working_hours
            };

            // Disable editing
            cancelEditing();
        } else {
            showToast(data.message || 'Failed to update profile', true);
        }
    } catch (error) {
        console.error('Error saving profile:', error);
        showToast('Network error. Please try again.', true);
    }
} 