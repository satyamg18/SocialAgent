'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function PlanPage() {
  const router = useRouter();
  const addToast = useToast();
  const today = new Date();

  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [theme, setTheme] = useState('');
  const [goals, setGoals] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [notes, setNotes] = useState('');
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  async function handleGeneratePlan() {
    setLoading(true);
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month, year, theme, goals, target_audience: targetAudience, notes,
          suggest: true,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      const data = await res.json();
      setSuggestions(data.suggestions);
      addToast('Monthly plan generated!', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreatePosts() {
    if (!suggestions || suggestions.length === 0) return;

    setCreating(true);
    try {
      let created = 0;
      for (const suggestion of suggestions) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(suggestion.day).padStart(2, '0')}`;
        const res = await fetch('/api/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: suggestion.title,
            platform: suggestion.platform || 'both',
            written_gist: suggestion.written_gist,
            visual_gist: suggestion.visual_gist,
            scheduled_date: dateStr,
            scheduled_time: '10:00',
            status: 'draft',
          }),
        });
        if (res.ok) created++;
      }

      addToast(`${created} posts created as drafts!`, 'success');
      router.push('/calendar');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setCreating(false);
    }
  }

  async function handleSavePlan() {
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month, year, theme, goals, target_audience: targetAudience, notes,
        }),
      });

      if (res.ok) {
        addToast('Plan saved!', 'success');
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  }

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">Monthly Plan</h1>
          <p className="page-subtitle">Define your content strategy and let AI build your calendar</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: suggestions ? '1fr 1.5fr' : '1fr', gap: '24px' }}>
        {/* Plan Form */}
        <div className="card">
          <div className="card-body">
            <h2 style={{ marginBottom: '24px' }}>📋 Plan Details</h2>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Month</label>
                <select className="form-select" value={month} onChange={e => setMonth(Number(e.target.value))} id="select-month">
                  {MONTHS.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Year</label>
                <select className="form-select" value={year} onChange={e => setYear(Number(e.target.value))} id="select-year">
                  {[2025, 2026, 2027].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Theme / Focus Area</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Product Launch Month, Community Building, Year-End Recap..."
                value={theme}
                onChange={e => setTheme(e.target.value)}
                id="input-theme"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Goals</label>
              <textarea
                className="form-textarea"
                placeholder="What do you want to achieve this month? e.g., Increase brand awareness, drive traffic to blog, announce partnership..."
                value={goals}
                onChange={e => setGoals(e.target.value)}
                rows={3}
                id="textarea-goals"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Target Audience</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Tech professionals, HR managers, Startup founders..."
                value={targetAudience}
                onChange={e => setTargetAudience(e.target.value)}
                id="input-audience"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Additional Notes</label>
              <textarea
                className="form-textarea"
                placeholder="Any specific events, holidays, or campaigns to include..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                id="textarea-notes"
              />
            </div>

            <div className="flex gap-3">
              <button
                className="btn btn-primary"
                onClick={handleGeneratePlan}
                disabled={loading}
                id="btn-generate-plan"
              >
                {loading ? <><span className="spinner"></span> Generating Plan...</> : '🤖 AI Generate Plan'}
              </button>
              <button className="btn btn-secondary" onClick={handleSavePlan} id="btn-save-plan">
                💾 Save Plan
              </button>
            </div>
          </div>
        </div>

        {/* Suggestions Display */}
        {suggestions && (
          <div className="card animate-slideUp">
            <div className="card-body">
              <div className="flex items-center justify-between mb-4">
                <h2>✨ Suggested Content Calendar</h2>
                <span className="text-sm text-muted">{suggestions.length} posts</span>
              </div>

              <p className="text-sm text-muted mb-4">
                Review the suggested posts below. Click "Create All as Drafts" to add them to your calendar, then polish each one individually.
              </p>

              <div style={{ maxHeight: '600px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '8px' }}>
                {suggestions.map((item, idx) => (
                  <div
                    key={idx}
                    className="post-card"
                    style={{ cursor: 'default' }}
                  >
                    <div className="post-card-header">
                      <div>
                        <div className="post-card-title">{item.title}</div>
                        <div className="text-xs text-muted mt-2">
                          📅 {MONTHS[month - 1]} {item.day}, {year}
                        </div>
                      </div>
                      <span className={`platform-badge ${item.platform}`}>
                        {item.platform}
                      </span>
                    </div>
                    <div className="post-card-body" style={{ WebkitLineClamp: 'unset' }}>
                      <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px', fontSize: '0.75rem' }}>
                        ✍️ Content:
                      </strong>
                      {item.written_gist}
                    </div>
                    {item.visual_gist && (
                      <div className="text-xs text-muted" style={{ marginTop: '-8px', marginBottom: '8px' }}>
                        🎨 Visual: {item.visual_gist}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  className="btn btn-success btn-lg w-full"
                  onClick={handleCreatePosts}
                  disabled={creating}
                  id="btn-create-all"
                >
                  {creating ? <><span className="spinner"></span> Creating Posts...</> : `📝 Create All ${suggestions.length} Posts as Drafts`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
