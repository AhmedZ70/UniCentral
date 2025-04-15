import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

const firebaseConfig = {
    apiKey: "AIzaSyD0wF4R9GdY2m7eAwVL_j_mihLit4rRZ5Q",
    authDomain: "unicentral-b6c23.firebaseapp.com",
    projectId: "unicentral-b6c23",
    storageBucket: "unicentral-b6c23.firebasestorage.app",
    messagingSenderId: "554502030441",
    appId: "1:554502030441:web:6dccab580dbcfdb974cef8",
    measurementId: "G-M4L04508RH",
    clientId: "554502030441-g68f3tti18fiip1hpr6ehn6q6u5sn8fh.apps.googleusercontent.com"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);


document.addEventListener('DOMContentLoaded', function() {
    initializeDiscussionBoard();
    loadThreads();
    setupEventListeners();
    setupShowChartButton();
});

function setupShowChartButton() {
    const showChartButton = document.getElementById('showChartButton');
    const chartContainer = document.getElementById('chart-container');
    const chartCanvas = document.getElementById('categoryChart');
    const ctx = chartCanvas.getContext('2d');

    // Create or select a message element for empty chart
    let noDataMessage = document.getElementById('no-topic-message');
    if (!noDataMessage) {
        noDataMessage = document.createElement('p');
        noDataMessage.id = 'no-topic-message';
        noDataMessage.style.display = 'none';
        noDataMessage.style.fontWeight = 'bold';
        noDataMessage.style.textAlign = 'center';
        noDataMessage.style.color = '#666';
        chartContainer.appendChild(noDataMessage);
    }

    // Track existing chart instance to destroy before rendering again
    let currentChart = null;

    showChartButton.addEventListener('click', function () {
        if (chartContainer.style.display === "none") {
            chartContainer.style.display = "block";
            showChartButton.textContent = "Hide Topic Chart";

            const contextId = document.body.dataset.contextId;

            fetch(`/api/courses/${contextId}/category-counts/`)
                .then(response => response.json())
                .then(categoryCounts => {
                    const hasData = Object.values(categoryCounts).some(count => count > 0);

                    if (!hasData) {
                        chartCanvas.style.display = "none";
                        noDataMessage.textContent = "No topic information available.";
                        noDataMessage.style.display = "block";
                        return;
                    }

                    noDataMessage.style.display = "none";
                    chartCanvas.style.display = "block";

                    if (currentChart) {
                        currentChart.destroy();
                    }

                    currentChart = new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: Object.keys(categoryCounts),
                            datasets: [{
                                label: 'Threads by Category',
                                data: Object.values(categoryCounts),
                                backgroundColor: ['#FF743E', '#FFEB3B', '#4CAF50', '#FF9800'],
                                borderColor: '#fff',
                                borderWidth: 1
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: 'top',
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function (tooltipItem) {
                                            return tooltipItem.raw + ' threads';
                                        }
                                    }
                                }
                            }
                        }
                    });
                })
                .catch(error => {
                    console.error("Error fetching category data:", error);
                    chartCanvas.style.display = "none";
                    noDataMessage.textContent = "Failed to load topic information.";
                    noDataMessage.style.display = "block";
                });

        } else {
            chartContainer.style.display = "none";
            showChartButton.textContent = "Show Topic Chart";
        }
    });
}


function initializeDiscussionBoard() {
    if (!document.querySelector('.discussion-threads')) {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            const threadsContainer = document.createElement('section');
            threadsContainer.className = 'discussion-threads';
            mainContent.appendChild(threadsContainer);
        }
    }
    
    if (!document.querySelector('.search-options') && document.querySelector('.search-container')) {
        const searchContainer = document.querySelector('.search-container');
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'search-options';
        
        const includeCommentsLabel = document.createElement('label');
        includeCommentsLabel.className = 'include-comments-label';
        
        const includeCommentsCheckbox = document.createElement('input');
        includeCommentsCheckbox.type = 'checkbox';
        includeCommentsCheckbox.id = 'include-comments';
        includeCommentsCheckbox.checked = true;
        
        includeCommentsLabel.appendChild(includeCommentsCheckbox);
        includeCommentsLabel.appendChild(document.createTextNode(' Search in comments'));
        
        optionsContainer.appendChild(includeCommentsLabel);
        searchContainer.appendChild(optionsContainer);
    }
}

