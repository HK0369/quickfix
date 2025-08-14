# QUICKFIX ROADSIDE ASSISTANCE SYSTEM - COMPLETE BACKUP
# Password: red

## SYSTEM OVERVIEW
This is a complete roadside assistance system with:
- User frontend (HTML/CSS/JS) - Port 5500
- Provider frontend (HTML/CSS/JS) - Port 5500  
- User backend (Flask/Python) - Port 8001
- Provider backend (Flask/Python) - Port 8002
- MongoDB database

## BACKEND FILES

### 1. User Backend - quickfix_users/backend/app.py
```python
from flask import Flask
from flask_cors import CORS
from config import mongo
from routes.auth_routes import auth_bp
from routes.request_routes import request_bp
from routes.service_routes import service_bp

app = Flask(__name__)
CORS(app)

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(request_bp, url_prefix='/api/requests')
app.register_blueprint(service_bp, url_prefix='/api/services')

if __name__ == '__main__':
    app.run(debug=True, port=8001)
```

### 2. User Backend - quickfix_users/backend/config.py
```python
from flask_pymongo import PyMongo
from flask import Flask

app = Flask(__name__)
app.config["MONGO_URI"] = "mongodb://localhost:27017/quickfix"
mongo = PyMongo(app)
```

### 3. User Backend - quickfix_users/backend/routes/auth_routes.py
```python
from flask import Blueprint, request, jsonify
from config import mongo
import bcrypt
import jwt
import datetime

auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route('/signup', methods=['POST'])
def signup():
    """User signup"""
    try:
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        
        if not all([name, email, password]):
            return jsonify({"error": "All fields are required"}), 400
        
        # Check if user already exists
        existing_user = mongo.db.users.find_one({"email": email})
        if existing_user:
            return jsonify({"error": "User already exists"}), 400
        
        # Hash password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        # Create user
        user = {
            "name": name,
            "email": email,
            "password": hashed_password,
            "created_at": datetime.datetime.utcnow()
        }
        
        result = mongo.db.users.insert_one(user)
        user['_id'] = str(result.inserted_id)
        
        return jsonify({
            "message": "User created successfully",
            "user": {
                "id": user['_id'],
                "name": user['name'],
                "email": user['email']
            }
        }), 201
        
    except Exception as e:
        print(f"Error in signup: {e}")
        return jsonify({"error": "Failed to create user"}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """User login"""
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not all([email, password]):
            return jsonify({"error": "Email and password are required"}), 400
        
        # Find user
        user = mongo.db.users.find_one({"email": email})
        if not user:
            return jsonify({"error": "Invalid credentials"}), 401
        
        # Check password
        if not bcrypt.checkpw(password.encode('utf-8'), user['password']):
            return jsonify({"error": "Invalid credentials"}), 401
        
        # Generate token
        token = jwt.encode(
            {
                'user_id': str(user['_id']),
                'email': user['email'],
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
            },
            'your-secret-key',
            algorithm='HS256'
        )
        
        return jsonify({
            "message": "Login successful",
            "token": token,
            "user": {
                "_id": str(user['_id']),
                "name": user['name'],
                "email": user['email']
            }
        }), 200
        
    except Exception as e:
        print(f"Error in login: {e}")
        return jsonify({"error": "Failed to login"}), 500
```

