document.addEventListener("DOMContentLoaded", () => {
    const departmentsApiUrl = "/api/departments/";
    const departmentsContainer = document.getElementById("departments");

    // Fetch and display departments
    fetch(departmentsApiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then(data => {
            departmentsContainer.innerHTML = "";

            if (data.length === 0) {
                departmentsContainer.innerHTML = "<p>No departments available.</p>";
            } else {
                // Sort and group departments alphabetically
                const sortedDepartments = data.sort((a, b) => a.name.localeCompare(b.name));
                const groupedDepartments = sortedDepartments.reduce((groups, department) => {
                    const firstLetter = department.name.charAt(0).toUpperCase();
                    if (!groups[firstLetter]) {
                        groups[firstLetter] = [];
                    }
                    groups[firstLetter].push(department);
                    return groups;
                }, {});

                // Render the grouped departments
                for (const [letter, departments] of Object.entries(groupedDepartments)) {
                    // Letter Header
                    const letterGroup = document.createElement("div");
                    letterGroup.classList.add("letter-group");

                    const letterHeader = document.createElement("h3");
                    letterHeader.classList.add("letter-header");
                    letterHeader.textContent = letter;

                    // Departments Container
                    const departmentContainer = document.createElement("div");
                    departmentContainer.classList.add("department-container");

                    // Add departments under the letter
                    departments.forEach(department => {
                        const departmentLink = document.createElement("a");
                        departmentLink.href = "#";
                        departmentLink.classList.add("department-link");

                        const departmentDiv = document.createElement("div");
                        departmentDiv.classList.add("department");
                        departmentDiv.textContent = department.name;

                        departmentLink.appendChild(departmentDiv);
                        departmentContainer.appendChild(departmentLink);
                    });

                    // Append the letter header and departments
                    letterGroup.appendChild(letterHeader);
                    letterGroup.appendChild(departmentContainer);
                    departmentsContainer.appendChild(letterGroup);
                }
            }
        })
        .catch(error => {
            console.error("Error fetching departments:", error);
            departmentsContainer.innerHTML = "<p>Failed to load departments. Please try again later.</p>";
        });

    // Fetch and display courses for a specific department
    function fetchCoursesForDepartment(departmentId) {
        const coursesApiUrl = `/api/departments/${departmentId}/courses/`;

        fetch(coursesApiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response.json();
            })
            .then(courses => {
                coursesContainer.innerHTML = "";

                if (courses.length === 0) {
                    coursesContainer.innerHTML = "<p>No courses available for this department.</p>";
                } else {
                    courses.forEach(course => {
                        const courseLink = document.createElement("a");
                        courseLink.href = `/courses/${course.id}/`;
                        courseLink.classList.add("course-link");

                        const courseDiv = document.createElement("div");
                        courseDiv.classList.add("course-item");
                        courseDiv.innerHTML = `
                            <h4>${course.title}</h4>
                            <p>Subject: ${course.subject} ${course.number}</p>
                        `;

                        courseLink.appendChild(courseDiv);
                        coursesContainer.appendChild(courseLink);
                    });
                }
            })
            .catch(error => {
                console.error("There was an error fetching the courses:", error);
                coursesContainer.innerHTML = "<p>Failed to load courses. Please try again later.</p>";
            });
    }
});
