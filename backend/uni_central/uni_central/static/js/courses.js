/**
 * This file handles the logic for displaying a list of departments and their associated courses. 
 * It fetches department data from the server, renders them in a categorized manner (by first letter), 
 * and provides a mechanism to navigate into each department to fetch and display its courses. 
 * Users can also navigate back to the list of departments from the courses view.
 */

document.addEventListener("DOMContentLoaded", () => {
    // ------------------------------------------------------------------------
    // [Section 1: Setup constants and initial UI state]
    // ------------------------------------------------------------------------
    const departmentsApiUrl = "/api/departments/";
    const departmentsContainer = document.getElementById("departments");
    const coursesContainer = document.getElementById("courses");
    const breadcrumbContainer = document.getElementById("breadcrumb");

    // Set initial visibility
    departmentsContainer.classList.add("visible");
    coursesContainer.classList.add("hidden");

    // ------------------------------------------------------------------------
    // [Section 2: Fetch and Display Departments]
    // ------------------------------------------------------------------------
    fetch(departmentsApiUrl)
        .then((response) => response.json())
        .then((data) => renderDepartments(data))
        .catch((error) => {
            console.error("Error fetching departments:", error);
            departmentsContainer.innerHTML =
                "<p>Failed to load departments. Please try again later.</p>";
        });

    // ------------------------------------------------------------------------
    // [Function: Render Departments]
    // ------------------------------------------------------------------------
    function renderDepartments(departments) {
        if (!departments || departments.length === 0) {
            departmentsContainer.innerHTML = "<p>No departments available.</p>";
            return;
        }

        departmentsContainer.innerHTML = "";

        // Sort by department name
        const sortedDepts = departments.sort((a, b) =>
            a.name.localeCompare(b.name)
        );

        // Group departments by first letter
        const grouped = sortedDepts.reduce((acc, dept) => {
            const letter = dept.name.charAt(0).toUpperCase();
            acc[letter] = acc[letter] || [];
            acc[letter].push(dept);
            return acc;
        }, {});

        // Build the DOM elements (letter groups and department links)
        for (const [letter, depts] of Object.entries(grouped)) {
            const letterGroup = document.createElement("div");
            letterGroup.classList.add("letter-group");

            const letterHeader = document.createElement("h3");
            letterHeader.classList.add("letter-header");
            letterHeader.textContent = letter;
            letterGroup.appendChild(letterHeader);

            const deptContainer = document.createElement("div");
            deptContainer.classList.add("department-container");

            depts.forEach((dept) => {
                const link = document.createElement("a");
                link.href = "#";
                link.classList.add("department-link");
                link.addEventListener("click", (e) => {
                    e.preventDefault();
                    showCourses(dept.id, dept.name);
                });

                const deptDiv = document.createElement("div");
                deptDiv.classList.add("department");
                deptDiv.textContent = dept.name;

                link.appendChild(deptDiv);
                deptContainer.appendChild(link);
            });

            letterGroup.appendChild(deptContainer);
            departmentsContainer.appendChild(letterGroup);
        }
    }

    // Cache courses for the selected department
    let cachedCourses = {};

    // ------------------------------------------------------------------------
    // [Function: Show Courses for a Selected Department]
    // ------------------------------------------------------------------------
    async function showCourses(departmentId, departmentName) {
        // Check if courses are already cached
        if (cachedCourses[departmentId]) {
            renderCourses(cachedCourses[departmentId], departmentName);
            return;
        }

        try {
            const response = await fetch(`/api/departments/${departmentId}/courses/`);
            if (!response.ok) {
                throw new Error(`Failed to fetch courses for department ${departmentId}`);
            }
            const courses = await response.json(); // Backend returns [] for empty departments
            cachedCourses[departmentId] = courses; // Cache the courses
            renderCourses(courses, departmentName); // Always call renderCourses
        } catch (error) {
            console.error("Error fetching courses:", error);
            // Call renderCourses with an empty array on error
            renderCourses([], departmentName);
        }
    }

    // ------------------------------------------------------------------------
    // [Function: Render Courses in the UI]
    // ------------------------------------------------------------------------
    function renderCourses(courses, departmentName) {
        console.log("Rendering courses for department:", departmentName, courses);

        // Update breadcrumb
        breadcrumbContainer.innerHTML = `
            <a href="#" id="show-departments" class="breadcrumb-link">Departments</a> / ${departmentName}
        `;
        coursesContainer.innerHTML = ""; // Clear existing content

        // Check if the courses list is empty
        if (!courses || courses.length === 0) {
            coursesContainer.innerHTML = "<p>No courses available for this department.</p>";
        } else {
            courses.forEach((course) => {
                const courseLink = document.createElement("a");
                courseLink.href = `/courses/${course.id}/`; // Link to course detail page
                courseLink.classList.add("course-link");

                const courseDiv = document.createElement("div");
                courseDiv.classList.add("course-item");
                courseDiv.innerHTML = `
                    <h4>${course.title}</h4>
                    <p>Subject: ${course.subject} ${course.number}</p>
                    <p>Credits: ${course.credits}</p>
                `;
                courseLink.appendChild(courseDiv);
                coursesContainer.appendChild(courseLink);
            });
        }

        // Switch visibility: hide departments, show courses
        departmentsContainer.classList.remove("visible");
        departmentsContainer.classList.add("hidden");
        coursesContainer.classList.remove("hidden");
        coursesContainer.classList.add("visible");

        // Add event listener to the breadcrumb "Departments" link to go back
        const showDeptsLink = document.getElementById("show-departments");
        showDeptsLink.addEventListener("click", (e) => {
            e.preventDefault();
            showDepartmentsView();
        });
    }

    // ------------------------------------------------------------------------
    // [Function: Show Departments View]
    // ------------------------------------------------------------------------
    function showDepartmentsView() {
        breadcrumbContainer.textContent = "Departments";
        coursesContainer.classList.remove("visible");
        coursesContainer.classList.add("hidden");
        departmentsContainer.classList.remove("hidden");
        departmentsContainer.classList.add("visible");
    }
});