function setupEventListeners() {
    const newThreadButton = document.querySelector('.new-thread-button');
    if (newThreadButton) {
        newThreadButton.addEventListener('click', showNewThreadModal);
        console.log("New thread button listener added");
    } else {
        console.error("New thread button not found");
    }
    
    const newThreadForm = document.getElementById('new-thread-form');
    if (newThreadForm) {
        newThreadForm.addEventListener('submit', function(e) {
            e.preventDefault();
            createNewThread(this);
        });
    }
    
    const replyForm = document.getElementById('reply-form');
    if (replyForm) {
        replyForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitReply(this);
        });
    }
    
    document.querySelectorAll('.cancel-button').forEach(button => {
        button.addEventListener('click', closeModals);
    });
    
    const searchInput = document.getElementById('search-discussions');
    if (searchInput) {
        const newSearchInput = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newSearchInput, searchInput);
        
        newSearchInput.addEventListener('input', debounce(function() {
            loadThreads();
        }, 300));
    }
    
    const includeCommentsCheckbox = document.getElementById('include-comments');
    if (includeCommentsCheckbox) {
        includeCommentsCheckbox.addEventListener('change', function() {
            loadThreads();
        });
    }
    
    const sortBySelect = document.getElementById('sort-by');
    if (sortBySelect) {
        sortBySelect.addEventListener('change', loadThreads);
    }
    
    const filterBySelect = document.getElementById('filter-by');
    if (filterBySelect) {
        filterBySelect.addEventListener('change', loadThreads);
    }
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
        return 'Just now';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else {
        const weeks = Math.floor(diffInSeconds / 604800);
        return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
    }
}

async function loadThreads() {
    console.log("loadThreads function called");
    
    const searchInput = document.getElementById('search-discussions');
    const searchTerm = searchInput ? searchInput.value.trim() : '';
    
    const sortBySelect = document.getElementById('sort-by');
    const sortBy = sortBySelect ? sortBySelect.value : 'recent';
    console.log("Sort selection:", sortBy);
    
    const filterBySelect = document.getElementById('filter-by');
    const filterBy = filterBySelect ? filterBySelect.value : 'all';
    console.log("Filter selection:", filterBy);
    
    const includeCommentsCheckbox = document.getElementById('include-comments');
    const includeComments = includeCommentsCheckbox ? includeCommentsCheckbox.checked : true;
    
    const contextType = document.body.dataset.contextType;
    const contextId = document.body.dataset.contextId;
    
    const threadsContainer = document.querySelector('.discussion-threads');
    if (!threadsContainer) {
        console.error('Threads container not found');
        return;
    }
    
    threadsContainer.innerHTML = '<div class="loading">Loading discussions...</div>';
    
    if (!contextType || !contextId) {
        threadsContainer.innerHTML = `
            <div class="error-message">
                <p>No course or professor selected. Please navigate to a course or professor page first.</p>
            </div>
        `;
        return;
    }
    
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    params.append('sort_by', sortBy);
    if (filterBy && filterBy !== 'all') params.append('filter_by', filterBy);
    params.append('include_comments', includeComments);
    
    let endpoint;
    if (contextType === 'course') {
        endpoint = `/api/courses/${contextId}/threads/?${params.toString()}`;
    } else if (contextType === 'professor') {
        endpoint = `/api/professors/${contextId}/threads/?${params.toString()}`;
    } else {
        threadsContainer.innerHTML = `
            <div class="error-message">
                <p>Invalid context type. Please navigate to a course or professor page.</p>
            </div>
        `;
        return;
    }
    
    console.log('Loading threads with params:', { 
        contextType, 
        contextId, 
        searchTerm, 
        sortBy, 
        filterBy,
        includeComments 
    });
    console.log('Endpoint:', endpoint);
    
    try {
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Received data:', data);
        
        let filteredData = [...data];
        if (filterBy && filterBy !== 'all') {
            filteredData = filteredData.filter(thread => 
                thread.category && thread.category.toLowerCase() === filterBy.toLowerCase()
            );
            console.log(`Filtered to ${filteredData.length} threads with category: ${filterBy}`);
        }
        
        let sortedData = [...filteredData];
        console.log(`Sorting ${sortedData.length} threads by: ${sortBy}`);
        
        if (sortBy === 'recent') {
            sortedData = sortThreadsByDate(sortedData);
        } else if (sortBy === 'popular') {
            sortedData = sortThreadsByPopularity(sortedData);
        } else if (sortBy === 'unanswered') {
            sortedData = sortThreadsByUnanswered(sortedData);
        }
        
        displayThreads(sortedData);
        
        const resultCounter = document.querySelector('.result-counter');
        if (resultCounter) {
            resultCounter.textContent = `${sortedData.length} discussion${sortedData.length !== 1 ? 's' : ''} found`;
        }
    } catch (error) {
        console.error('Error loading threads:', error);
        threadsContainer.innerHTML = `
            <div class="error-message">
                <p>Failed to load discussions. Please check the following:</p>
                <ul>
                    <li>Check your network connection</li>
                    <li>Verify the API endpoint is correct</li>
                </ul>
                <p>Error: ${error.message}</p>
            </div>
        `;
    }
}

