// Database layer — Hybrid Postgres & SQLite Adapter
// Automatically uses PostgreSQL if DATABASE_URL is present, otherwise falls back to local SQLite.
import path from 'path';
import fs from 'fs';

const isPostgres = !!process.env.DATABASE_URL;

let pgPool = null;
let sqliteDb = null;

export async function getDb() {
  if (isPostgres) {
    if (!pgPool) {
      const { Pool } = require('pg');
      pgPool = new Pool({ connectionString: process.env.DATABASE_URL });
      await initPostgresTables(pgPool);
    }
    return pgPool;
  } else {
    if (!sqliteDb) {
      const Database = require('better-sqlite3');
      const dbPath = path.join(process.cwd(), 'data', 'social-agent.db');
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      sqliteDb = new Database(dbPath);
      sqliteDb.pragma('journal_mode = WAL');
      initSqliteTables(sqliteDb);
    }
    return sqliteDb;
  }
}

// Executes a query on either database. Automatically handles SQLite '?' vs Postgres '$1' parameterization.
async function executeQuery(query, params = [], type = 'all') {
  await getDb();

  if (isPostgres) {
    let paramIndex = 1;
    const pgQuery = query.replace(/\?/g, () => `$${paramIndex++}`);
    const res = await pgPool.query(pgQuery, params);
    
    if (type === 'run') return { lastInsertRowid: res.rows[0]?.id || null };
    if (type === 'get') return res.rows[0] || null;
    return res.rows;
  } else {
    const stmt = sqliteDb.prepare(query);
    if (type === 'run') {
      const info = stmt.run(...params);
      return { lastInsertRowid: info.lastInsertRowid };
    }
    if (type === 'get') return stmt.get(...params);
    return stmt.all(...params);
  }
}

async function initPostgresTables(pool) {
  // Postgres initialization
  await pool.query(`
    CREATE TABLE IF NOT EXISTS monthly_plans (
      id SERIAL PRIMARY KEY,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      theme TEXT,
      goals TEXT,
      target_audience TEXT,
      notes TEXT,
      suggested_posts TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(month, year)
    );
    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
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
      plan_id INTEGER REFERENCES monthly_plans(id),
      facebook_post_id TEXT,
      instagram_post_id TEXT,
      published_at TIMESTAMP,
      likes INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      shares INTEGER DEFAULT 0,
      impressions INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS platform_tokens (
      id SERIAL PRIMARY KEY,
      platform TEXT NOT NULL UNIQUE,
      access_token TEXT,
      refresh_token TEXT,
      user_id TEXT,
      user_name TEXT,
      expires_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migrate existing tables
  try { await pool.query('ALTER TABLE posts ADD COLUMN facebook_post_id TEXT;'); } catch (e) {}
  try { await pool.query('ALTER TABLE posts ADD COLUMN instagram_post_id TEXT;'); } catch (e) {}
  try { await pool.query('ALTER TABLE posts ADD COLUMN published_at TIMESTAMP;'); } catch (e) {}
  try { await pool.query('ALTER TABLE posts ADD COLUMN likes INTEGER DEFAULT 0;'); } catch (e) {}
  try { await pool.query('ALTER TABLE posts ADD COLUMN comments INTEGER DEFAULT 0;'); } catch (e) {}
  try { await pool.query('ALTER TABLE posts ADD COLUMN shares INTEGER DEFAULT 0;'); } catch (e) {}
  try { await pool.query('ALTER TABLE posts ADD COLUMN impressions INTEGER DEFAULT 0;'); } catch (e) {}
}

function initSqliteTables(db) {
  // SQLite init (identical to existing)
  db.exec(`
    CREATE TABLE IF NOT EXISTS monthly_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT, month INTEGER NOT NULL, year INTEGER NOT NULL,
      theme TEXT, goals TEXT, target_audience TEXT, notes TEXT, suggested_posts TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(month, year)
    );
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, platform TEXT NOT NULL DEFAULT 'both',
      written_gist TEXT, written_content TEXT, visual_gist TEXT, image_prompt TEXT, image_path TEXT,
      status TEXT NOT NULL DEFAULT 'draft', scheduled_date TEXT, scheduled_time TEXT, plan_id INTEGER REFERENCES monthly_plans(id),
      facebook_post_id TEXT, instagram_post_id TEXT, published_at DATETIME,
      likes INTEGER DEFAULT 0, comments INTEGER DEFAULT 0, shares INTEGER DEFAULT 0, impressions INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS platform_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT, platform TEXT NOT NULL UNIQUE, access_token TEXT,
      refresh_token TEXT, user_id TEXT, user_name TEXT, expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migrate existing tables
  try { db.exec('ALTER TABLE posts ADD COLUMN facebook_post_id TEXT;'); } catch (e) {}
  try { db.exec('ALTER TABLE posts ADD COLUMN instagram_post_id TEXT;'); } catch (e) {}
  try { db.exec('ALTER TABLE posts ADD COLUMN published_at DATETIME;'); } catch (e) {}
  try { db.exec('ALTER TABLE posts ADD COLUMN likes INTEGER DEFAULT 0;'); } catch (e) {}
  try { db.exec('ALTER TABLE posts ADD COLUMN comments INTEGER DEFAULT 0;'); } catch (e) {}
  try { db.exec('ALTER TABLE posts ADD COLUMN shares INTEGER DEFAULT 0;'); } catch (e) {}
  try { db.exec('ALTER TABLE posts ADD COLUMN impressions INTEGER DEFAULT 0;'); } catch (e) {}
}

