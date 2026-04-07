/**
 * FocusStartModal.jsx
 * -------------------
 * Session configuration modal — subject, goal, timers, mode.
 * Accepts optional pre-fill props from quick-start entry points.
 */
import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import focusApi from '../../../services/focusApi';
import './FocusStartModal.css';

export default function FocusStartModal({ prefill = {}, onStart, onCancel }) {
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [suggestions, setSuggestions] = useState(null);

  const [form, setForm] = useState({
    subject_id: prefill.subjectId || '',
    topic_id: prefill.topicId || '',
    content_id: prefill.contentId || '',
    session_goal: prefill.goal || '',
    selected_focus_minutes: prefill.focusMinutes || 25,
    selected_break_minutes: prefill.breakMinutes || 5,
    mode: 'normal',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load subjects
  useEffect(() => {
    api.get('/subjects/').then(r => setSubjects(r.data.results || r.data)).catch(() => {});
  }, []);

  // Load topics when subject changes
  useEffect(() => {
    if (form.subject_id) {
      api.get(`/topics/?subject=${form.subject_id}`)
        .then(r => setTopics(r.data.results || r.data))
        .catch(() => setTopics([]));
    } else {
      setTopics([]);
    }
  }, [form.subject_id]);

  // Load timer suggestions when topic changes
  useEffect(() => {
    focusApi.getSuggestions(form.topic_id || null)
      .then(r => {
        setSuggestions(r.data);
        // Auto-apply suggestions if user hasn't manually changed them
        setForm(f => ({
          ...f,
          selected_focus_minutes: f.selected_focus_minutes === 25 ? r.data.suggested_focus_minutes : f.selected_focus_minutes,
          selected_break_minutes: f.selected_break_minutes === 5 ? r.data.suggested_break_minutes : f.selected_break_minutes,
        }));
      })
      .catch(() => {});
  }, [form.topic_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleStart = async (mode) => {
    if (!form.subject_id) { setError('Please select a subject.'); return; }
    if (!form.session_goal.trim()) { setError('Please enter a session goal.'); return; }
    setLoading(true);
    setError('');
    try {
      // Build a clean payload — DRF IntegerField rejects empty strings, needs null
      const payload = {
        subject_id: parseInt(form.subject_id, 10),
        session_goal: form.session_goal.trim(),
        mode,
        selected_focus_minutes: parseInt(form.selected_focus_minutes, 10) || 25,
        selected_break_minutes: parseInt(form.selected_break_minutes, 10) || 5,
        topic_id: form.topic_id ? parseInt(form.topic_id, 10) : null,
        content_id: form.content_id ? parseInt(form.content_id, 10) : null,
      };
      const res = await focusApi.startSession(payload);
      onStart(res.data);
    } catch (e) {
      // Show real backend validation errors if available
      const data = e.response?.data;
      if (data) {
        if (typeof data === 'string') {
          setError(data);
        } else if (data.detail) {
          setError(data.detail);
        } else {
          // Flatten DRF field errors like { subject_id: ["This field is required."] }
          const msgs = Object.entries(data)
            .map(([field, errs]) => `${field}: ${Array.isArray(errs) ? errs.join(', ') : errs}`)
            .join(' | ');
          setError(msgs || 'Failed to start session.');
        }
      } else {
        setError('Network error — make sure the backend is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  const FOCUS_PRESETS = suggestions?.focus_presets || [25, 30, 45, 60];
  const BREAK_PRESETS = suggestions?.break_presets || [5, 10, 15];

  const difficultyLabel = { easy: '🟢 Easy', medium: '🟡 Medium', hard: '🔴 Hard' };

  return (
    <div className="fsm-overlay" onClick={onCancel}>
      <div className="fsm-panel" onClick={e => e.stopPropagation()}>
        <div className="fsm-header">
          <div>
            <h2>Start Focus Session</h2>
            <p>Set up your distraction-free study environment</p>
          </div>
          <button className="fsm-close" onClick={onCancel}>✕</button>
        </div>

        {error && <div className="fsm-error">{error}</div>}

        <div className="fsm-body">
          {/* Subject */}
          <div className="fsm-field">
            <label>Subject <span className="required">*</span></label>
            <select name="subject_id" value={form.subject_id} onChange={handleChange}>
              <option value="">Select a subject…</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Topic (optional) */}
          {topics.length > 0 && (
            <div className="fsm-field">
              <label>Topic <span className="optional">(optional)</span></label>
              <select name="topic_id" value={form.topic_id} onChange={handleChange}>
                <option value="">No specific topic</option>
                {topics.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.difficulty ? `— ${difficultyLabel[t.difficulty]}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Session Goal */}
          <div className="fsm-field">
            <label>Session Goal <span className="required">*</span></label>
            <input
              type="text"
              name="session_goal"
              value={form.session_goal}
              onChange={handleChange}
              placeholder="e.g. Understand Chapter 3 — Normalization"
              maxLength={200}
            />
          </div>

          {/* Timer section */}
          <div className="fsm-timer-section">
            {/* Focus Duration */}
            <div className="fsm-timer-col">
              <label>Focus Duration</label>
              {suggestions && (
                <div className="fsm-suggestion-hint">
                  💡 Suggested: {suggestions.suggested_focus_minutes} min
                  <span className="suggestion-source">({suggestions.source})</span>
                </div>
              )}
              <div className="fsm-presets">
                {FOCUS_PRESETS.map(p => (
                  <button
                    key={p}
                    type="button"
                    className={`preset-btn ${form.selected_focus_minutes == p ? 'active' : ''}`}
                    onClick={() => setForm(f => ({ ...f, selected_focus_minutes: p }))}
                  >
                    {p}m
                  </button>
                ))}
              </div>
              <div className="fsm-custom-input">
                <input
                  type="number"
                  name="selected_focus_minutes"
                  value={form.selected_focus_minutes}
                  onChange={handleChange}
                  min={5}
                  max={180}
                />
                <span>min (custom)</span>
              </div>
            </div>

            {/* Break Duration */}
            <div className="fsm-timer-col">
              <label>Break Duration</label>
              {suggestions && (
                <div className="fsm-suggestion-hint">
                  💡 Suggested: {suggestions.suggested_break_minutes} min
                </div>
              )}
              <div className="fsm-presets">
                {BREAK_PRESETS.map(p => (
                  <button
                    key={p}
                    type="button"
                    className={`preset-btn ${form.selected_break_minutes == p ? 'active' : ''}`}
                    onClick={() => setForm(f => ({ ...f, selected_break_minutes: p }))}
                  >
                    {p}m
                  </button>
                ))}
              </div>
              <div className="fsm-custom-input">
                <input
                  type="number"
                  name="selected_break_minutes"
                  value={form.selected_break_minutes}
                  onChange={handleChange}
                  min={1}
                  max={60}
                />
                <span>min (custom)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mode selection + Start buttons */}
        <div className="fsm-footer">
          <div className="fsm-mode-info">
            <div className="mode-card mode-normal">
              <div className="mode-icon">🌿</div>
              <div>
                <div className="mode-title">Normal Mode</div>
                <div className="mode-desc">Flexible navigation within subject. Soft exit warnings.</div>
              </div>
            </div>
            <div className="mode-card mode-strict">
              <div className="mode-icon">🔒</div>
              <div>
                <div className="mode-title">Strict Mode</div>
                <div className="mode-desc">Locked to subject. AI restricted to context only.</div>
              </div>
            </div>
          </div>
          <div className="fsm-start-btns">
            <button
              className="btn-normal-mode"
              onClick={() => handleStart('normal')}
              disabled={loading}
            >
              🌿 Start Normal Mode
            </button>
            <button
              className="btn-strict-mode"
              onClick={() => handleStart('strict')}
              disabled={loading}
            >
              🔒 Start Strict Mode
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