### 4. User Backend - quickfix_users/backend/routes/request_routes.py
```python
from flask import Blueprint, request, jsonify
from config import mongo
import datetime
from bson.objectid import ObjectId

request_bp = Blueprint('request_bp', __name__)

@request_bp.route('/send', methods=['POST'])
def send_service_request():
    """Send a service request to a provider"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['service_type', 'customer_name', 'emergency_contact', 'vehicle_type']
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"{field} is required"}), 400
        
        # Create request object
        request_data = {
            "customer_name": data['customer_name'],
            "emergency_contact": data['emergency_contact'],
            "service_type": data['service_type'],
            "vehicle_type": data['vehicle_type'],
            "vehicle_model": data.get('vehicle_model', ''),
            "urgency_level": data.get('urgency_level', 'normal'),
            "issue_description": data.get('issue_description', ''),
            "fuel_type": data.get('fuel_type', ''),
            "fuel_amount": data.get('fuel_amount', ''),
            "delivery_required": data.get('delivery_required', ''),
            "destination": data.get('destination', ''),
            "service_type_detail": data.get('service_type_detail', ''),
            "additional_notes": data.get('additional_notes', ''),
            "user_email": data.get('user_email', ''),
            "provider_id": data.get('provider_id'),
            "status": "pending",
            "created_at": datetime.datetime.utcnow(),
            "updated_at": datetime.datetime.utcnow()
        }
        
        # Save to database
        result = mongo.db.service_requests.insert_one(request_data)
        request_data['_id'] = str(result.inserted_id)
        
        return jsonify({
            "success": True,
            "message": "Service request sent successfully",
            "request": request_data
        }), 201
        
    except Exception as e:
        print(f"Error sending service request: {e}")
        return jsonify({"error": "Failed to send service request"}), 500

@request_bp.route('/user-requests', methods=['GET'])
def get_user_requests():
    """Get all requests for a specific user"""
    try:
        user_email = request.args.get('user_email')
        
        if not user_email:
            return jsonify({"error": "User email is required"}), 400
        
        # Find requests for this user
        requests = list(mongo.db.service_requests.find({"user_email": user_email}))
        
        # Convert ObjectId to string for JSON serialization
        for req in requests:
            req['_id'] = str(req['_id'])
            if req.get('provider_id'):
                req['provider_id'] = str(req['provider_id'])
        
        # Sort by creation date (newest first)
        requests.sort(key=lambda x: x['created_at'], reverse=True)
        
        return jsonify({
            "success": True,
            "requests": requests
        }), 200
        
    except Exception as e:
        print(f"Error fetching user requests: {e}")
        return jsonify({"error": "Failed to fetch user requests"}), 500
```

### 5. Provider Backend - quickfix_providers/backend/app.py
```python
from flask import Flask
from flask_cors import CORS
from config import mongo
from routes.auth_routes import auth_bp
from routes.profile_routes import profile_bp
from routes.request_routes import request_bp
from routes.service_routes import service_bp

app = Flask(__name__)
CORS(app)

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/providers/auth')
app.register_blueprint(profile_bp, url_prefix='/api/providers/profile')
app.register_blueprint(request_bp, url_prefix='/api/providers/requests')
app.register_blueprint(service_bp, url_prefix='/api/providers/services')

if __name__ == '__main__':
    app.run(debug=True, port=8002)
```

