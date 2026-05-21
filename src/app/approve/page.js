'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';

const TABS = [
  { key: 'pending_approval', label: '⏳ Pending Review', emptyIcon: '✅', emptyTitle: 'All caught up!', emptyText: 'No posts are waiting for approval.' },
  { key: 'approved',         label: '✅ Approved / Scheduled', emptyIcon: '📅', emptyTitle: 'Nothing approved yet', emptyText: 'Approve a post from the Pending tab to see it here.' },
  { key: 'published',        label: '🚀 Posted', emptyIcon: '🚀', emptyTitle: 'No posts published yet', emptyText: 'Once a post is published it will appear here.' },
];

export default function ApprovePage() {
  const addToast = useToast();
  const [activeTab, setActiveTab] = useState('pending_approval');
  const [postsByTab, setPostsByTab] = useState({ pending_approval: [], approved: [], published: [] });
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [rescheduling, setRescheduling] = useState({}); // { [postId]: { open, date, time } }

  useEffect(() => {
    fetchAllTabs();
  }, []);

  async function fetchAllTabs() {
    setLoading(true);
    try {
      const [pendingRes, approvedRes, publishedRes] = await Promise.all([
        fetch('/api/content?status=pending_approval'),
        fetch('/api/content?status=approved'),
        fetch('/api/content?status=published'),
      ]);

      const pending  = pendingRes.ok  ? (await pendingRes.json()).posts  || [] : [];
      const approved = approvedRes.ok ? (await approvedRes.json()).posts || [] : [];
      const published= publishedRes.ok? (await publishedRes.json()).posts|| [] : [];

      setPostsByTab({ pending_approval: pending, approved, published });
    } catch (e) {
      console.error('Failed to fetch:', e);
    } finally {
      setLoading(false);
    }
  }

  function openReschedule(post) {
    setRescheduling(prev => ({
      ...prev,
      [post.id]: {
        open: true,
        date: post.scheduled_date || '',
        time: post.scheduled_time || '09:00',
      },
    }));
  }

  function closeReschedule(postId) {
    setRescheduling(prev => ({ ...prev, [postId]: { ...prev[postId], open: false } }));
  }

  async function handleReschedule(postId) {
    const { date, time } = rescheduling[postId] || {};
    if (!date) { addToast('Please pick a date first.', 'error'); return; }
    try {
      const res = await fetch(`/api/content/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduled_date: date, scheduled_time: time }),
      });
      if (res.ok) {
        addToast(`Rescheduled to ${date} at ${time} ✅`, 'success');
        closeReschedule(postId);
        fetchAllTabs();
      } else {
        addToast('Failed to reschedule.', 'error');
      }
    } catch (err) {
      addToast(err.message, 'error');
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
          newStatus === 'approved' ? 'Post approved! It will publish on its scheduled date.' :
          newStatus === 'draft'    ? 'Post sent back to draft.' :
          'Status updated.',
          newStatus === 'approved' ? 'success' : 'info'
        );
        fetchAllTabs();
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  }

  async function handlePublish(postId) {
    setPublishing(prev => ({ ...prev, [postId]: true }));
    try {
      // Ensure the post is approved before publishing
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
        addToast('Post published successfully! 🚀', 'success');
        fetchAllTabs();
      } else {
        addToast(`Publish failed: ${data.error || data.errors?.join(', ') || 'Unknown error'}`, 'error');
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

  const currentTab = TABS.find(t => t.key === activeTab);
  const posts = postsByTab[activeTab] || [];
  const pendingCount = postsByTab.pending_approval.length;

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">Approval Queue</h1>
          <p className="page-subtitle">
            {pendingCount > 0
              ? `${pendingCount} post${pendingCount > 1 ? 's' : ''} awaiting your review`
              : 'All posts reviewed'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '24px' }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
            style={{ position: 'relative' }}
          >
            {tab.label}
            {tab.key === 'pending_approval' && postsByTab.pending_approval.length > 0 && (
              <span style={{
                marginLeft: '8px',
                background: 'var(--status-pending)',
                color: '#fff',
                borderRadius: '999px',
                padding: '1px 7px',
                fontSize: '0.72rem',
                fontWeight: 700,
              }}>
                {postsByTab.pending_approval.length}
              </span>
            )}
            {tab.key === 'approved' && postsByTab.approved.length > 0 && (
              <span style={{
                marginLeft: '8px',
                background: 'var(--status-approved)',
                color: '#fff',
                borderRadius: '999px',
                padding: '1px 7px',
                fontSize: '0.72rem',
                fontWeight: 700,
              }}>
                {postsByTab.approved.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {posts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">{currentTab.emptyIcon}</div>
          <div className="empty-state-title">{currentTab.emptyTitle}</div>
          <div className="empty-state-text">{currentTab.emptyText}</div>
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
                    <div className="flex gap-2" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
                      <span className={`platform-badge ${post.platform}`}>
                        {post.platform === 'facebook' ? '📘' : post.platform === 'instagram' ? '📷' : '🌐'} {post.platform}
                      </span>

                      {/* Status Badge */}
                      <span className={`status-badge ${post.status}`}>
                        <span className="status-dot"></span>
                        {post.status === 'pending_approval' ? 'Pending Review' :
                         post.status === 'approved'         ? 'Approved — Awaiting Publish' :
                         post.status === 'published'        ? 'Published' :
                         post.status.replace('_', ' ')}
                      </span>

                      {post.scheduled_date && (
                        <span className="text-xs text-muted" style={{ padding: '4px 8px' }}>
                          📅 {new Date(post.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {post.scheduled_time ? ` at ${post.scheduled_time}` : ''}
                        </span>
                      )}

                      {post.status === 'published' && post.published_at && (
                        <span className="text-xs text-muted" style={{ padding: '4px 8px' }}>
                          🕐 Posted {new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
                      maxHeight: expandedId === post.id ? 'none' : '150px',
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
                          maxHeight: expandedId === post.id ? '400px' : '150px',
                          objectFit: 'cover',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Engagement (for published posts) */}
                {post.status === 'published' && (
                  <div style={{
                    marginTop: '16px',
                    padding: '16px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                  }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                      📈 Performance Analytics
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                      {(post.facebook_post_id || post.platform === 'facebook' || post.platform === 'both') && (
                        <div style={{ padding: '12px', background: 'rgba(24, 119, 242, 0.04)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(24, 119, 242, 0.12)' }}>
                          <div style={{ fontWeight: 600, color: 'var(--facebook-color)', fontSize: '0.82rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>📘</span> Facebook
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            <div>❤️ {post.fb_likes || 0} likes</div>
                            <div>💬 {post.fb_comments || 0} comments</div>
                            <div>👁️ {post.fb_impressions || 0} impressions</div>
                          </div>
                        </div>
                      )}
                      
                      {(post.instagram_post_id || post.platform === 'instagram' || post.platform === 'both') && (
                        <div style={{ padding: '12px', background: 'rgba(225, 48, 108, 0.04)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(225, 48, 108, 0.12)' }}>
                          <div style={{ fontWeight: 600, color: '#e1306c', fontSize: '0.82rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>📷</span> Instagram
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            <div>❤️ {post.ig_likes || 0} likes</div>
                            <div>💬 {post.ig_comments || 0} comments</div>
                            <div>👁️ {post.ig_impressions || 0} impressions</div>
                          </div>
                        </div>
                      )}

                      {(post.facebook_post_id && post.instagram_post_id) && (
                        <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.04)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99, 102, 241, 0.12)' }}>
                          <div style={{ fontWeight: 600, color: 'var(--accent-primary)', fontSize: '0.82rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>🌐</span> Combined Total
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            <div>❤️ {post.likes || 0} likes</div>
                            <div>💬 {post.comments || 0} comments</div>
                            <div>👁️ {post.impressions || 0} impressions</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  marginTop: '20px',
                  paddingTop: '20px',
                  borderTop: '1px solid var(--border-subtle)',
                  flexWrap: 'wrap',
                }}>
                  {/* Pending review actions */}
                  {post.status === 'pending_approval' && (
                    <>
                      <button
                        className="btn btn-success"
                        onClick={() => handleStatusChange(post.id, 'approved')}
                        id={`btn-approve-${post.id}`}
                      >
                        ✅ Approve (Schedule)
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={() => handlePublish(post.id)}
                        disabled={publishing[post.id]}
                        id={`btn-publish-${post.id}`}
                      >
                        {publishing[post.id] ? <><span className="spinner"></span> Publishing...</> : '🚀 Approve & Publish Now'}
                      </button>
                      <a href={`/edit/${post.id}`} className="btn btn-secondary" style={{ textDecoration: 'none' }}>
                        ✏️ Edit Post
                      </a>
                      <button
                        className="btn btn-ghost"
                        onClick={() => handleStatusChange(post.id, 'draft')}
                        id={`btn-revise-${post.id}`}
                      >
                        🔄 Back to Draft
                      </button>
                    </>
                  )}

                  {/* Approved / Scheduled actions */}
                  {post.status === 'approved' && (
                    <div style={{ width: '100%' }}>
                      {/* Primary action buttons */}
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: rescheduling[post.id]?.open ? '16px' : '0' }}>
                        <button
                          className="btn btn-primary"
                          onClick={() => handlePublish(post.id)}
                          disabled={publishing[post.id]}
                          id={`btn-publish-approved-${post.id}`}
                        >
                          {publishing[post.id] ? <><span className="spinner"></span> Publishing...</> : '🚀 Publish Now'}
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => rescheduling[post.id]?.open ? closeReschedule(post.id) : openReschedule(post)}
                          id={`btn-reschedule-${post.id}`}
                        >
                          📅 {rescheduling[post.id]?.open ? 'Cancel Reschedule' : 'Reschedule'}
                        </button>
                        <button
                          className="btn btn-ghost"
                          onClick={() => handleStatusChange(post.id, 'pending_approval')}
                          id={`btn-unapprove-${post.id}`}
                        >
                          ↩️ Move to Pending
                        </button>
                        <a href={`/edit/${post.id}`} className="btn btn-ghost" style={{ textDecoration: 'none' }}>
                          ✏️ Edit
                        </a>
                      </div>

                      {/* Inline reschedule panel */}
                      {rescheduling[post.id]?.open && (
                        <div style={{
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-accent)',
                          borderRadius: 'var(--radius-md)',
                          padding: '20px',
                          display: 'flex',
                          gap: '16px',
                          flexWrap: 'wrap',
                          alignItems: 'flex-end',
                        }}>
                          <div>
                            <label className="form-label" style={{ marginBottom: '6px', display: 'block' }}>📅 New Date</label>
                            <input
                              type="date"
                              className="form-input"
                              value={rescheduling[post.id]?.date || ''}
                              min={new Date().toISOString().split('T')[0]}
                              onChange={e => setRescheduling(prev => ({
                                ...prev,
                                [post.id]: { ...prev[post.id], date: e.target.value },
                              }))}
                              style={{ width: '180px' }}
                              id={`input-reschedule-date-${post.id}`}
                            />
                          </div>
                          <div>
                            <label className="form-label" style={{ marginBottom: '6px', display: 'block' }}>🕐 New Time</label>
                            <input
                              type="time"
                              className="form-input"
                              value={rescheduling[post.id]?.time || '09:00'}
                              onChange={e => setRescheduling(prev => ({
                                ...prev,
                                [post.id]: { ...prev[post.id], time: e.target.value },
                              }))}
                              style={{ width: '140px' }}
                              id={`input-reschedule-time-${post.id}`}
                            />
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              className="btn btn-success"
                              onClick={() => handleReschedule(post.id)}
                              id={`btn-confirm-reschedule-${post.id}`}
                            >
                              ✅ Confirm Reschedule
                            </button>
                            <button
                              className="btn btn-ghost"
                              onClick={() => closeReschedule(post.id)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Published — view only */}
                  {post.status === 'published' && (
                    <>
                      {post.facebook_post_id && (
                        <a
                          href={`https://www.facebook.com/${post.facebook_post_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary"
                          style={{ textDecoration: 'none' }}
                        >
                          📘 View on Facebook
                        </a>
                      )}
                      {post.instagram_post_id && (
                        <a
                          href={`https://www.instagram.com/p/${post.instagram_post_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary"
                          style={{ textDecoration: 'none' }}
                        >
                          📷 View on Instagram
                        </a>
                      )}
                      <a href={`/edit/${post.id}`} className="btn btn-ghost" style={{ textDecoration: 'none' }}>
                        👁️ View Details
                      </a>
                    </>
                  )}

                  {/* Delete — always visible */}
                  <button
                    className="btn btn-ghost"
                    onClick={() => {
                      if (confirm('Delete this post?')) {
                        fetch(`/api/content/${post.id}`, { method: 'DELETE' }).then(() => {
                          addToast('Post deleted', 'info');
                          fetchAllTabs();
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
