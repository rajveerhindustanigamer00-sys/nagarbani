from flask import Flask, request, jsonify, send_from_directory
import os

app = Flask(__name__)

# 1. SETUP: Create a folder to store your father's news videos
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# 2. HOME ROUTE: Serves your professional index.html file
@app.route('/')
def home():
    # Looks for index.html in your main project folder
    return send_from_directory('.', 'index.html')

# 3. CONTENT LIST: Tells the website which videos to show in the gallery
@app.route('/list_content')
def list_content():
    # Sends a list of every filename in the uploads folder back to the browser
    files = os.listdir(UPLOAD_FOLDER)
    return jsonify(files)

# 4. VIDEO SERVER: Allows the browser to actually play the video files
@app.route('/uploads/<filename>')
def serve_video(filename):
    # This 'route' makes the files in the uploads folder public to the site
    return send_from_directory(UPLOAD_FOLDER, filename)

# 5. UPLOAD ENGINE: Catches the headline, text, and video from the website
@app.route('/upload', methods=['POST'])
def handle_upload():
    # Grabbing the data sent via the 'FormData' object in script.js
    headline = request.form.get('headline')
    news_body = request.form.get('news')
    video_file = request.files.get('video')

    if video_file:
        # We use the headline to name the file so the URL uses words
        # e.g., 'market-update.mp4'
        filename = f"{headline.replace(' ', '-')}.mp4"
        video_file.save(os.path.join(UPLOAD_FOLDER, filename))
        
        # Printing to your black terminal window for confirmation
        print(f"--- Nagarbani News Update ---")
        print(f"Headline: {headline}")
        print(f"Status: File {filename} saved successfully!")
    
    return jsonify({"status": "Success", "message": "Content Published to Nagarbani News!"})

# 6. DYNAMIC WORD URLS: Example of how to view a specific story by name
@app.route('/news/<slug>')
def show_specific_news(slug):
    # This allows URLs like http://127.0.0.1:5000/news/local-market-report
    clean_name = slug.replace('-', ' ')
    return f"<h1>Nagarbani News</h1><h2>Viewing Story: {clean_name}</h2>"

# 7. START ENGINE: Configured for phone access on your home Wi-Fi
if __name__ == '__main__':
    # 'host=0.0.0.0' allows other devices (like your phone) to connect
    app.run(debug=True, host='0.0.0.0', port=5000)
