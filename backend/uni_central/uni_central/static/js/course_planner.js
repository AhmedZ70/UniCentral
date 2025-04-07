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
    const semesterId = `${term.toLowerCase()}-${year}`;
    const semester = {
        id: semesterId,
        term: term,
        year: parseInt(year),
        courses: []
    };
    
    // Check if semester already exists
    const existingSemester = coursePlan.semesters.find(s => s.id === semesterId);
    if (existingSemester) {
        return existingSemester;
    }
    
    coursePlan.semesters.push(semester);
    
    // Sort semesters by year and term
    coursePlan.semesters.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        const termOrder = { spring: 0, summer: 1, fall: 2, winter: 3 };
        return termOrder[a.term.toLowerCase()] - termOrder[b.term.toLowerCase()];
    });
    
    return semester;
}

// Function to add a course to a semester
function addCourse(semesterId, courseCode, courseName, credits) {
    const semester = coursePlan.semesters.find(s => s.id === semesterId);
    if (!semester) {
        console.error(`Semester with ID ${semesterId} not found`);
        return null;
    }
    
    // Check if course already exists in the semester
    const existingCourse = semester.courses.find(c => c.courseCode === courseCode);
    if (existingCourse) {
        console.log(`Course ${courseCode} already exists in semester ${semesterId}`);
        return existingCourse;
    }
    
    const course = {
        courseCode: courseCode,
        courseName: courseName,
        credits: parseInt(credits),
        id: Math.random().toString(36).slice(2, 11) // Generate a unique ID for the course
    };
    
    semester.courses.push(course);
    console.log(`Added course ${courseCode} to semester ${semesterId}`);
    return course;
}

// Function to remove a course
function removeCourse(semesterId, courseId) {
    const semester = coursePlan.semesters.find(sem => sem.id === semesterId);
    if (semester) {
        semester.courses = semester.courses.filter(course => course.id !== courseId);
        renderSemesters();
        saveCoursePlan();
    }
}

// Function to remove a semester
function removeSemester(semesterId) {
    coursePlan.semesters = coursePlan.semesters.filter(sem => sem.id !== semesterId);
    renderSemesters();
    saveCoursePlan();
}

// Function to render all semesters and their courses
function renderSemesters() {
    const container = document.getElementById('course-planner-container');
    container.innerHTML = '';

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
    const courseDiv = document.createElement('div');
    courseDiv.className = 'course-card';
    courseDiv.innerHTML = `
        <h4>${course.courseCode}</h4>
        <p>${course.courseName}</p>
        <p>Credits: ${course.credits}</p>
        <button onclick="removeCourse('${semesterId}', '${course.id}')">Remove</button>
    `;
    return courseDiv;
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

function submitCourse() {
    const courseCode = document.getElementById('course-code').value;
    const courseName = document.getElementById('course-name').value;
    const credits = document.getElementById('course-credits').value;
    
    if (courseCode && courseName && credits) {
        const currentSemesterId = document.getElementById('course-popup').dataset.semesterId;
        addCourse(currentSemesterId, courseCode, courseName, parseInt(credits));
        closeCoursePopup();
    }
}

function showCoursePopup(semesterId) {
    const popup = document.getElementById('course-popup');
    popup.dataset.semesterId = semesterId;
    popup.classList.add('active');
}

function closeCoursePopup() {
    document.getElementById('course-popup').classList.remove('active');
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
                // Check if course already exists in semester
                const existingCourse = semester.courses.find(c => 
                    c.courseCode.toLowerCase() === course.code.toLowerCase()
                );
                
                if (!existingCourse) {
                    semester.courses.push({
                        id: `${course.code.replace(/\s+/g, '-')}-${Date.now()}`,
                        courseCode: course.code,
                        courseName: course.name,
                        credits: course.credits
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
        saveCoursePlan(coursePlan)
            .then(() => {
                // Hide the results container
                document.getElementById('results-container').style.display = 'none';
                // Show success message
                alert('Selected courses have been added to your course plan.');
                // Refresh the course plan display
                displayCoursePlan();
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