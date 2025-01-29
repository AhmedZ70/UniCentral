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
                <p><strong>Department:</strong> ${professor.department?.name || "N/A"}</p>
                <p><strong>Average Rating:</strong> <span class="rating">${(professor.avg_rating || 0).toFixed(1)}</span></p>
                <p><strong>Average Difficulty:</strong> <span class="difficulty">${(professor.avg_difficulty || 0).toFixed(1)}</span></p>
            `;

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
});
