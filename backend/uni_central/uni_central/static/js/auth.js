import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut, updatePassword } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

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
const currentUrl = window.location.href;

// Function to handle auth state changes
function handleAuthStateChange() {
  onAuthStateChanged(auth, (user) => {
    const actionsDiv = document.querySelector('.actions');
    const registerLinkAndBtn = document.querySelector('.actions a');
    const welcomeMessage = document.querySelector('.welcome-message');
    const logoutBtn = document.querySelector('.logout-btn');
    const urlPath = window.location.pathname;

    if (user) {
      // User is signed in
      console.log(`User logged in with email: ${user.email}`); // Log user email
      if (registerLinkAndBtn && actionsDiv) {
        if (logoutBtn) {
          logoutBtn.addEventListener('click', (event) => {
            event.preventDefault(); 
            signOut(auth)
              .then(() => {
                console.log('User signed out successfully');
              })
              .catch((error) => {
                console.error('Error signing out:', error);
              });
          });
        }
        const welcomeText = document.createElement('div');
        welcomeText.className = 'welcome-message';
        if (urlPath === '/') {
          welcomeText.textContent = `Welcome, ${user.displayName}`;
        } else {
          welcomeText.textContent = `${user.displayName}`;
        }
        registerLinkAndBtn.replaceWith(welcomeText);
      }
    } else {
      console.log("User logged out"); // Log user logout
      const loginLink = document.createElement('a');
      const loginBtn = document.querySelector('.logout-btn');
      if (!welcomeMessage && actionsDiv) {
        loginLink.href = '/login/';
        loginBtn.className = 'login-btn';
        loginBtn.textContent = 'Log In';
        loginBtn.addEventListener('click', () => {
          window.location.href = '/login/';
        });
        actionsDiv.appendChild(loginLink);
      }

      if (welcomeMessage && actionsDiv) {
        const registerLink = document.createElement('a');
        const registerBtn = document.createElement('button');
        registerLink.href = '/signup/';
        registerBtn.className = 'register-btn';
        registerBtn.textContent = 'REGISTER';
        registerLink.appendChild(registerBtn);
        welcomeMessage.replaceWith(registerLink);

        loginLink.href = '/login/';
        loginBtn.className = 'login-btn';
        loginBtn.textContent = 'Log In';
        loginBtn.addEventListener('click', () => {
          window.location.href = '/login/';
        });
        actionsDiv.appendChild(loginLink);
      }
    }
  });
}

export function logoutUser() {
  return signOut(auth).then(() => {
      window.location.href = '/login/';
  });
}

export function updateUserPassword(newPassword) {
  const currentUser = auth.currentUser;  // Changed variable name to avoid conflict
  
  if (!currentUser) {
      return Promise.reject(new Error('No user is currently signed in'));
  }

  return updatePassword(currentUser, newPassword)
      .then(() => {
          return { success: true, message: 'Password updated successfully' };
      })
      .catch((error) => {
          if (error.code === 'auth/requires-recent-login') {
              throw new Error('Please log out and log back in to change your password');
          }
          throw error;
      });
}

// Function to handle the "Leave a Review" button behavior
function handleLeaveReviewButton() {
  const leaveReviewBtn = document.getElementById('leave-review-btn');
  if (!leaveReviewBtn) {
    console.warn("Leave Review button not found.");
    return;
  }

  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('User is signed in:', user);
      // Redirect to the review form for the current course
      const courseId = window.location.pathname.split('/')[2]; // Extract course ID from URL
      leaveReviewBtn.href = `/courses/${courseId}/review/`;
      leaveReviewBtn.textContent = 'Leave a Review';
    } else {
      console.log('User is signed out');
      // Redirect to the signup page
      leaveReviewBtn.href = '/signup/';
      leaveReviewBtn.textContent = 'Sign Up to Leave a Review';
    }
  });
}

// Initialize auth state handling and "Leave a Review" button handling when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  handleAuthStateChange();
  handleLeaveReviewButton();
});

export { auth, onAuthStateChanged, handleAuthStateChange, handleLeaveReviewButton };