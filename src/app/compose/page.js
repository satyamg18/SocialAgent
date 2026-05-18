'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';

const STEPS = ['Setup', 'Content', 'Visual', 'Preview'];

export default function ComposePage() {
  const router = useRouter();
  const addToast = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    platform: 'both',
    scheduled_date: '',
    scheduled_time: '10:00',
    written_gist: '',
    written_content: '',
    visual_gist: '',
    image_path: '',
    tone: 'professional',
  });

  const [generatedText, setGeneratedText] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState('facebook');

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  async function handleGenerateText() {
    if (!formData.written_gist.trim()) {
      addToast('Please enter a content gist first', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/generate/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gist: formData.written_gist,
          platform: formData.platform,
          tone: formData.tone,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Generation failed');
      }

      const data = await res.json();
      setGeneratedText(data.content);

      if (formData.platform === 'both') {
        updateField('written_content', data.content.raw);
      } else {
        updateField('written_content', data.content[formData.platform] || data.content.raw);
      }

      addToast('Content generated successfully!', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateImage() {
    if (!formData.visual_gist.trim()) {
      addToast('Please describe the visual content first', 'error');
      return;
    }

    setImageLoading(true);
    setImageLoaded(false);
    try {
      const res = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visualGist: formData.visual_gist }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Image generation failed');
      }

      const data = await res.json();
      updateField('image_path', data.image?.path || data.image);
      addToast('Image generated! It may take a moment to render.', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setImageLoading(false);
    }
  }

  async function handleSave(status = 'draft') {
    if (!formData.title.trim()) {
      addToast('Please enter a post title', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, status }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      addToast(
        status === 'pending_approval' ? 'Post submitted for approval!' : 'Post saved as draft!',
        'success'
      );
      router.push(status === 'pending_approval' ? '/approve' : '/');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">Compose Post</h1>
          <p className="page-subtitle">Create AI-powered content for your social channels</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="composer-steps">
        {STEPS.map((step, i) => (
          <div
            key={step}
            className={`composer-step ${i === currentStep ? 'active' : i < currentStep ? 'completed' : ''}`}
            onClick={() => setCurrentStep(i)}
          >
            <span className="step-number">{i < currentStep ? '✓' : i + 1}</span>
            <span>{step}</span>
          </div>
        ))}
      </div>

      {/* Step 0: Setup */}
      {currentStep === 0 && (
        <div className="card animate-slideUp">
          <div className="card-body">
            <h2 style={{ marginBottom: '24px' }}>📌 Post Details</h2>

            <div className="form-group">
              <label className="form-label">Post Title</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Our new product launch, Team spotlight, Industry insights..."
                value={formData.title}
                onChange={e => updateField('title', e.target.value)}
                id="input-title"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Platform</label>
                <select
                  className="form-select"
                  value={formData.platform}
                  onChange={e => updateField('platform', e.target.value)}
                  id="select-platform"
                >
                  <option value="both">🌐 Both (Facebook + Instagram)</option>
                  <option value="facebook">📘 Facebook</option>
                  <option value="instagram">📷 Instagram</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Tone</label>
                <select
                  className="form-select"
                  value={formData.tone}
                  onChange={e => updateField('tone', e.target.value)}
                  id="select-tone"
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual & Friendly</option>
                  <option value="inspirational">Inspirational</option>
                  <option value="educational">Educational</option>
                  <option value="storytelling">Storytelling</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Scheduled Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.scheduled_date}
                  onChange={e => updateField('scheduled_date', e.target.value)}
                  id="input-date"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Scheduled Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={formData.scheduled_time}
                  onChange={e => updateField('scheduled_time', e.target.value)}
                  id="input-time"
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className="btn btn-primary" onClick={() => setCurrentStep(1)} disabled={!formData.title.trim()}>
                Next: Write Content →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Written Content */}
      {currentStep === 1 && (
        <div className="card animate-slideUp">
          <div className="card-body">
            <h2 style={{ marginBottom: '24px' }}>✍️ Written Content</h2>

            <div className="form-group">
              <label className="form-label">Content Gist / Idea</label>
              <textarea
                className="form-textarea"
                placeholder="Describe what this post should be about in a few sentences."
                value={formData.written_gist}
                onChange={e => updateField('written_gist', e.target.value)}
                rows={5}
                id="textarea-gist"
              />
              <p className="form-hint">Be specific — the more detail you give, the better the AI output.</p>
            </div>

            <div className="flex gap-3" style={{ marginBottom: '16px' }}>
              <button
                className="btn btn-primary"
                onClick={handleGenerateText}
                disabled={loading || !formData.written_gist.trim()}
                id="btn-generate-text"
              >
                {loading ? <><span className="spinner"></span> Generating...</> : '✨ Generate Content'}
              </button>
            </div>

            {generatedText && (
              <div>
                {formData.platform === 'both' && (
                  <div className="tabs">
                    <button
                      className={`tab ${selectedVersion === 'facebook' ? 'active' : ''}`}
                      onClick={() => setSelectedVersion('facebook')}
                    >
                      📘 Facebook Version
                    </button>
                    <button
                      className={`tab ${selectedVersion === 'instagram' ? 'active' : ''}`}
                      onClick={() => setSelectedVersion('instagram')}
                    >
                      📷 Instagram Version
                    </button>
                  </div>
                )}

                <div className="generated-content">
                  <div className="generated-content-text">
                    {formData.platform === 'both'
                      ? generatedText[selectedVersion] || generatedText.raw
                      : generatedText[formData.platform] || generatedText.raw}
                  </div>
                </div>

                <div className="form-group mt-4">
                  <label className="form-label">Edit Final Content</label>
                  <textarea
                    className="form-textarea"
                    value={formData.written_content}
                    onChange={e => updateField('written_content', e.target.value)}
                    rows={8}
                    id="textarea-final-content"
                  />
                  <p className="form-hint">Feel free to edit the AI-generated content to add your personal touch.</p>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-4">
              <button className="btn btn-ghost" onClick={() => setCurrentStep(0)}>
                ← Back
              </button>
              <button className="btn btn-primary" onClick={() => setCurrentStep(2)}>
                Next: Visual Content →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Visual Content */}
      {currentStep === 2 && (
        <div className="card animate-slideUp">
          <div className="card-body">
            <h2 style={{ marginBottom: '24px' }}>🎨 Visual Content</h2>

            <div className="form-group">
              <label className="form-label">Visual Content Description</label>
              <textarea
                className="form-textarea"
                placeholder="Describe the image you want. E.g., 'A modern office space with diverse team members collaborating around a whiteboard, warm natural lighting, plants in the background.'"
                value={formData.visual_gist}
                onChange={e => updateField('visual_gist', e.target.value)}
                rows={4}
                id="textarea-visual-gist"
              />
              <p className="form-hint">Be descriptive — include colors, mood, composition, and style preferences.</p>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleGenerateImage}
              disabled={imageLoading || !formData.visual_gist.trim()}
              id="btn-generate-image"
            >
              {imageLoading ? <><span className="spinner"></span> Generating Image...</> : '🖼️ Generate Image'}
            </button>

            {formData.image_path && (
              <div style={{ marginTop: '24px' }}>
                <p className="form-label">Generated Image Preview</p>
                <div style={{
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  border: '1px solid var(--border-accent)',
                  minHeight: '200px',
                  background: 'var(--bg-card)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}>
                  {!imageLoaded && (
                    <p style={{ position: 'absolute', textAlign: 'center', color: 'var(--text-muted)' }}>
                      ⏳ Generating image — please wait...
                    </p>
                  )}
                  <img
                    src={formData.image_path}
                    alt="Generated post visual"
                    style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', display: imageLoaded ? 'block' : 'none' }}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageLoaded(false)}
                  />
                </div>
                <button
                  className="btn btn-ghost btn-sm mt-2"
                  onClick={() => { updateField('image_path', ''); setImageLoaded(false); }}
                >
                  Remove Image
                </button>
              </div>
            )}

            <div className="flex justify-between mt-4">
              <button className="btn btn-ghost" onClick={() => setCurrentStep(1)}>
                ← Back
              </button>
              <button className="btn btn-primary" onClick={() => setCurrentStep(3)}>
                Next: Preview →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Preview & Submit */}
      {currentStep === 3 && (
        <div className="animate-slideUp">
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-body">
              <h2 style={{ marginBottom: '24px' }}>👁️ Post Preview</h2>

              <div className="post-preview">
                <div className="preview-facebook" style={{ marginBottom: '24px' }}>
                  <div className="preview-facebook-header">
                    <div className="preview-avatar">🏢</div>
                    <div>
                      <div className="preview-name">Your Organization</div>
                      <div className="preview-subtitle">
                        {formData.scheduled_date
                          ? new Date(formData.scheduled_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                          : 'Scheduled date'} · 🌐
                      </div>
                    </div>
                  </div>

                  {formData.image_path && (
                    <>
                      <img
                        src={formData.image_path}
                        alt="Post visual"
                        className="preview-image"
                        onError={e => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      <p style={{ display: 'none', padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        ⏳ Image still generating — go back and wait a moment.
                      </p>
                    </>
                  )}

                  <div className="preview-content">
                    {formData.written_content || 'No written content yet. Go back to generate or write content.'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
                <span className={`platform-badge ${formData.platform}`}>
                  {formData.platform === 'both' ? '🌐 Both Platforms' : formData.platform === 'facebook' ? '📘 Facebook' : '📷 Instagram'}
                </span>
                <span className="status-badge draft">
                  <span className="status-dot"></span>
                  Draft
                </span>
                {formData.scheduled_date && (
                  <span className="text-xs text-muted" style={{ padding: '4px 0' }}>
                    📅 {new Date(formData.scheduled_date).toLocaleDateString()} at {formData.scheduled_time}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button className="btn btn-ghost" onClick={() => setCurrentStep(2)}>
              ← Back to Edit
            </button>
            <div className="flex gap-3">
              <button
                className="btn btn-secondary"
                onClick={() => handleSave('draft')}
                disabled={loading}
                id="btn-save-draft"
              >
                💾 Save as Draft
              </button>
              <button
                className="btn btn-success"
                onClick={() => handleSave('pending_approval')}
                disabled={loading || !formData.written_content.trim()}
                id="btn-submit-approval"
              >
                {loading ? <><span className="spinner"></span> Saving...</> : '📤 Submit for Approval'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}