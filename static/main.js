// Ask for the user's name on entering the page
const clientId = prompt("Please enter your name for the chat:");

// Make sure the user entered a name
if (!clientId) {
    alert("You must enter a name to join the chat.");
    window.location.reload(); // Reload if they cancel
}

// Establish a WebSocket connection to FastAPI backend
// Note the "ws://" protocol instead of "http://"
const ws = new WebSocket(`wss://asynced-realtime-chat-app.onrender.com/ws/${clientId}`);

const form = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const messagesDiv = document.getElementById('messages');

// Function to add a message to the chat window
function addMessage(message, type) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', type);
    messageElement.textContent = message;
    messagesDiv.appendChild(messageElement);
    // Scroll to the bottom to see the latest message
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Handle incoming messages from the server
ws.onmessage = function(event) {
    const message = event.data;
    // Check if the message is from this client or another
    if (message.startsWith(`Client #${clientId}:`)) {
        // It's a message this user sent, but broadcast back
        // Give it the "sent" style
        addMessage(message.replace(`Client #${clientId}: `, ''), 'sent');
    } else if (message.includes("has joined") || message.includes("has left")) {
        // It's a system message
        addMessage(message, 'system');
    } else {
        // It's a message from another user
        addMessage(message, 'received');
    }
};

// Handle form submission to send a message
form.addEventListener('submit', function(event) {
    event.preventDefault();
    const message = messageInput.value;
    if (message) {
        ws.send(message);
        messageInput.value = ''; // Clear the input box
    }
});

// Handle WebSocket connection errors
ws.onerror = function(event) {
    addMessage("Connection to server failed. Please refresh the page.", 'system');
    console.error("WebSocket error observed:", event);
};

// Handle WebSocket connection closing
ws.onclose = function(event) {
    addMessage("You have been disconnected.", 'system');
};