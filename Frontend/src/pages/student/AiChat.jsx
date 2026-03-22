import { useState } from 'react';
import api from '../../services/api';
import './AiChat.css';

export default function AiChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: 'user', text: input };
    setMessages([...messages, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat/', { message: input });
      setMessages(prev => [...prev, { role: 'ai', text: res.data.response }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in ai-chat-page">
      <div className="page-header">
        <h1>AI Assistant</h1>
        <p>Ask anything about your studies</p>
      </div>

      <div className="chat-container glass-card">
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-welcome">
              <span style={{ fontSize: '3rem' }}>🤖</span>
              <h3>Hi! I'm your StudyHub AI Assistant</h3>
              <p>Ask me anything about your courses or study materials.</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`chat-bubble ${msg.role}`}>
              <span className="chat-avatar">{msg.role === 'user' ? '👤' : '🤖'}</span>
              <div className="chat-text">{msg.text}</div>
            </div>
          ))}
          {loading && (
            <div className="chat-bubble ai">
              <span className="chat-avatar">🤖</span>
              <div className="chat-text typing">Thinking...</div>
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
