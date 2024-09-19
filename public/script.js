let map;
let markers = [];

document.addEventListener('DOMContentLoaded', function() {
    console.log("Website loaded");

    // questionnaire on refresh
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
        map = L.map('map').setView([36.789, -121.804], 10);

        // Add a tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        const apiUrl = '/api/markers';

        // Load existing markers
        loadMarkers();

        // Check if there's a lastSubmittedMarker and add it
        if (window.lastSubmittedMarker) {
            addSubmittedMarker(window.lastSubmittedMarker);
        }

        function populateMediaSections(markers) {
            const sections = {
                'CTD': document.querySelector('#ctd-data .media-container'),
                'ROV': document.querySelector('#rov-videos .media-container'),
                'Plankton Tow': document.querySelector('#plankton-images .media-container'),
                'Echosounder': document.querySelector('#echosounder-data .media-container'),
                'Other': document.querySelector('#other-data .media-container')
            };
        
            // Clear existing content
            Object.values(sections).forEach(section => section.innerHTML = '');
        
            markers.forEach(marker => {
                if (marker.media && marker.media.length > 0) {
                    const section = sections[marker.activity];
                    if (section) {
                        marker.media.forEach(mediaUrl => {
                            if (mediaUrl.match(/\.(jpeg|jpg|gif|png)$/i)) {
                                section.innerHTML += `<img src="${mediaUrl}" alt="Image from ${marker.activity}" class="media-item">`;
                            } else if (mediaUrl.match(/\.(mp4|webm|ogg)$/i)) {
                                section.innerHTML += `
                                    <video controls class="media-item">
                                        <source src="${mediaUrl}" type="video/${mediaUrl.split('.').pop().toLowerCase()}">
                                        Your browser does not support the video tag.
                                    </video>
                                `;
                            }
                        });
                    }
                }
            });
        }

        async function loadMarkers() {
            try {
                console.log('Loading markers...');
                const response = await fetch(apiUrl);
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
                const markerData = await response.json();
                console.log('Marker data received:', markerData);
                
                markerData.forEach((data) => {
                    if (data && typeof data.lat === 'number' && typeof data.lng === 'number') {
                        addMarkerToMap(data);
                    } else {
                        console.error('Invalid marker data:', data);
                    }
                });
                
                // Populate media sections
                populateMediaSections(markerData);
                
                console.log('Markers loading complete');
            } catch (error) {
                console.error('Error loading markers:', error);
            }
        }
        
        function addMarkerToMap(data) {
            const isNewMarker = window.lastSubmittedMarker && 
                                data._id === window.lastSubmittedMarker._id;
            
            const marker = L.marker([data.lat, data.lng], {
                icon: L.icon({
                    iconUrl: isNewMarker ? 
                        'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png' : 
                        'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                })
            }).addTo(map);
        
            // Add a label to the marker
            // Updated label creation
            const label = L.divIcon({
                className: 'marker-label',
                html: `<div>${data.label || data.activity}</div>`,
                iconSize: null
            });
            L.marker([data.lat, data.lng], { icon: label, zIndexOffset: 1000 }).addTo(map);

            marker.bindPopup(createPopupContent(data));
            marker.on('click', () => showMarkerDetails(data, marker));
            markers.push({ marker: marker, id: data._id });
        
            if (isNewMarker) {
                map.setView([data.lat, data.lng], 10);
                showMarkerDetails(data, marker);
                window.lastSubmittedMarker = null;
            }
        }


        // Function to create popup content
        function createPopupContent(data) {
            return `
                <b>Location:</b> ${data.lat}, ${data.lng}<br>
                <b>Time:</b> ${data.startTime || 'N/A'}<br>
                <b>Activity:</b> ${data.activity || 'N/A'}<br>
                <b>Depth:</b> ${data.depth ? data.depth + ' m' : 'N/A'}
            `;
        }

        // Function to show marker details
        function showMarkerDetails(data, markerObj) {
            const detailsDiv = document.getElementById('marker-details');
            const contentDiv = document.getElementById('marker-details-content');
            
            contentDiv.innerHTML = `
                <h3>Marker Details</h3>
                <p><b>Label:</b> ${data.label || data.activity}</p>
                <p><b>Location:</b> ${data.lat}, ${data.lng}</p>
                <p><b>Start Time:</b> ${data.startTime || 'N/A'}</p>
                <p><b>End Time:</b> ${data.endTime || 'N/A'}</p>
                <p><b>Depth:</b> ${data.depth ? data.depth + ' m' : 'N/A'}</p>
                <p><b>Activity:</b> ${data.activity || 'N/A'}</p>
                ${data.otherActivity ? `<p><b>Other Activity:</b> ${data.otherActivity}</p>` : ''}
                <p><b>Notes:</b> ${data.notes || 'N/A'}</p>
            `;
        
            if (data.fileLink) {
                contentDiv.innerHTML += `<p><b>File Link:</b> <a href="${data.fileLink}" target="_blank">View File</a></p>`;
            }
        
            // Display uploaded media
            if (data.media && data.media.length > 0) {
                contentDiv.innerHTML += '<h4>Uploaded Media:</h4>';
                data.media.forEach(mediaUrl => {
                    if (mediaUrl.toLowerCase().match(/\.(jpeg|jpg|gif|png)$/)) {
                        contentDiv.innerHTML += `<img src="${mediaUrl}" alt="Uploaded image" style="max-width: 100%; height: auto;">`;
                    } else if (mediaUrl.toLowerCase().match(/\.(mp4|webm|ogg)$/)) {
                        contentDiv.innerHTML += `
                            <video controls style="max-width: 100%; height: auto;">
                                <source src="${mediaUrl}" type="video/${mediaUrl.split('.').pop().toLowerCase()}">
                                Your browser does not support the video tag.
                            </video>
                        `;
                    } else {
                        contentDiv.innerHTML += `<p>Unsupported media type: <a href="${mediaUrl}" target="_blank">View File</a></p>`;
                    }
                });
            }
        
            contentDiv.innerHTML += `
                <button id="edit-marker-btn">Edit Marker</button>
                <button id="delete-marker-btn">Delete Marker</button>
            `;
        
            document.getElementById('edit-marker-btn').addEventListener('click', () => showEditMarkerForm(data));
            document.getElementById('delete-marker-btn').addEventListener('click', () => deleteMarker(data._id, markerObj));
        
            detailsDiv.style.display = 'block';
        }
        

        // Function to delete a marker
        window.deleteMarker = async function(markerId) {
            if (confirm('Are you sure you want to delete this marker?')) {
                console.log('Attempting to delete marker with ID:', markerId);
                try {
                    const response = await fetch(`/api/markers/${markerId}`, {
                        method: 'DELETE'
                    });
        
                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
                    }
        
                    const markerIndex = markers.findIndex(m => m.id === markerId);
                    console.log('Marker index in local array:', markerIndex);
                    if (markerIndex !== -1) {
                        const markerToRemove = markers[markerIndex].marker;
                        map.removeLayer(markerToRemove);
                        markers.splice(markerIndex, 1);
                        console.log('Marker removed from map and local array');
                    } else {
                        console.error('Marker not found in local array:', markerId);
                    }
        
                    document.getElementById('marker-details').style.display = 'none';
        
                    // Force a map update
                    map.invalidateSize();
        
                    console.log('Marker deleted successfully');
                } catch (error) {
                    console.error('Detailed error deleting marker:', error);
                    alert('Error deleting marker. Please try again.');
                }
            }
        };

        // Function to add the submitted marker
        function addSubmittedMarker(data) {
            const marker = L.marker([data.lat, data.lng], {
                icon: L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                })
            }).addTo(map);
        
            marker.bindPopup(createPopupContent(data));
            marker.on('click', () => showMarkerDetails(data, marker));  // Pass the marker object
        
            // Ensure the marker has an _id property
            if (!data._id) {
                console.error('Marker data is missing _id:', data);
                return;
            }
        
            markers.push({ marker: marker, id: data._id });
            map.setView([data.lat, data.lng], 10);
        
            // Show marker details
            showMarkerDetails(data, marker);  // Pass the marker object
        
            // Clear the lastSubmittedMarker
            window.lastSubmittedMarker = null;
        }

        // Event listener for form submission
        document.getElementById('add-marker-form').addEventListener('submit', addMarker);

        
        // Function to add a marker
        async function addMarker(e) {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            try {
                const response = await fetch('/api/markers', {
                    method: 'POST',
                    body: formData
                });
        
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorData.error}`);
                }
        
                const markerData = await response.json();
                console.log('New marker added:', markerData);
        
                addMarkerToMap(markerData);
                map.setView([markerData.lat, markerData.lng], 10);
                showMarkerDetails(markerData);

                // Refresh media sections
                const allMarkers = await (await fetch('/api/markers')).json();
                populateMediaSections(allMarkers);

                e.target.reset();
        
            } catch (error) {
                console.error('Error adding marker:', error);
                alert('Error adding marker: ' + error.message);
            }
        }

        function showEditMarkerForm(data) {
            const contentDiv = document.getElementById('marker-details-content');
            contentDiv.innerHTML = `
                <h3>Edit Marker</h3>
                <form id="edit-marker-form">
                    <input type="hidden" name="id" value="${data._id}">
                    <label for="edit-label">Label:</label>
                    <input type="text" id="edit-label" name="label" value="${data.label}" step="any" required>
                    <p><label for="edit-lat">Latitude:</label>
                    <input type="number" id="edit-lat" name="lat" value="${data.lat}" step="any" required></p>
                    <p><label for="edit-lng">Longitude:</label>
                    <input type="number" id="edit-lng" name="lng" value="${data.lng}" step="any" required></p>
                    <p><label for="edit-start-time">Start Time:</label>
                    <input type="datetime-local" id="edit-start-time" name="startTime" value="${data.startTime || ''}"></p>
                    <p><label for="edit-end-time">End Time:</label>
                    <input type="datetime-local" id="edit-end-time" name="endTime" value="${data.endTime || ''}"></p>
                    <p><label for="edit-depth">Depth (m):</label>
                    <input type="number" id="edit-depth" name="depth" value="${data.depth || ''}" step="any"></p>
                    <p><label for="edit-activity">Activity:</label>
                    <select id="edit-activity" name="activity">
                        <option value="CTD" ${data.activity === 'CTD' ? 'selected' : ''}>CTD</option>
                        <option value="ROV" ${data.activity === 'ROV' ? 'selected' : ''}>ROV</option>
                        <option value="Plankton Tow" ${data.activity === 'Plankton Tow' ? 'selected' : ''}>Plankton Tow</option>
                        <option value="Echosounder" ${data.activity === 'Echosounder' ? 'selected' : ''}>Echosounder</option>
                        <option value="Other" ${data.activity === 'Other' ? 'selected' : ''}>Other</option>
                    </select>
                    <input type="text" id="edit-other-activity" name="otherActivity" value="${data.otherActivity || ''}" placeholder="Describe other activity" style="display: ${data.activity === 'Other' ? 'block' : 'none'};"></p>
                    <p><label for="edit-notes">Notes:</label>
                    <textarea id="edit-notes" name="notes">${data.notes || ''}</textarea></p>
                    <p><label for="edit-file-link">File Link:</label>
                    <input type="url" id="edit-file-link" name="fileLink" value="${data.fileLink || ''}"></p>
                    <p><button type="submit">Save Changes</button></p>
                </form>
            `;
        
            document.getElementById('edit-activity').addEventListener('change', function() {
                document.getElementById('edit-other-activity').style.display = this.value === 'Other' ? 'block' : 'none';
            });
        
            document.getElementById('edit-marker-form').addEventListener('submit', updateMarker);
        }

        async function updateMarker(e) {
            e.preventDefault();
            const formData = new FormData(e.target);
            const markerId = formData.get('id');
        
            try {
                const response = await fetch(`/api/markers/${markerId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(Object.fromEntries(formData)),
                });
        
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorData.error}`);
                }
        
                const updatedMarkerData = await response.json();
                console.log('Marker updated:', updatedMarkerData);
        
                // Update the marker on the map and in the local array
                const markerIndex = markers.findIndex(m => m.id === markerId);
                if (markerIndex !== -1) {
                    const marker = markers[markerIndex].marker;
                    
                    // Update marker position
                    marker.setLatLng([updatedMarkerData.lat, updatedMarkerData.lng]);
                    
                    // Update popup content
                    const newPopupContent = createPopupContent(updatedMarkerData);
                    marker.setPopupContent(newPopupContent);
                    
                    // Update the marker data in the local array
                    markers[markerIndex] = { ...markers[markerIndex], ...updatedMarkerData };
        
                    // Refresh the marker details display
                    showMarkerDetails(updatedMarkerData, marker);
                }
        
                // Refresh the map
                map.invalidateSize();
        
                // Refresh media sections
                const allMarkers = await (await fetch('/api/markers')).json();
                populateMediaSections(allMarkers);
        
            } catch (error) {
                console.error('Error updating marker:', error);
                alert('Error updating marker: ' + error.message);
            }
        }

    }
    window.startQuestionnaire = startQuestionnaire;
    window.showMainContent = showMainContent;
});