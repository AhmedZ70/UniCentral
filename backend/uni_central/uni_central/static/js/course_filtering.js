document.addEventListener('DOMContentLoaded', function() {
    const filterForm = document.getElementById('filter-form');
    
    // Submit the form on Enter (or button click)
    filterForm.addEventListener('submit', function(e) {
      e.preventDefault();
      performSearch();
    });
  });
  
  async function performSearch() {
    // Gather values from filter inputs (semester removed)
    const filters = {
      department: document.getElementById('department-input').value.trim(),
      title: document.getElementById('course-title-input').value.trim(),
      min_number: document.getElementById('min-course-number-input').value,
      max_number: document.getElementById('max-course-number-input').value,
      professor: document.getElementById('professor-input').value.trim(),
      credits: document.getElementById('credits-input').value,
      min_rating: document.getElementById('min-rating-input').value,
      max_rating: document.getElementById('max-rating-input').value,
      min_difficulty: document.getElementById('min-difficulty-input').value,
      max_difficulty: document.getElementById('max-difficulty-input').value
    };
  
    // Remove empty or falsey values
    Object.keys(filters).forEach(key => {
      if (!filters[key]) {
        delete filters[key];
      }
    });
  
    try {
      // Build query string and send GET request to API
      const queryString = new URLSearchParams(filters).toString();
      const response = await fetch(`/api/filter-courses/?${queryString}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      displayResults(data);
    } catch (error) {
      console.error('Error:', error);
      displayError('An error occurred while searching for courses.');
    }
  }
  
  function displayResults(courses) {
    const resultsContainer = document.querySelector('.course-cards');
    resultsContainer.innerHTML = '';
  
    if (!courses || courses.length === 0) {
      document.getElementById('no-courses-message').style.display = "block";
      return;
    }
    document.getElementById('no-courses-message').style.display = "none";
  
    courses.forEach(course => {
      // Create clickable card linking to course details page
      const cardLink = document.createElement('a');
      cardLink.href = `/courses/${course.id}/`;
      cardLink.className = 'course-card';
  
      cardLink.innerHTML = `
        <div class="course-info">
          <h3>${course.subject} ${course.number}: ${course.title}</h3>
          <p><strong>Department:</strong> ${course.department ? course.department.name : "N/A"}</p>
          <div class="rating-container">
            <p><strong>Average Rating:</strong></p>
            <div class="rating-stars">${createRatingStars(course.avg_rating)}</div>
          </div>
          <div class="difficulty-container">
            <p><strong>Average Difficulty:</strong></p>
            <div class="difficulty-rating">${createDifficultyCircles(course.avg_difficulty)}</div>
          </div>
          <p><strong>Credits:</strong> ${course.credits || "N/A"}</p>
        </div>
      `;
      resultsContainer.appendChild(cardLink);
    });
  }
  
  function displayError(message) {
    const resultsContainer = document.querySelector('.course-cards');
    resultsContainer.innerHTML = `
      <div class="error-message">
        <p>${message}</p>
      </div>
    `;
  }
  
  // Functions for rendering rating stars and difficulty circles
  
  function createRatingStars(rating) {
    const maxStars = 5;
    let starsHTML = '';
  
    for (let i = 1; i <= maxStars; i++) {
      if (i <= rating) {
        starsHTML += '<span class="star filled">★</span>';
      } else if (i - 1 < rating && rating < i) {
        const percentage = (rating - (i - 1)) * 100;
        starsHTML += `
          <span class="star partial" style="position: relative;">
            <span class="star filled" style="position: absolute; width: ${percentage}%; overflow: hidden;">★</span>
            <span class="star">★</span>
          </span>
        `;
      } else {
        starsHTML += '<span class="star">★</span>';
      }
    }
    return starsHTML;
  }
  
  function createDifficultyCircles(difficulty) {
    const maxCircles = 6;
    let circlesHTML = '';
  
    for (let i = 1; i <= maxCircles; i++) {
      if (i <= difficulty) {
        let colorClass = '';
        if (i <= 2) {
          colorClass = 'green';
        } else if (i <= 4) {
          colorClass = 'yellow';
        } else {
          colorClass = 'red';
        }
        circlesHTML += `<span class="difficulty-circle filled ${colorClass}"></span>`;
      } else if (i - 1 < difficulty && difficulty < i) {
        const percentage = (difficulty - (i - 1)) * 100;
        let colorClass = '';
        if (i <= 2) {
          colorClass = 'green';
        } else if (i <= 4) {
          colorClass = 'yellow';
        } else {
          colorClass = 'red';
        }
        circlesHTML += `
          <span class="difficulty-circle partial" style="--percentage: ${percentage}%; --color: ${colorClass};"></span>
        `;
      } else {
        circlesHTML += '<span class="difficulty-circle"></span>';
      }
    }
    return circlesHTML;
  }
  