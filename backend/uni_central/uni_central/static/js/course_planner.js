// Data structure to store all semesters and their courses
let coursePlan = {
    semesters: []
};

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

function createCourseElement(semesterId, course) {
    const courseDiv = document.createElement('div');
    courseDiv.className = 'course-card';
    courseDiv.innerHTML = `
        <h4>${course.courseSubject} ${course.courseNumber}</h4>
        <p>${course.courseName}</p>
        <p>Credits: ${course.credits}</p>
        <button onclick="removeCourse('${semesterId}', '${course.id}')">Remove</button>
    `;
    return courseDiv;
}
// Function to add a new semester
function addSemester(term, year) {
    const newSemester = new Semester(term, year);
    coursePlan.semesters.push(newSemester);
    renderSemesters();
    return newSemester;
}

// Function to add a course to a semester
function addCourse(semesterId, courseCode, courseName, credits) {
    const semester = coursePlan.semesters.find(sem => sem.id === semesterId);
    if (semester) {
        const newCourse = new Course(courseCode, courseName, credits);
        semester.courses.push(newCourse);
        renderSemesters();
        return newCourse;
    }
    return null;
}

// Function to remove a course
function removeCourse(semesterId, courseId) {
    const semester = coursePlan.semesters.find(sem => sem.id === semesterId);
    if (semester) {
        semester.courses = semester.courses.filter(course => course.id !== courseId);
        renderSemesters();
    }
}

// Function to remove a semester
function removeSemester(semesterId) {
    coursePlan.semesters = coursePlan.semesters.filter(sem => sem.id !== semesterId);
    renderSemesters();
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

document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('.add-semester').addEventListener('click', showSemesterPopup);
    
    renderSemesters();
});

class TranscriptParser {
    constructor() {
        this.uploadBox = document.getElementById('upload-box');
        this.fileInput = document.getElementById('transcript-file');
        this.progressContainer = document.getElementById('upload-progress');
        this.progressBar = this.progressContainer.querySelector('.progress-fill');
        this.progressText = this.progressContainer.querySelector('.progress-text');
        this.resultsPreview = document.getElementById('results-preview');
        this.coursesList = document.getElementById('parsed-courses-list');
        this.confirmButton = document.getElementById('confirm-courses');
        this.cancelButton = document.getElementById('cancel-parsing');
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // File input change event
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Drag and drop events
        this.uploadBox.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.uploadBox.style.borderColor = '#007bff';
        });

        this.uploadBox.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.uploadBox.style.borderColor = '#ccc';
        });

        this.uploadBox.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.uploadBox.style.borderColor = '#ccc';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFile(files[0]);
            }
        });

        // Click to upload
        this.uploadBox.addEventListener('click', () => {
            this.fileInput.click();
        });

        // Confirm and cancel buttons
        this.confirmButton.addEventListener('click', () => this.confirmSelectedCourses());
        this.cancelButton.addEventListener('click', () => this.resetUpload());
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.handleFile(file);
        }
    }

    async handleFile(file) {
        // Validate file type and size
        const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'text/csv'];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!validTypes.includes(file.type)) {
            alert('Please upload a valid PDF, image, or CSV file.');
            return;
        }

        if (file.size > maxSize) {
            alert('File size must be less than 10MB.');
            return;
        }

        // Show progress
        this.showProgress();
        this.updateProgress(0, 'Starting file processing...');

        try {
            const formData = new FormData();
            formData.append('transcript', file);

            // Get CSRF token
            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

            // Send file to backend
            const response = await fetch('/api/transcript/upload/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to process transcript');
            }

            const data = await response.json();
            this.updateProgress(100, 'Processing complete!');
            
            // Show results
            setTimeout(() => {
                this.hideProgress();
                this.showResults(data.courses);
            }, 500);

        } catch (error) {
            console.error('Error processing transcript:', error);
            this.updateProgress(0, 'Error processing file. Please try again.');
            setTimeout(() => {
                this.resetUpload();
            }, 2000);
        }
    }

    showProgress() {
        this.uploadBox.classList.add('hidden');
        this.progressContainer.classList.remove('hidden');
        this.resultsPreview.classList.add('hidden');
    }

    hideProgress() {
        this.progressContainer.classList.add('hidden');
    }

    updateProgress(percent, message) {
        this.progressBar.style.width = `${percent}%`;
        this.progressText.textContent = message;
    }

    showResults(courses) {
        this.coursesList.innerHTML = '';
        
        courses.forEach(course => {
            const courseElement = document.createElement('div');
            courseElement.className = 'course-item';
            
            const confidenceClass = course.confidence >= 0.8 ? 'high' : 
                                  course.confidence >= 0.6 ? 'medium' : 'low';
            
            courseElement.innerHTML = `
                <input type="checkbox" class="course-checkbox" ${course.confidence >= 0.8 ? 'checked' : ''}>
                <div class="course-info">
                    <div class="course-code">${course.code}</div>
                    <div class="course-name">${course.name}</div>
                </div>
                <span class="match-confidence confidence-${confidenceClass}">
                    ${Math.round(course.confidence * 100)}% match
                </span>
            `;
            
            this.coursesList.appendChild(courseElement);
        });
        
        this.resultsPreview.classList.remove('hidden');
    }

    async confirmSelectedCourses() {
        const selectedCourses = Array.from(this.coursesList.querySelectorAll('.course-item'))
            .filter(item => item.querySelector('.course-checkbox').checked)
            .map(item => ({
                code: item.querySelector('.course-code').textContent,
                name: item.querySelector('.course-name').textContent
            }));

        if (selectedCourses.length === 0) {
            alert('Please select at least one course to add.');
            return;
        }

        // Add selected courses to the planner
        selectedCourses.forEach(course => {
            // Assuming addCourse is a global function that adds a course to the current semester
            addCourse(course.code, course.name);
        });

        this.resetUpload();
    }

    resetUpload() {
        this.fileInput.value = '';
        this.uploadBox.classList.remove('hidden');
        this.progressContainer.classList.add('hidden');
        this.resultsPreview.classList.add('hidden');
        this.progressBar.style.width = '0%';
    }
}

// Initialize TranscriptParser when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const transcriptParser = new TranscriptParser();
});