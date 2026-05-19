'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/Toast';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postFilter, setPostFilter] = useState('unpublished');
  const [publishing, setPublishing] = useState({}); // { [postId]: true }

  const addToast = useToast();

  const refreshData = useCallback(async () => {
    try {
      const [statsRes, postsRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/content'),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (postsRes.ok) {
        const postsData = await postsRes.json();
        const sorted = (postsData.posts || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setAllPosts(sorted);
      }
    } catch (e) {
      console.error('Failed to load dashboard:', e);
    }
  }, []);

  useEffect(() => {
    async function init() {
      await refreshData();
      setLoading(false);
    }
    init();
  }, [refreshData]);

  async function handlePublish(post) {
    setPublishing(prev => ({ ...prev, [post.id]: true }));
    try {
      // Approve first if not yet approved
      if (post.status !== 'approved') {
        await fetch(`/api/content/${post.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'approved' }),
        });
      }
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('Post published successfully! 🚀', 'success');
        await refreshData();
      } else {
        addToast(`Publish failed: ${data.error || data.errors?.join(', ') || 'Unknown error'}`, 'error');
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setPublishing(prev => ({ ...prev, [post.id]: false }));
    }
  }

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
    { label: 'Total Likes', value: stats?.stats?.engagement?.likes || 0, icon: '❤️' },
    { label: 'Total Comments', value: stats?.stats?.engagement?.comments || 0, icon: '💬' },
    { label: 'Impressions', value: stats?.stats?.engagement?.impressions || 0, icon: '👁️' },
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
              Just give a brief idea — our AI crafts engaging, human-sounding content for Facebook and Instagram.
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

      {/* Posts Section */}
      <div style={{ marginBottom: '32px' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="tabs" style={{ marginBottom: 0 }}>
            <button 
              className={`tab ${postFilter === 'unpublished' ? 'active' : ''}`}
              onClick={() => setPostFilter('unpublished')}
            >
              ⏳ Unpublished
            </button>
            <button 
              className={`tab ${postFilter === 'published' ? 'active' : ''}`}
              onClick={() => setPostFilter('published')}
            >
              🚀 Published
            </button>
          </div>
          <Link href="/calendar" className="btn btn-ghost btn-sm">Calendar View →</Link>
        </div>

        {allPosts.filter(p => postFilter === 'published' ? p.status === 'published' : p.status !== 'published').length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">{postFilter === 'published' ? '🚀' : '📭'}</div>
            <div className="empty-state-title">No {postFilter} posts</div>
            <div className="empty-state-text">
              {postFilter === 'published' 
                ? "You haven't published any posts yet. Approve a draft to get started!" 
                : "All caught up! Start by generating a new post."}
            </div>
            {postFilter !== 'published' && <Link href="/compose" className="btn btn-primary">Create Post</Link>}
          </div>
        ) : (
          <div className="posts-grid">
            {allPosts
              .filter(p => postFilter === 'published' ? p.status === 'published' : p.status !== 'published')
              .map(post => (
              <div key={post.id} className="post-card">
                <div className="post-card-header">
                  <div className="post-card-title">{post.title}</div>
                  <div className="post-card-meta">
                    <span className={`platform-badge ${post.platform}`}>
                      {post.platform === 'facebook' ? '📘' : post.platform === 'instagram' ? '📷' : '🌐'} {post.platform}
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
                  
                  {post.status === 'published' && (post.likes > 0 || post.comments > 0) && (
                    <span className="status-badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--status-failed)', marginLeft: '8px', border: 'none' }}>
                      ❤️ {post.likes || 0} &nbsp; 💬 {post.comments || 0}
                    </span>
                  )}

                  <div style={{ width: '100%', marginTop: '8px', display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    {post.status !== 'published' ? (
                      <>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handlePublish(post)}
                          disabled={publishing[post.id]}
                          id={`btn-dash-publish-${post.id}`}
                          style={{ fontSize: '0.78rem' }}
                        >
                          {publishing[post.id]
                            ? <><span className="spinner" style={{ width: '12px', height: '12px' }}></span> Publishing...</>
                            : '🚀 Publish Now'}
                        </button>
                        <a href={`/edit/${post.id}`} className="btn btn-ghost btn-sm" style={{ textDecoration: 'none', fontSize: '0.78rem' }}>
                          ✏️ Edit
                        </a>
                      </>
                    ) : (
                      <a href={`/edit/${post.id}`} className="btn btn-ghost btn-sm" style={{ textDecoration: 'none', fontSize: '0.78rem' }}>
                        👁️ View
                      </a>
                    )}
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
