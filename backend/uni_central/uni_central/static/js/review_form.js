import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

// global variable for email
let userEmail = null;

const auth = getAuth();
onAuthStateChanged(auth, (user) => {
    if (user) {
        userEmail = user.email;
        console.log("User email:", userEmail);
    } else {
        console.log("No user is signed in.");
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const contextType = document.getElementById("contextType").value; // "course" or "professor"
    const contextId = document.getElementById("contextId").value;
  
    const professorSelectContainer = document.getElementById("professorSelectContainer");
    const courseSelectContainer = document.getElementById("courseSelectContainer");
  
    if (contextType === "course") {
        // Show professor dropdown and fetch professors
        professorSelectContainer.style.display = "block";
        fetch(`/api/courses/${contextId}/professors/`)
            .then((response) => response.json())
            .then((professors) => {
                const professorSelect = document.getElementById("professorSelect");
                professors.forEach((prof) => {
                    const option = document.createElement("option");
                    option.value = prof.id;
                    option.textContent = `${prof.fname} ${prof.lname}`;
                    professorSelect.appendChild(option);
                });
            })
            .catch((error) => console.error("Error fetching professors:", error));
    } else if (contextType === "professor") {
        // Show course dropdown and fetch courses
        courseSelectContainer.style.display = "block";
        fetch(`/api/professors/${contextId}/courses/`)
            .then((response) => response.json())
            .then((courses) => {
                const courseSelect = document.getElementById("courseSelect");
                courses.forEach((course) => {
                    const option = document.createElement("option");
                    option.value = course.id;
                    option.textContent = `${course.title} (${course.subject} ${course.number})`;
                    courseSelect.appendChild(option);
                });
            })
            .catch((error) => console.error("Error fetching courses:", error));
    }
  
    // Replace numeric inputs with interactive selectors
    createInteractiveRatingSelector();
    createInteractiveDifficultySelector();
  
    // Handle form submission
    const submitBtn = document.getElementById("submitReviewBtn");
    submitBtn.addEventListener("click", (e) => {
        e.preventDefault();
        // Get field values
        const reviewText = document.getElementById("reviewText").value.trim();
        const rating = document.getElementById("rating").value.trim();
        const difficulty = document.getElementById("difficulty").value.trim();

        // Get error elements
        const reviewTextError = document.getElementById("reviewTextError");
        const ratingError = document.getElementById("ratingError");
        const difficultyError = document.getElementById("difficultyError");

        // Reset errors
        document.getElementById("reviewText").classList.remove("error");
        document.getElementById("rating-stars-container").classList.remove("error");
        document.getElementById("difficulty-circles-container").classList.remove("error");
        reviewTextError.style.display = "none";
        ratingError.style.display = "none";
        difficultyError.style.display = "none";

        let isValid = true;

        // Validate Review Text
        if (!reviewText) {
            document.getElementById("reviewText").classList.add("error");
            reviewTextError.textContent = "Review text is required.";
            reviewTextError.style.display = "block";
            isValid = false;
        }

        // Validate Rating
        if (!rating || isNaN(rating) || rating < 1 || rating > 5) {
            document.getElementById("rating-stars-container").classList.add("error");
            ratingError.textContent = "Please select a rating from 1 to 5 stars.";
            ratingError.style.display = "block";
            isValid = false;
        }

        // Validate Difficulty
        if (!difficulty || isNaN(difficulty) || difficulty < 1 || difficulty > 6) {
            document.getElementById("difficulty-circles-container").classList.add("error");
            difficultyError.textContent = "Please select a difficulty level from 1 to 6.";
            difficultyError.style.display = "block";
            isValid = false;
        }

        // Stop submission if validation fails
        if (!isValid) {
            return;
        }
        
        const bodyData = {
            review: reviewText,
            rating: parseFloat(rating),
            difficulty: parseInt(difficulty),
            estimated_hours: document.getElementById("estimatedHours").value.trim() || null,
            grade: document.getElementById("grade").value.trim() || null,

            would_take_again: document.getElementById("wouldTakeAgain").checked,
            for_credit: document.getElementById("forCredit").checked,
            mandatory_attendance: document.getElementById("mandatoryAttendance").checked,
            required_course: document.getElementById("requiredCourse").checked,
            is_gened: document.getElementById("isGened").checked,
            in_person: document.getElementById("inPerson").checked,
            online: document.getElementById("online").checked,
            hybrid: document.getElementById("hybrid").checked,
            no_exams: document.getElementById("noExams").checked,
            presentations: document.getElementById("presentations").checked,

            email_address: userEmail
        };
  
        if (contextType === "course") {
            bodyData.professor = document.getElementById("professorSelect").value;
        } else if (contextType === "professor") {
            bodyData.course = document.getElementById("courseSelect").value;
        }
  
        const endpoint =
            contextType === "course"
                ? `/api/courses/${contextId}/reviews/create/`
                : `/api/professors/${contextId}/reviews/create/`;
  
        fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bodyData),
        })
            .then((response) => {
                if (!response.ok) throw new Error("Failed to create review.");
                return response.json();
            })
            .then((data) => {
                // Redirect to course or professor detail page based on context
                if (contextType === "course") {
                    window.location.href = `/courses/${contextId}/`;
                } else if (contextType === "professor") {
                    window.location.href = `/professors/${contextId}/`;
                }
            })
            .catch((error) => {
                console.error("Error submitting review:", error);
                alert("Failed to create review.");
            });
    });
});

