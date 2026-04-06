/**
 * FocusLanding.jsx
 * ----------------
 * Focus Mode landing page — session history, "Start New" CTA,
 * and restores to an active session if one exists.
 */
import React, { useState, useEffect } from 'react';
import focusApi from '../../../services/focusApi';
import FocusStartModal from './FocusStartModal';
import FocusActiveSession from './FocusActiveSession';
import './FocusLanding.css';

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function StatusTag({ status }) {
  const map = {
    completed: { label: '✓ Completed', cls: 'completed' },
    abandoned: { label: '✕ Abandoned', cls: 'abandoned' },
    active:    { label: '▶ Active', cls: 'active' },
    paused:    { label: '⏸ Paused', cls: 'paused' },
    break:     { label: '☕ On Break', cls: 'break' },
  };
  const { label, cls } = map[status] || { label: status, cls: '' };
  return <span className={`session-status-tag ${cls}`}>{label}</span>;
}

export default function FocusLanding() {
  const [showModal, setShowModal] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inSession, setInSession] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [prefill, setPrefill] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [activeRes, historyRes] = await Promise.allSettled([
        focusApi.getActiveSession(),
        focusApi.listSessions(),
      ]);
      if (activeRes.status === 'fulfilled') {
        setActiveSession(activeRes.value.data);
      }
      if (historyRes.status === 'fulfilled') {
        setSessions(historyRes.value.data.results || historyRes.value.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSessionStarted = (session) => {
    setShowModal(false);
    setCurrentSession(session);
    setInSession(true);
  };

  const handleResumeSession = () => {
    setCurrentSession(activeSession);
    setInSession(true);
  };

  const handleExitSession = () => {
    setInSession(false);
    setCurrentSession(null);
    setActiveSession(null);
    setPrefill({});
    loadData();
  };

  // ── If in an active session, show the workstation full-page ──
  if (inSession && currentSession) {
    return (
      <FocusActiveSession
        session={currentSession}
        onExit={handleExitSession}
      />
    );
  }

  return (
    <div className="fl-root">
      {showModal && (
        <FocusStartModal
          prefill={prefill}
          onStart={handleSessionStarted}
          onCancel={() => setShowModal(false)}
        />
      )}

      {/* Hero Section */}
      <div className="fl-hero">
        <div className="fl-hero-inner">
          <div className="fl-hero-icon">🎯</div>
          <h1>Focus Mode</h1>
          <p>Create a distraction-free study environment. Choose Normal for flexibility or Strict for deep focus.</p>

          <div className="fl-hero-actions">
            {activeSession ? (
              <>
                <div className="fl-active-banner">
                  <span className="fl-active-dot" />
                  <span>You have an active session — <strong>{activeSession.subject_name}</strong></span>
                </div>
                <button className="fl-btn-resume" onClick={handleResumeSession}>
                  ▶ Resume Session
                </button>
                <button className="fl-btn-new" onClick={() => setShowModal(true)}>
                  + New Session
                </button>
              </>
            ) : (
              <button className="fl-btn-start" onClick={() => setShowModal(true)}>
                🚀 Start Focus Session
              </button>
            )}
          </div>
        </div>

        {/* Mode Cards */}
        <div className="fl-mode-cards">
          <div className="fl-mode-card normal">
            <div className="fl-mode-icon">🌿</div>
            <h3>Normal Mode</h3>
            <ul>
              <li>Flexible navigation within your subject</li>
              <li>AI Assistant available freely</li>
              <li>Soft exit confirmation</li>
              <li>Great for exploring topics</li>
            </ul>
          </div>
          <div className="fl-mode-card strict">
            <div className="fl-mode-icon">🔒</div>
            <h3>Strict Mode</h3>
            <ul>
              <li>Locked to selected subject</li>
              <li>AI restricted to study context only</li>
              <li>Strong exit warning</li>
              <li>Best for deep focus sessions</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Session History */}
      <div className="fl-history">
        <h2>Session History</h2>
        {loading ? (
          <div className="fl-loading">Loading history…</div>
        ) : sessions.length === 0 ? (
          <div className="fl-empty">
            <span>📚</span>
            <p>No focus sessions yet. Start your first session to see your history here.</p>
          </div>
        ) : (
          <div className="fl-sessions-grid">
            {sessions.map(s => (
              <div key={s.id} className="fl-session-card">
                <div className="fl-sc-top">
                  <div className="fl-sc-subject">{s.subject_name || '—'}</div>
                  <StatusTag status={s.status} />
                </div>
                <div className="fl-sc-goal">🎯 {s.session_goal}</div>
                <div className="fl-sc-meta">
                  <span className={`fl-sc-mode ${s.mode}`}>
                    {s.mode === 'strict' ? '🔒 Strict' : '🌿 Normal'}
                  </span>
                  <span>⏱ {s.duration_minutes}m studied</span>
                  <span>☕ {s.break_minutes}m break</span>
                  <span>📅 {formatDate(s.start_time)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
