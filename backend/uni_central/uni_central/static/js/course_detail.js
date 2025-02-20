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

            courseDetailsEl.innerHTML = `
                <p><span class="detail-label">Subject:</span>
                   ${course.subject || "N/A"} ${course.number || ""}</p>
                <p><span class="detail-label">Credits:</span>
                   ${course.credits || "N/A"}</p>
                <p><span class="detail-label">Semester:</span>
                   ${course.semester || "Not specified"}</p>
                <p><span class="detail-label">Average Rating:</span>
                   <span class="rating">${(course.avg_rating || 0).toFixed(1)}</span></p>
                <p><span class="detail-label">Average Difficulty:</span>
                   <span class="difficulty">${(course.avg_difficulty || 0).toFixed(1)}</span></p>
            `;

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