### 6. Provider Backend - quickfix_providers/backend/routes/request_routes.py
```python
from flask import Blueprint, request, jsonify
from config import mongo
import datetime
from bson.objectid import ObjectId

request_bp = Blueprint('request_bp', __name__)

@request_bp.route('/pending-requests', methods=['GET'])
def get_pending_requests():
    """Get all pending requests that don't have a provider assigned yet"""
    try:
        # Find requests that are pending and don't have a provider_id assigned
        requests = list(mongo.db.service_requests.find({
            "status": "pending",
            "provider_id": {"$in": [None, ""]}  # No provider assigned yet
        }))
        
        # Convert ObjectId to string for JSON serialization
        for req in requests:
            req['_id'] = str(req['_id'])
            if req.get('provider_id'):
                req['provider_id'] = str(req['provider_id'])
        
        # Sort by creation date (newest first)
        requests.sort(key=lambda x: x['created_at'], reverse=True)
        
        return jsonify({
            "success": True,
            "requests": requests
        }), 200
        
    except Exception as e:
        print(f"Error fetching pending requests: {e}")
        return jsonify({"error": "Failed to fetch pending requests"}), 500

@request_bp.route('/provider-requests', methods=['GET'])
def get_provider_requests():
    """Get all requests for a specific provider"""
    try:
        provider_id = request.args.get('provider_id')
        
        if not provider_id:
            return jsonify({"error": "Provider ID is required"}), 400
        
        # Find requests for this provider
        requests = list(mongo.db.service_requests.find({"provider_id": provider_id}))
        
        # Convert ObjectId to string for JSON serialization
        for req in requests:
            req['_id'] = str(req['_id'])
            req['provider_id'] = str(req['provider_id'])
        
        # Sort by creation date (newest first)
        requests.sort(key=lambda x: x['created_at'], reverse=True)
        
        return jsonify({
            "success": True,
            "requests": requests
        }), 200
        
    except Exception as e:
        print(f"Error fetching provider requests: {e}")
        return jsonify({"error": "Failed to fetch provider requests"}), 500

@request_bp.route('/<request_id>/accept', methods=['PUT'])
def accept_request(request_id):
    """Accept a service request by assigning provider to it"""
    try:
        data = request.get_json()
        provider_id = data.get('provider_id')
        
        if not provider_id:
            return jsonify({"error": "Provider ID is required"}), 400
        
        # Update the request to assign this provider
        result = mongo.db.service_requests.update_one(
            {"_id": ObjectId(request_id)},
            {
                "$set": {
                    "provider_id": provider_id,
                    "status": "accepted",
                    "updated_at": datetime.datetime.utcnow()
                }
            }
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "Request not found"}), 404
        
        return jsonify({
            "success": True,
            "message": "Request accepted successfully"
        }), 200
        
    except Exception as e:
        print(f"Error accepting request: {e}")
        return jsonify({"error": "Failed to accept request"}), 500

@request_bp.route('/<request_id>/complete', methods=['PUT'])
def complete_request(request_id):
    """Mark a service request as completed"""
    try:
        result = mongo.db.service_requests.update_one(
            {"_id": ObjectId(request_id)},
            {
                "$set": {
                    "status": "completed",
                    "updated_at": datetime.datetime.utcnow()
                }
            }
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "Request not found"}), 404
        
        return jsonify({
            "success": True,
            "message": "Request marked as completed"
        }), 200
        
    except Exception as e:
        print(f"Error completing request: {e}")
        return jsonify({"error": "Failed to complete request"}), 500

@request_bp.route('/<request_id>/reject', methods=['PUT'])
def reject_request(request_id):
    """Reject a service request"""
    try:
        data = request.get_json()
        rejection_reason = data.get('rejection_reason', 'No reason provided')
        
        result = mongo.db.service_requests.update_one(
            {"_id": ObjectId(request_id)},
            {
                "$set": {
                    "status": "rejected",
                    "rejection_reason": rejection_reason,
                    "updated_at": datetime.datetime.utcnow()
                }
            }
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "Request not found"}), 404
        
        return jsonify({
            "success": True,
            "message": "Request rejected successfully"
        }), 200
        
    except Exception as e:
        print(f"Error rejecting request: {e}")
        return jsonify({"error": "Failed to reject request"}), 500
```

## FRONTEND FILES

### 7. User Frontend - quickfix_users/forntend/js/auth.js
```javascript
// User Authentication Management
const API_URL = 'http://localhost:8001/api';

// Authentication functions
async function loginUser(email, password) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'Network error. Please try again.' };
  }
}

async function signupUser(name, email, password) {
  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, password })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Signup error:', error);
    return { error: 'Network error. Please try again.' };
  }
}

// Event handlers
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');

  // --- Signup Form Handler ---
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirm-password').value;

      if (!name || !email || !password || !confirmPassword) {
        showToast('Please fill in all details.', true);
        return;
      }

      if (password !== confirmPassword) {
        showToast('Passwords do not match.', true);
        return;
      }

      const result = await signupUser(name, email, password);

      if (result.message === "User created successfully") {
        showToast('Signup successful! Please log in.');
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1500);
      } else {
        showToast(result.error || 'Signup failed.', true);
      }
    });
  }

  // --- Login Form Handler ---
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      if (!email || !password) {
        showToast('Please enter your email and password.', true);
        return;
      }

      const result = await loginUser(email, password);

      if (result.message === "Login successful") {
        showToast('Login successful! Redirecting...');
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('userName', result.user.name);
        localStorage.setItem('userEmail', result.user.email);
        localStorage.setItem('userId', result.user._id);

        setTimeout(() => {
          window.location.href = '../dashboard/dashboard.html';
        }, 1500);
      } else {
        showToast(result.error || 'Login failed.', true);
      }
    });
  }
});
```

