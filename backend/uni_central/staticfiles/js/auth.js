import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

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

    if (user) {
      console.log('User is signed in:', user);
      if (registerLinkAndBtn && actionsDiv) {
        if (logoutBtn) {
          logoutBtn
          logoutBtn.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default link behavior
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
        if (currentUrl == "http://127.0.0.1:8000/courses/") {
          welcomeText.textContent = `${user.displayName}`;
        }
        else {
          welcomeText.textContent = `Welcome, ${user.displayName}`;
        }
        registerLinkAndBtn.replaceWith(welcomeText);
      }
    } else {
      const loginLink = document.createElement('a');
      const loginBtn = document.querySelector('.logout-btn');
      // User is signed out
      console.log('User is signed out');
      // Initial home page state
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

// Initialize auth state handling when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  handleAuthStateChange();
});

export { auth, handleAuthStateChange };
