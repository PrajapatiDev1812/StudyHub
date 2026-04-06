/**
 * FocusAIPanel.jsx
 * ----------------
 * Collapsible right-side AI assistant panel for Focus Mode.
 * Passes focus_session_id so the backend applies Normal/Strict mode constraints.
 */
import React, { useState, useRef, useEffect } from 'react';
import api from '../../../services/api';
import './FocusAIPanel.css';

const QUICK_ACTIONS = [
  { label: '💡 Explain This', prompt: 'Please explain the current topic in simple terms.' },
  { label: '📝 Summarize', prompt: 'Summarize the key points of the current topic.' },
  { label: '❓ Generate Questions', prompt: 'Generate 5 practice questions for the current topic.' },
];

export default function FocusAIPanel({ session, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatSessionId, setChatSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', content: msg }]);
    setLoading(true);

    try {
      const res = await api.post('/ai/chat/', {
        message: msg,
        mode: 'student_mode',
        level: 'beginner',
        subject: session?.subject_name || '',
        topic: session?.topic_name || '',
        session_id: chatSessionId || undefined,
        focus_session_id: session?.id || undefined,
      });
      if (!chatSessionId) setChatSessionId(res.data.session_id);
      setMessages(m => [...m, { role: 'ai', content: res.data.reply }]);
    } catch (e) {
      setMessages(m => [...m, { role: 'ai', content: '⚠️ Failed to get a response. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const isStrictMode = session?.mode === 'strict';

  return (
    <div className="fai-panel">
      {/* Header */}
      <div className="fai-header">
        <div className="fai-header-left">
          <span className="fai-icon">🤖</span>
          <div>
            <div className="fai-title">AI Assistant</div>
            <div className={`fai-mode-badge ${isStrictMode ? 'strict' : 'normal'}`}>
              {isStrictMode ? '🔒 Strict Context' : '🌿 Normal Mode'}
            </div>
          </div>
        </div>
        <button className="fai-close-btn" onClick={onClose} title="Close AI Panel">✕</button>
      </div>

      {/* Context hint */}
      {session?.subject_name && (
        <div className="fai-context-bar">
          <span>📚 {session.subject_name}</span>
          {session.topic_name && <span>• {session.topic_name}</span>}
        </div>
      )}

      {/* Strict mode notice */}
      {isStrictMode && (
        <div className="fai-strict-notice">
          🔒 Strict mode: AI will only answer about your current study context.
        </div>
      )}

      {/* Quick Actions */}
      <div className="fai-quick-actions">
        {QUICK_ACTIONS.map(a => (
          <button
            key={a.label}
            className="fai-quick-btn"
            onClick={() => sendMessage(a.prompt)}
            disabled={loading}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="fai-messages">
        {messages.length === 0 && (
          <div className="fai-empty">
            <div className="fai-empty-icon">🎯</div>
            <p>Ask anything about your current study topic.</p>
            {isStrictMode && <p className="fai-empty-sub">In strict mode, questions are limited to your active subject context.</p>}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`fai-msg fai-msg-${m.role}`}>
            <div className="fai-msg-bubble">{m.content}</div>
          </div>
        ))}
        {loading && (
          <div className="fai-msg fai-msg-ai">
            <div className="fai-msg-bubble fai-thinking">
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="fai-input-row">
        <input
          type="text"
          className="fai-input"
          placeholder="Ask about this topic…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          disabled={loading}
        />
        <button
          className="fai-send-btn"
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
        >
          ↑
        </button>
      </div>
    </div>
  );
}
