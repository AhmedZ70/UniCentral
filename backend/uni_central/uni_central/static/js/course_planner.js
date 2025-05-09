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
            console.debug("Transcript parser initialized");
            
            // Add event listener for add semester button
            const addSemesterBtn = document.querySelector('.add-semester');
            if (addSemesterBtn) {
                addSemesterBtn.addEventListener('click', showSemesterPopup);
            }
            
            // Setup a mutation observer to handle dynamically added upload buttons
            setupUploadButtonObserver();
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

    // Sort semesters by year and term first
    const sortedSemesters = [...coursePlan.semesters].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        const termOrder = { spring: 0, summer: 1, fall: 2, winter: 3 };
        return termOrder[a.term.toLowerCase()] - termOrder[b.term.toLowerCase()];
    });

    sortedSemesters.forEach(semester => {
        const semesterElement = createSemesterElement(semester);
        container.appendChild(semesterElement);
    });

    console.log(`Rendered ${sortedSemesters.length} semesters with ${sortedSemesters.reduce((total, sem) => total + sem.courses.length, 0)} total courses`);
}

// Function to create a semester element
function createSemesterElement(semester) {
    const semesterDiv = document.createElement('div');
    semesterDiv.className = 'semester-container';
    semesterDiv.id = `semester-${semester.id}`;

    console.log(`Creating semester element: ${semester.term} ${semester.year} with ${semester.courses.length} courses`);

    // Calculate total credits
    const totalCredits = semester.courses.reduce((sum, course) => {
        const credits = parseInt(course.credits) || 0;
        return sum + credits;
    }, 0);

    const header = document.createElement('div');
    header.className = 'semester-header';
    header.innerHTML = `
        <div class="semester-title">
            <h3>${semester.term} ${semester.year}</h3>
            <span class="credit-counter">Total Credits: ${totalCredits}</span>
        </div>
        <div class="semester-controls">
            <button class="remove-semester-btn" onclick="removeSemester('${semester.id}')">Remove Semester</button>
            <button class="add-course-btn" onclick="showCoursePopup('${semester.id}')">Add Course</button>
        </div>
    `;

    const coursesDiv = document.createElement('div');
    coursesDiv.className = 'courses-container';

    if (semester.courses.length === 0) {
        const emptyCourses = document.createElement('div');
        emptyCourses.className = 'empty-courses-message';
        emptyCourses.textContent = 'No courses added to this semester yet. Click "Add Course" to get started.';
        coursesDiv.appendChild(emptyCourses);
    } else {
        // Sort courses by course code
        const sortedCourses = [...semester.courses].sort((a, b) => {
            const codeA = a.courseCode || a.code || '';
            const codeB = b.courseCode || b.code || '';
            return codeA.localeCompare(codeB);
        });

        sortedCourses.forEach(course => {
            try {
                const courseElement = createCourseElement(semester.id, course);
                coursesDiv.appendChild(courseElement);
            } catch (error) {
                console.error(`Error creating course element for course:`, course, error);
                // Create a fallback course element with error message
                const errorElement = document.createElement('div');
                errorElement.className = 'course-card error';
                errorElement.innerHTML = `
                    <div class="course-info">
                        <h3 class="course-name">Error displaying course</h3>
                        <p>There was an error displaying this course. Please refresh the page.</p>
                    </div>
                `;
                coursesDiv.appendChild(errorElement);
            }
        });
    }

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
    const rating = course.rating || course.avg_rating || 0;
    const difficulty = course.difficulty || course.avg_difficulty || 0;

    // Create the course info div
    const courseInfo = document.createElement('div');
    courseInfo.className = 'course-info';

    // Add course header
    const courseHeader = document.createElement('div');
    courseHeader.className = 'course-header';
    
    const codeSpan = document.createElement('span');
    codeSpan.className = 'course-code';
    codeSpan.textContent = courseCode;
    
    const creditsSpan = document.createElement('span');
    creditsSpan.className = 'course-credits';
    creditsSpan.textContent = `${credits} Credits`;
    
    courseHeader.appendChild(codeSpan);
    courseHeader.appendChild(creditsSpan);
    courseInfo.appendChild(courseHeader);

    // Add course name
    const courseNameHeading = document.createElement('h3');
    courseNameHeading.className = 'course-name';
    courseNameHeading.textContent = courseName;
    courseInfo.appendChild(courseNameHeading);

    // Create stats container
    const statsDiv = document.createElement('div');
    statsDiv.className = 'course-stats';

    // Add rating group
    const ratingGroup = document.createElement('div');
    ratingGroup.className = 'stat-group';
    
    const ratingLabel = document.createElement('span');
    ratingLabel.className = 'stat-label';
    ratingLabel.textContent = 'Rating:';
    
    ratingGroup.appendChild(ratingLabel);
    ratingGroup.appendChild(createRatingStars(rating));
    statsDiv.appendChild(ratingGroup);

    // Add difficulty group
    const difficultyGroup = document.createElement('div');
    difficultyGroup.className = 'stat-group';
    
    const difficultyLabel = document.createElement('span');
    difficultyLabel.className = 'stat-label';
    difficultyLabel.textContent = 'Difficulty:';
    
    difficultyGroup.appendChild(difficultyLabel);
    difficultyGroup.appendChild(createDifficultyCircles(difficulty));
    statsDiv.appendChild(difficultyGroup);

    // Add stats to course info
    courseInfo.appendChild(statsDiv);

    // Create course actions div
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'course-actions';
    
    const removeButton = document.createElement('button');
    removeButton.className = 'remove-course-btn';
    removeButton.textContent = 'Remove Course';
    removeButton.onclick = function(event) {
        event.preventDefault();
        removeCourse(semesterId, course.id || course.course_id || "");
    };
    
    actionsDiv.appendChild(removeButton);

    // Assemble the course card
    courseLink.appendChild(courseInfo);
    courseLink.appendChild(actionsDiv);

    return courseLink;
}

