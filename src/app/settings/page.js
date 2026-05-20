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
    const detail = searchParams.get('detail');
    const success = searchParams.get('success');

    if (error) {
      const msg = detail ? `Auth failed: ${decodeURIComponent(detail)}` : `Authentication failed: ${error}`;
      addToast(msg, 'error');
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

  const handleDisconnect = async (platform) => {
    if (!confirm(`Are you sure you want to disconnect ${platform === 'facebook' ? 'Facebook' : 'Instagram'}?`)) return;
    try {
      const res = await fetch('/api/auth/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      });
      if (res.ok) {
        addToast(`${platform === 'facebook' ? 'Facebook' : 'Instagram'} disconnected!`, 'success');
        fetchConnections();
      } else {
        const data = await res.json();
        addToast(`Failed to disconnect: ${data.error || 'Unknown error'}`, 'error');
      }
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your platform connections</p>
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
                    : 'Not connected — connect to publish posts to your Facebook Page'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {connections.facebook ? (
                <>
                  <span className="status-badge approved"><span className="status-dot"></span> Connected</span>
                  <button 
                    className="btn btn-ghost btn-sm" 
                    onClick={() => handleDisconnect('facebook')}
                    style={{ padding: '6px 10px', fontSize: '0.75rem', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444' }}
                  >
                    Disconnect
                  </button>
                </>
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
                    : 'Not connected — connect to publish posts to Instagram'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {connections.instagram ? (
                <>
                  <span className="status-badge approved"><span className="status-dot"></span> Connected</span>
                  <button 
                    className="btn btn-ghost btn-sm" 
                    onClick={() => handleDisconnect('instagram')}
                    style={{ padding: '6px 10px', fontSize: '0.75rem', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444' }}
                  >
                    Disconnect
                  </button>
                </>
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

      {/* API Status */}
      <div className="card settings-section">
        <div className="card-body">
          <h2 className="settings-heading">🔑 API Status</h2>
          <div className="settings-keys-list">

            <div className="settings-key-row">
              <div>
                <div className="text-sm" style={{ fontWeight: 600 }}>GROQ_API_KEY</div>
                <div className="text-xs text-muted">AI text generation via LLaMA 3 (Groq)</div>
              </div>
              <span className={`status-badge ${config.hasGroqKey ? 'approved' : 'draft'}`}>
                <span className="status-dot"></span>
                {config.hasGroqKey ? 'Configured' : 'Not Set'}
              </span>
            </div>

            <div className="settings-key-row">
              <div>
                <div className="text-sm" style={{ fontWeight: 600 }}>FACEBOOK_APP_ID / SECRET</div>
                <div className="text-xs text-muted">Meta OAuth for Facebook & Instagram</div>
              </div>
              <span className={`status-badge ${config.hasFacebookKeys ? 'approved' : 'draft'}`}>
                <span className="status-dot"></span>
                {config.hasFacebookKeys ? 'Configured' : 'Not Set'}
              </span>
            </div>

            <div className="settings-key-row">
              <div>
                <div className="text-sm" style={{ fontWeight: 600 }}>DATABASE_URL</div>
                <div className="text-xs text-muted">Neon Postgres (production) or SQLite (local)</div>
              </div>
              <span className="status-badge approved">
                <span className="status-dot"></span>
                Auto-detected
              </span>
            </div>

          </div>
        </div>
      </div>

      {/* Quick Setup Reference */}
      <div className="card">
        <div className="card-body">
          <h2 className="settings-heading">📖 Quick Setup</h2>
          <div className="settings-guide-list">

            <div className="settings-guide-step">
              <h3 style={{ marginBottom: '8px', color: 'var(--accent-primary)' }}>1. Groq API Key</h3>
              <p className="text-sm text-muted">
                Get a free key from{' '}
                <a href="https://console.groq.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-accent)' }}>
                  console.groq.com
                </a>{' '}
                → add as <code className="settings-code">GROQ_API_KEY</code> in Vercel Environment Variables.
              </p>
            </div>

            <div className="settings-guide-step">
              <h3 style={{ marginBottom: '8px', color: 'var(--facebook-color)' }}>2. Facebook & Instagram Setup</h3>
              <p className="text-sm text-muted">
                Go to{' '}
                <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-accent)' }}>
                  Meta Developer Portal
                </a>{' '}
                → Create App → Add <strong>Facebook Login for Business</strong> → copy <code className="settings-code">App ID</code> and{' '}
                <code className="settings-code">App Secret</code> → add Valid OAuth Redirect URIs:
              </p>
              <code className="settings-code" style={{ display: 'block', marginTop: '8px', padding: '8px', fontSize: '0.75rem' }}>
                https://socialagent18.vercel.app/api/auth/facebook/callback
              </code>
              <code className="settings-code" style={{ display: 'block', marginTop: '4px', padding: '8px', fontSize: '0.75rem' }}>
                https://socialagent18.vercel.app/api/auth/instagram/callback
              </code>
            </div>

            <div className="settings-guide-step">
              <h3 style={{ marginBottom: '8px', color: '#e1306c' }}>3. Instagram Business Account</h3>
              <p className="text-sm text-muted">
                Your Instagram account must be a <strong>Business or Creator account</strong> linked to your Facebook Page in{' '}
                <a href="https://business.facebook.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-accent)' }}>
                  Meta Business Suite
                </a>.
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
