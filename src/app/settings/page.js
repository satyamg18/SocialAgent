'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/Toast';

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addToast = useToast();
  const [connections, setConnections] = useState({ facebook: false, instagram: false });
  const [config, setConfig] = useState({ hasGroqKey: false, n8nEnabled: false });
  const [loading, setLoading] = useState(true);

  // Handle OAuth Redirects
  useEffect(() => {
    const error = searchParams.get('error');
    const success = searchParams.get('success');

    if (error) {
      addToast(`Authentication failed: ${error}`, 'error');
      // Remove query param from URL
      router.replace('/settings');
    } else if (success) {
      addToast('Platform connected successfully!', 'success');
      router.replace('/settings');
    }
  }, [searchParams, router, addToast]);

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

          {/* Facebook */}
          <div className="settings-row" style={{ border: connections.facebook ? '1px solid rgba(24, 119, 242, 0.3)' : '1px solid var(--border-subtle)' }}>
            <div className="flex items-center gap-3">
              <div className="settings-icon-box" style={{ background: 'rgba(24, 119, 242, 0.15)' }}>📘</div>
              <div>
                <div className="settings-label">Facebook</div>
                <div className="text-sm text-muted">
                  {connections.facebook
                    ? `Connected as ${connections.facebookUser || 'page'}`
                    : 'Not connected — Connect to publish posts to your Facebook Page'}
                </div>
              </div>
            </div>
            <div>
              {connections.facebook ? (
                <span className="status-badge approved"><span className="status-dot"></span> Connected</span>
              ) : (
                <a
                  className="btn btn-secondary"
                  href="/api/auth/facebook"
                  id="btn-connect-facebook"
                  style={{ textDecoration: 'none' }}
                >
                  Connect Facebook
                </a>
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
                <a
                  className="btn btn-secondary"
                  href="/api/auth/instagram"
                  id="btn-connect-instagram"
                  style={{ textDecoration: 'none' }}
                >
                  Connect Instagram
                </a>
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
                <div className="text-sm" style={{ fontWeight: 600 }}>GROQ_API_KEY</div>
                <div className="text-xs text-muted">Groq API for AI text generation (LLaMA 3)</div>
              </div>
              <span className={`status-badge ${config.hasGroqKey ? 'approved' : 'draft'}`}>
                <span className="status-dot"></span>
                {config.hasGroqKey ? 'Configured' : 'Not Set'}
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
                <div className="text-sm" style={{ fontWeight: 600 }}>FACEBOOK_APP_ID / SECRET</div>
                <div className="text-xs text-muted">Facebook OAuth credentials</div>
              </div>
              <span className={`status-badge ${config.hasFacebookKeys ? 'approved' : 'draft'}`}>
                <span className="status-dot"></span>
                {config.hasFacebookKeys ? 'Configured' : 'Check .Env.Local'}
              </span>
            </div>

            <div className="settings-key-row">
              <div>
                <div className="text-sm" style={{ fontWeight: 600 }}>INSTAGRAM_APP_ID / SECRET</div>
                <div className="text-xs text-muted">Meta/Instagram OAuth credentials</div>
              </div>
              <span className={`status-badge ${config.hasInstagramKeys ? 'approved' : 'draft'}`}>
                <span className="status-dot"></span>
                {config.hasInstagramKeys ? 'Configured' : 'Check .Env.Local'}
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
              <h3 style={{ marginBottom: '8px', color: 'var(--accent-primary)' }}>Step 1: Groq API Key</h3>
              <p className="text-sm text-muted">
                Visit <a href="https://console.groq.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-accent)' }}>Groq Console</a> →
                Create API Key → Add to <code className="settings-code">.env.local</code> as <code className="settings-code">GROQ_API_KEY</code>
              </p>
            </div>

            <div className="settings-guide-step">
              <h3 style={{ marginBottom: '8px', color: 'var(--facebook-color)' }}>Step 2: Facebook Setup</h3>
              <p className="text-sm text-muted mb-4">
                Go to <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-accent)' }}>Meta Developer Portal</a> →
                Create App → Enable "Facebook Login for Business" → Copy App ID and App Secret to <code className="settings-code">.env.local</code>
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

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center"><span className="spinner"></span> Loading settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
