import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, BookOpen, CheckCircle2, AlertTriangle, Cpu, RefreshCw } from 'lucide-react';
import { sendTeacherChatMessage } from '../../../api/teacherAI';

export default function AIChatInterface() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: 'Hello Professor! I am your StudyHub Academic AI Assistant. You can test prompts, check how RAG retrieves knowledge from your uploaded materials, or ask general academic questions.',
      sources: [],
      confidence: null,
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState('Computer Science');
  const [topic, setTopic] = useState('Data Structures');
  const [mode, setMode] = useState('academic');
  const [level] = useState('intermediate');
  const [sessionId, setSessionId] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    const tempUserMsg = { id: Date.now(), sender: 'user', text: userText };
    setMessages((prev) => [...prev, tempUserMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await sendTeacherChatMessage({
        message: userText,
        mode,
        level,
        subject,
        topic,
        session_id: sessionId,
      });

      if (response.session_id) {
        setSessionId(response.session_id);
      }

      const assistantMsg = {
        id: response.message_id || Date.now() + 1,
        sender: 'assistant',
        text: response.reply || 'No response generated.',
        sources: response.sources || [],
        confidence: response.confidence,
        cacheHit: response.cache_hit || false,
        threat: response.debug?.threat,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'assistant',
          text: `Error: ${err.message || 'Failed to communicate with AI service.'}`,
          isError: true,
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: Date.now(),
        sender: 'assistant',
        text: 'Session cleared. Ready for a new test conversation!',
      }
    ]);
    setSessionId(null);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Configuration Header for Test Chat */}
      <div className="ai-glass-card" style={{ padding: '16px 22px', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Subject:</span>
            <input 
              type="text" 
              className="ai-input" 
              value={subject} 
              onChange={(e) => setSubject(e.target.value)} 
              style={{ padding: '6px 10px', fontSize: '0.85rem', width: 150 }} 
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Topic:</span>
            <input 
              type="text" 
              className="ai-input" 
              value={topic} 
              onChange={(e) => setTopic(e.target.value)} 
              style={{ padding: '6px 10px', fontSize: '0.85rem', width: 140 }} 
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Mode:</span>
            <select className="ai-select" value={mode} onChange={(e) => setMode(e.target.value)} style={{ padding: '6px 10px', fontSize: '0.85rem' }}>
              <option value="academic">Academic RAG</option>
              <option value="exam">Exam Prep</option>
              <option value="concise">Concise Summary</option>
            </select>
          </div>
        </div>
        
        <button className="ai-btn ai-btn-outline" onClick={clearChat} style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
          <RefreshCw size={14} /> Reset Session
        </button>
      </div>

      {/* Main Chat Area */}
      <div className="ai-chat-container">
        <div className="ai-chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`ai-chat-bubble ${msg.sender}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} color="#a78bfa" />}
                <span style={{ fontWeight: 700, fontSize: '0.8rem', opacity: 0.85 }}>
                  {msg.sender === 'user' ? 'You' : 'StudyHub Assistant'}
                </span>

                {/* Badges for Assistant Replies */}
                {msg.sender === 'assistant' && (
                  <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto', flexWrap: 'wrap' }}>
                    {msg.cacheHit && (
                      <span className="ai-badge ai-badge-info" style={{ fontSize: '0.65rem' }}>
                        <Cpu size={11} /> Redis Cache
                      </span>
                    )}
                    {typeof msg.confidence === 'number' && (
                      msg.confidence >= 0.35 ? (
                        <span className="ai-badge ai-badge-success" style={{ fontSize: '0.65rem' }}>
                          <CheckCircle2 size={11} /> High Confidence ({Math.round(msg.confidence * 100)}%)
                        </span>
                      ) : (
                        <span className="ai-badge ai-badge-warning" style={{ fontSize: '0.65rem' }}>
                          <AlertTriangle size={11} /> Low Confidence ({Math.round(msg.confidence * 100)}%)
                        </span>
                      )
                    )}
                    {msg.threat && (
                      <span className="ai-badge ai-badge-danger" style={{ fontSize: '0.65rem' }}>
                        <AlertTriangle size={11} /> Blocked: {msg.threat}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {msg.text}
              </div>

              {/* Source Citations Box */}
              {msg.sources && msg.sources.length > 0 && (
                <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(0,0,0,0.25)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <BookOpen size={13} color="#60a5fa" /> RAG Knowledge Citations:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {msg.sources.map((src, idx) => (
                      <span key={idx} className="ai-badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd', border: '1px solid rgba(59, 130, 246, 0.3)', fontSize: '0.75rem', fontWeight: 500 }}>
                        📄 {src.document} {src.chunk_index !== undefined ? `(Chunk #${src.chunk_index})` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="ai-chat-bubble assistant">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Sparkles size={18} color="#a78bfa" className="spinning" />
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Analyzing curriculum knowledge and synthesizing response...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="ai-chat-input-bar">
          <input
            type="text"
            className="ai-input"
            style={{ flex: 1, background: 'rgba(0, 0, 0, 0.4)' }}
            placeholder="Ask a question or test prompt injection resistance..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="ai-btn" disabled={!input.trim() || loading} style={{ padding: '12px 24px' }}>
            <Send size={18} />
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
