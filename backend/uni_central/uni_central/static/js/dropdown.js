import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { logoutUser } from './auth.js';

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
  const dropdownMenu = document.querySelector('.dropdown-menu');
  const dropdownMenuBtn = document.querySelector('.dropdown-menu-btn');
  const registerBtn = document.querySelector('.register-btn');
  const logoutBtn = document.querySelector('.logout-btn');
  const accountLinks = document.querySelectorAll('.dropdown-menu-content .icons a');
  
  dropdownMenuBtn.addEventListener('click', () => {
    dropdownMenu.classList.toggle('active');
  });
  
  window.addEventListener('click', (event) => {
    if (!event.target.matches('.dropdown-menu-btn') && !event.target.matches('.dropdown-menu-content *')) {
      if (dropdownMenu.classList.contains('active')) {
        dropdownMenu.classList.remove('active');
      }
    }
  });
  
  // Check authentication status
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('User is signed in:', user.email);
      
      // Update logout button
      if (logoutBtn) {
        logoutBtn.textContent = 'Log Out';
        const newLogoutBtn = logoutBtn.cloneNode(true);
        logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
        
        newLogoutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          logoutUser(); 
        });
      }
      
      if (logoutBtn) logoutBtn.style.display = 'block';
      
      if (registerBtn) registerBtn.style.display = 'none';
      
      accountLinks.forEach(link => {
        link.classList.remove('disabled-link');
        link.parentElement.classList.remove('disabled-icon');
        
        const newLink = link.cloneNode(true);
        link.parentNode.replaceChild(newLink, link);
      });
      
    } else {
      console.log('User is signed out');
      
      // Update logout button to be a login button
      if (logoutBtn) {
        logoutBtn.textContent = 'Log In';
        const newLoginBtn = logoutBtn.cloneNode(true);
        logoutBtn.parentNode.replaceChild(newLoginBtn, logoutBtn);
        
        newLoginBtn.addEventListener('click', (e) => {
          e.preventDefault();
          window.location.href = '/login/';
        });
      }
      
      if (registerBtn) registerBtn.style.display = 'block';
      
      // Disable account links
      accountLinks.forEach(link => {
        link.classList.add('disabled-link');
        link.parentElement.classList.add('disabled-icon');
        
        const newLink = link.cloneNode(true);
        link.parentNode.replaceChild(newLink, link);
        
        newLink.addEventListener('click', function(e) {
          e.preventDefault();
          alert('Please log in to access this feature');
          window.location.href = '/login/';
        });
      });
    }
  });
});