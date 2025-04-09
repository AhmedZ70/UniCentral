document.addEventListener("DOMContentLoaded", () => {
    const departmentsApiUrl = "/api/departments/";
    const departmentsContainer = document.getElementById("departments");
    const professorsContainer = document.getElementById("professors");
    const breadcrumbContainer = document.getElementById("breadcrumb");

    const departmentAlphabetNavContainer = document.createElement("div");
    departmentAlphabetNavContainer.id = "alphabet-nav";
    departmentAlphabetNavContainer.className = "alphabet-navigation";
    
    departmentsContainer.parentNode.insertBefore(departmentAlphabetNavContainer, departmentsContainer);

    const professorsAlphabetNavContainer = document.createElement("div");
    professorsAlphabetNavContainer.id = "professors-alphabet-nav";
    professorsAlphabetNavContainer.className = "alphabet-navigation";
    professorsAlphabetNavContainer.style.display = "none"; // Initially hidden
    
    professorsContainer.parentNode.insertBefore(professorsAlphabetNavContainer, professorsContainer);

    departmentsContainer.classList.add("visible");
    professorsContainer.classList.add("hidden");

    fetch(departmentsApiUrl)
        .then((response) => response.json())
        .then((data) => {
            renderDepartments(data);
            createDepartmentAlphabetNav(data);
        })
        .catch((error) => {
            console.error("Error fetching departments:", error);
            departmentsContainer.innerHTML =
                "<p>Failed to load departments. Please try again later.</p>";
        });


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
        departmentAlphabetNavContainer.style.display = 'none';

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
            renderProfessors([], departmentName);
        }
    }
    
    function renderProfessors(professors, departmentName) {
        window.scrollTo(0, 0);
        
        breadcrumbContainer.innerHTML = `
            <a href="#" id="show-departments" class="breadcrumb-link">Departments</a> / ${departmentName}
        `;
        professorsContainer.innerHTML = ""; // Clear existing content
    
        // Sort professors by last name
        const sortedProfessors = [...professors].sort((a, b) => 
            a.lname.localeCompare(b.lname)
        );
    
        if (!sortedProfessors || sortedProfessors.length === 0) {
            professorsContainer.innerHTML = "<p>No professors available for this department.</p>";
            professorsAlphabetNavContainer.style.display = 'none';
        } else {
            const grouped = sortedProfessors.reduce((acc, professor) => {
                const letter = professor.lname.charAt(0).toUpperCase();
                acc[letter] = acc[letter] || [];
                acc[letter].push(professor);
                return acc;
            }, {});
            
            createProfessorsAlphabetNav(sortedProfessors);
            
            for (const [letter, profs] of Object.entries(grouped)) {
                const letterGroup = document.createElement("div");
                letterGroup.classList.add("letter-group");
                letterGroup.id = `prof-letter-${letter}`;
                
                const letterHeader = document.createElement("h3");
                letterHeader.classList.add("letter-header");
                letterHeader.textContent = letter;
                letterGroup.appendChild(letterHeader);
                
                const sortedByLastName = [...profs].sort((a, b) => {
                    const lastNameComparison = a.lname.localeCompare(b.lname);
                    if (lastNameComparison !== 0) {
                        return lastNameComparison;
                    }
                    return a.fname.localeCompare(b.fname);
                });
                
                sortedByLastName.forEach((professor) => {
                    const professorLink = document.createElement("a");
                    professorLink.href = `/professors/${professor.id}/`; 
                    professorLink.classList.add("professor-link");
            
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
        }
    
        departmentsContainer.classList.remove("visible");
        departmentsContainer.classList.add("hidden");
        professorsContainer.classList.remove("hidden");
        professorsContainer.classList.add("visible");
    
        const showDeptsLink = document.getElementById("show-departments");
        showDeptsLink.addEventListener("click", (e) => {
            e.preventDefault();
            showDepartmentsView();
        });
    }
    
    function showDepartmentsView() {
        breadcrumbContainer.textContent = "Departments";

        professorsAlphabetNavContainer.style.display = 'none';
        professorSearchContainer.style.display = 'none';
        noResultsEl.style.display = 'none';

        professorsContainer.classList.remove("visible");
        professorsContainer.classList.add("hidden");
        departmentsContainer.classList.remove("hidden");
        departmentsContainer.classList.add("visible");

        departmentAlphabetNavContainer.style.display = 'flex';
    }
});