function sortThreadsByPopularity(threads) {
    console.log("Sorting by popularity");
    
    threads.forEach(thread => {
        const commentCount = Array.isArray(thread.comments) ? thread.comments.length : 0;
        console.log(`Thread ID ${thread.id}: ${commentCount} comments, title: ${thread.title}`);
    });
    
    return [...threads].sort((a, b) => {
        const aComments = Array.isArray(a.comments) ? a.comments.length : 0;
        const bComments = Array.isArray(b.comments) ? b.comments.length : 0;
        
        if (bComments !== aComments) {
            return bComments - aComments;
        }
        
        return new Date(b.created_at) - new Date(a.created_at);
    });
}

function sortThreadsByDate(threads) {
    console.log("Sorting by date");
    return [...threads].sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at);
    });
}

function sortThreadsByUnanswered(threads) {
    console.log("Sorting by unanswered");
    return [...threads].sort((a, b) => {
        const aHasComments = Array.isArray(a.comments) && a.comments.length > 0;
        const bHasComments = Array.isArray(b.comments) && b.comments.length > 0;
        
        // Threads with no comments should come first
        if (!aHasComments && bHasComments) {
            return -1;
        }
        if (aHasComments && !bHasComments) {
            return 1;
        }
    
        return new Date(b.created_at) - new Date(a.created_at);
    });
}

function debugThreadData(threads) {
    console.log("=== Thread Data Debug ===");
    threads.forEach(thread => {
        console.log(`Thread ID: ${thread.id}`);
        console.log(`  Title: ${thread.title}`);
        console.log(`  Category: ${thread.category}`);
        console.log(`  Created: ${thread.created_at}`);
        console.log(`  Comments: ${Array.isArray(thread.comments) ? thread.comments.length : 'N/A'}`);
        console.log("  ------------------");
    });
}

function displayThreads(threads) {
    const threadsContainer = document.querySelector('.discussion-threads');
    
    threadsContainer.innerHTML = '';
    
    if (!threads || threads.length === 0) {
        threadsContainer.innerHTML = `
            <div class="no-results">
                <p>No discussions found. Be the first to start a thread!</p>
            </div>
        `;
        return;
    }
    
    threads.forEach(thread => {
        if (!thread) {
            console.warn('Skipping invalid thread:', thread);
            return;
        }
        
        try {
            const threadElement = createThreadElement(thread);
            threadsContainer.appendChild(threadElement);
            
            if (thread.id) {
                loadThreadComments(thread.id);
            }
        } catch (error) {
            console.error('Error creating thread element:', error, thread);
        }
    });
    
    const resultCounter = document.querySelector('.result-counter');
    if (resultCounter) {
        resultCounter.textContent = `${threads.length} discussion${threads.length !== 1 ? 's' : ''} found`;
    }
    
    attachReplyListeners();
}

