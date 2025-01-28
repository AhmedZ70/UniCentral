document.addEventListener("DOMContentLoaded", () => {
    // Get professor ID from the hidden input
    const professorId = document.getElementById("professorId").value;

    // DOM elements to populate
    const professorNameEl = document.getElementById("professor-name");
    const professorDetailsEl = document.getElementById("professor-details");
    const reviewsListEl = document.getElementById("reviews-list");
    const noReviewsMsgEl = document.getElementById("no-reviews-message");

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
            professorDetailsEl.innerHTML = `
                <p><strong>Department:</strong> ${professor.department || "N/A"}</p>
                <p><strong>Average Rating:</strong> <span class="rating">${(professor.avg_rating || 0).toFixed(1)}</span></p>
                <p><strong>Average Difficulty:</strong> <span class="difficulty">${(professor.avg_difficulty || 0).toFixed(1)}</span></p>
                <p><strong>Courses Taught:</strong></p>
                <ul id="courses-taught">
                </ul>
            `;

            // Populate courses taught
            const courses = data.courses_taught || [];
            const coursesTaughtEl = document.getElementById("courses-taught");
            if (courses.length > 0) {
                courses.forEach((course) => {
                    const li = document.createElement("li");
                    li.innerHTML = `${course.title} (${course.subject} ${course.number})`;
                    coursesTaughtEl.appendChild(li);
                });
            } else {
                coursesTaughtEl.innerHTML = "<li>No courses found.</li>";
            }

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
                        </div>
                        <div class="review-content">
                            <p><strong>Rating:</strong> ${review.rating || "N/A"}</p>
                            <p><strong>Difficulty:</strong> ${review.difficulty || "N/A"}</p>
                            <p><strong>Review:</strong> ${review.review || "No comments provided."}</p>
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
});
