import { auth, onAuthStateChanged } from './auth.js';

document.addEventListener("DOMContentLoaded", () => {
    // Get professor ID from the hidden input
    const professorId = document.getElementById("professorId").value;

    // DOM elements to populate
    const professorNameEl = document.getElementById("professor-name");
    const professorDetailsEl = document.getElementById("professor-details");
    const reviewsListEl = document.getElementById("reviews-list");
    const noReviewsMsgEl = document.getElementById("no-reviews-message");
    const addProfessorBtn = document.getElementById("add-professor-btn");

    // Fetch professor details, reviews, and courses taught
    fetch(`/api/professors/${professorId}/reviews/`)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Failed to load professor data (status ${response.status})`);
            }
            return response.json();
        })
        .then((data) => {
            // Populate professor info
            const professor = data.professor || {};
            professorNameEl.className = 'professor-title';
            professorNameEl.textContent = `${professor.fname} ${professor.lname}`;

            // Create a container for professor details
            const detailsContainer = document.createElement('div');
            detailsContainer.innerHTML = `
                <p><span class="detail-label">Department:</strong> ${professor.department?.name || "N/A"}</p>
            `;

            // Add rating stars
            const ratingContainer = document.createElement('p');
            ratingContainer.innerHTML = `<span class="detail-label">Average Rating:</span> `;
            ratingContainer.appendChild(createRatingStars(professor.avg_rating));
            detailsContainer.appendChild(ratingContainer);

            // Add difficulty circles
            const difficultyContainer = document.createElement('p');
            difficultyContainer.innerHTML = `<span class="detail-label">Average Difficulty:</span> `;
            difficultyContainer.appendChild(createDifficultyCircles(professor.avg_difficulty));
            detailsContainer.appendChild(difficultyContainer);

            // Append the details container to the professor details section
            professorDetailsEl.appendChild(detailsContainer);

            // Add bold "Courses taught" heading
            const coursesHeading = document.createElement("p");
            coursesHeading.innerHTML = `<span class="detail-label">Courses taught:</span>`;
            professorDetailsEl.appendChild(coursesHeading);

            // Populate courses taught
            const courses = data.courses_taught || [];
            const coursesTaughtList = document.createElement("ul");
            coursesTaughtList.classList.add("courses-taught-list");

            if (courses.length > 0) {
                // Instead of creating a ul/li list, create individual p elements
                courses.forEach((course) => {
                    const courseItem = document.createElement("p");
                    courseItem.style.marginTop = "5px";
                    courseItem.style.marginBottom = "5px";
                    courseItem.innerHTML = `• ${course.title} (${course.subject} ${course.number})`;
                    professorDetailsEl.appendChild(courseItem);
                });
            } else {
                const noCoursesMsg = document.createElement("p");
                noCoursesMsg.textContent = "No courses taught found.";
                professorDetailsEl.appendChild(noCoursesMsg);
            }
            professorDetailsEl.appendChild(coursesTaughtList);

            // Populate reviews
            const reviews = data.reviews || [];
            if (reviews.length === 0) {
                noReviewsMsgEl.style.display = "block";
            } else {
                noReviewsMsgEl.style.display = "none";
                reviews.forEach((review) => {
                    const li = document.createElement("li");
                    li.classList.add("review-item");

                    li.innerHTML = `
                        <div class="review-header">
                            <strong>Review by: anonymous</strong>
                            <span>Grade: ${review.grade || "N/A"}</span>
                        </div>
                        <div class="review-content">
                            <p><span class="detail-label">Review:</span> ${review.review || "No comments provided."}</p>
                            <div><span class="detail-label">Rating:</span> 
                            <span class="rating-container" style="display: inline-block; vertical-align: middle; margin-left: 5px;"></span>
                            </div>
                            <div><span class="detail-label">Difficulty:</span> 
                                <span class="difficulty-container" style="display: inline-block; vertical-align: middle; margin-left: 5px;"></span>
                            </div>
                            <p><span class="detail-label">Estimated Weekly Hours:</span> ${review.estimated_hours || "N/A"}</p>
                            <p><span class="detail-label">Course:</span> ${review.course?.title || "N/A"} (${review.course?.subject || ""} ${review.course?.number || ""})</p>
                            <p><span class="detail-label">Would Take Again:</span> ${review.would_take_again ? "Yes" : "No"}</p>
                            <p><span class="detail-label">For Credit:</span> ${review.for_credit ? "Yes" : "No"}</p>
                            <p><span class="detail-label">Mandatory Attendance:</span> ${review.mandatory_attendance ? "Yes" : "No"}</p>
                            <p><span class="detail-label">Class Format:</span> 
                                ${review.in_person ? "In Person " : ""}
                                ${review.online ? "Online " : ""}
                                ${review.hybrid ? "Hybrid" : ""}
                            </p>
                            <p><span class="detail-label">Other Notes:</span> 
                                ${review.no_exams ? "No Exams " : ""}
                                ${review.presentations ? "Presentations" : ""}
                            </p>
                        </div>
                    `;

                    reviewsListEl.appendChild(li);

                    const ratingContainer = li.querySelector('.rating-container');
                    ratingContainer.appendChild(createRatingStars(review.rating || 0));
                    const difficultyContainer = li.querySelector('.difficulty-container');
                    difficultyContainer.appendChild(createDifficultyCircles(review.difficulty || 0));
                });
            }
        })
        .catch((error) => {
            console.error("Error fetching professor data:", error);
            professorNameEl.textContent = "Error Loading Professor Details";
        });

    // Handle "Add Professor" button
    if (addProfessorBtn) {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                const emailAddress = user.email;

                // Check if the professor is already added
                fetch(`/api/my_professors/${emailAddress}/`)
                    .then((response) => response.json())
                    .then((data) => {
                        const isAdded = data.some((prof) => prof.id === parseInt(professorId));
                        if (isAdded) {
                            addProfessorBtn.textContent = "Remove Professor";
                        } else {
                            addProfessorBtn.textContent = "Add Professor";
                        }
                    });

                // Handle button click
                addProfessorBtn.addEventListener("click", () => {
                    const isAdded = addProfessorBtn.textContent === "Remove Professor";
                    const url = isAdded
                        ? `/api/professors/${professorId}/reviews/remove/`
                        : `/api/professors/${professorId}/reviews/add/`;

                    fetch(url, {
                        method: isAdded ? "DELETE" : "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email_address: emailAddress }),
                    })
                        .then((response) => response.json())
                        .then((data) => {
                            if (data.message) {
                                alert(data.message);
                                addProfessorBtn.textContent = isAdded ? "Add Professor" : "Remove Professor";
                            } else if (data.error) {
                                alert(data.error);
                            }
                        });
                });
            } else {
                // User is signed out
                addProfessorBtn.textContent = "Login to Add Professor";
                addProfessorBtn.disabled = true;
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