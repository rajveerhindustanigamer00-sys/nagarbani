import os
from flask import Flask, request, jsonify, send_from_directory
from datetime import datetime

app = Flask(__name__)

# PASSCODES
OWNER_PASSCODE = "owner123"
MEMBER_PASSCODE = "family123"

# UPLOAD DIRECTORY FOR MEDIA
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# DATA STORES (In-memory)
messages = []
users_log = {}
blocked_users = set()
blocked_ips = set()

@app.route('/')
def home():
    return send_from_directory('.', 'index.html')

@app.route('/uploads/<filename>')
def serve_upload(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/login', methods=['POST'])
def login():
    data = request.json or {}
    username = data.get('username', '').strip()
    passcode = data.get('passcode', '').strip()
    ip = request.headers.get('X-Forwarded-For', request.remote_addr)

    if username in blocked_users or ip in blocked_ips:
        return jsonify({"status": "fail", "message": "You are blocked from Family Chat."}), 403

    if passcode == OWNER_PASSCODE:
        role = "owner"
    elif passcode == MEMBER_PASSCODE:
        role = "member"
    else:
        return jsonify({"status": "fail", "message": "Incorrect Passcode!"}), 401

    # Log user information
    users_log[username] = {
        "username": username,
        "role": role,
        "ip": ip,
        "last_login": datetime.now().strftime("%b %d, %I:%M %p"),
        "blocked": username in blocked_users
    }

    return jsonify({
        "status": "success",
        "role": role,
        "username": username,
        "message": f"Welcome, {username}!"
    })

@app.route('/send_message', methods=['POST'])
def send_message():
    username = request.form.get('user', '').strip()
    role = request.form.get('role', 'member')
    text = request.form.get('text', '').strip()
    file = request.files.get('file')
    ip = request.headers.get('X-Forwarded-For', request.remote_addr)

    if username in blocked_users or ip in blocked_ips:
        return jsonify({"status": "fail", "message": "You are blocked."}), 403

    media_url = None
    media_type = None

    if file:
        filename = f"{int(datetime.now().timestamp())}_{file.filename.replace(' ', '_')}"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        media_url = f"/uploads/{filename}"

        if file.content_type.startswith('image/'):
            media_type = 'image'
        elif file.content_type.startswith('video/'):
            media_type = 'video'

    if text or media_url:
        msg = {
            "id": len(messages) + 1,
            "user": username,
            "role": role,
            "text": text,
            "media_url": media_url,
            "media_type": media_type,
            "time": datetime.now().strftime("%I:%M %p")
        }
        messages.append(msg)
        if len(messages) > 100:
            messages.pop(0)

        return jsonify({"status": "success"})

    return jsonify({"status": "error", "message": "Empty message"}), 400

@app.route('/get_messages')
def get_messages():
    return jsonify(messages)

# OWNER CONTROLS
@app.route('/admin/users', methods=['GET'])
def admin_get_users():
    return jsonify(list(users_log.values()))

@app.route('/admin/toggle_block', methods=['POST'])
def admin_toggle_block():
    data = request.json or {}
    username = data.get('username')
    owner_name = data.get('owner_name')

    if users_log.get(owner_name, {}).get('role') != 'owner':
        return jsonify({"status": "fail", "message": "Unauthorized"}), 403

    if username in users_log:
        is_blocked = users_log[username].get('blocked', False)
        new_status = not is_blocked
        users_log[username]['blocked'] = new_status

        if new_status:
            blocked_users.add(username)
            blocked_ips.add(users_log[username]['ip'])
        else:
            blocked_users.discard(username)
            blocked_ips.discard(users_log[username]['ip'])

        return jsonify({"status": "success", "blocked": new_status})

    return jsonify({"status": "fail", "message": "User not found"}), 404

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
