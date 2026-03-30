import { useState } from 'react';
import api from '../../services/api';
import './AiChat.css';

export default function AiChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('student_mode');
  const [level, setLevel] = useState('beginner');

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat/', {
        message: input,
        mode,
        level,
        debug: false,
      });
      setMessages(prev => [...prev, { role: 'ai', text: res.data.response }]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'ai', text: 'Sorry, something went wrong. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Simple markdown-like rendering: headings, bold, bullet points, code blocks
  const renderText = (text) => {
    if (!text) return text;
    // Split into lines for processing
    const lines = text.split('\n');
    const elements = [];
    let inCodeBlock = false;
    let codeLines = [];
    let codeLang = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code block toggle
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <pre key={`code-${i}`} className="chat-code-block">
              <code>{codeLines.join('\n')}</code>
            </pre>
          );
          codeLines = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
          codeLang = line.trim().replace('```', '');
        }
        continue;
      }

      if (inCodeBlock) {
        codeLines.push(line);
        continue;
      }

      // Headings
      if (line.startsWith('### ')) {
        elements.push(<h4 key={i} className="chat-heading">{line.replace('### ', '')}</h4>);
      } else if (line.startsWith('## ')) {
        elements.push(<h3 key={i} className="chat-heading">{line.replace('## ', '')}</h3>);
      } else if (line.startsWith('# ')) {
        elements.push(<h2 key={i} className="chat-heading">{line.replace('# ', '')}</h2>);
      }
      // Numbered lists
      else if (/^\d+\.\s/.test(line.trim())) {
        elements.push(
          <div key={i} className="chat-list-item">
            {formatInline(line.trim())}
          </div>
        );
      }
      // Bullet points
      else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        elements.push(
          <div key={i} className="chat-bullet">
            <span className="bullet-dot">•</span>
            <span>{formatInline(line.trim().substring(2))}</span>
          </div>
        );
      }
      // Empty line = spacing
      else if (line.trim() === '') {
        elements.push(<div key={i} className="chat-spacer" />);
      }
      // Normal text
      else {
        elements.push(<p key={i} className="chat-paragraph">{formatInline(line)}</p>);
      }
    }

    return elements;
  };

  // Inline formatting: **bold**, `code`
  const formatInline = (text) => {
    const parts = [];
    const regex = /(\*\*(.+?)\*\*|`(.+?)`)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      if (match[2]) {
        parts.push(<strong key={match.index}>{match[2]}</strong>);
      } else if (match[3]) {
        parts.push(<code key={match.index} className="chat-inline-code">{match[3]}</code>);
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <div className="fade-in ai-chat-page">
      <div className="page-header">
        <h1>AI Assistant</h1>
        <p>Ask anything about your studies — powered by Gemini + RAG</p>
      </div>

      {/* Mode & Level Selectors */}
      <div className="ai-controls glass-card">
        <div className="control-group">
          <label htmlFor="ai-mode">Mode</label>
          <select
            id="ai-mode"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="form-input"
          >
            <option value="student_mode">Student Mode</option>
            <option value="teacher_mode">Teacher Mode</option>
            <option value="exam_mode">Exam Mode</option>
          </select>
        </div>
        <div className="control-group">
          <label htmlFor="ai-level">Level</label>
          <select
            id="ai-level"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="form-input"
          >
            <option value="beginner">Beginner</option>
            <option value="medium">Medium</option>
            <option value="advance">Advanced</option>
          </select>
        </div>
        <div className="control-status">
          <span className="mode-badge">{mode.replace('_', ' ').toUpperCase()}</span>
          <span className="level-badge">{level.toUpperCase()}</span>
        </div>
      </div>

      <div className="chat-container glass-card">
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-welcome">
              <span style={{ fontSize: '3rem' }}>🤖</span>
              <h3>Hi! I'm your StudyHub AI Assistant</h3>
              <p>
                I use your course content and personal notes to give you
                accurate, contextual answers. Try asking about any topic!
              </p>
              <div className="chat-suggestions">
                <button
                  className="suggestion-chip"
                  onClick={() => setInput('What are the assumptions of linear regression?')}
                >
                  Assumptions of Linear Regression?
                </button>
                <button
                  className="suggestion-chip"
                  onClick={() => setInput('Teach me about R-squared from zero')}
                >
                  Teach R-squared from zero
                </button>
                <button
                  className="suggestion-chip"
                  onClick={() => setInput('Quiz me on regression concepts')}
                >
                  Quiz on Regression
                </button>
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`chat-bubble ${msg.role}`}>
              <span className="chat-avatar">{msg.role === 'user' ? '👤' : '🤖'}</span>
              <div className="chat-text">
                {msg.role === 'ai' ? renderText(msg.text) : msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="chat-bubble ai">
              <span className="chat-avatar">🤖</span>
              <div className="chat-text typing">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            </div>
          )}
        </div>

        <form className="chat-input-bar" onSubmit={sendMessage}>
          <input
            type="text"
            className="form-input"
            placeholder="Type your question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="btn btn-primary" disabled={loading || !input.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
