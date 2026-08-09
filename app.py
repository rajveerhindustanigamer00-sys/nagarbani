from flask import Flask, request, jsonify, send_from_directory
from datetime import datetime

app = Flask(__name__)

# SET YOUR FAMILY PASSCODE HERE
FAMILY_PASSCODE = "family123"

# In-memory message list
messages = []

@app.route('/')
def home():
    return send_from_directory('.', 'index.html')

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    passcode = data.get('passcode')
    username = data.get('username')

    if passcode == FAMILY_PASSCODE:
        # Log login timestamp to console
        user_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {username} joined from IP: {user_ip}")
        return jsonify({"status": "success", "message": "Welcome to Family Chat!"})
    else:
        return jsonify({"status": "fail", "message": "Incorrect Family Passcode!"}), 401

@app.route('/send_message', methods=['POST'])
def send_message():
    data = request.json
    user = data.get('user')
    text = data.get('text')

    if user and text:
        new_msg = {
            "user": user,
            "text": text,
            "time": datetime.now().strftime("%I:%M %p")
        }
        messages.append(new_msg)
        
        # Keep only the last 100 messages in memory
        if len(messages) > 100:
            messages.pop(0)

        return jsonify({"status": "success"})
    return jsonify({"status": "error"}), 400

@app.route('/get_messages')
def get_messages():
    return jsonify(messages)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