function createRatingStars(rating) {
    const maxStars = 5;
    const filledStars = Math.round(rating); 
    const starsContainer = document.createElement('div');
    starsContainer.className = 'rating-stars';

    // Ensure rating is a valid number
    const validRating = !isNaN(parseFloat(rating)) ? Math.min(Math.max(parseFloat(rating), 0), 5) : 0;
    const roundedRating = Math.round(validRating);

    for (let i = 1; i <= maxStars; i++) {
        const star = document.createElement('span');
        star.className = i <= roundedRating ? 'star filled' : 'star';
        star.innerHTML = '★';
        star.setAttribute('aria-hidden', 'true');
        starsContainer.appendChild(star);
    }

    // Add screen reader text for accessibility
    const srText = document.createElement('span');
    srText.className = 'sr-only';
    srText.textContent = `${validRating} out of 5 stars`;
    srText.style.position = 'absolute';
    srText.style.width = '1px';
    srText.style.height = '1px';
    srText.style.overflow = 'hidden';
    srText.style.clip = 'rect(0, 0, 0, 0)';
    starsContainer.appendChild(srText);

    return starsContainer;
}

function createDifficultyCircles(difficulty) {
    const maxCircles = 6;
    // Ensure difficulty is a valid number
    const validDifficulty = !isNaN(parseFloat(difficulty)) ? Math.min(Math.max(parseFloat(difficulty), 0), 6) : 0;
    const roundedDifficulty = Math.round(validDifficulty);
    
    const circlesContainer = document.createElement('div');
    circlesContainer.className = 'difficulty-rating';

    for (let i = 1; i <= maxCircles; i++) {
        const circle = document.createElement('div');
        circle.className = 'difficulty-circle';
        
        if (i <= roundedDifficulty) {
            circle.classList.add('filled');
            
            if (i <= 2) {
                circle.classList.add('green');
            } else if (i <= 4) {
                circle.classList.add('yellow');
            } else {
                circle.classList.add('red');
            }
        }
        
        circlesContainer.appendChild(circle);
    }

    // Add screen reader text for accessibility
    const srText = document.createElement('span');
    srText.className = 'sr-only';
    srText.textContent = `Difficulty level ${validDifficulty} out of 6`;
    srText.style.position = 'absolute';
    srText.style.width = '1px';
    srText.style.height = '1px';
    srText.style.overflow = 'hidden';
    srText.style.clip = 'rect(0, 0, 0, 0)';
    circlesContainer.appendChild(srText);
    
    return circlesContainer;
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
    
    console.log(`Opening course popup for semester ID: ${semesterId}`);
    
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
    
    // Remove existing event listeners to prevent duplicates
    const applyFiltersButton = document.getElementById('apply-filters');
    const newButton = applyFiltersButton.cloneNode(true);
    applyFiltersButton.parentNode.replaceChild(newButton, applyFiltersButton);
    
    // Add event listener to the new button
    document.getElementById('apply-filters').addEventListener('click', function() {
        console.log('Search button clicked');
        searchCourses(semesterId);
    });
    
    // Add event listeners to stars and difficulty dots (with recreated elements to avoid duplicate listeners)
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
        console.debug("TranscriptParser constructor called");
        this.fileInput = document.getElementById('transcript-file');
        this.uploadBox = document.getElementById('upload-box');
        this.progressContainer = document.getElementById('upload-progress');
        this.progressBar = this.progressContainer.querySelector('.progress-fill');
        this.progressText = this.progressContainer.querySelector('.progress-text');
        this.resultsContainer = document.getElementById('results-preview');
        
        if (!this.fileInput || !this.uploadBox || !this.progressContainer || 
            !this.progressBar || !this.progressText || !this.resultsContainer) {
            console.error('Required elements not found', {
                fileInput: !!this.fileInput,
                uploadBox: !!this.uploadBox,
                progressContainer: !!this.progressContainer,
                progressBar: !!this.progressBar,
                progressText: !!this.progressText,
                resultsContainer: !!this.resultsContainer
            });
            return;
        }
        
        console.debug("All required elements found, setting up event listeners");
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
                console.debug("File dropped:", files[0].name);
                this.handleFile(files[0]);
            }
        });

        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                console.debug("File selected:", e.target.files[0].name);
                this.handleFile(e.target.files[0]);
            }
        });

        // Add click event to the upload box
        const uploadButton = this.uploadBox.querySelector('.upload-button');
        if (uploadButton) {
            uploadButton.addEventListener('click', (e) => {
                console.debug("Upload button clicked");
                e.preventDefault();
                e.stopPropagation();
                
                // Use setTimeout to prevent immediate double file dialog issues
                setTimeout(() => {
                    // Reset file input before opening it to ensure change event fires
                    this.fileInput.value = '';
                    this.fileInput.click();
                }, 50);
            });
        }
        
        // Add cancel button event listener to reset file input and hide containers
        document.getElementById('cancel-courses-btn')?.addEventListener('click', () => {
            this.resetUploader();
        });
        
        console.debug("Event listeners set up");
    }

    // New method to reset the uploader after cancel
    resetUploader() {
        console.debug("Resetting uploader");
        // Hide results and progress containers
        this.resultsContainer.classList.add('hidden');
        this.resultsContainer.style.display = 'none';
        this.progressContainer.classList.add('hidden');
        this.progressContainer.style.display = 'none';
        
        // Reset upload box to original state
        if (this.uploadBox) {
            const uploadText = this.uploadBox.querySelector('.upload-text');
            if (uploadText) {
                uploadText.innerHTML = `
                    <p>Drag & drop your transcript here or</p>
                    <button class="upload-button" id="default-upload-button">Choose File</button>
                `;
                
                // Add event listener to the button
                const newButton = uploadText.querySelector('#default-upload-button');
                if (newButton) {
                    newButton.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        setTimeout(() => {
                            if (this.fileInput) {
                                this.fileInput.value = '';
                                this.fileInput.click();
                            }
                        }, 50);
                    });
                }
            }
            
            // Reset upload icon
            const uploadIcon = this.uploadBox.querySelector('.upload-icon');
            if (uploadIcon) {
                uploadIcon.innerHTML = '<i class="fas fa-file-upload"></i>';
            }
            
            // Remove any success or error styles
            this.uploadBox.classList.remove('upload-error', 'upload-success');
        }
        
        // Reset file input to allow reselecting the same file
        if (this.fileInput) {
            this.fileInput.value = '';
        }
    }

    handleFile(file) {
        console.debug("handleFile called with file:", file.name, file.type, file.size);
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

        // Show progress immediately
        this.showProgress();
        
        // Show initial loading message
        this.updateProgress(5, 'Preparing to upload...');
        
        // Short delay to ensure UI updates
        setTimeout(() => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('email_address', user.email);

            console.debug('Creating FormData and starting fetch');
            
            // Show appropriate message based on file type
            const fileTypeMessage = file.type === 'application/pdf' 
                ? 'Processing PDF file... This may take a moment.'
                : 'Processing image file...';
                
            this.updateProgress(10, fileTypeMessage);

            fetch('/api/transcript/upload/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                }
            })
            .then(response => {
                console.debug('Received response:', response.status, response.statusText);
                if (response.status === 403) {
                    console.log('User not authenticated, redirecting to login');
                    window.location.href = '/login/';
                    throw new Error('Not authenticated');
                }
                
                this.updateProgress(50, 'Parsing transcript...');
                
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.debug('Received data:', data);
                if (data.error) {
                    throw new Error(data.error);
                }
                this.updateProgress(80, 'Analyzing course data...');
                
                // Process the response data with a delay to show loading progress
                setTimeout(() => {
                    this.updateProgress(95, 'Preparing results...');
                    
                    setTimeout(() => {
                        console.debug('Processing complete, preparing to show results');
                        // Keep progress visible but update text
                        this.updateProgress(100, 'Processing complete!');
                        
                        setTimeout(() => {
                            // Only hide progress after showing the results
                            if (data.courses && data.courses.length > 0) {
                                console.debug(`Found ${data.courses.length} courses to display`);
                                this.showResults(data.courses);
                            } else {
                                // Show message if no courses were found
                                console.debug('No courses found');
                                this.hideProgress();
                                this.resultsContainer.innerHTML = '<p>No courses could be detected in the transcript. Please try a clearer image or manually add your courses.</p>';
                                this.resultsContainer.classList.remove('hidden');
                                this.resultsContainer.style.display = 'block';
                                console.debug('Empty results message displayed');
                            }
                        }, 500);
                    }, 300);
                }, 300);
            })
            .catch(error => {
                console.error('Error processing transcript:', error);
                if (error.message !== 'Not authenticated') {
                    this.updateProgress(0, 'Error processing file');
                    setTimeout(() => {
                        this.hideProgress();
                        
                        // Update upload box to show error
                        if (this.uploadBox) {
                            const uploadText = this.uploadBox.querySelector('.upload-text');
                            if (uploadText) {
                                uploadText.innerHTML = `
                                    <p style="color: #F44336; font-weight: bold;">Error processing file: ${error.message}</p>
                                    <p>Please try again with a clearer image or a different file</p>
                                    <button class="upload-button" id="error-choose-another-file">Choose Another File</button>
                                `;
                                
                                // Add event listener to the new button
                                const newButton = uploadText.querySelector('#error-choose-another-file');
                                if (newButton) {
                                    newButton.addEventListener('click', (e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        
                                        setTimeout(() => {
                                            if (this.fileInput) {
                                                this.fileInput.value = '';
                                                this.fileInput.click();
                                            }
                                        }, 50);
                                    });
                                }
                            }
                            
                            // Change icon to error icon
                            const uploadIcon = this.uploadBox.querySelector('.upload-icon');
                            if (uploadIcon) {
                                uploadIcon.innerHTML = '<i class="fas fa-exclamation-circle" style="color: #F44336;"></i>';
                            }
                            
                            // Make sure supported formats section remains visible
                            const formatsSection = this.uploadBox.querySelector('.supported-formats');
                            if (formatsSection) {
                                formatsSection.style.display = 'block';
                            }
                        }
                        
                        // Reset file input
                        this.fileInput.value = '';
                    }, 1000);
                }
            });
        }, 100); // Short delay to ensure UI updates before fetch begins
    }

    showProgress() {
        console.debug("Showing progress container");
        this.progressContainer.classList.remove('hidden');
        // Explicitly set display to block to ensure visibility
        this.progressContainer.style.display = 'block';
        this.resultsContainer.classList.add('hidden');
        this.resultsContainer.style.display = 'none';
    }

    hideProgress() {
        console.debug("Hiding progress container");
        this.progressContainer.classList.add('hidden');
        this.progressContainer.style.display = 'none';
    }

    updateProgress(percent, message) {
        console.debug(`Updating progress: ${percent}%, "${message}"`);
        this.progressBar.style.width = `${percent}%`;
        this.progressText.textContent = message;
    }

    showResults(courses) {
        console.debug("showResults called with", courses.length, "courses");
        
        if (!courses || courses.length === 0) {
            console.debug("No courses to show");
            this.resultsContainer.innerHTML = '<p>No courses found in the transcript.</p>';
            this.resultsContainer.classList.remove('hidden');
            this.resultsContainer.style.display = 'block';
            return;
        }

        // Filter to only include database-matched courses
        const dbCourses = courses.filter(course => course.db_match === true);
        
        if (dbCourses.length === 0) {
            console.debug("No database-matched courses found");
            this.resultsContainer.innerHTML = '<p>No matching courses were found in our database. Try uploading a clearer image or add courses manually.</p>';
            this.resultsContainer.classList.remove('hidden');
            this.resultsContainer.style.display = 'block';
            return;
        }
        
        console.debug(`Showing ${dbCourses.length} database-matched courses`);
        
        const coursesGroupedBySemester = this.groupCoursesBySemester(dbCourses);
        console.debug("Courses grouped by semester:", Object.keys(coursesGroupedBySemester));
        
        let html = `
            <h3>Review and Select Courses to Add:</h3>
            <div class="course-stats-summary">
                <p>${dbCourses.length} courses found in your transcript</p>
                <p>Select the courses you want to add to your course plan</p>
            </div>
        `;
        
        Object.entries(coursesGroupedBySemester)
            .sort(([semA], [semB]) => this.compareSemesters(semA, semB))
            .forEach(([semester, semesterCourses]) => {
                console.debug(`Processing semester ${semester} with ${semesterCourses.length} courses`);
                
                html += `
                    <div class="semester-section">
                        <div class="semester-header">${semester}</div>
                        ${semesterCourses.map(course => {
                            console.debug(`Adding course ${course.code} to HTML`);
                            return `
                                <div class="course-item">
                                    <input type="checkbox" class="course-checkbox" 
                                           id="course-${course.code.replace(/\s+/g, '-')}"
                                           value='${JSON.stringify(course).replace(/'/g, "&#39;")}'
                                           data-name="${course.name}"
                                           data-credits="${course.credits || 3}"
                                           data-semester="${semester}"
                                           checked>
                                    <label for="course-${course.code.replace(/\s+/g, '-')}">
                                        <div class="course-code">${course.code}</div>
                                        <div class="course-name">${course.name}</div>
                                        <div class="course-credits">${course.credits || 3} Credits</div>
                                    </label>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
            });

        html += `
            <div class="action-buttons">
                <button id="confirm-courses-btn" class="confirm-btn">
                    Add Selected Courses
                </button>
                <button id="cancel-courses-btn" class="cancel-btn">
                    Cancel
                </button>
            </div>
        `;

        console.debug("Setting HTML on results container");
        this.resultsContainer.innerHTML = html;
        
        // Leave progress display visible during transition
        // Will be hidden after results are confirmed or canceled
        
        // Add event listeners to buttons after they're added to the DOM
        document.getElementById('confirm-courses-btn').addEventListener('click', () => {
            console.debug("Confirm button clicked");
            this.confirmSelectedCourses();
        });
        
        document.getElementById('cancel-courses-btn').addEventListener('click', () => {
            console.debug("Cancel button clicked");
            this.resetUploader();
        });
        
        console.debug("Removing 'hidden' class from results container");
        this.resultsContainer.classList.remove('hidden');
        
        // Force element to be visible
        this.resultsContainer.style.display = 'block';
        console.debug("Display style set to block");
        
        // Now hide progress after results are shown
        setTimeout(() => {
            this.hideProgress();
        }, 300);
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
            try {
                const courseData = JSON.parse(checkbox.value);
                const semesterName = courseData.semester;
                
                if (!coursesBySemester[semesterName]) {
                    coursesBySemester[semesterName] = [];
                }
                coursesBySemester[semesterName].push(courseData);
            } catch (error) {
                console.error('Error parsing course data:', error);
            }
        });
        
        Object.entries(coursesBySemester).forEach(([semesterName, courses]) => {
            let semester;
            
            // Parse semester information
            let term, year;
            if (semesterName.includes(' ')) {
                [term, year] = semesterName.split(' ');
                year = parseInt(year);
                
                if (isNaN(year)) {
                    const currentYear = new Date().getFullYear();
                    year = currentYear;
                    console.log(`Invalid year in semester "${semesterName}", using current year: ${year}`);
                }
                
                const validTerms = ['Spring', 'Summer', 'Fall', 'Winter'];
                if (!validTerms.includes(term)) {
                    term = 'Fall';  // Default to Fall if invalid term
                    console.log(`Invalid term "${term}" in semester "${semesterName}", using default: Fall`);
                }
            } else {
                const currentYear = new Date().getFullYear();
                term = 'Fall';
                year = currentYear;
                console.log(`Invalid semester format "${semesterName}", using default: ${term} ${year}`);
            }
            
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
        
        this.updateProgressDisplay("Saving your course selections...");
        
        const termOrder = { 'spring': 0, 'summer': 1, 'fall': 2, 'winter': 3 };
        coursePlan.semesters.sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return termOrder[a.term.toLowerCase()] - termOrder[b.term.toLowerCase()];
        });
        
        saveCoursePlan()
            .then(() => {
                // First, hide the progress and results containers
                this.hideProgressDisplay();
                this.resultsContainer.classList.add('hidden');
                this.resultsContainer.style.display = 'none';
                
                // Update the upload box to show success
                if (this.uploadBox) {
                    const totalCourses = Object.values(coursesBySemester).flat().length;
                    const uploadText = this.uploadBox.querySelector('.upload-text');
                    if (uploadText) {
                        uploadText.innerHTML = `
                            <p class="success-text" style="color: #4CAF50; font-weight: bold;">
                                Successfully added ${totalCourses} course${totalCourses !== 1 ? 's' : ''} to your plan!
                            </p>
                            <p>Upload another transcript or <a href="#course-planner-container" style="color: #005a5b; text-decoration: underline;">view your plan below</a></p>
                            <button class="upload-button" id="choose-another-file">Choose Another File</button>
                        `;
                        
                        // Get the new button and add a proper event listener
                        const newButton = uploadText.querySelector('#choose-another-file');
                        if (newButton) {
                            newButton.addEventListener('click', (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                
                                setTimeout(() => {
                                    if (this.fileInput) {
                                        this.fileInput.value = '';
                                        this.fileInput.click();
                                    }
                                }, 50);
                            });
                        }
                    }
                    
                    // Change upload icon to success icon
                    const uploadIcon = this.uploadBox.querySelector('.upload-icon');
                    if (uploadIcon) {
                        uploadIcon.innerHTML = '<i class="fas fa-check-circle" style="color: #4CAF50;"></i>';
                    }
                    
                    // Make sure supported formats section remains visible
                    const formatsSection = this.uploadBox.querySelector('.supported-formats');
                    if (formatsSection) {
                        formatsSection.style.display = 'block';
                    }
                }
                
                // Reset file input to allow new uploads
                if (this.fileInput) {
                    this.fileInput.value = '';
                }
                
                // Show notification
                showNotification('Courses have been added to your plan');
                
                // Render the updated semesters
                renderSemesters();
                
                // Scroll to course planner container after short delay
                setTimeout(() => {
                    document.getElementById('course-planner-container').scrollIntoView({ 
                        behavior: 'smooth' 
                    });
                }, 500);
            })
            .catch(error => {
                this.hideProgressDisplay();
                
                console.error('Error saving course plan:', error);
                alert('Failed to save course plan. Please try again.');
            });
    }
    
    updateProgressDisplay(message) {
        this.progressContainer.classList.remove('hidden');
        this.progressBar.style.width = '50%';
        this.progressText.textContent = message;
    }
    
    hideProgressDisplay() {
        this.progressContainer.classList.add('hidden');
    }
}

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

