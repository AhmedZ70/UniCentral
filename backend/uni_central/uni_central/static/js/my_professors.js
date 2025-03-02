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
  let myProfessors = [];
  const professorCardsContainer = document.querySelector('.professor-cards-container');
  const noProfessorsAddedMessage = document.getElementById('no-professors-added-message');
  const noProfessorsMatchSearchMessage = document.getElementById('no-professors-match-search-message');
  const sortBy = document.getElementById('sort-by');
  const searchInput = document.getElementById('search-input');

  // Initialize the page with authentication check
  onAuthStateChanged(auth, (user) => {
    if (user) {
      const emailAddress = user.email;
      console.log("User is signed in with email:", emailAddress);
      fetchMyProfessors(emailAddress);
    } else {
      console.log("No user signed in, redirecting to login");
      window.location.href = '/login/';
    }
  });

  // Fetch the user's added professors
  async function fetchMyProfessors(emailAddress) {
    try {
      const response = await fetch(`/api/my_professors/${encodeURIComponent(emailAddress)}/`);
      if (!response.ok) {
        throw new Error(`Failed to fetch professors (status ${response.status})`);
      }
      const data = await response.json();
      myProfessors = data;
      displayProfessors(myProfessors);
    } catch (error) {
      console.error("Error fetching professors:", error);
      noProfessorsAddedMessage.style.display = "block";
      noProfessorsMatchSearchMessage.style.display = "none";    }
  }

  // Display professors in the UI with clickable cards
  function displayProfessors(professors) {
    professorCardsContainer.innerHTML = ''; // Clear existing cards

    if (professors.length === 0) {
      if (searchInput.value.trim() === '') {
        // No professors added at all
        noProfessorsAddedMessage.style.display = "block";
        noProfessorsMatchSearchMessage.style.display = "none";
      } else {
        // No professors match the search
        noProfessorsAddedMessage.style.display = "none";
        noProfessorsMatchSearchMessage.style.display = "block";
      }
      return;
    }

    noProfessorsAddedMessage.style.display = "none";
    noProfessorsMatchSearchMessage.style.display = "none";    professors.forEach((professor) => {
      // Create an anchor element for the clickable professor card
      const cardLink = document.createElement('a');
      cardLink.href = `/professors/${professor.id}/`; // Link to professor details page
      cardLink.className = 'professor-card';
      cardLink.style.textDecoration = 'none';
      cardLink.style.color = 'inherit';

      // Populate the card content
      cardLink.innerHTML = `
        <div class="professor-info">
          <h3>${professor.fname} ${professor.lname}</h3>
          <p><strong>Department:</strong> ${professor.department?.name || "N/A"}</p>
          <div class="rating-container">
            <p><strong>Average Rating:</strong></p>
            <div class="rating-stars">${createRatingStars(professor.avg_rating)}</div>
          </div>
          <div class="difficulty-container">
            <p><strong>Average Difficulty:</strong></p>
            <div class="difficulty-rating">${createDifficultyCircles(professor.avg_difficulty)}</div>
          </div>
        </div>
        <div class="professor-actions">
          <button class="remove-professor-btn" data-professor-id="${professor.id}">Remove</button>
        </div>
      `;

      professorCardsContainer.appendChild(cardLink);
    });

    // Add event listeners to "Remove" buttons
    document.querySelectorAll('.remove-professor-btn').forEach((button) => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent the click from bubbling to the anchor element
        const professorId = button.getAttribute('data-professor-id');
        removeProfessor(professorId);
      });
    });
  }

  // Remove a professor from the user's list
  async function removeProfessor(professorId) {
    const emailAddress = auth.currentUser.email;
    try {
      const response = await fetch(`/api/professors/${professorId}/reviews/remove/`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_address: emailAddress }),
      });
      const data = await response.json();
      if (data.message) {
        alert(data.message);
        fetchMyProfessors(emailAddress); // Refresh the list
      } else if (data.error) {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error removing professor:", error);
    }
  }

  // Sort professors
  sortBy.addEventListener('change', () => {
    const sortType = sortBy.value;
    let sortedProfessors = [...myProfessors];

    switch (sortType) {
      case 'name-asc':
        sortedProfessors.sort((a, b) => `${a.fname} ${a.lname}`.localeCompare(`${b.fname} ${b.lname}`));
        break;
      case 'name-desc':
        sortedProfessors.sort((a, b) => `${b.fname} ${b.lname}`.localeCompare(`${a.fname} ${a.lname}`));
        break;
      case 'rating-asc':
        sortedProfessors.sort((a, b) => (a.avg_rating || 0) - (b.avg_rating || 0));
        break;
      case 'rating-desc':
        sortedProfessors.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
        break;
    }

    displayProfessors(sortedProfessors);
  });

  // Search functionality
  searchInput.addEventListener('input', () => {
    const searchQuery = searchInput.value.trim().toLowerCase();
    const filteredProfessors = myProfessors.filter((professor) => {
      const fullName = `${professor.fname} ${professor.lname}`.toLowerCase();
      return fullName.includes(searchQuery);
    });
    displayProfessors(filteredProfessors);
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