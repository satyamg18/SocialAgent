'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, postsRes] = await Promise.all([
          fetch('/api/stats'),
          fetch('/api/content'),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
        if (postsRes.ok) {
          const postsData = await postsRes.json();
          setRecentPosts(postsData.posts?.slice(0, 6) || []);
        }
      } catch (e) {
        console.error('Failed to load dashboard:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="animate-fadeIn">
        <div className="page-header">
          <div>
            <div className="skeleton skeleton-title" style={{ width: '200px' }}></div>
            <div className="skeleton skeleton-text" style={{ width: '300px' }}></div>
          </div>
        </div>
        <div className="stats-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="stat-card">
              <div className="skeleton skeleton-text" style={{ width: '80px' }}></div>
              <div className="skeleton skeleton-title" style={{ width: '60px', height: '32px' }}></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Posts', value: stats?.stats?.total || 0, icon: '📝' },
    { label: 'This Month', value: stats?.stats?.thisMonth || 0, icon: '📅' },
    { label: 'Pending Approval', value: stats?.stats?.pending || 0, icon: '⏳' },
    { label: 'Published', value: stats?.stats?.published || 0, icon: '🚀' },
    { label: 'Drafts', value: stats?.stats?.draft || 0, icon: '📄' },
    { label: 'Approved', value: stats?.stats?.approved || 0, icon: '✅' },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Your social media command center</p>
        </div>
        <div className="page-actions">
          <Link href="/compose" className="btn btn-primary" id="btn-new-post">
            ✍️ New Post
          </Link>
          <Link href="/plan" className="btn btn-secondary" id="btn-plan">
            📋 Plan Month
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {statCards.map((stat, i) => (
          <div key={i} className="stat-card" style={{ animationDelay: `${i * 50}ms` }}>
            <span className="stat-icon">{stat.icon}</span>
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.05))', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
          <div className="card-body" style={{ textAlign: 'center', padding: '32px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🤖</div>
            <h3 style={{ marginBottom: '8px' }}>AI Content Generator</h3>
            <p className="text-muted text-sm" style={{ marginBottom: '20px' }}>
              Just give a brief idea — our AI crafts engaging, human-sounding content for LinkedIn and Instagram.
            </p>
            <Link href="/compose" className="btn btn-primary">
              Start Composing
            </Link>
          </div>
        </div>

        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(249, 115, 22, 0.05))', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
          <div className="card-body" style={{ textAlign: 'center', padding: '32px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📅</div>
            <h3 style={{ marginBottom: '8px' }}>Monthly Planner</h3>
            <p className="text-muted text-sm" style={{ marginBottom: '20px' }}>
              Let AI suggest a complete content calendar, or build your own plan for the month ahead.
            </p>
            <Link href="/plan" className="btn btn-secondary">
              Plan Content
            </Link>
          </div>
        </div>

        {stats?.stats?.pending > 0 && (
          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05))', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div className="card-body" style={{ textAlign: 'center', padding: '32px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>✅</div>
              <h3 style={{ marginBottom: '8px' }}>Pending Approvals</h3>
              <p className="text-muted text-sm" style={{ marginBottom: '20px' }}>
                {stats.stats.pending} post{stats.stats.pending > 1 ? 's' : ''} waiting for your review before publishing.
              </p>
              <Link href="/approve" className="btn btn-success">
                Review Now
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Recent Posts */}
      <div style={{ marginBottom: '32px' }}>
        <div className="flex items-center justify-between mb-4">
          <h2>Recent Posts</h2>
          <Link href="/calendar" className="btn btn-ghost btn-sm">View All →</Link>
        </div>

        {recentPosts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-title">No posts yet</div>
            <div className="empty-state-text">
              Start by creating your first post or generating a monthly content plan.
            </div>
            <Link href="/compose" className="btn btn-primary">Create First Post</Link>
          </div>
        ) : (
          <div className="posts-grid">
            {recentPosts.map(post => (
              <div key={post.id} className="post-card">
                <div className="post-card-header">
                  <div className="post-card-title">{post.title}</div>
                  <div className="post-card-meta">
                    <span className={`platform-badge ${post.platform}`}>
                      {post.platform === 'linkedin' ? '💼' : post.platform === 'instagram' ? '📷' : '🌐'} {post.platform}
                    </span>
                  </div>
                </div>
                {post.image_path && (
                  <img src={post.image_path} alt="" className="post-card-image" />
                )}
                <div className="post-card-body">
                  {post.written_content || post.written_gist || 'No content yet'}
                </div>
                <div className="post-card-footer" style={{ flexWrap: 'wrap' }}>
                  <span className="post-card-date">
                    {post.scheduled_date ? new Date(post.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unscheduled'}
                  </span>
                  <span className={`status-badge ${post.status}`}>
                    <span className="status-dot"></span>
                    {post.status.replace('_', ' ')}
                  </span>
                  <div style={{ width: '100%', marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                    <a href={`/edit/${post.id}`} className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>✏️ Edit</a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
