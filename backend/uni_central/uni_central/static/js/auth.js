import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: "AIzaSyD0wF4R9GdY2m7eAwVL_j_mihLit4rRZ5Q",
  authDomain: "unicentral-b6c23.firebaseapp.com",
  projectId: "unicentral-b6c23",
  storageBucket: "unicentral-b6c23.firebasestorage.app",
  messagingSenderId: "554502030441",
  appId: "1:554502030441:web:6dccab580dbcfdb974cef8",
  measurementId: "G-M4L04508RH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Function to handle auth state changes
function handleAuthStateChange() {
  onAuthStateChanged(auth, (user) => {
    const actionsDiv = document.querySelector('.actions');
    const registerLinkAndBtn = document.querySelector('.actions a');
    
    if (user) {
      // User is signed in
      console.log('User is signed in:', user);
      if (registerLinkAndBtn && actionsDiv) {
        const logoutBtn = document.querySelector('.logout-btn');
        if (logoutBtn) {
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
        welcomeText.textContent = `Welcome, ${user.displayName || user.email}`;
        registerLinkAndBtn.replaceWith(welcomeText);
      }
    } else {
      // User is signed out
      console.log('User is signed out');
      const welcomeMessage = document.querySelector('.welcome-message');
      if (welcomeMessage && actionsDiv) {
        const registerLink = document.createElement('a');
        const registerBtn = document.createElement('button');
        registerLink.href = '/signup/';
        registerBtn.className = 'register-btn';
        registerBtn.textContent = 'REGISTER';
        registerLink.appendChild(registerBtn);
        welcomeMessage.replaceWith(registerLink);
        const loginLink = document.createElement('a');
        const loginBtn = document.createElement('button');
        loginBtn.className = 'login-btn';
        logoutBtn.textContent = 'Log In';
        loginLink.href = '/login/';
      }
    }
  });
}

// Initialize auth state handling when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  handleAuthStateChange();
});

export { auth, handleAuthStateChange };