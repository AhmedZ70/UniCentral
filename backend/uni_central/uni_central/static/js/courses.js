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

    const alphabetNavContainer = document.createElement("div");
    alphabetNavContainer.id = "alphabet-nav";
    alphabetNavContainer.className = "alphabet-navigation";
    
    departmentsContainer.parentNode.insertBefore(alphabetNavContainer, departmentsContainer);

    departmentsContainer.classList.add("visible");
    coursesContainer.classList.add("hidden");

    // ------------------------------------------------------------------------
    // [Section 2: Fetch and Display Departments]
    // ------------------------------------------------------------------------
    fetch(departmentsApiUrl)
        .then((response) => response.json())
        .then((data) => {
            renderDepartments(data);
            createAlphabetNav(data);
        })
        .catch((error) => {
            console.error("Error fetching departments:", error);
            departmentsContainer.innerHTML =
                "<p>Failed to load departments. Please try again later.</p>";
        });

    // ------------------------------------------------------------------------
    // [Function: Create Alphabet Navigation]
    // ------------------------------------------------------------------------
    function createAlphabetNav(departments) {
        const firstLetters = new Set(
            departments.map(dept => dept.name.charAt(0).toUpperCase())
        );
        
        const sortedLetters = Array.from(firstLetters).sort();
        
        alphabetNavContainer.innerHTML = '';
        
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
            
            alphabetNavContainer.appendChild(letterLink);
        });
    }

    // ------------------------------------------------------------------------
    // [Function: Render Departments]
    // ------------------------------------------------------------------------
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

    departmentsContainer.classList.add("visible");
    coursesContainer.classList.add("hidden");

    let cachedCourses = {};

    // ------------------------------------------------------------------------
    // [Function: Show Courses for a Selected Department]
    // ------------------------------------------------------------------------
    async function showCourses(departmentId, departmentName) {
        console.log("==== SHOW COURSES STARTED ====");
        console.log(`Department: ${departmentName} (ID: ${departmentId})`);
        
        // Use the correct variables (departmentsContainer and coursesContainer)
        console.log("Alphabet bar visibility:", alphabetNavContainer.style.display);
        console.log("Departments container visibility:", window.getComputedStyle(departmentsContainer).display);
        console.log("Courses container visibility:", window.getComputedStyle(coursesContainer).display);
        
        // Hide alphabet navigation
        alphabetNavContainer.style.display = 'none';
        
        // Use the correct variables for visibility toggling
        departmentsContainer.style.display = 'none';  // Not departmentsView
        coursesContainer.style.display = 'block';     // Not coursesView
        
        // Rest of your function...
        
        if (cachedCourses[departmentId]) {
            renderCourses(cachedCourses[departmentId], departmentName);
            return;
        }
    
        try {
            const response = await fetch(`/api/departments/${departmentId}/courses/`);
            if (!response.ok) {
                throw new Error(`Failed to fetch courses for department ${departmentId}`);
            }
            const courses = await response.json();
            cachedCourses[departmentId] = courses;
            renderCourses(courses, departmentName);
            
            console.log("==== AFTER RENDERING COURSES ====");
            console.log("Alphabet bar visibility:", alphabetNavContainer.style.display);
            console.log("Departments container visibility:", window.getComputedStyle(departmentsContainer).display);
            console.log("Courses container visibility:", window.getComputedStyle(coursesContainer).display);
        } catch (error) {
            console.error("Error fetching courses:", error);
            renderCourses([], departmentName);
        }
    }

    // ------------------------------------------------------------------------
    // [Function: Render Courses in the UI]
    // ------------------------------------------------------------------------
    function renderCourses(courses, departmentName) {
        window.scrollTo(0, 0);
    console.log("Rendering courses for department:", departmentName, courses);
    
    if (!breadcrumbContainer) {
        console.error("breadcrumbContainer is null!");
        return;
    }
    
    breadcrumbContainer.innerHTML = `
        <a href="#" id="show-departments" class="breadcrumb-link">Departments</a> / ${departmentName}
    `;
    
    if (!coursesContainer) {
        console.error("coursesContainer is null!");
        return;
    }
    
    coursesContainer.innerHTML = "";
    
        const sortedCourses = [...courses].sort((a, b) => {
            const extractNumber = (course) => {
                if (typeof course.number === 'number') return course.number;
                
                if (typeof course.number === 'string') {
                    const numMatch = course.number.match(/\d+/);
                    return numMatch ? parseInt(numMatch[0], 10) : 0;
                }
                
                return 0;
            };
    
            const numA = extractNumber(a);
            const numB = extractNumber(b);
            return numA - numB;
        });
    
        if (!sortedCourses || sortedCourses.length === 0) {
            coursesContainer.innerHTML = "<p>No courses available for this department.</p>";
        } else {
            sortedCourses.forEach((course) => {
                const courseLink = document.createElement("a");
                courseLink.href = `/courses/${course.id}/`; 
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

    // ------------------------------------------------------------------------
    // [Function: Show Departments View]
    // ------------------------------------------------------------------------
    function showDepartmentsView() {
        breadcrumbContainer.textContent = "Departments";
        
        coursesContainer.style.display = 'none';     
        departmentsContainer.style.display = 'block'; 
        
        alphabetNavContainer.style.display = 'flex';
    }
});