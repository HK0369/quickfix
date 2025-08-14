// Profile page logic (classic script, no ES module imports)

const API_BASE = 'http://localhost:8002/api/providers/profile';

function getAuthToken() {
    // Support both keys to be safe
    return (
        localStorage.getItem('providerToken') ||
        sessionStorage.getItem('providerToken') ||
        localStorage.getItem('authToken') ||
        sessionStorage.getItem('authToken')
    );
}

async function apiCall(url, method = 'GET', data = null) {
    const token = getAuthToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = { method, headers };
    if (data && method !== 'GET') options.body = JSON.stringify(data);

    const resp = await fetch(url, options);
    const json = await resp.json().catch(() => ({}));
    if (!resp.ok) {
        throw new Error(json.message || 'Request failed');
    }
    return json;
}

document.addEventListener('DOMContentLoaded', () => {
    const token = getAuthToken();
    const providerName = localStorage.getItem('providerName');

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
            localStorage.removeItem('providerToken');
            sessionStorage.removeItem('providerToken');
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('authToken');
            localStorage.removeItem('providerName');
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
        const details = await apiCall(`${API_BASE}/details`, 'GET');
        if (details && details.success && details.details) {
            displayProfileData(details.details);
        } else {
            // No data yet; show blank editable form if needed
            displayProfileData({});
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        if (typeof showToast === 'function') showToast('Failed to load profile', true);
    }
}

function toTitleCase(text) {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function displayProfileData(provider) {
    // Update profile header
    document.getElementById('provider-name').textContent = provider.business_name || 'Set your business name';
    const typeText = toTitleCase(provider.provider_type || '');
    const typeTextEl = document.getElementById('provider-type-text');
    if (typeTextEl) typeTextEl.textContent = typeText || 'Select service type';

    // Update form fields
    document.getElementById('business-name').value = provider.business_name || '';
    const typeSelect = document.getElementById('provider-type-select');
    if (typeSelect) typeSelect.value = provider.provider_type || '';
    document.getElementById('phone').value = provider.phone || '';
    document.getElementById('address').value = provider.address || '';
    document.getElementById('services').value = provider.services || '';
    document.getElementById('working-hours').value = provider.working_hours || '';

    // Dates (not provided by backend currently)
    const createdAt = provider.created_at ? new Date(provider.created_at).toLocaleString() : 'Not available';
    const updatedAt = provider.updated_at ? new Date(provider.updated_at).toLocaleString() : 'Not updated';
    const createdAtEl = document.getElementById('created-at');
    const updatedAtEl = document.getElementById('last-updated');
    if (createdAtEl) createdAtEl.value = createdAt;
    if (updatedAtEl) updatedAtEl.value = updatedAt;

    // Store original values for cancel functionality
    window.originalProfileData = {
        business_name: provider.business_name || '',
        provider_type: provider.provider_type || '',
        phone: provider.phone || '',
        address: provider.address || '',
        services: provider.services || '',
        working_hours: provider.working_hours || ''
    };
}

function setupFormListeners() {
    const editBtn = document.getElementById('edit-btn');
    const saveBtn = document.getElementById('save-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const profileForm = document.getElementById('profile-form');

    if (editBtn) {
        editBtn.addEventListener('click', () => enableEditing());
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => cancelEditing());
    }
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveProfile();
        });
    }
}

function enableEditing() {
    const businessNameInput = document.getElementById('business-name');
    const providerTypeSelect = document.getElementById('provider-type-select');
    const phoneInput = document.getElementById('phone');
    const addressInput = document.getElementById('address');
    const servicesInput = document.getElementById('services');
    const workingHoursInput = document.getElementById('working-hours');
    const editBtn = document.getElementById('edit-btn');
    const saveBtn = document.getElementById('save-btn');
    const cancelBtn = document.getElementById('cancel-btn');

    // Enable form inputs
    [businessNameInput, phoneInput, addressInput, servicesInput, workingHoursInput].forEach((el) => {
        if (!el) return;
        el.removeAttribute('readonly');
        el.style.backgroundColor = 'white';
    });
    if (providerTypeSelect) {
        providerTypeSelect.disabled = false;
        providerTypeSelect.style.backgroundColor = 'white';
    }

    // Show/hide buttons
    if (editBtn) editBtn.style.display = 'none';
    if (saveBtn) saveBtn.style.display = 'inline-flex';
    if (cancelBtn) cancelBtn.style.display = 'inline-flex';

    if (businessNameInput) businessNameInput.focus();
}

