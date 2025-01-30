document.addEventListener("DOMContentLoaded", () => {
    const contextType = document.getElementById("contextType").value; // "course" or "professor"
    const contextId = document.getElementById("contextId").value;
  
    const professorSelectContainer = document.getElementById("professorSelectContainer");
    const courseSelectContainer = document.getElementById("courseSelectContainer");
  
    if (contextType === "course") {
        // Show professor dropdown and fetch professors
        professorSelectContainer.style.display = "block";
        fetch(`/api/courses/${contextId}/professors/`)
            .then((response) => response.json())
            .then((professors) => {
                const professorSelect = document.getElementById("professorSelect");
                professors.forEach((prof) => {
                    const option = document.createElement("option");
                    option.value = prof.id;
                    option.textContent = `${prof.fname} ${prof.lname}`;
                    professorSelect.appendChild(option);
                });
            })
            .catch((error) => console.error("Error fetching professors:", error));
    } else if (contextType === "professor") {
        // Show course dropdown and fetch courses
        courseSelectContainer.style.display = "block";
        fetch(`/api/professors/${contextId}/courses/`)
            .then((response) => response.json())
            .then((courses) => {
                const courseSelect = document.getElementById("courseSelect");
                courses.forEach((course) => {
                    const option = document.createElement("option");
                    option.value = course.id;
                    option.textContent = `${course.title} (${course.subject} ${course.number})`;
                    courseSelect.appendChild(option);
                });
            })
            .catch((error) => console.error("Error fetching courses:", error));
    }
  
    // Handle form submission
    const submitBtn = document.getElementById("submitReviewBtn");
    submitBtn.addEventListener("click", (e) => {
        e.preventDefault();
        // Get field values
        const reviewText = document.getElementById("reviewText").value.trim();
        const rating = document.getElementById("rating").value.trim();
        const difficulty = document.getElementById("difficulty").value.trim();

        // Get error elements
        const reviewTextError = document.getElementById("reviewTextError");
        const ratingError = document.getElementById("ratingError");
        const difficultyError = document.getElementById("difficultyError");

        // Reset errors
        document.getElementById("reviewText").classList.remove("error");
        document.getElementById("rating").classList.remove("error");
        document.getElementById("difficulty").classList.remove("error");
        reviewTextError.style.display = "none";
        ratingError.style.display = "none";
        difficultyError.style.display = "none";

        let isValid = true;

        // Validate Review Text
        if (!reviewText) {
            document.getElementById("reviewText").classList.add("error");
            reviewTextError.textContent = "Review text is required.";
            reviewTextError.style.display = "block";
            isValid = false;
        }

        // Validate Rating
        if (!rating || isNaN(rating) || rating < 1 || rating > 5) {
            document.getElementById("rating").classList.add("error");
            ratingError.textContent = "Rating must be between 1 and 5.";
            ratingError.style.display = "block";
            isValid = false;
        }

        // Validate Difficulty
        if (!difficulty || isNaN(difficulty) || difficulty < 1 || difficulty > 6) {
            document.getElementById("difficulty").classList.add("error");
            difficultyError.textContent = "Difficulty must be between 1 and 6.";
            difficultyError.style.display = "block";
            isValid = false;
        }

        // Stop submission if validation fails
        if (!isValid) {
            return;
        }
        const bodyData = {
            review: reviewText,
            rating: parseFloat(rating),
            difficulty: parseInt(difficulty),
            estimated_hours: document.getElementById("estimatedHours").value.trim() || null,
            grade: document.getElementById("grade").value.trim() || null,

            would_take_again: document.getElementById("wouldTakeAgain").checked,
            for_credit: document.getElementById("forCredit").checked,
            mandatory_attendance: document.getElementById("mandatoryAttendance").checked,
            required_course: document.getElementById("requiredCourse").checked,
            is_gened: document.getElementById("isGened").checked,
            in_person: document.getElementById("inPerson").checked,
            online: document.getElementById("online").checked,
            hybrid: document.getElementById("hybrid").checked,
            no_exams: document.getElementById("noExams").checked,
            presentations: document.getElementById("presentations").checked,

            //email_address: sessionStorage.getItem('userEmail')
            email_address: "joedoe@gmail.com"
        };
  
        if (contextType === "course") {
            bodyData.professor = document.getElementById("professorSelect").value;
        } else if (contextType === "professor") {
            bodyData.course = document.getElementById("courseSelect").value;
        }
  
        const endpoint =
            contextType === "course"
                ? `/api/courses/${contextId}/reviews/create/`
                : `/api/professors/${contextId}/reviews/create/`;
  
        fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bodyData),
        })
            .then((response) => {
                if (!response.ok) throw new Error("Failed to create review.");
                return response.json();
            })
            .then((data) => {
                // Redirect to course or professor detail page based on context
                if (contextType === "course") {
                    window.location.href = `/courses/${contextId}/`;
                } else if (contextType === "professor") {
                    window.location.href = `/professors/${contextId}/`;
                }
            })
            .catch((error) => {
                console.error("Error submitting review:", error);
                alert("Failed to create review.");
            });
    });
  });