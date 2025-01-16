// review_form.js

document.addEventListener("DOMContentLoaded", () => {
    // Grab course ID from the hidden input
    const courseId = document.getElementById("courseId").value;
  
    // Identify DOM elements
    const professorSelect = document.getElementById("professorSelect");
    const reviewText = document.getElementById("reviewText");
    const rating = document.getElementById("rating");
    const difficulty = document.getElementById("difficulty");
    const wouldTakeAgain = document.getElementById("would_take_again");
  
    const submitBtn = document.getElementById("submitReviewBtn");
    const statusMsg = document.getElementById("statusMessage");
    const errorMsg = document.getElementById("errorMessage");
  
    // 1. Fetch professors from an API endpoint, e.g.:
    // Make sure you have a DRF view that returns the professors as JSON.
    fetch(`/api/courses/${courseId}/professors/`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load professors (status ${response.status})`);
        }
        return response.json();
      })
      .then((professors) => {
        // Populate the <select> with professor data
        professors.forEach((prof) => {
          const option = document.createElement("option");
          option.value = prof.id;
          option.textContent = `${prof.fname} ${prof.lname}`;
          professorSelect.appendChild(option);
        });
      })
      .catch((error) => {
        console.error("Error fetching professors:", error);
        errorMsg.textContent = "Failed to load professors. Try reloading.";
      });
  
    // 2. Handle "Submit Review" button
    submitBtn.addEventListener("click", (e) => {
      e.preventDefault();
      statusMsg.textContent = "";
      errorMsg.textContent = "";
  
      // Gather form data
      const bodyData = {
        professor: professorSelect.value,     // professor id
        review: reviewText.value,            // text content
        rating: rating.value,                // e.g. "4"
        difficulty: difficulty.value,        // e.g. "3"
        would_take_again: wouldTakeAgain.checked.toString(),
        // Add any other fields you'd like to capture: estimated_hours, grade, etc.
      };
  
      // 3. POST to /api/courses/<courseId>/reviews/create/
      fetch(`/api/courses/${courseId}/reviews/create/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyData),
      })
        .then((response) => {
          if (!response.ok) {
            // Attempt to parse JSON error
            return response.json().then((err) => {
              throw new Error(err.detail || "Review creation failed");
            });
          }
          return response.json();
        })
        .then((data) => {
          // data = { message: "Review created successfully", review_id: ... }
          statusMsg.textContent = data.message || "Review created!";
          // window.location.href = `/courses/${courseId}/`;
        })
        .catch((err) => {
          console.error("Error creating review:", err);
          errorMsg.textContent = err.message || "Error creating review.";
        });
    });
  });
  