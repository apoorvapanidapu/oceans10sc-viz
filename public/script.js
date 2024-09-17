document.addEventListener('DOMContentLoaded', function() {
    console.log("Website loaded");

    // Check if the user has already gone through the questionnaire
    showInitialScreen();

    document.getElementById('yes-button').addEventListener('click', startQuestionnaire);
    document.getElementById('no-button').addEventListener('click', showMainContent);

    function showInitialScreen() {
        document.getElementById('initial-screen').style.display = 'flex';
        document.getElementById('questionnaire').style.display = 'none';
        document.getElementById('main-content').style.display = 'none';
    }

    function startQuestionnaire() {
        document.getElementById('initial-screen').style.display = 'none';
        document.getElementById('questionnaire').style.display = 'flex';
        document.getElementById('main-content').style.display = 'none';
        showQuestion(0);
    }

    function showMainContent() {
        document.getElementById('initial-screen').style.display = 'none';
        document.getElementById('questionnaire').style.display = 'none';
        document.getElementById('main-content').style.display = 'block';
        initializeMap();
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
                <h3>Marker Details</h3>
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
                contentDiv.innerHTML += '<h4>Uploaded Media:</h4>';
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

            // Add delete button
            contentDiv.innerHTML += `
                <button onclick="deleteMarker('${data._id}')">Delete Marker</button>
            `;

            detailsDiv.style.display = 'block';
        }

        // Function to delete a marker
        window.deleteMarker = async function(markerId) {
            if (confirm('Are you sure you want to delete this marker?')) {
                try {
                    const response = await fetch(`/api/markers/${markerId}`, {
                        method: 'DELETE'
                    });

                    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

                    // Remove marker from the map
                    const markerIndex = markers.findIndex(m => m.id === markerId);
                    if (markerIndex !== -1) {
                        map.removeLayer(markers[markerIndex].marker);
                        markers.splice(markerIndex, 1);
                    }

                    // Hide marker details
                    document.getElementById('marker-details').style.display = 'none';

                    console.log('Marker deleted successfully');
                } catch (error) {
                    console.error('Error deleting marker:', error);
                    alert('Error deleting marker. Please try again.');
                }
            }
        };

        // Event listener for form submission
        document.getElementById('add-marker-form').addEventListener('submit', addMarker);

         // Function to add a marker
         async function addMarker(e) {
            e.preventDefault();
            const formData = new FormData(e.target);

            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

                const markerData = await response.json();
                const marker = L.marker([markerData.lat, markerData.lng], {
                    icon: L.icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowSize: [41, 41]
                    })
                }).addTo(map);

                marker.bindPopup(createPopupContent(markerData));
                marker.on('click', () => showMarkerDetails(markerData));

                markers.push({ marker, id: markerData._id });
                map.setView([markerData.lat, markerData.lng], 10);

                // Show marker details
                showMarkerDetails(markerData);

                // Clear the form after successful submission
                e.target.reset();

            } catch (error) {
                console.error('Error adding marker:', error);
                alert('Error adding marker. Please try again.');
            }
        }

    }
    window.startQuestionnaire = startQuestionnaire;
    window.showMainContent = showMainContent;
});