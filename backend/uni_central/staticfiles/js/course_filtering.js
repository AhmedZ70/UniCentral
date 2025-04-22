document.addEventListener('DOMContentLoaded', function() {
  updateFilterFormHTML();
  
  const filterForm = document.getElementById('filter-form');
  filterForm.addEventListener('submit', function(e) {
    e.preventDefault();
    performSearch();
  });
});

async function performSearch() {
  const filters = {
    department: document.getElementById('department-input')?.value.trim(),
    title: document.getElementById('course-title-input')?.value.trim(),
    min_number: document.getElementById('min-course-number-input')?.value,
    max_number: document.getElementById('max-course-number-input')?.value,
    professor: document.getElementById('professor-input')?.value.trim(),
    credits: document.getElementById('credits-input')?.value,
    min_rating: document.getElementById('min-rating-input')?.value,
    max_rating: document.getElementById('max-rating-input')?.value,
    min_difficulty: document.getElementById('min-difficulty-input')?.value,
    max_difficulty: document.getElementById('max-difficulty-input')?.value
  };

  Object.keys(filters).forEach(key => {
    if (!filters[key]) {
      delete filters[key];
    }
  });

  try {
    const queryString = new URLSearchParams(filters).toString();
    const response = await fetch(`/api/filter-courses/?${queryString}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
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
  const flooredDifficulty = Math.floor(parseFloat(difficulty) || 0);
  const maxCircles = 6;
  let circlesHTML = '';

  for (let i = 1; i <= maxCircles; i++) {
    if (i <= flooredDifficulty) {
      let colorClass = '';
      if (i <= 2) {
        colorClass = 'green';
      } else if (i <= 4) {
        colorClass = 'yellow';
      } else {
        colorClass = 'red';
      }
      circlesHTML += `<span class="difficulty-circle filled ${colorClass}"></span>`;
    } else {
      circlesHTML += `<span class="difficulty-circle"></span>`;
    }
  }

  return circlesHTML;
}

function updateFilterFormHTML() {
  const filterForm = document.getElementById('filter-form');
  
  const minRatingInput = document.getElementById('min-rating-input');
  const maxRatingInput = document.getElementById('max-rating-input');
  const minDifficultyInput = document.getElementById('min-difficulty-input');
  const maxDifficultyInput = document.getElementById('max-difficulty-input');
  
  const ratingContainer = document.createElement('div');
  ratingContainer.className = 'rating-selector-container';
  ratingContainer.innerHTML = `
    <div class="selector-label">Rating Range:</div>
    <div class="selector-group">
      <div class="min-selector">
        <div class="selector-title">Min:</div>
        <div id="min-rating-stars" class="interactive-stars" data-value="0">
          <span class="star" data-value="1">★</span>
          <span class="star" data-value="2">★</span>
          <span class="star" data-value="3">★</span>
          <span class="star" data-value="4">★</span>
          <span class="star" data-value="5">★</span>
        </div>
        <input type="hidden" id="min-rating-input" name="min_rating" value="">
      </div>
      <div class="max-selector">
        <div class="selector-title">Max:</div>
        <div id="max-rating-stars" class="interactive-stars" data-value="5">
          <span class="star filled" data-value="1">★</span>
          <span class="star filled" data-value="2">★</span>
          <span class="star filled" data-value="3">★</span>
          <span class="star filled" data-value="4">★</span>
          <span class="star filled" data-value="5">★</span>
        </div>
        <input type="hidden" id="max-rating-input" name="max_rating" value="5">
      </div>
    </div>
  `;
  
  const difficultyContainer = document.createElement('div');
  difficultyContainer.className = 'difficulty-selector-container';
  difficultyContainer.innerHTML = `
    <div class="selector-label">Difficulty Range:</div>
    <div class="selector-group">
      <div class="min-selector">
        <div class="selector-title">Min:</div>
        <div id="min-difficulty-circles" class="interactive-difficulty" data-value="0">
          <span class="difficulty-circle" data-value="1"></span>
          <span class="difficulty-circle" data-value="2"></span>
          <span class="difficulty-circle" data-value="3"></span>
          <span class="difficulty-circle" data-value="4"></span>
          <span class="difficulty-circle" data-value="5"></span>
          <span class="difficulty-circle" data-value="6"></span>
        </div>
        <input type="hidden" id="min-difficulty-input" name="min_difficulty" value="">
      </div>
      <div class="max-selector">
        <div class="selector-title">Max:</div>
        <div id="max-difficulty-circles" class="interactive-difficulty" data-value="6">
          <span class="difficulty-circle filled green" data-value="1"></span>
          <span class="difficulty-circle filled green" data-value="2"></span>
          <span class="difficulty-circle filled yellow" data-value="3"></span>
          <span class="difficulty-circle filled yellow" data-value="4"></span>
          <span class="difficulty-circle filled red" data-value="5"></span>
          <span class="difficulty-circle filled red" data-value="6"></span>
        </div>
        <input type="hidden" id="max-difficulty-input" name="max_difficulty" value="6">
      </div>
    </div>
  `;
  
  if (minRatingInput) minRatingInput.parentNode.removeChild(minRatingInput);
  if (maxRatingInput) maxRatingInput.parentNode.removeChild(maxRatingInput);
  if (minDifficultyInput) minDifficultyInput.parentNode.removeChild(minDifficultyInput);
  if (maxDifficultyInput) maxDifficultyInput.parentNode.removeChild(maxDifficultyInput);
  
  const searchButton = document.querySelector('.search-button');
  filterForm.insertBefore(ratingContainer, searchButton);
  filterForm.insertBefore(difficultyContainer, searchButton);
  
  setupInteractiveSelectors();
}

function setupInteractiveSelectors() {
  setupStarSelector('min-rating-stars', 'min-rating-input');
  setupStarSelector('max-rating-stars', 'max-rating-input');
  
  setupDifficultySelector('min-difficulty-circles', 'min-difficulty-input');
  setupDifficultySelector('max-difficulty-circles', 'max-difficulty-input');
}

function setupStarSelector(selectorId, inputId) {
  const container = document.getElementById(selectorId);
  if (!container) {
    console.error(`Element with ID ${selectorId} not found`);
    return;
  }
  
  const stars = container.querySelectorAll('.star');
  const hiddenInput = document.getElementById(inputId);
  
  if (!hiddenInput) {
    console.error(`Hidden input with ID ${inputId} not found`);
    return;
  }
  
  stars.forEach(star => {
    star.addEventListener('click', () => {
      const value = parseInt(star.getAttribute('data-value'));
      container.setAttribute('data-value', value);
      hiddenInput.value = value;
      
      stars.forEach(s => {
        const starValue = parseInt(s.getAttribute('data-value'));
        if (starValue <= value) {
          s.classList.add('filled');
        } else {
          s.classList.remove('filled');
        }
      });
      
      if (selectorId === 'min-rating-stars') {
        const maxContainer = document.getElementById('max-rating-stars');
        const maxValue = parseInt(maxContainer.getAttribute('data-value'));
        
        if (value > maxValue) {
          const maxStars = maxContainer.querySelectorAll('.star');
          maxStars.forEach(s => {
            const starValue = parseInt(s.getAttribute('data-value'));
            if (starValue <= value) {
              s.classList.add('filled');
            } else {
              s.classList.remove('filled');
            }
          });
          maxContainer.setAttribute('data-value', value);
          document.getElementById('max-rating-input').value = value;
        }
      } else if (selectorId === 'max-rating-stars') {
        const minContainer = document.getElementById('min-rating-stars');
        const minValue = parseInt(minContainer.getAttribute('data-value'));
        
        if (value < minValue) {
          const minStars = minContainer.querySelectorAll('.star');
          minStars.forEach(s => {
            const starValue = parseInt(s.getAttribute('data-value'));
            if (starValue <= value) {
              s.classList.add('filled');
            } else {
              s.classList.remove('filled');
            }
          });
          minContainer.setAttribute('data-value', value);
          document.getElementById('min-rating-input').value = value;
        }
      }
    });
    
    star.addEventListener('mouseenter', () => {
      const value = parseInt(star.getAttribute('data-value'));
      stars.forEach(s => {
        const starValue = parseInt(s.getAttribute('data-value'));
        if (starValue <= value) {
          s.classList.add('hover');
        }
      });
    });
    
    star.addEventListener('mouseleave', () => {
      stars.forEach(s => {
        s.classList.remove('hover');
      });
    });
  });
}

function setupDifficultySelector(selectorId, inputId) {
  const container = document.getElementById(selectorId);
  if (!container) {
    console.error(`Element with ID ${selectorId} not found`);
    return;
  }
  
  const circles = container.querySelectorAll('.difficulty-circle');
  const hiddenInput = document.getElementById(inputId);
  
  if (!hiddenInput) {
    console.error(`Hidden input with ID ${inputId} not found`);
    return;
  }
  
  circles.forEach(circle => {
    circle.addEventListener('click', () => {
      const value = parseInt(circle.getAttribute('data-value'));
      container.setAttribute('data-value', value);
      hiddenInput.value = value;
      
      circles.forEach(c => {
        const circleValue = parseInt(c.getAttribute('data-value'));
        c.classList.remove('filled', 'green', 'yellow', 'red');
        
        if (circleValue <= value) {
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
      
      if (selectorId === 'min-difficulty-circles') {
        const maxContainer = document.getElementById('max-difficulty-circles');
        const maxValue = parseInt(maxContainer.getAttribute('data-value'));
        
        if (value > maxValue) {
          const maxCircles = maxContainer.querySelectorAll('.difficulty-circle');
          maxCircles.forEach(c => {
            const circleValue = parseInt(c.getAttribute('data-value'));
            c.classList.remove('filled', 'green', 'yellow', 'red');
            
            if (circleValue <= value) {
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
          maxContainer.setAttribute('data-value', value);
          document.getElementById('max-difficulty-input').value = value;
        }
      } else if (selectorId === 'max-difficulty-circles') {
        const minContainer = document.getElementById('min-difficulty-circles');
        const minValue = parseInt(minContainer.getAttribute('data-value'));
        
        if (value < minValue) {
          const minCircles = minContainer.querySelectorAll('.difficulty-circle');
          minCircles.forEach(c => {
            const circleValue = parseInt(c.getAttribute('data-value'));
            c.classList.remove('filled', 'green', 'yellow', 'red');
            
            if (circleValue <= value) {
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
          minContainer.setAttribute('data-value', value);
          document.getElementById('min-difficulty-input').value = value;
        }
      }
    });
    
    circle.addEventListener('mouseenter', () => {
      const value = parseInt(circle.getAttribute('data-value'));
      circles.forEach(c => {
        const circleValue = parseInt(c.getAttribute('data-value'));
        if (circleValue <= value) {
          c.classList.add('hover');
        }
      });
    });
    
    circle.addEventListener('mouseleave', () => {
      circles.forEach(c => {
        c.classList.remove('hover');
      });
    });
  });
}