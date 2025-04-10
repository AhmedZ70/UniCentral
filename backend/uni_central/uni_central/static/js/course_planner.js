import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: "AIzaSyD0wF4R9GdY2m7eAwVL_j_mihLit4rRZ5Q",
  authDomain: "unicentral-b6c23.firebaseapp.com",
  projectId: "unicentral-b6c23",
  storageBucket: "unicentral-b6c23.appspot.com",
  messagingSenderId: "554502030441",
  appId: "1:554502030441:web:6dccab580dbcfdb974cef8",
  measurementId: "G-M4L04508RH",
  clientId: "554502030441-g68f3tti18fiip1hpr6ehn6q6u5sn8fh.apps.googleusercontent.com"
};

// Initialize Firebase only if it hasn't been initialized already
let app;
const apps = getApps();
if (!apps.length) {
  app = initializeApp(firebaseConfig);
} else {
  app = apps[0]; // Use the existing app
}

const auth = getAuth(app);

// Initialize coursePlan with default structure
let coursePlan = {
    semesters: []
};

// Initialize transcriptParser as a global variable
let transcriptParser;

// Initialize selected courses array
let selectedCourses = [];
let currentSemesterId = null;

// Class to represent a Semester
class Semester {
    constructor(term, year) {
        this.id = `${term}-${year}`;
        this.term = term;
        this.year = year;
        this.courses = [];
    }
}

// Class to represent a Course
class Course {
    constructor(courseCode, courseName, credits) {
        this.courseCode = courseCode;      // Store the full course code as entered
        this.courseName = courseName;
        this.credits = credits;
        this.id = Math.random().toString(36).slice(2, 11);
    }
}

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the page with authentication check
    onAuthStateChanged(auth, (user) => {
        if (user) {
            const emailAddress = user.email;
            console.log("User is signed in with email:", emailAddress);
            loadCoursePlan(emailAddress);
            
            // Initialize the transcript parser
            transcriptParser = new TranscriptParser();
            
            // Add event listener for add semester button
            const addSemesterBtn = document.querySelector('.add-semester');
            if (addSemesterBtn) {
                addSemesterBtn.addEventListener('click', showSemesterPopup);
            }
        } else {
            console.log("No user signed in, redirecting to login");
            window.location.href = '/login/';
        }
    });
});

