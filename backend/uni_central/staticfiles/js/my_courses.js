import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: "AIzaSyD0wF4R9GdY2m7eAwVL_j_mihLit4rRZ5Q",
  authDomain: "unicentral-b6c23.firebaseapp.com",
  projectId: "unicentral-b6c23",
  storageBucket: "unicentral-b6c23.appspot.com",
  messagingSenderId: "554502030441",
  appId: "1:554502030441:web:6dccab580dbcfdb974cef8",
  measurementId: "G-M4L04508RH",
  clientId: "554502030441-g68f3tti18fiip1hpr6ehn6q6u5sn8fh.apps.googleusercontent.com"
};

// Initialize Firebase only if it hasn't been initialized already
let app;
const apps = getApps();
if (!apps.length) {
  app = initializeApp(firebaseConfig);
} else {
  app = apps[0]; // Use the existing app
}

const auth = getAuth(app);

document.addEventListener("DOMContentLoaded", () => {
  let myCourses = [];
  const courseCardsContainer = document.querySelector('.course-cards');
  const noCoursesAddedMessage = document.getElementById('no-courses-added-message');
  const noCoursesMatchSearchMessage = document.getElementById('no-courses-match-search-message');
  const sortBy = document.getElementById('sort-by');
  const searchInput = document.getElementById('search-input');

  // Initialize the page with authentication check
  onAuthStateChanged(auth, (user) => {
    if (user) {
      const emailAddress = user.email;
      console.log("User is signed in with email:", emailAddress);
      fetchMyCourses(emailAddress);
    } else {
      console.log("No user signed in, redirecting to login");
      window.location.href = '/login/';
    }
  });

  // Fetch the user's added courses
  async function fetchMyCourses(emailAddress) {
    try {
      const response = await fetch(`/api/my_courses/${encodeURIComponent(emailAddress)}/`);
      if (!response.ok) {
        throw new Error(`Failed to fetch courses (status ${response.status})`);
      }
      const data = await response.json();
      myCourses = data;
      displayCourses(myCourses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      noCoursesAddedMessage.style.display = "block";
      noCoursesMatchSearchMessage.style.display = "none";
    }
  }

  function displayCourses(courses) {
    courseCardsContainer.innerHTML = ''; 

    if (courses.length === 0) {
      if (searchInput.value.trim() === '') {
        noCoursesAddedMessage.style.display = "block";
        noCoursesMatchSearchMessage.style.display = "none";
      } else {
          // No professors match the search
          noCoursesAddedMessage.style.display = "none";
          noCoursesMatchSearchMessage.style.display = "block";
      }
      return;
    }

    noCoursesAddedMessage.style.display = "none";
    noCoursesMatchSearchMessage.style.display = "none";    
    
    courses.forEach((course) => {
      // Create an anchor element for the clickable course card
      const cardLink = document.createElement('a');
      cardLink.href = `/courses/${course.id}/`; // Link to course details page
      cardLink.className = 'course-card';
      cardLink.style.textDecoration = 'none';
      cardLink.style.color = 'inherit';

      // Populate the card content
      cardLink.innerHTML = `
        <div class="course-info">
          <h3>${course.subject} ${course.number}: ${course.title}</h3>
          <p><strong>Department:</strong> ${course.department?.name || "N/A"}</p>
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
        <div class="course-actions">
          <button class="remove-course-btn" data-course-id="${course.id}">Unenroll</button>
        </div>
      `;

      courseCardsContainer.appendChild(cardLink);
    });

    // Add event listeners to "Remove" buttons
    document.querySelectorAll('.remove-course-btn').forEach((button) => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent the click from bubbling to the anchor element
        const courseId = button.getAttribute('data-course-id');
        removeCourse(courseId);
      });
    });
  }

  // Remove a course from the user's list
  async function removeCourse(courseId) {
    const emailAddress = auth.currentUser.email;
    
    try {
      const response = await fetch(`/api/courses/${courseId}/reviews/un_enroll/`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_address: emailAddress }),
      });
      const data = await response.json();
      if (data.message) {
        alert(data.message);
        fetchMyCourses(emailAddress); // Refresh the list
      } else if (data.error) {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error removing course:", error);
    }
  }

  // Sort courses
  sortBy.addEventListener('change', () => {
    const sortType = sortBy.value;
    let sortedCourses = [...myCourses];

    switch (sortType) {
      case 'name-asc':
        sortedCourses.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'name-desc':
        sortedCourses.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'rating-asc':
        sortedCourses.sort((a, b) => (a.avg_rating || 0) - (b.avg_rating || 0));
        break;
      case 'rating-desc':
        sortedCourses.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
        break;
    }

    displayCourses(sortedCourses);
  });

  // Search functionality
  searchInput.addEventListener('input', () => {
    const searchQuery = searchInput.value.trim().toLowerCase();
    const filteredCourses = myCourses.filter((course) => {
      const courseName = course.title.toLowerCase();
      return courseName.includes(searchQuery);
    });
    displayCourses(filteredCourses);
  });

  /**
   * Create rating stars HTML with fractional support
   */
  function createRatingStars(rating) {
    const maxStars = 5;
    let starsHTML = '';

    for (let i = 1; i <= maxStars; i++) {
      if (i <= rating) {
        // Full star
        starsHTML += '<span class="star filled">★</span>';
      } else if (i - 1 < rating && rating < i) {
        // Partial star
        const percentage = (rating - (i - 1)) * 100;
        starsHTML += `
          <span class="star partial" style="position: relative;">
            <span class="star filled" style="position: absolute; width: ${percentage}%; overflow: hidden;">★</span>
            <span class="star">★</span>
          </span>
        `;
      } else {
        // Empty star
        starsHTML += '<span class="star">★</span>';
      }
    }
    return starsHTML;
  }

  /**
   * Create difficulty circles HTML with fractional support
   */
  function createDifficultyCircles(difficulty) {
    // Convert to a number and floor it (no partial circles)
    const flooredDifficulty = Math.floor(parseFloat(difficulty) || 0);
    const maxCircles = 6;
    let circlesHTML = '';
  
    for (let i = 1; i <= maxCircles; i++) {
      if (i <= flooredDifficulty) {
        // Determine color based on circle index
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
        // Empty circle
        circlesHTML += `<span class="difficulty-circle"></span>`;
      }
    }
  
    return circlesHTML;
  }
  
});