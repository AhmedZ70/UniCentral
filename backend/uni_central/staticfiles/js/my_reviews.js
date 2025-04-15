import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

// Global variables
let userEmail = null;
let allReviews = [];
let currentlySelectedReview = null;

// Get Firebase auth instance
const auth = getAuth();

document.addEventListener("DOMContentLoaded", () => {
    // DOM elements
    const reviewSearchInput = document.getElementById("review-search");
    const searchBtn = document.getElementById("search-btn");
    const reviewsList = document.getElementById("reviews-list");
    const noReviewsMessage = document.getElementById("no-reviews-message");
    const loadingIndicator = document.getElementById("loading-indicator");
    const reviewsCountEl = document.getElementById("reviews-count");
    
    // Modal elements
    const editConfirmModal = document.getElementById("edit-confirm-modal");
    const deleteConfirmModal = document.getElementById("delete-confirm-modal");
    const closeModalButtons = document.querySelectorAll(".close-modal");
    const editConfirmBtn = document.getElementById("edit-confirm-btn");
    const cancelEditBtn = document.getElementById("cancel-edit-btn");
    const deleteConfirmBtn = document.getElementById("delete-confirm-btn");
    const cancelDeleteBtn = document.getElementById("cancel-delete-btn");
    
    // Listen for auth state changes
    onAuthStateChanged(auth, (user) => {
        if (user) {
            userEmail = user.email;
            fetchUserReviews();
        } else {
            // Not logged in
            userEmail = null;
            reviewsList.innerHTML = '';
            reviewsCountEl.textContent = "0";
            noReviewsMessage.style.display = "block";
            loadingIndicator.style.display = "none";
            
            // Show login message
            noReviewsMessage.innerHTML = `
                <p>You need to be logged in to see your reviews.</p>
                <p>Please <a href="/login/">login</a> to continue.</p>
            `;
        }
    });
    
    // Add event listener for search input
    reviewSearchInput.addEventListener("input", searchReviews);
    searchBtn.addEventListener("click", searchReviews);
    
    // Also trigger search on Enter key
    reviewSearchInput.addEventListener("keyup", (event) => {
        if (event.key === "Enter") {
            searchReviews();
        }
    });
    
    // Modal close handlers
    closeModalButtons.forEach(button => {
        button.addEventListener("click", () => {
            editConfirmModal.style.display = "none";
            deleteConfirmModal.style.display = "none";
        });
    });
    
    // Edit confirmation
    editConfirmBtn.addEventListener("click", () => {
        if (currentlySelectedReview) {
            navigateToEditReview(currentlySelectedReview);
        }
        editConfirmModal.style.display = "none";
    });
    
    cancelEditBtn.addEventListener("click", () => {
        editConfirmModal.style.display = "none";
    });
    
    // Delete confirmation
    deleteConfirmBtn.addEventListener("click", () => {
        if (currentlySelectedReview) {
            deleteReview(currentlySelectedReview.id);
        }
        deleteConfirmModal.style.display = "none";
    });
    
    cancelDeleteBtn.addEventListener("click", () => {
        deleteConfirmModal.style.display = "none";
    });
    
    // Close modals when clicking outside
    window.addEventListener("click", (event) => {
        if (event.target === editConfirmModal) {
            editConfirmModal.style.display = "none";
        }
        if (event.target === deleteConfirmModal) {
            deleteConfirmModal.style.display = "none";
        }
    });
    
    // Function to fetch user reviews
    async function fetchUserReviews() {
        if (!userEmail) return;
        
        try {
            loadingIndicator.style.display = "block";
            noReviewsMessage.style.display = "none";
            reviewsList.innerHTML = '';
            
            const response = await fetch(`/api/my_reviews/${userEmail}/`);
            if (!response.ok) {
                throw new Error(`Failed to fetch reviews: ${response.status}`);
            }
            
            const data = await response.json();
            allReviews = data;
            
            console.log('Fetched reviews:', allReviews);
            
            // Update reviews count
            reviewsCountEl.textContent = allReviews.length;
            
            // Display reviews
            if (allReviews.length === 0) {
                noReviewsMessage.style.display = "block";
            } else {
                displayReviews(allReviews);
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
            reviewsList.innerHTML = `<p class="error-message">Failed to load reviews: ${error.message}</p>`;
        } finally {
            loadingIndicator.style.display = "none";
        }
    }
    
    // Function to search reviews
    function searchReviews() {
        const searchTerm = reviewSearchInput.value.toLowerCase().trim();
        
        if (!searchTerm) {
            // If search is empty, show all reviews
            reviewsCountEl.textContent = allReviews.length;
            displayReviews(allReviews);
            return;
        }
        
        const filteredReviews = allReviews.filter(review => {
            // Search in review text
            if (review.review && review.review.toLowerCase().includes(searchTerm)) {
                return true;
            }
            
            // Search in course title, subject, and number
            if (review.course) {
                const courseTitle = review.course.title ? review.course.title.toLowerCase() : '';
                const courseSubject = review.course.subject ? review.course.subject.toLowerCase() : '';
                const courseNumber = review.course.number ? String(review.course.number) : '';
                
                if (courseTitle.includes(searchTerm) || 
                    courseSubject.includes(searchTerm) || 
                    courseNumber.includes(searchTerm)) {
                    return true;
                }
            }
            
            // Search in professor name
            if (review.professor) {
                const profFirstName = review.professor.fname ? review.professor.fname.toLowerCase() : '';
                const profLastName = review.professor.lname ? review.professor.lname.toLowerCase() : '';
                
                if (profFirstName.includes(searchTerm) || profLastName.includes(searchTerm)) {
                    return true;
                }
            }
            
            return false;
        });
        
        // Update reviews count
        reviewsCountEl.textContent = filteredReviews.length;
        
        // Display filtered reviews
        displayReviews(filteredReviews);
    }
    
    // Display reviews in the reviews list
    function displayReviews(reviews) {
        reviewsList.innerHTML = '';
        
        if (reviews.length === 0) {
            noReviewsMessage.style.display = "block";
            return;
        }
        
        noReviewsMessage.style.display = "none";
        
        // Sort by newest first by default
        reviews.sort((a, b) => b.id - a.id);
        
        reviews.forEach(review => {
            const reviewCard = document.createElement('div');
            reviewCard.className = 'review-card';
            reviewCard.setAttribute('data-review-id', review.id);
            
            // Determine review type and title
            let reviewTitle, reviewSubtitle;
            
            if (review.course) {
                reviewTitle = `${review.course.title} (${review.course.subject} ${review.course.number})`;
                reviewSubtitle = review.professor ? 
                    `Professor: ${review.professor.fname} ${review.professor.lname}` : 
                    'No professor specified';
            } else if (review.professor) {
                reviewTitle = `Professor ${review.professor.fname} ${review.professor.lname}`;
                reviewSubtitle = review.course ? 
                    `Course: ${review.course.title} (${review.course.subject} ${review.course.number})` : 
                    'No course specified';
            } else {
                reviewTitle = `Review #${review.id}`;
                reviewSubtitle = 'No course or professor information';
            }
            
            reviewCard.innerHTML = `
                <div class="review-header">
                    <div class="review-header-left">
                        <h3 class="review-title">${reviewTitle}</h3>
                        <p class="review-subtitle">${reviewSubtitle}</p>
                    </div>
                    <div class="review-header-right">
                        <div class="review-actions">
                            <button class="edit-btn" data-review-id="${review.id}">Edit</button>
                            <button class="delete-btn" data-review-id="${review.id}">Delete</button>
                        </div>
                    </div>
                </div>
                <div class="review-content">
                    <div class="review-text-section">
                        <p class="review-text">${review.review || 'No review text provided.'}</p>
                        
                        <div class="review-tags">
                            ${review.for_credit ? '<span class="tag">For Credit</span>' : ''}
                            ${review.would_take_again ? '<span class="tag">Would Take Again</span>' : ''}
                            ${review.mandatory_attendance ? '<span class="tag">Attendance Required</span>' : ''}
                            ${review.is_anonymous ? '<span class="tag">Anonymous</span>' : ''}
                        </div>
                    </div>
                    
                    <div class="review-side-section">
                        <div class="review-details">
                            <p class="detail-item">
                                <span class="detail-label">Rating</span>
                                <span class="rating-container"></span>
                            </p>
                            <p class="detail-item">
                                <span class="detail-label">Difficulty</span>
                                <span class="difficulty-container"></span>
                            </p>
                            <p class="detail-item">
                                <span class="detail-label">Grade</span> 
                                <strong>${review.grade || 'N/A'}</strong>
                            </p>
                            <p class="detail-item">
                                <span class="detail-label">Weekly Hours</span>
                                <strong>${review.estimated_hours || 'N/A'}</strong>
                            </p>
                        </div>
                    </div>
                </div>
            `;
            
            reviewsList.appendChild(reviewCard);
            
            // Add rating stars
            const ratingContainer = reviewCard.querySelector('.rating-container');
            ratingContainer.appendChild(createRatingStars(review.rating || 0));
            
            // Add difficulty circles
            const difficultyContainer = reviewCard.querySelector('.difficulty-container');
            difficultyContainer.appendChild(createDifficultyCircles(review.difficulty || 0));
            
            // Add event listeners for edit and delete buttons
            const editBtn = reviewCard.querySelector('.edit-btn');
            const deleteBtn = reviewCard.querySelector('.delete-btn');
            
            if (editBtn) {
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent card click
                    currentlySelectedReview = review;
                    editConfirmModal.style.display = "flex";
                });
            }
            
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent card click
                    currentlySelectedReview = review;
                    deleteConfirmModal.style.display = "flex";
                });
            }
        });
    }
    
    // Navigate to the review editing page with the appropriate URL parameters
    function navigateToEditReview(review) {
        // Determine the context type (course or professor)
        const contextType = review.course ? 'course' : 'professor';
        const contextId = contextType === 'course' ? review.course.id : review.professor.id;
        
        // Create URL with review_id as a query parameter
        const editUrl = `/${contextType}s/${contextId}/review/?review_id=${review.id}`;
        
        // Redirect to the review form page
        window.location.href = editUrl;
    }
    
    // Function to delete a review
    async function deleteReview(reviewId) {
        try {
            const response = await fetch(`/api/reviews/${reviewId}/delete/`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email_address: userEmail
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to delete review: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                // Remove the review from our array
                allReviews = allReviews.filter(review => review.id !== reviewId);
                
                // Update the UI
                displayReviews(allReviews);
                
                // Show success message
                alert('Review deleted successfully');
            } else {
                throw new Error(result.error || 'Failed to delete review');
            }
        } catch (error) {
            console.error('Error deleting review:', error);
            alert(`Error deleting review: ${error.message}`);
        }
    }
    
    // Create rating stars element
    function createRatingStars(rating) {
        const maxStars = 5;
        const filledStars = Math.round(rating);
        const starsContainer = document.createElement('div');
        starsContainer.className = 'rating-stars';
    
        for (let i = 1; i <= maxStars; i++) {
            const star = document.createElement('span');
            star.className = i <= filledStars ? 'star filled' : 'star';
            star.innerHTML = '★';
            starsContainer.appendChild(star);
        }
    
        return starsContainer;
    }
    
    // Create difficulty circles element
    function createDifficultyCircles(difficulty) {
        const maxCircles = 6;
        const filledCircles = Math.round(difficulty);
        const circlesContainer = document.createElement('div');
        circlesContainer.className = 'difficulty-rating';
    
        for (let i = 1; i <= maxCircles; i++) {
            const circle = document.createElement('div');
            circle.className = 'difficulty-circle';
    
            if (i <= filledCircles) {
                circle.classList.add('filled');
    
                if (i <= 2) {
                    circle.classList.add('green');
                } else if (i <= 4) {
                    circle.classList.add('yellow');
                } else {
                    circle.classList.add('red');
                }
            }
    
            circlesContainer.appendChild(circle);
        }
    
        return circlesContainer;
    }
}); 