import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

// global variables
let userEmail = null;
let isEditMode = false;
let reviewId = null;

const auth = getAuth();
onAuthStateChanged(auth, (user) => {
    if (user) {
        userEmail = user.email;
        console.log("User authenticated with email:", userEmail);
        
        // If we're in edit mode and just got authenticated, try to load review data
        if (isEditMode && reviewId) {
            console.log("Auth completed, now trying to load review data");
            initializeReviewForm();
        }
    } else {
        console.log("No user is signed in.");
    }
});

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM loaded, initializing review form");
    initializeReviewForm();
    
    // Safety check - remove any loading indicator after 5 seconds
    // to ensure it doesn't get stuck on the page
    setTimeout(() => {
        const stuckIndicator = document.getElementById('loading-indicator');
        if (stuckIndicator) {
            console.warn("Found a loading indicator that wasn't properly removed - cleaning up");
            stuckIndicator.remove();
        }
    }, 5000);
});

// Main initialization function that runs either on DOM load or after authentication
function initializeReviewForm() {
    // Get context info
    const contextType = document.getElementById("contextType")?.value; // "course" or "professor"
    const contextId = document.getElementById("contextId")?.value;
    console.log(`Context: ${contextType}, ID: ${contextId}`);
    
    // Setup containers
    const professorSelectContainer = document.getElementById("professorSelectContainer");
    const courseSelectContainer = document.getElementById("courseSelectContainer");
    
    // Check if we're in edit mode by looking for review_id in URL params
    const urlParams = new URLSearchParams(window.location.search);
    reviewId = urlParams.get('review_id');
    isEditMode = !!reviewId;
    console.log(`Edit mode: ${isEditMode}, Review ID: ${reviewId}`);
    
    // Update page title and button text if in edit mode
    if (isEditMode) {
        document.querySelector('.page-title').textContent = 'Edit Review';
        document.getElementById('submitReviewBtn').textContent = 'Update Review';
    }
  
    // Load professors dropdown if we're in course context
    if (contextType === "course") {
        professorSelectContainer.style.display = "block";
        loadProfessorsDropdown(contextId);
    } 
    // Load courses dropdown if we're in professor context
    else if (contextType === "professor") {
        courseSelectContainer.style.display = "block";
        loadCoursesDropdown(contextId);
    }
  
    // Replace numeric inputs with interactive selectors - only if they don't already exist
    if (!document.querySelector('.interactive-stars')) {
        createInteractiveRatingSelector();
    }
    
    if (!document.querySelector('.interactive-difficulty')) {
        createInteractiveDifficultySelector();
    }
    
    // Create the anonymous review option only if it doesn't already exist
    if (!document.getElementById('anonymousReview')) {
        createAnonymousReviewOption();
    }
    
    // If we're in edit mode and user is authenticated, load the review data
    if (isEditMode && userEmail) {
        console.log("User is authenticated and in edit mode, loading review data");
        loadReviewData();
    }
  
    // Handle form submission
    setupFormSubmission(contextType, contextId);
}

// Helper function to load professors dropdown
function loadProfessorsDropdown(courseId) {
    fetch(`/api/courses/${courseId}/professors/`)
        .then(response => response.json())
        .then(professors => {
            const professorSelect = document.getElementById("professorSelect");
            if (!professorSelect) return;
            
            professorSelect.innerHTML = '<option value="">Select a professor</option>';
            professors.forEach(prof => {
                const option = document.createElement("option");
                option.value = prof.id;
                option.textContent = `${prof.fname} ${prof.lname}`;
                professorSelect.appendChild(option);
            });
            
            // If we're in edit mode, the main function will load the review data
            // No need to call loadReviewData here
        })
        .catch(error => console.error("Error fetching professors:", error));
}

// Helper function to load courses dropdown
function loadCoursesDropdown(professorId) {
    fetch(`/api/professors/${professorId}/courses/`)
        .then(response => response.json())
        .then(courses => {
            const courseSelect = document.getElementById("courseSelect");
            if (!courseSelect) return;
            
            courseSelect.innerHTML = '<option value="">Select a course</option>';
            courses.forEach(course => {
                const option = document.createElement("option");
                option.value = course.id;
                option.textContent = `${course.title} (${course.subject} ${course.number})`;
                courseSelect.appendChild(option);
            });
            
            // If we're in edit mode, the main function will load the review data
            // No need to call loadReviewData here
        })
        .catch(error => console.error("Error fetching courses:", error));
}

