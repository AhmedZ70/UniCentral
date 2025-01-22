/**
 * This file handles the logic for displaying a list of departments and their associated professors. 
 * It fetches department data from the server, renders them in a categorized manner (by first letter), 
 * and provides a mechanism to navigate into each department to fetch and display its professors. 
 * Users can also navigate back to the list of departments from the professors view.
 */

document.addEventListener("DOMContentLoaded", () => {
    // ------------------------------------------------------------------------
    // [Section 1: Setup constants and initial UI state]
    // ------------------------------------------------------------------------
    /**
     * 1. We define the key HTML elements we'll manipulate:
     *    - departmentsContainer: where departments will be listed
     *    - professorsContainer: where professors will be listed
     *    - breadcrumbContainer: a simple breadcrumb navigation element
     *
     * 2. We also set the initial visibility of these containers:
     *    - Show the departmentsContainer
     *    - Hide the professorsContainer
     */
    const departmentsApiUrl = "/api/departments/";
    const departmentsContainer = document.getElementById("departments");
    const professorsContainer = document.getElementById("professors");
    const breadcrumbContainer = document.getElementById("breadcrumb");

    // Set initial visibility
    departmentsContainer.classList.add("visible");
    professorsContainer.classList.add("hidden");

    // ------------------------------------------------------------------------
    // [Section 2: Fetch and Display Departments]
    // ------------------------------------------------------------------------
    /**
     * We fetch the list of departments from the server (departmentsApiUrl) and pass
     * the response to the renderDepartments function if successful. If there's an
     * error, we display a message to the user in the departmentsContainer.
     */
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
    /**
     * Renders the list of departments in alphabetical groups based on the first
     * letter of the department name. Clicking on any department triggers a call
     * to 'showProfessorss' to display the department's professors.
     *
     * @param {Array} departments - Array of department objects from the server.
     */
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
                    showProfessors(dept.id, dept.name);
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

    // Cache professors for the selected department
    let cachedProfessors = {};
    // ------------------------------------------------------------------------
    // [Function: Show Professors for a Selected Department]
    // ------------------------------------------------------------------------
    /**
     * Fetches the professors for a specific department (by departmentId) and then
     * calls 'renderProfessors' to display them. If there's an error, a message is shown.
     *
     * @param {number} departmentId - The ID of the department to fetch professors for.
     * @param {string} departmentName - The name of the department for breadcrumb display.
     */
    async function showProfessors(departmentId, departmentName) {
        // Check if professors are already cached
        if (cachedProfessors[departmentId]) {
            renderProfessors(cachedProfessors[departmentId], departmentName);
            return;
        }
    
        try {
            const response = await fetch(`/api/departments/${departmentId}/professors/`);
            if (!response.ok) {
                throw new Error(`Failed to fetch professors for department ${departmentId}`);
            }
            const professors = await response.json(); // Backend returns [] for empty departments
            cachedProfessors[departmentId] = professors; // Cache the professors
            renderProfessors(professors, departmentName); // Always call renderProfessors
        } catch (error) {
            console.error("Error fetching professors:", error);
            // Call renderProfessors with an empty array on error
            renderProfessors([], departmentName);
        }
    }
    


    // ------------------------------------------------------------------------
    // [Function: Render Professors in the UI]
    // ------------------------------------------------------------------------
    /**
     * Takes an array of professors and the department's name, updates the breadcrumb,
     * and displays each professors in a clickable link. Also hides the department list
     * and shows the professors container.
     *
     * @param {Array} professors - Array of professor objects.
     * @param {string} departmentName - The name of the department for the breadcrumb.
     */
    function renderProfessors(professors, departmentName) {
        console.log("Rendering professors for department:", departmentName, professors);
    
        // Update breadcrumb
        breadcrumbContainer.innerHTML = `
            <a href="#" id="show-departments" class="breadcrumb-link">Departments</a> / ${departmentName}
        `;
        professorsContainer.innerHTML = ""; // Clear existing content
    
        // Check if the professors list is empty
        if (!professors || professors.length === 0) {
            professorsContainer.innerHTML = "<p>No professors available for this department.</p>";
        } else {
            professors.forEach((professors) => {
                const professorLink = document.createElement("a");
                professorLink.href = `/professors/${professor.id}/`; // Link to professor detail page
                professorLink.classList.add("professor-link");
    
                const professorDiv = document.createElement("div");
                professorDiv.classList.add("professor-item");
                professorDiv.innerHTML = `
                    <h4>${professor.title}</h4>
                    <p>Subject: ${professor.subject} ${professor.number}</p>
                    <p>Credits: ${professor.credits}</p>
                `;
                professorLink.appendChild(professorDiv);
                professorsContainer.appendChild(professorLink);
            });
        }
    
        // Switch visibility: hide departments, show professors
        departmentsContainer.classList.remove("visible");
        departmentsContainer.classList.add("hidden");
        professorsContainer.classList.remove("hidden");
        professorsContainer.classList.add("visible");
    
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
    /**
     * Resets the UI to display the department list and hides the professors container.
     */
    function showDepartmentsView() {
        breadcrumbContainer.textContent = "Departments";
        professorsContainer.classList.remove("visible");
        professorsContainer.classList.add("hidden");
        departmentsContainer.classList.remove("hidden");
        departmentsContainer.classList.add("visible");
    }
});
