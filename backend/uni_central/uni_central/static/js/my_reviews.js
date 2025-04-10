import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

// Global variables
let userEmail = null;
let allReviews = [];
let currentlySelectedReview = null;

// Get Firebase auth instance
const auth = getAuth();

document.addEventListener("DOMContentLoaded", () => {
    // DOM elements
    const reviewTypeFilter = document.getElementById("review-type");
    const sortReviewsSelect = document.getElementById("sort-reviews");
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
    
    // Event listeners for filters and sorting
    reviewTypeFilter.addEventListener("change", filterAndSortReviews);
    sortReviewsSelect.addEventListener("change", filterAndSortReviews);
    
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
                filterAndSortReviews();
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
            reviewsList.innerHTML = `<p class="error-message">Failed to load reviews: ${error.message}</p>`;
        } finally {
            loadingIndicator.style.display = "none";
        }
    }
    
    // Filter and sort reviews based on current selections
    function filterAndSortReviews() {
        const filterType = reviewTypeFilter.value;
        const sortBy = sortReviewsSelect.value;
        
        // Apply filters
        let filteredReviews = [...allReviews];
        
        if (filterType === 'course') {
            filteredReviews = filteredReviews.filter(review => review.course);
        } else if (filterType === 'professor') {
            filteredReviews = filteredReviews.filter(review => review.professor);
        }
        
        // Apply sorting
        switch (sortBy) {
            case 'newest':
                // Sort by ID (assuming higher ID = newer)
                filteredReviews.sort((a, b) => b.id - a.id);
                break;
            case 'oldest':
                filteredReviews.sort((a, b) => a.id - b.id);
                break;
            case 'rating-high':
                filteredReviews.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'rating-low':
                filteredReviews.sort((a, b) => (a.rating || 0) - (b.rating || 0));
                break;
            default:
                // Default to newest first
                filteredReviews.sort((a, b) => b.id - a.id);
        }
        
        // Update review count
        reviewsCountEl.textContent = filteredReviews.length;
        
        // Display filtered and sorted reviews
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
                    <div>
                        <h3 class="review-title">${reviewTitle}</h3>
                        <p class="review-subtitle">${reviewSubtitle}</p>
                    </div>
                </div>
                <div class="review-content">
                    <p class="review-text">${review.review || 'No review text provided.'}</p>
                    
                    <div class="review-details">
                        <p class="detail-item">
                            <span class="detail-label">Rating:</span>
                            <span class="rating-container"></span>
                        </p>
                        <p class="detail-item">
                            <span class="detail-label">Difficulty:</span>
                            <span class="difficulty-container"></span>
                        </p>
                        <p class="detail-item">
                            <span class="detail-label">Grade:</span> ${review.grade || 'N/A'}
                        </p>
                        <p class="detail-item">
                            <span class="detail-label">Estimated Hours:</span> ${review.estimated_hours || 'N/A'}
                        </p>
                    </div>
                    
                    <div class="review-actions">
                        <button class="edit-btn" data-review-id="${review.id}">Edit</button>
                        <button class="delete-btn" data-review-id="${review.id}">Delete</button>
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
            
            editBtn.addEventListener('click', () => {
                currentlySelectedReview = review;
                editConfirmModal.style.display = "flex";
            });
            
            deleteBtn.addEventListener('click', () => {
                currentlySelectedReview = review;
                deleteConfirmModal.style.display = "flex";
            });
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
                filterAndSortReviews();
                
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