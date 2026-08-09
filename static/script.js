let currentUser = "";
let pollInterval = null;

async function joinChat() {
    const username = document.getElementById('username-input').value.trim();
    const passcode = document.getElementById('passcode-input').value.trim();

    if (!username || !passcode) {
        alert("Please enter both your name and passcode.");
        return;
    }

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username, passcode: passcode })
        });

        const result = await response.json();

        if (response.ok) {
            currentUser = username;
            document.getElementById('user-display').innerText = currentUser;
            document.getElementById('login-section').style.display = 'none';
            document.getElementById('chat-section').style.display = 'block';

            loadMessages();
            // Automatically check for new messages every 2 seconds
            pollInterval = setInterval(loadMessages, 2000);
        } else {
            alert(result.message);
        }
    } catch (error) {
        alert("Could not connect to server.");
    }
}

async function sendMessage() {
    const input = document.getElementById('message-input');
    const text = input.value.trim();

    if (!text) return;

    try {
        const response = await fetch('/send_message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: currentUser, text: text })
        });

        if (response.ok) {
            input.value = "";
            loadMessages();
        }
    } catch (error) {
        console.error("Sending error:", error);
    }
}

async function loadMessages() {
    try {
        const response = await fetch('/get_messages');
        const messages = await response.json();
        const chatBox = document.getElementById('chat-box');

        chatBox.innerHTML = "";
        messages.forEach(msg => {
            chatBox.innerHTML += `
                <div class="msg-item">
                    <div class="msg-header">
                        <span class="msg-user">${msg.user}</span>
                        <span>${msg.time}</span>
                    </div>
                    <div class="msg-text">${msg.text}</div>
                </div>
            `;
        });

        chatBox.scrollTop = chatBox.scrollHeight;
    } catch (error) {
        console.error("Loading error:", error);
    }
}

function handleKeyPress(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
}

function leaveChat() {
    clearInterval(pollInterval);
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('chat-section').style.display = 'none';
    currentUser = "";
}
