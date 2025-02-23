import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

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
    
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Get DOM elements to populate
            const email = document.getElementById('user-email');
            const fNameDisplay = document.getElementById('fNameDisplay');
            const lNameDisplay = document.getElementById('lNameDisplay');
            const universityDisplay = document.getElementById('universityDisplay');
            const majorDisplay = document.getElementById('majorDisplay');
            const yearDisplay = document.getElementById('yearDisplay');

            // Display email right away since we have it from Firebase
            email.textContent = user.email;

            // Fetch user details from your API
            fetch(`/api/users/${user.email}/details/`)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`Failed to load user data (status ${response.status})`);
                    }
                    return response.json();
                })
                .then((data) => {
                    // Populate display elements
                    fNameDisplay.textContent = data.fname || '';
                    lNameDisplay.textContent = data.lname || '';
                    universityDisplay.textContent = data.university || '';
                    majorDisplay.textContent = data.major || '';
                    yearDisplay.textContent = data.year || '';

                    // Also populate input fields (hidden by default)
                    document.getElementById('fName').value = data.fname || '';
                    document.getElementById('lName').value = data.lname || '';
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
            // Switch to edit mode
            editButton.textContent = 'Save Changes';
            editButton.classList.add('save-changes');
            
            // Show input fields, hide display text
            document.getElementById('fName').style.display = 'inline-block';
            document.getElementById('lName').style.display = 'inline-block';
            document.getElementById('university').style.display = 'inline-block';
            document.getElementById('major').style.display = 'inline-block';
            document.getElementById('year').style.display = 'inline-block';
            
            document.getElementById('fNameDisplay').style.display = 'none';
            document.getElementById('lNameDisplay').style.display = 'none';
            document.getElementById('universityDisplay').style.display = 'none';
            document.getElementById('majorDisplay').style.display = 'none';
            document.getElementById('yearDisplay').style.display = 'none';
        } else {
            // Switch back to display mode
            editButton.textContent = 'Edit Profile';
            editButton.classList.remove('save-changes');
            
            // Update display text with new values
            document.getElementById('fNameDisplay').textContent = document.getElementById('fName').value;
            document.getElementById('lNameDisplay').textContent = document.getElementById('lName').value;
            document.getElementById('universityDisplay').textContent = document.getElementById('university').value;
            document.getElementById('majorDisplay').textContent = document.getElementById('major').value;
            document.getElementById('yearDisplay').textContent = document.getElementById('year').value;
            
            // Show display text, hide input fields
            document.getElementById('fName').style.display = 'none';
            document.getElementById('lName').style.display = 'none';
            document.getElementById('university').style.display = 'none';
            document.getElementById('major').style.display = 'none';
            document.getElementById('year').style.display = 'none';
            
            document.getElementById('fNameDisplay').style.display = 'inline';
            document.getElementById('lNameDisplay').style.display = 'inline';
            document.getElementById('universityDisplay').style.display = 'inline';
            document.getElementById('majorDisplay').style.display = 'inline';
            document.getElementById('yearDisplay').style.display = 'inline';
            
            // Save changes to backend
            saveChanges(auth.currentUser.email);
        }
    });
});

function saveChanges(email) {
    const userData = {
        email: email,
        fname: document.getElementById('fName').value,
        lname: document.getElementById('lName').value,
        university: document.getElementById('university').value,
        major: document.getElementById('major').value,
        year: document.getElementById('year').value
    };

    fetch('/api/users/update/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}