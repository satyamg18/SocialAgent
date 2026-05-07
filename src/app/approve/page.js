'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';

export default function ApprovePage() {
  const addToast = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState({});
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    setLoading(true);
    try {
      const res = await fetch('/api/content?status=pending_approval');
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (e) {
      console.error('Failed to fetch:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(postId, newStatus) {
    try {
      const res = await fetch(`/api/content/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        addToast(
          newStatus === 'approved' ? 'Post approved!' :
          newStatus === 'draft' ? 'Post sent back for revision.' :
          'Status updated.',
          newStatus === 'approved' ? 'success' : 'info'
        );
        fetchPosts();
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  }

  async function handlePublish(postId) {
    setPublishing(prev => ({ ...prev, [postId]: true }));
    try {
      // First approve if not already
      await fetch(`/api/content/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });

      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });

      const data = await res.json();

      if (data.success) {
        addToast('Post published successfully!', 'success');
        fetchPosts();
      } else {
        addToast(`Publishing had issues: ${data.errors?.join(', ') || 'Unknown error'}`, 'error');
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setPublishing(prev => ({ ...prev, [postId]: false }));
    }
  }

  if (loading) {
    return (
      <div className="animate-fadeIn">
        <div className="page-header">
          <div>
            <h1 className="page-title">Approval Queue</h1>
            <p className="page-subtitle">Loading...</p>
          </div>
        </div>
        <div className="posts-grid">
          {[1, 2, 3].map(i => (
            <div key={i} className="card" style={{ padding: '24px' }}>
              <div className="skeleton skeleton-title"></div>
              <div className="skeleton skeleton-image"></div>
              <div className="skeleton skeleton-text"></div>
              <div className="skeleton skeleton-text" style={{ width: '70%' }}></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">Approval Queue</h1>
          <p className="page-subtitle">
            {posts.length === 0
              ? 'No posts waiting for approval'
              : `${posts.length} post${posts.length > 1 ? 's' : ''} awaiting your review`}
          </p>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✅</div>
          <div className="empty-state-title">All caught up!</div>
          <div className="empty-state-text">
            No posts are waiting for approval. Create new content to get started.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {posts.map(post => (
            <div key={post.id} className="approval-card">
              <div style={{ padding: '24px' }}>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 style={{ marginBottom: '8px' }}>{post.title}</h3>
                    <div className="flex gap-2">
                      <span className={`platform-badge ${post.platform}`}>
                        {post.platform === 'linkedin' ? '💼' : post.platform === 'instagram' ? '📷' : '🌐'} {post.platform}
                      </span>
                      {post.scheduled_date && (
                        <span className="text-xs text-muted" style={{ padding: '4px 8px' }}>
                          📅 {new Date(post.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {post.scheduled_time ? ` at ${post.scheduled_time}` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setExpandedId(expandedId === post.id ? null : post.id)}
                  >
                    {expandedId === post.id ? 'Collapse ▲' : 'Expand ▼'}
                  </button>
                </div>

                {/* Content Preview */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: post.image_path ? '1fr 1fr' : '1fr',
                  gap: '20px',
                }}>
                  <div>
                    <div className="form-label" style={{ marginBottom: '8px' }}>Written Content</div>
                    <div style={{
                      whiteSpace: 'pre-wrap',
                      color: 'var(--text-secondary)',
                      fontSize: '0.9rem',
                      lineHeight: '1.7',
                      maxHeight: expandedId === post.id ? 'none' : '200px',
                      overflow: 'hidden',
                      position: 'relative',
                    }}>
                      {post.written_content || post.written_gist || 'No content'}
                      {expandedId !== post.id && (
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: '60px',
                          background: 'linear-gradient(transparent, var(--bg-card))',
                        }} />
                      )}
                    </div>
                  </div>

                  {post.image_path && (
                    <div>
                      <div className="form-label" style={{ marginBottom: '8px' }}>Visual Content</div>
                      <img
                        src={post.image_path}
                        alt="Post visual"
                        style={{
                          width: '100%',
                          maxHeight: expandedId === post.id ? '400px' : '200px',
                          objectFit: 'cover',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  marginTop: '20px',
                  paddingTop: '20px',
                  borderTop: '1px solid var(--border-subtle)',
                }}>
                  <button
                    className="btn btn-success"
                    onClick={() => handleStatusChange(post.id, 'approved')}
                    id={`btn-approve-${post.id}`}
                  >
                    ✅ Approve
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => handlePublish(post.id)}
                    disabled={publishing[post.id]}
                    id={`btn-publish-${post.id}`}
                  >
                    {publishing[post.id] ? <><span className="spinner"></span> Publishing...</> : '🚀 Approve & Publish Now'}
                  </button>
                  <a
                    href={`/edit/${post.id}`}
                    className="btn btn-secondary"
                    style={{ textDecoration: 'none' }}
                  >
                    ✏️ Edit Post
                  </a>
                  <button
                    className="btn btn-ghost"
                    onClick={() => handleStatusChange(post.id, 'draft')}
                    id={`btn-revise-${post.id}`}
                  >
                    🔄 Check Back to Draft
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => {
                      if (confirm('Delete this post?')) {
                        fetch(`/api/content/${post.id}`, { method: 'DELETE' }).then(() => {
                          addToast('Post deleted', 'info');
                          fetchPosts();
                        });
                      }
                    }}
                    id={`btn-delete-${post.id}`}
                    style={{ marginLeft: 'auto', color: 'var(--status-failed)' }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
