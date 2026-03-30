import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './AiChat.css';

// ── Rotating quotes for the welcome screen ──
const WELCOME_QUOTES = [
  "What's on your mind today?",
  "Ready when you are!",
  "Let's learn something new!",
  "Curious about a topic? Ask away!",
  "Where should we start?",
  "What would you like to explore?",
  "Let's make studying fun!",
  "Your learning journey continues here.",
  "Ask me anything about your courses!",
  "Time to level up your knowledge!",
];

const SUGGESTION_CHIPS = [
  { icon: '📚', text: 'Explain Linear Regression' },
  { icon: '🧠', text: 'Teach me about R-squared' },
  { icon: '📝', text: 'Quiz me on Regression' },
  { icon: '🔬', text: 'What is Data Science?' },
  { icon: '💡', text: 'Help me learn Python basics' },
  { icon: '📊', text: 'Explain Normal Distribution' },
];

const TYPING_SUGGESTIONS_MAP = {
  'explain': ['Explain the concept of machine learning', 'Explain how neural networks work', 'Explain the difference between SQL and NoSQL'],
  'teach': ['Teach me about data structures', 'Teach me Python from scratch', 'Teach me about algorithms'],
  'what': ['What is deep learning?', 'What are the types of regression?', 'What is the difference between AI and ML?'],
  'how': ['How does gradient descent work?', 'How to prepare for exams?', 'How does a decision tree work?'],
  'quiz': ['Quiz me on statistics', 'Quiz me on data science basics', 'Quiz me on Python programming'],
  'help': ['Help me understand recursion', 'Help me with calculus', 'Help me prepare for my exam'],
};

