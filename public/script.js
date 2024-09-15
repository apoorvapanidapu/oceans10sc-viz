// Example script to log CTD data (this could later fetch data from a CSV file)
document.addEventListener('DOMContentLoaded', function() {
    console.log("Website loaded");

    // Later, this can be replaced with dynamic data fetching and visualization
    const ctdData = [
        { depth: 10, temperature: 12.3, salinity: 35.1 },
        { depth: 20, temperature: 12.0, salinity: 35.2 },
        // more data points...
    ];

    console.log(ctdData);
});

// Initialize the map and set its view to Monterey Bay with a specific zoom level
var map = L.map('map').setView([36.6002, -121.8947], 9);

// Add a tile layer (this example uses OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

const apiUrl = 'https://oceans10sc-workspace.vercel.app/api/markers'; // Use the correct API URL

// Array to hold marker references
var markers = [];

async function addMarker() {
    const lat = parseFloat(document.getElementById("lat").value);
    const lng = parseFloat(document.getElementById("lng").value);

    console.log(`Adding marker at latitude: ${lat}, longitude: ${lng}`); // Debug log

    if (lat && lng) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ lat, lng })
            });

            console.log(`API response status: ${response.status}`); // Debug log

            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

            const markerData = await response.json();
            console.log('Marker data:', markerData); // Debug log

            const marker = L.marker([lat, lng]).addTo(map);

            marker.bindPopup(`
                <b>Location:</b> ${lat}, ${lng}<br>
                <b>CTD Data:</b> Temp, Salinity, etc.<br>
                <b>ROV Video:</b> <a href='video_link'>Watch</a><br>
                <b>Plankton:</b> <img src='plankton_image_url' width="100"><br>
                <button onclick="deleteMarker('${markerData._id}')">Delete Marker</button>
            `).openPopup();

            markers.push({ ...marker, _id: markerData._id });
            map.setView([lat, lng], 10);

        } catch (error) {
            console.error('Error adding marker:', error);
        }
    } else {
        alert("Please enter valid GPS coordinates.");
    }
}

async function loadMarkers() {
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const markerData = await response.json();
        markerData.forEach(data => {
            const marker = L.marker([data.lat, data.lng]).addTo(map);

            marker.bindPopup(`
                <b>Location:</b> ${data.lat}, ${data.lng}<br>
                <b>CTD Data:</b> Temp, Salinity, etc.<br>
                <b>ROV Video:</b> <a href='video_link'>Watch</a><br>
                <b>Plankton:</b> <img src='plankton_image_url' width="100"><br>
                <button onclick="deleteMarker('${data._id}')">Delete Marker</button>
            `).openPopup();

            markers.push({ ...marker, _id: data._id });
        });

    } catch (error) {
        console.error('Error loading markers:', error);
    }
}

async function deleteMarker(id) {
    try {
        await fetch(`${apiUrl}/${id}`, {
            method: 'DELETE'
        });

        // Remove the marker from the map
        const markerIndex = markers.findIndex(marker => marker._id === id);
        if (markerIndex !== -1) {
            map.removeLayer(markers[markerIndex]);
            markers.splice(markerIndex, 1);
        }

    } catch (error) {
        console.error('Error deleting marker:', error);
    }
}

// Load existing markers when the page loads
document.addEventListener('DOMContentLoaded', loadMarkers);
