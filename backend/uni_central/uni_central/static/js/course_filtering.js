// import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
// import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

// const firebaseConfig = {
//     apiKey: "AIzaSyD0wF4R9GdY2m7eAwVL_j_mihLit4rRZ5Q",
//     authDomain: "unicentral-b6c23.firebaseapp.com",
//     projectId: "unicentral-b6c23",
//     storageBucket: "unicentral-b6c23.firebasestorage.app",
//     messagingSenderId: "554502030441",
//     appId: "1:554502030441:web:6dccab580dbcfdb974cef8",
//     measurementId: "G-M4L04508RH",
//     clientId: "554502030441-g68f3tti18fiip1hpr6ehn6q6u5sn8fh.apps.googleusercontent.com"
// };

// // Initialize Firebase only once
// const app = initializeApp(firebaseConfig);
// const auth = getAuth(app);

document.addEventListener('DOMContentLoaded', function() {
    const searchButton = document.querySelector('.search-button');
    if (searchButton) {
        searchButton.addEventListener('click', performSearch);
        console.log("Search button listener added");
    } else {
        console.error("Search button not found");
    }
});

async function performSearch() {
    // Get values from form inputs
    const filters = {
        department: document.querySelector('.school-input').value.trim(),
        title: document.querySelector('.subject-input').value.trim(),
        number: document.querySelector('.course-level-input').value,
        professor: document.querySelector('.professor-input').value.trim(),
        
        // Convert checkboxes to review query params
        mandatory_attendance: document.querySelector('.mandatory-attendance-input').checked,
        in_person: document.querySelector('.in-person-input').checked,
        online: document.querySelector('.online-input').checked,
        hybrid: document.querySelector('.hybrid-input').checked,
        required_course: document.querySelector('.required-course-input').checked,
        is_gened: document.querySelector('.gened-input').checked,
        no_exams: document.querySelector('.no-exams-input').checked,
        presentations: document.querySelector('.presenting-required-input').checked
    };

    // Remove empty/null/undefined values
    Object.keys(filters).forEach(key => {
        if (!filters[key] && filters[key] !== false) {
            delete filters[key];
        }
    });

    try {
        // Convert filters object to URL search params
        const queryString = new URLSearchParams(filters).toString();
        const response = await fetch(`/api/filter-courses/?${queryString}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const data = await response.json();
        displayResults(data);
    } catch (error) {
        console.error('Error:', error);
        displayError('An error occurred while searching for courses.');
    }
}

function displayResults(courses) {
    let resultsContainer = document.querySelector('.search-results');
    if (!resultsContainer) {
        resultsContainer = document.createElement('div');
        resultsContainer.className = 'search-results';
        document.querySelector('.main-content').appendChild(resultsContainer);
    }
    resultsContainer.innerHTML = '';

    if (courses.length === 0) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <p>No courses match your search criteria.</p>
            </div>
        `;
        return;
    }

    courses.forEach(course => {
        const courseCard = document.createElement('div');
        courseCard.className = 'course-card';
        courseCard.innerHTML = `
            <div class="course-info">
                <h2>${course.subject} ${course.number} ${course.title}</h2>
                
                <div class="course-details">
                    <p>Credits: ${course.credits}</p>
                    ${course.avg_rating ? `<p>Average Rating: ${course.avg_rating.toFixed(1)}/5.0</p>` : ''}
                    ${course.avg_difficulty ? `<p>Average Difficulty: ${course.avg_difficulty.toFixed(1)}/5.0</p>` : ''}
                    ${course.semester ? `<p>Semester: ${course.semester}</p>` : ''}
                    
                    <div class="course-attributes">
                        ${course.mandatory_attendance ? '<span class="attribute">Mandatory Attendance</span>' : ''}
                        ${course.in_person ? '<span class="attribute">In Person</span>' : ''}
                        ${course.online ? '<span class="attribute">Online</span>' : ''}
                        ${course.hybrid ? '<span class="attribute">Hybrid</span>' : ''}
                        ${course.required_course ? '<span class="attribute">Required</span>' : ''}
                        ${course.is_gened ? '<span class="attribute">GenEd</span>' : ''}
                        ${course.no_exams ? '<span class="attribute">No Exams</span>' : ''}
                        ${course.presentations ? '<span class="attribute">Presentations Required</span>' : ''}
                    </div>
                </div>
            </div>
        `;
        resultsContainer.appendChild(courseCard);
    });
}

function displayError(message) {
    let resultsContainer = document.querySelector('.search-results');
    if (!resultsContainer) {
        resultsContainer = document.createElement('div');
        resultsContainer.className = 'search-results';
        document.querySelector('.main-content').appendChild(resultsContainer);
    }
    resultsContainer.innerHTML = `
        <div class="error-message">
            <p>${message}</p>
        </div>
    `;
}