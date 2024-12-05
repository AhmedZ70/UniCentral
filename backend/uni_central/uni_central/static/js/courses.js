document.addEventListener("DOMContentLoaded", () => {
    const departmentsApiUrl = "/api/departments/";  // Use a relative URL
    const departmentsContainer = document.getElementById("departments");
    const coursesContainer = document.getElementById("courses");
  
    if (!coursesContainer) {
        console.error("The courses container element is not found.");
        return;
    }
  
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
                data.forEach(department => {
                    // Create an anchor element to wrap the department card
                    const departmentLink = document.createElement("a");
                    departmentLink.href = "#";
                    departmentLink.classList.add("department-link");
                    departmentLink.dataset.departmentId = department.id;
  
                    const departmentDiv = document.createElement("div");
                    departmentDiv.classList.add("department");
                    departmentDiv.innerHTML = `
                        <h3>${department.name}</h3>
                        <p>${department.code || "No description available."}</p>
                    `;
  
                    // Append the department div inside the link
                    departmentLink.appendChild(departmentDiv);
                    departmentsContainer.appendChild(departmentLink);
                });
  
                // Attach click event listeners to department links
                document.querySelectorAll('.department-link').forEach(link => {
                    link.addEventListener('click', (event) => {
                        event.preventDefault(); // Prevent default anchor behavior
                        const departmentId = event.currentTarget.dataset.departmentId;
                        fetchCoursesForDepartment(departmentId);
                    });
                });
            }
        })
        .catch(error => {
            console.error("There was an error fetching the departments:", error);
            departmentsContainer.innerHTML = "<p>Failed to load departments. Please try again later.</p>";
        });
  
    // Fetch and display courses for a specific department
    function fetchCoursesForDepartment(departmentId) {
        const coursesApiUrl = `/api/departments/${departmentId}/courses/`; // Use a relative URL
  
        fetch(coursesApiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response.json();
            })
            .then(courses => {
                // Clear any existing courses
                coursesContainer.innerHTML = "";
  
                if (courses.length === 0) {
                    coursesContainer.innerHTML = "<p>No courses available for this department.</p>";
                } else {
                    courses.forEach(course => {
                        const courseLink = document.createElement("a");
                        courseLink.href = `/courses/${course.id}/`;
                        courseLink.classList.add("course-link");
                        courseLink.style.textDecoration = "none";
                        courseLink.style.color = "#333";
  
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
  