// Function to load course plan from backend
async function loadCoursePlan(emailAddress) {
    try {
        const response = await fetch(`/api/get-course-plan/${encodeURIComponent(emailAddress)}/`, {
            method: 'GET',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.course_plan) {
            coursePlan = data.course_plan;
            if (!coursePlan.semesters) {
                coursePlan.semesters = [];
            }
        }
        renderSemesters();
    } catch (error) {
        console.error('Error loading course plan:', error);
    }
}

// Function to save course plan to backend
async function saveCoursePlan() {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('User not authenticated');
        }

        // Ensure coursePlan has the correct structure
        if (!coursePlan.semesters) {
            coursePlan.semesters = [];
        }

        // Validate each semester and course
        coursePlan.semesters.forEach(semester => {
            if (!semester.courses) {
                semester.courses = [];
            }
            semester.courses.forEach(course => {
                if (!course.id) {
                    course.id = Math.random().toString(36).slice(2, 11);
                }
            });
        });

        const response = await fetch(`/api/update-course-plan/${encodeURIComponent(user.email)}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                course_plan: coursePlan
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Course plan saved successfully:', data);
        return data;
    } catch (error) {
        console.error('Error saving course plan:', error);
        throw error;
    }
}

// Function to add a new semester
function addSemester(term, year) {
    if (!term || !year) {
        alert('Please provide both term and year');
        return null;
    }
    
    // Validate year is a number and within reasonable range
    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
        alert('Please enter a valid year between 2000 and 2100');
        return null;
    }
    
    const semesterId = `${term.toLowerCase()}-${yearNum}`;
    
    // Check if semester already exists
    const existingSemester = coursePlan.semesters.find(s => s.id === semesterId);
    if (existingSemester) {
        alert(`The ${term} ${yearNum} semester already exists in your plan`);
        return existingSemester;
    }
    
    const semester = {
        id: semesterId,
        term: term,
        year: parseInt(yearNum),
        courses: []
    };
    
    coursePlan.semesters.push(semester);
    
    // Sort semesters by year and term
    coursePlan.semesters.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        const termOrder = { spring: 0, summer: 1, fall: 2, winter: 3 };
        return termOrder[a.term.toLowerCase()] - termOrder[b.term.toLowerCase()];
    });
    
    // Render the updated semesters and save to backend
    renderSemesters();
    saveCoursePlan().then(() => {
        console.log(`Successfully added ${term} ${yearNum} semester`);
    }).catch(error => {
        console.error('Error saving new semester:', error);
        alert('There was an error saving your changes. Please try again.');
    });
    
    return semester;
}

// Function to remove a semester
function removeSemester(semesterId) {
    if (!confirm('Are you sure you want to remove this semester and all its courses?')) {
        return;
    }
    
    const semesterIndex = coursePlan.semesters.findIndex(sem => sem.id === semesterId);
    if (semesterIndex === -1) {
        alert('Semester not found');
        return;
    }
    
    // Store semester info for confirmation message
    const semester = coursePlan.semesters[semesterIndex];
    const courseCount = semester.courses.length;
    
    // Remove the semester
    coursePlan.semesters.splice(semesterIndex, 1);
    
    // Update UI and save changes
    renderSemesters();
    saveCoursePlan().then(() => {
        console.log(`Successfully removed semester with ${courseCount} courses`);
    }).catch(error => {
        console.error('Error removing semester:', error);
        alert('There was an error saving your changes. Please try again.');
    });
}

// Function to render all semesters and their courses
function renderSemesters() {
    const container = document.getElementById('course-planner-container');
    const emptyMessage = document.getElementById('empty-planner-message');
    container.innerHTML = '';

    if (!coursePlan.semesters || coursePlan.semesters.length === 0) {
        // Show empty state message
        if (emptyMessage) {
            emptyMessage.style.display = 'block';
        }
        return;
    }
    
    // Hide empty state message if there are semesters
    if (emptyMessage) {
        emptyMessage.style.display = 'none';
    }

    coursePlan.semesters.forEach(semester => {
        const semesterElement = createSemesterElement(semester);
        container.appendChild(semesterElement);
    });
}

// Function to create a semester element
function createSemesterElement(semester) {
    const semesterDiv = document.createElement('div');
    semesterDiv.className = 'semester-container';
    semesterDiv.id = `semester-${semester.id}`;

    // Calculate total credits
    const totalCredits = semester.courses.reduce((sum, course) => sum + parseInt(course.credits), 0);

    const header = document.createElement('div');
    header.className = 'semester-header';
    header.innerHTML = `
        <div class="semester-title">
            <h3>${semester.term} ${semester.year}</h3>
            <span class="credit-counter">Total Credits: ${totalCredits}</span>
        </div>
        <div class="semester-controls">
            <button onclick="removeSemester('${semester.id}')">Remove Semester</button>
            <button onclick="showCoursePopup('${semester.id}')">Add Course</button>
        </div>
    `;

    const coursesDiv = document.createElement('div');
    coursesDiv.className = 'courses-container';

    semester.courses.forEach(course => {
        const courseElement = createCourseElement(semester.id, course);
        coursesDiv.appendChild(courseElement);
    });

    semesterDiv.appendChild(header);
    semesterDiv.appendChild(coursesDiv);
    return semesterDiv;
}

// Function to create a course element
function createCourseElement(semesterId, course) {
    const courseLink = document.createElement('a');
    courseLink.href = `/courses/${course.id}/`;
    courseLink.className = 'course-card';
    courseLink.style.textDecoration = 'none';
    courseLink.style.color = 'inherit';
    
    // Add data attributes to help with course removal
    courseLink.setAttribute('data-course-id', course.id || '');
    courseLink.setAttribute('data-course-code', course.courseCode || course.code || '');
    courseLink.setAttribute('data-semester-id', semesterId);

    // Get course details, handling different property naming conventions
    const courseCode = course.courseCode || course.code || "Unknown Code";
    const courseName = course.courseName || course.name || "Unknown Course";
    const credits = course.credits || 0;
    const rating = course.rating || 0;
    const difficulty = course.difficulty || 0;

    courseLink.innerHTML = `
        <div class="course-info">
            <div class="course-header">
                <span class="course-code">${courseCode}</span>
                <span class="course-credits">${credits} Credits</span>
            </div>
            <h3 class="course-name">${courseName}</h3>
            <div class="course-stats">
                <div class="stat-group">
                    <span class="stat-label">Rating:</span>
                    <div class="rating-stars">${createRatingStars(rating)}</div>
                </div>
                <div class="stat-group">
                    <span class="stat-label">Difficulty:</span>
                    <div class="difficulty-rating">${createDifficultyCircles(difficulty)}</div>
                </div>
            </div>
        </div>
        <div class="course-actions">
            <button class="remove-course-btn" 
                onclick="event.preventDefault(); removeCourse('${semesterId}', '${course.id || course.course_id || ""}')">
                Remove Course
            </button>
        </div>
    `;

    return courseLink;
}

function createRatingStars(rating) {
    const maxStars = 5;
    let starsHTML = '';

    for (let i = 1; i <= maxStars; i++) {
        if (i <= rating) {
            starsHTML += '<span class="star filled">★</span>';
        } else if (i - 1 < rating && rating < i) {
            const percentage = (rating - (i - 1)) * 100;
            starsHTML += `
                <span class="star partial" style="position: relative;">
                    <span class="star filled" style="position: absolute; width: ${percentage}%; overflow: hidden;">★</span>
                    <span class="star">★</span>
                </span>
            `;
        } else {
            starsHTML += '<span class="star">★</span>';
        }
    }
    return starsHTML;
}

function createDifficultyCircles(difficulty) {
    const flooredDifficulty = Math.floor(parseFloat(difficulty) || 0);
    const maxCircles = 6;
    let circlesHTML = '';

    for (let i = 1; i <= maxCircles; i++) {
        if (i <= flooredDifficulty) {
            let colorClass = '';
            if (i <= 2) {
                colorClass = 'green';
            } else if (i <= 4) {
                colorClass = 'yellow';
            } else {
                colorClass = 'red';
            }
            circlesHTML += `<span class="difficulty-circle filled ${colorClass}"></span>`;
        } else {
            circlesHTML += `<span class="difficulty-circle"></span>`;
        }
    }

    return circlesHTML;
}

// Update your course planner JS with these functions:

function submitSemester() {
    const term = document.getElementById('term-select').value;
    const year = document.getElementById('year-input').value;
    
    if (term && year) {
        addSemester(term, year);
        closeSemesterPopup();
    }
}

function showSemesterPopup() {
    document.getElementById('semester-popup').classList.add('active');
}

function closeSemesterPopup() {
    document.getElementById('semester-popup').classList.remove('active');
}

async function submitCourse() {
    const courseCode = document.getElementById('course-code').value.trim();
    const courseName = document.getElementById('course-name').value.trim();
    const credits = document.getElementById('course-credits').value.trim();
    
    if (!courseCode || !courseName || !credits) {
        alert('Please fill in all course information');
        return;
    }
    
    // Validate credits
    const creditsNum = parseInt(credits);
    if (isNaN(creditsNum) || creditsNum < 1 || creditsNum > 12) {
        alert('Please enter a valid number of credits (1-12)');
        return;
    }
    
    try {
        // Show loading indicator
        const submitButton = document.querySelector('#course-popup .submit');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Adding...';
        submitButton.disabled = true;
        
        // Fetch course details from the database
        const response = await fetch(`/api/filter-courses/?title=${encodeURIComponent(courseName)}&department=${encodeURIComponent(courseCode.split(' ')[0])}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch course data');
        }
        
        const data = await response.json();
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        
        // Try to find a matching course
        let matchingCourse = null;
        
        // First try exact match by code
        const [deptCode, courseNum] = courseCode.split(' ');
        if (deptCode && courseNum) {
            matchingCourse = data.find(c => 
                c.subject.toLowerCase() === deptCode.toLowerCase() && 
                c.number.toString() === courseNum.trim()
            );
        }
        
        // If no match by code, try by name
        if (!matchingCourse) {
            matchingCourse = data.find(c => 
                c.title.toLowerCase().includes(courseName.toLowerCase())
            );
        }
        
        // If still no match, ask user if they want to add it anyway
        if (!matchingCourse && data.length > 0) {
            // Show potential matches
            const confirmAdd = confirm(`No exact match found for "${courseCode}: ${courseName}". Would you like to see similar courses?`);
            if (confirmAdd) {
                showCourseSuggestions(data, courseCode, courseName, credits);
                return;
            }
        } else if (!matchingCourse) {
            const confirmAdd = confirm(`No course found matching "${courseCode}: ${courseName}". Would you like to add it anyway as a custom course?`);
            if (!confirmAdd) return;
            
            // Add as custom course if confirmed
            matchingCourse = {
                id: `custom-${Date.now()}`,
                avg_rating: 0,
                avg_difficulty: 0
            };
        }

        const currentSemesterId = document.getElementById('course-popup').dataset.semesterId;
        
        // Add course with the database ID or custom ID
        const course = {
            id: matchingCourse.id,
            courseCode: courseCode,
            courseName: courseName,
            credits: parseInt(credits),
            rating: matchingCourse.avg_rating || 0,
            difficulty: matchingCourse.avg_difficulty || 0
        };

        // Find the semester and add the course
        const semester = coursePlan.semesters.find(s => s.id === currentSemesterId);
        if (!semester) {
            throw new Error('Semester not found');
        }

        // Check for duplicate course
        const existingCourse = semester.courses.find(c => c.courseCode.toLowerCase() === course.courseCode.toLowerCase());
        if (existingCourse) {
            alert('This course is already in this semester.');
            return;
        }

        semester.courses.push(course);
        await saveCoursePlan();
        renderSemesters();
        closeCoursePopup();
        
        // Show success message
        showNotification(`Added ${course.courseCode}: ${course.courseName} to ${semester.term} ${semester.year}`);

    } catch (error) {
        console.error('Error adding course:', error);
        alert('Failed to add course. Please try again.');
    }
}

