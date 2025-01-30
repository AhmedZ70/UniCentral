import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

const firebaseConfig = {
    apiKey: "AIzaSyD0wF4R9GdY2m7eAwVL_j_mihLit4rRZ5Q",
    authDomain: "unicentral-b6c23.firebaseapp.com",
    projectId: "unicentral-b6c23",
    storageBucket: "unicentral-b6c23.firebasestorage.app",
    messagingSenderId: "554502030441",
    appId: "1:554502030441:web:6dccab580dbcfdb974cef8",
    measurementId: "G-M4L04508RH",
    clientId: "554502030441-g68f3tti18fiip1hpr6ehn6q6u5sn8fh.apps.googleusercontent.com"
};

// Initialize Firebase only once
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.addEventListener("DOMContentLoaded", () => {
    let myCourses = [];
    let unsubscribe = null;

    // DOM Elements
    const semesterSelect = document.getElementById('semester-values');
    const sortSelect = document.querySelector('.courses-sort');

    // Initialize the page with authentication check
    unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in
            const userEmail = user.email;
            console.log("User is signed in with email:", userEmail);
            initializePage(userEmail);
        } else {
            // User is not signed in, redirect to login
            console.log("No user signed in, redirecting to login");
            window.location.href = '/login/';
        }
    });

    // Clean up auth listener when leaving the page
    window.addEventListener('unload', () => {
        if (unsubscribe) {
            unsubscribe();
        }
    });

    function initializePage(userEmail) {
        // Set up event listeners
        if (semesterSelect) {
            // Add "All Semesters" option
            const allOption = document.createElement('option');
            allOption.value = 'all';
            allOption.textContent = 'All Semesters';
            semesterSelect.appendChild(allOption);

            semesterSelect.addEventListener('change', () => filterCoursesBySemester(semesterSelect.value));
        }

        if (sortSelect) {
            sortSelect.addEventListener('change', () => sortCourses(sortSelect.value));
        }

        // Initial fetch of courses
        fetchAllCourses(userEmail);
    }

    // Fetch all courses and populate semester select
    async function fetchAllCourses(userEmail) {
        try {
            const response = await fetch(`/api/my_courses/?email=${encodeURIComponent(userEmail)}`, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to load courses (status ${response.status})`);
            }
            const data = await response.json();
            myCourses = data;

            // Get unique semesters from courses
            const semesters = [...new Set(myCourses.map(course => course.semester))];

            // Sort semesters (assuming format like "Spring 2025", "Fall 2024", etc.)
            semesters.sort((a, b) => {
                const [termA, yearA] = a.split(' ');
                const [termB, yearB] = b.split(' ');

                if (yearA !== yearB) {
                    return parseInt(yearB) - parseInt(yearA);
                }

                // Custom sort for terms within the same year
                const termOrder = { 'Spring': 0, 'Summer': 1, 'Fall': 2 };
                return termOrder[termA] - termOrder[termB];
            });

            // Clear existing options except "All Semesters"
            while (semesterSelect.children.length > 1) {
                semesterSelect.removeChild(semesterSelect.lastChild);
            }

            // Populate semester select
            semesters.forEach(semester => {
                const option = document.createElement('option');
                option.value = semester;
                option.textContent = semester;
                semesterSelect.appendChild(option);
            });

            // Display all courses initially
            displayCourses(myCourses);
        } catch (error) {
            console.error('Error fetching courses:', error);
        }
    }

    // Filter courses by semester
    function filterCoursesBySemester(selectedSemester) {
        if (selectedSemester === 'all') {
            displayCourses(myCourses);
        } else {
            const filteredCourses = myCourses.filter(course => course.semester === selectedSemester);
            displayCourses(filteredCourses);
        }
    }

    // Sort courses
    function sortCourses(sortType) {
        // Get current displayed courses (filtered or all)
        const currentSemester = semesterSelect.value;
        const coursesToSort = currentSemester === 'all' ? 
            [...myCourses] : // Create a copy to avoid modifying original array
            myCourses.filter(course => course.semester === currentSemester);

        switch (sortType) {
            case 'a-z':
                coursesToSort.sort((a, b) => `${a.subject}${a.number}`.localeCompare(`${b.subject}${b.number}`));
                break;
            case 'z-a':
                coursesToSort.sort((a, b) => `${a.subject}${a.number}`.localeCompare(`${b.subject}${b.number}`));
                break;
        }
        displayCourses(coursesToSort);
    }

    function createDifficultyDots(difficulty) {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "120");
        svg.setAttribute("height", "20");
        svg.setAttribute("viewBox", "0 0 120 20");

        const colors = [
            { start: 0, end: 2, color: "#4CAF50" },   // Green
            { start: 2, end: 4, color: "#FFC107" },   // Yellow
            { start: 4, end: 6, color: "#F44336" }    // Red
        ];

        colors.forEach((colorGroup, groupIndex) => {
            for (let i = 0; i < 2; i++) {
                const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                circle.setAttribute("cx", `${(groupIndex * 40 + i * 20) + 10}`);
                circle.setAttribute("cy", "10");
                circle.setAttribute("r", "8");
                circle.setAttribute("fill", "none");
                circle.setAttribute("stroke", colorGroup.color);
                circle.setAttribute("stroke-width", "3");

                const fillPercentage = Math.max(0, Math.min(1, 
                    Math.max(0, Math.min(1, 
                        (difficulty - colorGroup.start) / 2
                    ))
                ));

                const fillCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                fillCircle.setAttribute("cx", `${(groupIndex * 40 + i * 20) + 10}`);
                fillCircle.setAttribute("cy", "10");
                fillCircle.setAttribute("r", "8");
                fillCircle.setAttribute("fill", fillPercentage > 0 ? colorGroup.color : "transparent");
                fillCircle.setAttribute("opacity", fillPercentage);

                svg.appendChild(circle);
                svg.appendChild(fillCircle);
            }
        });

        return svg;
    }

    // Display courses in the container
    function displayCourses(courses) {
        const container = document.querySelector('.my-courses');
        const coursesSection = container.querySelector('.course-cards') || container;

        // Clear existing cards (but keep the sort section)
        const existingCards = container.querySelectorAll('.course-card');
        existingCards.forEach(card => card.remove());
        console.log("course length: ", courses.length);
        if (courses.length === 0) {
            const courseCard = document.createElement('div');
            courseCard.className = 'no-courses';
            courseCard.innerHTML = `
                <h3>There are no courses to display. Add a course to see your courses.</h3>
            `;
            coursesSection.appendChild(courseCard);  // Add this line to append the message
            return;  // Add this line to stop the function here
        }

        courses.forEach(course => {
            const courseCard = document.createElement('div');
            courseCard.className = 'course-card';
            courseCard.innerHTML = `
                <div class="course-info">
                    <div class="title-section">
                        <h3>${course.subject} ${course.number} ${course.title}</h3>
                        ${course.required_course ? '<span class="required">REQUIRED</span>' : ''}
                    </div>
                    <p>${course.semester} / In person</p>
                    <div class="difficulty-rating">
                        <p>Difficulty:</p>
                    </div>
                    <p>Average Grade: ${course.grade || 'N/A'}</p>
                </div>
                <div class="course-right">
                    <p>Overall course rating:</p>
                    <div class="rating-container">
                        <img src="/static/assets/star.png" alt="star rating">
                        <span class="rating-number">${(course.avg_rating || 0).toFixed(1)}</span>
                    </div>
                </div>
            `;
            const difficultyRating = courseCard.querySelector('.difficulty-rating');
            const difficultyDots = createDifficultyDots(course.avg_difficulty || 0);
            difficultyRating.appendChild(difficultyDots);

            coursesSection.appendChild(courseCard);
        });
    }
});