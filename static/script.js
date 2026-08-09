// 1. ACCESS CONTROL: Unlocks the Admin Dashboard
function checkAccess() {
    const passwordInput = document.getElementById('password').value;
    
    if (passwordInput === "admin123") {
        // Hides the login box and shows the admin tools
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'block';
        alert("Nagarbani News Admin Access Granted!");
    } else {
        alert("Incorrect Security Key.");
    }
}

// 2. PUBLISHING: Sends News and Videos to the Engine
async function uploadContent() {
    const headline = document.getElementById('headline-input').value;
    const news = document.getElementById('news-input').value;
    const videoFile = document.getElementById('video-input').files;

    if (!headline || !videoFile) {
        alert("Please provide a headline and a video file.");
        return;
    }

    // Using FormData to bundle text and video for the Fetch API [1]
    const formData = new FormData();
    formData.append('headline', headline);
    formData.append('news', news);
    formData.append('video', videoFile);

    try {
        const response = await fetch('http://127.0.0.1:5000/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        alert(result.message); // Should say "Content Published!"
        
        // Refresh the gallery automatically to show the new post
        loadGallery();
    } catch (error) {
        console.error("Publishing Error:", error);
        alert("Failed to reach Nagarbani Engine. Check if app.py is running.");
    }
}

// 3. GALLERY: Fetches and displays all uploaded reports
async function loadGallery() {
    try {
        const response = await fetch('http://127.0.0.1:5000/list_content');
        const files = await response.json();
        const gallery = document.getElementById('video-gallery');
        
        gallery.innerHTML = ""; // Clear the gallery before reloading

        files.forEach(file => {
            // Creates a fancy card for each video report
            const card = `
                <div class="video-item card">
                    <h3>${file.split('.').replace(/-/g, ' ')}</h3>
                    <video controls>
                        <source src="/uploads/${file}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                </div>`;
            gallery.innerHTML += card;
        });
    } catch (error) {
        console.log("Gallery is empty or engine is offline.");
    }
}

// 4. AUTO-LOAD: Shows the news as soon as the site opens [2]
window.onload = loadGallery;