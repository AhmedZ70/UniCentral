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
let userEmail = null;
let isEditing = false;

document.addEventListener('DOMContentLoaded', function() {
    // Create discussion-threads container if it doesn't exist
    if (!document.querySelector('.discussion-threads')) {
        const mainContent = document.querySelector('.main-content');
        const threadsContainer = document.createElement('section');
        threadsContainer.className = 'discussion-threads';
        mainContent.appendChild(threadsContainer);
    }
    
    // Load threads when page loads
    loadThreads();
    
    // Set up new thread button listener
    const newThreadButton = document.querySelector('.new-thread-button');
    if (newThreadButton) {
        newThreadButton.addEventListener('click', showNewThreadModal);
        console.log("New thread button listener added");
    } else {
        console.error("New thread button not found");
    }
    
    // Set up form listeners
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
    
    // Set up modal close buttons
    document.querySelectorAll('.cancel-button').forEach(button => {
        button.addEventListener('click', closeModals);
    });
    
    // Set up search and filter listeners
    const searchInput = document.getElementById('search-discussions');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(loadThreads, 500));
    }
    
    const sortBySelect = document.getElementById('sort-by');
    if (sortBySelect) {
        sortBySelect.addEventListener('change', loadThreads);
    }
    
    const filterBySelect = document.getElementById('filter-by');
    if (filterBySelect) {
        filterBySelect.addEventListener('change', loadThreads);
    }
});

// Utility function for debouncing search input
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Format relative time for thread timestamps
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

function loadThreads() {
    const searchTerm = document.getElementById('search-discussions').value;
    const sortBy = document.getElementById('sort-by').value;
    const filterBy = document.getElementById('filter-by').value;
    
    const threadsContainer = document.querySelector('.discussion-threads');
    threadsContainer.innerHTML = '<div class="loading">Loading discussions...</div>';
    
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (sortBy) params.append('sort_by', sortBy);
    if (filterBy && filterBy !== 'all') params.append('filter_by', filterBy);
    
    const contextType = document.body.dataset.contextType;
    const contextId = document.body.dataset.contextId;
    
    if (!contextType || !contextId) {
        threadsContainer.innerHTML = `
            <div class="error-message">
                <p>No course or professor selected. Please navigate to a course or professor page first.</p>
            </div>
        `;
        return;
    }
    
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
    
    // Fetch threads from the appropriate API
    fetch(endpoint)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            displayThreads(data);
        })
        .catch(error => {
            console.error('Error loading threads:', error);
            threadsContainer.innerHTML = `
                <div class="error-message">
                    <p>Failed to load discussions. Please try again later.</p>
                    <p>Error: ${error.message}</p>
                </div>
            `;
        });
}

// Display threads in the container
function displayThreads(threads) {
    const threadsContainer = document.querySelector('.discussion-threads');
    threadsContainer.innerHTML = '';
    
    if (!threads || threads.length === 0) {
        threadsContainer.innerHTML = `
            <div class="no-results">
                <p>No discussions found.</p>
            </div>
        `;
        return;
    }
    
    // Create a thread element for each thread
    threads.forEach(thread => {
        const threadElement = createThreadElement(thread);
        threadsContainer.appendChild(threadElement);
    });
    
    // Add event listeners to reply buttons
    attachReplyListeners();
}

// Create HTML element for a thread
function createThreadElement(thread) {
    const threadElement = document.createElement('div');
    threadElement.className = 'thread';
    threadElement.dataset.threadId = thread.id;
    
    // Create thread header
    const headerElement = document.createElement('div');
    headerElement.className = 'thread-header';
    
    const titleElement = document.createElement('h3');
    titleElement.textContent = thread.title;
    
    const metaElement = document.createElement('div');
    metaElement.className = 'thread-meta';
    
    const topicTag = document.createElement('span');
    topicTag.className = 'topic-tag';
    topicTag.textContent = thread.category || 'General';
    
    const timestamp = document.createElement('span');
    timestamp.className = 'timestamp';
    timestamp.textContent = `Posted ${formatRelativeTime(thread.created_at)}`;
    
    const replyCount = document.createElement('span');
    replyCount.className = 'reply-count';
    replyCount.textContent = `${thread.comments ? thread.comments.length : 0} replies`;
    
    metaElement.appendChild(topicTag);
    metaElement.appendChild(timestamp);
    metaElement.appendChild(replyCount);
    
    headerElement.appendChild(titleElement);
    headerElement.appendChild(metaElement);
    
    // Create thread content
    const contentElement = document.createElement('div');
    contentElement.className = 'thread-content';
    
    const questionElement = document.createElement('p');
    questionElement.className = 'question';
    questionElement.textContent = thread.content;
    
    const responsesElement = document.createElement('div');
    responsesElement.className = 'responses';
    
    // Add responses/comments if any
    if (thread.comments && thread.comments.length > 0) {
        thread.comments.forEach(comment => {
            const responseElement = createResponseElement(comment);
            responsesElement.appendChild(responseElement);
        });
    }
    
    const replyButton = document.createElement('button');
    replyButton.className = 'reply-button';
    replyButton.textContent = 'Reply';
    
    contentElement.appendChild(questionElement);
    contentElement.appendChild(responsesElement);
    contentElement.appendChild(replyButton);
    
    // Assemble the thread
    threadElement.appendChild(headerElement);
    threadElement.appendChild(contentElement);
    
    return threadElement;
}

