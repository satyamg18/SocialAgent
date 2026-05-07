'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/Toast';

export default function SettingsPage() {
  const addToast = useToast();
  const [connections, setConnections] = useState({ linkedin: false, instagram: false });
  const [config, setConfig] = useState({ hasGeminiKey: false, n8nEnabled: false });
  const [loading, setLoading] = useState(true);

  const fetchConnections = useCallback(async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setConnections(data.connections);
        if (data.config) setConfig(data.config);
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your platform connections and preferences</p>
        </div>
      </div>

      {/* Platform Connections */}
      <div className="card settings-section">
        <div className="card-body">
          <h2 className="settings-heading">🔗 Platform Connections</h2>

          {/* LinkedIn */}
          <div className="settings-row" style={{ border: connections.linkedin ? '1px solid rgba(10, 102, 194, 0.3)' : '1px solid var(--border-subtle)' }}>
            <div className="flex items-center gap-3">
              <div className="settings-icon-box" style={{ background: 'var(--linkedin-soft)' }}>💼</div>
              <div>
                <div className="settings-label">LinkedIn</div>
                <div className="text-sm text-muted">
                  {connections.linkedin
                    ? `Connected as ${connections.linkedinUser || 'user'}`
                    : 'Not connected — Connect to publish posts to LinkedIn'}
                </div>
              </div>
            </div>
            <div>
              {connections.linkedin ? (
                <span className="status-badge approved"><span className="status-dot"></span> Connected</span>
              ) : (
                <button
                  className="btn btn-secondary"
                  onClick={() => addToast('Set up LinkedIn credentials in .env.local first, then use OAuth flow', 'info')}
                  id="btn-connect-linkedin"
                >
                  Connect LinkedIn
                </button>
              )}
            </div>
          </div>

          {/* Instagram */}
          <div className="settings-row" style={{ border: connections.instagram ? '1px solid rgba(225, 48, 108, 0.3)' : '1px solid var(--border-subtle)' }}>
            <div className="flex items-center gap-3">
              <div className="settings-icon-box" style={{ background: 'var(--instagram-soft)' }}>📷</div>
              <div>
                <div className="settings-label">Instagram</div>
                <div className="text-sm text-muted">
                  {connections.instagram
                    ? `Connected as ${connections.instagramUser || 'user'}`
                    : 'Not connected — Connect to publish posts to Instagram'}
                </div>
              </div>
            </div>
            <div>
              {connections.instagram ? (
                <span className="status-badge approved"><span className="status-dot"></span> Connected</span>
              ) : (
                <button
                  className="btn btn-secondary"
                  onClick={() => addToast('Set up Instagram/Meta credentials in .env.local first, then use OAuth flow', 'info')}
                  id="btn-connect-instagram"
                >
                  Connect Instagram
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* API Configuration */}
      <div className="card settings-section">
        <div className="card-body">
          <h2 className="settings-heading">🔑 API Configuration</h2>

          <div className="settings-info-box">
            <p className="text-sm" style={{ color: 'var(--accent-primary)', marginBottom: '8px', fontWeight: 600 }}>
              ℹ️ Environment Variables
            </p>
            <p className="text-sm text-muted">
              API keys are configured via the <code className="settings-code">.env.local</code> file for security.
              Copy <code className="settings-code">.env.local.example</code> and fill in your keys.
            </p>
          </div>

          <div className="settings-keys-list">
            <div className="settings-key-row">
              <div>
                <div className="text-sm" style={{ fontWeight: 600 }}>GEMINI_API_KEY</div>
                <div className="text-xs text-muted">Google Gemini API for text & image generation</div>
              </div>
              <span className={`status-badge ${config.hasGeminiKey ? 'approved' : 'draft'}`}>
                <span className="status-dot"></span>
                {config.hasGeminiKey ? 'Configured' : 'Not Set'}
              </span>
            </div>

            <div className="settings-key-row">
              <div>
                <div className="text-sm" style={{ fontWeight: 600 }}>N8N_ENABLED</div>
                <div className="text-xs text-muted">Workflow automation via n8n</div>
              </div>
              <span className={`status-badge ${config.n8nEnabled ? 'approved' : 'draft'}`}>
                <span className="status-dot"></span>
                {config.n8nEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            <div className="settings-key-row">
              <div>
                <div className="text-sm" style={{ fontWeight: 600 }}>LINKEDIN_CLIENT_ID / SECRET</div>
                <div className="text-xs text-muted">LinkedIn OAuth credentials</div>
              </div>
              <span className="status-badge draft">
                <span className="status-dot"></span>
                Check .env.local
              </span>
            </div>

            <div className="settings-key-row">
              <div>
                <div className="text-sm" style={{ fontWeight: 600 }}>INSTAGRAM_APP_ID / SECRET</div>
                <div className="text-xs text-muted">Meta/Instagram OAuth credentials</div>
              </div>
              <span className="status-badge draft">
                <span className="status-dot"></span>
                Check .env.local
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Setup Guide */}
      <div className="card">
        <div className="card-body">
          <h2 className="settings-heading">📖 Setup Guide</h2>

          <div className="settings-guide-list">
            <div className="settings-guide-step">
              <h3 style={{ marginBottom: '8px', color: 'var(--accent-primary)' }}>Step 1: Gemini API Key</h3>
              <p className="text-sm text-muted">
                Visit <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-accent)' }}>Google AI Studio</a> →
                Get API Key → Add to <code className="settings-code">.env.local</code> as <code className="settings-code">GEMINI_API_KEY</code>
              </p>
            </div>

            <div className="settings-guide-step">
              <h3 style={{ marginBottom: '8px', color: 'var(--linkedin-color)' }}>Step 2: LinkedIn Setup</h3>
              <p className="text-sm text-muted">
                Go to <a href="https://developer.linkedin.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-accent)' }}>LinkedIn Developer Portal</a> →
                Create App → Enable "Share on LinkedIn" → Copy Client ID and Secret to <code className="settings-code">.env.local</code>
              </p>
            </div>

            <div className="settings-guide-step">
              <h3 style={{ marginBottom: '8px', color: '#e1306c' }}>Step 3: Instagram Setup</h3>
              <p className="text-sm text-muted">
                Visit <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-accent)' }}>Meta for Developers</a> →
                Create App → Request <code className="settings-code">instagram_content_publish</code> permission → Get App ID and Secret → Add to <code className="settings-code">.env.local</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
