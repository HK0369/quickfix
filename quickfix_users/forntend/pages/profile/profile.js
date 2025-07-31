import { showToast } from '../../js/toast.js';

const API_URL = 'http://localhost:8001/api';

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    const userName = localStorage.getItem('userName');
    const userEmail = localStorage.getItem('userEmail');
    const userId = localStorage.getItem('userId');

    if (!token) {
        window.location.href = '../auth/login.html';
        return;
    }

    // Update welcome message
    const welcomeMessage = document.getElementById('welcome-message');
    if (welcomeMessage && userName) {
        welcomeMessage.textContent = `Welcome, ${userName}!`;
    }

    // Logout functionality
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userName');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userId');
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
        const userId = localStorage.getItem('userId');
        if (!userId) {
            showToast('User ID not found. Please log in again.', true);
            return;
        }

        const response = await fetch(`${API_URL}/auth/profile?user_id=${userId}`);
        const data = await response.json();

        if (data.success) {
            displayProfileData(data.user);
        } else {
            showToast(data.error || 'Failed to load profile', true);
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showToast('Network error. Please try again.', true);
    }
}

function displayProfileData(user) {
    // Update profile header
    document.getElementById('user-name').textContent = user.name;
    document.getElementById('user-email').textContent = user.email;

    // Update form fields
    document.getElementById('name').value = user.name;
    document.getElementById('email').value = user.email;

    // Format and display dates
    const createdAt = user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }) : 'Not available';

    const updatedAt = user.updated_at ? new Date(user.updated_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }) : 'Not updated';

    document.getElementById('created-at').value = createdAt;
    document.getElementById('last-updated').value = updatedAt;

    // Store original values for cancel functionality
    window.originalProfileData = {
        name: user.name,
        email: user.email
    };
}

function setupFormListeners() {
    const editBtn = document.getElementById('edit-btn');
    const saveBtn = document.getElementById('save-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const profileForm = document.getElementById('profile-form');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');

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
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const editBtn = document.getElementById('edit-btn');
    const saveBtn = document.getElementById('save-btn');
    const cancelBtn = document.getElementById('cancel-btn');

    // Enable form inputs
    nameInput.removeAttribute('readonly');
    emailInput.removeAttribute('readonly');
    nameInput.style.backgroundColor = 'white';
    emailInput.style.backgroundColor = 'white';

    // Show/hide buttons
    editBtn.style.display = 'none';
    saveBtn.style.display = 'inline-flex';
    cancelBtn.style.display = 'inline-flex';

    // Focus on name input
    nameInput.focus();
}

function cancelEditing() {
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const editBtn = document.getElementById('edit-btn');
    const saveBtn = document.getElementById('save-btn');
    const cancelBtn = document.getElementById('cancel-btn');

    // Restore original values
    if (window.originalProfileData) {
        nameInput.value = window.originalProfileData.name;
        emailInput.value = window.originalProfileData.email;
    }

    // Disable form inputs
    nameInput.setAttribute('readonly', true);
    emailInput.setAttribute('readonly', true);
    nameInput.style.backgroundColor = '#f8f9fa';
    emailInput.style.backgroundColor = '#f8f9fa';

    // Show/hide buttons
    editBtn.style.display = 'inline-flex';
    saveBtn.style.display = 'none';
    cancelBtn.style.display = 'none';
}

async function saveProfile() {
    try {
        const userId = localStorage.getItem('userId');
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');

        const profileData = {
            user_id: userId,
            name: nameInput.value.trim(),
            email: emailInput.value.trim()
        };

        // Validate data
        if (!profileData.name || !profileData.email) {
            showToast('Please fill in all required fields.', true);
            return;
        }

        const response = await fetch(`${API_URL}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(profileData)
        });

        const data = await response.json();

        if (data.success) {
            showToast('Profile updated successfully!', false);

            // Update localStorage
            localStorage.setItem('userName', profileData.name);
            localStorage.setItem('userEmail', profileData.email);

            // Update welcome message
            const welcomeMessage = document.getElementById('welcome-message');
            if (welcomeMessage) {
                welcomeMessage.textContent = `Welcome, ${profileData.name}!`;
            }

            // Update profile header
            document.getElementById('user-name').textContent = profileData.name;
            document.getElementById('user-email').textContent = profileData.email;

            // Store new original values
            window.originalProfileData = {
                name: profileData.name,
                email: profileData.email
            };

            // Disable editing
            cancelEditing();
        } else {
            showToast(data.error || 'Failed to update profile', true);
        }
    } catch (error) {
        console.error('Error saving profile:', error);
        showToast('Network error. Please try again.', true);
    }
} 