function showCoursePopup(semesterId) {
    currentSemesterId = semesterId;
    selectedCourses = [];
    
    // Clear any previous search results and selections
    document.getElementById('course-results').innerHTML = `
        <div class="empty-results">
            <p>Use the filters above to search for courses</p>
        </div>
    `;
    document.getElementById('selected-courses').innerHTML = `
        <div class="empty-selection">
            <p>No courses selected yet</p>
        </div>
    `;
    document.getElementById('result-count').textContent = '0 courses found';
    document.getElementById('selected-count').textContent = '0 courses selected';
    
    // Clear filter inputs
    document.getElementById('department-filter').value = '';
    document.getElementById('course-title-filter').value = '';
    document.getElementById('min-course-number').value = '';
    document.getElementById('max-course-number').value = '';
    document.getElementById('professor-filter').value = '';
    document.getElementById('credits-filter').value = '';
    
    // Reset star ratings and difficulty
    document.querySelectorAll('.star-rating .star').forEach(star => star.classList.remove('active'));
    document.querySelectorAll('.difficulty-rating .difficulty-dot').forEach(dot => dot.classList.remove('active'));
    
    // Show the popup
    document.getElementById('course-popup').classList.add('active');
    
    // Add event listener to the search button
    const applyFiltersButton = document.getElementById('apply-filters');
    applyFiltersButton.addEventListener('click', searchCourses);
    
    // Add event listeners to stars and difficulty dots
    setupStarRating();
    setupDifficultyRating();
}

function closeCoursePopup() {
    document.getElementById('course-popup').classList.remove('active');
    selectedCourses = [];
    currentSemesterId = null;
}

function sortCourses(semesterId, sortBy) {
    const semester = coursePlan.semesters.find(sem => sem.id === semesterId);
    if (!semester) return;

    switch(sortBy) {
        case 'code':
            semester.courses.sort((a, b) => a.courseCode.localeCompare(b.courseCode));
            break;
        case 'credits':
            semester.courses.sort((a, b) => parseInt(a.credits) - parseInt(b.credits));
            break;
        case 'name':
            semester.courses.sort((a, b) => a.courseName.localeCompare(b.courseName));
            break;
    }
    renderSemesters();
}

