import os
import time
from flask import Flask, request, jsonify, send_from_directory
from datetime import datetime

app = Flask(__name__)

# MASTER OWNER PASSCODE
OWNER_PASSCODE = "owner123"

# UPLOAD DIRECTORY
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# IN-MEMORY USER DATABASE (Owner can inspect this)
users_db = [
    {
        "id": 1,
        "name": "Owner Admin",
        "email": "admin@nagarbani.com",
        "type": "Master Owner",
        "joined": "Jan 1, 2026",
        "last_login_ip": "127.0.0.1"
    }
]

# INITIAL 2026 NEWS FEED DATA
news_articles = [
    {
        "id": 1,
        "title": "Punjab Digital Infrastructure Plan 2026 Announced",
        "category": "Punjab News",
        "date": "Aug 09, 2026",
        "summary": "State government launches digital news and rural connectivity initiatives across Malwa region...",
        "body": "In a major announcement today, new digital media grants and high-speed fiber connectivity projects were greenlit across Sri Muktsar Sahib and surrounding districts. The initiative aims to connect local news portals directly with public administration feeds.",
        "media_url": "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80",
        "media_type": "image",
        "views": 1420
    },
    {
        "id": 2,
        "title": "Giddarbaha Canal Renovation Completed Ahead of Schedule",
        "category": "Local News",
        "date": "Jul 24, 2026",
        "summary": "Water canal repairs ensure steady irrigation for upcoming crop season...",
        "body": "Local agricultural authorities confirmed that essential canal maintenance has finished weeks before the target deadline. Farmers across the district expressed satisfaction with the boosted flow rates.",
        "media_url": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
        "media_type": "image",
        "views": 890
    },
    {
        "id": 3,
        "title": "Special Video Report: Regional Sports Meet 2026 Highlights",
        "category": "Video Report",
        "date": "Jun 12, 2026",
        "summary": "Watch key moments from the Muktsar Youth Athletics Competition...",
        "body": "Over 500 young athletes participated in this year's regional sports championship. Watch our video coverage highlighting track event finals and trophy presentations.",
        "media_url": "https://www.w3schools.com/html/mov_bbb.mp4",
        "media_type": "video",
        "views": 2300
    }
]

@app.route('/')
def home():
    return send_from_directory('.', 'index.html')

@app.route('/uploads/<filename>')
def serve_upload(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

# --- AUTHENTICATION ENDPOINTS ---

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '').strip()
    auth_provider = data.get('provider', 'Standard Password')

    if not email:
        return jsonify({"status": "fail", "message": "Email is required"}), 400

    # Check if user exists
    for u in users_db:
        if u['email'] == email:
            return jsonify({"status": "fail", "message": "Account already exists with this email!"}), 400

    user_ip = request.remote_addr or "Unknown IP"
    new_user = {
        "id": len(users_db) + 1,
        "name": name or "Anonymous User",
        "email": email,
        "password": password if auth_provider == 'Standard Password' else '[Google Auth OAuth Token]',
        "provider": auth_provider,
        "joined": datetime.now().strftime("%b %d, %Y - %H:%M"),
        "last_login_ip": user_ip
    }
    users_db.append(new_user)
    return jsonify({"status": "success", "message": "Account Created Successfully!", "user": new_user})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json or {}
    passcode = data.get('passcode', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '').strip()

    # OWNER MASTER LOGIN
    if passcode == OWNER_PASSCODE:
        return jsonify({
            "status": "success",
            "role": "owner",
            "message": "Master Owner Access Granted",
            "users_registry": users_db
        })

    # REGULAR USER LOGIN
    for u in users_db:
        if u['email'] == email and u.get('password') == password:
            u['last_login_ip'] = request.remote_addr or "Unknown IP"
            return jsonify({"status": "success", "role": "user", "message": f"Welcome back {u['name']}!", "user": u})

    return jsonify({"status": "fail", "message": "Invalid Credentials or Incorrect Passcode"}), 401

@app.route('/api/get_users', methods=['POST'])
def get_users():
    data = request.json or {}
    if data.get('passcode') == OWNER_PASSCODE:
        return jsonify({"status": "success", "users": users_db})
    return jsonify({"status": "fail", "message": "Unauthorized"}), 403

# --- NEWS FEED ENDPOINTS ---

@app.route('/api/publish', methods=['POST'])
def publish_news():
    passcode = request.form.get('passcode', '').strip()
    if passcode != OWNER_PASSCODE:
        return jsonify({"status": "fail", "message": "Unauthorized: Owner Passcode Required"}), 403

    title = request.form.get('title', '').strip()
    category = request.form.get('category', 'General').strip()
    summary = request.form.get('summary', '').strip()
    body = request.form.get('body', '').strip()
    file = request.files.get('file')

    if not title or not body:
        return jsonify({"status": "fail", "message": "Title and Body are required."}), 400

    media_url = "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80"
    media_type = "image"

    if file:
        filename = f"{int(time.time())}_{file.filename.replace(' ', '_')}"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        media_url = f"/uploads/{filename}"

        if file.content_type.startswith('video/'):
            media_type = 'video'

    article = {
        "id": len(news_articles) + 1,
        "title": title,
        "category": category,
        "date": datetime.now().strftime("%b %d, %Y"),
        "summary": summary or body[:100] + "...",
        "body": body,
        "media_url": media_url,
        "media_type": media_type,
        "views": 1
    }

    news_articles.insert(0, article)
    return jsonify({"status": "success", "message": "News Published to Feed!"})

@app.route('/api/get_news')
def get_news():
    return jsonify(news_articles)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
