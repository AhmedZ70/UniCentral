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
    if (!document.querySelector('.discussion-threads')) {
        const mainContent = document.querySelector('.main-content');
        const threadsContainer = document.createElement('section');
        threadsContainer.className = 'discussion-threads';
        mainContent.appendChild(threadsContainer);
    }
    
    loadThreads();
    
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

function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
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

function loadThreads() {
    const searchTerm = document.getElementById('search-discussions')?.value || '';
    const sortBy = document.getElementById('sort-by')?.value || 'recent';
    const filterBy = document.getElementById('filter-by')?.value || 'all';
    
    const threadsContainer = document.querySelector('.discussion-threads');
    if (!threadsContainer) {
        console.error('Threads container not found. Make sure .discussion-threads exists in your HTML');
        return;
    }
    
    threadsContainer.innerHTML = '<div class="loading">Loading discussions...</div>';
    
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (sortBy) params.append('sort_by', sortBy);
    if (filterBy && filterBy !== 'all') params.append('filter_by', filterBy);
    
    const contextType = document.body.dataset.contextType;
    const contextId = document.body.dataset.contextId;
    
    console.log('Loading threads with params:', {
        contextType, 
        contextId, 
        searchTerm, 
        sortBy, 
        filterBy
    });
    
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
    
    fetch(endpoint, { 
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        console.log('Response status:', response.status);
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Threads data received:', JSON.stringify(data, null, 2));
        displayThreads(data);
    })
    .catch(error => {
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
    });
}

function displayThreads(threads) {
    const threadsContainer = document.querySelector('.discussion-threads');
    
    threadsContainer.innerHTML = '';
    
    console.log('Displaying threads:', threads);
    
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
            
            loadThreadComments(thread.id);
        } catch (error) {
            console.error('Error creating thread element:', error, thread);
        }
    });
    attachReplyListeners();
}

function createThreadElement(thread) {
    if (!thread || typeof thread !== 'object') {
        console.error('Invalid thread object:', thread);
        throw new Error('Invalid thread object');
    }
    
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
    topicTag.textContent = thread.category || 'General';
    
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

    const likeContainer = document.createElement('div');
    likeContainer.className = 'like-container';
    
    const thumbsUpImg = document.createElement('img');
    thumbsUpImg.src = '/static/assets/thumbs_up.png';
    thumbsUpImg.alt = 'thumbs up';
    thumbsUpImg.className = 'thumbs-up-img'

    const countSpan = document.createElement('span');
    countSpan.className = 'like-count';
    countSpan.textContent = comment.upvotes || 0;
    
    // Assemble the button
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

function loadThreadComments(threadId) {
    fetch(`/api/threads/${threadId}/comments/`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch comments. Status: ${response.status}`);
            }
            return response.json();
        })
        .then(comments => {
            const threadElement = document.querySelector(`.thread[data-thread-id="${threadId}"]`);
            if (threadElement) {
                const responsesContainer = threadElement.querySelector('.responses');
                responsesContainer.innerHTML = '';
                
                const replyCountElement = threadElement.querySelector('.reply-count');
                replyCountElement.textContent = `${comments.length} replies`;
                
                const user = auth.currentUser;
                const userEmail = user ? user.email : null;
                
                comments.forEach(comment => {
                    if (userEmail && comment.user_upvotes && 
                        comment.user_upvotes.includes(userEmail)) {
                        comment.userVoted = true;
                    }
                    
                    const responseElement = createResponseElement(comment);
                    responsesContainer.appendChild(responseElement);
                });
            }
        })
        .catch(error => {
            console.error('Error loading comments:', error);
        });
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

function createNewThread(form) {
    try {
        const title = form.querySelector('textarea[name="title"]').value.trim();
        const category = form.querySelector('select[name="category"]').value;
        
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
            document.getElementById('new-thread-modal').style.display = 'none';
            form.reset();
            
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
        console.log('Reply posted successfully:', data);
        
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
        const user = auth.currentUser;
        if (!user) {
            alert('You must be logged in to upvote a comment');
            return;
        }
        
        const requestBody = {
            email: user.email
        };
        
        console.log('Sending upvote request for comment', commentId, 'with data:', requestBody);
        
        const response = await fetch(`/api/comments/${commentId}/upvote/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        // Try to get more detailed error info if response is not OK
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server error response:', errorText);
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Upvote successful, response:', data);
        
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

document.addEventListener('DOMContentLoaded', loadThreads);