class TranscriptParser {
    constructor() {
        this.fileInput = document.getElementById('transcript-file');
        this.uploadBox = document.getElementById('upload-box');
        this.progressContainer = document.getElementById('upload-progress');
        this.progressBar = this.progressContainer.querySelector('.progress-fill');
        this.progressText = this.progressContainer.querySelector('.progress-text');
        this.resultsContainer = document.getElementById('results-preview');
        
        if (!this.fileInput || !this.uploadBox || !this.progressContainer || 
            !this.progressBar || !this.progressText || !this.resultsContainer) {
            console.error('Required elements not found');
            return;
        }
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.uploadBox.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.uploadBox.classList.add('drag-over');
        });

        this.uploadBox.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.uploadBox.classList.remove('drag-over');
        });

        this.uploadBox.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.uploadBox.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFile(files[0]);
            }
        });

        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFile(e.target.files[0]);
            }
        });

        // Add click event to the upload box
        const uploadButton = this.uploadBox.querySelector('.upload-button');
        if (uploadButton) {
            uploadButton.addEventListener('click', () => {
                this.fileInput.click();
            });
        }
    }

    handleFile(file) {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!allowedTypes.includes(file.type)) {
            alert('Please upload a PDF, JPEG, or PNG file.');
            return;
        }

        if (file.size > maxSize) {
            alert('File size must be less than 10MB.');
            return;
        }

        // Get current user
        const user = auth.currentUser;
        if (!user) {
            console.log('User not authenticated, redirecting to login');
            window.location.href = '/login/';
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('email_address', user.email);

        this.showProgress();
        this.updateProgress(0, 'Uploading file...');

        fetch('/api/transcript/upload/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        })
        .then(response => {
            if (response.status === 403) {
                console.log('User not authenticated, redirecting to login');
                window.location.href = '/login/';
                throw new Error('Not authenticated');
            }
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            this.updateProgress(100, 'Processing complete!');
            
            // Show success message if courses were added to plan
            if (data.message) {
                alert(data.message);
            }
            
            setTimeout(() => {
                this.hideProgress();
                this.showResults(data.courses);
                
                // Refresh the course plan display
                loadCoursePlan(user.email);
            }, 500);
        })
        .catch(error => {
            console.error('Error:', error);
            if (error.message !== 'Not authenticated') {
                this.updateProgress(0, 'Error processing file');
                setTimeout(() => {
                    this.hideProgress();
                    alert('Error processing file. Please try again.');
                }, 1000);
            }
        });
    }

    showProgress() {
        this.progressContainer.classList.remove('hidden');
        this.resultsContainer.classList.add('hidden');
    }

    hideProgress() {
        this.progressContainer.classList.add('hidden');
    }

    updateProgress(percent, message) {
        this.progressBar.style.width = `${percent}%`;
        this.progressText.textContent = message;
    }

    showResults(courses) {
        if (!courses || courses.length === 0) {
            this.resultsContainer.innerHTML = '<p>No courses found in the transcript.</p>';
            this.resultsContainer.classList.remove('hidden');
            return;
        }

        const coursesGroupedBySemester = this.groupCoursesBySemester(courses);
        let html = '<h3>Found Courses:</h3>';
        
        Object.entries(coursesGroupedBySemester)
            .sort(([semA], [semB]) => this.compareSemesters(semA, semB))
            .forEach(([semester, semesterCourses]) => {
                html += `
                    <div class="semester-section">
                        <div class="semester-header">${semester}</div>
                        ${semesterCourses.map(course => `
                            <div class="course-item">
                                <input type="checkbox" id="course-${course.code}" 
                                       value="${JSON.stringify(course)}" 
                                       data-name="${course.name}"
                                       data-credits="${course.credits || 3}"
                                       data-semester="${semester}">
                                <label for="course-${course.code}">
                                    <div class="course-code">${course.code}</div>
                                    <div class="course-name">${course.name}</div>
                                    <div class="course-credits">${course.credits || 3} Credits</div>
                                </label>
                            </div>
                        `).join('')}
                    </div>
                `;
            });

        html += `
            <div class="action-buttons">
                <button onclick="transcriptParser.confirmSelectedCourses()" class="confirm-btn">
                    Add Selected Courses
                </button>
            </div>
        `;

        this.resultsContainer.innerHTML = html;
        this.resultsContainer.classList.remove('hidden');
    }

    groupCoursesBySemester(courses) {
        const grouped = {};
        courses.forEach(course => {
            const semester = course.semester || 'Unknown Semester';
            if (!grouped[semester]) {
                grouped[semester] = [];
            }
            grouped[semester].push(course);
        });
        return grouped;
    }

    compareSemesters(semA, semB) {
        const termOrder = {
            'Spring': 0,
            'Summer': 1,
            'Fall': 2,
            'Winter': 3
        };
        
        const [termA, yearA] = semA.split(' ');
        const [termB, yearB] = semB.split(' ');
        
        if (yearA !== yearB) {
            return parseInt(yearA) - parseInt(yearB);
        }
        return termOrder[termA] - termOrder[termB];
    }

    confirmSelectedCourses() {
        const selectedCourses = [];
        const checkboxes = document.querySelectorAll('.course-checkbox:checked');
        
        if (checkboxes.length === 0) {
            alert('Please select at least one course.');
            return;
        }
        
        // Initialize coursePlan if it doesn't exist
        if (!window.coursePlan) {
            window.coursePlan = { semesters: [] };
        }
        
        // Group selected courses by semester
        const coursesBySemester = {};
        checkboxes.forEach(checkbox => {
            const courseData = JSON.parse(checkbox.value);
            const semesterName = courseData.semester;
            
            if (!coursesBySemester[semesterName]) {
                coursesBySemester[semesterName] = [];
            }
            coursesBySemester[semesterName].push(courseData);
        });
        
        // Process each semester's courses
        Object.entries(coursesBySemester).forEach(([semesterName, courses]) => {
            let semester;
            
            // Parse semester information
            let term, year;
            if (semesterName.includes(' ')) {
                [term, year] = semesterName.split(' ');
                year = parseInt(year);
                
                // Validate year
                if (isNaN(year)) {
                    const currentYear = new Date().getFullYear();
                    year = currentYear;
                    console.log(`Invalid year in semester "${semesterName}", using current year: ${year}`);
                }
                
                // Validate term
                const validTerms = ['Spring', 'Summer', 'Fall', 'Winter'];
                if (!validTerms.includes(term)) {
                    term = 'Fall';  // Default to Fall if invalid term
                    console.log(`Invalid term "${term}" in semester "${semesterName}", using default: Fall`);
                }
            } else {
                // Handle case where semester name doesn't split properly
                const currentYear = new Date().getFullYear();
                term = 'Fall';
                year = currentYear;
                console.log(`Invalid semester format "${semesterName}", using default: ${term} ${year}`);
            }
            
            // Find existing semester or create new one
            semester = coursePlan.semesters.find(s => 
                s.term.toLowerCase() === term.toLowerCase() && s.year === year
            );
            
            if (!semester) {
                semester = {
                    id: `${term.toLowerCase()}-${year}`,
                    term: term,
                    year: year,
                    courses: []
                };
                coursePlan.semesters.push(semester);
            }
            
            // Add courses to semester
            courses.forEach(course => {
                // Generate a unique ID for transcript courses
                const uniqueId = `transcript-${course.code.replace(/\s+/g, '-')}-${Date.now()}`;
                
                // Check if course already exists in semester
                const existingCourse = semester.courses.find(c => 
                    (c.courseCode && c.courseCode.toLowerCase() === course.code.toLowerCase()) ||
                    (c.code && c.code.toLowerCase() === course.code.toLowerCase())
                );
                
                if (!existingCourse) {
                    // Create a course object with consistent property names
                    semester.courses.push({
                        id: course.course_id || uniqueId,
                        courseCode: course.code,  // Use consistent property name matching manual courses
                        courseName: course.name,  // Use consistent property name matching manual courses
                        credits: course.credits || 3,
                        rating: course.rating || 0,
                        difficulty: course.difficulty || 0
                    });
                }
            });
        });
        
        // Sort semesters by year and term
        const termOrder = { 'spring': 0, 'summer': 1, 'fall': 2, 'winter': 3 };
        coursePlan.semesters.sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return termOrder[a.term.toLowerCase()] - termOrder[b.term.toLowerCase()];
        });
        
        // Save the updated course plan
        saveCoursePlan()
            .then(() => {
                // Hide the results container
                document.getElementById('results-preview').classList.add('hidden');
                // Show success message
                alert('Selected courses have been added to your course plan.');
                // Refresh the course plan display
                renderSemesters();
            })
            .catch(error => {
                console.error('Error saving course plan:', error);
                alert('Failed to save course plan. Please try again.');
            });
    }
}

