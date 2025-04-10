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

document.addEventListener("DOMContentLoaded", () => {
  let allClassmates = [];
  let displayedClassmates = [];
  let currentUserEmail = null;
  let currentUserId = null;
  let studyBuddyRequests = {
    sent: {},
    received: {}
  };

  const searchInput = document.querySelector('.search-input');
  const searchBtn = document.querySelector('.search-btn');
  const filterSelect = document.querySelector('.classmate-filter');
  const classmateGrid = document.querySelector('.classmate-grid');
  const studyBuddyModal = document.querySelector('.study-buddy-modal');

  // Setup for real-time message updates using SSE
  let messageUpdateSource = null;
  
  function startMessageUpdates() {
    // Disable SSE for now to prevent errors
    console.log("Real-time updates disabled to prevent errors");
    return;
    
    /* Original code disabled to prevent errors
    if (currentUserEmail) {
      // Close any existing connection
      if (messageUpdateSource) {
        messageUpdateSource.close();
      }
      
      // Start a new connection
      messageUpdateSource = new EventSource(`/api/message-updates/${encodeURIComponent(currentUserEmail)}/`);
      
      // Initialize online buddies tracking
      window.onlineBuddies = window.onlineBuddies || {};
      
      // Handle message updates
      messageUpdateSource.addEventListener('message_update', function(event) {
        const data = JSON.parse(event.data);
        console.log('Received message update:', data);
        
        // Update UI for any unread messages
        updateUnreadMessageBadges(data.unread_counts, data.sender_info);
        
        // If we have the messaging modal open, refresh its messages
        const modal = document.querySelector('.messaging-modal');
        if (modal && modal.style.display === 'flex') {
          const requestId = document.getElementById('message-request-id').value;
          if (requestId && data.unread_counts[requestId]) {
            // Only reload if there are new messages in this conversation
            loadMessages(requestId);
          }
        }
      });
      
      // Handle status updates
      messageUpdateSource.addEventListener('status_update', function(event) {
        const data = JSON.parse(event.data);
        console.log('Received status update:', data);
        
        if (data.buddies) {
          // Update stored buddy statuses
          window.onlineBuddies = { ...window.onlineBuddies, ...data.buddies };
          
          // Update status indicator in open chat
          const modal = document.querySelector('.messaging-modal');
          if (modal && modal.style.display === 'flex') {
            const receiverId = document.getElementById('message-receiver-id').value;
            if (receiverId && window.onlineBuddies[receiverId]) {
              updateChatStatus(window.onlineBuddies[receiverId].status);
            }
          }
        }
      });
      
      // Handle ping events to keep connection alive
      messageUpdateSource.addEventListener('ping', function(event) {
        console.log('Ping received', JSON.parse(event.data).timestamp);
      });
      
      // Handle errors
      messageUpdateSource.onerror = function(error) {
        console.error('SSE Error:', error);
        // Try to reconnect after a delay
        setTimeout(startMessageUpdates, 5000);
      };
    }
    */
  }
  
  // Update unread message badges on classmate cards
  function updateUnreadMessageBadges(unreadCounts, senderInfo) {
    // First remove all existing unread badges
    document.querySelectorAll('.unread-badge').forEach(badge => badge.remove());
    
    // For each study buddy with unread messages
    Object.keys(unreadCounts).forEach(requestId => {
      const count = unreadCounts[requestId];
      const messageBtns = document.querySelectorAll(`.message-buddy-btn[data-request-id="${requestId}"]`);
      
      messageBtns.forEach(btn => {
        // Add or update the unread badge
        let badge = btn.querySelector('.unread-badge');
        if (!badge) {
          badge = document.createElement('div');
          badge.className = 'unread-badge';
          btn.appendChild(badge);
        }
        badge.textContent = count;
        
        // Update button text with sender info if available
        const sender = senderInfo[requestId];
        if (sender) {
          btn.textContent = `Message (${count} new)`;
          btn.setAttribute('title', `${sender.name}: ${sender.preview}`);
        }
      });
    });
  }

  function displayClassmates(classmates) {
    classmateGrid.innerHTML = "";
    if (classmates.length === 0) {
      classmateGrid.innerHTML = "<p>No classmates found.</p>";
      return;
    }
    classmates.forEach(classmate => {
      // Check if there are any study buddy requests for this classmate
      const sentRequest = studyBuddyRequests.sent[classmate.id];
      const receivedRequest = studyBuddyRequests.received[classmate.id];
      
      let badgeHtml = '';
      let buttonText = 'Study Buddy Request';
      let buttonDisabled = '';
      let messageButtonHtml = '';
      let requestId = '';
      
      // Handle sent requests
      if (sentRequest) {
        requestId = sentRequest.id;
        if (sentRequest.status === 'pending') {
          badgeHtml = '<div class="pending-badge">Request Pending</div>';
          buttonText = 'Request Pending';
          buttonDisabled = 'disabled';
        } else if (sentRequest.status === 'accepted') {
          badgeHtml = '<div class="accepted-badge">Study Buddy</div>';
          messageButtonHtml = `<button class="message-buddy-btn" data-request-id="${sentRequest.id}" data-receiver-id="${classmate.id}">Message</button>`;
          buttonText = '';  // Don't show the study buddy button
          buttonDisabled = 'disabled style="display: none;"';  // Hide the button completely
        } else if (sentRequest.status === 'declined') {
          buttonText = 'Request Again';
        }
      }
      
      // Handle received requests
      if (receivedRequest) {
        requestId = receivedRequest.id;
        if (receivedRequest.status === 'pending') {
          badgeHtml = '<div class="pending-badge">New Request</div>';
          buttonText = 'Respond to Request';
        } else if (receivedRequest.status === 'accepted') {
          badgeHtml = '<div class="accepted-badge">Study Buddy</div>';
          messageButtonHtml = `<button class="message-buddy-btn" data-request-id="${receivedRequest.id}" data-receiver-id="${classmate.id}">Message</button>`;
          buttonText = '';  // Don't show the study buddy button
          buttonDisabled = 'disabled style="display: none;"';  // Hide the button completely
        }
      }

      const card = document.createElement('div');
      card.className = "classmate-card";
      card.innerHTML = `
        ${badgeHtml}
        <div class="classmate-avatar">
          <img src="${classmate.profile_picture || '/static/assets/profile_picture.png'}" alt="${classmate.fname} ${classmate.lname}">
        </div>
        <div class="classmate-info">
          <div class="name-container">
            <h3>${classmate.fname} ${classmate.lname}</h3>
          </div>
          <p>Classes in common: ${classmate.common_classes ? classmate.common_classes.join(', ') : "N/A"}</p>
        </div>
      `;
      classmateGrid.appendChild(card);

      // If we have a message button, add it first (it will be at the bottom right)
      if (messageButtonHtml) {
        card.insertAdjacentHTML('beforeend', messageButtonHtml);
        
        // Add event listener to the message button
        const messageBtn = card.querySelector('.message-buddy-btn');
        messageBtn.addEventListener('click', (e) => {
          e.preventDefault();
          const requestId = e.target.getAttribute('data-request-id');
          const receiverId = e.target.getAttribute('data-receiver-id');
          openMessagingModal(classmate, requestId, receiverId);
        });
      }

      // Add study buddy button if needed
      if (buttonText) {
        const studyBuddyBtn = document.createElement('button');
        studyBuddyBtn.className = 'study-buddy-btn';
        studyBuddyBtn.setAttribute('data-classmate-id', classmate.id);
        studyBuddyBtn.setAttribute('data-classmate-name', `${classmate.fname} ${classmate.lname}`);
        studyBuddyBtn.setAttribute('data-request-type', receivedRequest ? 'received' : 'send');
        studyBuddyBtn.setAttribute('data-request-id', requestId);
        
        if (buttonDisabled) {
          studyBuddyBtn.setAttribute('disabled', 'disabled');
          if (buttonDisabled.includes('display: none')) {
            studyBuddyBtn.style.display = 'none';
          }
        }
        
        studyBuddyBtn.textContent = buttonText;
        card.appendChild(studyBuddyBtn);
        
        // Add event listener to the study buddy button if not disabled
        if (!buttonDisabled) {
          studyBuddyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const requestType = e.target.getAttribute('data-request-type');
            
            if (requestType === 'received') {
              openResponseModal(classmate, receivedRequest);
            } else {
              openStudyBuddyModal(classmate);
            }
          });
        }
      }
    });
  }

  function openStudyBuddyModal(classmate) {
    const modal = document.querySelector('.study-buddy-modal');
    const classmateIdInput = document.getElementById('classmate-id');
    const classmateNameInput = document.getElementById('classmate-name');
    const courseSelect = document.getElementById('course-select');
    const successMessage = document.querySelector('.success-message');
    
    // Reset the form
    document.querySelector('.study-buddy-form').reset();
    successMessage.style.display = 'none';
    
    // Set the classmate ID and name
    classmateIdInput.value = classmate.id;
    classmateNameInput.value = `${classmate.fname} ${classmate.lname}`;
    
    // Populate course select with common courses
    courseSelect.innerHTML = '<option value="">Select a course...</option>';
    if (classmate.common_classes && classmate.common_classes.length > 0) {
      classmate.common_classes.forEach(course => {
        const option = document.createElement('option');
        option.value = course;
        option.textContent = course;
        courseSelect.appendChild(option);
      });
    }
    
    // Display the modal
    modal.style.display = 'flex';
  }

  function closeStudyBuddyModal() {
    const modal = document.querySelector('.study-buddy-modal');
    modal.style.display = 'none';
  }

  function sendStudyBuddyRequest(event) {
    event.preventDefault();
    
    const classmateId = document.getElementById('classmate-id').value;
    const classmateName = document.getElementById('classmate-name').value;
    const course = document.getElementById('course-select').value;
    const message = document.getElementById('message').value;
    const successMessage = document.querySelector('.success-message');
    
    if (!course || !message) {
      alert('Please fill out all fields');
      return;
    }
    
    const requestData = {
      sender_email: currentUserEmail,
      receiver_id: classmateId,
      course: course,
      message: message
    };
    
    // Send the request to the server
    fetch('/api/study-buddy/request/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      console.log('Success:', data);
      
      // Store the request locally
      studyBuddyRequests.sent[classmateId] = {
        status: 'pending',
        course: course,
        date: new Date().toISOString()
      };
      
      // Show success message
      successMessage.style.display = 'block';
      
      // Close the modal after 2 seconds and refresh the display
      setTimeout(() => {
        closeStudyBuddyModal();
        // Refresh the display to show the pending badge
        sortAndDisplay();
      }, 2000);
    })
    .catch((error) => {
      console.error('Error:', error);
      alert('There was an error sending your request. Please try again.');
    });
  }

  function loadStudyBuddyRequests() {
    if (!currentUserEmail) return;
    
    fetch(`/api/study-buddy/requests/${encodeURIComponent(currentUserEmail)}/`, {
      headers: {
        'Accept': 'application/json'
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to load study buddy requests (status ${response.status})`);
      }
      return response.json();
    })
    .then(data => {
      console.log('Study buddy requests data:', data);
      
      // Map the sent requests by classmate ID for easy lookup
      studyBuddyRequests.sent = (data.sent_requests || []).reduce((acc, request) => {
        acc[request.receiver_id] = {
          id: request.id,
          status: request.status,
          course: request.course,
          date: request.created_at
        };
        return acc;
      }, {});
      
      // Map the received requests by classmate ID for easy lookup
      studyBuddyRequests.received = (data.received_requests || []).reduce((acc, request) => {
        acc[request.sender_id] = {
          id: request.id,
          status: request.status,
          course: request.course,
          message: request.message,
          date: request.created_at
        };
        return acc;
      }, {});
      
      console.log('Processed study buddy requests:', studyBuddyRequests);
      
      // Refresh the display to show the badges
      sortAndDisplay();
    })
    .catch(error => {
      console.error("Error fetching study buddy requests:", error);
    });
  }

  function performSearch() {
    const query = searchInput.value.toLowerCase().trim();
    if (query === "") {
      displayedClassmates = [...allClassmates];
    } else {
      displayedClassmates = allClassmates.filter(cm => {
        const fullName = `${cm.fname} ${cm.lname}`.toLowerCase();
        const classes = (cm.common_classes || []).join(' ').toLowerCase();
        return fullName.includes(query) || classes.includes(query);
      });
    }
    sortAndDisplay();
  }

  function sortAndDisplay() {
    const filterValue = filterSelect.value;
    let sorted = [...displayedClassmates];
    if (filterValue === "a-z") {
      sorted.sort((a, b) => {
        const nameA = `${a.fname} ${a.lname}`.toLowerCase();
        const nameB = `${b.fname} ${b.lname}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });
    } else if (filterValue === "newest-oldest") {
      if (sorted.length > 0 && sorted[0].join_date) {
        sorted.sort((a, b) => new Date(b.join_date) - new Date(a.join_date));
      }
    } else if (filterValue === "oldest-newest") {
      if (sorted.length > 0 && sorted[0].join_date) {
        sorted.sort((a, b) => new Date(a.join_date) - new Date(b.join_date));
      } else {
        sorted.reverse();
      }
    }
    displayClassmates(sorted);
  }

  // Set up event listeners
  if (searchBtn) {
    searchBtn.addEventListener('click', performSearch);
  }
  
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        performSearch();
      }
    });
  }
  
  if (filterSelect) {
    filterSelect.addEventListener('change', sortAndDisplay);
  }
  
  // Modal event listeners
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('close-modal')) {
      closeStudyBuddyModal();
    }
  });
  
  window.addEventListener('click', (e) => {
    const modal = document.querySelector('.study-buddy-modal');
    if (e.target === modal) {
      closeStudyBuddyModal();
    }
  });
  
  // Submit form listener
  document.querySelector('.study-buddy-form')?.addEventListener('submit', sendStudyBuddyRequest);

  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUserEmail = user.email;
      currentUserId = user.uid;
      
      // Fetch classmates
      fetch(`/api/my_classmates/${encodeURIComponent(currentUserEmail)}/`, {
        headers: {
          'Accept': 'application/json'
        }
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load classmates (status ${response.status})`);
        }
        return response.json();
      })
      .then(data => {
        allClassmates = data;
        displayedClassmates = [...allClassmates];
        
        // Load study buddy requests after getting classmates
        loadStudyBuddyRequests();
        
        // Start real-time message updates
        startMessageUpdates();
      })
      .catch(error => {
        console.error("Error fetching classmates:", error);
        classmateGrid.innerHTML = "<p>Error loading classmates. Please try again later.</p>";
      });
    } else {
      // Redirect to login if no user is authenticated
      window.location.href = '/login/';
    }
  });

  // Add the response modal HTML to the document if it doesn't exist
  function createResponseModal() {
    if (!document.querySelector('.response-modal')) {
      const modalHtml = `
        <div class="response-modal study-buddy-modal">
          <div class="study-buddy-modal-content">
            <button class="close-modal">&times;</button>
            <div class="response-content">
              <h3>Study Buddy Request</h3>
              <p><strong>From:</strong> <span id="sender-name"></span></p>
              <p><strong>Course:</strong> <span id="request-course"></span></p>
              <p><strong>Message:</strong></p>
              <div id="request-message" class="message-box"></div>
              <div class="response-actions">
                <button id="accept-request" class="submit-request accept">Accept</button>
                <button id="decline-request" class="submit-request decline">Decline</button>
              </div>
              <div class="success-message">Response sent successfully!</div>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHtml);
      
      // Add event listeners for the response modal
      const responseModal = document.querySelector('.response-modal');
      const closeModalBtn = responseModal.querySelector('.close-modal');
      const acceptBtn = document.getElementById('accept-request');
      const declineBtn = document.getElementById('decline-request');
      
      closeModalBtn.addEventListener('click', () => {
        responseModal.style.display = 'none';
      });
      
      window.addEventListener('click', (e) => {
        if (e.target === responseModal) {
          responseModal.style.display = 'none';
        }
      });
      
      acceptBtn.addEventListener('click', () => handleResponse('accepted'));
      declineBtn.addEventListener('click', () => handleResponse('declined'));
    }
  }

  // Open the response modal to accept/decline a request
  function openResponseModal(classmate, request) {
    createResponseModal();
    
    const modal = document.querySelector('.response-modal');
    document.getElementById('sender-name').textContent = `${classmate.fname} ${classmate.lname}`;
    document.getElementById('request-course').textContent = request.course;
    document.getElementById('request-message').textContent = request.message;
    
    // Store the request ID for the response handler
    modal.dataset.requestId = request.id;
    
    // Show the modal
    modal.style.display = 'flex';
    document.querySelector('.response-modal .success-message').style.display = 'none';
  }

  // Handle the response (accept/decline)
  function handleResponse(status) {
    const modal = document.querySelector('.response-modal');
    const requestId = modal.dataset.requestId;
    const successMessage = modal.querySelector('.success-message');
    
    fetch(`/api/study-buddy/requests/${requestId}/update/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      console.log('Response success:', data);
      
      // Update the local state
      Object.keys(studyBuddyRequests.received).forEach(senderId => {
        const request = studyBuddyRequests.received[senderId];
        if (request.id == requestId) {
          request.status = status;
        }
      });
      
      // Show success message
      successMessage.textContent = `Request ${status}!`;
      successMessage.style.display = 'block';
      
      // Close the modal after a delay and refresh the display
      setTimeout(() => {
        modal.style.display = 'none';
        sortAndDisplay();
      }, 2000);
    })
    .catch(error => {
      console.error('Error:', error);
      alert(`There was an error ${status === 'accepted' ? 'accepting' : 'declining'} the request. Please try again.`);
    });
  }

  // Create the messaging modal if it doesn't exist
  function createMessagingModal() {
    if (!document.querySelector('.messaging-modal')) {
      const modalHtml = `
        <div class="messaging-modal">
          <div class="messaging-modal-content">
            <div class="messaging-header">
              <div class="chat-recipient-info">
                <h3>Chatting with <span id="chat-recipient-name"></span></h3>
                <div class="chat-status"><span class="status-indicator"></span><span class="status-text">online</span></div>
              </div>
              <div class="header-actions">
                <button class="header-action close-modal" title="Close">&times;</button>
              </div>
            </div>
            <div class="messages-container" id="messages-container">
              <div class="no-messages">No messages yet. Send the first one!</div>
            </div>
            <div class="message-typing-indicator" style="display: none;">
              <span></span><span></span><span></span>
            </div>
            <form class="message-form" id="message-form">
              <input type="hidden" id="message-request-id">
              <input type="hidden" id="message-receiver-id">
              <textarea class="message-input" id="message-input" placeholder="Type a message..." required></textarea>
              <button type="submit" class="send-message-btn" title="Send message">➤</button>
            </form>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHtml);
      
      // Add event listeners for the messaging modal
      const messagingModal = document.querySelector('.messaging-modal');
      const closeModalBtn = messagingModal.querySelector('.close-modal');
      const messageForm = document.getElementById('message-form');
      
      closeModalBtn.addEventListener('click', () => {
        messagingModal.style.display = 'none';
      });
      
      window.addEventListener('click', (e) => {
        if (e.target === messagingModal) {
          messagingModal.style.display = 'none';
        }
      });
      
      messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        sendMessage();
      });
      
      // Add keyboard shortcuts
      const messageInput = document.getElementById('message-input');
      messageInput.addEventListener('keydown', (e) => {
        // Send message on Enter (but not with Shift+Enter for new line)
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
      
      // Auto-resize the message input
      messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight > 100 ? 100 : this.scrollHeight) + 'px';
        
        // Show typing indicator to the other user (simulated in this version)
        const typingIndicator = document.querySelector('.message-typing-indicator');
        if (this.value.trim().length > 0) {
          // Show typing indicator to the other user would be implemented with websockets
          // For now, we'll just simulate it
          if (Math.random() > 0.7) { // Randomly show the indicator sometimes
            typingIndicator.style.display = 'flex';
            setTimeout(() => {
              typingIndicator.style.display = 'none';
            }, 2000);
          }
        }
      });
    }
  }
  
  // Open the messaging modal
  function openMessagingModal(classmate, requestId, receiverId) {
    createMessagingModal();
    
    const modal = document.querySelector('.messaging-modal');
    document.getElementById('chat-recipient-name').textContent = `${classmate.fname} ${classmate.lname}`;
    document.getElementById('message-request-id').value = requestId;
    document.getElementById('message-receiver-id').value = receiverId;
    
    // Load messages
    loadMessages(requestId);
    
    // Mark messages as read
    markMessagesAsRead(requestId);
    
    // Simulate random online status
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.querySelector('.status-text');
    
    if (Math.random() > 0.3) { // 70% chance to be online
      statusIndicator.classList.add('online');
      statusIndicator.classList.remove('offline');
      statusText.textContent = 'online';
    } else {
      statusIndicator.classList.add('offline');
      statusIndicator.classList.remove('online');
      statusText.textContent = 'offline';
    }
    
    // Show the modal
    modal.style.display = 'flex';
    
    // Focus on the message input
    setTimeout(() => {
      document.getElementById('message-input').focus();
    }, 100);
  }
  
  // Load messages for the current chat
  function loadMessages(requestId) {
    const messagesContainer = document.getElementById('messages-container');
    
    // Prevent duplicate requests - if a request is in progress, don't start another
    if (window.loadingMessages) {
      return;
    }
    
    // Set flag to indicate a request is in progress
    window.loadingMessages = true;
    
    // Show loading indicator if this is the first load
    if (!messagesContainer.classList.contains('loaded')) {
      messagesContainer.innerHTML = '<div class="loading-messages">Loading messages...</div>';
    }
    
    fetch(`/api/study-buddy/requests/${requestId}/messages/`, {
      headers: {
        'Accept': 'application/json'
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to load messages (status ${response.status})`);
      }
      return response.json();
    })
    .then(data => {
      // Clear the loading flag
      window.loadingMessages = false;
      
      // If this is a refresh and we have no new messages, don't redraw the UI
      if (messagesContainer.classList.contains('loaded') && messagesContainer.dataset.messageCount == data.messages.length) {
        return;
      }
      
      // Update the UI with messages
      if (data.messages && data.messages.length > 0) {
        // Store the scroll position and check if we're at the bottom
        const isAtBottom = isScrolledToBottom(messagesContainer);
        
        // Store message count for future comparisons
        messagesContainer.dataset.messageCount = data.messages.length;
        
        // Display the messages
        displayMessages(data.messages);
        
        // Mark container as loaded
        messagesContainer.classList.add('loaded');
        
        // If we were already at the bottom, scroll to bottom again
        if (isAtBottom) {
          scrollToBottom(messagesContainer);
        } else {
          // Show "new messages" indicator if we received new messages and aren't at bottom
          if (messagesContainer.dataset.messageCount > 0) {
            showNewMessageIndicator(messagesContainer);
          }
        }
      } else {
        messagesContainer.innerHTML = '<div class="no-messages">No messages yet. Send the first one!</div>';
      }
    })
    .catch(error => {
      // Clear the loading flag on error
      window.loadingMessages = false;
      
      console.error("Error fetching messages:", error);
      
      // Only show error if this is the first load
      if (!messagesContainer.classList.contains('loaded')) {
        messagesContainer.innerHTML = '<div class="error-message">Error loading messages. Please try again.</div>';
      }
    });
    
    // Set up auto-refresh of messages
    setupMessageRefresh(requestId);
  }
  
  // Check if container is scrolled to bottom
  function isScrolledToBottom(container) {
    return Math.abs(container.scrollHeight - container.clientHeight - container.scrollTop) < 20;
  }
  
  // Scroll to bottom of container
  function scrollToBottom(container) {
    container.scrollTop = container.scrollHeight;
  }
  
  // Show new message indicator
  function showNewMessageIndicator(container) {
    // Remove any existing indicator
    const existingIndicator = document.querySelector('.new-messages-indicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }
    
    // Add new indicator
    const indicator = document.createElement('div');
    indicator.className = 'new-messages-indicator';
    indicator.textContent = 'New messages ↓';
    indicator.addEventListener('click', () => {
      scrollToBottom(container);
      indicator.remove();
    });
    
    // Add to DOM
    document.querySelector('.messaging-modal-content').appendChild(indicator);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.classList.add('hiding');
        setTimeout(() => {
          if (indicator.parentNode) {
            indicator.remove();
          }
        }, 300);
      }
    }, 5000);
  }
  
  // Set up auto-refresh of messages
  function setupMessageRefresh(requestId) {
    // Reduce polling frequency to avoid flooding the server with requests
    const POLLING_INTERVAL = 10000; // Change from 3s to 10s
    
    // Clear any existing refresh interval
    if (window.messageRefreshInterval) {
      clearInterval(window.messageRefreshInterval);
      window.messageRefreshInterval = null;
    }
    
    // Check for new messages every 10 seconds (less frequent)
    window.messageRefreshInterval = setInterval(() => {
      // Only refresh if the modal is visible
      const modal = document.querySelector('.messaging-modal');
      if (modal && modal.style.display === 'flex') {
        console.log("Checking for new messages...");
        loadMessages(requestId);
      } else {
        // Clear interval if modal is closed
        clearInterval(window.messageRefreshInterval);
        window.messageRefreshInterval = null;
      }
    }, POLLING_INTERVAL);
  }
  
  // Display messages in the container
  function displayMessages(messages) {
    const messagesContainer = document.getElementById('messages-container');
    messagesContainer.innerHTML = '';
    
    if (!messages || messages.length === 0) {
      messagesContainer.innerHTML = '<div class="no-messages">No messages yet. Send the first one!</div>';
      return;
    }
    
    let currentDate = '';
    let lastSenderId = null;
    let messageGroups = [];
    let currentGroup = null;
    
    // First, group messages by sender and time proximity
    messages.forEach((message, index) => {
      const messageDate = new Date(message.created_at).toLocaleDateString();
      const messageTime = new Date(message.created_at);
      const isCurrentUser = message.sender_id.toString() === currentUserId;
      
      // Start a new group if:
      // 1. This is the first message
      // 2. The date changes
      // 3. The sender changes
      // 4. More than 5 minutes have passed since the last message
      const needsNewGroup = !currentGroup || 
                           messageDate !== currentDate || 
                           message.sender_id !== lastSenderId ||
                           (index > 0 && messageTime - new Date(messages[index-1].created_at) > 300000);
      
      if (needsNewGroup) {
        // If we had a previous group, push it to the groups array
        if (currentGroup) {
          messageGroups.push(currentGroup);
        }
        
        // Create a new group
        currentGroup = {
          date: messageDate,
          senderId: message.sender_id,
          senderName: message.sender_name,
          isCurrentUser: isCurrentUser,
          messages: []
        };
        
        // If the date changed, mark it for adding a date divider
        if (messageDate !== currentDate) {
          currentGroup.showDateDivider = true;
          currentDate = messageDate;
        }
      }
      
      // Add this message to the current group
      currentGroup.messages.push({
        content: message.content,
        time: messageTime,
        isRead: message.is_read
      });
      
      lastSenderId = message.sender_id;
    });
    
    // Add the last group if it exists
    if (currentGroup) {
      messageGroups.push(currentGroup);
    }
    
    // Now render the message groups
    messageGroups.forEach(group => {
      // Add date divider if needed
      if (group.showDateDivider) {
        const divider = document.createElement('div');
        divider.className = 'message-date-divider';
        
        // Format date in a more friendly way
        const dateObj = new Date(group.messages[0].time);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        let dateText;
        if (dateObj.toDateString() === today.toDateString()) {
          dateText = 'Today';
        } else if (dateObj.toDateString() === yesterday.toDateString()) {
          dateText = 'Yesterday';
        } else {
          dateText = dateObj.toLocaleDateString(undefined, { 
            weekday: 'long', 
            month: 'short', 
            day: 'numeric' 
          });
        }
        
        divider.innerHTML = `<span>${dateText}</span>`;
        messagesContainer.appendChild(divider);
      }
      
      // Create message group container with proper alignment class
      const groupContainer = document.createElement('div');
      groupContainer.className = `message-group ${group.isCurrentUser ? 'sent-group' : 'received-group'}`;
      
      // Add sender name for received messages
      if (!group.isCurrentUser) {
        const senderElement = document.createElement('div');
        senderElement.className = 'message-sender';
        senderElement.textContent = group.senderName;
        groupContainer.appendChild(senderElement);
      }
      
      // Add each message in the group
      group.messages.forEach((msg, i) => {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${group.isCurrentUser ? 'message-sent' : 'message-received'}`;
        
        // Add position classes for bubble styling
        if (group.messages.length > 1) {
          if (i === 0) {
            messageEl.classList.add('first-in-group');
          } else if (i === group.messages.length - 1) {
            messageEl.classList.add('last-in-group');
          } else {
            messageEl.classList.add('middle-in-group');
          }
        } else {
          messageEl.classList.add('single-in-group');
        }
        
        // Format time
        const time = msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Check if the message contains a URL and make it clickable
        const content = formatMessageContent(msg.content);
        
        messageEl.innerHTML = `
          <div class="message-content">${content}</div>
          <div class="message-metadata">
            <span class="message-time">${time}</span>
            ${group.isCurrentUser ? `<span class="message-status">${msg.isRead ? '✓✓' : '✓'}</span>` : ''}
          </div>
        `;
        
        groupContainer.appendChild(messageEl);
      });
      
      messagesContainer.appendChild(groupContainer);
    });
    
    // Scroll to bottom of container
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  
  // Format message content - detect links, emojis, etc.
  function formatMessageContent(content) {
    if (!content) return '';
    
    // Convert URLs to clickable links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const contentWithLinks = content.replace(urlRegex, url => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });
    
    // You could add more formatting here: emoji detection, mentions, hashtags, etc.
    
    return contentWithLinks;
  }
  
  // Send a new message
  function sendMessage() {
    const requestId = document.getElementById('message-request-id').value;
    const receiverId = document.getElementById('message-receiver-id').value;
    const content = document.getElementById('message-input').value.trim();
    
    if (!content) return;
    
    // Disable the input and button while sending
    const messageInput = document.getElementById('message-input');
    const sendButton = document.querySelector('.send-message-btn');
    messageInput.disabled = true;
    sendButton.disabled = true;
    
    const messageData = {
      sender_email: currentUserEmail,
      receiver_id: receiverId,
      content: content
    };
    
    fetch(`/api/study-buddy/requests/${requestId}/messages/send/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageData)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      console.log('Message sent:', data);
      
      // Clear input and re-enable
      messageInput.value = '';
      messageInput.style.height = 'auto';
      messageInput.disabled = false;
      sendButton.disabled = false;
      messageInput.focus();
      
      // Add the message locally for immediate feedback
      const messagesContainer = document.getElementById('messages-container');
      const noMessages = messagesContainer.querySelector('.no-messages');
      if (noMessages) {
        noMessages.remove();
      }
      
      // Create a group container for proper alignment
      const groupContainer = document.createElement('div');
      groupContainer.className = 'message-group sent-group';
      
      // Create the message element
      const messageEl = document.createElement('div');
      messageEl.className = 'message message-sent single-in-group';
      
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      messageEl.innerHTML = `
        <div class="message-content">${content}</div>
        <div class="message-metadata">
          <span class="message-time">${time}</span>
          <span class="message-status">✓</span>
        </div>
      `;
      
      // Add the message to the group and the group to the container
      groupContainer.appendChild(messageEl);
      messagesContainer.appendChild(groupContainer);
      
      // Scroll to bottom
      scrollToBottom(messagesContainer);
      
      // Then reload all messages to ensure synced state
      setTimeout(() => loadMessages(requestId), 500);
    })
    .catch(error => {
      console.error('Error sending message:', error);
      alert('There was an error sending your message. Please try again.');
      
      // Re-enable input and button
      messageInput.disabled = false;
      sendButton.disabled = false;
    });
  }
  
  // Mark messages as read
  function markMessagesAsRead(requestId) {
    fetch(`/api/study-buddy/requests/${requestId}/messages/read/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_email: currentUserEmail })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      console.log('Messages marked as read:', data);
    })
    .catch(error => {
      console.error('Error marking messages as read:', error);
    });
  }

  // Update the chat status indicator
  function updateChatStatus(status) {
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.querySelector('.status-text');
    
    
    
    if (statusIndicator && statusText) {
      if (status === 'online') {
        statusIndicator.classList.add('online');
        statusIndicator.classList.remove('offline');
        statusText.textContent = 'online';
      } else {
        statusIndicator.classList.add('offline');
        statusIndicator.classList.remove('online');
        statusText.textContent = 'offline';
      }
    }
  }
});