function showCourseSuggestions(courses, originalCode, originalName, originalCredits) {
    const popup = document.getElementById('course-popup');
    const content = popup.querySelector('.semester-popup-content');
    const originalContent = content.innerHTML;
    
    popup.dataset.originalContent = originalContent;
    
    let suggestionsHTML = `
        <button class="close-popup" onclick="closeCoursePopup()">&times;</button>
        <h2 class="semester-popup-title">Similar Courses</h2>
        <div class="course-suggestions">
    `;
    
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

function restoreOriginalCoursePopup() {
    const popup = document.getElementById('course-popup');
    const content = popup.querySelector('.semester-popup-content');
    
    if (popup.dataset.originalContent) {
        content.innerHTML = popup.dataset.originalContent;
        delete popup.dataset.originalContent;
    }
}

function selectSuggestedCourse(id, code, name, credits, rating, difficulty) {
    const currentSemesterId = document.getElementById('course-popup').dataset.semesterId;
    
    const course = {
        id: id,
        courseCode: code,
        courseName: name,
        credits: parseInt(credits),
        rating: rating || 0,
        difficulty: difficulty || 0
    };

    const semester = coursePlan.semesters.find(s => s.id === currentSemesterId);
    if (!semester) {
        alert('Semester not found');
        closeCoursePopup();
        return;
    }

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

function removeCourse(semesterId, courseId) {
    if (!confirm('Are you sure you want to remove this course?')) {
        return;
    }
    
    const semester = coursePlan.semesters.find(sem => sem.id === semesterId);
    if (!semester) {
        alert('Semester not found');
        return;
    }
    
    let courseIndex = semester.courses.findIndex(course => course.id === courseId);
    
    // If not found by ID, try to find it by custom ID formats that might be used by transcript parsing
    if (courseIndex === -1) {
        courseIndex = semester.courses.findIndex(course => {
            return (course.id && course.id.toString() === courseId.toString()) || 
                   (course.course_id && course.course_id.toString() === courseId.toString()) ||
                   (course.courseId && course.courseId.toString() === courseId.toString());
        });
    }
    
    // If still not found, try by courseCode
    if (courseIndex === -1) {
        console.log("Attempting to find course by additional properties...");
        
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
    
    if (courseIndex === -1) {
        console.error(`Failed to find course with ID: ${courseId} in semester ${semesterId}`);
        console.log("Available courses in this semester:", semester.courses);
        alert('Course not found. Please try refreshing the page.');
        return;
    }
    
    const course = semester.courses[courseIndex];
    
    const courseName = course.courseName || course.name || "this course";
    const courseCode = course.courseCode || course.code || "";
    
    semester.courses.splice(courseIndex, 1);
    
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

function showNotification(message) {
    let notification = document.getElementById('planner-notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'planner-notification';
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    notification.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function setupStarRating() {
    const starRating = document.getElementById('min-rating');
    const stars = starRating.querySelectorAll('.star');
    
    // Remove existing event listeners by cloning and replacing each star
    stars.forEach(star => {
        const newStar = star.cloneNode(true);
        star.parentNode.replaceChild(newStar, star);
    });
    
    // Get the fresh stars and add new event listeners
    const freshStars = starRating.querySelectorAll('.star');
    freshStars.forEach(star => {
        star.addEventListener('click', function() {
            const value = parseInt(this.getAttribute('data-value'));
            console.log(`Star clicked: ${value}`);
            
            if (this.classList.contains('active') && 
                !this.nextElementSibling?.classList.contains('active')) {
                starRating.querySelectorAll('.star').forEach(s => {
                    s.classList.remove('active');
                });
                console.log('All stars deselected');
            } else {
                starRating.querySelectorAll('.star').forEach(s => {
                    const starValue = parseInt(s.getAttribute('data-value'));
                    if (starValue <= value) {
                        s.classList.add('active');
                    } else {
                        s.classList.remove('active');
                    }
                });
                console.log(`Stars set to: ${value}`);
            }
        });
    });
}

function setupDifficultyRating() {
    const difficultyRating = document.getElementById('max-difficulty');
    const dots = difficultyRating.querySelectorAll('.difficulty-dot');
    
    dots.forEach(dot => {
        const newDot = dot.cloneNode(true);
        dot.parentNode.replaceChild(newDot, dot);
    });
    
    const freshDots = difficultyRating.querySelectorAll('.difficulty-dot');
    freshDots.forEach(dot => {
        dot.addEventListener('click', function() {
            const value = parseInt(this.getAttribute('data-value'));
            console.log(`Difficulty dot clicked: ${value}`);
            
            if (this.classList.contains('active') && 
                !this.previousElementSibling?.classList.contains('active')) {
                difficultyRating.querySelectorAll('.difficulty-dot').forEach(d => {
                    d.classList.remove('active');
                });
                console.log('All difficulty dots deselected');
            } else {
                difficultyRating.querySelectorAll('.difficulty-dot').forEach(d => {
                    const dotValue = parseInt(d.getAttribute('data-value'));
                    if (dotValue <= value) {
                        d.classList.add('active');
                    } else {
                        d.classList.remove('active');
                    }
                });
                console.log(`Difficulty set to: ${value}`);
            }
        });
    });
}

async function searchCourses(semesterId) {
    if (!semesterId && currentSemesterId) {
        semesterId = currentSemesterId;
    }
    
    console.log(`Searching courses for semester ID: ${semesterId}`);
    
    const department = document.getElementById('department-filter').value.trim();
    const title = document.getElementById('course-title-filter').value.trim();
    const minNumber = document.getElementById('min-course-number').value.trim();
    const maxNumber = document.getElementById('max-course-number').value.trim();
    const professor = document.getElementById('professor-filter').value.trim();
    const credits = document.getElementById('credits-filter').value.trim();
    
    const activeStars = document.querySelectorAll('.star-rating .star.active');
    const minRating = activeStars.length > 0 ? activeStars.length : '';
    console.log(`Min rating filter: ${minRating}`);
    
    const activeDots = document.querySelectorAll('.difficulty-rating .difficulty-dot.active');
    const maxDifficulty = activeDots.length > 0 ? activeDots.length : '';
    console.log(`Max difficulty filter: ${maxDifficulty}`);
    
    const filters = {};
    if (department) filters.department = department;
    if (title) filters.title = title;
    if (minNumber) filters.min_number = minNumber;
    if (maxNumber) filters.max_number = maxNumber;
    if (professor) filters.professor = professor;
    if (credits) filters.credits = credits;
    if (minRating) filters.min_rating = minRating;
    if (maxDifficulty) filters.max_difficulty = maxDifficulty;
    
    console.log('Search filters:', filters);
    
    document.getElementById('course-results').innerHTML = `
        <div class="empty-results">
            <p>Searching for courses...</p>
        </div>
    `;
    document.getElementById('result-count').textContent = 'Searching...';
    
    try {
        const queryString = new URLSearchParams(filters).toString();
        
        const response = await fetch(`/api/filter-courses/?${queryString}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
            throw new Error(`Error searching courses: ${response.status}`);
        }
        
        const courses = await response.json();
        console.log(`API returned ${courses.length} courses`);
        
        // Apply client-side filtering for transcript-added courses in current semester
        let filteredCourses = [...courses]; // Create a copy to avoid modifying the original
        
        // If min rating is set, ensure we also consider it for semester courses
        if (semesterId) {
            const allSemesters = coursePlan.semesters;
            console.log(`Total semesters in plan: ${allSemesters.length}`);
            
            const semester = allSemesters.find(s => s.id === semesterId);
            
            if (semester) {
                console.log(`Found semester: ${semester.term} ${semester.year} with ${semester.courses.length} courses`);
                
                if (semester.courses.length > 0) {
                    console.log('Semester courses:', JSON.stringify(semester.courses.slice(0, 3)));
                    
                    let includedSemesterCourses = [...semester.courses];
                    
                    if (minRating) {
                        const minRatingValue = parseFloat(minRating);
                        console.log(`Filtering semester courses by min rating: ${minRatingValue}`);
                        
                        includedSemesterCourses = includedSemesterCourses.filter(course => {
                            const courseRating = parseFloat(course.rating || course.avg_rating || 0);
                            const included = courseRating >= minRatingValue;
                            
                            if (!included) {
                                console.log(`Excluding semester course: ${course.courseCode || course.code} (rating: ${courseRating})`);
                            }
                            
                            return included;
                        });
                    }
                    
                    // Apply max difficulty filter if set
                    if (maxDifficulty) {
                        const maxDifficultyValue = parseFloat(maxDifficulty);
                        console.log(`Filtering semester courses by max difficulty: ${maxDifficultyValue}`);
                        
                        includedSemesterCourses = includedSemesterCourses.filter(course => {
                            const courseDifficulty = parseFloat(course.difficulty || course.avg_difficulty || 0);
                            return courseDifficulty <= maxDifficultyValue;
                        });
                    }
                    
                    console.log(`${includedSemesterCourses.length} semester courses match the filter criteria`);
                    
                    includedSemesterCourses.forEach(semesterCourse => {
                        const alreadyInResults = filteredCourses.some(c => {
                            const idMatch = c.id === semesterCourse.id;
                            const codeMatch = (c.subject && semesterCourse.courseCode) ? 
                                `${c.subject} ${c.number}` === semesterCourse.courseCode : false;
                            
                            return idMatch || codeMatch;
                        });
                        
                        if (!alreadyInResults) {
                            console.log(`Adding semester course to results: ${semesterCourse.courseCode || semesterCourse.code || 'Unknown'}`);
                            
                            const courseCode = semesterCourse.courseCode || semesterCourse.code || '';
                            const [subject, number] = courseCode.split(' ');
                            
                            filteredCourses.push({
                                id: semesterCourse.id,
                                title: semesterCourse.courseName || semesterCourse.name,
                                subject: subject || '',
                                number: number || '',
                                credits: semesterCourse.credits || 3,
                                avg_rating: semesterCourse.rating || 0,
                                avg_difficulty: semesterCourse.difficulty || 0,
                                is_semester_course: true  // Mark as semester course
                            });
                        }
                    });
                }
            } else {
                console.log(`Semester with ID ${semesterId} not found in course plan`);
                console.log('Available semesters:', allSemesters.map(s => ({ id: s.id, term: s.term, year: s.year })));
            }
        }
        
        if (department) {
            const deptLower = department.toLowerCase();
            filteredCourses = filteredCourses.filter(course => {
                const courseSubject = course.subject || 
                    (course.courseCode ? course.courseCode.split(' ')[0] : "");
                return courseSubject.toLowerCase().includes(deptLower);
            });
        }
        
        if (title) {
            const titleLower = title.toLowerCase();
            filteredCourses = filteredCourses.filter(course => {
                const courseTitle = course.title || course.courseName || "";
                return courseTitle.toLowerCase().includes(titleLower);
            });
        }
        
        console.log(`Final filtered result count: ${filteredCourses.length}`);
        displaySearchResults(filteredCourses);
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
    
    document.getElementById('result-count').textContent = `${courses.length} courses found`;    
    resultsContainer.innerHTML = '';
    
    // Generate HTML for each course result
    courses.forEach(course => {
        const isSelected = selectedCourses.some(selected => selected.id === course.id);
        
        const courseCode = course.is_semester_course ? 
            course.courseCode || `${course.subject} ${course.number}` : 
            `${course.subject} ${course.number}`;
            
        const courseTitle = course.is_semester_course ? 
            course.courseName || course.title : 
            course.title;
            
        const credits = course.credits || 3;
        
        const rating = parseFloat(course.avg_rating || course.rating || 0);
        const difficulty = parseFloat(course.avg_difficulty || course.difficulty || 0);
        
        const resultItem = document.createElement('div');
        resultItem.className = 'course-result-item';
        resultItem.setAttribute('data-id', course.id);
        resultItem.setAttribute('data-source', course.is_semester_course ? 'semester' : 'api');
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'course-checkbox';
        checkbox.setAttribute('data-id', course.id);
        checkbox.setAttribute('data-code', courseCode);
        checkbox.setAttribute('data-name', courseTitle);
        checkbox.setAttribute('data-credits', credits);
        checkbox.setAttribute('data-rating', rating);
        checkbox.setAttribute('data-difficulty', difficulty);
        if (isSelected) {
            checkbox.checked = true;
        }
        
        checkbox.addEventListener('change', function() {
            const courseId = this.getAttribute('data-id');
            const courseCode = this.getAttribute('data-code');
            const courseName = this.getAttribute('data-name');
            const credits = parseInt(this.getAttribute('data-credits'));
            const rating = parseFloat(this.getAttribute('data-rating'));
            const difficulty = parseFloat(this.getAttribute('data-difficulty'));
            
            if (this.checked) {
                selectedCourses.push({
                    id: courseId,
                    courseCode: courseCode,
                    courseName: courseName,
                    credits: credits,
                    rating: rating,
                    difficulty: difficulty
                });
            } else {
                selectedCourses = selectedCourses.filter(course => course.id !== courseId);
            }
            
            updateSelectedCoursesList();
        });
        
        const courseInfo = document.createElement('div');
        courseInfo.className = 'course-info-preview';
        
        const codeEl = document.createElement('div');
        codeEl.className = 'course-code-preview';
        codeEl.textContent = courseCode;
        courseInfo.appendChild(codeEl);
        
        const titleEl = document.createElement('div');
        titleEl.className = 'course-title-preview';
        titleEl.textContent = courseTitle;
        courseInfo.appendChild(titleEl);
        
        const metaEl = document.createElement('div');
        metaEl.className = 'course-meta-preview';
        
        const creditsEl = document.createElement('div');
        creditsEl.className = 'course-credits-preview';
        
        const creditIcon = document.createElement('i');
        creditIcon.className = 'fas fa-book';
        creditsEl.appendChild(creditIcon);
        
        creditsEl.appendChild(document.createTextNode(` ${credits} Credits`));
        metaEl.appendChild(creditsEl);
        
        const ratingEl = document.createElement('div');
        ratingEl.className = 'course-rating-preview';
        
        const ratingIcon = document.createElement('i');
        ratingIcon.className = 'fas fa-star';
        ratingEl.appendChild(ratingIcon);
        
        ratingEl.appendChild(document.createTextNode(` ${rating ? rating.toFixed(1) : 'N/A'}`));
        metaEl.appendChild(ratingEl);
        
        const difficultyEl = document.createElement('div');
        difficultyEl.className = 'course-difficulty-preview';
        
        const difficultyIcon = document.createElement('i');
        difficultyIcon.className = 'fas fa-chart-bar';
        difficultyEl.appendChild(difficultyIcon);
        
        difficultyEl.appendChild(document.createTextNode(' Difficulty: '));
        
        const indicatorEl = document.createElement('span');
        indicatorEl.className = 'difficulty-indicator';
        
        const difficultyLevel = Math.floor(difficulty) || 0;
        if (difficultyLevel <= 2) {
            indicatorEl.classList.add('difficulty-level-1');
        } else if (difficultyLevel <= 4) {
            indicatorEl.classList.add('difficulty-level-3');
        } else {
            indicatorEl.classList.add('difficulty-level-5');
        }
        
        difficultyEl.appendChild(indicatorEl);
        difficultyEl.appendChild(document.createTextNode(` ${difficulty ? difficulty.toFixed(1) : 'N/A'}`));
        
        metaEl.appendChild(difficultyEl);
        courseInfo.appendChild(metaEl);
        
        // Assemble the result item
        resultItem.appendChild(checkbox);
        resultItem.appendChild(courseInfo);
        
        resultsContainer.appendChild(resultItem);
    });
}

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

async function addSelectedCourses() {
    if (selectedCourses.length === 0) {
        alert('Please select at least one course to add');
        return;
    }
    
    try {
        const semester = coursePlan.semesters.find(s => s.id === currentSemesterId);
        if (!semester) {
            throw new Error('Semester not found');
        }
        
        let addedCount = 0;
        let duplicateCount = 0;
        
        selectedCourses.forEach(course => {
            const existingCourse = semester.courses.find(c => c.id === course.id);
            if (existingCourse) {
                duplicateCount++;
                return; 
            }
            
            semester.courses.push(course);
            addedCount++;
        });
        
        await saveCoursePlan();
        renderSemesters();
        closeCoursePopup();
        
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

window.submitSemester = submitSemester;
window.closeSemesterPopup = closeSemesterPopup;
window.showSemesterPopup = showSemesterPopup;
window.showCoursePopup = showCoursePopup;
window.closeCoursePopup = closeCoursePopup;
window.searchCourses = searchCourses;
window.addSelectedCourses = addSelectedCourses;
window.removeSemester = removeSemester;
window.removeCourse = removeCourse;

// Function to set up a mutation observer for upload buttons
function setupUploadButtonObserver() {
    // Select the upload container that will contain dynamically added buttons
    const uploadContainer = document.querySelector('.upload-container');
    if (!uploadContainer) return;
    
    // Create a configuration for the observer (what to observe)
    const config = { childList: true, subtree: true };
    
    // Create an observer instance
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            // Check if nodes were added
            if (mutation.addedNodes.length) {
                // Check each added node for upload-button class
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        // Check the node itself
                        if (node.classList && node.classList.contains('upload-button')) {
                            // Prevent the default click behavior to stop immediate file browser popup
                            node.addEventListener('click', (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                
                                // Set a small timeout to prevent double file dialogs
                                setTimeout(() => {
                                    const fileInput = document.getElementById('transcript-file');
                                    if (fileInput) {
                                        fileInput.click();
                                    }
                                }, 50);
                            });
                        }
                        
                        // Also check children for upload-button class
                        const buttons = node.querySelectorAll('.upload-button');
                        buttons.forEach(button => {
                            // Prevent the default click behavior
                            button.addEventListener('click', (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                
                                // Set a small timeout to prevent double file dialogs
                                setTimeout(() => {
                                    const fileInput = document.getElementById('transcript-file');
                                    if (fileInput) {
                                        fileInput.click();
                                    }
                                }, 50);
                            });
                        });
                    }
                });
            }
        });
    });
    
    // Start observing the upload container
    observer.observe(uploadContainer, config);
}