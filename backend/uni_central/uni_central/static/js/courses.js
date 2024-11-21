document.addEventListener("DOMContentLoaded", () => {
    const departmentsApiUrl = "http://127.0.0.1:8000/api/departments/";
    const departmentsContainer = document.getElementById("departments");
    const coursesContainer = document.getElementById("courses"); // Make sure this is not null
  
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
            const departmentDiv = document.createElement("div");
            departmentDiv.classList.add("department");
            departmentDiv.innerHTML = `
              <h3>${department.name}</h3>
              <p>${department.code || "No description available."}</p>
              <button data-department-id="${department.id}">View Courses</button>
            `;
            departmentsContainer.appendChild(departmentDiv);
          });
  
          // Attach click event listeners to department buttons
          document.querySelectorAll('button[data-department-id]').forEach(button => {
            button.addEventListener('click', (event) => {
              const departmentId = event.target.getAttribute('data-department-id');
              fetchCoursesForDepartment(departmentId);
            });
          });
        }
      })
      .catch(error => {
        console.error("There was an error fetching the departments:", error);
        departmentsContainer.innerHTML = "<p>Failed to load departments. Please try again later.</p>";
      });
  
    // Function to fetch courses for a specific department
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
            courses.forEach(course => {
              // Update these fields based on the API response
              const courseTitle = course.title ? course.title : "No course title available";
              const courseSubject = course.subject ? course.subject : "No course subject available";
              const courseNumber = course.number ? course.number : "N/A";
  
              const courseDiv = document.createElement("div");
              courseDiv.classList.add("course");
              courseDiv.innerHTML = `
                <h4>${courseTitle}</h4>
                <p>Subject: ${courseSubject} ${courseNumber}</p>
              `;
              coursesContainer.appendChild(courseDiv);
            });
          }
        })
        .catch(error => {
          console.error("There was an error fetching the courses:", error);
          coursesContainer.innerHTML = "<p>Failed to load courses. Please try again later.</p>";
        });
    }
  });
  