function createThreadElement(thread) {
    if (!thread || typeof thread !== 'object') {
        console.error('Invalid thread object:', thread);
        throw new Error('Invalid thread object');
    }
    
    console.log("Creating thread element with data:", thread);
    
    const threadElement = document.createElement('div');
    threadElement.className = 'thread';
    threadElement.dataset.threadId = thread.id || 'unknown';
    
    const headerElement = document.createElement('div');
    headerElement.className = 'thread-header';
    
    const titleElement = document.createElement('h3');
    titleElement.textContent = thread.title || 'Untitled Thread';
    
    const metaElement = document.createElement('div');
    metaElement.className = 'thread-meta';
    
    const topicTag = document.createElement('span');
    topicTag.className = 'topic-tag';
    
    console.log("Thread category value:", thread.category);
    
    const categoryValue = thread.category || thread.topic || thread.type || 'general';
    topicTag.textContent = categoryValue;
    
    topicTag.classList.add(`category-${categoryValue.toLowerCase()}`);
    
    const timestamp = document.createElement('span');
    timestamp.className = 'timestamp';
    timestamp.textContent = `Posted ${formatRelativeTime(thread.created_at)}`;
    
    const replyCount = document.createElement('span');
    replyCount.className = 'reply-count';
    
    const commentCount = Array.isArray(thread.comments) ? thread.comments.length : 0;
    replyCount.textContent = `${commentCount} replies`;
    
    metaElement.appendChild(topicTag);
    metaElement.appendChild(timestamp);
    metaElement.appendChild(replyCount);
    
    headerElement.appendChild(titleElement);
    headerElement.appendChild(metaElement);
    
    const responsesElement = document.createElement('div');
    responsesElement.className = 'responses';
    
    if (Array.isArray(thread.comments) && thread.comments.length > 0) {
        thread.comments.forEach(comment => {
            const responseElement = createResponseElement(comment);
            responsesElement.appendChild(responseElement);
        });
    }
    
    const replyButton = document.createElement('button');
    replyButton.className = 'reply-button';
    replyButton.textContent = 'Reply';
    
    threadElement.appendChild(headerElement);
    threadElement.appendChild(responsesElement);
    threadElement.appendChild(replyButton);
    
    return threadElement;
}

function createResponseElement(comment) {
    if (!comment) {
        console.warn('Skipping invalid comment:', comment);
        return document.createElement('div');
    }
    
    const responseElement = document.createElement('div');
    responseElement.className = 'response';
    responseElement.dataset.commentId = comment.id;
    
    const contentParagraph = document.createElement('p');
    contentParagraph.textContent = comment.content || 'No comment content';
    
    const metaElement = document.createElement('div');
    metaElement.className = 'response-meta';
    
    const authorSpan = document.createElement('span');
    authorSpan.className = 'author';
    
    if (comment.user && comment.user.fname) {
        authorSpan.textContent = comment.user.fname;
    } else if (comment.user && comment.user.email_address) {
        authorSpan.textContent = comment.user.email_address.split('@')[0];
    } else {
        authorSpan.textContent = 'Anonymous Student';
    }
    
    const timestampSpan = document.createElement('span');
    timestampSpan.className = 'timestamp';
    timestampSpan.textContent = formatRelativeTime(comment.created_at);
    
    const upvoteButton = document.createElement('button');
    upvoteButton.className = 'upvote-button';
    upvoteButton.dataset.commentId = comment.id;
    
    if (comment.user_has_upvoted) {
        upvoteButton.classList.add('active');
    }
    
    const likeContainer = document.createElement('div');
    likeContainer.className = 'like-container';
    
    const countSpan = document.createElement('span');
    countSpan.className = 'like-count';
    
    const upvoteCount = comment.upvotes_count !== undefined ? comment.upvotes_count : 
                        (comment.upvotes !== undefined ? comment.upvotes : 0);
    
    countSpan.textContent = upvoteCount;
    
    const thumbsUpImg = document.createElement('img');
    thumbsUpImg.src = '/static/assets/thumbs_up.png';
    thumbsUpImg.alt = 'thumbs up';
    thumbsUpImg.className = 'thumbs-up-img';
    
    likeContainer.appendChild(thumbsUpImg);
    likeContainer.appendChild(countSpan);
    upvoteButton.appendChild(likeContainer);
    
    metaElement.appendChild(authorSpan);
    metaElement.appendChild(timestampSpan);
    metaElement.appendChild(upvoteButton);
    
    responseElement.appendChild(contentParagraph);
    responseElement.appendChild(metaElement);
    
    upvoteButton.addEventListener('click', function() {
        upvoteComment(comment.id, this);
    });
    
    return responseElement;
}