// Create interactive star rating selector
function createInteractiveRatingSelector() {
    const ratingInput = document.getElementById('rating');
    const ratingContainer = document.createElement('div');
    ratingContainer.id = 'rating-stars-container';
    ratingContainer.className = 'interactive-stars-container';
    
    // Create label and help text
    const starRatingTitle = document.createElement('div');
    starRatingTitle.className = 'selector-title';
    starRatingTitle.textContent = 'Rating:';
    
    const helpText = document.createElement('div');
    helpText.className = 'selector-help-text';
    helpText.textContent = 'Click on a star to select your rating';
    
    // Create stars container
    const starsContainer = document.createElement('div');
    starsContainer.className = 'interactive-stars';
    starsContainer.setAttribute('data-value', '0');
    
    // Create 5 stars
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.className = 'star';
        star.setAttribute('data-value', i);
        star.innerHTML = '★';
        
        // Add click event to each star
        star.addEventListener('click', () => {
            const selectedValue = parseInt(star.getAttribute('data-value'));
            starsContainer.setAttribute('data-value', selectedValue);
            ratingInput.value = selectedValue;
            
            // Update star styles
            const stars = starsContainer.querySelectorAll('.star');
            stars.forEach(s => {
                const starValue = parseInt(s.getAttribute('data-value'));
                if (starValue <= selectedValue) {
                    s.classList.add('filled');
                } else {
                    s.classList.remove('filled');
                }
            });
        });
        
        // Add hover effects
        star.addEventListener('mouseenter', () => {
            const hoverValue = parseInt(star.getAttribute('data-value'));
            const stars = starsContainer.querySelectorAll('.star');
            stars.forEach(s => {
                const starValue = parseInt(s.getAttribute('data-value'));
                if (starValue <= hoverValue) {
                    s.classList.add('hover');
                }
            });
        });
        
        star.addEventListener('mouseleave', () => {
            const stars = starsContainer.querySelectorAll('.star');
            stars.forEach(s => {
                s.classList.remove('hover');
            });
        });
        
        starsContainer.appendChild(star);
    }
    
    // Assemble the components
    ratingContainer.appendChild(starRatingTitle);
    ratingContainer.appendChild(starsContainer);
    ratingContainer.appendChild(helpText);
    
    // Replace the original input with our interactive version
    const ratingParent = ratingInput.parentNode;
    ratingParent.insertBefore(ratingContainer, ratingInput);
    
    // Hide the original input but keep it in the DOM for form submission
    ratingInput.style.display = 'none';
}

// Create interactive difficulty selector
function createInteractiveDifficultySelector() {
    const difficultyInput = document.getElementById('difficulty');
    const difficultyContainer = document.createElement('div');
    difficultyContainer.id = 'difficulty-circles-container';
    difficultyContainer.className = 'interactive-difficulty-container';
    
    // Create label and help text
    const difficultyTitle = document.createElement('div');
    difficultyTitle.className = 'selector-title';
    difficultyTitle.textContent = 'Difficulty:';
    
    const helpText = document.createElement('div');
    helpText.className = 'selector-help-text';
    helpText.textContent = 'Click on a circle to select difficulty level (1-6)';
    
    // Create circles container
    const circlesContainer = document.createElement('div');
    circlesContainer.className = 'interactive-difficulty';
    circlesContainer.setAttribute('data-value', '0');
    
    // Create 6 difficulty circles
    for (let i = 1; i <= 6; i++) {
        const circle = document.createElement('span');
        circle.className = 'difficulty-circle';
        circle.setAttribute('data-value', i);
        
        // Add click event to each circle
        circle.addEventListener('click', () => {
            const selectedValue = parseInt(circle.getAttribute('data-value'));
            circlesContainer.setAttribute('data-value', selectedValue);
            difficultyInput.value = selectedValue;
            
            // Update circle styles
            const circles = circlesContainer.querySelectorAll('.difficulty-circle');
            circles.forEach(c => {
                const circleValue = parseInt(c.getAttribute('data-value'));
                c.classList.remove('filled', 'green', 'yellow', 'red');
                
                if (circleValue <= selectedValue) {
                    c.classList.add('filled');
                    if (circleValue <= 2) {
                        c.classList.add('green');
                    } else if (circleValue <= 4) {
                        c.classList.add('yellow');
                    } else {
                        c.classList.add('red');
                    }
                }
            });
        });
        
        // Add hover effects
        circle.addEventListener('mouseenter', () => {
            const hoverValue = parseInt(circle.getAttribute('data-value'));
            const circles = circlesContainer.querySelectorAll('.difficulty-circle');
            circles.forEach(c => {
                const circleValue = parseInt(c.getAttribute('data-value'));
                if (circleValue <= hoverValue) {
                    c.classList.add('hover');
                }
            });
        });
        
        circle.addEventListener('mouseleave', () => {
            const circles = circlesContainer.querySelectorAll('.difficulty-circle');
            circles.forEach(c => {
                c.classList.remove('hover');
            });
        });
        
        circlesContainer.appendChild(circle);
    }
    
    // Assemble the components
    difficultyContainer.appendChild(difficultyTitle);
    difficultyContainer.appendChild(circlesContainer);
    difficultyContainer.appendChild(helpText);
    
    // Replace the original input with our interactive version
    const difficultyParent = difficultyInput.parentNode;
    difficultyParent.insertBefore(difficultyContainer, difficultyInput);
    
    // Hide the original input but keep it in the DOM for form submission
    difficultyInput.style.display = 'none';
}