// Function to load a review for editing
async function loadReviewData() {
    if (!reviewId || !userEmail) {
        console.log("Missing review ID or user email, cannot load review data");
        return;
    }
    
    // Show loading indicator if it doesn't exist
    let loadingIndicator = document.getElementById('loading-indicator');
    if (!loadingIndicator) {
        loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'loading-indicator';
        loadingIndicator.className = 'loading-message';
        loadingIndicator.innerHTML = 'Loading review data...';
        
        const submitBtn = document.getElementById('submitReviewBtn');
        if (submitBtn && submitBtn.parentNode) {
            submitBtn.parentNode.insertBefore(loadingIndicator, submitBtn);
        }
    }
    
    try {
        console.log(`Attempting to load review #${reviewId} for user ${userEmail}`);
        
        // Instead of using the dedicated endpoint that's having issues,
        // get all user reviews and find the one we need
        const response = await fetch(`/api/my_reviews/${userEmail}/`);
        if (!response.ok) {
            throw new Error(`Failed to fetch reviews: ${response.status}`);
        }
        
        const reviews = await response.json();
        console.log(`Fetched ${reviews.length} reviews for user ${userEmail}`);
        
        // Find the specific review by ID
        const review = reviews.find(r => r.id == reviewId);
        if (!review) {
            throw new Error(`Review #${reviewId} not found in your reviews`);
        }
        
        console.log("Found review to edit:", review);
        
        // Now populate the form fields
        populateFormWithReviewData(review);
        
        // Ensure the loading indicator is removed after a short delay
        // to make sure all UI updates have completed
        setTimeout(() => {
            // Remove loading indicator if present
            loadingIndicator = document.getElementById('loading-indicator');
            if (loadingIndicator) {
                loadingIndicator.remove();
                console.log("Loading indicator removed");
            }
        }, 500);
        
    } catch (error) {
        console.error("Error loading review data:", error);
        
        // Show error in the loading indicator instead of removing it
        loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.className = 'error-message';
            loadingIndicator.textContent = `Error: ${error.message}`;
            
            // Auto-remove error message after 5 seconds
            setTimeout(() => {
                if (loadingIndicator && loadingIndicator.parentNode) {
                    loadingIndicator.remove();
                }
            }, 5000);
        } else {
            alert(`Failed to load review data: ${error.message}`);
        }
    }
}

// Helper function to populate form with review data
function populateFormWithReviewData(review) {
    // Set text fields
    const reviewTextElement = document.getElementById("reviewText");
    if (reviewTextElement) reviewTextElement.value = review.review || '';
    
    const estimatedHoursElement = document.getElementById("estimatedHours");
    if (estimatedHoursElement) estimatedHoursElement.value = review.estimated_hours || '';
    
    // Set grade dropdown value
    const gradeElement = document.getElementById("grade");
    if (gradeElement && review.grade) {
        // Find and select the matching option
        const options = gradeElement.options;
        for (let i = 0; i < options.length; i++) {
            if (options[i].value === review.grade) {
                gradeElement.selectedIndex = i;
                break;
            }
        }
    }
    
    // Wait for the interactive selectors to be created
    setTimeout(() => {
        // Set the rating value and update stars UI
        const ratingInput = document.getElementById("rating");
        if (ratingInput) {
            ratingInput.value = review.rating || 0;
            updateRatingStars(review.rating || 0);
        }
        
        // Set the difficulty value and update circles UI
        const difficultyInput = document.getElementById("difficulty");
        if (difficultyInput) {
            difficultyInput.value = review.difficulty || 0;
            updateDifficultyCircles(review.difficulty || 0);
        }
    }, 300);
    
    // Set checkbox values (with fallbacks for null/undefined)
    setCheckboxSafely("wouldTakeAgain", review.would_take_again);
    setCheckboxSafely("forCredit", review.for_credit);
    setCheckboxSafely("mandatoryAttendance", review.mandatory_attendance);
    setCheckboxSafely("requiredCourse", review.required_course);
    setCheckboxSafely("isGened", review.is_gened);
    setCheckboxSafely("inPerson", review.in_person);
    setCheckboxSafely("online", review.online);
    setCheckboxSafely("hybrid", review.hybrid);
    setCheckboxSafely("noExams", review.no_exams);
    setCheckboxSafely("presentations", review.presentations);
    setCheckboxSafely("anonymousReview", review.is_anonymous);
    
    // Set dropdown selections if applicable
    const contextType = document.getElementById("contextType")?.value;
    
    if (review.professor && contextType === "course") {
        const professorSelect = document.getElementById("professorSelect");
        if (professorSelect) {
            professorSelect.value = review.professor.id;
        }
    }
    
    if (review.course && contextType === "professor") {
        const courseSelect = document.getElementById("courseSelect");
        if (courseSelect) {
            courseSelect.value = review.course.id;
        }
    }
    
    console.log("Form populated with review data");
}

