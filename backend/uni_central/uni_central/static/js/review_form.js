// review_form.js

document.addEventListener("DOMContentLoaded", () => {
  // 1. Grab course ID from the hidden input
  const courseId = document.getElementById("courseId").value;

  // 2. Identify DOM elements
  const professorSelect = document.getElementById("professorSelect");
  const reviewText      = document.getElementById("reviewText");
  const rating          = document.getElementById("rating");
  const difficulty      = document.getElementById("difficulty");
  const estimatedHours  = document.getElementById("estimatedHours");
  const grade           = document.getElementById("grade");

  const submitBtn = document.getElementById("submitReviewBtn");
  const statusMsg = document.getElementById("statusMessage");
  const errorMsg  = document.getElementById("errorMessage");

  // 3. Fetch professors (to populate the <select>)
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

  // 4. Handle "Submit Review" button
  submitBtn.addEventListener("click", (e) => {
    e.preventDefault();

    // A small helper to convert checkboxes to 'true' or 'false' strings
    const boolToStr = (checkboxId) => {
      return document.getElementById(checkboxId).checked ? "true" : "false";
    };

    // Gather input values
    const professorId     = professorSelect.value;
    const reviewTextVal   = reviewText.value;
    const ratingVal       = rating.value;
    const difficultyVal   = difficulty.value;
    const estimatedHoursVal = estimatedHours.value;
    const gradeVal        = grade.value;

    // Build the payload (MUST match your Review model fields)
    const bodyData = {
      // ForeignKey fields
      professor: professorId,
      // Text / numeric fields
      review: reviewTextVal,
      rating: ratingVal,
      difficulty: difficultyVal,
      estimated_hours: estimatedHoursVal,
      grade: gradeVal,

      // Boolean fields
      would_take_again: boolToStr("wouldTakeAgain"),
      for_credit: boolToStr("forCredit"),
      mandatory_attendance: boolToStr("mandatoryAttendance"),
      required_course: boolToStr("requiredCourse"),
      is_gened: boolToStr("isGenEd"),
      in_person: boolToStr("inPerson"),
      online: boolToStr("online"),
      hybrid: boolToStr("hybrid"),
      no_exams: boolToStr("noExams"),
      presentations: boolToStr("presentations"),

      //email
      //email_address: sessionStorage.getItem('userEmail')
      email_address: "joedoe@gmail.com"
    };

    // 5. Send POST request to create the review
    fetch(`/api/courses/${courseId}/reviews/create/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // "X-CSRFToken": getCookie("csrftoken")
      },
      body: JSON.stringify(bodyData),
    })
      .then((response) => {
        if (!response.ok) {
          // Attempt to parse error details
          return response.json().then((err) => {
            throw new Error(err.detail || "Review creation failed");
          });
        }
        return response.json();
      })
      .then((data) => {
        statusMsg.textContent = data.message || "Review created successfully!";
        window.location.href = `/courses/${courseId}/`;
        errorMsg.textContent = "";
      })
      .catch((err) => {
        console.error("Error creating review:", err);
        statusMsg.textContent = "";
        errorMsg.textContent = err.message || "Error creating review.";
      });
  });
});
