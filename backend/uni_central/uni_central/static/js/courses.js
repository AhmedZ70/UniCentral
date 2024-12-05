document.addEventListener("DOMContentLoaded", () => {
    const departmentsApiUrl = "/api/departments/";
    const departmentsContainer = document.getElementById("departments");
    const coursesContainer = document.getElementById("courses");
    const breadcrumbContainer = document.getElementById("breadcrumb");

    // Set initial visibility
    departmentsContainer.classList.add("visible");
    coursesContainer.classList.add("hidden");

    // Fetch departments
    fetch(departmentsApiUrl)
        .then((response) => response.json())
        .then((data) => renderDepartments(data))
        .catch((error) => {
            console.error("Error fetching departments:", error);
            departmentsContainer.innerHTML =
                "<p>Failed to load departments. Please try again later.</p>";
        });

    function renderDepartments(departments) {
        if (!departments || departments.length === 0) {
            departmentsContainer.innerHTML = "<p>No departments available.</p>";
            return;
        }

        departmentsContainer.innerHTML = "";
        const sortedDepts = departments.sort((a, b) =>
            a.name.localeCompare(b.name)
        );
        const grouped = sortedDepts.reduce((acc, dept) => {
            const letter = dept.name.charAt(0).toUpperCase();
            acc[letter] = acc[letter] || [];
            acc[letter].push(dept);
            return acc;
        }, {});

        for (const [letter, depts] of Object.entries(grouped)) {
            const letterGroup = document.createElement("div");
            letterGroup.classList.add("letter-group");

            // Add the letter header
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
                deptDiv.textContent = dept.name; // Only this shows the name inside the card.

                link.appendChild(deptDiv);
                deptContainer.appendChild(link);
            });

            letterGroup.appendChild(deptContainer);
            departmentsContainer.appendChild(letterGroup);
        }
    }

    function showCourses(departmentId, departmentName) {
        const coursesApiUrl = `/api/departments/${departmentId}/courses/`;
        fetch(coursesApiUrl)
            .then((resp) => resp.json())
            .then((courses) => {
                renderCourses(courses, departmentName);
            })
            .catch((err) => {
                console.error("Error fetching courses:", err);
                coursesContainer.innerHTML = "<p>Failed to load courses.</p>";
            });
    }

    function renderCourses(courses, departmentName) {
        breadcrumbContainer.innerHTML = `<a href="#" id="show-departments" class="breadcrumb-link">Departments</a> / ${departmentName}`;
        coursesContainer.innerHTML = "";

        if (!courses || courses.length === 0) {
            coursesContainer.innerHTML =
                "<p>No courses available for this department.</p>";
        } else {
            courses.forEach((course) => {
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

        // Show courses, hide departments
        departmentsContainer.classList.remove("visible");
        departmentsContainer.classList.add("hidden");
        coursesContainer.classList.remove("hidden");
        coursesContainer.classList.add("visible");

        const showDeptsLink = document.getElementById("show-departments");
        showDeptsLink.addEventListener("click", (e) => {
            e.preventDefault();
            showDepartmentsView();
        });
    }

    function showDepartmentsView() {
        // Update breadcrumb
        breadcrumbContainer.textContent = "Departments";

        // Show departments, hide courses
        coursesContainer.classList.remove("visible");
        coursesContainer.classList.add("hidden");
        departmentsContainer.classList.remove("hidden");
        departmentsContainer.classList.add("visible");
    }
});
