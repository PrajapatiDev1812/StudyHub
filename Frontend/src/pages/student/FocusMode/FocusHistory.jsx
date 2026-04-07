/**
 * FocusHistory.jsx
 * ----------------
 * Dedicated Focus Mode session history page.
 * Features:
 *  - Stats dashboard (total focus time, success rate, avg session)
 *  - Mode filter: All | Normal | Strict
 *  - Time filter: All Time | Last 7 Days | Last 30 Days
 *  - Sort: Newest First | Oldest First
 *  - Per-session delete with confirmation
 *  - Bulk "Clear All History" with confirmation modal
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import focusApi from '../../../services/focusApi';
import './FocusHistory.css';

// ── Helpers ────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function formatDuration(minutes) {
  if (!minutes) return '0m';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

const STATUS_CONFIG = {
  completed: { label: '✓ Completed', cls: 'completed' },
  abandoned: { label: '✕ Abandoned', cls: 'abandoned' },
  active:    { label: '▶ Active',    cls: 'active'    },
  paused:    { label: '⏸ Paused',   cls: 'paused'    },
  break:     { label: '☕ Break',    cls: 'break'     },
};

// ── Stat Card ──────────────────────────────────────────────────
function StatCard({ icon, value, label, sub }) {
  return (
    <div className="fh-stat-card">
      <div className="fh-stat-icon">{icon}</div>
      <div className="fh-stat-value">{value}</div>
      <div className="fh-stat-label">{label}</div>
      {sub && <div className="fh-stat-sub">{sub}</div>}
    </div>
  );
}

// ── Session Card ───────────────────────────────────────────────
function SessionCard({ session, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const st = STATUS_CONFIG[session.status] || { label: session.status, cls: '' };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await focusApi.deleteSession(session.id);
      onDelete(session.id);
    } catch {
      setDeleting(false);
      setConfirmDel(false);
    }
  };

  return (
    <div className={`fh-session-card ${expanded ? 'expanded' : ''}`}>
      {/* Main row */}
      <div className="fh-card-main" onClick={() => setExpanded(v => !v)}>
        <div className="fh-card-left">
          <div className="fh-card-subject">{session.subject_name || '—'}</div>
          {session.topic_name && (
            <div className="fh-card-topic">📌 {session.topic_name}</div>
          )}
          <div className="fh-card-goal">🎯 {session.session_goal}</div>
        </div>

        <div className="fh-card-mid">
          <span className={`fh-mode-badge ${session.mode}`}>
            {session.mode === 'strict' ? '🔒 Strict' : '🌿 Normal'}
          </span>
          <span className={`fh-status-tag ${st.cls}`}>{st.label}</span>
        </div>

        <div className="fh-card-right">
          <div className="fh-card-meta">
            <span>⏱ {formatDuration(session.duration_minutes)}</span>
            <span>☕ {formatDuration(session.break_minutes)}</span>
            <span>📅 {formatDate(session.start_time)}</span>
          </div>
          <button
            className="fh-expand-btn"
            title={expanded ? 'Collapse' : 'Show details'}
          >
            {expanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="fh-card-details">
          <div className="fh-detail-row">
            <div className="fh-detail-item">
              <span className="fh-detail-lbl">Focus Duration</span>
              <span className="fh-detail-val">{session.selected_focus_minutes ?? '—'}m planned</span>
            </div>
            <div className="fh-detail-item">
              <span className="fh-detail-lbl">Break Duration</span>
              <span className="fh-detail-val">{session.selected_break_minutes ?? '—'}m planned</span>
            </div>
            <div className="fh-detail-item">
              <span className="fh-detail-lbl">Interruptions</span>
              <span className="fh-detail-val">{session.interruption_count ?? 0} times</span>
            </div>
            <div className="fh-detail-item">
              <span className="fh-detail-lbl">Breaks Taken</span>
              <span className="fh-detail-val">{session.break_count ?? 0} breaks</span>
            </div>
            <div className="fh-detail-item">
              <span className="fh-detail-lbl">Suggested</span>
              <span className="fh-detail-val">
                {session.suggested_focus_minutes ?? '—'}m focus / {session.suggested_break_minutes ?? '—'}m break
                {session.suggestion_source && (
                  <span className="fh-suggestion-src"> ({session.suggestion_source})</span>
                )}
              </span>
            </div>
            {session.end_time && (
              <div className="fh-detail-item">
                <span className="fh-detail-lbl">Ended At</span>
                <span className="fh-detail-val">{formatDate(session.end_time)}</span>
              </div>
            )}
          </div>

          <div className="fh-card-actions">
            {confirmDel ? (
              <div className="fh-confirm-inline">
                <span>Delete this session?</span>
                <button className="fh-btn-confirm-del" onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Deleting…' : 'Yes, Delete'}
                </button>
                <button className="fh-btn-cancel" onClick={() => setConfirmDel(false)}>
                  Cancel
                </button>
              </div>
            ) : (
              <button
                className="fh-btn-delete"
                onClick={() => setConfirmDel(true)}
              >
                🗑 Delete Session
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────
export default function FocusHistory() {
  const navigate = useNavigate();

  // Filters state
  const [modeFilter, setModeFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [ordering, setOrdering] = useState('-start_time');

  // Data state
  const [sessions, setSessions] = useState([]);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Bulk delete state
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);

  // ── Fetch sessions ──────────────────────────────────────────
  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await focusApi.listSessions({
        mode: modeFilter,
        time: timeFilter,
        ordering,
        status: 'completed,abandoned', // History only shows ended sessions
      });
      setSessions(res.data.results || res.data);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [modeFilter, timeFilter, ordering]);

  // ── Fetch stats (re-computed on filter change) ──────────────
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await focusApi.getStats({ mode: modeFilter, time: timeFilter });
      setStats(res.data);
    } catch {
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, [modeFilter, timeFilter]);

  useEffect(() => {
    loadSessions();
    loadStats();
  }, [loadSessions, loadStats]);

  // ── Single delete callback ──────────────────────────────────
  const handleDeleteOne = (id) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    loadStats(); // refresh stats
  };

  // ── Bulk clear ──────────────────────────────────────────────
  const handleClearAll = async () => {
    setClearing(true);
    try {
      await focusApi.clearHistory(modeFilter === 'all' ? null : modeFilter);
      setSessions([]);
      loadStats();
    } catch {}
    setClearing(false);
    setShowClearConfirm(false);
  };

  // ── Render ───────────────────────────────────────────────────
  const endedSessions = sessions.filter(
    s => s.status === 'completed' || s.status === 'abandoned'
  );

  return (
    <div className="fh-root">
      {/* ── Clear All Confirm Modal ── */}
      {showClearConfirm && (
        <div className="fh-modal-overlay">
          <div className="fh-modal">
            <div className="fh-modal-icon">⚠️</div>
            <h3>Clear All History?</h3>
            <p>
              This will permanently delete{' '}
              <strong>{stats?.total_sessions ?? 'all'} sessions</strong>
              {modeFilter !== 'all' && ` in ${modeFilter} mode`}
              {timeFilter !== 'all' && ` from the last ${timeFilter === '7d' ? '7 days' : '30 days'}`}.
              <br />
              Active sessions will not be affected.
            </p>
            <div className="fh-modal-actions">
              <button
                className="fh-btn-confirm-del"
                onClick={handleClearAll}
                disabled={clearing}
              >
                {clearing ? 'Clearing…' : '🗑 Yes, Clear All'}
              </button>
              <button
                className="fh-btn-cancel"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="fh-header">
        <div className="fh-header-left">
          <button className="fh-back-btn" onClick={() => navigate('/student/focus')}>
            ← Back to Focus Mode
          </button>
          <h1>Session History</h1>
          <p>Review and manage your past focus sessions</p>
        </div>
        <button
          className="fh-clear-all-btn"
          onClick={() => setShowClearConfirm(true)}
          disabled={endedSessions.length === 0}
        >
          🗑 Clear All History
        </button>
      </div>

      {/* ── Stats Dashboard ── */}
      <div className="fh-stats-grid">
        {statsLoading ? (
          <div className="fh-stats-loading">Loading stats…</div>
        ) : stats ? (
          <>
            <StatCard
              icon="⏱"
              value={`${stats.total_focus_hours}h`}
              label="Total Focus Time"
              sub={`${stats.total_focus_minutes} minutes`}
            />
            <StatCard
              icon="✅"
              value={`${stats.success_rate}%`}
              label="Success Rate"
              sub={`${stats.completed_sessions} / ${stats.total_sessions} completed`}
            />
            <StatCard
              icon="📊"
              value={`${stats.avg_session_minutes}m`}
              label="Avg Session Length"
              sub={`${stats.total_sessions} total sessions`}
            />
            <StatCard
              icon="☕"
              value={`${stats.total_break_minutes}m`}
              label="Total Break Time"
              sub={`${stats.abandoned_sessions} abandoned`}
            />
          </>
        ) : (
          <div className="fh-stats-loading">No stats available</div>
        )}
      </div>

      {/* ── Filters ── */}
      <div className="fh-filter-bar">
        {/* Mode Filter */}
        <div className="fh-filter-group">
          <span className="fh-filter-label">Mode</span>
          <div className="fh-filter-pills">
            {[
              { value: 'all',    label: '📋 All' },
              { value: 'normal', label: '🌿 Normal' },
              { value: 'strict', label: '🔒 Strict' },
            ].map(opt => (
              <button
                key={opt.value}
                className={`fh-pill ${modeFilter === opt.value ? 'active' : ''}`}
                onClick={() => setModeFilter(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Time Filter */}
        <div className="fh-filter-group">
          <span className="fh-filter-label">Time</span>
          <div className="fh-filter-pills">
            {[
              { value: 'all', label: 'All Time' },
              { value: '7d',  label: 'Last 7 Days' },
              { value: '30d', label: 'Last 30 Days' },
            ].map(opt => (
              <button
                key={opt.value}
                className={`fh-pill ${timeFilter === opt.value ? 'active' : ''}`}
                onClick={() => setTimeFilter(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div className="fh-filter-group fh-filter-sort">
          <span className="fh-filter-label">Sort</span>
          <select
            className="fh-sort-select"
            value={ordering}
            onChange={e => setOrdering(e.target.value)}
          >
            <option value="-start_time">Newest First</option>
            <option value="start_time">Oldest First</option>
            <option value="-total_focus_seconds">Most Focus Time</option>
          </select>
        </div>
      </div>

      {/* ── Session List ── */}
      <div className="fh-sessions">
        {loading ? (
          <div className="fh-empty">
            <div className="fh-empty-icon">⏳</div>
            <p>Loading sessions…</p>
          </div>
        ) : endedSessions.length === 0 ? (
          <div className="fh-empty">
            <div className="fh-empty-icon">📭</div>
            <p>No sessions found for the selected filters.</p>
            <button
              className="fh-pill active"
              onClick={() => { setModeFilter('all'); setTimeFilter('all'); }}
              style={{ marginTop: 12 }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className="fh-list-header">
              <span>{endedSessions.length} session{endedSessions.length !== 1 ? 's' : ''}</span>
              <span className="fh-list-hint">Click a session to expand details</span>
            </div>
            {endedSessions.map(s => (
              <SessionCard key={s.id} session={s} onDelete={handleDeleteOne} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
