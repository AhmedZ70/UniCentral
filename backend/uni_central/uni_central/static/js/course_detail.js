// Import the auth object and onAuthStateChanged from auth.js
import { auth, onAuthStateChanged } from './auth.js';

document.addEventListener("DOMContentLoaded", () => {
    // 1. Grab the course_id from a hidden <input> in the template
    const courseIdInput = document.getElementById("courseId");
    if (!courseIdInput) {
        console.error("No #courseId element found in the DOM!");
        return;
    }
    const courseId = courseIdInput.value;

    // 2. Get references to DOM elements we want to populate
    const courseTitleEl = document.getElementById("course-title");
    const courseDetailsEl = document.getElementById("course-details");
    const reviewsListEl = document.getElementById("reviews-list");
    const noReviewsMsgEl = document.getElementById("no-reviews-message");
    const enrollBtn = document.getElementById("enroll-btn");

    // 3. Fetch course + reviews data from your Django REST API
    fetch(`/api/courses/${courseId}/reviews/`)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Failed to load course data (status ${response.status})`);
            }
            return response.json(); // data = { course: {...}, reviews: [...] }
        })
        .then((data) => {
            // 4. Populate course info
            const course = data.course || {};
            courseTitleEl.textContent = course.title || "Untitled Course";

            // Populate rating stars
            const ratingContainer = document.getElementById("course-rating");
            ratingContainer.appendChild(createRatingStars(course.avg_rating));

            // Populate difficulty circles
            const difficultyContainer = document.getElementById("course-difficulty");
            difficultyContainer.appendChild(createDifficultyCircles(course.avg_difficulty));

            // Populate other course details
            document.getElementById("course-subject").textContent = course.subject || "N/A";
            document.getElementById("course-credits").textContent = course.credits || "N/A";
            document.getElementById("course-semester").textContent = course.semester || "Not specified";
            document.getElementById("course-grade").textContent = course.grade || "N/A";

            // 5. Populate reviews list
            const reviews = data.reviews || [];
            if (reviews.length === 0) {
                noReviewsMsgEl.style.display = "block";
            } else {
                noReviewsMsgEl.style.display = "none";
                reviewsListEl.innerHTML = ""; // clear any existing content

                reviews.forEach((review) => {
                    const li = document.createElement("li");
                    li.classList.add("review-item");

                    li.innerHTML = `
                        <div class="review-header">
                            <strong>Review by: anonymous</strong>
                            <span>Grade: ${review.grade || "Not provided"}</span>
                        </div>
                        <div class="review-content">
                            <p><span class="detail-label">Review:</span> ${review.review || ""}</p>
                            <p><span class="detail-label">Rating:</span> 
                               <span class="rating">${review.rating || 0}/5</span></p>
                            <p><span class="detail-label">Difficulty:</span> 
                               <span class="difficulty">${review.difficulty || 0}/6</span></p>
                            <p><span class="detail-label">Estimated Weekly Hours:</span> 
                               ${review.estimated_hours || "N/A"}</p>
                            <p><span class="detail-label">Professor:</span> 
                               ${
                                   review.professor
                                       ? review.professor.fname + " " + review.professor.lname
                                       : "Not specified"
                               }
                            </p>
                            <p><span class="detail-label">Would Take Again:</span>
                               ${review.would_take_again ? "Yes" : "No"}</p>
                            <p><span class="detail-label">For Credit:</span>
                               ${review.for_credit ? "Yes" : "No"}</p>
                            <p><span class="detail-label">Mandatory Attendance:</span>
                               ${review.mandatory_attendance ? "Yes" : "No"}</p>
                            <p><span class="detail-label">Required Course:</span>
                               ${review.required_course ? "Yes" : "No"}</p>
                            <p><span class="detail-label">General Education Requirement:</span>
                               ${review.is_gened ? "Yes" : "No"}</p>
                            <p><span class="detail-label">Class Format:</span>
                               ${review.in_person ? "In Person " : ""}
                               ${review.online ? "Online " : ""}
                               ${review.hybrid ? "Hybrid" : ""}</p>
                            <p><span class="detail-label">Other Notes:</span>
                               ${review.no_exams ? "No Exams" : ""}
                               ${review.presentations ? " Presentations" : ""}</p>
                        </div>
                    `;

                    reviewsListEl.appendChild(li);
                });
            }
        })
        .catch((error) => {
            console.error("Error fetching course data:", error);
            courseTitleEl.textContent = "Error Loading Course";
        });

    // 6. Handle Enroll/Unenroll Button
    if (enrollBtn) {
        // Use onAuthStateChanged to track the user's authentication state
        onAuthStateChanged(auth, (user) => {
            if (user) {
                // User is signed in
                const emailAddress = user.email;

                // Check if the user is already enrolled
                fetch(`/api/my_courses/${emailAddress}/`)
                    .then((response) => response.json())
                    .then((data) => {
                        const isEnrolled = data.some((course) => course.id === parseInt(courseId));
                        if (isEnrolled) {
                            enrollBtn.textContent = "Unenroll";
                        } else {
                            enrollBtn.textContent = "Enroll";
                        }
                    })
                    .catch((error) => console.error("Error checking enrollment:", error));

                // Handle enroll/unenroll button click
                enrollBtn.addEventListener("click", () => {
                    const isEnrolled = enrollBtn.textContent === "Unenroll";
                    const url = isEnrolled
                        ? `/api/courses/${courseId}/reviews/un_enroll/`
                        : `/api/courses/${courseId}/reviews/enroll/`;

                    fetch(url, {
                        method: isEnrolled ? "DELETE" : "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ email_address: emailAddress }),
                    })
                        .then((response) => response.json())
                        .then((data) => {
                            if (data.message) {
                                alert(data.message);
                                // Toggle button text
                                enrollBtn.textContent = isEnrolled ? "Enroll" : "Unenroll";
                            } else if (data.error) {
                                alert(data.error);
                            }
                        })
                        .catch((error) => console.error("Error:", error));
                });
            } else {
                // User is signed out
                enrollBtn.textContent = "Login to Enroll";
                enrollBtn.disabled = true;
            }
        });
    }
});

// Function to create rating stars
function createRatingStars(rating) {
    const maxStars = 5;
    const filledStars = Math.round(rating); // Round to the nearest whole number
    const starsContainer = document.createElement('div');
    starsContainer.className = 'rating-stars';

    for (let i = 1; i <= maxStars; i++) {
        const star = document.createElement('span');
        star.className = i <= filledStars ? 'star filled' : 'star';
        star.innerHTML = '★'; // Unicode star character
        starsContainer.appendChild(star);
    }

    return starsContainer;
}

// Function to create difficulty circles
function createDifficultyCircles(difficulty) {
    const maxCircles = 6;
    const filledCircles = Math.round(difficulty); // Round to the nearest whole number
    const circlesContainer = document.createElement('div');
    circlesContainer.className = 'difficulty-rating';

    for (let i = 1; i <= maxCircles; i++) {
        const circle = document.createElement('div');
        circle.className = 'difficulty-circle';

        if (i <= filledCircles) {
            circle.classList.add('filled');

            // Add color based on difficulty level
            if (i <= 2) {
                circle.classList.add('green');
            } else if (i <= 4) {
                circle.classList.add('yellow');
            } else {
                circle.classList.add('red');
            }
        }

        circlesContainer.appendChild(circle);
    }

    return circlesContainer;
}