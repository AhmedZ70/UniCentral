import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const reviewTypeSelect = document.getElementById('review-type');
  const reviewsContainer = document.querySelector('.my-reviews');
  const reviewsSort = document.querySelector('.reviews-sort');
  
  let userEmail = '';
  
  let allReviews = [];
  let courseReviews = [];
  let professorReviews = [];

  const auth = getAuth();
  
  init();
  
  function init() {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        userEmail = user.email;
        loadUserReviews();
        setupEventListeners();
      } else {
        window.location.href = '/login';
      }
    });
  }
  
  function setupEventListeners() {
    reviewTypeSelect.addEventListener('change', filterReviews);
    reviewsSort.addEventListener('change', sortReviews);    
    reviewsContainer.addEventListener('click', handleReviewAction);
  }
  
  async function loadUserReviews() {
    try {
      const searchElement = reviewsContainer.querySelector('.search-reviews');
      reviewsContainer.innerHTML = '';
      reviewsContainer.appendChild(searchElement);
      
      const loadingMsg = document.createElement('div');
      loadingMsg.className = 'loading-message';
      loadingMsg.textContent = 'Loading your reviews...';
      reviewsContainer.appendChild(loadingMsg);
      
      const courseReviewsResponse = await fetch(`/api/user/reviews/courses?email=${encodeURIComponent(userEmail)}`);
      if (courseReviewsResponse.ok) {
        courseReviews = await courseReviewsResponse.json();
      } else {
        console.error('Failed to fetch course reviews:', await courseReviewsResponse.text());
        courseReviews = [];
      }
      
      const professorReviewsResponse = await fetch(`/api/user/reviews/professors?email=${encodeURIComponent(userEmail)}`);
      if (professorReviewsResponse.ok) {
        professorReviews = await professorReviewsResponse.json();
      } else {
        console.error('Failed to fetch professor reviews:', await professorReviewsResponse.text());
        professorReviews = [];
      }
      
      allReviews = [...courseReviews, ...professorReviews];
      sortReviewsByDate(allReviews, 'desc');
      displayReviews(allReviews);
    } catch (error) {
      console.error('Error loading reviews:', error);
      reviewsContainer.innerHTML = '<p class="error-message">Failed to load your reviews. Please try again later.</p>';
    }
  }
  
  function displayReviews(reviews) {
    const searchElement = reviewsContainer.querySelector('.search-reviews');
    reviewsContainer.innerHTML = '';
    reviewsContainer.appendChild(searchElement);
    
    if (reviews.length === 0) {
      const noReviewsMsg = document.createElement('div');
      noReviewsMsg.className = 'no-reviews-message';
      noReviewsMsg.textContent = 'You haven\'t written any reviews yet.';
      reviewsContainer.appendChild(noReviewsMsg);
      return;
    }
    
    reviews.forEach(review => {
      const reviewCard = createReviewCard(review);
      reviewsContainer.appendChild(reviewCard);
    });
  }
  
  function createReviewCard(review) {
    const isCourseReview = review.course !== null && review.course !== undefined;
    
    const cardDiv = document.createElement('div');
    cardDiv.className = isCourseReview ? 'course-review-card' : 'professor-review-card';
    cardDiv.dataset.reviewId = review.id;
    
    // Create card HTML content
    const infoDiv = document.createElement('div');
    infoDiv.className = 'review-info';
    
    const titleSection = document.createElement('div');
    titleSection.className = 'title-section';
    
    const titleHeading = document.createElement('h3');
    
    // Handle title based on review type
    if (isCourseReview && review.course) {
        // For course reviews, format is "CS 4400 Computer Systems"
        titleHeading.textContent = `${review.course.code || ''} ${review.course.title || ''}`.trim();
    } else if (!isCourseReview && review.professor) {
        // For professor reviews, format is "Daniel Kopta"
        titleHeading.textContent = `${review.professor.fname || ''} ${review.professor.lname || ''}`.trim();
    } else {
        titleHeading.textContent = "Unknown Review";
    }
    
    titleSection.appendChild(titleHeading);
    infoDiv.appendChild(titleSection);
    
    // Review content
    const reviewPara = document.createElement('p');
    reviewPara.textContent = review.review || 'No written review provided';
    infoDiv.appendChild(reviewPara);
    
    // Rating with stars
    const ratingP = document.createElement('p');
    const ratingLabel = document.createElement('span');
    ratingLabel.className = 'label';
    ratingLabel.textContent = 'Rating: ';
    ratingP.appendChild(ratingLabel);
    
    if (review.rating !== undefined && review.rating !== null) {
        ratingP.appendChild(createRatingStars(review.rating));
    } else {
        ratingP.appendChild(document.createTextNode('Not provided'));
    }
    
    infoDiv.appendChild(ratingP);
    
    // Difficulty with circles
    const difficultyP = document.createElement('p');
    const difficultyLabel = document.createElement('span');
    difficultyLabel.className = 'label';
    difficultyLabel.textContent = 'Difficulty: ';
    difficultyP.appendChild(difficultyLabel);
    
    if (review.difficulty !== undefined && review.difficulty !== null) {
        difficultyP.appendChild(createDifficultyCircles(review.difficulty));
    } else {
        difficultyP.appendChild(document.createTextNode('Not provided'));
    }
    
    infoDiv.appendChild(difficultyP);
    
    // Estimated hours
    const hoursP = document.createElement('p');
    const hoursLabel = document.createElement('span');
    hoursLabel.className = 'label';
    hoursLabel.textContent = 'Estimated Weekly Hours: ';
    hoursP.appendChild(hoursLabel);
    hoursP.appendChild(document.createTextNode(`${review.estimated_hours || 'N/A'} ${review.estimated_hours ? 'hours' : ''}`));
    infoDiv.appendChild(hoursP);
    
    // Professor (for course reviews)
    if (isCourseReview && review.course) {
        const profP = document.createElement('p');
        const profLabel = document.createElement('span');
        profLabel.className = 'label';
        profLabel.textContent = 'Professor: ';
        profP.appendChild(profLabel);
        profP.appendChild(document.createTextNode(review.course.professor_name || 'N/A'));
        infoDiv.appendChild(profP);
    } 
    // Course (for professor reviews)
    else if (!isCourseReview && review.professor) {
        const courseP = document.createElement('p');
        const courseLabel = document.createElement('span');
        courseLabel.className = 'label';
        courseLabel.textContent = 'Course Taught: ';
        courseP.appendChild(courseLabel);
        courseP.appendChild(document.createTextNode(review.professor.course_name || 'N/A'));
        infoDiv.appendChild(courseP);
    }
    
    // Boolean fields with Yes/No answers
    const boolFields = [
        { field: 'would_take_again', label: 'Would take again' },
        { field: 'for_credit', label: 'For Credit' },
        { field: 'mandatory_attendance', label: 'Mandatory Attendance' },
        { field: 'required_course', label: 'Required Course' },
        { field: 'is_gened', label: 'General Education Requirement' }
    ];
    
    boolFields.forEach(({ field, label }) => {
        if (review[field] !== undefined) {
            const boolP = document.createElement('p');
            const boolLabel = document.createElement('span');
            boolLabel.className = 'label';
            boolLabel.textContent = `${label}: `;
            boolP.appendChild(boolLabel);
            boolP.appendChild(document.createTextNode(review[field] ? 'Yes' : 'No'));
            infoDiv.appendChild(boolP);
        }
    });
    
    // Class format
    if (review.in_person !== undefined || review.online !== undefined || review.hybrid !== undefined) {
        const formatP = document.createElement('p');
        const formatLabel = document.createElement('span');
        formatLabel.className = 'label';
        formatLabel.textContent = 'Class Format: ';
        formatP.appendChild(formatLabel);
        
        let formatText = 'Not specified';
        if (review.in_person) formatText = 'In Person';
        else if (review.online) formatText = 'Online';
        else if (review.hybrid) formatText = 'Hybrid';
        
        formatP.appendChild(document.createTextNode(formatText));
        infoDiv.appendChild(formatP);
    }
    
    // Grade
    const gradeP = document.createElement('p');
    const gradeLabel = document.createElement('span');
    gradeLabel.className = 'label';
    gradeLabel.textContent = 'Average Grade: ';
    gradeP.appendChild(gradeLabel);
    gradeP.appendChild(document.createTextNode(review.grade || 'N/A'));
    infoDiv.appendChild(gradeP);
    
    cardDiv.appendChild(infoDiv);
    
    // Edit button
    const editLink = document.createElement('a');
    editLink.href = '#';
    editLink.className = 'buttons edit-review';
    editLink.textContent = 'Edit';
    editLink.dataset.action = 'edit';
    cardDiv.appendChild(editLink);
    
    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'buttons delete-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.dataset.action = 'delete';
    cardDiv.appendChild(deleteBtn);
    
    return cardDiv;
}

