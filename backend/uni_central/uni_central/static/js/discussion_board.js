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

document.addEventListener('DOMContentLoaded', () => {
    // Load threads when page loads
    loadThreads();
    
    // Set up event listeners
    document.querySelector('.new-thread-button').addEventListener('click', () => {
        document.getElementById('new-thread-modal').style.display = 'block';
    });
    
    // Handle form submissions
    document.getElementById('new-thread-form').addEventListener('submit', function(e) {
        e.preventDefault();
        createNewThread(this);
    });
    
    // Handle reply form submissions
    document.getElementById('reply-form').addEventListener('submit', function(e) {
        e.preventDefault();
        submitReply(this);
    });
    
    // Close modals when cancel is clicked
    document.querySelectorAll('.cancel-button').forEach(button => {
        button.addEventListener('click', function() {
            document.getElementById('new-thread-modal').style.display = 'none';
            document.getElementById('reply-modal').style.display = 'none';
        });
    });
    
    // Handle search and filters
    document.getElementById('search-discussions').addEventListener('input', debounce(() => {
        loadThreads();
    }, 500));
    
    document.getElementById('sort-by').addEventListener('change', loadThreads);
    document.getElementById('filter-by').addEventListener('change', loadThreads);
});

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Format relative time (e.g., "2 days ago")
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

// Load threads from the API
function loadThreads() {
    const searchTerm = document.getElementById('search-discussions').value;
    const sortBy = document.getElementById('sort-by').value;
    const filterBy = document.getElementById('filter-by').value;
    
    // Show loading indicator
    const threadsContainer = document.querySelector('.discussion-threads');
    threadsContainer.innerHTML = '<div class="loading">Loading discussions...</div>';
    
    // Build query parameters
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (sortBy) params.append('sort_by', sortBy);
    if (filterBy) params.append('filter_by', filterBy);
    
    // Fetch threads from API
    fetch(`/api/forums/?${params.toString()}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network response was not ok (${response.status})`);
            }
            return response.json();
        })
        .then(data => {
            // Clear the container
            threadsContainer.innerHTML = '';
            
            // Check if we have any threads
            if (!data || data.length === 0) {
                threadsContainer.innerHTML = '<div class="no-results">No discussions found.</div>';
                return;
            }
            
            // Render each thread
            data.forEach(thread => {
                const threadElement = createThreadElement(thread);
                threadsContainer.appendChild(threadElement);
            });
            
            // Attach reply button event listeners
            attachReplyListeners();
        })
        .catch(error => {
            console.error('Error fetching threads:', error);
            threadsContainer.innerHTML = '<div class="error">Failed to load discussions. Please try again later.</div>';
        });
}

// Create thread element
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
    topicTag.textContent = thread.topic_tag || 'General';
    
    const timestamp = document.createElement('span');
    timestamp.className = 'timestamp';
    timestamp.textContent = `Posted ${formatRelativeTime(thread.timestamp)}`;
    
    const replyCount = document.createElement('span');
    replyCount.className = 'reply-count';
    replyCount.textContent = `${thread.reply_count || 0} replies`;
    
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

// Create response element for a comment
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
    timestampSpan.textContent = formatRelativeTime(comment.timestamp);
    
    const upvoteButton = document.createElement('button');
    upvoteButton.className = 'upvote';
    upvoteButton.textContent = `👍 ${comment.upvotes || 0}`;
    upvoteButton.addEventListener('click', () => upvoteComment(comment.id, upvoteButton));
    
    metaElement.appendChild(authorSpan);
    metaElement.appendChild(timestampSpan);
    metaElement.appendChild(upvoteButton);
    
    responseElement.appendChild(contentParagraph);
    responseElement.appendChild(metaElement);
    
    return responseElement;
}

// Attach reply button listeners
function attachReplyListeners() {
    document.querySelectorAll('.reply-button').forEach(button => {
        button.addEventListener('click', function() {
            const threadId = this.closest('.thread').dataset.threadId;
            showReplyModal(threadId);
        });
    });
}

// Show reply modal
function showReplyModal(threadId) {
    const modal = document.getElementById('reply-modal');
    modal.dataset.threadId = threadId;
    modal.style.display = 'block';
    modal.querySelector('textarea').focus();
}

// Create a new thread
function createNewThread(form) {
    const title = form.querySelector('input[type="text"]').value;
    const category = form.querySelector('select').value;
    const content = form.querySelector('textarea').value;
    
    if (!title || !category || !content) {
        alert('Please fill out all fields');
        return;
    }
    
    const threadData = {
        title,
        category,
        content
    };
    
    // Add course or professor context if available
    const contextType = document.body.dataset.contextType;
    const contextId = document.body.dataset.contextId;
    
    if (contextType === 'course' && contextId) {
        threadData.course_id = contextId;
    } else if (contextType === 'professor' && contextId) {
        threadData.professor_id = contextId;
    }
    
    fetch('/api/forums/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'        
        },
        body: JSON.stringify(threadData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Network response was not ok (${response.status})`);
        }
        return response.json();
    })
    .then(data => {
        // Hide modal and reset form
        document.getElementById('new-thread-modal').style.display = 'none';
        form.reset();
        
        // Reload threads to show the new one
        loadThreads();
    })
    .catch(error => {
        console.error('Error creating thread:', error);
        alert('Failed to create thread. Please try again later.');
    });
}

// Load threads function should also use context
function loadThreads() {
    const searchTerm = document.getElementById('search-discussions').value;
    const sortBy = document.getElementById('sort-by').value;
    const filterBy = document.getElementById('filter-by').value;
    
    // Show loading indicator
    const threadsContainer = document.querySelector('.discussion-threads');
    threadsContainer.innerHTML = '<div class="loading">Loading discussions...</div>';
    
    // Build query parameters
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (sortBy) params.append('sort_by', sortBy);
    if (filterBy) params.append('filter_by', filterBy);
    
    // Add context if available
    const contextType = document.body.dataset.contextType;
    const contextId = document.body.dataset.contextId;
    
    if (contextType && contextId) {
        params.append('context_type', contextType);
        params.append('context_id', contextId);
    }
    
    // Fetch threads from API
    fetch(`/api/forums/?${params.toString()}`)
        .then(response => response.json ())
        .then(data => {
            renderThreads(data);
        })
        .catch(error => {
            console.error('Error fetching threads:', error);
            document.querySelector('.discussion-threads').innerHTML = 
                '<div class="error">Failed to load discussions. Please try again later.</div>';
        });
}

function submitReply(form) {
    const content = form.querySelector('textarea').value;
    const threadId = document.getElementById('reply-modal').dataset.threadId;
    
    if (!content) {
        alert('Please enter a reply');
        return;
    }
    
    fetch(`/api/forums/${threadId}/comments/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Network response was not ok (${response.status})`);
        }
        return response.json();
    })
    .then(data => {
        document.getElementById('reply-modal').style.display = 'none';
        form.reset();
        
        loadThreads();
    })
    .catch(error => {
        console.error('Error posting reply:', error);
        alert('Failed to post reply. Please try again later.');
    });
}

function upvoteComment(commentId, button) {
    fetch(`/api/comments/${commentId}/upvote/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Network response was not ok (${response.status})`);
        }
        return response.json();
    })
    .then(data => {
        button.textContent = `👍 ${data.upvotes}`;
    })
    .catch(error => {
        console.error('Error upvoting comment:', error);
    });
}
    