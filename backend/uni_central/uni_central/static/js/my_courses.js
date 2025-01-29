let myCourses = [];

function showSearchPopup() {
    console.log('Opening popup'); // Debug log
    document.getElementById('course-search-popup').classList.add('active');
}

// Function to close the course search popup
function closeSearchPopup() {
    document.getElementById('course-search-popup').classList.remove('active');
    document.getElementById('course-search').value = '';
    document.getElementById('search-results').innerHTML = '';
}

// Function to search courses from database
async function searchCourses(query) {
    try {
        const response = await fetch(`/api/courses/search?q=${query}`);
        const data = await response.json();
        displaySearchResults(data.courses);
    } catch (error) {
        console.error('Error searching courses:', error);
    }
}

// Function to display search results
function displaySearchResults(courses) {
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = '';

    courses.forEach(course => {
        const courseElement = document.createElement('div');
        courseElement.className = 'search-result-item';
        courseElement.innerHTML = `
            <div class="course-info">
                <h4>${course.courseCode} - ${course.courseName}</h4>
                <p>Credits: ${course.credits}</p>
            </div>
            <button onclick="addCourse('${course.id}')">Add</button>
        `;
        resultsContainer.appendChild(courseElement);
    });
}

// Function to add a course
async function addCourse(courseId) {
    const selectedSemester = document.getElementById('semester-values').value;
    try {
        const response = await fetch('/api/my-courses/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                courseId: courseId,
                semester: selectedSemester
            })
        });
        const data = await response.json();
        if (data.success) {
            renderCourses();
            closeSearchPopup();
        }
    } catch (error) {
        console.error('Error adding course:', error);
    }
}

// Function to remove a course
async function removeCourse(courseId) {
    try {
        const response = await fetch(`/api/my-courses/${courseId}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        if (data.success) {
            renderCourses();
        }
    } catch (error) {
        console.error('Error removing course:', error);
    }
}

// Function to render courses
async function renderCourses() {
    const selectedSemester = document.getElementById('semester-values').value;
    try {
        const response = await fetch(`/api/my-courses?semester=${selectedSemester}`);
        const data = await response.json();
        displayCourses(data.courses);
    } catch (error) {
        console.error('Error fetching courses:', error);
    }
}

// Function to display courses
function displayCourses(courses) {
    const container = document.querySelector('.my-courses');
    const existingCards = container.querySelectorAll('.course-card');
    existingCards.forEach(card => card.remove());

    courses.forEach(course => {
        const courseCard = document.createElement('div');
        courseCard.className = 'course-card';
        courseCard.innerHTML = `
            <div class="course-info">
                <div class="title-section">
                    <h3>${course.courseCode} ${course.courseName}</h3>
                    ${course.required ? '<span class="required">REQUIRED</span>' : ''}
                </div>
                <p>Estimated Time Spent Per Week: ${course.estimatedHours} hours</p>
                <p>In Person / ${course.semester} / ${course.schedule}</p>
                <div class="difficulty-rating">
                    <p>Difficulty: <img src="/static/assets/${course.difficulty}_difficulty.png" alt="difficulty rating"></p>
                </div>
                <p>Average Grade: ${course.averageGrade}</p>
            </div>
            <button class="remove-button" onclick="removeCourse('${course.id}')">REMOVE X</button>
            <div class="course-right">
                <p>Overall course rating:</p>
                <div class="rating-container">
                    <img src="/static/assets/star.png" alt="star rating">
                    <span class="rating-number">${course.rating}</span>
                </div>
            </div>
        `;
        container.appendChild(courseCard);
    });
}

// Add event listeners when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the course display
    renderCourses();

    // Add course button click handler
    document.querySelector('.add-course').addEventListener('click', showSearchPopup);
    // const addCourseButton = document.querySelector('.add-course');
    // if (addCourseButton) {
    //     addCourseButton.addEventListener('click', showSearchPopup);
    //     console.log('Add course button listener added'); // Debug log
    // } else {
    //     console.log('Add course button not found'); // Debug log
    // }
    // Search input handler
    const searchInput = document.getElementById('course-search');
    let debounceTimeout;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
            if (e.target.value.length >= 2) {
                searchCourses(e.target.value);
            }
        }, 300);
    });

    // Semester change handler
    document.getElementById('semester-values').addEventListener('change', renderCourses);
});