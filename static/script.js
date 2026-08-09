let currentUser = "";
let currentRole = "";
let pollInterval = null;
let selectedFile = null;

async function joinChat() {
    const username = document.getElementById('username-input').value.trim();
    const passcode = document.getElementById('passcode-input').value.trim();

    if (!username || !passcode) {
        alert("Please enter both name and passcode.");
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
            currentRole = result.role;

            document.getElementById('user-display-name').innerText = currentUser;
            document.getElementById('user-role-badge').innerText = currentRole.toUpperCase();

            if (currentRole === 'owner') {
                document.getElementById('owner-panel-btn').style.display = 'block';
            }

            document.getElementById('login-section').style.display = 'none';
            document.getElementById('chat-section').style.display = 'flex';

            loadMessages();
            pollInterval = setInterval(loadMessages, 2000);
        } else {
            alert(result.message);
        }
    } catch (err) {
        alert("Server connection error.");
    }
}

async function sendMessage() {
    const input = document.getElementById('message-input');
    const text = input.value.trim();

    if (!text && !selectedFile) return;

    const formData = new FormData();
    formData.append('user', currentUser);
    formData.append('role', currentRole);
    formData.append('text', text);
    if (selectedFile) {
        formData.append('file', selectedFile);
    }

    try {
        const response = await fetch('/send_message', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            input.value = "";
            selectedFile = null;
            document.getElementById('file-preview-indicator').style.display = 'none';
            document.getElementById('media-input').value = "";
            loadMessages();
        } else {
            const res = await response.json();
            alert(res.message);
        }
    } catch (err) {
        console.error("Send error:", err);
    }
}

async function loadMessages() {
    try {
        const response = await fetch('/get_messages');
        const messages = await response.json();
        const chatBox = document.getElementById('chat-box');

        chatBox.innerHTML = "";
        messages.forEach(msg => {
            const isMine = msg.user === currentUser ? "mine" : "";
            const roleTag = msg.role === "owner" ? "👑 " : "";

            let mediaHTML = "";
            if (msg.media_url) {
                if (msg.media_type === "image") {
                    mediaHTML = `<div class="msg-media"><img src="${msg.media_url}" /></div>`;
                } else if (msg.media_type === "video") {
                    mediaHTML = `<div class="msg-media"><video src="${msg.media_url}" controls></video></div>`;
                }
            }

            chatBox.innerHTML += `
                <div class="msg-bubble ${isMine}">
                    <div class="msg-header">
                        <span>${roleTag}${msg.user}</span>
                        <span class="msg-time">${msg.time}</span>
                    </div>
                    ${msg.text ? `<div class="msg-text">${msg.text}</div>` : ""}
                    ${mediaHTML}
                </div>
            `;
        });

        chatBox.scrollTop = chatBox.scrollHeight;
    } catch (err) {
        console.error("Fetch error:", err);
    }
}

function handleFileSelect() {
    const fileInput = document.getElementById('media-input');
    if (fileInput.files.length > 0) {
        selectedFile = fileInput.files[0];
        const indicator = document.getElementById('file-preview-indicator');
        indicator.innerText = `📎 Attached: ${selectedFile.name}`;
        indicator.style.display = 'block';
    }
}

function addEmoji(emoji) {
    const input = document.getElementById('message-input');
    input.value += emoji;
    input.focus();
}

function toggleAdminPanel() {
    const panel = document.getElementById('admin-panel');
    if (panel.style.display === 'none') {
        panel.style.display = 'block';
        loadAdminUserLogs();
    } else {
        panel.style.display = 'none';
    }
}

async function loadAdminUserLogs() {
    try {
        const response = await fetch('/admin/users');
        const users = await response.json();
        const container = document.getElementById('admin-user-list');

        container.innerHTML = "";
        users.forEach(u => {
            const btnText = u.blocked ? "Unblock" : "Block";
            const btnClass = u.blocked ? "btn-unblock" : "btn-block";

            container.innerHTML += `
                <div class="user-card">
                    <div>
                        <strong>${u.username} (${u.role})</strong><br>
                        <small>IP: ${u.ip} | Last: ${u.last_login}</small>
                    </div>
                    ${u.role !== 'owner' ? `<button class="${btnClass}" onclick="toggleUserBlock('${u.username}')">${btnText}</button>` : ''}
                </div>
            `;
        });
    } catch (err) {
        console.error("Admin load error:", err);
    }
}

async function toggleUserBlock(username) {
    try {
        const response = await fetch('/admin/toggle_block', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username, owner_name: currentUser })
        });

        if (response.ok) {
            loadAdminUserLogs();
        }
    } catch (err) {
        console.error("Block toggle error:", err);
    }
}

function handleKeyPress(e) {
    if (e.key === 'Enter') sendMessage();
}

function leaveChat() {
    clearInterval(pollInterval);
    document.getElementById('login-section').style.display = 'flex';
    document.getElementById('chat-section').style.display = 'none';
    currentUser = "";
    currentRole = "";
}