// Functions for creating stars and circles
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

  function filterReviews() {
    const filterValue = reviewTypeSelect.value;
    let filteredReviews;
    
    switch (filterValue) {
      case 'course':
        filteredReviews = courseReviews;
        break;
      case 'professor':
        filteredReviews = professorReviews;
        break;
      case 'all':
      default:
        filteredReviews = allReviews;
        break;
    }
    
    const sortOrder = reviewsSort.value === 'newest-oldest' ? 'desc' : 'asc';
    sortReviewsByDate(filteredReviews, sortOrder);
    
    displayReviews(filteredReviews);
  }
  
  function sortReviews() {
    const sortValue = reviewsSort.value;
    const sortOrder = sortValue === 'newest-oldest' ? 'desc' : 'asc';
    
    let reviewsToSort;
    switch (reviewTypeSelect.value) {
      case 'course':
        reviewsToSort = courseReviews;
        break;
      case 'professor':
        reviewsToSort = professorReviews;
        break;
      case 'all':
      default:
        reviewsToSort = allReviews;
        break;
    }
    
    sortReviewsByDate(reviewsToSort, sortOrder);
    displayReviews(reviewsToSort);
  }
  
  function sortReviewsByDate(reviews, order) {
    reviews.sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      
      return order === 'asc' 
        ? dateA - dateB 
        : dateB - dateA;
    });
    
    return reviews;
  }
  
  function handleReviewAction(event) {
    const target = event.target;
    
    if (target.dataset.action === 'edit' || target.dataset.action === 'delete') {
      event.preventDefault();
      
      const reviewCard = target.closest('.course-review-card') || target.closest('.professor-review-card');
      const reviewId = reviewCard.dataset.reviewId;
      
      if (target.dataset.action === 'edit') {
        redirectToEditPage(reviewId, reviewCard.className.includes('course') ? 'course' : 'professor');
      } else if (target.dataset.action === 'delete') {
        confirmAndDeleteReview(reviewId, reviewCard);
      }
    }
  }
  
  function redirectToEditPage(reviewId, reviewType) {
    const baseUrl = window.location.origin;
    
    if (reviewType === 'course') {
        window.location.assign(`/edit-course-review/${reviewId}/`);
    } else {
        window.location.assign(`/edit-professor-review/${reviewId}/`);
    }
}
  
  async function confirmAndDeleteReview(reviewId, reviewCard) {
    const confirmDelete = confirm('Are you sure you want to delete this review? This action cannot be undone.');
    
    if (confirmDelete) {
      try {
        reviewCard.classList.add('deleting');
        
        const response = await fetch('/api/reviews/delete', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken() 
          },
          body: JSON.stringify({ review_id: reviewId })
        });
        
        if (response.ok) {
          allReviews = allReviews.filter(review => review.id.toString() !== reviewId.toString());
          courseReviews = courseReviews.filter(review => review.id.toString() !== reviewId.toString());
          professorReviews = professorReviews.filter(review => review.id.toString() !== reviewId.toString());
          reviewCard.remove();
          showNotification('Review successfully deleted!', 'success');
          
          if (reviewsContainer.querySelectorAll('.course-review-card, .professor-review-card').length === 0) {
            const noReviewsMsg = document.createElement('p');
            noReviewsMsg.className = 'no-reviews-message';
            noReviewsMsg.textContent = 'You haven\'t written any reviews yet.';
            reviewsContainer.appendChild(noReviewsMsg);
          }
        } else {
          const errorData = await response.json();
          showNotification(`Failed to delete review: ${errorData.error || 'Unknown error'}`, 'error');
        }
      } catch (error) {
        console.error('Error deleting review:', error);
        showNotification('Failed to delete review due to a network error. Please try again.', 'error');
      }
    }
  }
  
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        notification.remove();
      }, 500);
    }, 3000);
  }
  
  function getCsrfToken() {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, 10) === 'csrftoken=') {
          cookieValue = decodeURIComponent(cookie.substring(10));
          break;
        }
      }
    }
    return cookieValue;
  }
});