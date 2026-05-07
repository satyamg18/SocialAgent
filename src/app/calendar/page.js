'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function CalendarPage() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/content?month=${currentMonth + 1}&year=${currentYear}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (e) {
      console.error('Failed to fetch posts:', e);
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  function getCalendarDays() {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days = [];

    // Previous month trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: daysInPrevMonth - i, currentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, currentMonth: true });
    }

    // Next month leading days
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, currentMonth: false });
    }

    return days;
  }

  function getPostsForDay(day) {
    if (!day.currentMonth) return [];
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`;
    return posts.filter(p => p.scheduled_date === dateStr);
  }

  function isToday(day) {
    return day.currentMonth &&
      day.day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear();
  }

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  }

  const calendarDays = getCalendarDays();

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">Content Calendar</h1>
          <p className="page-subtitle">Visualize your scheduled content at a glance</p>
        </div>
        <div className="page-actions">
          <Link href="/compose" className="btn btn-primary" id="btn-new-post-cal">
            ✍️ New Post
          </Link>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button className="btn btn-ghost" onClick={prevMonth} id="btn-prev-month">← Prev</button>
          <h2 style={{ margin: 0 }}>{MONTHS[currentMonth]} {currentYear}</h2>
          <button className="btn btn-ghost" onClick={nextMonth} id="btn-next-month">Next →</button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid">
        {DAYS.map(day => (
          <div key={day} className="calendar-header-cell">{day}</div>
        ))}

        {calendarDays.map((day, idx) => {
          const dayPosts = getPostsForDay(day);
          return (
            <div
              key={idx}
              className={`calendar-cell ${!day.currentMonth ? 'other-month' : ''} ${isToday(day) ? 'today' : ''}`}
            >
              <div className="calendar-day-number">{day.day}</div>
              {dayPosts.slice(0, 3).map(post => (
                <div
                  key={post.id}
                  className={`calendar-post-dot ${post.platform}`}
                  onClick={() => setSelectedPost(post)}
                  title={post.title}
                >
                  {post.title}
                </div>
              ))}
              {dayPosts.length > 3 && (
                <div className="text-xs text-muted" style={{ padding: '2px 6px' }}>
                  +{dayPosts.length - 3} more
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Post Detail Modal */}
      {selectedPost && (
        <div className="modal-overlay" onClick={() => setSelectedPost(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{selectedPost.title}</h3>
              <button className="modal-close" onClick={() => setSelectedPost(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="flex gap-2 mb-4">
                <span className={`platform-badge ${selectedPost.platform}`}>{selectedPost.platform}</span>
                <span className={`status-badge ${selectedPost.status}`}>
                  <span className="status-dot"></span>
                  {selectedPost.status.replace('_', ' ')}
                </span>
              </div>

              {selectedPost.image_path && (
                <img
                  src={selectedPost.image_path}
                  alt=""
                  style={{ width: '100%', borderRadius: 'var(--radius-md)', marginBottom: '16px', maxHeight: '300px', objectFit: 'cover' }}
                />
              )}

              <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.7' }}>
                {selectedPost.written_content || selectedPost.written_gist || 'No content yet'}
              </div>

              {selectedPost.scheduled_date && (
                <p className="text-sm text-muted mt-4">
                  📅 Scheduled: {new Date(selectedPost.scheduled_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  {selectedPost.scheduled_time ? ` at ${selectedPost.scheduled_time}` : ''}
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setSelectedPost(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
