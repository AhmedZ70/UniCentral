import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

const firebaseConfig = {
    apiKey: "AIzaSyD0wF4R9GdY2m7eAwVL_j_mihLit4rRZ5Q",
    authDomain: "unicentral-b6c23.firebaseapp.com",
    projectId: "unicentral-b6c23",
    storageBucket: "unicentral-b6c23.firebasestorage.app",
    messagingSenderId: "554502030441",
    appId: "1:554502030441:web:6dccab580dbcfdb974cef8",
    measurementId: "G-M4L04508RH",
    clientId: "554502030441-g68f3tti18fiip1hpr6ehn6q6u5sn8fh.apps.googleusercontent.com"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
let userEmail = null;

onAuthStateChanged(auth, (user) => {
    if (user) {
        userEmail = user.email;
        console.log("User email:", userEmail);
    } else {
        console.log("No user is signed in.");
    }
});

document.addEventListener("DOMContentLoaded", () => {
    // Get context information
    const contextType = document.getElementById("contextType").value; // "course" or "professor"
    const contextId = document.getElementById("contextId").value;

    // Check if this is an edit page by looking for review ID
    const reviewIdInput = document.getElementById("reviewId");
    const reviewId = reviewIdInput ? reviewIdInput.value : null;
    const isEdit = reviewId ? true : false;

    const professorSelectContainer = document.getElementById("professorSelectContainer");
    const courseSelectContainer = document.getElementById("courseSelectContainer");

    let courseId = document.getElementById("courseId") ? document.getElementById("courseId").value : null;

    if (contextType === "course") {
        // If this is an edit form, use the course ID from the form
        if (isEdit && !courseId) {
            console.error("Course ID not found in edit form!");
        }

        professorSelectContainer.style.display = "block";

        fetch(`/api/courses/${contextId}/professors/`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch professors (status ${response.status})`);
                }
                return response.json();
            })
            .then((professors) => {
                const professorSelect = document.getElementById("professorSelect");

                // Clear existing options
                professorSelect.innerHTML = '';

                // Add a default "Select Professor" option
                const defaultOption = document.createElement("option");
                defaultOption.value = "";
                defaultOption.textContent = "Select a Professor";
                defaultOption.selected = true;
                defaultOption.disabled = true;
                professorSelect.appendChild(defaultOption);

                // Populate professors
                professors.forEach((prof) => {
                    const option = document.createElement("option");
                    option.value = prof.id;
                    option.textContent = `${prof.fname} ${prof.lname}`;
                    professorSelect.appendChild(option);
                });

                // If in edit mode and current professor exists, select that professor
                if (isEdit && document.getElementById("currentProfessorId")) {
                    const currentProfId = document.getElementById("currentProfessorId").value;
                    professorSelect.value = currentProfId;
                }
            })
            .catch((error) => {
                console.error("Error fetching professors:", error);

                // Disable professor dropdown and show error
                const professorSelect = document.getElementById("professorSelect");
                professorSelect.innerHTML = '';

                const errorOption = document.createElement("option");
                errorOption.textContent = "Unable to load professors";
                errorOption.disabled = true;
                errorOption.selected = true;
                professorSelect.appendChild(errorOption);
                professorSelect.disabled = true;
            });
    }

    // Replace numeric inputs with interactive selectors
    createInteractiveRatingSelector();
    createInteractiveDifficultySelector();

    // Create the anonymous review option
    createAnonymousReviewOption();

    // Handle form submission
    const submitBtn = document.getElementById("submitReviewBtn");
    submitBtn.addEventListener("click", (e) => {
        if (!submitBtn) {
            console.error("Submit button not found!");
            return;
        }
        e.preventDefault();

        let isAnonymous = false;
        const anonymousCheckbox = document.getElementById("anonymousReview");
        console.log("Anonymous Checkbox Element:", anonymousCheckbox);
        console.log("Is Anonymous Checked:", anonymousCheckbox.checked);
        console.log("Anonymous Checkbox Value:", anonymousCheckbox.value);

        if (anonymousCheckbox) {
            isAnonymous = anonymousCheckbox.checked;
            console.log("Anonymous Checkbox Found:", anonymousCheckbox);
            console.log("Is Anonymous Checked:", isAnonymous);
        } else {
            console.error("Anonymous checkbox not found in the DOM!");
        }

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
            is_anonymous: document.getElementById("anonymousReview").checked,

            email_address: userEmail
        };

        if (contextType === "course") {
            bodyData.professor = document.getElementById("professorSelect").value;
        } else if (contextType === "professor") {
            bodyData.course = document.getElementById("courseSelect").value;
        }

        // If this is an edit, we need to include the review ID
        if (isEdit) {
            bodyData.review_id = reviewId;
        }

        // Determine the endpoint based on whether this is a new review or an edit
        let endpoint;
        let method;

        if (isEdit) {
            endpoint = `/api/reviews/${reviewId}/update/`;
            method = "PUT";
        } else {
            endpoint = contextType === "course"
                ? `/api/courses/${contextId}/reviews/create/`
                : `/api/professors/${contextId}/reviews/create/`;
            method = "POST";
        }

        fetch(endpoint, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bodyData),
        })
        .then((response) => {
            // Log the full response for debugging
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            
            // Try to parse the error response
            return response.json().then(errorData => {
                if (!response.ok) {
                    console.error('Error response body:', errorData);
                    throw new Error(`Failed to ${isEdit ? 'update' : 'create'} review. ${JSON.stringify(errorData)}`);
                }
                return errorData;
            });
        })
        .then((data) => {
            if (isEdit) {
                window.location.href = "/my_reviews/";
            } else {
                if (contextType === "course") {
                    window.location.href = `/courses/${contextId}/`;
                } else if (contextType === "professor") {
                    window.location.href = `/professors/${contextId}/`;
                }
            }
        })
        .catch((error) => {
            console.error(`Error ${isEdit ? 'updating' : 'submitting'} review:`, error);
            console.log('Body data sent:', bodyData);
            alert(`Failed to ${isEdit ? 'update' : 'create'} review: ${error.message}`);
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

    difficultyContainer.appendChild(difficultyTitle);
    difficultyContainer.appendChild(circlesContainer);
    difficultyContainer.appendChild(helpText);

    const difficultyParent = difficultyInput.parentNode;
    difficultyParent.insertBefore(difficultyContainer, difficultyInput);

    difficultyInput.style.display = 'none';
}

function createAnonymousReviewOption() {
    // Create container for the anonymous review option
    const anonymousContainer = document.createElement('div');
    anonymousContainer.className = 'form-check review-option-container mb-3';

    // Create input checkbox
    const anonymousInput = document.createElement('input');
    anonymousInput.type = 'checkbox';
    anonymousInput.className = 'form-check-input';
    anonymousInput.id = 'anonymousReview';
    anonymousInput.name = 'anonymousReview';
    // Set default value to ensure it's initialized properly
    anonymousInput.value = "true";

    // Create label
    const anonymousLabel = document.createElement('label');
    anonymousLabel.className = 'form-check-label ms-2';
    anonymousLabel.htmlFor = 'anonymousReview';
    anonymousLabel.textContent = 'Make this review anonymous';

    // Create help text
    const helpText = document.createElement('small');
    helpText.className = 'form-text text-muted d-block mt-1';
    helpText.textContent = 'When checked, your name will not be displayed with this review';

    // Assemble components
    anonymousContainer.appendChild(anonymousInput);
    anonymousContainer.appendChild(anonymousLabel);
    anonymousContainer.appendChild(document.createElement('br'));
    anonymousContainer.appendChild(helpText);

    const submitBtn = document.getElementById('submitReviewBtn');

    if (!submitBtn || !submitBtn.parentNode) {
        console.error("Cannot find submit button or its parent node");
        const form = document.querySelector('form');
        if (form) {
            form.appendChild(anonymousContainer);
        } else {
            document.body.appendChild(anonymousContainer);
        }
        return;
    }

    const submitBtnParent = submitBtn.parentNode;

    const separator = document.createElement('hr');
    separator.className = 'mt-3 mb-3';

    submitBtnParent.insertBefore(separator, submitBtn);
    submitBtnParent.insertBefore(anonymousContainer, submitBtn);

    anonymousInput.addEventListener('change', () => {
        console.log("Anonymous checkbox changed:", anonymousInput.checked);
    });
}