// Helper function to get CSRF token
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

class CoursePlan {
    constructor() {
        this.semesters = [];
        this.load();
    }
    
    addSemester(name) {
        const semester = new Semester(name);
        this.semesters.push(semester);
        this.sortSemesters();
        return semester;
    }
    
    getSemester(name) {
        return this.semesters.find(s => s.name === name);
    }
    
    sortSemesters() {
        const semesterOrder = {
            'Spring': 0,
            'Summer': 1,
            'Fall': 2,
            'Winter': 3
        };
        
        this.semesters.sort((a, b) => {
            const [aTerm, aYear] = a.name.split(' ');
            const [bTerm, bYear] = b.name.split(' ');
            
            if (aYear !== bYear) {
                return parseInt(aYear) - parseInt(bYear);
            }
            return semesterOrder[aTerm] - semesterOrder[bTerm];
        });
    }
    
    save() {
        const data = {
            semesters: this.semesters.map(semester => ({
                name: semester.name,
                courses: semester.courses.map(course => ({
                    code: course.code,
                    name: course.name,
                    credits: course.credits
                }))
            }))
        };
        
        fetch('/api/update-course-plan/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                console.log('Course plan saved successfully');
            } else {
                console.error('Error saving course plan:', data.message);
            }
        })
        .catch(error => {
            console.error('Error saving course plan:', error);
        });
    }
    
    load() {
        fetch('/api/get-course-plan/')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success' && data.course_plan) {
                this.semesters = data.course_plan.semesters.map(semesterData => {
                    const semester = new Semester(semesterData.name);
                    semesterData.courses.forEach(courseData => {
                        semester.addCourse(new Course(
                            courseData.code,
                            courseData.name,
                            courseData.credits
                        ));
                    });
                    return semester;
                });
                this.sortSemesters();
                this.render();
            }
        })
        .catch(error => {
            console.error('Error loading course plan:', error);
        });
    }
    
    render() {
        const container = document.getElementById('semester-container');
        container.innerHTML = '';
        
        this.semesters.forEach(semester => {
            container.appendChild(semester.render());
        });
    }
}