// Helper function to safely set a checkbox value (handling different data types)
function setCheckboxSafely(id, value) {
    const checkbox = document.getElementById(id);
    if (checkbox) {
        checkbox.checked = value === true || value === "true" || value === 1;
    }
}

// Helper function to update rating stars UI
function updateRatingStars(rating) {
    const starsContainer = document.querySelector('.interactive-stars');
    if (!starsContainer) {
        console.warn("Rating stars container not found, cannot update stars");
        return;
    }
    
    const stars = starsContainer.querySelectorAll('.star');
    if (!stars || stars.length === 0) {
        console.warn("No stars found in stars container");
        return;
    }
    
    stars.forEach(star => {
        const starValue = parseInt(star.getAttribute('data-value'));
        if (starValue <= rating) {
            star.classList.add('filled');
        } else {
            star.classList.remove('filled');
        }
    });
    starsContainer.setAttribute('data-value', rating);
    console.log(`Rating stars updated to ${rating}`);
}

// Helper function to update difficulty circles UI
function updateDifficultyCircles(difficulty) {
    const circlesContainer = document.querySelector('.interactive-difficulty');
    if (!circlesContainer) {
        console.warn("Difficulty circles container not found, cannot update circles");
        return;
    }
    
    const circles = circlesContainer.querySelectorAll('.difficulty-circle');
    if (!circles || circles.length === 0) {
        console.warn("No circles found in difficulty container");
        return;
    }
    
    circles.forEach(circle => {
        const circleValue = parseInt(circle.getAttribute('data-value'));
        circle.classList.remove('filled', 'green', 'yellow', 'red');
        
        if (circleValue <= difficulty) {
            circle.classList.add('filled');
            if (circleValue <= 2) {
                circle.classList.add('green');
            } else if (circleValue <= 4) {
                circle.classList.add('yellow');
            } else {
                circle.classList.add('red');
            }
        }
    });
    circlesContainer.setAttribute('data-value', difficulty);
    console.log(`Difficulty circles updated to ${difficulty}`);
}

// Set up the form submission
function setupFormSubmission(contextType, contextId) {
    const submitBtn = document.getElementById("submitReviewBtn");
    if (!submitBtn) {
        console.error("Submit button not found!");
        return;
    }
    
    submitBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        
        // Check if user is authenticated
        if (!userEmail) {
            alert("You must be logged in to submit a review");
            window.location.href = "/login/";
            return;
        }
        
        // Validate form
        if (!validateForm()) {
            return;
        }
        
        // Collect form data
        const formData = collectFormData(contextType);
        
        // Submit the form
        try {
            await submitReview(formData, contextType, contextId);
        } catch (error) {
            console.error("Error submitting review:", error);
            alert(`Error: ${error.message}`);
        }
    });
}

