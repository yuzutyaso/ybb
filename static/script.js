// static/script.js

// DOM要素の取得
const postForm = document.getElementById('post-form');
const usernameInput = document.getElementById('username');
const messageInput = document.getElementById('message');
const postsContainer = document.getElementById('posts-container');

// 投稿をレンダリングする関数
function renderPost(post) {
    const postDiv = document.createElement('div');
    postDiv.classList.add('post');
    postDiv.innerHTML = `
        <div class="post-header">
            ${post.username} <small class="post-timestamp">(${post.timestamp})</small>
        </div>
        <div class="post-content">${post.message}</div>
    `;
    return postDiv;
}

// 投稿一覧を取得して表示する関数
async function fetchAndRenderPosts() {
    try {
        const response = await fetch('/api/posts'); // 投稿一覧APIへのGETリクエスト
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const posts = await response.json();
        
        postsContainer.innerHTML = ''; // 既存の投稿をクリア
        if (posts.length === 0) {
            postsContainer.innerHTML = '<p>まだ投稿はありません。</p>';
        } else {
            posts.forEach(post => {
                postsContainer.appendChild(renderPost(post));
            });
        }
    } catch (error) {
        console.error('Failed to fetch posts:', error);
        postsContainer.innerHTML = '<p>投稿の読み込みに失敗しました。</p>';
    }
}

// フォーム送信時の処理
postForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // デフォルトのフォーム送信（ページリロード）を防止

    const username = usernameInput.value.trim();
    const message = messageInput.value.trim();

    if (!username || !message) {
        alert('名前とメッセージを入力してください。');
        return;
    }

    try {
        const response = await fetch('/api/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json' // JSON形式でデータを送信
            },
            body: JSON.stringify({ username, message }) // データをJSON文字列に変換して送信
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Unknown error'}`);
        }

        const newPost = await response.json(); // 新しく追加された投稿の情報を取得
        
        // フォームをクリア
        usernameInput.value = '';
        messageInput.value = '';

        // 投稿一覧を再取得して表示を更新
        await fetchAndRenderPosts();

    } catch (error) {
        console.error('Failed to add post:', error);
        alert('投稿に失敗しました。');
    }
});

// ページロード時に投稿一覧を読み込む
document.addEventListener('DOMContentLoaded', fetchAndRenderPosts);
