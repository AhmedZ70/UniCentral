document.addEventListener("DOMContentLoaded", () => {
  const departmentsApiUrl = "http://127.0.0.1:8000/api/departments/";
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
          // Clear the loading message
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

    function fetchCoursesForDepartment(departmentId) {
      const coursesApiUrl = `http://127.0.0.1:8000/api/departments/${departmentId}/courses/`;

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
                  const coursesList = document.createElement("ul");
                  coursesList.classList.add("courses-list");

                  courses.forEach(course => {
                      // Update these fields based on the API response
                      const courseTitle = course.title ? course.title : "No course title available";
                      const courseSubject = course.subject ? course.subject : "No course subject available";
                      const courseNumber = course.number ? course.number : "N/A";

                      const courseItem = document.createElement("li");
                      courseItem.classList.add("course-item");
                      courseItem.innerHTML = `
                          <a href="#" class="course-link">
                              <h4>${courseTitle}</h4>
                              <p>Subject: ${courseSubject} ${courseNumber}</p>
                          </a>
                      `;
                      coursesList.appendChild(courseItem);
                  });

                  coursesContainer.appendChild(coursesList);
              }
          })
          .catch(error => {
              console.error("There was an error fetching the courses:", error);
              coursesContainer.innerHTML = "<p>Failed to load courses. Please try again later.</p>";
          });
    }

});
