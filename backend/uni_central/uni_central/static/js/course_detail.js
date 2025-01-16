// course_detail.js

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
  
    // 3. Fetch course + reviews data from your Django REST API
    //    e.g., /api/courses/<course_id>/reviews/
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
  });
  