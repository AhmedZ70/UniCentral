import { auth, onAuthStateChanged } from './auth.js';

document.addEventListener("DOMContentLoaded", () => {
    const professorId = document.getElementById("professorId").value;

    const professorNameEl = document.getElementById("professor-name");
    const professorDetailsEl = document.getElementById("professor-details");
    const reviewsListEl = document.getElementById("reviews-list");
    const noReviewsMsgEl = document.getElementById("no-reviews-message");
    const addProfessorBtn = document.getElementById("add-professor-btn");

    fetch(`/api/professors/${professorId}/reviews/`)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Failed to load professor data (status ${response.status})`);
            }
            return response.json();
        })
        .then((data) => {
            const professor = data.professor || {};
            professorNameEl.className = 'professor-title';
            professorNameEl.textContent = `${professor.fname} ${professor.lname}`;

            const detailsContainer = document.createElement('div');
            detailsContainer.innerHTML = `
                <p><span class="detail-label">Department:</strong> ${professor.department?.name || "N/A"}</p>
            `;

            const ratingContainer = document.createElement('p');
            ratingContainer.innerHTML = `<span class="detail-label">Average Rating:</span> `;
            ratingContainer.appendChild(createRatingStars(professor.avg_rating));
            detailsContainer.appendChild(ratingContainer);

            const difficultyContainer = document.createElement('p');
            difficultyContainer.innerHTML = `<span class="detail-label">Average Difficulty:</span> `;
            difficultyContainer.appendChild(createDifficultyCircles(professor.avg_difficulty));
            detailsContainer.appendChild(difficultyContainer);

            professorDetailsEl.appendChild(detailsContainer);

            const coursesHeading = document.createElement("p");
            coursesHeading.innerHTML = `<span class="detail-label">Courses taught:</span>`;
            professorDetailsEl.appendChild(coursesHeading);

            const courses = data.courses_taught || [];
            const coursesTaughtList = document.createElement("ul");
            coursesTaughtList.classList.add("courses-taught-list");

            if (courses.length > 0) {
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

                    // Extensive debug logging for review author attribution
                    console.log('Raw Review Object:', JSON.parse(JSON.stringify(review)));
                    console.log('Is Anonymous Flag:', review.is_anonymous);
                    console.log('User Object Details:', 
                        review.user ? {
                            fname: review.user.fname,
                            lname: review.user.lname,
                            email: review.user.email
                        } : 'No user object found'
                    );

                    // Determine review attribution with detailed debugging
                    let reviewAuthor;
                    if (review.is_anonymous === true || review.is_anonymous === 'true') {
                        reviewAuthor = "Anonymous";
                        console.log('Attribution Reason: Review marked as anonymous');
                    } else {
                        // Attempt to construct name
                        const firstName = review.user?.fname || '';
                        const lastName = review.user?.lname || '';
                        reviewAuthor = (firstName + ' ' + lastName).trim() || "Anonymous";
                        
                        console.log('Attribution Details:', {
                            firstName: firstName,
                            lastName: lastName,
                            constructedName: reviewAuthor
                        });
                    }

                    console.log('Final Determined Review Author:', reviewAuthor);

                    li.innerHTML = `
                        <div class="review-header">
                            <strong>Review by: ${reviewAuthor}</strong>
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
                            <div class="thumb-buttons">
                                <div class="dislikes">
                                    <button class="helpful-review-button" id="thumbs-down-${review.id}">
                                        <img src="${'/static/assets/thumbs_down.png'}" alt="thumbs down">
                                    </button>
                                    <p>0</p>
                                </div>
                                <div class="likes">
                                    <button class="helpful-review-button" id="thumbs-up-${review.id}">
                                        <img src="${'/static/assets/thumbs_up.png'}" alt="thumbs up">
                                    </button>
                                    <p>0</p>
                                </div>
                           </div>
                        </div>
                    `;

                    reviewsListEl.appendChild(li);

                    const ratingContainer = li.querySelector('.rating-container');
                    ratingContainer.appendChild(createRatingStars(review.rating || 0));
                    
                    const difficultyContainer = li.querySelector('.difficulty-container');
                    difficultyContainer.appendChild(createDifficultyCircles(review.difficulty || 0));

                    setupThumbsButtons(review.id, li);
                });
            }
            // Prof grade dist.
            const professorGradeData = { A: 0, B: 0, C: 0, D: 0, F: 0 };

            reviews.forEach((review) => {
                if (review.grade) {
                    professorGradeData[review.grade] = (professorGradeData[review.grade] || 0) + 1;
                }
            });
            const showProfessorChartLink = document.getElementById("showProfessorChartLink");
            const professorChartCanvas = document.getElementById("gradeAverageChart");
            const noProfessorGradeMessage = document.getElementById("no-grade-message");

            showProfessorChartLink.addEventListener("click", function (event) {
                event.preventDefault(); // Prevent the link from navigating

                console.log("View Distribution clicked!");
                // Check if there is no professor grade data
                if (Object.values(professorGradeData).every(value => value === 0)) {
                    // Show the message that no grade data is available
                    noProfessorGradeMessage.style.display = "block";
                    professorChartCanvas.style.display = "none"; // Hide the chart
                    showProfessorChartLink.textContent = "View Professor Grade Distribution"; // Reset the link text
                } else {
                    // Toggle chart visibility and link text
                    if (professorChartCanvas.style.display === "none" || professorChartCanvas.style.display === "") {
                        // Show the chart
                        professorChartCanvas.style.display = "block";
                        noProfessorGradeMessage.style.display = "none"; // Hide the "No grade data" message

                        // Change the link text to "Close Chart"
                        showProfessorChartLink.textContent = "Close Chart";

                        // Create the chart (Pie Chart for grade distribution)
                        const ctx = professorChartCanvas.getContext('2d');

                        new Chart(ctx, {
                            type: 'pie',
                            data: {
                                labels: Object.keys(professorGradeData),
                                datasets: [{
                                    label: 'Professor Grade Distribution',
                                    data: Object.values(professorGradeData),
                                    backgroundColor: [
                                        '#4CAF50', // Dark Green for A
                                        '#8BC34A', // Lighter Green for A
                                        '#9C27B0', // Slightly Lighter Green/Purple for B
                                        '#FFEB3B', // Yellow-green for C
                                        '#FF9800', // Orange for D
                                        '#F44336', // Red for F
                                    ]
                                }]
                            },
                            options: {
                                responsive: true,
                                plugins: {
                                    legend: {
                                        position: 'top',
                                    }
                                }
                            }
                        });
                    } else {
                        // Hide the chart
                        professorChartCanvas.style.display = "none";
                        noProfessorGradeMessage.style.display = "none"; // Hide message when chart is closed

                        // Change the link text back to "View Professor Grade Distribution"
                        showProfessorChartLink.textContent = "View Professor Grade Distribution";
                    }
                }
            });
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

function setupThumbsButtons(reviewId, liElement) {
    const thumbsUpBtn = liElement.querySelector(`#thumbs-up-${reviewId}`);
    const thumbsDownBtn = liElement.querySelector(`#thumbs-down-${reviewId}`); 
    const likesCountEl = liElement.querySelector('.likes p');
    const dislikesCountEl = liElement.querySelector('.dislikes p');
    
    fetchVoteCounts(reviewId, likesCountEl, dislikesCountEl);
    
    checkUserVote(reviewId, thumbsUpBtn, thumbsDownBtn);
    
    thumbsUpBtn.addEventListener('click', () => {
        handleVote(reviewId, 'like', thumbsUpBtn, thumbsDownBtn, likesCountEl, dislikesCountEl);
    });
    
    thumbsDownBtn.addEventListener('click', () => {
        handleVote(reviewId, 'dislike', thumbsUpBtn, thumbsDownBtn, likesCountEl, dislikesCountEl);
    });
}

function fetchVoteCounts(reviewId, likesEl, dislikesEl) {
    fetch(`/api/reviews/${reviewId}/votes/`)
        .then(response => response.json())
        .then(data => {
            likesEl.textContent = data.likes || 0;
            dislikesEl.textContent = data.dislikes || 0;
        })
        .catch(error => console.error('Error fetching vote counts:', error));
}

function checkUserVote(reviewId, thumbsUpBtn, thumbsDownBtn) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            fetch(`/api/reviews/${reviewId}/user-vote/?email=${user.email}`)
                .then(response => response.json())
                .then(data => {
                    thumbsUpBtn.classList.remove('active');
                    thumbsDownBtn.classList.remove('active');
                    
                    if (data.vote === 'like') {
                        thumbsUpBtn.classList.add('active');
                    } else if (data.vote === 'dislike') {
                        thumbsDownBtn.classList.add('active');
                    }
                })
                .catch(error => console.error('Error checking user vote:', error));
        }
    });
}

function handleVote(reviewId, voteType, thumbsUpBtn, thumbsDownBtn, likesEl, dislikesEl) {
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            alert('Please log in to vote on reviews');
            return;
        }
        
        fetch(`/api/reviews/${reviewId}/vote/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: user.email,
                vote_type: voteType
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
                return;
            }
            
            likesEl.textContent = data.likes || 0;
            dislikesEl.textContent = data.dislikes || 0;
            
            thumbsUpBtn.classList.remove('active');
            thumbsDownBtn.classList.remove('active');
            
            if (data.user_vote === 'like') {
                thumbsUpBtn.classList.add('active');
            } else if (data.user_vote === 'dislike') {
                thumbsDownBtn.classList.add('active');
            }
        })
        .catch(error => console.error('Error submitting vote:', error));
    });
}