function cancelEditing() {
    const businessNameInput = document.getElementById('business-name');
    const providerTypeSelect = document.getElementById('provider-type-select');
    const phoneInput = document.getElementById('phone');
    const addressInput = document.getElementById('address');
    const servicesInput = document.getElementById('services');
    const workingHoursInput = document.getElementById('working-hours');
    const editBtn = document.getElementById('edit-btn');
    const saveBtn = document.getElementById('save-btn');
    const cancelBtn = document.getElementById('cancel-btn');

    // Restore original values
    if (window.originalProfileData) {
        if (businessNameInput) businessNameInput.value = window.originalProfileData.business_name;
        if (providerTypeSelect) providerTypeSelect.value = window.originalProfileData.provider_type;
        if (phoneInput) phoneInput.value = window.originalProfileData.phone;
        if (addressInput) addressInput.value = window.originalProfileData.address;
        if (servicesInput) servicesInput.value = window.originalProfileData.services;
        if (workingHoursInput) workingHoursInput.value = window.originalProfileData.working_hours;
    }

    // Disable form inputs
    [businessNameInput, phoneInput, addressInput, servicesInput, workingHoursInput].forEach((el) => {
        if (!el) return;
        el.setAttribute('readonly', true);
        el.style.backgroundColor = '#f8f9fa';
    });
    if (providerTypeSelect) {
        providerTypeSelect.disabled = true;
        providerTypeSelect.style.backgroundColor = '#f8f9fa';
    }

    // Show/hide buttons
    if (editBtn) editBtn.style.display = 'inline-flex';
    if (saveBtn) saveBtn.style.display = 'none';
    if (cancelBtn) cancelBtn.style.display = 'none';
}

async function saveProfile() {
    try {
        const businessNameInput = document.getElementById('business-name');
        const providerTypeSelect = document.getElementById('provider-type-select');
        const phoneInput = document.getElementById('phone');
        const addressInput = document.getElementById('address');
        const servicesInput = document.getElementById('services');
        const workingHoursInput = document.getElementById('working-hours');

        const profileData = {
            business_name: businessNameInput.value.trim(),
            provider_type: providerTypeSelect.value.trim(),
            phone: phoneInput.value.trim(),
            address: addressInput.value.trim(),
            services: servicesInput.value.trim(),
            working_hours: workingHoursInput.value.trim()
        };

        // Validate data
        if (!profileData.business_name || !profileData.provider_type || !profileData.phone || !profileData.address) {
            if (typeof showToast === 'function') showToast('Please fill in all required fields.', true);
            return;
        }

        const result = await apiCall(`${API_BASE}/details`, 'POST', profileData);

        if (result && result.success) {
            if (typeof showToast === 'function') showToast('Profile updated successfully!');

            // Update localStorage name
            localStorage.setItem('providerName', profileData.business_name);

            // Update welcome message
            const welcomeMessage = document.getElementById('welcome-message');
            if (welcomeMessage) welcomeMessage.textContent = `Welcome, ${profileData.business_name}!`;

            // Update profile header
            document.getElementById('provider-name').textContent = profileData.business_name;
            const typeTextEl = document.getElementById('provider-type-text');
            if (typeTextEl) typeTextEl.textContent = toTitleCase(profileData.provider_type);

            // Store new original values
            window.originalProfileData = { ...profileData };

            // Disable editing
            cancelEditing();
        } else {
            if (typeof showToast === 'function') showToast('Failed to update profile', true);
        }
    } catch (error) {
        console.error('Error saving profile:', error);
        if (typeof showToast === 'function') showToast('Network error. Please try again.', true);
    }
}