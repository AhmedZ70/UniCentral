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