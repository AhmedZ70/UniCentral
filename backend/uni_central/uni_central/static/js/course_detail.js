import { auth, onAuthStateChanged } from './auth.js';

document.addEventListener("DOMContentLoaded", () => {
    const courseIdInput = document.getElementById("courseId");
    if (!courseIdInput) {
        console.error("No #courseId element found in the DOM!");
        return;
    }
    const courseId = courseIdInput.value;

    const courseTitleEl = document.getElementById("course-title");
    const courseDetailsEl = document.getElementById("course-details");
    const reviewsListEl = document.getElementById("reviews-list");
    const noReviewsMsgEl = document.getElementById("no-reviews-message");
    const enrollBtn = document.getElementById("enroll-btn");

    fetch(`/api/courses/${courseId}/reviews/`)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Failed to load course data (status ${response.status})`);
            }
            return response.json(); 
        })
        .then((data) => {
            const course = data.course || {};
            courseTitleEl.textContent = course.title || "Untitled Course";

            const ratingContainer = document.getElementById("course-rating");
            ratingContainer.appendChild(createRatingStars(course.avg_rating));

            const difficultyContainer = document.getElementById("course-difficulty");
            difficultyContainer.appendChild(createDifficultyCircles(course.avg_difficulty));

            document.getElementById("course-subject").textContent = course.subject || "N/A";
            document.getElementById("course-credits").textContent = course.credits || "N/A";
            document.getElementById("course-semester").textContent = course.semester || "Not specified";
            document.getElementById("course-grade").textContent = course.grade || "N/A";

            const reviews = data.reviews || [];
            if (reviews.length === 0) {
                noReviewsMsgEl.style.display = "block";
            } else {
                noReviewsMsgEl.style.display = "none";
                reviewsListEl.innerHTML = ""; 

                reviews.forEach((review) => {
                    const li = document.createElement("li");
                    li.classList.add("review-item");

                    let reviewAuthor;
                    if (review.is_anonymous === true || review.is_anonymous === 'true') {
                        reviewAuthor = "Anonymous";
                        console.log('Attribution Reason: Review marked as anonymous');
                    } else {
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
                            <span>Grade: ${review.grade || "Not provided"}</span>
                        </div>
                        <div class="review-content">
                            <p><span class="detail-label">Review:</span> ${review.review || ""}</p>
                            <div><span class="detail-label">Rating:</span> 
                               <span class="rating-container" style="display: inline-block; vertical-align: middle; margin-left: 5px;"></span>
                            </div>
                            <div><span class="detail-label">Difficulty:</span> 
                               <span class="difficulty-container" style="display: inline-block; vertical-align: middle; margin-left: 5px;"></span>
                            </div>
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
                    ratingContainer.appendChild(createRatingStars(review.rating));

                    const difficultyContainer = li.querySelector('.difficulty-container');
                    difficultyContainer.appendChild(createDifficultyCircles(review.difficulty));

                    setupThumbsButtons(review.id, li);
                });
            }
            // 6. Handle Grade Distribution Chart
            let gradeChart = null;

            const gradeData = { A: 0, B: 0, C: 0, D: 0, F: 0 };
            
            reviews.forEach((review) => {
                if (review.grade) {
                    gradeData[review.grade] = (gradeData[review.grade] || 0) + 1;
                }
            });
            
            const showChartLink = document.getElementById("showChartLink");
            const chartCanvas = document.getElementById("gradeAverageChart");
            const chartContainer = document.getElementById("chart-container");
            const noGradeMessage = document.getElementById("no-grade-message");
            
            showChartLink.addEventListener("click", function (event) {
                event.preventDefault();
            
                if (Object.values(gradeData).every(value => value === 0)) {
                    noGradeMessage.style.display = "block";
                    chartContainer.style.display = "none";
                    showChartLink.textContent = "View Grade Distribution";
                } else {

                    if (chartContainer.style.display === "none" || chartContainer.style.display === "") {
                        chartContainer.style.display = "block";
                        noGradeMessage.style.display = "none";
            
                        showChartLink.textContent = "Close Chart";
            
                        if (gradeChart) {
                            gradeChart.destroy();
                        }
            
                        const ctx = chartCanvas.getContext('2d');
            
                        gradeChart = new Chart(ctx, {
                            type: 'pie',
                            data: {
                                labels: Object.keys(gradeData),
                                datasets: [{
                                    label: 'Grade Distribution',
                                    data: Object.values(gradeData),
                                    backgroundColor: [
                                        '#4CAF50',
                                        '#8BC34A',
                                        '#9C27B0',
                                        '#FFEB3B',
                                        '#FF9800',
                                        '#F44336',
                                    ]
                                }]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'top',
                                    }
                                }
                            }
                        });
                    } else {
                        chartContainer.style.display = "none";
                        noGradeMessage.style.display = "none";
            
                        showChartLink.textContent = "View Grade Distribution";
                    }
                }
            });            
        })
        .catch((error) => {
            console.error("Error fetching course data:", error);
            courseTitleEl.textContent = "Error Loading Course";
        });

    if (enrollBtn) {
        // Use onAuthStateChanged to track the user's authentication state
        onAuthStateChanged(auth, (user) => {
            if (user) {
                // User is signed in
                const emailAddress = user.email;

                // Check if the user is already enrolled
                fetch(`/api/my_courses/${emailAddress}/`)
                    .then((response) => response.json())
                    .then((data) => {
                        const isEnrolled = data.some((course) => course.id === parseInt(courseId));
                        if (isEnrolled) {
                            enrollBtn.textContent = "Unenroll";
                        } else {
                            enrollBtn.textContent = "Enroll";
                        }
                    })
                    .catch((error) => console.error("Error checking enrollment:", error));

                // Handle enroll/unenroll button click
                enrollBtn.addEventListener("click", () => {
                    const isEnrolled = enrollBtn.textContent === "Unenroll";
                    const url = isEnrolled
                        ? `/api/courses/${courseId}/reviews/un_enroll/`
                        : `/api/courses/${courseId}/reviews/enroll/`;

                    fetch(url, {
                        method: isEnrolled ? "DELETE" : "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ email_address: emailAddress }),
                    })
                        .then((response) => response.json())
                        .then((data) => {
                            if (data.message) {
                                alert(data.message);
                                enrollBtn.textContent = isEnrolled ? "Enroll" : "Unenroll";
                            } else if (data.error) {
                                alert(data.error);
                            }
                        })
                        .catch((error) => console.error("Error:", error));
                });
            } else {
                // User is signed out
                enrollBtn.textContent = "Login to Enroll";
                enrollBtn.disabled = true;
            }
        });
    }
});

function createRatingStars(rating) {
    const maxStars = 5;
    const filledStars = Math.round(rating); 
    const starsContainer = document.createElement('div');
    starsContainer.className = 'rating-stars';

    for (let i = 1; i <= maxStars; i++) {
        const star = document.createElement('span');
        star.className = i <= filledStars ? 'star filled' : 'star';
        star.innerHTML = '★'; 
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