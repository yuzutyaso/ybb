# app.py
from flask import Flask, jsonify, request, send_from_directory
import sqlite3
import datetime
import os

app = Flask(__name__, static_folder='static', static_url_path='') # staticフォルダを静的ファイル提供のルートに設定
DATABASE = 'board.db'

# データベースの初期化
def init_db():
    with sqlite3.connect(DATABASE) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS posts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                message TEXT NOT NULL,
                timestamp TEXT NOT NULL
            )
        ''')
        conn.commit()

# アプリケーション起動時にデータベースを初期化
@app.before_first_request
def setup():
    init_db()

# ルートURLでstaticフォルダ内のindex.htmlを返す
@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

# 投稿一覧を取得するAPIエンドポイント
@app.route('/api/posts', methods=['GET'])
def get_posts():
    with sqlite3.connect(DATABASE) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        posts = cursor.execute("SELECT * FROM posts ORDER BY timestamp DESC").fetchall()
    # 行オブジェクトを辞書のリストに変換してJSONとして返す
    return jsonify([dict(row) for row in posts])

# 新しい投稿を追加するAPIエンドポイント
@app.route('/api/posts', methods=['POST'])
def add_post():
    data = request.get_json() # JSON形式のデータを取得
    username = data.get('username')
    message = data.get('message')
    timestamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    if not username or not message:
        return jsonify({'error': 'Username and message are required'}), 400

    with sqlite3.connect(DATABASE) as conn:
        cursor = conn.cursor()
        cursor.execute("INSERT INTO posts (username, message, timestamp) VALUES (?, ?, ?)",
                       (username, message, timestamp))
        conn.commit()
        # 挿入された投稿のIDを取得
        new_post_id = cursor.lastrowid
        # 新しい投稿の情報を取得して返す
        cursor.execute("SELECT * FROM posts WHERE id = ?", (new_post_id,))
        new_post = cursor.fetchone()
    
    return jsonify(dict(new_post)), 201 # 201 Created ステータスを返す

if __name__ == '__main__':
    # 開発中は静的ファイルもリロードされるように設定
    app.run(debug=True)