// Validate the form
function validateForm() {
    // Get form values to validate
    const reviewText = document.getElementById("reviewText").value.trim();
    const rating = document.getElementById("rating").value.trim();
    const difficulty = document.getElementById("difficulty").value.trim();
    
    // Get error elements
    const reviewTextError = document.getElementById("reviewTextError");
    const ratingError = document.getElementById("ratingError");
    const difficultyError = document.getElementById("difficultyError");
    
    // Reset errors
    document.getElementById("reviewText").classList.remove("error");
    document.getElementById("rating-stars-container")?.classList.remove("error");
    document.getElementById("difficulty-circles-container")?.classList.remove("error");
    
    if (reviewTextError) reviewTextError.textContent = "";
    if (ratingError) ratingError.textContent = "";
    if (difficultyError) difficultyError.textContent = "";
    
    let isValid = true;
    
    // Validate Review Text
    if (!reviewText) {
        document.getElementById("reviewText").classList.add("error");
        if (reviewTextError) {
            reviewTextError.textContent = "Review text is required.";
        }
        isValid = false;
    }
    
    // Validate Rating
    if (!rating || isNaN(rating) || rating < 1 || rating > 5) {
        const ratingContainer = document.getElementById("rating-stars-container");
        if (ratingContainer) ratingContainer.classList.add("error");
        if (ratingError) {
            ratingError.textContent = "Please select a rating from 1 to 5 stars.";
        }
        isValid = false;
    }
    
    // Validate Difficulty
    if (!difficulty || isNaN(difficulty) || difficulty < 1 || difficulty > 6) {
        const diffContainer = document.getElementById("difficulty-circles-container");
        if (diffContainer) diffContainer.classList.add("error");
        if (difficultyError) {
            difficultyError.textContent = "Please select a difficulty level from 1 to 6.";
        }
        isValid = false;
    }
    
    return isValid;
}

// Collect form data
function collectFormData(contextType) {
    const data = {
        review: document.getElementById("reviewText").value.trim(),
        rating: parseFloat(document.getElementById("rating").value.trim()),
        difficulty: parseInt(document.getElementById("difficulty").value.trim()),
        estimated_hours: document.getElementById("estimatedHours").value.trim() || null,
        grade: document.getElementById("grade").value.trim() || null,
        
        // Boolean fields
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
    
    // Add context-specific data
    if (contextType === "course") {
        const professorSelect = document.getElementById("professorSelect");
        if (professorSelect && professorSelect.value) {
            data.professor = professorSelect.value;
        }
    } else if (contextType === "professor") {
        const courseSelect = document.getElementById("courseSelect");
        if (courseSelect && courseSelect.value) {
            data.course = courseSelect.value;
        }
    }
    
    // Add review_id if in edit mode
    if (isEditMode && reviewId) {
        data.review_id = reviewId;
    }
    
    return data;
}

// Submit the review
async function submitReview(formData, contextType, contextId) {
    // Determine endpoint and method based on edit mode
    let endpoint, method;
    
    if (isEditMode) {
        endpoint = `/api/reviews/${reviewId}/update/`;
        method = 'PUT';
    } else {
        endpoint = contextType === "course"
            ? `/api/courses/${contextId}/reviews/create/`
            : `/api/professors/${contextId}/reviews/create/`;
        method = 'POST';
    }
    
    console.log(`Submitting review to ${endpoint} with method ${method}`);
    
    const response = await fetch(endpoint, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${isEditMode ? 'update' : 'create'} review (${response.status})`);
    }
    
    const result = await response.json();
    console.log("Review submission successful:", result);
    
    // Redirect to appropriate page
    if (contextType === "course") {
        window.location.href = `/courses/${contextId}/`;
    } else if (contextType === "professor") {
        window.location.href = `/professors/${contextId}/`;
    } else {
        window.location.href = `/my_reviews/`;
    }
}

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
    // First check if the anonymousReview checkbox already exists
    if (document.getElementById('anonymousReview')) {
        console.log("Anonymous review option already exists, skipping creation");
        return;
    }
    
    // Create container for the anonymous review option
    const anonymousContainer = document.createElement('div');
    anonymousContainer.className = 'form-check review-option-container mb-3';
    anonymousContainer.id = 'anonymousReviewContainer';
    
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
    
    if (!document.querySelector('hr.anon-separator')) {
        const separator = document.createElement('hr');
        separator.className = 'mt-3 mb-3 anon-separator';
        submitBtnParent.insertBefore(separator, submitBtn);
    }
    
    submitBtnParent.insertBefore(anonymousContainer, submitBtn);
    
    anonymousInput.addEventListener('change', () => {
        console.log("Anonymous checkbox changed:", anonymousInput.checked);
    });
}