### 8. User Frontend - quickfix_users/forntend/pages/dashboard/dashboard.js
```javascript
// User Dashboard Management
let map;
let userMarker;
let currentLocation = null;

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    const userName = localStorage.getItem('userName');

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

    // Initialize map
    initMap();

    // Setup service buttons
    setupServiceButtons();
});

function initMap() {
    // Initialize the map centered on a default location
    map = L.map('map').setView([12.9716, 77.5946], 13); // Bangalore coordinates

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Get user's current location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                currentLocation = { lat: latitude, lng: longitude };
                
                // Update map view to user's location
                map.setView([latitude, longitude], 15);
                
                // Add user marker
                userMarker = L.marker([latitude, longitude])
                    .addTo(map)
                    .bindPopup('Your Location')
                    .openPopup();
                
                showToast('Location detected successfully!');
            },
            (error) => {
                console.error('Error getting location:', error);
                showToast('Could not detect your location. Please set it manually.', true);
            }
        );
    } else {
        showToast('Geolocation not supported. Please set location manually.', true);
    }
}

function setupServiceButtons() {
    const serviceButtons = document.querySelectorAll('.service-button');
    
    serviceButtons.forEach(button => {
        button.addEventListener('click', () => {
            const serviceType = button.getAttribute('data-service');
            handleServiceRequest(serviceType);
        });
    });
}

function handleServiceRequest(serviceType) {
    if (!currentLocation) {
        showToast('Please set your location first.', true);
        return;
    }

    // Show service form modal
    const modal = document.getElementById('service-modal');
    const serviceTypeInput = document.getElementById('service-type');
    const modalTitle = document.getElementById('modal-title');
    
    serviceTypeInput.value = serviceType;
    modalTitle.textContent = `${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)} Service Request`;
    
    modal.style.display = 'block';
}

async function handleHelpRequest() {
    const form = document.getElementById('help-request-form');
    const formData = new FormData(form);
    
    const requestData = {
        customer_name: formData.get('customer_name'),
        emergency_contact: formData.get('emergency_contact'),
        service_type: formData.get('service_type'),
        vehicle_type: formData.get('vehicle_type'),
        vehicle_model: formData.get('vehicle_model'),
        urgency_level: formData.get('urgency_level'),
        issue_description: formData.get('issue_description'),
        fuel_type: formData.get('fuel_type'),
        fuel_amount: formData.get('fuel_amount'),
        delivery_required: formData.get('delivery_required'),
        destination: formData.get('destination'),
        service_type_detail: formData.get('service_type_detail'),
        additional_notes: formData.get('additional_notes'),
        user_email: localStorage.getItem('userEmail'),
        provider_id: null
    };

    try {
        const response = await fetch('http://localhost:8001/api/requests/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(requestData)
        });

        const result = await response.json();

        if (result.success) {
            showToast('Service request submitted successfully!');
            closeModal();
            form.reset();
        } else {
            showToast(result.error || 'Failed to submit request.', true);
        }
    } catch (error) {
        console.error('Error submitting request:', error);
        showToast('Network error. Please try again.', true);
    }
}

function closeModal() {
    const modal = document.getElementById('service-modal');
    modal.style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('service-modal');
    if (event.target === modal) {
        closeModal();
    }
}
```

### 9. Provider Frontend - quickfix_providers/frontend/pages/requests/requests.js
```javascript
// Provider Requests Management
const API_URL = 'http://localhost:8002/api/providers';

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('providerToken');
    const providerName = localStorage.getItem('providerName');
    const providerId = localStorage.getItem('providerId');

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
            localStorage.removeItem('providerName');
            localStorage.removeItem('providerId');
            window.location.href = '../auth/login.html';
        });
    }

    // Load requests
    loadProviderRequests();

    // Setup filter event listeners
    setupFilters();
});

async function loadProviderRequests() {
    const loadingSpinner = document.getElementById('loading-spinner');
    const noRequests = document.getElementById('no-requests');
    const requestsList = document.getElementById('requests-list');
    const providerId = localStorage.getItem('providerId');

    try {
        loadingSpinner.style.display = 'flex';
        noRequests.classList.add('hidden');
        requestsList.innerHTML = '';

        // First, get pending requests that don't have a provider assigned yet
        const pendingResponse = await fetch(`${API_URL}/requests/pending-requests`);
        const pendingData = await pendingResponse.json();

        // Then, get requests that are already assigned to this provider
        const assignedResponse = await fetch(`${API_URL}/requests/provider-requests?provider_id=${providerId}`);
        const assignedData = await assignedResponse.json();

        let allRequests = [];

        if (pendingData.success) {
            allRequests = allRequests.concat(pendingData.requests);
        }

        if (assignedData.success) {
            allRequests = allRequests.concat(assignedData.requests);
        }

        if (allRequests.length === 0) {
            loadingSpinner.style.display = 'none';
            noRequests.classList.remove('hidden');
            return;
        }

        // Update stats
        updateStats(allRequests);

        // Display requests
        displayRequests(allRequests);

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
        rejected: requests.filter(r => r.status === 'rejected').length
    };

    document.getElementById('pending-count').textContent = stats.pending;
    document.getElementById('accepted-count').textContent = stats.accepted;
    document.getElementById('completed-count').textContent = stats.completed;
    document.getElementById('rejected-count').textContent = stats.rejected;
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

    // Check if this request is pending and doesn't have a provider assigned
    const isUnassignedPending = request.status === 'pending' && (!request.provider_id || request.provider_id === '');
    const statusClass = isUnassignedPending ? 'unassigned' : request.status;
    const statusText = isUnassignedPending ? 'Unassigned' : request.status.charAt(0).toUpperCase() + request.status.slice(1);

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

async function acceptRequest(requestId) {
    try {
        const providerId = localStorage.getItem('providerId');
        
        const response = await fetch(`${API_URL}/requests/${requestId}/accept`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                provider_id: providerId
            })
        });

        const data = await response.json();

        if (data.success) {
            showToast('Request accepted successfully', false);
            closeModal();
            loadProviderRequests(); // Reload the list
        } else {
            showToast(data.error || 'Failed to accept request', true);
        }
    } catch (error) {
        console.error('Error accepting request:', error);
        showToast('Network error. Please try again.', true);
    }
}
```

