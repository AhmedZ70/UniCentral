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
            professorNameEl.textContent = `${professor.fname} ${professor.lname}`;

            // Create a container for professor details
            const detailsContainer = document.createElement('div');
            detailsContainer.innerHTML = `
                <p><strong>Department:</strong> ${professor.department?.name || "N/A"}</p>
            `;

            // Add rating stars
            const ratingContainer = document.createElement('p');
            ratingContainer.innerHTML = `<strong>Average Rating:</strong> `;
            ratingContainer.appendChild(createRatingStars(professor.avg_rating));
            detailsContainer.appendChild(ratingContainer);

            // Add difficulty circles
            const difficultyContainer = document.createElement('p');
            difficultyContainer.innerHTML = `<strong>Average Difficulty:</strong> `;
            difficultyContainer.appendChild(createDifficultyCircles(professor.avg_difficulty));
            detailsContainer.appendChild(difficultyContainer);

            // Append the details container to the professor details section
            professorDetailsEl.appendChild(detailsContainer);

            // Add bold "Courses taught" heading
            const coursesHeading = document.createElement("p");
            coursesHeading.innerHTML = `<strong>Courses taught:</strong>`;
            professorDetailsEl.appendChild(coursesHeading);

            // Populate courses taught
            const courses = data.courses_taught || [];
            const coursesTaughtList = document.createElement("ul");
            coursesTaughtList.classList.add("courses-taught-list");

            if (courses.length > 0) {
                courses.forEach((course) => {
                    const li = document.createElement("li");
                    li.innerHTML = `${course.title} (${course.subject} ${course.number})`;
                    coursesTaughtList.appendChild(li);
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
                            <strong>Review by:</strong> Anonymous
                            <span>Grade: ${review.grade || "N/A"}</span>
                        </div>
                        <div class="review-content">
                            <p><strong>Review:</strong> ${review.review || "No comments provided."}</p>
                            <p><strong>Rating:</strong> <span class="rating">${review.rating || "N/A"}/5</span></p>
                            <p><strong>Difficulty:</strong> <span class="difficulty">${review.difficulty || "N/A"}/6</span></p>
                            <p><strong>Estimated Weekly Hours:</strong> ${review.estimated_hours || "N/A"}</p>
                            <p><strong>Course:</strong> ${review.course?.title || "N/A"} (${review.course?.subject || ""} ${review.course?.number || ""})</p>
                            <p><strong>Would Take Again:</strong> ${review.would_take_again ? "Yes" : "No"}</p>
                            <p><strong>For Credit:</strong> ${review.for_credit ? "Yes" : "No"}</p>
                            <p><strong>Mandatory Attendance:</strong> ${review.mandatory_attendance ? "Yes" : "No"}</p>
                            <p><strong>Class Format:</strong> 
                                ${review.in_person ? "In Person " : ""}
                                ${review.online ? "Online " : ""}
                                ${review.hybrid ? "Hybrid" : ""}
                            </p>
                            <p><strong>Other Notes:</strong> 
                                ${review.no_exams ? "No Exams " : ""}
                                ${review.presentations ? "Presentations" : ""}
                            </p>
                        </div>
                    `;

                    reviewsListEl.appendChild(li);
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