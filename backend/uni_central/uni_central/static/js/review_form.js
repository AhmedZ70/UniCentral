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
  
        const bodyData = {
            review: document.getElementById("reviewText").value,
            rating: document.getElementById("rating").value,
            difficulty: document.getElementById("difficulty").value,
            estimated_hours: document.getElementById("estimatedHours").value,
            grade: document.getElementById("grade").value,
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
            .then(() => {
                alert("Review created successfully!");
                location.reload();
            })
            .catch((error) => {
                console.error("Error submitting review:", error);
                alert("Failed to create review.");
            });
    });
  });