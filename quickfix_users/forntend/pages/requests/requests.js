import { showToast } from '../../js/toast.js';

const API_URL = 'http://localhost:8001/api';

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    const userName = localStorage.getItem('userName');
    const userEmail = localStorage.getItem('userEmail');

    // Debug: Log all localStorage values
    console.log('DEBUG - localStorage values:');
    console.log('authToken:', token);
    console.log('userName:', userName);
    console.log('userEmail:', userEmail);

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
            window.location.href = '../auth/login.html';
        });
    }

    // Load requests
    loadUserRequests();

    // Setup filter event listeners
    setupFilters();
});

async function loadUserRequests() {
    const loadingSpinner = document.getElementById('loading-spinner');
    const noRequests = document.getElementById('no-requests');
    const requestsList = document.getElementById('requests-list');
    const userEmail = localStorage.getItem('userEmail');
    const authToken = localStorage.getItem('authToken');

    // Debug: Log the user email being used to fetch requests
    console.log('Fetching requests for user email:', userEmail);

    try {
        loadingSpinner.style.display = 'flex';
        noRequests.classList.add('hidden');
        requestsList.innerHTML = '';

        // First try email-based method
        let response = await fetch(`${API_URL}/requests/user-requests?user_email=${userEmail}`);
        let data = await response.json();

        // If no requests found with email, try token-based method
        if (data.success && data.requests.length === 0 && authToken) {
            console.log('No requests found with email, trying token-based method...');
            response = await fetch(`${API_URL}/requests/my-requests`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            data = await response.json();
        }

        if (data.success) {
            const requests = data.requests;

            if (requests.length === 0) {
                loadingSpinner.style.display = 'none';
                noRequests.classList.remove('hidden');
                return;
            }

            // Update stats
            updateStats(requests);

            // Display requests
            displayRequests(requests);

        } else {
            showToast('Failed to load requests', true);
        }
    } catch (error) {
        console.error('Error loading requests:', error);
        showToast('Network error. Please try again.', true);
    } finally {
        loadingSpinner.style.display = 'none';
    }
}

function updateStats(requests) {
    const stats = {
        pending: requests.filter(r => r.status === 'pending').length,
        accepted: requests.filter(r => r.status === 'accepted').length,
        completed: requests.filter(r => r.status === 'completed').length,
        cancelled: requests.filter(r => r.status === 'cancelled').length,
        rejected: requests.filter(r => r.status === 'rejected').length
    };

    document.getElementById('pending-count').textContent = stats.pending;
    document.getElementById('accepted-count').textContent = stats.accepted;
    document.getElementById('completed-count').textContent = stats.completed;
    document.getElementById('cancelled-count').textContent = stats.cancelled + stats.rejected;
}

function displayRequests(requests) {
    const requestsList = document.getElementById('requests-list');

    requests.forEach(request => {
        const requestElement = createRequestElement(request);
        requestsList.appendChild(requestElement);
    });
}

function createRequestElement(request) {
    const requestDiv = document.createElement('div');
    requestDiv.className = 'request-item';
    requestDiv.onclick = () => openRequestModal(request._id);

    const statusClass = request.status;
    const statusText = request.status.charAt(0).toUpperCase() + request.status.slice(1);

    const createdAt = new Date(request.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    requestDiv.innerHTML = `
        <div class="request-header">
            <div>
                <div class="request-title">${request.customer_name}</div>
                <div class="request-service">${request.service_type} Service</div>
            </div>
            <span class="request-status ${statusClass}">${statusText}</span>
        </div>
        <div class="request-details">
            <div class="request-detail">
                <span class="request-detail-label">Vehicle</span>
                <span class="request-detail-value">${request.vehicle_type}${request.vehicle_model ? ' - ' + request.vehicle_model : ''}</span>
            </div>
            <div class="request-detail">
                <span class="request-detail-label">Contact</span>
                <span class="request-detail-value">${request.emergency_contact}</span>
            </div>
            <div class="request-detail">
                <span class="request-detail-label">Urgency</span>
                <span class="request-detail-value">${request.urgency_level}</span>
            </div>
        </div>
        <div class="request-date">Requested on ${createdAt}</div>
    `;

    return requestDiv;
}

function setupFilters() {
    const statusFilter = document.getElementById('status-filter');
    const serviceFilter = document.getElementById('service-filter');

    statusFilter.addEventListener('change', filterRequests);
    serviceFilter.addEventListener('change', filterRequests);
}

function filterRequests() {
    const statusFilter = document.getElementById('status-filter').value;
    const serviceFilter = document.getElementById('service-filter').value;
    const requestItems = document.querySelectorAll('.request-item');

    requestItems.forEach(item => {
        const status = item.querySelector('.request-status').textContent.toLowerCase();
        const service = item.querySelector('.request-service').textContent.toLowerCase();

        const statusMatch = statusFilter === 'all' || status === statusFilter;
        const serviceMatch = serviceFilter === 'all' || service.includes(serviceFilter);

        if (statusMatch && serviceMatch) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

async function openRequestModal(requestId) {
    try {
        const response = await fetch(`${API_URL}/requests/${requestId}`);
        const data = await response.json();

        if (data.success) {
            displayRequestModal(data.request);
        } else {
            showToast('Failed to load request details', true);
        }
    } catch (error) {
        console.error('Error loading request details:', error);
        showToast('Network error. Please try again.', true);
    }
}

function displayRequestModal(request) {
    const modal = document.getElementById('request-modal');
    const modalTitle = document.getElementById('modal-title');
    const requestDetails = document.getElementById('request-details');
    const cancelBtn = document.getElementById('cancel-request-btn');

    modalTitle.textContent = `Request #${request._id.slice(-6)}`;

    const createdAt = new Date(request.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const updatedAt = request.updated_at ? new Date(request.updated_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }) : 'Not updated';

    requestDetails.innerHTML = `
        <div class="request-details-modal">
            <div class="detail-section">
                <h3>Request Information</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">Status</span>
                        <span class="detail-value">${request.status.charAt(0).toUpperCase() + request.status.slice(1)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Service Type</span>
                        <span class="detail-value">${request.service_type.charAt(0).toUpperCase() + request.service_type.slice(1)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Created</span>
                        <span class="detail-value">${createdAt}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Last Updated</span>
                        <span class="detail-value">${updatedAt}</span>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h3>Customer Information</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">Name</span>
                        <span class="detail-value">${request.customer_name}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Contact</span>
                        <span class="detail-value">${request.emergency_contact}</span>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h3>Vehicle Information</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">Vehicle Type</span>
                        <span class="detail-value">${request.vehicle_type}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Vehicle Model</span>
                        <span class="detail-value">${request.vehicle_model || 'Not specified'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Urgency Level</span>
                        <span class="detail-value">${request.urgency_level}</span>
                    </div>
                </div>
            </div>

            ${request.issue_description ? `
            <div class="detail-section">
                <h3>Issue Description</h3>
                <div class="detail-item">
                    <span class="detail-value">${request.issue_description}</span>
                </div>
            </div>
            ` : ''}

            ${request.fuel_type ? `
            <div class="detail-section">
                <h3>Fuel Details</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">Fuel Type</span>
                        <span class="detail-value">${request.fuel_type}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Amount</span>
                        <span class="detail-value">${request.fuel_amount} liters</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Delivery Required</span>
                        <span class="detail-value">${request.delivery_required}</span>
                    </div>
                </div>
            </div>
            ` : ''}

            ${request.destination ? `
            <div class="detail-section">
                <h3>Towing Details</h3>
                <div class="detail-item">
                    <span class="detail-label">Destination</span>
                    <span class="detail-value">${request.destination}</span>
                </div>
            </div>
            ` : ''}

            ${request.service_type_detail ? `
            <div class="detail-section">
                <h3>Service Details</h3>
                <div class="detail-item">
                    <span class="detail-label">Service Type</span>
                    <span class="detail-value">${request.service_type_detail}</span>
                </div>
            </div>
            ` : ''}

            ${request.additional_notes ? `
            <div class="detail-section">
                <h3>Additional Notes</h3>
                <div class="detail-item">
                    <span class="detail-value">${request.additional_notes}</span>
                </div>
            </div>
            ` : ''}

            ${request.rejection_reason ? `
            <div class="detail-section">
                <h3>Rejection Reason</h3>
                <div class="detail-item">
                    <span class="detail-value">${request.rejection_reason}</span>
                </div>
            </div>
            ` : ''}
        </div>
    `;

    // Show/hide cancel button based on status
    if (request.status === 'pending') {
        cancelBtn.style.display = 'block';
        cancelBtn.onclick = () => cancelRequest(request._id);
    } else {
        cancelBtn.style.display = 'none';
    }

    modal.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('request-modal');
    modal.style.display = 'none';
}

async function cancelRequest(requestId) {
    if (!confirm('Are you sure you want to cancel this request?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/requests/${requestId}/cancel`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const data = await response.json();

        if (data.success) {
            showToast('Request cancelled successfully', false);
            closeModal();
            loadUserRequests(); // Reload the list
        } else {
            showToast(data.error || 'Failed to cancel request', true);
        }
    } catch (error) {
        console.error('Error cancelling request:', error);
        showToast('Network error. Please try again.', true);
    }
}

// Close modal when clicking outside
window.onclick = function (event) {
    const modal = document.getElementById('request-modal');
    if (event.target === modal) {
        closeModal();
    }
}

// Make functions global
window.openRequestModal = openRequestModal;
window.closeModal = closeModal;
window.cancelRequest = cancelRequest; 