// Add a new function to handle course enrollment
async function enrollInCourse(courseCode) {
    try {
        const user = auth.currentUser;
        if (!user) {
            console.log('User not authenticated, redirecting to login');
            window.location.href = '/login/';
            return;
        }

        const token = await user.getIdToken();
        const response = await fetch(`/api/courses/${courseCode}/reviews/enroll/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ email_address: user.email })
        });

        if (!response.ok) {
            if (response.status === 401) {
                console.log('User not authenticated, redirecting to login');
                window.location.href = '/login/';
                return;
            }
            throw new Error('Failed to enroll in course');
        }

        const data = await response.json();
        console.log('Successfully enrolled in course:', courseCode);
        return data;
    } catch (error) {
        console.error('Error enrolling in course:', error);
    }
}

// Function to show course suggestions when no exact match is found
function showCourseSuggestions(courses, originalCode, originalName, originalCredits) {
    const popup = document.getElementById('course-popup');
    const content = popup.querySelector('.semester-popup-content');
    const originalContent = content.innerHTML;
    
    // Save original content
    popup.dataset.originalContent = originalContent;
    
    // Create suggestion list
    let suggestionsHTML = `
        <button class="close-popup" onclick="closeCoursePopup()">&times;</button>
        <h2 class="semester-popup-title">Similar Courses</h2>
        <div class="course-suggestions">
    `;
    
    // Add up to 5 most relevant courses
    const displayCourses = courses.slice(0, 5);
    displayCourses.forEach(course => {
        suggestionsHTML += `
            <div class="course-suggestion" onclick="selectSuggestedCourse('${course.id}', '${course.subject} ${course.number}', '${course.title.replace(/'/g, "\\'")}', ${course.credits}, ${course.avg_rating || 0}, ${course.avg_difficulty || 0})">
                <div class="suggestion-code">${course.subject} ${course.number}</div>
                <div class="suggestion-name">${course.title}</div>
                <div class="suggestion-credits">${course.credits} Credits</div>
            </div>
        `;
    });
    
    // Add option to use original input
    suggestionsHTML += `
        <div class="course-suggestion custom" onclick="selectSuggestedCourse('custom-${Date.now()}', '${originalCode}', '${originalName.replace(/'/g, "\\'")}', ${originalCredits}, 0, 0)">
            <div class="suggestion-code">${originalCode}</div>
            <div class="suggestion-name">${originalName}</div>
            <div class="suggestion-credits">${originalCredits} Credits</div>
            <div class="custom-badge">Custom</div>
        </div>
    `;
    
    suggestionsHTML += `
        </div>
        <div class="popup-buttons">
            <button class="semester-popup-button cancel" onclick="restoreOriginalCoursePopup()">Cancel</button>
        </div>
    `;
    
    content.innerHTML = suggestionsHTML;
}

// Function to restore original course popup after showing suggestions
function restoreOriginalCoursePopup() {
    const popup = document.getElementById('course-popup');
    const content = popup.querySelector('.semester-popup-content');
    
    if (popup.dataset.originalContent) {
        content.innerHTML = popup.dataset.originalContent;
        delete popup.dataset.originalContent;
    }
}

// Function to select a suggested course
function selectSuggestedCourse(id, code, name, credits, rating, difficulty) {
    const currentSemesterId = document.getElementById('course-popup').dataset.semesterId;
    
    // Add course with the selected data
    const course = {
        id: id,
        courseCode: code,
        courseName: name,
        credits: parseInt(credits),
        rating: rating || 0,
        difficulty: difficulty || 0
    };

    // Find the semester and add the course
    const semester = coursePlan.semesters.find(s => s.id === currentSemesterId);
    if (!semester) {
        alert('Semester not found');
        closeCoursePopup();
        return;
    }

    // Check for duplicate course
    const existingCourse = semester.courses.find(c => c.courseCode.toLowerCase() === course.courseCode.toLowerCase());
    if (existingCourse) {
        alert('This course is already in this semester.');
        restoreOriginalCoursePopup();
        return;
    }

    semester.courses.push(course);
    saveCoursePlan()
        .then(() => {
            renderSemesters();
            closeCoursePopup();
            showNotification(`Added ${course.courseCode}: ${course.courseName} to ${semester.term} ${semester.year}`);
        })
        .catch(error => {
            console.error('Error adding course:', error);
            alert('Failed to add course. Please try again.');
        });
}

// Function to remove a course
function removeCourse(semesterId, courseId) {
    if (!confirm('Are you sure you want to remove this course?')) {
        return;
    }
    
    const semester = coursePlan.semesters.find(sem => sem.id === semesterId);
    if (!semester) {
        alert('Semester not found');
        return;
    }
    
    // First try to find the course by ID
    let courseIndex = semester.courses.findIndex(course => course.id === courseId);
    
    // If not found by ID, try to find it by custom ID formats that might be used by transcript parsing
    if (courseIndex === -1) {
        // For transcript-parsed courses, they might use different ID formats
        courseIndex = semester.courses.findIndex(course => {
            // Try different possible ID formats or properties
            return (course.id && course.id.toString() === courseId.toString()) || 
                   (course.course_id && course.course_id.toString() === courseId.toString()) ||
                   (course.courseId && course.courseId.toString() === courseId.toString());
        });
    }
    
    // If still not found, as a last resort, try by courseCode
    if (courseIndex === -1) {
        console.log("Attempting to find course by additional properties...");
        
        // Get the course element from DOM to extract additional info
        const courseElement = document.querySelector(`[data-course-id="${courseId}"]`);
        if (courseElement) {
            const courseCode = courseElement.getAttribute('data-course-code');
            if (courseCode) {
                courseIndex = semester.courses.findIndex(course => 
                    course.courseCode === courseCode || 
                    (course.code && course.code === courseCode)
                );
            }
        }
    }
    
    // If we still can't find the course, log detailed info to help debug
    if (courseIndex === -1) {
        console.error(`Failed to find course with ID: ${courseId} in semester ${semesterId}`);
        console.log("Available courses in this semester:", semester.courses);
        alert('Course not found. Please try refreshing the page.');
        return;
    }
    
    // Store course info for confirmation message
    const course = semester.courses[courseIndex];
    
    // Get display name (either courseName or name property)
    const courseName = course.courseName || course.name || "this course";
    const courseCode = course.courseCode || course.code || "";
    
    // Remove the course
    semester.courses.splice(courseIndex, 1);
    
    // Update UI and save changes
    renderSemesters();
    saveCoursePlan()
        .then(() => {
            console.log(`Successfully removed course ${courseCode}`);
            showNotification(`Removed ${courseCode}: ${courseName} from ${semester.term} ${semester.year}`);
        })
        .catch(error => {
            console.error('Error removing course:', error);
            alert('There was an error saving your changes. Please try again.');
        });
}

// Function to show notification
function showNotification(message) {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('planner-notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'planner-notification';
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    // Set message and show
    notification.textContent = message;
    notification.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Function to set up star rating functionality
function setupStarRating() {
    const stars = document.querySelectorAll('.star-rating .star');
    stars.forEach(star => {
        star.addEventListener('click', function() {
            const value = parseInt(this.getAttribute('data-value'));
            
            // Toggle selection
            if (this.classList.contains('active') && 
                !this.nextElementSibling?.classList.contains('active')) {
                // If clicking on the last active star, deselect all
                document.querySelectorAll('.star-rating .star').forEach(s => {
                    s.classList.remove('active');
                });
            } else {
                // Select up to this star
                document.querySelectorAll('.star-rating .star').forEach(s => {
                    const starValue = parseInt(s.getAttribute('data-value'));
                    if (starValue <= value) {
                        s.classList.add('active');
                    } else {
                        s.classList.remove('active');
                    }
                });
            }
        });
    });
}

// Function to set up difficulty rating functionality
function setupDifficultyRating() {
    const difficultyDots = document.querySelectorAll('.difficulty-rating .difficulty-dot');
    difficultyDots.forEach(dot => {
        dot.addEventListener('click', function() {
            const value = parseInt(this.getAttribute('data-value'));
            
            // Toggle selection
            if (this.classList.contains('active') && 
                !this.previousElementSibling?.classList.contains('active')) {
                // If clicking on the first active dot, deselect all
                document.querySelectorAll('.difficulty-rating .difficulty-dot').forEach(d => {
                    d.classList.remove('active');
                });
            } else {
                // Select up to this dot
                document.querySelectorAll('.difficulty-rating .difficulty-dot').forEach(d => {
                    const dotValue = parseInt(d.getAttribute('data-value'));
                    if (dotValue <= value) {
                        d.classList.add('active');
                    } else {
                        d.classList.remove('active');
                    }
                });
            }
        });
    });
}

// Function to search for courses
async function searchCourses() {
    const department = document.getElementById('department-filter').value.trim();
    const title = document.getElementById('course-title-filter').value.trim();
    const minNumber = document.getElementById('min-course-number').value.trim();
    const maxNumber = document.getElementById('max-course-number').value.trim();
    const professor = document.getElementById('professor-filter').value.trim();
    const credits = document.getElementById('credits-filter').value.trim();
    
    // Get rating value (count active stars)
    const activeStars = document.querySelectorAll('.star-rating .star.active');
    const minRating = activeStars.length > 0 ? activeStars.length : '';
    
    // Get difficulty value (count active dots)
    const activeDots = document.querySelectorAll('.difficulty-rating .difficulty-dot.active');
    const maxDifficulty = activeDots.length > 0 ? activeDots.length : '';
    
    // Build filter parameters
    const filters = {};
    if (department) filters.department = department;
    if (title) filters.title = title;
    if (minNumber) filters.min_number = minNumber;
    if (maxNumber) filters.max_number = maxNumber;
    if (professor) filters.professor = professor;
    if (credits) filters.credits = credits;
    if (minRating) filters.min_rating = minRating;
    if (maxDifficulty) filters.max_difficulty = maxDifficulty;
    
    // Show loading state
    document.getElementById('course-results').innerHTML = `
        <div class="empty-results">
            <p>Searching for courses...</p>
        </div>
    `;
    document.getElementById('result-count').textContent = 'Searching...';
    
    try {
        // Convert filters to query string
        const queryString = new URLSearchParams(filters).toString();
        
        // Make API request
        const response = await fetch(`/api/filter-courses/?${queryString}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
            throw new Error(`Error searching courses: ${response.status}`);
        }
        
        const courses = await response.json();
        displaySearchResults(courses);
    } catch (error) {
        console.error('Error searching courses:', error);
        document.getElementById('course-results').innerHTML = `
            <div class="empty-results">
                <p>An error occurred while searching. Please try again.</p>
            </div>
        `;
        document.getElementById('result-count').textContent = 'Error';
    }
}

