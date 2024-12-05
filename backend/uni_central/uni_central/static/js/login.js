import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
    getAuth, 
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

// Firebase configuration
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded'); // Debug log

    // Initialize Lucide icons
    lucide.createIcons();

    // Get form elements
    const form = document.getElementById('login-form');
    console.log('Login form found:', form); // Debug if form is found
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('toggle-password');
    const googleLoginBtn = document.getElementById('google-login');

    // Check if all elements exist
    if (!form || !passwordInput || !togglePassword) {
    console.error('One or more elements not found');
    return;
    }

    // Password visibility toggle function
    function togglePasswordVisibility(inputField, button) {
    const type = inputField.type === 'password' ? 'text' : 'password';
    inputField.type = type;
    
    const icon = button.querySelector('i');
    if (icon) {
        icon.dataset.lucide = type === 'password' ? 'eye' : 'eye-off';
        lucide.createIcons();
    }
    }

    // Add click listener for password toggle
    togglePassword.addEventListener('click', () => {
    togglePasswordVisibility(passwordInput, togglePassword);
    });

    // Handle Google Sign In
    googleLoginBtn.addEventListener('click', async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        console.log('Google sign in successful:', result.user);
        window.location.href = '/'; // Changed path
    } catch (error) {
        console.error('Google sign in error:', error);
        const loginError = document.getElementById('login-error');
        loginError.textContent = 'Google sign in failed. Please try again.';
        loginError.style.display = 'block';
    }
    });

    // Handle form submission
    form.addEventListener('submit', async (e) => {
    console.log('Form submit triggered'); // Debug log
    e.preventDefault();
    console.log('Login form submitted'); // Debug log

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginError = document.getElementById('login-error');
    const loginButton = document.querySelector('.login-btn');

    // Disable button while processing
    loginButton.disabled = true;
    loginButton.textContent = 'Logging in...';

    try {
        console.log('Attempting to sign in with:', email);
        // Sign in with email and password
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('User logged in successfully!', user);
        
        // Redirect to home page after successful login
        window.location.href = '/'; // Changed path
    } catch (error) {
        console.error('Login error:', error);
        // Handle specific error cases
        switch (error.code) {
        case 'auth/invalid-email':
            loginError.textContent = 'Please enter a valid email address.';
            break;
        case 'auth/user-disabled':
            loginError.textContent = 'This account has been disabled.';
            break;
        case 'auth/user-not-found':
            loginError.textContent = 'No account found with this email.';
            break;
        case 'auth/wrong-password':
            loginError.textContent = 'Incorrect password.';
            break;
        default:
            loginError.textContent = 'Login failed. Please try again.';
        }
        loginError.style.display = 'block';
    } finally {
        // Re-enable button
        loginButton.disabled = false;
        loginButton.textContent = 'LOG IN ➜';
    }
    });

    // Handle forgot password
    const forgotPasswordLink = document.querySelector('.forgot-password');
    forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    if (!email) {
        const loginError = document.getElementById('login-error');
        loginError.textContent = 'Please enter your email address to reset password.';
        loginError.style.display = 'block';
        return;
    }
    // TODO: Implement password reset functionality
    console.log('Password reset requested for:', email);
    });
}); 