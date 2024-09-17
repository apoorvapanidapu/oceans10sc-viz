// questionnaire.js
const questions = [
    {
        title: "Enter GPS coordinates:",
        type: "gps",
        required: true
    },
    {
        title: "Enter Time and Depth:",
        type: "timeDepth",
        required: false
    },
    {
        title: "Select Activity:",
        type: "activity",
        required: false
    },
    {
        title: "Additional Notes:",
        type: "notes",
        required: false
    }
];

let currentQuestion = 0;
let answers = {};

document.getElementById('yes-button').addEventListener('click', startQuestionnaire);
document.getElementById('no-button').addEventListener('click', skipToMap);
document.getElementById('next-button').addEventListener('click', nextQuestion);
document.getElementById('submit-button').addEventListener('click', submitQuestionnaire);

function startQuestionnaire() {
    document.getElementById('initial-screen').style.display = 'none';
    document.getElementById('questionnaire').style.display = 'block';
    showQuestion(currentQuestion);
}

function skipToMap() {
    window.location.href = 'index.html';
}

function showQuestion(index) {
    const question = questions[index];
    document.getElementById('question-title').textContent = question.title;
    const content = document.getElementById('question-content');
    content.innerHTML = '';

    switch(question.type) {
        case 'gps':
            content.innerHTML = `
                <input type="number" id="latitude" placeholder="Latitude" required step="any">
                <input type="number" id="longitude" placeholder="Longitude" required step="any">
            `;
            break;
        case 'timeDepth':
            content.innerHTML = `
                <input type="datetime-local" id="start-time" placeholder="Start Time">
                <input type="datetime-local" id="end-time" placeholder="End Time">
                <input type="number" id="depth" placeholder="Depth (meters)" step="any">
            `;
            break;
        case 'activity':
            content.innerHTML = `
                <select id="activity">
                    <option value="CTD">CTD</option>
                    <option value="ROV">ROV</option>
                    <option value="Plankton Tow">Plankton Tow</option>
                    <option value="Other">Other</option>
                </select>
                <input type="text" id="other-activity" placeholder="Describe other activity" style="display: none;">
                <input type="file" id="media-upload" multiple accept="image/*,video/*">
            `;
            document.getElementById('activity').addEventListener('change', function() {
                document.getElementById('other-activity').style.display = this.value === 'Other' ? 'block' : 'none';
            });
            break;
        case 'notes':
            content.innerHTML = `
                <textarea id="notes" rows="4" cols="50" placeholder="Enter any additional notes"></textarea>
            `;
            break;
    }

    document.getElementById('next-button').style.display = index < questions.length - 1 ? 'inline' : 'none';
    document.getElementById('submit-button').style.display = index === questions.length - 1 ? 'inline' : 'none';
}

function nextQuestion() {
    if (validateQuestion(currentQuestion)) {
        saveAnswer(currentQuestion);
        currentQuestion++;
        showQuestion(currentQuestion);
    }
}

function validateQuestion(index) {
    const question = questions[index];
    if (question.required) {
        switch(question.type) {
            case 'gps':
                const lat = document.getElementById('latitude').value;
                const lon = document.getElementById('longitude').value;
                if (!lat || !lon) {
                    alert('Please enter both latitude and longitude.');
                    return false;
                }

                if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
                    alert('Please enter valid GPS coordinates.');
                    return false;
                }
                break;
            // Add other validations as needed
        }
    }
    return true;
}

function saveAnswer(index) {
    const question = questions[index];
    switch(question.type) {
        case 'gps':
            answers.lat = parseFloat(document.getElementById('latitude').value);
            answers.lng = parseFloat(document.getElementById('longitude').value);
            break;
        case 'timeDepth':
            answers.startTime = document.getElementById('start-time').value;
            answers.endTime = document.getElementById('end-time').value;
            answers.depth = parseFloat(document.getElementById('depth').value);
            break;
        case 'activity':
            answers.activity = document.getElementById('activity').value;
            if (answers.activity === 'Other') {
                answers.otherActivity = document.getElementById('other-activity').value;
            }
            answers.media = document.getElementById('media-upload').files;
            break;
        case 'notes':
            answers.notes = document.getElementById('notes').value;
            break;
    }
}

function submitQuestionnaire() {
    if (validateQuestion(currentQuestion)) {
        saveAnswer(currentQuestion);
        
        // Create a FormData object to send files
        const formData = new FormData();
        for (let key in answers) {
            if (key === 'media') {
                for (let i = 0; i < answers.media.length; i++) {
                    formData.append('media', answers.media[i]);
                }
            } else {
                formData.append(key, answers[key]);
            }
        }

        // Send the data to the server
        fetch('/api/markers', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error(text || `HTTP error! Status: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Success:', data);
            sessionStorage.setItem('questionnaireCompleted', 'true');
            window.location.href = 'index.html';
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('An error occurred: ' + error.message);
        });
    }
}

// Start with the first question
showQuestion(0);