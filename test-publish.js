const Database = require('better-sqlite3');
const path = require('path');

async function testPublish() {
  const dbPath = path.join(process.cwd(), 'data', 'social-agent.db');
  const db = new Database(dbPath);
  
  const post = db.prepare('SELECT id FROM posts WHERE status != ? LIMIT 1').get('published');
  if (!post) {
    console.log('No posts to test.');
    return;
  }

  console.log(`Testing publish for post ID: ${post.id}`);
  
  // Make sure it's approved
  db.prepare('UPDATE posts SET status = ? WHERE id = ?').run('approved', post.id);

  try {
    const res = await fetch('http://localhost:3000/api/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId: post.id })
    });
    const status = res.status;
    const text = await res.text();
    console.log(`HTTP ${status} Response:`, text);
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

testPublish();
