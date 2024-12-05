import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
    getAuth, 
    createUserWithEmailAndPassword,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup 
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

    lucide.createIcons();

    const form = document.getElementById('signup-form');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('re-enter-password');
    const togglePassword = document.getElementById('toggle-password');
    const toggleConfirmPassword = document.getElementById('toggle-confirm-password');
    const passwordError = document.getElementById('password-error');    
    const googleSignUpBtn = document.getElementById('google-signup');

    if (googleSignUpBtn) {
        console.log('Google sign up button found'); // Debug log
        
        googleSignUpBtn.addEventListener('click', async () => {
            console.log('Google sign up button clicked'); // Debug log
            
            const originalText = googleSignUpBtn.textContent;
            
            try {
                // Disable button and show loading state
                googleSignUpBtn.disabled = true;
                googleSignUpBtn.textContent = 'Signing in...';
                
                const result = await signInWithPopup(auth, provider);
                const user = result.user;
                console.log('Google sign in successful:', user);
                
                alert('Successfully signed in with Google!');
                window.location.href = '/';
                
            } catch (error) {
                console.error('Google sign in error:', error);
                const signupError = document.getElementById('signup-error');
                
                switch (error.code) {
                    case 'auth/popup-blocked':
                        signupError.textContent = 'Please allow popups for this website';
                        break;
                    case 'auth/popup-closed-by-user':
                        signupError.textContent = 'Sign in was cancelled';
                        break;
                    case 'auth/account-exists-with-different-credential':
                        signupError.textContent = 'An account already exists with this email';
                        break;
                    default:
                        signupError.textContent = 'Error signing in with Google. Please try again.';
                }
                signupError.style.display = 'block';
            } finally {
                // Reset button state
                googleSignUpBtn.disabled = false;
                googleSignUpBtn.textContent = originalText;
            }
        });
    } else {
        console.error('Google sign up button not found'); // Debug log
    }

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
        // Only check and show error if the first password field has content
        if (passwordInput.value.length > 0) {
            if (passwordInput.value !== confirmPasswordInput.value) {
                passwordError.style.display = 'block';
                return false;
            }
            passwordError.style.display = 'none';
            return true;
        }
        // If first password is empty, hide error and return true
        passwordError.style.display = 'none';
        return true;
    }

    // Add input listeners for both password fields
    passwordInput.addEventListener('input', checkPasswords);
    confirmPasswordInput.addEventListener('input', checkPasswords);

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