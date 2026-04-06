/**
 * FocusActiveSession.jsx
 * ----------------------
 * Full-page Focus Mode workstation. Manages timer state, break flow,
 * tab navigation (Content/Topics/Notes), AI panel, and exit guard.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import focusApi from '../../../services/focusApi';
import FocusTimer from './FocusTimer';
import BreakOverlay from './BreakOverlay';
import FocusAIPanel from './FocusAIPanel';
import './FocusActiveSession.css';

const SYNC_INTERVAL = 30; // sync to backend every 30 seconds

export default function FocusActiveSession({ session: initialSession, onExit }) {
  const navigate = useNavigate();
  const [session, setSession] = useState(initialSession);

  // ── Timer state ──
  const [focusRemaining, setFocusRemaining] = useState(
    (initialSession?.selected_focus_minutes || 25) * 60
  );
  const [totalFocusSeconds] = useState(
    (initialSession?.selected_focus_minutes || 25) * 60
  );
  const [breakRemaining, setBreakRemaining] = useState(
    (initialSession?.selected_break_minutes || 5) * 60
  );
  const [totalBreakSeconds, setTotalBreakSeconds] = useState(
    (initialSession?.selected_break_minutes || 5) * 60
  );
  const [timerRunning, setTimerRunning] = useState(true);
  const [elapsedFocus, setElapsedFocus] = useState(0);

  // ── UI state ──
  const [activeTab, setActiveTab] = useState('topics');
  const [showAI, setShowAI] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [exitMessage, setExitMessage] = useState('');

  // ── Data ──
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [contents, setContents] = useState([]);
  const [notes, setNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const notesDebounceRef = useRef(null);
  const syncCountRef = useRef(0);

  const isBreak = session?.status === 'break';
  const isStrict = session?.mode === 'strict';

  // ── Load subject content ──
  useEffect(() => {
    if (!session?.subject) return;
    setLoading(true);
    Promise.all([
      api.get(`/topics/?subject=${session.subject}`),
      api.get(`/contents/?topic__subject=${session.subject}`),
    ]).then(([tRes, cRes]) => {
      setTopics(tRes.data.results || tRes.data);
      setContents(cRes.data.results || cRes.data);
    }).finally(() => setLoading(false));
  }, [session?.subject]);

  // ── Focus timer countdown ──
  useEffect(() => {
    if (!timerRunning || isBreak) return;
    const tick = setInterval(() => {
      setFocusRemaining(r => {
        if (r <= 1) {
          clearInterval(tick);
          setTimerRunning(false);
          return 0;
        }
        return r - 1;
      });
      setElapsedFocus(e => e + 1);
      syncCountRef.current += 1;

      // Sync to backend every SYNC_INTERVAL seconds
      if (syncCountRef.current >= SYNC_INTERVAL) {
        syncCountRef.current = 0;
        setElapsedFocus(current => {
          focusApi.syncTimer(session.id, current).catch(() => {});
          return current;
        });
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [timerRunning, isBreak, session?.id]);

  // ── Break timer countdown ──
  useEffect(() => {
    if (!isBreak) return;
    const tick = setInterval(() => {
      setBreakRemaining(r => {
        if (r <= 1) {
          clearInterval(tick);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [isBreak]);

  // ── Notes auto-save ──
  const handleNotesChange = (value) => {
    setNotes(value);
    clearTimeout(notesDebounceRef.current);
    notesDebounceRef.current = setTimeout(async () => {
      if (!session?.subject) return;
      setNotesSaving(true);
      try {
        await api.post('/ai/student-notes/', {
          title: `Focus Session Notes — ${session.subject_name || 'Session'}`,
          content: value,
          subject: session.subject,
          topic: session.topic || null,
        });
      } catch {}
      setNotesSaving(false);
    }, 2000);
  };

  // ── Break actions ──
  const handleTakeBreak = async () => {
    try {
      const res = await focusApi.takeBreak(session.id);
      setSession(res.data);
      setTimerRunning(false);
    } catch {}
  };

  const handleResumeFromBreak = async () => {
    try {
      const res = await focusApi.resumeSession(session.id);
      setSession(res.data);
      setTimerRunning(true);
      setBreakRemaining((res.data.selected_break_minutes || 5) * 60);
    } catch {}
  };

  const handleExtendBreak = () => {
    setBreakRemaining(r => r + 5 * 60);
    setTotalBreakSeconds(t => t + 5 * 60);
  };

  // ── End / Exit ──
  const handleEndSession = async () => {
    await focusApi.syncTimer(session.id, elapsedFocus).catch(() => {});
    await focusApi.endSession(session.id).catch(() => {});
    onExit();
  };

  const handleExitFocusMode = () => {
    if (isStrict) {
      setExitMessage('⚠️ Strict Mode: Exiting will end your current focus session and record your progress. Are you sure?');
    } else {
      setExitMessage('Leaving Focus Mode will pause your session. Your progress will be saved.');
    }
    setShowExitConfirm(true);
  };

  const confirmExit = async () => {
    await focusApi.syncTimer(session.id, elapsedFocus).catch(() => {});
    if (isStrict) {
      await focusApi.endSession(session.id).catch(() => {});
    } else {
      await focusApi.pauseSession(session.id).catch(() => {});
    }
    onExit();
  };

  // ── Fullscreen ──
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // ── Mode badge ──
  const modeBadge = isStrict
    ? <span className="mode-badge strict">🔒 Strict</span>
    : <span className="mode-badge normal">🌿 Normal</span>;

  const formatDuration = (s) => {
    const m = Math.floor(s / 60);
    return `${m}m ${s % 60}s`;
  };

  return (
    <div className={`fas-root ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* ── Break Overlay ── */}
      {isBreak && (
        <BreakOverlay
          session={session}
          breakRemaining={breakRemaining}
          totalBreakSeconds={totalBreakSeconds}
          onResume={handleResumeFromBreak}
          onExtend={handleExtendBreak}
          onEnd={handleEndSession}
        />
      )}

      {/* ── Exit Confirm Modal ── */}
      {showExitConfirm && (
        <div className="fas-confirm-overlay">
          <div className="fas-confirm-box">
            <p>{exitMessage}</p>
            <div className="fas-confirm-btns">
              <button className="btn-danger" onClick={confirmExit}>
                {isStrict ? 'End & Exit' : 'Save & Exit'}
              </button>
              <button className="btn-glass" onClick={() => setShowExitConfirm(false)}>
                Continue Studying
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Fixed Header ── */}
      <header className="fas-header">
        <div className="fas-header-left">
          <div className="fas-breadcrumb">
            <span className="fas-label">Focus Mode</span>
            {session?.subject_name && <><span className="fas-sep">›</span><span className="fas-subject">{session.subject_name}</span></>}
            {session?.topic_name && <><span className="fas-sep">›</span><span className="fas-topic">{session.topic_name}</span></>}
          </div>
          <div className="fas-goal">🎯 {session?.session_goal}</div>
        </div>

        <div className="fas-header-center">
          <FocusTimer
            totalSeconds={totalFocusSeconds}
            remainingSeconds={focusRemaining}
            isRunning={timerRunning}
            label="Focus"
          />
          <div className="fas-timer-meta">
            {modeBadge}
            <span className="fas-elapsed">Studied: {formatDuration(elapsedFocus)}</span>
          </div>
        </div>

        <div className="fas-header-right">
          <button className="fas-hdr-btn ai-btn" onClick={() => setShowAI(v => !v)} title="AI Assistant">
            🤖 AI
          </button>
          <button className="fas-hdr-btn" onClick={handleTakeBreak} title="Take a Break" disabled={isBreak}>
            ☕ Break
          </button>
          <button className="fas-hdr-btn" onClick={toggleFullscreen} title="Fullscreen">
            {isFullscreen ? '⊠' : '⛶'}
          </button>
          <button className="fas-hdr-btn end-btn" onClick={handleEndSession} title="End Session">
            ✓ End
          </button>
          <button className="fas-hdr-btn exit-btn" onClick={handleExitFocusMode} title="Exit Focus Mode">
            ✕ Exit
          </button>
        </div>
      </header>

      {/* ── Tab Row ── */}
      <div className="fas-tabs">
        {['topics', 'contents', 'notes'].map(tab => (
          <button
            key={tab}
            className={`fas-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'topics' && '📌 Topics'}
            {tab === 'contents' && '📄 Contents'}
            {tab === 'notes' && '📝 Notes'}
          </button>
        ))}
        <div className="fas-tabs-spacer" />
        <span className="fas-break-count">Breaks: {session?.break_count ?? 0}</span>
      </div>

      {/* ── Body ── */}
      <div className="fas-body">
        <div className="fas-main-content">
          {loading && <div className="fas-loading">Loading content…</div>}

          {/* Topics Tab */}
          {activeTab === 'topics' && !loading && (
            <div className="fas-content-area">
              <h3 className="fas-area-title">📌 Topics — {session?.subject_name}</h3>
              {topics.length === 0
                ? <div className="fas-empty">No topics found for this subject.</div>
                : topics.map(t => (
                  <div
                    key={t.id}
                    className={`fas-list-item ${session?.topic === t.id ? 'active-context' : ''}`}
                  >
                    <div className="fas-item-name">{t.name}</div>
                    {t.description && <div className="fas-item-desc">{t.description}</div>}
                    <div className={`fas-difficulty-pill ${t.difficulty}`}>
                      {t.difficulty === 'easy' ? '🟢' : t.difficulty === 'hard' ? '🔴' : '🟡'} {t.difficulty}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Contents Tab */}
          {activeTab === 'contents' && !loading && (
            <div className="fas-content-area">
              <h3 className="fas-area-title">📄 Contents — {session?.subject_name}</h3>
              {contents.length === 0
                ? <div className="fas-empty">No content found for this subject.</div>
                : contents.map(c => (
                  <a
                    key={c.id}
                    href={`/student/content/${c.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fas-list-item fas-content-link"
                    onClick={isStrict ? (e) => { e.preventDefault(); alert('Strict Mode: Navigate to content within the Focus Mode viewer only.'); } : undefined}
                  >
                    <span className="fas-content-type-icon">
                      {c.content_type === 'video' ? '🎬' : c.content_type === 'pdf' ? '📕' : c.content_type === 'link' ? '🔗' : '📝'}
                    </span>
                    <div>
                      <div className="fas-item-name">{c.title}</div>
                      <div className="fas-content-type">{c.content_type}</div>
                    </div>
                  </a>
                ))}
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div className="fas-content-area fas-notes-area">
              <div className="fas-notes-header">
                <h3 className="fas-area-title">📝 Session Notes</h3>
                {notesSaving
                  ? <span className="fas-save-status saving">Saving…</span>
                  : notes && <span className="fas-save-status saved">✓ Auto-saved</span>}
              </div>
              <textarea
                className="fas-notes-editor"
                value={notes}
                onChange={e => handleNotesChange(e.target.value)}
                placeholder={`Take notes for ${session?.subject_name || 'this session'}…\n\nYour notes are auto-saved and tied to this subject/topic.`}
              />
              <div className="fas-notes-hint">Notes are saved to your AI Student Notes and can be used for AI-powered study later.</div>
            </div>
          )}
        </div>

        {/* ── AI Panel ── */}
        {showAI && (
          <div className="fas-ai-panel-wrap">
            <FocusAIPanel session={session} onClose={() => setShowAI(false)} />
          </div>
        )}
      </div>
    </div>
  );
}
