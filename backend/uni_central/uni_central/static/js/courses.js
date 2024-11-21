document.addEventListener("DOMContentLoaded", () => {
    // Define the API endpoint for departments
    const departmentsApiUrl = "http://127.0.0.1:8000/api/departments/";
  
    // Get the departments container element
    const departmentsContainer = document.getElementById("departments");
  
    // Fetch the departments data from the API
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
  
        // Check if there are departments returned
        if (data.length === 0) {
          departmentsContainer.innerHTML = "<p>No departments available.</p>";
        } else {
          // Populate the departments
          data.forEach(department => {
            const departmentDiv = document.createElement("div");
            departmentDiv.classList.add("department");
            departmentDiv.innerHTML = `
              <h3>${department.name}</h3>
              <p>${department.code || "No description available."}</p>
            `;
            departmentsContainer.appendChild(departmentDiv);
          });
        }
      })
      .catch(error => {
        console.error("There was an error fetching the departments:", error);
        departmentsContainer.innerHTML = "<p>Failed to load departments. Please try again later.</p>";
      });
  });
  