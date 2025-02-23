import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { updateUserPassword } from './auth.js';

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

// Initialize Firebase only once
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
let userEmail = null;
let isEditing = false;

document.addEventListener("DOMContentLoaded", () => {
    const editButton = document.getElementById('edit-button');
    const passwordModal = document.getElementById('password-modal');
    const updatePasswordBtn = document.querySelector('.update-password');
    const confirmPasswordBtn = document.getElementById('confirm-password-change');
    const cancelPasswordBtn = document.getElementById('cancel-password-change');
    const passwordError = document.getElementById('password-error');
    
    onAuthStateChanged(auth, (user) => {
        if (user) {
            const email = document.getElementById('user-email');
            const fNameDisplay = document.getElementById('fNameDisplay');
            const lNameDisplay = document.getElementById('lNameDisplay');
            const universityDisplay = document.getElementById('universityDisplay');
            const majorDisplay = document.getElementById('majorDisplay');
            const yearDisplay = document.getElementById('yearDisplay');

            email.textContent = user.email;

            fetch(`/api/users/${user.email}/details/`)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`Failed to load user data (status ${response.status})`);
                    }
                    return response.json();
                })
                .then((data) => {
                    fNameDisplay.textContent = data.fname || '';
                    lNameDisplay.textContent = data.lname || '';
                    universityDisplay.textContent = data.university || '';
                    majorDisplay.textContent = data.major || '';
                    yearDisplay.textContent = data.year || '';

                    // Also populate input fields (hidden by default)
                    document.getElementById('university').value = data.university || '';
                    document.getElementById('major').value = data.major || '';
                    document.getElementById('year').value = data.year || '';
                })
                .catch((error) => {
                    console.error("Error fetching user data:", error);
                });
        }
    });

    // Edit button functionality
    editButton.addEventListener('click', function() {
        isEditing = !isEditing;
        
        if (isEditing) {
            editButton.textContent = 'Save Changes';
            editButton.classList.add('save-changes');
            
            // document.getElementById('fName').style.display = 'inline-block';
            // document.getElementById('lName').style.display = 'inline-block';
            document.getElementById('university').style.display = 'inline-block';
            document.getElementById('major').style.display = 'inline-block';
            document.getElementById('year').style.display = 'inline-block';
            
            // document.getElementById('fNameDisplay').style.display = 'none';
            // document.getElementById('lNameDisplay').style.display = 'none';
            document.getElementById('universityDisplay').style.display = 'none';
            document.getElementById('majorDisplay').style.display = 'none';
            document.getElementById('yearDisplay').style.display = 'none';
        } else {
            editButton.textContent = 'Edit Profile';
            editButton.classList.remove('save-changes');
            
            // document.getElementById('fNameDisplay').textContent = document.getElementById('fName').value;
            // document.getElementById('lNameDisplay').textContent = document.getElementById('lName').value;
            document.getElementById('universityDisplay').textContent = document.getElementById('university').value;
            document.getElementById('majorDisplay').textContent = document.getElementById('major').value;
            document.getElementById('yearDisplay').textContent = document.getElementById('year').value;
            
            // document.getElementById('fName').style.display = 'none';
            // document.getElementById('lName').style.display = 'none';
            document.getElementById('university').style.display = 'none';
            document.getElementById('major').style.display = 'none';
            document.getElementById('year').style.display = 'none';
            
            // document.getElementById('fNameDisplay').style.display = 'inline';
            // document.getElementById('lNameDisplay').style.display = 'inline';
            document.getElementById('universityDisplay').style.display = 'inline';
            document.getElementById('majorDisplay').style.display = 'inline';
            document.getElementById('yearDisplay').style.display = 'inline';
            
            saveChanges(auth.currentUser.email);
        }
    });

    confirmPasswordBtn.addEventListener('click', () => {
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
    
        // Validate passwords match
        if (newPassword !== confirmPassword) {
            passwordError.textContent = 'Passwords do not match';
            passwordError.style.display = 'block';
            return;
        }
    
        // Validate password length
        if (newPassword.length < 6) {
            passwordError.textContent = 'Password must be at least 6 characters';
            passwordError.style.display = 'block';
            return;
        }
    
        // Update password using the imported function
        updateUserPassword(newPassword)
            .then((result) => {
                passwordModal.style.display = 'none';
                alert(result.message);
            })
            .catch((error) => {
                passwordError.textContent = error.message;
                passwordError.style.display = 'block';
                console.error('Error updating password:', error);
            });
    });
});

function saveChanges(email) {
    const userData = {
        email_address: email,
        university: document.getElementById('university').value,
        major: document.getElementById('major').value,
        year: document.getElementById('year').value
    };

    console.log('Sending data:', userData); // Debug log

    fetch('/api/users/details/edit-details', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errorData => {
                console.error('Server error details:', errorData); // Debug log
                throw new Error(errorData.message || `Failed to update user data (status ${response.status})`);
            }).catch(jsonError => {
                throw new Error(`Failed to update user data (status ${response.status})`);
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Success:', data);
        alert('Profile updated successfully!');
        
        // Refresh the display
        document.getElementById('universityDisplay').textContent = userData.university;
        document.getElementById('majorDisplay').textContent = userData.major;
        document.getElementById('yearDisplay').textContent = userData.year;
    })
    .catch((error) => {
        console.error('Error details:', error);
        alert('Failed to update profile. Please try again.');
    });
}