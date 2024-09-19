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

// Add this line at the top of your file
window.lastSubmittedMarker = null;

document.getElementById('next-button').addEventListener('click', nextQuestion);
document.getElementById('submit-button').addEventListener('click', submitQuestionnaire);
document.getElementById('back-button').addEventListener('click', previousQuestion);

function showQuestion(index) {
    const question = questions[index];
    document.getElementById('question-title').textContent = question.title;
    const content = document.getElementById('question-content');
    content.innerHTML = '';

    switch(question.type) {
        case 'gps':
            content.innerHTML = `
                <input type="number" id="latitude" placeholder="Latitude" required step="any" value="${answers.lat || ''}">
                <input type="number" id="longitude" placeholder="Longitude" required step="any" value="${answers.lng || ''}">
            `;
            break;
        case 'timeDepth':
            content.innerHTML = `
                <input type="datetime-local" id="start-time" placeholder="Start Time" value="${answers.startTime || ''}">
                <input type="datetime-local" id="end-time" placeholder="End Time" value="${answers.endTime || ''}">
                <input type="number" id="depth" placeholder="Depth (meters)" step="any" value="${answers.depth || ''}">
            `;
            break;
        case 'activity':
            content.innerHTML = `
                <select id="activity">
                    <option value="CTD" ${answers.activity === 'CTD' ? 'selected' : ''}>CTD</option>
                    <option value="ROV" ${answers.activity === 'ROV' ? 'selected' : ''}>ROV</option>
                    <option value="Plankton Tow" ${answers.activity === 'Plankton Tow' ? 'selected' : ''}>Plankton Tow</option>
                    <option value="Echosounder" ${answers.activity === 'Echosounder' ? 'selected' : ''}>Echosounder</option>
                    <option value="Other" ${answers.activity === 'Other' ? 'selected' : ''}>Other</option>
                </select>
                <input type="text" id="other-activity" placeholder="Describe other activity" style="display: none;" value="${answers.otherActivity || ''}">
                <input type="file" id="media-upload" multiple accept="image/*,video/*">
                <input type="url" id="file-link" placeholder="Enter file link (optional)" value="${answers.fileLink || ''}">
            `;
            document.getElementById('activity').addEventListener('change', function() {
                document.getElementById('other-activity').style.display = this.value === 'Other' ? 'block' : 'none';
            });
            if (answers.activity === 'Other') {
                document.getElementById('other-activity').style.display = 'block';
            }
            break;
        case 'notes':
            content.innerHTML = `
                <textarea id="notes" rows="4" cols="50" placeholder="Enter any additional notes">${answers.notes || ''}</textarea>
            `;
            break;
    }

    document.getElementById('back-button').style.display = index > 0 ? 'inline-block' : 'none';
    document.getElementById('next-button').style.display = index < questions.length - 1 ? 'inline-block' : 'none';
    document.getElementById('submit-button').style.display = index === questions.length - 1 ? 'inline-block' : 'none';
}

function previousQuestion() {
    if (currentQuestion > 0) {
        saveAnswer(currentQuestion);
        currentQuestion--;
        showQuestion(currentQuestion);
    }
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
            case 'timeDepth':
                const startTime = document.getElementById('start-time').value;
                const endTime = document.getElementById('end-time').value;
                if (startTime && endTime && startTime >= endTime) {
                    alert('Please enter valid start/end time.');
                    return false;
                }
                break;
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
            answers.depth = document.getElementById('depth').value ? parseFloat(document.getElementById('depth').value) : null;
            break;
        case 'activity':
            answers.activity = document.getElementById('activity').value;
            if (answers.activity === 'Other') {
                answers.otherActivity = document.getElementById('other-activity').value;
            }
            answers.media = document.getElementById('media-upload').files;
            answers.fileLink = document.getElementById('file-link').value;
            break;
        case 'notes':
            answers.notes = document.getElementById('notes').value;
            break;
    }
}

// Modify the submitQuestionnaire function
function submitQuestionnaire() {
    if (validateQuestion(currentQuestion)) {
        saveAnswer(currentQuestion);
        
        const formData = new FormData();
        for (let key in answers) {
            if (key === 'media') {
                for (let i = 0; i < answers.media.length; i++) {
                    formData.append('media', answers.media[i]);
                }
            } else {
                formData.append(key, answers[key] !== null ? answers[key] : '');
            }
        }

        fetch('/api/markers', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    console.error('Server response:', text);
                    throw new Error(text || `HTTP error! Status: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Success:', data);
            localStorage.setItem('questionnaireCompleted', 'true');
            
            // Store the submitted marker data
            window.lastSubmittedMarker = data;
            
            showMainContent();
        })
        .catch((error) => {
            console.error('Error object:', error);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            alert('An error occurred: ' + error.message);
        });
    }
}

// Make sure to expose necessary functions to the global scope
window.submitQuestionnaire = submitQuestionnaire;

// Start with the first question
showQuestion(0);