// === API Methods ===

export async function getAllPosts(filters = {}) {
  let query = 'SELECT * FROM posts WHERE 1=1';
  const params = [];

  if (filters.status) {
    query += ' AND status = ?';
    params.push(filters.status);
  }
  if (filters.platform) {
    query += ' AND (platform = ? OR platform = \'both\')';
    params.push(filters.platform);
  }
  if (filters.month && filters.year) {
    // SQLite vs Postgres date formatting abstraction
    if (isPostgres) {
      query += ' AND EXTRACT(MONTH FROM scheduled_date::date) = ? AND EXTRACT(YEAR FROM scheduled_date::date) = ?';
      params.push(filters.month, filters.year);
    } else {
      query += ' AND strftime("%m", scheduled_date) = ? AND strftime("%Y", scheduled_date) = ?';
      params.push(String(filters.month).padStart(2, '0'), String(filters.year));
    }
  }

  query += ' ORDER BY scheduled_date ASC, scheduled_time ASC';
  return await executeQuery(query, params, 'all');
}

export async function getPostById(id) {
  return await executeQuery('SELECT * FROM posts WHERE id = ?', [id], 'get');
}

export async function createPost(data) {
  const query = isPostgres 
    ? `INSERT INTO posts (title, platform, written_gist, written_content, visual_gist, image_prompt, image_path, status, scheduled_date, scheduled_time, plan_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`
    : `INSERT INTO posts (title, platform, written_gist, written_content, visual_gist, image_prompt, image_path, status, scheduled_date, scheduled_time, plan_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  const params = [
    data.title, data.platform || 'both', data.written_gist || null,
    data.written_content || null, data.visual_gist || null, data.image_prompt || null,
    data.image_path || null, data.status || 'draft', data.scheduled_date || null,
    data.scheduled_time || null, data.plan_id || null
  ];

  const result = await executeQuery(query, params, 'run');
  return await getPostById(result.lastInsertRowid);
}

export async function updatePost(id, data) {
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
  
  await executeQuery(`UPDATE posts SET ${fields.join(', ')} WHERE id = ?`, values, 'run');
  return await getPostById(id);
}

export async function deletePost(id) {
  return await executeQuery('DELETE FROM posts WHERE id = ?', [id], 'run');
}

export async function getMonthlyPlan(month, year) {
  return await executeQuery('SELECT * FROM monthly_plans WHERE month = ? AND year = ?', [month, year], 'get');
}

export async function getAllMonthlyPlans() {
  return await executeQuery('SELECT * FROM monthly_plans ORDER BY year DESC, month DESC', [], 'all');
}

export async function upsertMonthlyPlan(data) {
  const existing = await executeQuery('SELECT * FROM monthly_plans WHERE month = ? AND year = ?', [data.month, data.year], 'get');
  if (existing) {
    await executeQuery(`UPDATE monthly_plans SET theme = ?, goals = ?, target_audience = ?, notes = ?, suggested_posts = ?, updated_at = CURRENT_TIMESTAMP WHERE month = ? AND year = ?`, 
      [data.theme, data.goals, data.target_audience, data.notes, data.suggested_posts || null, data.month, data.year], 'run');
  } else {
    await executeQuery(`INSERT INTO monthly_plans (month, year, theme, goals, target_audience, notes, suggested_posts) VALUES (?, ?, ?, ?, ?, ?, ?)`, 
      [data.month, data.year, data.theme, data.goals, data.target_audience, data.notes, data.suggested_posts || null], 'run');
  }
  return await getMonthlyPlan(data.month, data.year);
}

export async function getToken(platform) {
  return await executeQuery('SELECT * FROM platform_tokens WHERE platform = ?', [platform], 'get');
}

export async function upsertToken(platform, data) {
  const existing = await executeQuery('SELECT * FROM platform_tokens WHERE platform = ?', [platform], 'get');
  if (existing) {
    await executeQuery(`UPDATE platform_tokens SET access_token = ?, refresh_token = ?, user_id = ?, user_name = ?, expires_at = ?, updated_at = CURRENT_TIMESTAMP WHERE platform = ?`, 
      [data.access_token, data.refresh_token || null, data.user_id || null, data.user_name || null, data.expires_at || null, platform], 'run');
  } else {
    await executeQuery(`INSERT INTO platform_tokens (platform, access_token, refresh_token, user_id, user_name, expires_at) VALUES (?, ?, ?, ?, ?, ?)`, 
      [platform, data.access_token, data.refresh_token || null, data.user_id || null, data.user_name || null, data.expires_at || null], 'run');
  }
  return await getToken(platform);
}

export async function deleteToken(platform) {
  return await executeQuery('DELETE FROM platform_tokens WHERE platform = ?', [platform], 'run');
}

export async function getPostStats() {
  const total = (await executeQuery('SELECT COUNT(*) as count FROM posts', [], 'get')).count;
  const draft = (await executeQuery("SELECT COUNT(*) as count FROM posts WHERE status = 'draft'", [], 'get')).count;
  const pending = (await executeQuery("SELECT COUNT(*) as count FROM posts WHERE status = 'pending_approval'", [], 'get')).count;
  const approved = (await executeQuery("SELECT COUNT(*) as count FROM posts WHERE status = 'approved'", [], 'get')).count;
  const published = (await executeQuery("SELECT COUNT(*) as count FROM posts WHERE status = 'published'", [], 'get')).count;
  const failed = (await executeQuery("SELECT COUNT(*) as count FROM posts WHERE status = 'failed'", [], 'get')).count;
  
  // Aggregate Engagement Metrics
  const engagement = await executeQuery('SELECT SUM(likes) as total_likes, SUM(comments) as total_comments, SUM(impressions) as total_impressions FROM posts', [], 'get');
  
  const now = new Date();
  const monthStr = String(now.getMonth() + 1).padStart(2, '0');
  const yearStr = String(now.getFullYear());
  
  let thisMonth;
  if (isPostgres) {
    thisMonth = (await executeQuery("SELECT COUNT(*) as count FROM posts WHERE EXTRACT(MONTH FROM scheduled_date::date) = ? AND EXTRACT(YEAR FROM scheduled_date::date) = ?", [now.getMonth() + 1, now.getFullYear()], 'get')).count;
  } else {
    thisMonth = (await executeQuery("SELECT COUNT(*) as count FROM posts WHERE strftime('%m', scheduled_date) = ? AND strftime('%Y', scheduled_date) = ?", [monthStr, yearStr], 'get')).count;
  }
  
  // Postgres returns counts as strings, so parseInt them
  return { 
    total: parseInt(total), draft: parseInt(draft), pending: parseInt(pending), 
    approved: parseInt(approved), published: parseInt(published), 
    failed: parseInt(failed), thisMonth: parseInt(thisMonth),
    engagement: {
      likes: parseInt(engagement?.total_likes || 0),
      comments: parseInt(engagement?.total_comments || 0),
      impressions: parseInt(engagement?.total_impressions || 0)
    }
  };
}
