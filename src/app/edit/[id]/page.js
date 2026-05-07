'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/components/Toast';

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const addToast = useToast();
  const postId = params.id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [post, setPost] = useState(null);
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState('both');
  const [writtenContent, setWrittenContent] = useState('');
  const [imagePath, setImagePath] = useState('');

  const loadPost = useCallback(async () => {
    try {
      const res = await fetch(`/api/content/${postId}`);
      if (!res.ok) throw new Error('Failed to load post');
      const data = await res.json();
      
      setPost(data.post);
      setTitle(data.post.title);
      setPlatform(data.post.platform);
      setWrittenContent(data.post.written_content || data.post.written_gist || '');
      setImagePath(data.post.image_path || '');
    } catch (err) {
      addToast(err.message, 'error');
      router.push('/');
    } finally {
      setLoading(false);
    }
  }, [postId, addToast, router]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  async function handleSave(status = null) {
    setSaving(true);
    try {
      const updates = {
        title,
        platform,
        written_content: writtenContent,
        image_path: imagePath,
      };
      
      if (status) {
        updates.status = status;
      }

      const res = await fetch(`/api/content/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error('Failed to update post');
      
      addToast(status === 'pending_approval' ? 'Submitted for approval!' : 'Draft saved!', 'success');
      router.push(status === 'pending_approval' ? '/approve' : '/');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-fadeIn">
        <div className="page-header">
          <div>
            <h1 className="page-title">Edit Post</h1>
            <p className="page-subtitle">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">Edit Post</h1>
          <p className="page-subtitle">Update your content before it goes live</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '800px' }}>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="form-group">
            <label className="form-label">Post Title</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Platform</label>
            <select
              className="form-select"
              value={platform}
              onChange={e => setPlatform(e.target.value)}
            >
              <option value="both">Both (LinkedIn + Instagram)</option>
              <option value="linkedin">LinkedIn Only</option>
              <option value="instagram">Instagram Only</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Written Content</label>
            <textarea
              className="form-textarea"
              rows={8}
              value={writtenContent}
              onChange={e => setWrittenContent(e.target.value)}
              placeholder="Your post content goes here..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Image URL / Path</label>
            <input
              type="text"
              className="form-input"
              value={imagePath}
              onChange={e => setImagePath(e.target.value)}
              placeholder="/generated/image.png or https://..."
            />
            {imagePath && (
              <div style={{ marginTop: '12px' }}>
                <img 
                  src={imagePath} 
                  alt="Post preview" 
                  style={{ maxHeight: '200px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }} 
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '16px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
            <button
              className="btn btn-secondary"
              onClick={() => handleSave()}
              disabled={saving}
            >
              {saving ? 'Saving...' : '💾 Save Changes'}
            </button>
            <button
              className="btn btn-primary"
              onClick={() => handleSave('pending_approval')}
              disabled={saving}
            >
              {saving ? 'Submitting...' : '✅ Submit for Approval'}
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => router.back()}
              style={{ marginLeft: 'auto' }}
            >
              Cancel
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
}