## CSS FILES

### 10. Provider Frontend - quickfix_providers/frontend/pages/requests/requests.css
```css
/* Requests Page Styles */
.requests-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
}

.requests-header {
    text-align: center;
    margin-bottom: 3rem;
}

.requests-header h1 {
    font-size: 2.5rem;
    color: #2d3a5a;
    margin-bottom: 0.5rem;
}

.requests-header p {
    font-size: 1.1rem;
    color: #666;
}

/* Stats Section */
.requests-stats {
    margin-bottom: 2rem;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
}

.stat-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    gap: 1rem;
}

.stat-icon {
    width: 60px;
    height: 60px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.stat-icon.pending {
    background: linear-gradient(135deg, #ffc107, #ff9800);
}

.stat-icon.accepted {
    background: linear-gradient(135deg, #28a745, #20c997);
}

.stat-icon.completed {
    background: linear-gradient(135deg, #17a2b8, #6f42c1);
}

.stat-icon.rejected {
    background: linear-gradient(135deg, #dc3545, #e83e8c);
}

.stat-icon i {
    font-size: 1.5rem;
    color: white;
}

.stat-content h3 {
    font-size: 2rem;
    font-weight: 700;
    color: #2d3a5a;
    margin-bottom: 0.25rem;
}

.stat-content p {
    color: #666;
    font-weight: 500;
}

/* Request Status Styles */
.request-status.unassigned {
    background: #6c757d;
    color: white;
}

.request-status.pending {
    background: #ffc107;
    color: #212529;
}

.request-status.accepted {
    background: #28a745;
    color: white;
}

.request-status.completed {
    background: #17a2b8;
    color: white;
}

.request-status.rejected {
    background: #dc3545;
    color: white;
}
```

## SETUP INSTRUCTIONS

### Requirements:
- Python 3.7+
- MongoDB
- Flask
- Flask-CORS
- PyMongo
- bcrypt
- PyJWT

### Installation:
```bash
pip install flask flask-cors pymongo bcrypt PyJWT
```

### Database Setup:
1. Start MongoDB
2. Create database: `quickfix`
3. Collections will be created automatically

### Running the System:
1. Start User Backend: `cd quickfix_users/backend && python app.py`
2. Start Provider Backend: `cd quickfix_providers/backend && python app.py`
3. Open frontend with Live Server on port 5500

### Test Credentials:
- User: red@gmail.com / red
- Provider: quickfix_fuel / password

## SYSTEM FEATURES:
- ✅ User authentication (signup/login)
- ✅ Provider authentication (signup/login)
- ✅ User dashboard with map
- ✅ Service request submission
- ✅ Provider request management
- ✅ Request status tracking
- ✅ Real-time request assignment
- ✅ Complete request lifecycle
- ✅ Navigation menu across all user pages (Dashboard, Profile, My Requests)

## NAVIGATION STRUCTURE:
- **Dashboard**: Main page with map and service selection
- **Profile**: User account management
- **My Requests**: Track and manage service requests
- **Header Navigation**: Consistent navigation menu across all pages

This backup contains all the working code for your QuickFix roadside assistance system. Use password "red" to request this complete backup in the future. 