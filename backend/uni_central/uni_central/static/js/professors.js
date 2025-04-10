document.addEventListener("DOMContentLoaded", () => {
    const departmentsApiUrl = "/api/departments/";
    const departmentsContainer = document.getElementById("departments");
    const professorsContainer = document.getElementById("professors");
    const breadcrumbContainer = document.getElementById("breadcrumb");
    
    // Define containers for professor search (if they exist)
    // These are referenced in showDepartmentsView
    const professorSearchContainer = document.getElementById("professor-search") || { style: { display: 'none' } };
    const noResultsEl = document.getElementById("no-results") || { style: { display: 'none' } };

    // Create the search container and add it to the DOM
    const searchContainer = document.createElement("div");
    searchContainer.id = "professor-search-container";
    searchContainer.className = "professor-search-container";
    searchContainer.style.display = "none"; 

    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.id = "professor-search-input";
    searchInput.className = "professor-search-input";
    searchInput.placeholder = "Search professors...";

    searchContainer.appendChild(searchInput);
    professorsContainer.parentNode.insertBefore(searchContainer, professorsContainer);

    // Create the no-results element
    const noSearchResultsEl = document.createElement("div");
    noSearchResultsEl.id = "no-search-results";
    noSearchResultsEl.className = "no-search-results";
    noSearchResultsEl.style.display = "none";
    noSearchResultsEl.textContent = "No professors match your search.";
    professorsContainer.parentNode.insertBefore(noSearchResultsEl, professorsContainer);

    // Create a loading spinner
    const loadingSpinner = document.createElement("div");
    loadingSpinner.className = "loading-spinner";
    loadingSpinner.innerHTML = `
        <div class="spinner"></div>
        <p>Loading...</p>
    `;

    const departmentAlphabetNavContainer = document.createElement("div");
    departmentAlphabetNavContainer.id = "alphabet-nav";
    departmentAlphabetNavContainer.className = "alphabet-navigation";
    
    departmentsContainer.parentNode.insertBefore(departmentAlphabetNavContainer, departmentsContainer);

    const professorsAlphabetNavContainer = document.createElement("div");
    professorsAlphabetNavContainer.id = "professors-alphabet-nav";
    professorsAlphabetNavContainer.className = "alphabet-navigation";
    professorsAlphabetNavContainer.style.display = "none"; // Initially hidden
    
    professorsContainer.parentNode.insertBefore(professorsAlphabetNavContainer, professorsContainer);

    // Initialize the view state
    departmentsContainer.classList.add("visible");
    professorsContainer.classList.add("hidden");

    // Initialize breadcrumb
    breadcrumbContainer.textContent = "Departments";

    // Track the current department's professors for search functionality
    let currentDepartmentProfessors = [];

    // Fetch and render departments
    fetchDepartments();

    async function fetchDepartments() {
        try {
            departmentsContainer.innerHTML = "";
            departmentsContainer.appendChild(loadingSpinner.cloneNode(true));
            
            const response = await fetch(departmentsApiUrl);
            const data = await response.json();
            
            renderDepartments(data);
            createDepartmentAlphabetNav(data);
            
            // Make sure departments container is visible
            departmentsContainer.classList.remove("hidden");
            departmentsContainer.classList.add("visible");
        } catch (error) {
            console.error("Error fetching departments:", error);
            departmentsContainer.innerHTML = 
                "<p class='error-message'>Failed to load departments. Please try again later.</p>";
        }
    }

    function createDepartmentAlphabetNav(departments) {
        const firstLetters = new Set(
            departments.map(dept => dept.name.charAt(0).toUpperCase())
        );
        
        const sortedLetters = Array.from(firstLetters).sort();
        
        departmentAlphabetNavContainer.innerHTML = '';
        
        sortedLetters.forEach(letter => {
            const letterLink = document.createElement('a');
            letterLink.href = `#letter-${letter}`;
            letterLink.className = 'alphabet-link';
            letterLink.textContent = letter;
            
            letterLink.addEventListener('click', (e) => {
                e.preventDefault();
                const letterSection = document.getElementById(`letter-${letter}`);
                if (letterSection) {
                    const rect = letterSection.getBoundingClientRect();
                    
                    const scrollPosition = window.pageYOffset + rect.top - 70;
                    
                    window.scrollTo({
                        top: scrollPosition,
                        behavior: 'smooth'
                    });
                }
            });
            
            departmentAlphabetNavContainer.appendChild(letterLink);
        });
    }

    function createProfessorsAlphabetNav(professors) {
        const fullAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        
        const populatedLetters = new Set();
        professors.forEach(professor => {
            if (professor.lname && professor.lname.length > 0) {
                populatedLetters.add(professor.lname.charAt(0).toUpperCase());
            }
        });
        
        professorsAlphabetNavContainer.innerHTML = '';
        
        fullAlphabet.forEach(letter => {
            const letterLink = document.createElement('a');
            letterLink.href = `#prof-letter-${letter}`;
            letterLink.className = 'alphabet-link';
            
            if (!populatedLetters.has(letter)) {
                letterLink.classList.add('empty-letter');
            }
            
            letterLink.textContent = letter;
            
            if (populatedLetters.has(letter)) {
                letterLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    const letterSection = document.getElementById(`prof-letter-${letter}`);
                    if (letterSection) {
                        const rect = letterSection.getBoundingClientRect();
                        const scrollPosition = window.pageYOffset + rect.top - 70;
                        window.scrollTo({
                            top: scrollPosition,
                            behavior: 'smooth'
                        });
                    }
                });
            }
            
            professorsAlphabetNavContainer.appendChild(letterLink);
        });
        
        professorsAlphabetNavContainer.style.display = 'flex';
    }

    function renderDepartments(departments) {
        if (!departments || departments.length === 0) {
            departmentsContainer.innerHTML = "<p class='no-results'>No departments available.</p>";
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

            letterGroup.id = `letter-${letter}`;

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
                link.setAttribute("data-department-id", dept.id);
                link.setAttribute("data-department-name", dept.name);
                
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

    let cachedProfessors = {};
    
    async function showProfessors(departmentId, departmentName) {
        // Add fade class to departments to animate them out
        const departmentLinks = departmentsContainer.querySelectorAll('.department-link');
        departmentLinks.forEach(link => link.classList.add('fade'));
        
        // Fade out the departments view first
        departmentsContainer.classList.remove("visible");
        departmentsContainer.classList.add("hidden");
        departmentAlphabetNavContainer.style.display = 'none';
        
        // Show search container
        searchContainer.style.display = 'block';
        searchInput.value = '';
        noSearchResultsEl.style.display = 'none';
        
        // Update breadcrumb immediately to give feedback
        breadcrumbContainer.innerHTML = `
            <a href="#" id="back-to-departments" class="breadcrumb-link">
                <span class="back-arrow">←</span> Departments
            </a>
            <span class="breadcrumb-separator">/</span>
            <span class="current-department">${departmentName}</span>
        `;
        
        // Add loading spinner to professors container
        professorsContainer.innerHTML = "";
        professorsContainer.appendChild(loadingSpinner.cloneNode(true));
        
        // Show professors container with loading spinner
        professorsContainer.classList.remove("hidden");
        professorsContainer.classList.add("visible");
        
        try {
            if (cachedProfessors[departmentId]) {
                currentDepartmentProfessors = cachedProfessors[departmentId];
                renderProfessorsList(currentDepartmentProfessors, departmentName);
            } else {
                // If not cached, fetch from server
                const response = await fetch(`/api/departments/${departmentId}/professors/`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch professors for department ${departmentId}`);
                }
                const professors = await response.json();
                cachedProfessors[departmentId] = professors; // Cache the professors
                currentDepartmentProfessors = professors;
                renderProfessorsList(professors, departmentName);
            }
        } catch (error) {
            console.error("Error fetching professors:", error);
            professorsContainer.innerHTML = `
                <div class="error-message">
                    <p>Failed to load professors. Please try again later.</p>
                    <button id="retry-load" class="retry-button">Retry</button>
                </div>
            `;
            
            document.getElementById("retry-load").addEventListener("click", () => {
                showProfessors(departmentId, departmentName);
            });
        }
        
        // Add back button listener
        document.getElementById("back-to-departments").addEventListener("click", (e) => {
            e.preventDefault();
            showDepartmentsView();
        });
    }
    
    function renderProfessorsList(professors, departmentName) {
        // Sort professors by last name
        const sortedProfessors = [...professors].sort((a, b) => 
            a.lname.localeCompare(b.lname)
        );
        
        professorsContainer.innerHTML = "";
        
        if (!sortedProfessors || sortedProfessors.length === 0) {
            professorsContainer.innerHTML = `
                <div class="no-results">
                    <p>No professors available for ${departmentName}.</p>
                    <p>Check back later or try another department.</p>
                </div>
            `;
            professorsAlphabetNavContainer.style.display = 'none';
            return;
        }
        
        // Create alphabet navigation for professors
        createProfessorsAlphabetNav(sortedProfessors);
        
        // Group professors by first letter of last name
        const grouped = sortedProfessors.reduce((acc, professor) => {
            const letter = professor.lname.charAt(0).toUpperCase();
            acc[letter] = acc[letter] || [];
            acc[letter].push(professor);
            return acc;
        }, {});
        
        // Create the professor list
        for (const [letter, profs] of Object.entries(grouped)) {
            const letterGroup = document.createElement("div");
            letterGroup.classList.add("letter-group");
            letterGroup.id = `prof-letter-${letter}`;
            
            const letterHeader = document.createElement("h3");
            letterHeader.classList.add("letter-header");
            letterHeader.textContent = letter;
            letterGroup.appendChild(letterHeader);
            
            // Sort by last name then first name
            const sortedByName = [...profs].sort((a, b) => {
                const lastNameComparison = a.lname.localeCompare(b.lname);
                if (lastNameComparison !== 0) {
                    return lastNameComparison;
                }
                return a.fname.localeCompare(b.fname);
            });
            
            // Create professor items
            sortedByName.forEach((professor) => {
                const professorLink = document.createElement("a");
                professorLink.href = `/professors/${professor.id}/`; 
                professorLink.classList.add("professor-link");
                professorLink.setAttribute("data-professor-id", professor.id);
        
                const professorDiv = document.createElement("div");
                professorDiv.classList.add("professor-item");
                professorDiv.innerHTML = `
                    <h4>${professor.lname}, ${professor.fname}</h4>
                    ${professor.title ? `<p>${professor.title}</p>` : ''}
                `;
                
                professorLink.appendChild(professorDiv);
                letterGroup.appendChild(professorLink);
            });
            
            professorsContainer.appendChild(letterGroup);
        }
        
        // Add animation classes to stagger the appearance
        const professorItems = professorsContainer.querySelectorAll('.professor-link');
        professorItems.forEach((item, index) => {
            setTimeout(() => {
                item.classList.add('appear');
            }, 50 * index);
        });
    }
    
    function searchProfessors(query) {
        if (!currentDepartmentProfessors || currentDepartmentProfessors.length === 0) {
            return;
        }
        
        query = query.toLowerCase().trim();
        
        if (!query) {
            // If no query, show all professor items
            professorsContainer.querySelectorAll('.professor-link').forEach(node => {
                node.style.display = 'block';
            });
            noSearchResultsEl.style.display = 'none';
            return;
        }
        
        let visibleCount = 0;
        
        // Filter professor items by query
        professorsContainer.querySelectorAll('.professor-link').forEach(professorNode => {
            const professorText = professorNode.textContent.toLowerCase();
            if (professorText.includes(query)) {
                professorNode.style.display = 'block';
                visibleCount++;
            } else {
                professorNode.style.display = 'none';
            }
        });
        
        // Show no results message if needed
        if (visibleCount === 0) {
            noSearchResultsEl.style.display = 'block';
        } else {
            noSearchResultsEl.style.display = 'none';
        }
    }
    
    function showDepartmentsView() {
        // Hide search elements
        searchContainer.style.display = 'none';
        noSearchResultsEl.style.display = 'none';
        
        // Fade out professors view
        professorsContainer.classList.remove("visible");
        professorsContainer.classList.add("hidden");
        professorsAlphabetNavContainer.style.display = 'none';
        
        // Update breadcrumb
        breadcrumbContainer.textContent = "Departments";
        
        // Show departments view after a short delay
        setTimeout(() => {
            departmentsContainer.classList.remove("hidden");
            departmentsContainer.classList.add("visible");
            departmentAlphabetNavContainer.style.display = 'flex';
            
            // Remove fade class and add appear class for animation
            const departmentLinks = departmentsContainer.querySelectorAll('.department-link');
            departmentLinks.forEach((link, index) => {
                link.classList.remove('fade');
                setTimeout(() => {
                    link.classList.add('appear');
                }, 30 * index);
            });
        }, 300);
    }

    // Add event listener for search input
    searchInput.addEventListener('input', function() {
        const query = this.value;
        searchProfessors(query);
    });
});
