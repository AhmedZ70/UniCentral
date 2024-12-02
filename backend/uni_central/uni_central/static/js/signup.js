import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
    getAuth, 
    createUserWithEmailAndPassword,
    updateProfile 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

// Firebase configuration
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

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded'); // Debug log

    // Initialize Lucide icons
    lucide.createIcons();

    // Get form elements
    const form = document.getElementById('signup-form');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('re-enter-password');
    const togglePassword = document.getElementById('toggle-password');
    const toggleConfirmPassword = document.getElementById('toggle-confirm-password');
    const passwordError = document.getElementById('password-error');

    // Check if all elements exist
    if (!form || !passwordInput || !confirmPasswordInput || !togglePassword || !toggleConfirmPassword) {
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

    // Add click listeners for password toggles
    togglePassword.addEventListener('click', () => {
    togglePasswordVisibility(passwordInput, togglePassword);
    });

    toggleConfirmPassword.addEventListener('click', () => {
    togglePasswordVisibility(confirmPasswordInput, toggleConfirmPassword);
    });

    // Check if passwords match
    function checkPasswords() {
    if (passwordInput.value !== confirmPasswordInput.value) {
        passwordError.style.display = 'block';
        return false;
    }
    passwordError.style.display = 'none';
    return true;
    }

    // Add input listener for password confirmation
    confirmPasswordInput.addEventListener('input', checkPasswords);

    // Handle form submission
    form.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Form submitted'); // Debug log

    if (!checkPasswords()) {
        return;
    }

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const name = document.getElementById('name').value;
    const signupError = document.getElementById('signup-error');

    console.log('Attempting to create user with:', { email, name }); // Debug log

    try {
        // Create user with email and password
        console.log('Calling createUserWithEmailAndPassword');
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('User credential received:', userCredential);
        
        const user = userCredential.user;
        console.log('User created:', user.uid);

        // Update user profile with name
        console.log('Updating user profile with name');
        await updateProfile(user, {
        displayName: name
        });
        console.log('Profile updated successfully');

        // Store additional user data in Firebase
        console.log('User signed up successfully!');
        
        // Verification Email (optional)
        // await sendEmailVerification(user);
        // console.log('Verification email sent');
        
        // Redirect to home page after successful signup
        alert('Account created successfully! Please check your email for verification.');
        window.location.href = '/'; 

    } catch (error) {
        console.error('Detailed error:', error); // More detailed error logging
        // Handle specific error cases
        switch (error.code) {
        case 'auth/email-already-in-use':
            signupError.textContent = 'This email is already registered. Please use a different email or sign in.';
            break;
        case 'auth/invalid-email':
            signupError.textContent = 'Please enter a valid email address.';
            break;
        case 'auth/operation-not-allowed':
            signupError.textContent = 'Email/password accounts are not enabled. Please contact support.';
            break;
        case 'auth/weak-password':
            signupError.textContent = 'Please choose a stronger password (at least 6 characters).';
            break;
        default:
            signupError.textContent = `An error occurred during signup: ${error.message}`;
        }
        signupError.style.display = 'block';
    }
    });
});