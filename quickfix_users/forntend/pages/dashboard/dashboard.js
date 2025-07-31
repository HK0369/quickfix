document.addEventListener('DOMContentLoaded', function () {
    // --- Element References ---
    const serviceDetailsSlider = document.getElementById('service-details-slider');
    const sliderTitle = document.getElementById('slider-title');
    const serviceDetailsContent = document.getElementById('service-details-content');
    const closeDetailsSlider = document.getElementById('close-details-slider');

    // Mock service data for demonstration
    const mockServices = {
        fuel: [
            {
                name: "QuickFuel Station",
                type: "fuel",
                distance: "2.3 km",
                phone: "+1-555-0123",
                address: "123 Main Street, Downtown",
                rating: "4.8"
            },
            {
                name: "Express Gas",
                type: "fuel",
                distance: "3.1 km",
                phone: "+1-555-0124",
                address: "456 Oak Avenue, Midtown",
                rating: "4.6"
            }
        ],
        towing: [
            {
                name: "Reliable Towing Co.",
                type: "towing",
                distance: "1.8 km",
                phone: "+1-555-0201",
                address: "321 Towing Lane, Industrial Area",
                rating: "4.7"
            },
            {
                name: "Quick Tow Services",
                type: "towing",
                distance: "2.5 km",
                phone: "+1-555-0202",
                address: "654 Service Road, Business District",
                rating: "4.5"
            }
        ],
        garage: [
            {
                name: "Tata Motors",
                type: "garage",
                distance: "2.0 km",
                phone: "Not available",
                address: "Not available",
                rating: "4.9"
            },
            {
                name: "AutoCare Center",
                type: "garage",
                distance: "1.2 km",
                phone: "+1-555-0301",
                address: "147 Mechanic Street, Auto District",
                rating: "4.9"
            }
        ]
    };

    function createServiceDetailCard(service) {
        const icon = service.type === 'fuel' ? '⛽' :
            service.type === 'towing' ? '🚛' : '🔧';

        return `
      <div class="service-detail-card">
        <div class="service-detail-header">
          <div class="service-detail-icon">${icon}</div>
          <div class="service-detail-info">
            <h4>${service.name}</h4>
            <p>${service.type}</p>
          </div>
        </div>
        <div class="service-detail-details">
          <div class="detail-item">
            <span class="detail-label">Type:</span>
            <span class="detail-value">${service.type}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Distance:</span>
            <span class="detail-value">${service.distance}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Phone:</span>
            <span class="detail-value">${service.phone}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Address:</span>
            <span class="detail-value">${service.address}</span>
          </div>
        </div>
        <div class="service-detail-actions">
          <button class="action-btn call-btn" onclick="callService('${service.phone}')">Call</button>
          <button class="action-btn directions-btn" onclick="getDirections('${service.name}')">Directions</button>
        </div>
      </div>
    `;
    }

    function showServiceDetails(serviceType) {
        const services = mockServices[serviceType] || [];

        // Update slider title
        const serviceNames = {
            fuel: 'Fuel Stations',
            towing: 'Towing Services',
            garage: 'Garage Services'
        };
        sliderTitle.textContent = serviceNames[serviceType] || 'Service Details';

        // Clear and populate content
        serviceDetailsContent.innerHTML = '';
        services.forEach(service => {
            serviceDetailsContent.innerHTML += createServiceDetailCard(service);
        });

        // Show slider and add body class
        serviceDetailsSlider.classList.remove('hidden');
        serviceDetailsSlider.classList.add('show');
        document.body.classList.add('slider-open');
    }

    function closeServiceDetails() {
        serviceDetailsSlider.classList.remove('show');
        serviceDetailsSlider.classList.add('hidden');
        document.body.classList.remove('slider-open');
    }

    // Event listeners
    if (closeDetailsSlider) {
        closeDetailsSlider.addEventListener('click', closeServiceDetails);
    }

    // Close slider when clicking outside
    serviceDetailsSlider.addEventListener('click', (event) => {
        if (event.target === serviceDetailsSlider) {
            closeServiceDetails();
        }
    });

    // Close slider with Escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && serviceDetailsSlider.classList.contains('show')) {
            closeServiceDetails();
        }
    });

    // Global functions for service actions
    window.callService = function (phone) {
        alert(`Calling ${phone}...\n\nNote: In a real app, this would initiate a phone call.`);
    };

    window.getDirections = function (serviceName) {
        // This is a simplified version for the demo page
        // In the main dashboard, this would show navigation in the map
        alert(`Getting directions to ${serviceName}...\n\nNote: In the main dashboard, this would show the route on the map.`);
    };

    // Setup service button click handlers
    function setupServiceButtons() {
        const serviceButtons = document.querySelectorAll('.service-btn');
        serviceButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                event.preventDefault();
                const serviceType = button.getAttribute('data-service');
                if (serviceType) {
                    showServiceDetails(serviceType);
                }
            });
        });
    }

    // Initialize service buttons
    setupServiceButtons();

    // Map functionality (basic setup)
    const map = L.map('map').setView([12.9716, 77.5946], 10); // Bangalore coordinates

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Find location button functionality
    const findLocationBtn = document.getElementById('find-location-btn');
    const mapStatus = document.getElementById('map-status');
    const locationDetails = document.getElementById('location-details');
    const userAddressEl = document.getElementById('user-address');
    const serviceSelection = document.getElementById('service-selection');

    let userMarker;

    function updateMapPosition(lat, lon, accuracy) {
        const latLng = [lat, lon];
        mapStatus.textContent = 'Location found!';

        if (!userMarker) {
            userMarker = L.marker(latLng).addTo(map);
        } else {
            userMarker.setLatLng(latLng);
        }

        userMarker.bindPopup(`<b>Your Location</b><br>Accuracy: ~${Math.round(accuracy)} meters`).openPopup();
        map.setView(latLng, 15);

        fetchAddress(lat, lon);
        serviceSelection.classList.remove('hidden');
    }

    async function fetchAddress(lat, lon) {
        userAddressEl.textContent = 'Determining address...';
        locationDetails.classList.remove('hidden');
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            userAddressEl.textContent = data.display_name || "Address could not be determined.";
        } catch (error) {
            userAddressEl.textContent = "Could not connect to address service.";
        }
    }

    if (findLocationBtn) {
        findLocationBtn.addEventListener('click', () => {
            mapStatus.innerHTML = '<div class="spinner"></div><span>Finding your location...</span>';
            locationDetails.classList.add('hidden');
            serviceSelection.classList.add('hidden');

            if ('geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude, accuracy } = position.coords;
                        updateMapPosition(latitude, longitude, accuracy);
                    },
                    (error) => {
                        mapStatus.textContent = '';
                        alert(`ERROR(${error.code}): ${error.message}`);
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 30000,
                        maximumAge: 0
                    }
                );
            } else {
                mapStatus.textContent = '';
                alert('Sorry, your browser does not support Geolocation.');
            }
        });
    }

    // Welcome message
    const welcomeMessage = document.getElementById('welcome-message');
    if (welcomeMessage) {
        welcomeMessage.textContent = 'Welcome, red!';
    }
}); 