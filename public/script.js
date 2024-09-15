document.addEventListener('DOMContentLoaded', function() {
    console.log("Website loaded");

    // Initialize the map and set its view to Monterey Bay
    var map = L.map('map').setView([36.6002, -121.8947], 9);

    // Add a tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const apiUrl = '/api/markers';

    // Array to hold marker references
    var markers = [];

    // Function to add a marker
    async function addMarker(e) {
        e.preventDefault();
        const lat = parseFloat(document.getElementById("lat").value);
        const lng = parseFloat(document.getElementById("lng").value);

        if (isNaN(lat) || isNaN(lng)) {
            alert("Please enter valid GPS coordinates.");
            return;
        }

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ lat, lng })
            });

            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

            const markerData = await response.json();
            const marker = L.marker([lat, lng]).addTo(map);

            marker.bindPopup(createPopupContent(markerData));

            markers.push({ marker, id: markerData._id });
            map.setView([lat, lng], 10);

        } catch (error) {
            console.error('Error adding marker:', error);
            alert('Error adding marker. Please try again.');
        }
    }

    // Load existing markers when the page loads
    loadMarkers();

    async function loadMarkers() {
        try {
            console.log('Loading markers...');
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    
            const markerData = await response.json();
            console.log('Marker data received:', markerData);
            
            markerData.forEach((data, index) => {
                console.log(`Processing marker ${index}:`, data);
                if (data && typeof data.lat === 'number' && typeof data.lng === 'number') {
                    const marker = L.marker([data.lat, data.lng]).addTo(map);
                    marker.bindPopup(createPopupContent(data));
                    markers.push({ marker, id: data._id });
                    console.log(`Marker ${index} added successfully`);
                } else {
                    console.error(`Invalid marker data for index ${index}:`, data);
                }
            });
            
            console.log('Markers loading complete');
        } catch (error) {
            console.error('Error loading markers:', error);
        }
    }

    // Function to create popup content
    function createPopupContent(data) {
        return `
            <b>Location:</b> ${data.lat}, ${data.lng}<br>
            <b>CTD Data:</b> Temp, Salinity, etc.<br>
            <b>ROV Video:</b> <a href='#'>Watch</a><br>
            <b>Plankton:</b> <img src='#' alt='Plankton' width="100"><br>
            <button onclick="deleteMarker('${data._id}')">Delete Marker</button>
        `;
    }

    // Function to delete a marker
    window.deleteMarker = async function(id) {
        try {
            const response = await fetch(`${apiUrl}/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

            // Remove the marker from the map and the markers array
            const markerIndex = markers.findIndex(m => m.id === id);
            if (markerIndex !== -1) {
                map.removeLayer(markers[markerIndex].marker);
                markers.splice(markerIndex, 1);
            }

            console.log('Marker deleted successfully');

        } catch (error) {
            console.error('Error deleting marker:', error);
            alert('Error deleting marker. Please try again.');
        }
    }

    // Event listener for form submission
    document.getElementById('add-marker-form').addEventListener('submit', addMarker);

});