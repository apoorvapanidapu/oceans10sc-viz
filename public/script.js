document.addEventListener('DOMContentLoaded', function() {
    console.log("Website loaded");

    // Check if the user has already gone through the questionnaire
    if (!sessionStorage.getItem('questionnaireCompleted')) {
        document.getElementById('initial-screen').style.display = 'flex';
        document.getElementById('main-content').style.display = 'none';
    } else {
        showMainContent();
    }

    document.getElementById('yes-button').addEventListener('click', startQuestionnaire);
    document.getElementById('no-button').addEventListener('click', showMainContent);

    function startQuestionnaire() {
        document.getElementById('initial-screen').style.display = 'none';
        document.getElementById('questionnaire').style.display = 'flex';
        showQuestion(0);
    }

    function showMainContent() {
        document.getElementById('initial-screen').style.display = 'none';
        document.getElementById('questionnaire').style.display = 'none';
        document.getElementById('main-content').style.display = 'block';
        initializeMap();
        
        // Set the questionnaire as completed to prevent it from showing again
        sessionStorage.setItem('questionnaireCompleted', 'true');
    }

    function initializeMap() {
        // Initialize the map and set its view to Monterey Bay
        var map = L.map('map').setView([36.6002, -121.8947], 9);

        // Add a tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        const apiUrl = '/api/markers';

        // Array to hold marker references
        var markers = [];

        // Load existing markers
        loadMarkers();

        async function loadMarkers() {
            try {
                console.log('Loading markers...');
                const response = await fetch(apiUrl);
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
                const markerData = await response.json();
                console.log('Marker data received:', markerData);
                
                markerData.forEach((data) => {
                    if (data && typeof data.lat === 'number' && typeof data.lng === 'number') {
                        const marker = L.marker([data.lat, data.lng]).addTo(map);
                        marker.bindPopup(createPopupContent(data));
                        marker.on('click', () => showMarkerDetails(data));
                        markers.push({ marker, id: data._id });
                    } else {
                        console.error('Invalid marker data:', data);
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
                <b>Start Time:</b> ${data.startTime || 'N/A'}<br>
                <b>Activity:</b> ${data.activity || 'N/A'}<br>
                <b>Depth:</b> ${data.depth ? data.depth + ' m' : 'N/A'}
            `;
        }

        // Function to show marker details
        function showMarkerDetails(data) {
            const detailsDiv = document.getElementById('marker-details');
            const contentDiv = document.getElementById('marker-details-content');
            contentDiv.innerHTML = `
                <p><b>Location:</b> ${data.lat}, ${data.lng}</p>
                <p><b>Start Time:</b> ${data.startTime || 'N/A'}</p>
                <p><b>End Time:</b> ${data.endTime || 'N/A'}</p>
                <p><b>Depth:</b> ${data.depth ? data.depth + ' m' : 'N/A'}</p>
                <p><b>Activity:</b> ${data.activity || 'N/A'}</p>
                ${data.otherActivity ? `<p><b>Other Activity:</b> ${data.otherActivity}</p>` : ''}
                <p><b>Notes:</b> ${data.notes || 'N/A'}</p>
            `;
            
            // Display uploaded media
            if (data.media && data.media.length > 0) {
                contentDiv.innerHTML += '<h3>Uploaded Media:</h3>';
                data.media.forEach(mediaPath => {
                    if (mediaPath.match(/\.(jpeg|jpg|gif|png)$/)) {
                        contentDiv.innerHTML += `<img src="${mediaPath}" alt="Uploaded image" style="max-width: 100%; height: auto;">`;
                    } else if (mediaPath.match(/\.(mp4|webm|ogg)$/)) {
                        contentDiv.innerHTML += `
                            <video controls style="max-width: 100%; height: auto;">
                                <source src="${mediaPath}" type="video/${mediaPath.split('.').pop()}">
                                Your browser does not support the video tag.
                            </video>
                        `;
                    }
                });
            }

            detailsDiv.style.display = 'block';
        }

        // Event listener for form submission
        document.getElementById('add-marker-form').addEventListener('submit', addMarker);

        // Function to add a marker
        async function addMarker(e) {
            e.preventDefault();
            const lat = parseFloat(document.getElementById("lat").value);
            const lng = parseFloat(document.getElementById("lng").value);

            if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
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
                marker.on('click', () => showMarkerDetails(markerData));

                markers.push({ marker, id: markerData._id });
                map.setView([lat, lng], 10);

            } catch (error) {
                console.error('Error adding marker:', error);
                alert('Error adding marker. Please try again.');
            }
        }
    }
});