// Create HTML element for a comment/response
function createResponseElement(comment) {
    const responseElement = document.createElement('div');
    responseElement.className = 'response';
    responseElement.dataset.commentId = comment.id;
    
    const contentParagraph = document.createElement('p');
    contentParagraph.textContent = comment.content;
    
    const metaElement = document.createElement('div');
    metaElement.className = 'response-meta';
    
    const authorSpan = document.createElement('span');
    authorSpan.className = 'author';
    authorSpan.textContent = comment.author || 'Anonymous Student';
    
    const timestampSpan = document.createElement('span');
    timestampSpan.className = 'timestamp';
    timestampSpan.textContent = formatRelativeTime(comment.created_at);
    
    const upvoteButton = document.createElement('button');
    upvoteButton.className = 'upvote';
    upvoteButton.textContent = `👍 ${comment.upvotes || 0}`;
    upvoteButton.addEventListener('click', function() {
        upvoteComment(comment.id, this);
    });
    
    metaElement.appendChild(authorSpan);
    metaElement.appendChild(timestampSpan);
    metaElement.appendChild(upvoteButton);
    
    responseElement.appendChild(contentParagraph);
    responseElement.appendChild(metaElement);
    
    return responseElement;
}

// Attach listeners to reply buttons
function attachReplyListeners() {
    document.querySelectorAll('.reply-button').forEach(button => {
        button.addEventListener('click', function() {
            const threadId = this.closest('.thread').dataset.threadId;
            showReplyModal(threadId);
        });
    });
}

function showNewThreadModal() {
    if (!auth.currentUser) {
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
        return;
    }
    
    const modal = document.getElementById('new-thread-modal');
    if (modal) {
        // Change this from 'block' to 'flex' to match your CSS
        modal.style.display = 'flex';
        setTimeout(() => {
            // Focus on the title input after a brief delay
            modal.querySelector('input[name="title"]').focus();
        }, 50);
    } else {
        console.error("New thread modal not found");
    }
}

function showReplyModal(threadId) {
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
    } else {
        console.error("Reply modal not found");
    }
}

function closeModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

// Create a new thread
function createNewThread(form) {
    try {
        const title = form.querySelector('input[name="title"]').value.trim();
        const category = form.querySelector('select[name="category"]').value;
        const content = form.querySelector('textarea[name="content"]').value.trim();
        
        if (!title || !category || !content) {
            alert('Please fill out all fields');
            return;
        }
        
        // Get context data from the page
        const contextType = document.body.dataset.contextType;
        const contextId = document.body.dataset.contextId;
        
        if (!contextType || !contextId) {
            alert('No course or professor context found');
            return;
        }
        
        // Build the thread data object with required fields
        const threadData = {
            title,
            category,
            content
        };

        const user = auth.currentUser;
        if (user) {
            threadData.email_address = user.email;
        } else {
            alert('You must be logged in to create a thread');
            return;
        }
        
        // Add the appropriate context field automatically based on current page
        if (contextType === 'course') {
            threadData.course_id = contextId;
        } else if (contextType === 'professor') {
            threadData.professor_id = contextId;
        }
        
        // Send the request to create thread endpoint
        fetch('/api/threads/create/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(threadData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            // Close modal and reset form
            document.getElementById('new-thread-modal').style.display = 'none';
            form.reset();
            
            // Reload threads to show the new one
            loadThreads();
        })
        .catch(error => {
            console.error('Error creating thread:', error);
            alert('Failed to create thread. Please try again later.');
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        alert('An unexpected error occurred. Please try again.');
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
        
        // Get user email from Firebase
        const user = auth.currentUser;
        if (!user) {
            alert('You must be logged in to post a reply');
            return;
        }
        
        const replyData = {
            content,
            email_address: user.email
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
        console.log('Reply posted successfully:', data);
        
        // Close modal and reset form
        closeModals();
        form.reset();
        
        // Reload threads to show the new reply
        loadThreads();
    } catch (error) {
        console.error('Error posting reply:', error);
        alert('Failed to post reply. Please try again later.');
    }
}

// Upvote a comment
async function upvoteComment(commentId, button) {
    try {
        const response = await fetch(`/api/comments/${commentId}/upvote/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        button.textContent = `👍 ${data.upvotes}`;
    } catch (error) {
        console.error('Error upvoting comment:', error);
    }
}