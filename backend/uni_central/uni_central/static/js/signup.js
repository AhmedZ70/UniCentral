import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
    getAuth, 
    createUserWithEmailAndPassword,
    updateProfile,
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

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded'); // Debug log

    lucide.createIcons();

    const form = document.getElementById('signup-form');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('re-enter-password');
    const togglePassword = document.getElementById('toggle-password');
    const toggleConfirmPassword = document.getElementById('toggle-confirm-password');
    const passwordError = document.getElementById('password-error');    

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

    togglePassword.addEventListener('click', () => {
    togglePasswordVisibility(passwordInput, togglePassword);
    });

    toggleConfirmPassword.addEventListener('click', () => {
    togglePasswordVisibility(confirmPasswordInput, toggleConfirmPassword);
    });

    // Check if passwords match
    function checkPasswords() {
        if (passwordInput.value.length > 0) {
            if (passwordInput.value !== confirmPasswordInput.value) {
                passwordError.style.display = 'block';
                return false;
            }
            passwordError.style.display = 'none';
            return true;
        }
        passwordError.style.display = 'none';
        return true;
    }

    passwordInput.addEventListener('input', checkPasswords);
    confirmPasswordInput.addEventListener('input', checkPasswords);

    confirmPasswordInput.addEventListener('input', checkPasswords);

    form.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Form submitted'); 

    if (!checkPasswords()) {
        return;
    }

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const fname = document.getElementById('fname').value;
    const lname = document.getElementById('lname').value;
    const fullName = fname + ' ' + lname;
    const signupError = document.getElementById('signup-error');

    console.log('Attempting to create user with:', { email, fullName }); 

    try {
        console.log('Calling createUserWithEmailAndPassword');
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('User credential received:', userCredential);
        
        const user = userCredential.user;
        console.log('User created:', user.uid);

        console.log('Updating user profile with name');
        await updateProfile(user, {
            displayName: fullName
        });
        console.log('Profile updated successfully');

        console.log('User signed up successfully!');
        
        alert('Account created successfully!');
        window.location.href = '/'; 

        fetch('/api/create_user/', {
            method: 'POST', 
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                fname: fname,
                lname: lname
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === "User created successfully.") {
            console.log("User created:", data);
            sessionStorage.setItem('userEmail', email);
            console.log("User email stored in sessionStorage: " + email);
            } else {
            console.log("Error:", data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });

    } catch (error) {
        console.error('Detailed error:', error); 
        switch (error.code) {
        case 'auth/email-already-in-use':
            signupError.textContent = 'This email is already registered. Use a different email or sign in.';
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