export default function AiChat() {
  const { user } = useAuth();

  // ── Chat state ──
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [thinkingText, setThinkingText] = useState('');

  // ── Session state ──
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  // ── UI state ──
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [welcomeQuote, setWelcomeQuote] = useState('');
  const [typingSuggestions, setTypingSuggestions] = useState([]);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [activeContextMenu, setActiveContextMenu] = useState(null);
  const [activeMessageMenu, setActiveMessageMenu] = useState(null);
  const [renameSessionId, setRenameSessionId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [editingMessageIdx, setEditingMessageIdx] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // ── Voice ──
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // ── Abort controller for stopping generation ──
  const abortControllerRef = useRef(null);

  // ── Refs ──
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  // ── Initialize ──
  useEffect(() => {
    setWelcomeQuote(WELCOME_QUOTES[Math.floor(Math.random() * WELCOME_QUOTES.length)]);
    loadSessions();
    // Setup speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(r => r[0].transcript)
          .join('');
        setInput(transcript);
      };
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  // ── Auto-scroll to bottom ──
  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // ── Scroll tracking ──
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Close menus on outside click ──
  useEffect(() => {
    const handleClick = (e) => {
      if (!e.target.closest('.context-menu') && !e.target.closest('.session-menu-btn')) {
        setActiveContextMenu(null);
      }
      if (!e.target.closest('.msg-more-menu') && !e.target.closest('.msg-more-btn')) {
        setActiveMessageMenu(null);
      }
      if (!e.target.closest('.attach-menu') && !e.target.closest('.attach-btn')) {
        setAttachMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // ── Typing suggestions ──
  useEffect(() => {
    if (!input.trim()) {
      setTypingSuggestions([]);
      return;
    }
    const firstWord = input.trim().toLowerCase().split(' ')[0];
    const suggestions = TYPING_SUGGESTIONS_MAP[firstWord] || [];
    const filtered = suggestions.filter(s => s.toLowerCase().includes(input.toLowerCase()));
    setTypingSuggestions(filtered.slice(0, 3));
  }, [input]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ── API calls ──
  const loadSessions = async () => {
    try {
      const res = await api.get('/ai/sessions/');
      setSessions(res.data);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setSessionsLoading(false);
    }
  };

  const loadSessionMessages = async (sessionId) => {
    try {
      const res = await api.get(`/ai/sessions/${sessionId}/messages/`);
      const msgs = res.data.map(m => ({
        id: m.id,
        role: m.role,
        text: m.content,
        feedback: m.feedback,
      }));
      setMessages(msgs);
      setCurrentSessionId(sessionId);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const startNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setInput('');
    setWelcomeQuote(WELCOME_QUOTES[Math.floor(Math.random() * WELCOME_QUOTES.length)]);
    inputRef.current?.focus();
  };

  const sendMessage = async (messageText) => {
    const text = (messageText || input).trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', text, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    let currentAction = 'Thinking';
    let dotCount = 0;
    let cycles = 0;
    setThinkingText('Thinking');
    setTypingSuggestions([]);

    // Start thinking animation
    const thinkingInterval = setInterval(() => {
      dotCount = (dotCount + 1) % 4;
      if (dotCount === 0) {
        cycles++;
        if (cycles === 2) currentAction = 'Analyzing';
        else if (cycles === 4) currentAction = 'Creating';
        else if (cycles === 6) {
          currentAction = 'Thinking';
          cycles = 0;
        }
      }
      setThinkingText(currentAction + '.'.repeat(dotCount));
    }, 500);

    abortControllerRef.current = new AbortController();

    try {
      const res = await api.post('/ai/chat/', {
        message: text,
        mode: 'student_mode',
        level: 'beginner',
        debug: false,
        session_id: currentSessionId,
      }, {
        signal: abortControllerRef.current.signal,
      });

      const aiMsg = {
        id: res.data.message_id,
        role: 'ai',
        text: res.data.response,
        feedback: null,
      };
      setMessages(prev => [...prev, aiMsg]);

      // Update session info
      if (res.data.session_id) {
        setCurrentSessionId(res.data.session_id);
      }
      if (res.data.is_new_session) {
        loadSessions(); // Refresh sidebar
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.message === 'canceled') {
        setMessages(prev => [...prev, {
          id: Date.now(),
          role: 'ai',
          text: '*Generation stopped by user.*',
          feedback: null,
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: Date.now(),
          role: 'ai',
          text: 'Sorry, something went wrong. Please try again.',
          feedback: null,
        }]);
      }
    } finally {
      clearInterval(thinkingInterval);
      setLoading(false);
      setThinkingText('');
      abortControllerRef.current = null;
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  // ── Session actions ──
  const deleteSession = async (sessionId) => {
    try {
      await api.delete(`/ai/sessions/${sessionId}/`);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        startNewChat();
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
    setActiveContextMenu(null);
  };

  const pinSession = async (sessionId, currentPinned) => {
    try {
      await api.patch(`/ai/sessions/${sessionId}/`, { is_pinned: !currentPinned });
      loadSessions();
    } catch (err) {
      console.error('Failed to pin session:', err);
    }
    setActiveContextMenu(null);
  };

  const renameSession = async (sessionId) => {
    if (!renameValue.trim()) return;
    try {
      await api.patch(`/ai/sessions/${sessionId}/`, { title: renameValue.trim() });
      loadSessions();
    } catch (err) {
      console.error('Failed to rename session:', err);
    }
    setRenameSessionId(null);
    setRenameValue('');
    setActiveContextMenu(null);
  };

  // ── Message actions ──
  const copyText = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const setFeedback = async (messageId, feedback) => {
    try {
      await api.patch(`/ai/messages/${messageId}/feedback/`, { feedback });
      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, feedback } : m
      ));
    } catch (err) {
      console.error('Failed to set feedback:', err);
    }
  };

  const retryMessage = async (messageIdx) => {
    // Find the user message before this AI message
    const aiMsg = messages[messageIdx];
    let userMsg = null;
    for (let i = messageIdx - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        userMsg = messages[i];
        break;
      }
    }
    if (userMsg) {
      // Remove the AI response and resend
      setMessages(prev => prev.filter((_, i) => i !== messageIdx));
      await sendMessage(userMsg.text);
    }
  };

  const editMessage = (idx) => {
    setEditingMessageIdx(idx);
    setEditValue(messages[idx].text);
  };

  const submitEdit = async () => {
    if (!editValue.trim() || editingMessageIdx === null) return;
    // Remove everything after the edited message and resend
    const newMessages = messages.slice(0, editingMessageIdx);
    setMessages(newMessages);
    setEditingMessageIdx(null);
    await sendMessage(editValue.trim());
  };

  // ── Voice ──
  const toggleVoice = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // ── File upload ──
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAttachMenuOpen(false);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/ai/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Add file info to input
      const fileInfo = `[Attached: ${res.data.file_name}]\n`;
      setInput(prev => fileInfo + prev);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('File upload failed. Please try again.');
    }
  };

  // ── Read aloud ──
  const readAloud = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/[#*`_~]/g, ''));
      utterance.rate = 0.95;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
    setActiveMessageMenu(null);
  };

  // ── Export to clipboard as formatted text ──
  const exportResponse = (text) => {
    navigator.clipboard.writeText(text);
    alert('Response copied! You can paste it into Google Docs or any document.');
    setActiveMessageMenu(null);
  };

  // ── Markdown rendering ──
  const renderText = (text) => {
    if (!text) return text;
    // Strip metadata block
    let cleaned = text.replace(/---\s*\n/g, '');
    cleaned = cleaned.replace(/\*{0,2}Subject:\*{0,2}.*\n?/gi, '');
    cleaned = cleaned.replace(/\*{0,2}Topic:\*{0,2}.*\n?/gi, '');
    cleaned = cleaned.replace(/\*{0,2}Level:\*{0,2}.*\n?/gi, '');
    cleaned = cleaned.replace(/\*{0,2}Mode:\*{0,2}.*\n?/gi, '');

    const lines = cleaned.split('\n');
    const elements = [];
    let inCodeBlock = false;
    let codeLines = [];

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
        }
        continue;
      }

      if (inCodeBlock) {
        codeLines.push(line);
        continue;
      }

      // Skip pure horizontal rules
      if (line.trim() === '---' || line.trim() === '***' || line.trim() === '___') continue;

      // Headings (all levels)
      const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const Tag = `h${Math.min(level + 1, 6)}`;
        elements.push(<Tag key={i} className="chat-heading">{formatInline(headingMatch[2])}</Tag>);
        continue;
      }

      // Numbered lists
      if (/^\d+\.\s/.test(line.trim())) {
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
      // Empty line
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

  // ── Filtered sessions ──
  const filteredSessions = sessions.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const pinnedSessions = filteredSessions.filter(s => s.is_pinned);
  const recentSessions = filteredSessions.filter(s => !s.is_pinned);

  const firstName = user?.first_name || user?.username || 'Student';

  return (
    <div className="ai-chat-layout">
      {/* ══════════ SIDEBAR ══════════ */}
      <div className={`chat-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} title="Toggle sidebar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
          <button className="new-chat-btn" onClick={startNewChat}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Chat
          </button>
        </div>

        {/* Search */}
        <div className="sidebar-search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Session list */}
        <div className="sidebar-sessions">
          {pinnedSessions.length > 0 && (
            <>
              <div className="session-group-label">📌 Pinned</div>
              {pinnedSessions.map(session => (
                <SessionItem
                  key={session.id}
                  session={session}
                  isActive={currentSessionId === session.id}
                  onClick={() => loadSessionMessages(session.id)}
                  activeContextMenu={activeContextMenu}
                  setActiveContextMenu={setActiveContextMenu}
                  onPin={() => pinSession(session.id, session.is_pinned)}
                  onDelete={() => deleteSession(session.id)}
                  onRenameStart={() => { setRenameSessionId(session.id); setRenameValue(session.title); setActiveContextMenu(null); }}
                  renameSessionId={renameSessionId}
                  renameValue={renameValue}
                  setRenameValue={setRenameValue}
                  onRenameSubmit={() => renameSession(session.id)}
                  onRenameCancel={() => { setRenameSessionId(null); setRenameValue(''); }}
                />
              ))}
            </>
          )}

          {recentSessions.length > 0 && (
            <>
              <div className="session-group-label">Recent</div>
              {recentSessions.map(session => (
                <SessionItem
                  key={session.id}
                  session={session}
                  isActive={currentSessionId === session.id}
                  onClick={() => loadSessionMessages(session.id)}
                  activeContextMenu={activeContextMenu}
                  setActiveContextMenu={setActiveContextMenu}
                  onPin={() => pinSession(session.id, session.is_pinned)}
                  onDelete={() => deleteSession(session.id)}
                  onRenameStart={() => { setRenameSessionId(session.id); setRenameValue(session.title); setActiveContextMenu(null); }}
                  renameSessionId={renameSessionId}
                  renameValue={renameValue}
                  setRenameValue={setRenameValue}
                  onRenameSubmit={() => renameSession(session.id)}
                  onRenameCancel={() => { setRenameSessionId(null); setRenameValue(''); }}
                />
              ))}
            </>
          )}

          {!sessionsLoading && sessions.length === 0 && (
            <div className="sidebar-empty">No conversations yet</div>
          )}
        </div>
      </div>

      {/* ══════════ MAIN CHAT AREA ══════════ */}
      <div className="chat-main">
        {/* Mobile sidebar toggle */}
        {!sidebarOpen && (
          <button className="mobile-sidebar-toggle" onClick={() => setSidebarOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
        )}

        <div className="chat-messages-area" ref={chatContainerRef}>
          {/* ── Welcome Screen ── */}
          {messages.length === 0 && !loading && (
            <div className="chat-welcome">
              <div className="welcome-greeting">
                <span className="welcome-sparkle">✨</span>
                <span className="welcome-hi">Hi {firstName}</span>
              </div>
              <h2 className="welcome-quote">{welcomeQuote}</h2>

              <div className="chat-suggestions">
                {SUGGESTION_CHIPS.map((chip, i) => (
                  <button
                    key={i}
                    className="suggestion-chip"
                    onClick={() => sendMessage(chip.text)}
                  >
                    <span className="chip-icon">{chip.icon}</span>
                    {chip.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Messages ── */}
          {messages.map((msg, i) => (
            <div key={msg.id || i} className={`chat-bubble ${msg.role}`}>
              {msg.role === 'ai' && (
                <div className="ai-avatar">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
                  </svg>
                </div>
              )}

              <div className="chat-content-wrapper">
                {/* User message with edit mode */}
                {msg.role === 'user' && editingMessageIdx === i ? (
                  <div className="edit-message-box">
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="edit-textarea"
                      rows={2}
                    />
                    <div className="edit-actions">
                      <button onClick={submitEdit} className="edit-save-btn">Send</button>
                      <button onClick={() => setEditingMessageIdx(null)} className="edit-cancel-btn">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="chat-text">
                    {msg.role === 'ai' ? renderText(msg.text) : msg.text}
                  </div>
                )}

                {/* User message hover actions */}
                {msg.role === 'user' && editingMessageIdx !== i && (
                  <div className="user-msg-actions">
                    <button
                      className="msg-action-btn"
                      onClick={() => copyText(msg.text, msg.id)}
                      title="Copy"
                    >
                      {copiedId === msg.id ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                        </svg>
                      )}
                    </button>
                    <button
                      className="msg-action-btn"
                      onClick={() => editMessage(i)}
                      title="Edit"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                  </div>
                )}

                {/* AI message action bar */}
                {msg.role === 'ai' && (
                  <div className="ai-msg-actions">
                    <button
                      className="msg-action-btn"
                      onClick={() => copyText(msg.text, msg.id)}
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                        </svg>
                      )}
                    </button>
                    <button
                      className={`msg-action-btn ${msg.feedback === 'good' ? 'active-good' : ''}`}
                      onClick={() => setFeedback(msg.id, msg.feedback === 'good' ? '' : 'good')}
                      title="Good response"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/><path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/>
                      </svg>
                    </button>
                    <button
                      className={`msg-action-btn ${msg.feedback === 'bad' ? 'active-bad' : ''}`}
                      onClick={() => setFeedback(msg.id, msg.feedback === 'bad' ? '' : 'bad')}
                      title="Bad response"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17"/>
                      </svg>
                    </button>
                    <button
                      className="msg-action-btn"
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({ title: 'StudyHub AI Response', text: msg.text });
                        } else {
                          copyText(msg.text, `share-${msg.id}`);
                        }
                      }}
                      title="Share"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
                      </svg>
                    </button>
                    <button
                      className="msg-action-btn"
                      onClick={() => retryMessage(i)}
                      title="Try again..."
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
                      </svg>
                    </button>
                    <div className="msg-more-wrapper">
                      <button
                        className="msg-action-btn msg-more-btn"
                        onClick={(e) => { e.stopPropagation(); setActiveMessageMenu(activeMessageMenu === msg.id ? null : msg.id); }}
                        title="More actions"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                        </svg>
                      </button>
                      {activeMessageMenu === msg.id && (
                        <div className="msg-more-menu">
                          <button onClick={() => readAloud(msg.text)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>
                            Read aloud
                          </button>
                          <button onClick={() => exportResponse(msg.text)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            Export to Docs
                          </button>
                          <button onClick={() => { copyText(msg.text, `draft-${msg.id}`); setActiveMessageMenu(null); }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                            Copy as Draft
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* ── Thinking Indicator ── */}
          {loading && (
            <div className="chat-bubble ai thinking-bubble">
              <div className="ai-avatar thinking-avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="thinking-spin">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
                </svg>
              </div>
              <div className="thinking-content">
                <div className="thinking-bar" onClick={stopGeneration} title="Click to stop generating" style={{ cursor: 'pointer' }}>
                  <span className="thinking-text">{thinkingText}</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Scroll to bottom button ── */}
        {showScrollBtn && (
          <button className="scroll-bottom-btn" onClick={scrollToBottom} title="Scroll to bottom">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        )}

        {/* ── Typing suggestions dropdown ── */}
        {typingSuggestions.length > 0 && (
          <div className="typing-suggestions">
            {typingSuggestions.map((s, i) => (
              <button key={i} className="typing-suggestion-item" onClick={() => { setInput(s); setTypingSuggestions([]); inputRef.current?.focus(); }}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* ── Input Bar ── */}
        <form className="chat-input-bar" onSubmit={handleSubmit}>
          {/* Attach button */}
          <div className="attach-wrapper">
            <button
              type="button"
              className="attach-btn"
              onClick={(e) => { e.stopPropagation(); setAttachMenuOpen(!attachMenuOpen); }}
              title="Attach files"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
            {attachMenuOpen && (
              <div className="attach-menu">
                <label className="attach-menu-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                  </svg>
                  Upload files
                  <input type="file" hidden accept=".pdf,.doc,.docx,.ppt,.pptx,.txt" onChange={handleFileUpload} />
                </label>
                <label className="attach-menu-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
                  Photos
                  <input type="file" hidden accept="image/*" onChange={handleFileUpload} />
                </label>
                <label className="attach-menu-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                  Video
                  <input type="file" hidden accept="video/*" onChange={handleFileUpload} />
                </label>
              </div>
            )}
          </div>

          <input
            ref={inputRef}
            type="text"
            className="chat-input"
            placeholder="Ask StudyHub AI..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />

          {/* Mic button */}
          <button
            type="button"
            className={`mic-btn ${isListening ? 'listening' : ''}`}
            onClick={toggleVoice}
            title={isListening ? 'Stop listening' : 'Voice input'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </button>

          {/* Send / Stop button */}
          {loading ? (
            <button type="button" className="send-btn stop" onClick={stopGeneration} title="Stop generating">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2"/>
              </svg>
            </button>
          ) : (
            <button type="submit" className="send-btn" disabled={!input.trim()} title="Send message">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

// ── Session Item Component ──
function SessionItem({
  session, isActive, onClick, activeContextMenu, setActiveContextMenu,
  onPin, onDelete, onRenameStart, renameSessionId, renameValue, setRenameValue,
  onRenameSubmit, onRenameCancel,
}) {
  const isRenaming = renameSessionId === session.id;

  return (
    <div
      className={`session-item ${isActive ? 'active' : ''}`}
      onClick={isRenaming ? undefined : onClick}
      title={session.title}
    >
      {isRenaming ? (
        <div className="rename-input-wrapper" onClick={(e) => e.stopPropagation()}>
          <input
            className="rename-input"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onRenameSubmit(); if (e.key === 'Escape') onRenameCancel(); }}
            autoFocus
          />
          <button className="rename-save-btn" onClick={onRenameSubmit}>✓</button>
        </div>
      ) : (
        <>
          <span className="session-title">{session.title}</span>
          <button
            className="session-menu-btn"
            onClick={(e) => { e.stopPropagation(); setActiveContextMenu(activeContextMenu === session.id ? null : session.id); }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
            </svg>
          </button>
          {activeContextMenu === session.id && (
            <div className="context-menu" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => { alert('Share feature coming soon'); setActiveContextMenu(null); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                Share
              </button>
              <button onClick={() => { alert('Group chat feature coming soon'); setActiveContextMenu(null); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                Start a group chat
              </button>
              <button onClick={onRenameStart}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Rename
              </button>
              <button onClick={onPin}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 17v5M9 3h6l-1 7h4l-8 8 2-7H8l1-8z"/>
                </svg>
                {session.is_pinned ? 'Unpin chat' : 'Pin chat'}
              </button>
              <button onClick={() => { alert('Archive feature coming soon'); setActiveContextMenu(null); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                Archive
              </button>
              <button className="delete-btn" onClick={() => onDelete()}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
                Delete
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
