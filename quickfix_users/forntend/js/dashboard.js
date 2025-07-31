import { showToast } from './toast.js';

const API_URL = 'http://localhost:8001/api';

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('authToken');
  const userName = localStorage.getItem('userName');

  if (!token) {
    window.location.href = '../auth/login.html';
    return;
  }

  // --- Page Element References ---
  const welcomeMessage = document.getElementById('welcome-message');
  const logoutBtn = document.getElementById('logout-btn');
  const mapElement = document.getElementById('map');
  const findLocationBtn = document.getElementById('find-location-btn');
  const selectExactLocationBtn = document.getElementById('select-exact-location-btn');
  const mapStatus = document.getElementById('map-status');
  const locationDetails = document.getElementById('location-details');
  const userAddressEl = document.getElementById('user-address');
  const serviceSelection = document.getElementById('service-selection');
  const serviceButtons = document.querySelectorAll('.service-btn');
  const resultsSection = document.getElementById('results-section');
  const resultsTitle = document.getElementById('results-title');
  const resultsBody = document.getElementById('results-body');
  const mapLoadingOverlay = document.getElementById('map-loading-overlay');
  const mapContainer = document.querySelector('.map-container');


  // Global variables
  let map;
  let userLocation = null;
  let serviceMarkers = [];
  let isExactLocationMode = false;
  let userRequests = []; // Store user requests

  // Make currentServices global
  window.currentServices = [];

  // Define custom icons
  const fuelIcon = L.divIcon({ className: 'custom-map-icon', html: '<i class="fa-solid fa-gas-pump"></i>' });
  const garageIcon = L.divIcon({ className: 'custom-map-icon', html: '<i class="fa-solid fa-screwdriver-wrench"></i>' });
  const towingIcon = L.divIcon({ className: 'custom-map-icon', html: '<i class="fa-solid fa-truck"></i>' });
  const iconMap = { fuel: fuelIcon, garage: garageIcon, towing: towingIcon };

  // --- Initialize Page ---
  welcomeMessage.textContent = `Welcome, ${userName}!`;
  logoutBtn.addEventListener('click', () => {
    showToast('You have been logged out successfully!');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userName');
    setTimeout(() => { window.location.href = '../../index.html'; }, 1500);
  });

  map = L.map(mapElement).setView([20.5937, 78.9629], 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  // Ensure map is visible and not stuck in loading state
  if (mapLoadingOverlay) {
    mapLoadingOverlay.classList.remove('active');
  }
  if (mapContainer) {
    mapContainer.classList.remove('loading');
  }

  let userMarker;

  // --- Exact Location Selection Functionality ---
  function toggleExactLocationMode() {
    isExactLocationMode = !isExactLocationMode;

    if (isExactLocationMode) {
      selectExactLocationBtn.classList.add('active');
      mapStatus.textContent = 'Click anywhere on the map to set your exact location.';
      map.getContainer().style.cursor = 'crosshair';
    } else {
      selectExactLocationBtn.classList.remove('active');
      selectExactLocationBtn.classList.remove('loading');
      selectExactLocationBtn.textContent = 'Select Exact Location on Map';
      mapStatus.textContent = '';
      map.getContainer().style.cursor = '';
    }
  }

  function handleMapClick(event) {
    if (!isExactLocationMode) return;

    const { lat, lng } = event.latlng;

    // Update the user's location with exact coordinates
    updateUserLocation(lat, lng, 0); // 0 accuracy for exact location

    // Exit exact location mode
    toggleExactLocationMode();

    // Show success message
    mapStatus.textContent = `Exact location set at ${lat.toFixed(6)}, ${lng.toFixed(6)}`;

    // Show service selection
    serviceSelection.classList.remove('hidden');
  }

  // Add map click event listener
  map.on('click', handleMapClick);

  // Add event listener for exact location button
  selectExactLocationBtn.addEventListener('click', () => {
    if (!isExactLocationMode) {
      // Show loading state when entering exact location mode
      selectExactLocationBtn.classList.add('loading');
      selectExactLocationBtn.textContent = 'Click on Map to Set Location';
    } else {
      // Hide loading state when exiting exact location mode
      selectExactLocationBtn.classList.remove('loading');
      selectExactLocationBtn.textContent = 'Select Exact Location on Map';
    }
    toggleExactLocationMode();
  });



  // Global functions for service actions
  window.callService = function (phone) {
    if (!phone || phone === 'Not available') {
      showToast('Phone number not available for this service.', true);
      return;
    }
    alert(`Calling ${phone}...\n\nNote: In a real app, this would initiate a phone call.`);
  };

  window.getDirections = function (lat, lng) {
    // Show navigation in the map instead of opening Google Maps
    if (!userLocation) {
      showToast('Please find your location first to get directions.', true);
      return;
    }

    // Clear existing route if any
    if (window.currentRoute) {
      map.removeLayer(window.currentRoute);
    }

    // Show loading state
    showToast('Calculating route...', false);

    // Calculate route using OSRM (Open Source Routing Machine)
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${userLocation.lng},${userLocation.lat};${lng},${lat}?overview=full&geometries=geojson&steps=true&annotations=true`;

    fetch(osrmUrl)
      .then(response => response.json())
      .then(data => {
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const routeGeometry = route.geometry;

          // Create the route line with actual road geometry
          const routeLine = L.geoJSON(routeGeometry, {
            style: {
              color: '#3a69f5',
              weight: 6,
              opacity: 0.8
            }
          }).addTo(map);

          // Store the route for later removal
          window.currentRoute = routeLine;

          // Calculate and display route information
          const distance = (route.distance / 1000).toFixed(1); // Convert to km
          const duration = Math.round(route.duration / 60); // Convert to minutes

          // Create route info popup
          const routeInfo = L.popup()
            .setLatLng([userLocation.lat, userLocation.lng])
            .setContent(`
              <div style="min-width: 200px;">
                <h4 style="margin: 0 0 10px 0; color: #333;">Route Information</h4>
                <p style="margin: 5px 0;"><strong>Distance:</strong> ${distance} km</p>
                <p style="margin: 5px 0;"><strong>Duration:</strong> ~${duration} minutes</p>
                <p style="margin: 5px 0; font-size: 0.9em; color: #666;">Click anywhere to clear route</p>
              </div>
            `)
            .openOn(map);

          // Fit map to show the entire route
          map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });



          showToast(`Route found! Distance: ${distance} km, Duration: ~${duration} minutes`, false);

          // Add click listener to clear route when user clicks on map
          const clearRoute = () => {
            if (window.currentRoute) {
              map.removeLayer(window.currentRoute);
              window.currentRoute = null;
              map.closePopup();
              showToast('Route cleared.', false);
            }
            map.off('click', clearRoute);
          };
          map.on('click', clearRoute);

        } else {
          showToast('Could not calculate route. Please try again.', true);
        }
      })
      .catch(error => {
        console.error('Route calculation error:', error);
        showToast('Failed to calculate route. Please try again.', true);
      });
  };



  // Sidebar functions
  async function openSidebar(service) {
    const sidebar = document.getElementById('service-sidebar');
    const title = document.getElementById('sidebar-title');
    const content = document.getElementById('service-details-content');

    if (!sidebar || !service) return;

    title.textContent = `${service.name} Details`;

    // Fetch address for the service location (in English)
    let serviceAddress = 'Loading address...';
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${service.location.lat}&lon=${service.location.lng}&accept-language=en`);
      const data = await response.json();
      serviceAddress = data.display_name || 'Address not available';
    } catch (error) {
      serviceAddress = 'Address not available';
    }

    content.innerHTML = `
      <div class="service-detail-card">
        <h4>${service.name}</h4>
        <p><strong>Type:</strong> ${service.type}</p>
        <p><strong>Distance:</strong> ${Math.round(service.distance)}m</p>
        <p><strong>Phone:</strong> ${service.phone || 'Not available'}</p>
        <p><strong>Address:</strong> ${serviceAddress}</p>

        <div class="service-actions">
          ${service.phone ? `<button onclick="callService('${service.phone}')" class="btn call-btn">Call</button>` : '<button class="btn call-btn" disabled style="opacity: 0.5; cursor: not-allowed;">Call (No Phone)</button>'}
          <button onclick="getDirections(${service.location.lat}, ${service.location.lng})" class="btn directions-btn">Directions</button>
        </div>
      </div>
    `;

    // Show the appropriate form based on service type
    hideAllForms();
    const formId = `${service.type}-form`;
    const form = document.getElementById(formId);
    if (form) {
      form.style.display = 'block';
    }

    sidebar.classList.add('open');
    document.body.classList.add('sidebar-open');

    // Setup form handlers when sidebar opens
    setTimeout(setupFormHandlers, 100);
  }

  function hideAllForms() {
    const forms = ['fuel-form', 'towing-form', 'garage-form'];
    forms.forEach(formId => {
      const form = document.getElementById(formId);
      if (form) {
        form.style.display = 'none';
      }
    });
  }

  function closeSidebar() {
    const sidebar = document.getElementById('service-sidebar');
    sidebar.classList.remove('open');
    document.body.classList.remove('sidebar-open');
  }

  // Handle help request form submission
  function handleHelpRequest(event) {
    // Prevent default form submission to avoid page reload
    event.preventDefault();
    event.stopPropagation();

    // Get form data
    const formData = new FormData(event.target);
    const requestData = {
      customerName: formData.get('customer-name'),
      emergencyContact: formData.get('emergency-contact'),
      serviceType: formData.get('service-type') || 'general',
      vehicleType: formData.get('vehicle-type'),
      issueDescription: formData.get('issue-description'),
      fuelType: formData.get('fuel-type'),
      fuelAmount: formData.get('fuel-amount'),
      deliveryRequired: formData.get('delivery-required'),
      destination: formData.get('destination'),
      vehicleModel: formData.get('vehicle-model'),
      urgency: formData.get('urgency'),
      additionalNotes: formData.get('additional-notes'),
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    // Here you would typically send this data to your backend
    console.log('Help request submitted:', requestData);

    // Save the request to user's history
    saveRequest(requestData);

    // Show success message
    showToast('✅ Service request submitted successfully! We will contact you soon.', false);

    // Reset form
    event.target.reset();

    // Close sidebar after a short delay
    setTimeout(() => {
      closeSidebar();
    }, 3000);

    // Return false to ensure no further propagation
    return false;
  }

  // Add form submission handlers
  function setupFormHandlers() {
    const fuelForm = document.getElementById('fuel-help-form');
    const towingForm = document.getElementById('towing-help-form');
    const garageForm = document.getElementById('garage-help-form');

    if (fuelForm) {
      fuelForm.removeEventListener('submit', handleHelpRequest);
      fuelForm.addEventListener('submit', handleHelpRequest);
    }
    if (towingForm) {
      towingForm.removeEventListener('submit', handleHelpRequest);
      towingForm.addEventListener('submit', handleHelpRequest);
    }
    if (garageForm) {
      garageForm.removeEventListener('submit', handleHelpRequest);
      garageForm.addEventListener('submit', handleHelpRequest);
    }
  }

  // Setup form handlers immediately and also when sidebar opens
  setupFormHandlers();

  // Make functions global
  window.openSidebar = openSidebar;
  window.closeSidebar = closeSidebar;
  window.setupFormHandlers = setupFormHandlers;

  // Past Requests Functions
  function openPastRequestsSidebar() {
    const sidebar = document.getElementById('past-requests-sidebar');
    if (sidebar) {
      loadPastRequests();
      sidebar.classList.add('open');
      document.body.classList.add('sidebar-open');
    }
  }

  function closePastRequestsSidebar() {
    const sidebar = document.getElementById('past-requests-sidebar');
    if (sidebar) {
      sidebar.classList.remove('open');
      document.body.classList.remove('sidebar-open');
    }
  }

  function loadPastRequests() {
    const content = document.getElementById('past-requests-content');
    if (!content) return;

    // Load requests from localStorage
    const savedRequests = localStorage.getItem('userRequests');
    userRequests = savedRequests ? JSON.parse(savedRequests) : [];

    if (userRequests.length === 0) {
      content.innerHTML = `
        <div class="no-requests">
          <div class="no-requests-icon">📋</div>
          <h4>No Requests Yet</h4>
          <p>You haven't made any service requests yet.</p>
        </div>
      `;
      return;
    }

    // Sort requests by date (newest first)
    const sortedRequests = userRequests.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    let requestsHTML = '<h4>Your Service Requests</h4>';

    sortedRequests.forEach((request, index) => {
      const date = new Date(request.timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const statusClass = request.status || 'pending';
      const statusText = (request.status || 'pending').toUpperCase();

      requestsHTML += `
        <div class="request-item ${statusClass}">
          <div class="request-header">
            <h5 class="request-title">${request.serviceType} Request</h5>
            <span class="request-status ${statusClass}">${statusText}</span>
          </div>
          <div class="request-details">
            <p><strong>Service:</strong> ${request.serviceType}</p>
            <p><strong>Vehicle:</strong> ${request.vehicleType}</p>
            ${request.fuelType ? `<p><strong>Fuel Type:</strong> ${request.fuelType}</p>` : ''}
            ${request.fuelAmount ? `<p><strong>Amount:</strong> ${request.fuelAmount} liters</p>` : ''}
            ${request.issueDescription ? `<p><strong>Issue:</strong> ${request.issueDescription}</p>` : ''}
            ${request.additionalNotes ? `<p><strong>Notes:</strong> ${request.additionalNotes}</p>` : ''}
          </div>
          <div class="request-date">Requested on ${date}</div>
        </div>
      `;
    });

    content.innerHTML = requestsHTML;
  }

  function saveRequest(requestData) {
    // Add request to userRequests array
    userRequests.push(requestData);

    // Save to localStorage
    localStorage.setItem('userRequests', JSON.stringify(userRequests));

    console.log('Request saved:', requestData);
  }

  // Make past requests functions global
  window.openPastRequestsSidebar = openPastRequestsSidebar;
  window.closePastRequestsSidebar = closePastRequestsSidebar;

  // Close button event - set up immediately
  const closeBtn = document.getElementById('close-sidebar');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeSidebar);
  }

  // Close sidebar with Escape key
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      closeSidebar();
      closePastRequestsSidebar();
    }
  });

  // Add event listener for View Past Requests button
  const viewPastRequestsBtn = document.getElementById('view-past-requests-btn');
  if (viewPastRequestsBtn) {
    viewPastRequestsBtn.addEventListener('click', openPastRequestsSidebar);
  }





  // --- Location Update Function ---
  function updateUserLocation(lat, lng, accuracy = null) {
    userLocation = { lat, lng };

    if (userMarker) map.removeLayer(userMarker);

    if (accuracy === 0) {
      // Exact location selected by user
      mapStatus.textContent = `Exact location set at ${lat.toFixed(6)}, ${lng.toFixed(6)} `;
      map.setView([lat, lng], 15); // Zoom in for exact location
      userMarker = L.marker([lat, lng]).addTo(map).bindPopup('<b>Your Exact Location</b><br>Manually selected').openPopup();
    } else {
      // GPS location
      mapStatus.textContent = 'Location found!';
      map.setView([lat, lng], 13);
      userMarker = L.marker([lat, lng]).addTo(map).bindPopup('<b>Your Location</b>').openPopup();
    }

    fetchAddress(lat, lng);
    serviceSelection.classList.remove('hidden');
  }

  // --- Fetch and Display Services ---
  async function fetchAndDisplayServices(serviceType) {
    if (!userLocation) {
      showToast('Please find your location first.', true);
      return;
    }

    // Show loading overlay
    mapLoadingOverlay.classList.add('active');
    mapContainer.classList.add('loading');
    mapLoadingOverlay.querySelector('.map-loading-text').textContent = `Searching for ${serviceType} services`;
    mapLoadingOverlay.querySelector('.map-loading-subtext').textContent = 'Please wait while we find nearby assistance';

    resultsBody.innerHTML = '<tr><td colspan="4">Searching...</td></tr>';
    resultsSection.classList.remove('hidden');
    resultsTitle.textContent = `Searching for Nearby ${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}...`;

    serviceMarkers.forEach(marker => map.removeLayer(marker));
    serviceMarkers = [];

    try {
      const response = await fetch(`${API_URL}/services/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&service_type=${serviceType}`);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.services && data.services.length > 0) {
        resultsTitle.textContent = `Found ${data.services.length} Nearby ${serviceType} Services`;
        resultsBody.innerHTML = '';

        // Store services for detail display
        window.currentServices = data.services;
        console.log('Current services stored:', window.currentServices);

        data.services.forEach((service, index) => {
          const marker = L.marker([service.location.lat, service.location.lng], { icon: iconMap[serviceType] })
            .addTo(map)
            .bindPopup(`<b>${service.name}</b><br>${Math.round(service.distance)}m away<br>
              <div style="margin-top: 10px; display: flex; gap: 5px;">
                <button onclick="openSidebar(window.currentServices[${index}])" style="padding: 5px 10px; background: #3a69f5; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;">View Details</button>
                <button onclick="getDirections(${service.location.lat}, ${service.location.lng})" style="padding: 5px 10px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;">Navigate</button>
              </div>`);
          serviceMarkers.push(marker);

          const row = document.createElement('tr');
          row.innerHTML = `
  <td>${service.name}</td>
  <td style="text-transform: capitalize;">${service.type}</td>
  <td>${Math.round(service.distance)}m</td>
  <td><button class="btn details-btn-small" onclick="openSidebar(window.currentServices[${index}])">Show Details</button></td>
  `;
          resultsBody.appendChild(row);
        });
      } else {
        resultsTitle.textContent = `No Nearby ${serviceType} Services Found`;
        resultsBody.innerHTML = '<tr><td colspan="4">No services found within a 5km radius.</td></tr>';
        window.currentServices = [];
      }
    } catch (err) {
      let errorMessage = 'Failed to fetch services from the server.';

      // Try to get more specific error message from the response
      if (err.message && err.message.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (err.message && err.message.includes('503')) {
        errorMessage = 'Service temporarily unavailable. Please try again in a few minutes.';
      } else if (err.message && err.message.includes('500')) {
        errorMessage = 'Server error. Please try again later.';
      }

      showToast(errorMessage, true);
      resultsTitle.textContent = `Error Fetching Services`;
      resultsBody.innerHTML = '<tr><td colspan="4">Could not retrieve service data. Please try again.</td></tr>';
      window.currentServices = [];
      console.error(err);
    } finally {
      // Hide loading overlay
      mapLoadingOverlay.classList.remove('active');
      mapContainer.classList.remove('loading');
    }
  }

  serviceButtons.forEach(button => {
    button.addEventListener('click', async () => {
      const serviceType = button.dataset.service;
      const originalText = button.textContent;

      // Show loading state on button
      button.classList.add('loading');
      button.textContent = `Searching ${serviceType}...`;

      try {
        await fetchAndDisplayServices(serviceType);
      } finally {
        // Restore button state
        button.classList.remove('loading');
        button.textContent = originalText;
      }
    });
  });

  async function fetchAddress(lat, lon) {
    userAddressEl.textContent = 'Determining address...';
    locationDetails.classList.remove('hidden');
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=en`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      userAddressEl.textContent = `Your Location: ${data.display_name || "Address could not be determined."}`;
    } catch (error) {
      userAddressEl.textContent = "Could not connect to address service.";
    }
  }

  findLocationBtn.addEventListener('click', () => {
    // Show loading state
    findLocationBtn.classList.add('loading');
    findLocationBtn.textContent = 'Finding Location...';
    mapStatus.textContent = 'Finding your location...';

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          updateUserLocation(latitude, longitude, accuracy);
          // Hide loading state
          findLocationBtn.classList.remove('loading');
          findLocationBtn.textContent = 'Find My Location';
        },
        (error) => {
          mapStatus.textContent = 'Could not get your location.';
          findLocationBtn.classList.remove('loading');
          findLocationBtn.textContent = 'Find My Location';
          showToast('Could not get your location. Please enable location services.', true);
        },
        { enableHighAccuracy: true }
      );
    } else {
      findLocationBtn.classList.remove('loading');
      findLocationBtn.textContent = 'Find My Location';
      showToast('Geolocation is not supported by your browser.', true);
    }
  });
});
