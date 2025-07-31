// This tells the browser that we will handle scroll restoration manually
if (history.scrollRestoration) {
  history.scrollRestoration = 'manual';
}

document.addEventListener('DOMContentLoaded', function () {

  window.scrollTo(0, 0);

  // --- Element References ---
  const map = L.map('map').setView([20.5937, 78.9629], 5);
  const findLocationBtn = document.getElementById('find-location-btn');
  const mapStatus = document.getElementById('map-status');
  const locationDetails = document.getElementById('location-details');
  const userAddressEl = document.getElementById('user-address');
  const serviceSelection = document.getElementById('service-selection');
  const modal = document.getElementById('popup-modal');
  const closeModalBtn = document.getElementById('modal-close');
  const mapLoadingOverlay = document.getElementById('map-loading-overlay');
  const mapContainer = document.querySelector('.map-container');

  // --- Map & Marker Variables ---
  let userMarker, accuracyCircle;

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  function updateMapPosition(lat, lon, accuracy) {
    const latLng = [lat, lon];
    mapStatus.textContent = `Location found with an accuracy of ${Math.round(accuracy)} meters.`;

    if (!userMarker) {
      userMarker = L.marker(latLng).addTo(map);
      accuracyCircle = L.circle(latLng, { radius: accuracy }).addTo(map);
    } else {
      userMarker.setLatLng(latLng);
      accuracyCircle.setLatLng(latLng).setRadius(accuracy);
    }

    userMarker.bindPopup(`<b>Your Location</b><br>Accuracy: ~${Math.round(accuracy)} meters`).openPopup();
    map.fitBounds(accuracyCircle.getBounds());

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

  findLocationBtn.addEventListener('click', () => {
    // Show loading state
    findLocationBtn.classList.add('loading');
    findLocationBtn.textContent = 'Finding Location...';
    mapStatus.innerHTML = '<div class="spinner"></div><span>Finding your location...</span>';
    locationDetails.classList.add('hidden');
    serviceSelection.classList.add('hidden');

    if ('geolocation' in navigator) {
      // --- UPDATED to use getCurrentPosition for a one-time request ---
      navigator.geolocation.getCurrentPosition(
        // Success callback
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          updateMapPosition(latitude, longitude, accuracy);
          // Hide loading state
          findLocationBtn.classList.remove('loading');
          findLocationBtn.textContent = 'Find My Location';
        },
        // Error callback
        (error) => {
          mapStatus.textContent = '';
          findLocationBtn.classList.remove('loading');
          findLocationBtn.textContent = 'Find My Location';
          if (error.code === 3) { // Error code 3 is a timeout
            alert("Could not get your location within 10 seconds. Please try again.");
          } else {
            alert(`ERROR(${error.code}): ${error.message}`);
          }
        },
        // Options
        {
          enableHighAccuracy: true,
          timeout: 30000, // Stop trying after 30 seconds
          maximumAge: 0
        }
      );
    } else {
      mapStatus.textContent = '';
      findLocationBtn.classList.remove('loading');
      findLocationBtn.textContent = 'Find My Location';
      alert('Sorry, your browser does not support Geolocation.');
    }
  });


  // --- Modal Functionality ---
  const openModalHandler = (event) => {
    event.preventDefault();
    if (modal) modal.classList.add('is-visible');
  };
  const closeModal = () => {
    if (modal) modal.classList.remove('is-visible');
  };
  function setupLoginRequiredTriggers() {
    const loginRequiredElements = document.querySelectorAll('.login-required');
    loginRequiredElements.forEach(element => {
      element.removeEventListener('click', openModalHandler);
      element.addEventListener('click', openModalHandler);
    });
  }
  setupLoginRequiredTriggers();
  findLocationBtn.addEventListener('click', () => {
    setTimeout(setupLoginRequiredTriggers, 100);
  });
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', (event) => {
      if (event.target === event.currentTarget) closeModal();
    });
  }
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('is-visible')) {
      closeModal();
    }
  });



});