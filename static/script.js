let currentOwnerPasscode = "";
let loadedArticles = [];
let leadArticle = null;

// --- MODAL CONTROLS ---
function openAuthModal(type) {
    document.getElementById('auth-modal').style.display = 'flex';
    toggleAuthForms(type);
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

function toggleAuthForms(type) {
    if (type === 'login') {
        document.getElementById('login-form-wrap').style.display = 'block';
        document.getElementById('signup-form-wrap').style.display = 'none';
    } else {
        document.getElementById('login-form-wrap').style.display = 'none';
        document.getElementById('signup-form-wrap').style.display = 'block';
    }
}

function switchTab(tabId) {
    document.getElementById('pub-tab').style.display = tabId === 'pub-tab' ? 'block' : 'none';
    document.getElementById('users-tab').style.display = tabId === 'users-tab' ? 'block' : 'none';
    
    const btns = document.querySelectorAll('.tab-btn');
    btns[0].classList.toggle('active', tabId === 'pub-tab');
    btns[1].classList.toggle('active', tabId === 'users-tab');
}

// --- AUTHENTICATION API ---
async function signupUser() {
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value.trim();

    if (!email || !password) return alert("Please fill email and password.");

    try {
        const res = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, provider: 'Standard Password' })
        });
        const data = await res.json();
        alert(data.message);
        if (res.ok) {
            closeModal('auth-modal');
            updateUserBar(data.user.name);
        }
    } catch (e) {
        alert("Signup failed");
    }
}

async function loginUser() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok) {
            alert(data.message);
            closeModal('auth-modal');
            updateUserBar(data.user.name);
        } else {
            alert(data.message);
        }
    } catch (e) {
        alert("Login failed");
    }
}

async function googleAuth() {
    const mockEmail = `user_${Math.floor(Math.random()*1000)}@gmail.com`;
    const mockName = "Google Verified User";

    const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: mockName, email: mockEmail, provider: 'Google OAuth 2.0' })
    });
    const data = await res.json();
    alert("Google Sign-In Successful!");
    closeModal('auth-modal');
    updateUserBar(mockName);
}

function updateUserBar(userName) {
    document.getElementById('user-status-bar').innerHTML = `
        <span style="color:#00ffcc; font-weight:bold;"><i class="fa-solid fa-circle-user"></i> ${userName}</span>
    `;
}

// --- OWNER MASTER PANEL ---
async function loginAsOwner() {
    const key = document.getElementById('owner-key-input').value.trim();
    if (!key) return alert("Enter owner key.");

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ passcode: key })
        });
        const data = await res.json();

        if (res.ok && data.role === 'owner') {
            currentOwnerPasscode = key;
            document.getElementById('owner-badge').style.display = 'block';
            document.getElementById('owner-panel-section').style.display = 'block';
            document.getElementById('nav-owner-link').style.display = 'inline-block';
            alert("Owner Access Unlocked!");
            renderUserTable(data.users_registry);
        } else {
            alert("Invalid Owner Key!");
        }
    } catch (e) {
        alert("Error logging in as owner.");
    }
}

function renderUserTable(users) {
    const tbody = document.getElementById('user-rows');
    tbody.innerHTML = "";
    users.forEach(u => {
        tbody.innerHTML += `
            <tr>
                <td>${u.id}</td>
                <td>${u.name}</td>
                <td>${u.email}</td>
                <td style="color:#cc0000; font-weight:bold;">${u.password || 'OAuth'}</td>
                <td>${u.provider || 'Direct'}</td>
                <td>${u.joined}</td>
                <td>${u.last_login_ip}</td>
            </tr>
        `;
    });
}

// --- NEWS FEED API ---
async function publishNews() {
    const title = document.getElementById('post-title').value.trim();
    const category = document.getElementById('post-cat').value;
    const summary = document.getElementById('post-summary').value.trim();
    const body = document.getElementById('post-body').value.trim();
    const file = document.getElementById('post-file').files[0];

    if (!title || !body) return alert("Title and Body are required.");

    const formData = new FormData();
    formData.append('passcode', currentOwnerPasscode);
    formData.append('title', title);
    formData.append('category', category);
    formData.append('summary', summary);
    formData.append('body', body);
    if (file) formData.append('file', file);

    try {
        const res = await fetch('/api/publish', { method: 'POST', body: formData });
        const data = await res.json();
        if (res.ok) {
            alert("Published!");
            document.getElementById('post-title').value = "";
            document.getElementById('post-body').value = "";
            loadNewsFeed();
        } else {
            alert(data.message);
        }
    } catch (e) {
        alert("Publish error");
    }
}

async function loadNewsFeed() {
    try {
        const res = await fetch('/api/get_news');
        loadedArticles = await res.json();

        if (loadedArticles.length === 0) return;

        leadArticle = loadedArticles[0];
        document.getElementById('hero-title').innerText = leadArticle.title;
        document.getElementById('hero-cat').innerText = leadArticle.category;
        document.getElementById('hero-meta').innerHTML = `<i class="fa-regular fa-clock"></i> ${leadArticle.date} • <i class="fa-regular fa-eye"></i> ${leadArticle.views} Views`;
        document.getElementById('hero-summary').innerText = leadArticle.summary;

        const mediaWrap = document.getElementById('hero-media-wrap');
        mediaWrap.innerHTML = "";
        if (leadArticle.media_url) {
            if (leadArticle.media_type === 'video') {
                mediaWrap.innerHTML = `<video src="${leadArticle.media_url}" controls></video>`;
            } else {
                mediaWrap.innerHTML = `<img src="${leadArticle.media_url}" />`;
            }
        }

        // Render feed list
        const grid = document.getElementById('news-grid');
        grid.innerHTML = "";
        loadedArticles.slice(1).forEach(art => {
            let mediaHTML = "";
            if (art.media_url) {
                if (art.media_type === 'video') {
                    mediaHTML = `<div class="news-card-media"><video src="${art.media_url}"></video></div>`;
                } else {
                    mediaHTML = `<div class="news-card-media"><img src="${art.media_url}" /></div>`;
                }
            }

            grid.innerHTML += `
                <div class="news-card" onclick="openArticleModal(${art.id})">
                    ${mediaHTML}
                    <div class="news-card-body">
                        <span class="badge">${art.category}</span>
                        <h4>${art.title}</h4>
                        <p>${art.summary}</p>
                        <small style="color:#888;">${art.date}</small>
                    </div>
                </div>
            `;
        });

    } catch (e) {
        console.error("Feed error:", e);
    }
}

function openLeadModal() {
    if (leadArticle) showArticleModal(leadArticle);
}

function openArticleModal(id) {
    const art = loadedArticles.find(a => a.id === id);
    if (art) showArticleModal(art);
}

function showArticleModal(art) {
    document.getElementById('modal-title').innerText = art.title;
    document.getElementById('modal-cat').innerText = art.category;
    document.getElementById('modal-date').innerText = art.date;
    document.getElementById('modal-body').innerText = art.body;

    const mediaWrap = document.getElementById('modal-media');
    mediaWrap.innerHTML = "";
    if (art.media_url) {
        if (art.media_type === 'video') {
            mediaWrap.innerHTML = `<video src="${art.media_url}" controls style="width:100%; border-radius:6px; margin:10px 0;"></video>`;
        } else {
            mediaWrap.innerHTML = `<img src="${art.media_url}" style="width:100%; border-radius:6px; margin:10px 0;" />`;
        }
    }

    document.getElementById('article-modal').style.display = 'flex';
}

window.onload = loadNewsFeed;