// Function to display search results
function displaySearchResults(courses) {
    const resultsContainer = document.getElementById('course-results');
    
    if (!courses || courses.length === 0) {
        resultsContainer.innerHTML = `
            <div class="empty-results">
                <p>No courses found matching your search criteria</p>
            </div>
        `;
        document.getElementById('result-count').textContent = '0 courses found';
        return;
    }
    
    // Update result count
    document.getElementById('result-count').textContent = `${courses.length} courses found`;
    
    // Generate HTML for each course result
    let resultsHTML = '';
    courses.forEach(course => {
        // Check if course is already selected
        const isSelected = selectedCourses.some(selected => selected.id === course.id);
        
        // Determine difficulty level for display
        const difficultyLevel = Math.floor(course.avg_difficulty) || 0;
        let difficultyClass = '';
        if (difficultyLevel <= 2) {
            difficultyClass = 'difficulty-level-' + difficultyLevel;
        } else if (difficultyLevel <= 4) {
            difficultyClass = 'difficulty-level-' + difficultyLevel;
        } else {
            difficultyClass = 'difficulty-level-' + difficultyLevel;
        }
        
        resultsHTML += `
            <div class="course-result-item" data-id="${course.id}">
                <input type="checkbox" class="course-checkbox" 
                    data-id="${course.id}" 
                    data-code="${course.subject} ${course.number}" 
                    data-name="${course.title}" 
                    data-credits="${course.credits}" 
                    data-rating="${course.avg_rating || 0}" 
                    data-difficulty="${course.avg_difficulty || 0}"
                    ${isSelected ? 'checked' : ''}>
                <div class="course-info-preview">
                    <div class="course-code-preview">${course.subject} ${course.number}</div>
                    <div class="course-title-preview">${course.title}</div>
                    <div class="course-meta-preview">
                        <div class="course-credits-preview">
                            <i class="fas fa-book"></i> ${course.credits} Credits
                        </div>
                        <div class="course-rating-preview">
                            <i class="fas fa-star"></i> ${course.avg_rating ? course.avg_rating.toFixed(1) : 'N/A'}
                        </div>
                        <div class="course-difficulty-preview">
                            <i class="fas fa-chart-bar"></i> 
                            Difficulty: 
                            <span class="difficulty-indicator ${difficultyClass}"></span>
                            ${course.avg_difficulty ? course.avg_difficulty.toFixed(1) : 'N/A'}
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    resultsContainer.innerHTML = resultsHTML;
    
    // Add event listeners to checkboxes
    const checkboxes = document.querySelectorAll('.course-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const courseId = this.getAttribute('data-id');
            const courseCode = this.getAttribute('data-code');
            const courseName = this.getAttribute('data-name');
            const credits = parseInt(this.getAttribute('data-credits'));
            const rating = parseFloat(this.getAttribute('data-rating'));
            const difficulty = parseFloat(this.getAttribute('data-difficulty'));
            
            if (this.checked) {
                // Add to selected courses
                selectedCourses.push({
                    id: courseId,
                    courseCode: courseCode,
                    courseName: courseName,
                    credits: credits,
                    rating: rating,
                    difficulty: difficulty
                });
            } else {
                // Remove from selected courses
                selectedCourses = selectedCourses.filter(course => course.id !== courseId);
            }
            
            updateSelectedCoursesList();
        });
    });
}

// Function to update the selected courses list
function updateSelectedCoursesList() {
    const selectedContainer = document.getElementById('selected-courses');
    document.getElementById('selected-count').textContent = `${selectedCourses.length} courses selected`;
    
    if (selectedCourses.length === 0) {
        selectedContainer.innerHTML = `
            <div class="empty-selection">
                <p>No courses selected yet</p>
            </div>
        `;
        return;
    }
    
    let selectedHTML = '';
    selectedCourses.forEach(course => {
        selectedHTML += `
            <div class="selected-course-item">
                <div class="selected-course-info">
                    <div class="selected-course-code">${course.courseCode}</div>
                    <div class="selected-course-title">${course.courseName}</div>
                </div>
                <button class="remove-selected" data-id="${course.id}" aria-label="Remove course">×</button>
            </div>
        `;
    });
    
    selectedContainer.innerHTML = selectedHTML;
    
    // Add event listeners to remove buttons
    const removeButtons = document.querySelectorAll('.remove-selected');
    removeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const courseId = this.getAttribute('data-id');
            
            // Remove from selected courses
            selectedCourses = selectedCourses.filter(course => course.id !== courseId);
            
            // Update checkbox in results list
            const checkbox = document.querySelector(`.course-checkbox[data-id="${courseId}"]`);
            if (checkbox) {
                checkbox.checked = false;
            }
            
            updateSelectedCoursesList();
        });
    });
}

// Function to add selected courses to the semester
async function addSelectedCourses() {
    if (selectedCourses.length === 0) {
        alert('Please select at least one course to add');
        return;
    }
    
    try {
        // Find the semester
        const semester = coursePlan.semesters.find(s => s.id === currentSemesterId);
        if (!semester) {
            throw new Error('Semester not found');
        }
        
        // Track added and duplicate courses
        let addedCount = 0;
        let duplicateCount = 0;
        
        // Add each selected course
        selectedCourses.forEach(course => {
            // Check for duplicates
            const existingCourse = semester.courses.find(c => c.id === course.id);
            if (existingCourse) {
                duplicateCount++;
                return; // Skip this course
            }
            
            // Add course to the semester
            semester.courses.push(course);
            addedCount++;
        });
        
        // Save the updated course plan
        await saveCoursePlan();
        
        // Update the UI
        renderSemesters();
        
        // Close the popup
        closeCoursePopup();
        
        // Show confirmation message
        let message = '';
        if (addedCount > 0) {
            message = `Added ${addedCount} course${addedCount !== 1 ? 's' : ''} to ${semester.term} ${semester.year}`;
            if (duplicateCount > 0) {
                message += ` (${duplicateCount} duplicate${duplicateCount !== 1 ? 's' : ''} skipped)`;
            }
        } else if (duplicateCount > 0) {
            message = `No courses added - all ${duplicateCount} selected course${duplicateCount !== 1 ? 's were' : ' was'} already in this semester`;
        }
        
        showNotification(message);
        
    } catch (error) {
        console.error('Error adding courses:', error);
        alert('There was an error adding the selected courses. Please try again.');
    }
}

// Add these window-level functions so they can be called from HTML
window.submitSemester = submitSemester;
window.closeSemesterPopup = closeSemesterPopup;
window.showSemesterPopup = showSemesterPopup;
window.showCoursePopup = showCoursePopup;
window.closeCoursePopup = closeCoursePopup;
window.searchCourses = searchCourses;
window.addSelectedCourses = addSelectedCourses;
window.removeSemester = removeSemester;
window.removeCourse = removeCourse;