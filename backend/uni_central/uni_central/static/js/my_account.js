import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { updateUserPassword, logoutUser } from './auth.js';

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
let userEmail = null;
let isEditing = false;

document.addEventListener("DOMContentLoaded", () => {
    const editButton = document.getElementById('edit-button');
    const passwordModal = document.getElementById('password-modal');
    const updatePasswordBtn = document.querySelector('.update-password');
    const confirmPasswordBtn = document.getElementById('confirm-password-change');
    const cancelPasswordBtn = document.getElementById('cancel-password-change');
    const passwordError = document.getElementById('password-error');
    
    if (updatePasswordBtn) {
        updatePasswordBtn.addEventListener('click', () => {
            passwordModal.style.display = 'block';
            passwordError.style.display = 'none';
            document.getElementById('new-password').value = '';
            document.getElementById('confirm-password').value = '';
        });
    }

    if (cancelPasswordBtn) {
        cancelPasswordBtn.addEventListener('click', () => {
            passwordModal.style.display = 'none';
        });
    }

    if (confirmPasswordBtn) {
        confirmPasswordBtn.addEventListener('click', () => {
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
    
            if (newPassword !== confirmPassword) {
                passwordError.textContent = 'Passwords do not match';
                passwordError.style.display = 'block';
                return;
            }
    
            if (newPassword.length < 6) {
                passwordError.textContent = 'Password must be at least 6 characters';
                passwordError.style.display = 'block';
                return;
            }
    
            updateUserPassword(newPassword)
                .then((result) => {
                    passwordModal.style.display = 'none';
                    showAlert(result.message + '!<br><br>You will need to log in again with your new password to confirm changes.');
                    
                    document.getElementById('alertClose').onclick = function() {
                        document.getElementById('alertBox').style.display = 'none';
                        logoutUser();
                    };
                })
                .catch((error) => {
                    passwordError.textContent = error.message;
                    passwordError.style.display = 'block';
                    console.error('Error updating password:', error);
                    
                    if (error.message.includes('log out')) {
                        if (confirm('You need to log in again to change your password. Would you like to log out now?')) {
                            logoutUser();
                        }
                    }
                });
        });
    }
    
    onAuthStateChanged(auth, (user) => {
        if (user) {
            const email = document.getElementById('user-email');
            const fNameDisplay = document.getElementById('fNameDisplay');
            const lNameDisplay = document.getElementById('lNameDisplay');
            const universityDisplay = document.getElementById('universityDisplay');
            const majorDisplay = document.getElementById('majorDisplay');
            const gradYearDisplay = document.getElementById('yearDisplay');

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
                    gradYearDisplay.textContent = data.year || '';

                    document.getElementById('university').value = data.university || '';
                    document.getElementById('major').value = data.major || '';
                    document.getElementById('year').value = data.year || '';
                    console.log("Raw API response:", data); 
                    console.log("Fetching user data: fname: ", data.fname, " lname: ", data.lname, " university", data.university, "major: ", data.major, " year: ", data.year);
                })
                .catch((error) => {
                    console.error("Error fetching user data:", error);
                });
        }
    });

    editButton.addEventListener('click', function() {
        isEditing = !isEditing;
        
        if (isEditing) {
            editButton.textContent = 'Save Changes';
            editButton.classList.add('save-changes');
            
            document.getElementById('university').style.display = 'inline-block';
            document.getElementById('major').style.display = 'inline-block';
            document.getElementById('year').style.display = 'inline-block';
            
            document.getElementById('universityDisplay').style.display = 'none';
            document.getElementById('majorDisplay').style.display = 'none';
            document.getElementById('yearDisplay').style.display = 'none';
        } else {
            editButton.textContent = 'Edit Profile';
            editButton.classList.remove('save-changes');
            
            document.getElementById('universityDisplay').textContent = document.getElementById('university').value;
            document.getElementById('majorDisplay').textContent = document.getElementById('major').value;
            document.getElementById('yearDisplay').textContent = document.getElementById('year').value;
            
            document.getElementById('university').style.display = 'none';
            document.getElementById('major').style.display = 'none';
            document.getElementById('year').style.display = 'none';
            
            document.getElementById('universityDisplay').style.display = 'inline';
            document.getElementById('majorDisplay').style.display = 'inline';
            document.getElementById('yearDisplay').style.display = 'inline';
            
            saveChanges(auth.currentUser.email);
        }
    });
});

function showAlert(message, isSuccess = true) {
    const alertBox = document.getElementById('alertBox');
    const alertMessage = document.getElementById('alertMessage');
    const alertContent = document.querySelector('.alert-content');

    alertMessage.innerHTML = message;

    alertContent.classList.remove('success', 'error');
    alertContent.classList.add(isSuccess ? 'success' : 'error');

    alertBox.style.display = 'flex';

    document.getElementById('alertClose').onclick = function() {
        alertBox.style.display = 'none';
    };
}

function saveChanges(email) {
    const userData = {
        email_address: email,
        university: document.getElementById('university').value,
        major: document.getElementById('major').value,
        year: document.getElementById('year').value
    };

    console.log('Sending data:', userData);

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
                console.error('Server error details:', errorData);
                throw new Error(errorData.message || `Failed to update user data (status ${response.status})`);
            }).catch(jsonError => {
                throw new Error(`Failed to update user data (status ${response.status})`);
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Success:', data);
        showAlert('Profile updated successfully!');
        
        document.getElementById('universityDisplay').textContent = userData.university;
        document.getElementById('majorDisplay').textContent = userData.major;
        document.getElementById('yearDisplay').textContent = userData.year;
    })
    .catch((error) => {
        console.error('Error details:', error);
        showAlert('Failed to update profile. Please try again.');
    });
}