async function loadThreadComments(threadId) {
    const auth = getAuth();
    const user = auth.currentUser;
    const userEmail = user ? user.email : null;
    
    let endpoint = `/api/threads/${threadId}/comments/`;
    if (userEmail) {
        endpoint += `?email=${encodeURIComponent(userEmail)}`;
    }
    
    try {
        const response = await fetch(endpoint);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch comments. Status: ${response.status}`);
        }
        
        const comments = await response.json();
        
        const threadElement = document.querySelector(`.thread[data-thread-id="${threadId}"]`);
        if (threadElement) {
            const responsesContainer = threadElement.querySelector('.responses');
            responsesContainer.innerHTML = '';
            
            const replyCountElement = threadElement.querySelector('.reply-count');
            replyCountElement.textContent = `${comments.length} replies`;
            
            comments.forEach(comment => {
                const responseElement = createResponseElement(comment);
                responsesContainer.appendChild(responseElement);
            });
        }
    } catch (error) {
        console.error('Error loading comments:', error);
    }
}

function attachReplyListeners() {
    document.querySelectorAll('.reply-button').forEach(button => {
        button.addEventListener('click', function() {
            const threadId = this.closest('.thread').dataset.threadId;
            showReplyModal(threadId);
        });
    });
}

function showNewThreadModal() {
    const auth = getAuth();
    if (!auth.currentUser) {
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
        return;
    }
    
    const modal = document.getElementById('new-thread-modal');
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => {
            const titleTextarea = modal.querySelector('textarea[name="title"]');
            if (titleTextarea) {
                titleTextarea.focus();
            }
        }, 50);
    }
}

function showReplyModal(threadId) {
    const auth = getAuth();
    if (!auth.currentUser) {
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
        return;
    }
    
    const modal = document.getElementById('reply-modal');
    if (modal) {
        modal.dataset.threadId = threadId;
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.querySelector('textarea').focus();
        }, 50);
    }
}

function closeModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

async function createNewThread(form) {
    try {
        const title = form.querySelector('textarea[name="title"]').value.trim();
        const category = form.querySelector('select[name="category"]').value;
        
        console.log("Creating new thread with category:", category);
        
        if (!title || !category) {
            alert('Please fill out all fields');
            return;
        }
        
        const contextType = document.body.dataset.contextType;
        const contextId = document.body.dataset.contextId;
        
        if (!contextType || !contextId) {
            alert('No course or professor context found');
            return;
        }
        
        const threadData = {
            title,
            category
        };
        
        const auth = getAuth();
        const user = auth.currentUser;
        if (user) {
            threadData.email_address = user.email;
        } else {
            alert('You must be logged in to create a thread');
            return;
        }
        
        if (contextType === 'course') {
            threadData.course_id = contextId;
        } else if (contextType === 'professor') {
            threadData.professor_id = contextId;
        }
        
        console.log("Sending thread data to server:", threadData);
        
        const response = await fetch('/api/threads/create/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(threadData)
        });
        
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("Server response after thread creation:", data);
        
        document.getElementById('new-thread-modal').style.display = 'none';
        form.reset();
        
        loadThreads();
    } catch (error) {
        console.error('Error creating thread:', error);
        alert('Failed to create thread. Please try again later.');
    }
}

async function submitReply(form) {
    try {
        const content = form.querySelector('textarea[name="content"]').value.trim();
        const threadId = document.getElementById('reply-modal').dataset.threadId;
        
        if (!content) {
            alert('Please enter a reply');
            return;
        }
        
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
            alert('You must be logged in to post a reply');
            return;
        }
        
        const replyData = {
            content: content,
            email_address: user.email,
            thread_id: threadId 
        };
        
        const response = await fetch(`/api/threads/${threadId}/comments/create/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(replyData)
        });
        
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        closeModals();
        form.reset();
        
        loadThreads();
    } catch (error) {
        console.error('Error posting reply:', error);
        alert('Failed to post reply. Please try again later.');
    }
}

async function upvoteComment(commentId, button) {
    try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
            alert('You must be logged in to upvote a comment');
            return;
        }
        
        const requestBody = {
            email: user.email
        };
        
        const response = await fetch(`/api/comments/${commentId}/upvote/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server error response:', errorText);
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        const countSpan = button.querySelector('.like-count');
        if (countSpan) {
            countSpan.textContent = data.upvotes;
        }
        
        if (data.user_upvoted) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    } catch (error) {
        console.error('Error upvoting comment:', error);
        alert('Failed to upvote. Please try again later.');
    }
}