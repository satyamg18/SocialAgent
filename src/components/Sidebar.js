'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

const navItems = [
  { href: '/', icon: '📊', label: 'Dashboard' },
  { href: '/compose', icon: '✍️', label: 'Compose Post' },
  { href: '/calendar', icon: '📅', label: 'Calendar' },
  { href: '/plan', icon: '📋', label: 'Monthly Plan' },
  { href: '/approve', icon: '✅', label: 'Approval Queue', badge: true },
  { href: '/settings', icon: '⚙️', label: 'Settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(0);
  const [connections, setConnections] = useState({ linkedin: false, instagram: false });

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/stats');
        if (res.ok) {
          const data = await res.json();
          setPendingCount(data.stats.pending);
          setConnections(data.connections);
        }
      } catch (e) {
        // Silently fail
      }
    }
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="sidebar" id="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🚀</div>
          <div>
            <div className="sidebar-logo-text">SocialPilot</div>
            <div className="sidebar-logo-sub">Automation Agent</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Main</div>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-link ${pathname === item.href ? 'active' : ''}`}
            id={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <span className="nav-link-icon">{item.icon}</span>
            <span>{item.label}</span>
            {item.badge && pendingCount > 0 && (
              <span className="nav-badge">{pendingCount}</span>
            )}
          </Link>
        ))}
      </nav>

      <div className="sidebar-connections">
        <div className="nav-section-label">Connections</div>
        <div className="connection-item">
          <span className={`connection-dot ${connections.linkedin ? 'connected' : 'disconnected'}`} />
          <span>LinkedIn {connections.linkedinUser ? `(${connections.linkedinUser})` : ''}</span>
        </div>
        <div className="connection-item">
          <span className={`connection-dot ${connections.instagram ? 'connected' : 'disconnected'}`} />
          <span>Instagram {connections.instagramUser ? `(${connections.instagramUser})` : ''}</span>
        </div>
      </div>
    </aside>
  );
}
