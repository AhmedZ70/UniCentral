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

document.addEventListener("DOMContentLoaded", () => {
  let allClassmates = [];
  let displayedClassmates = [];

  const searchInput = document.querySelector('.search-input');
  const searchBtn = document.querySelector('.search-btn');
  const filterSelect = document.querySelector('.classmate-filter');
  const classmateGrid = document.querySelector('.classmate-grid');


  function displayClassmates(classmates) {
    classmateGrid.innerHTML = "";
    if (classmates.length === 0) {
      classmateGrid.innerHTML = "<p>No classmates found.</p>";
      return;
    }
    classmates.forEach(classmate => {
      const card = document.createElement('div');
      card.className = "classmate-card";
      card.innerHTML = `
        <div class="classmate-avatar">
          <img src="${classmate.profile_picture || '/static/assets/profile_picture.png'}" alt="${classmate.fname} ${classmate.lname}">
        </div>
        <div class="classmate-info">
          <div class="name-container">
            <h3>${classmate.fname} ${classmate.lname}</h3>
            <button class="chat-button" data-id="${classmate.id}">
              <img src="/static/assets/chat_bubble.png" alt="chat" class="chat-bubble">
            </button>
          </div>
          <p>Classes in common: ${classmate.common_classes ? classmate.common_classes.join(', ') : "N/A"}</p>
        </div>
      `;
      card.querySelector('.chat-button').addEventListener('click', () => {
        console.log(`Initiate chat with ${classmate.fname} ${classmate.lname}`);
        // Implement your chat logic or redirection here.
      });
      classmateGrid.appendChild(card);
    });
  }

  function performSearch() {
    const query = searchInput.value.toLowerCase().trim();
    if (query === "") {
      displayedClassmates = [...allClassmates];
    } else {
      displayedClassmates = allClassmates.filter(cm => {
        const fullName = `${cm.fname} ${cm.lname}`.toLowerCase();
        const classes = (cm.common_classes || []).join(' ').toLowerCase();
        return fullName.includes(query) || classes.includes(query);
      });
    }
    sortAndDisplay();
  }

  function sortAndDisplay() {
    const filterValue = filterSelect.value;
    let sorted = [...displayedClassmates];
    if (filterValue === "a-z") {
      sorted.sort((a, b) => {
        const nameA = `${a.fname} ${a.lname}`.toLowerCase();
        const nameB = `${b.fname} ${b.lname}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });
    } else if (filterValue === "newest-oldest") {
      if (sorted.length > 0 && sorted[0].join_date) {
        sorted.sort((a, b) => new Date(b.join_date) - new Date(a.join_date));
      }
    } else if (filterValue === "oldest-newest") {
      if (sorted.length > 0 && sorted[0].join_date) {
        sorted.sort((a, b) => new Date(a.join_date) - new Date(b.join_date));
      } else {
        sorted.reverse();
      }
    }
    displayClassmates(sorted);
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', performSearch);
  }
  if (filterSelect) {
    filterSelect.addEventListener('change', sortAndDisplay);
  }

  onAuthStateChanged(auth, (user) => {
    if (user) {
      const userEmail = user.email;
      fetch(`/api/my_classmates/${encodeURIComponent(userEmail)}/`, {
        headers: {
          'Accept': 'application/json'
        }
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to load classmates (status ${response.status})`);
          }
          return response.json();
        })
        .then(data => {
          allClassmates = data;
          displayedClassmates = [...allClassmates];
          sortAndDisplay();
        })
        .catch(error => {
          console.error("Error fetching classmates:", error);
          classmateGrid.innerHTML = "<p>Error loading classmates. Please try again later.</p>";
        });
    } else {
      // Redirect to login if no user is authenticated
      window.location.href = '/login/';
    }
  });
});
