// Database layer — SQLite via better-sqlite3
// Persistent local storage for posts, plans, and platform tokens

let db = null;

function getDb() {
  if (db) return db;
  const Database = require('better-sqlite3');
  const path = require('path');
  const fs = require('fs');
  const dbPath = path.join(process.cwd(), 'data', 'social-agent.db');
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  initTables(db);
  return db;
}

function initTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS monthly_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      theme TEXT,
      goals TEXT,
      target_audience TEXT,
      notes TEXT,
      suggested_posts TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(month, year)
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      platform TEXT NOT NULL DEFAULT 'both',
      written_gist TEXT,
      written_content TEXT,
      visual_gist TEXT,
      image_prompt TEXT,
      image_path TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      scheduled_date TEXT,
      scheduled_time TEXT,
      plan_id INTEGER,
      linkedin_post_id TEXT,
      instagram_post_id TEXT,
      published_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (plan_id) REFERENCES monthly_plans(id)
    );

    CREATE TABLE IF NOT EXISTS platform_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL UNIQUE,
      access_token TEXT,
      refresh_token TEXT,
      user_id TEXT,
      user_name TEXT,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
    CREATE INDEX IF NOT EXISTS idx_posts_scheduled ON posts(scheduled_date);
    CREATE INDEX IF NOT EXISTS idx_posts_platform ON posts(platform);
  `);
}

// === Post CRUD ===

export function getAllPosts(filters = {}) {
  const ldb = getDb();
  let query = 'SELECT * FROM posts WHERE 1=1';
  const params = [];

  if (filters.status) {
    query += ' AND status = ?';
    params.push(filters.status);
  }
  if (filters.platform) {
    query += ' AND (platform = ? OR platform = "both")';
    params.push(filters.platform);
  }
  if (filters.month && filters.year) {
    query += ' AND strftime("%m", scheduled_date) = ? AND strftime("%Y", scheduled_date) = ?';
    params.push(String(filters.month).padStart(2, '0'), String(filters.year));
  }

  query += ' ORDER BY scheduled_date ASC, scheduled_time ASC';
  return ldb.prepare(query).all(...params);
}

export function getPostById(id) {
  return getDb().prepare('SELECT * FROM posts WHERE id = ?').get(id);
}

export function createPost(data) {
  const ldb = getDb();
  const stmt = ldb.prepare(`
    INSERT INTO posts (title, platform, written_gist, written_content, visual_gist, image_prompt, image_path, status, scheduled_date, scheduled_time, plan_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.title, data.platform || 'both', data.written_gist || null,
    data.written_content || null, data.visual_gist || null, data.image_prompt || null,
    data.image_path || null, data.status || 'draft', data.scheduled_date || null,
    data.scheduled_time || null, data.plan_id || null
  );
  return getPostById(result.lastInsertRowid);
}

export function updatePost(id, data) {
  const ldb = getDb();
  const fields = [];
  const values = [];
  for (const [key, value] of Object.entries(data)) {
    if (key !== 'id' && key !== 'created_at') {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  ldb.prepare(`UPDATE posts SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getPostById(id);
}

export function deletePost(id) {
  return getDb().prepare('DELETE FROM posts WHERE id = ?').run(id);
}

// === Monthly Plan ===

export function getMonthlyPlan(month, year) {
  return getDb().prepare('SELECT * FROM monthly_plans WHERE month = ? AND year = ?').get(month, year);
}

export function getAllMonthlyPlans() {
  return getDb().prepare('SELECT * FROM monthly_plans ORDER BY year DESC, month DESC').all();
}

export function upsertMonthlyPlan(data) {
  const ldb = getDb();
  const existing = ldb.prepare('SELECT * FROM monthly_plans WHERE month = ? AND year = ?').get(data.month, data.year);
  if (existing) {
    ldb.prepare(`UPDATE monthly_plans SET theme = ?, goals = ?, target_audience = ?, notes = ?, suggested_posts = ?, updated_at = CURRENT_TIMESTAMP WHERE month = ? AND year = ?`)
      .run(data.theme, data.goals, data.target_audience, data.notes, data.suggested_posts || null, data.month, data.year);
  } else {
    ldb.prepare(`INSERT INTO monthly_plans (month, year, theme, goals, target_audience, notes, suggested_posts) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(data.month, data.year, data.theme, data.goals, data.target_audience, data.notes, data.suggested_posts || null);
  }
  return ldb.prepare('SELECT * FROM monthly_plans WHERE month = ? AND year = ?').get(data.month, data.year);
}

// === Platform Tokens ===

export function getToken(platform) {
  return getDb().prepare('SELECT * FROM platform_tokens WHERE platform = ?').get(platform);
}

export function upsertToken(platform, data) {
  const ldb = getDb();
  const existing = ldb.prepare('SELECT * FROM platform_tokens WHERE platform = ?').get(platform);
  if (existing) {
    ldb.prepare(`UPDATE platform_tokens SET access_token = ?, refresh_token = ?, user_id = ?, user_name = ?, expires_at = ?, updated_at = CURRENT_TIMESTAMP WHERE platform = ?`)
      .run(data.access_token, data.refresh_token || null, data.user_id || null, data.user_name || null, data.expires_at || null, platform);
  } else {
    ldb.prepare(`INSERT INTO platform_tokens (platform, access_token, refresh_token, user_id, user_name, expires_at) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(platform, data.access_token, data.refresh_token || null, data.user_id || null, data.user_name || null, data.expires_at || null);
  }
  return ldb.prepare('SELECT * FROM platform_tokens WHERE platform = ?').get(platform);
}

export function deleteToken(platform) {
  return getDb().prepare('DELETE FROM platform_tokens WHERE platform = ?').run(platform);
}

// === Stats ===

export function getPostStats() {
  const ldb = getDb();
  const total = ldb.prepare('SELECT COUNT(*) as count FROM posts').get().count;
  const draft = ldb.prepare("SELECT COUNT(*) as count FROM posts WHERE status = 'draft'").get().count;
  const pending = ldb.prepare("SELECT COUNT(*) as count FROM posts WHERE status = 'pending_approval'").get().count;
  const approved = ldb.prepare("SELECT COUNT(*) as count FROM posts WHERE status = 'approved'").get().count;
  const published = ldb.prepare("SELECT COUNT(*) as count FROM posts WHERE status = 'published'").get().count;
  const failed = ldb.prepare("SELECT COUNT(*) as count FROM posts WHERE status = 'failed'").get().count;
  const now = new Date();
  const monthStr = String(now.getMonth() + 1).padStart(2, '0');
  const yearStr = String(now.getFullYear());
  const thisMonth = ldb.prepare("SELECT COUNT(*) as count FROM posts WHERE strftime('%m', scheduled_date) = ? AND strftime('%Y', scheduled_date) = ?").get(monthStr, yearStr).count;
  return { total, draft, pending, approved, published, failed, thisMonth };
}

// === Health check for API key ===

export function hasGeminiKey() {
  return !!process.env.GEMINI_API_KEY;
}
