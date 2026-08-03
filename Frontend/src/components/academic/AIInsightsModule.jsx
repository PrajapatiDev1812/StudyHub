import React, { useState } from 'react';
import { Sparkles, AlertTriangle, TrendingUp, CheckCircle, Send, Lightbulb } from 'lucide-react';

export default function AIInsightsModule({ data }) {
  const [query, setQuery] = useState('');
  const [aiAnswers, setAiAnswers] = useState([]);
  const [asking, setAsking] = useState(false);

  const insightsList = data?.insights || [];
  const recommendations = data?.recommendations || [];

  const handleAskAI = (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setAsking(true);
    const userQ = query;
    setQuery('');

    setTimeout(() => {
      let answerText = "Based on current class telemetry: M.Sc Data Science Year 2 shows an average attendance of 86.4% and an assignment completion rate of 89.2%. Rahul Sharma and Ananya Roy require immediate academic intervention due to attendance dropping below 75%.";
      if (userQ.toLowerCase().includes('weak')) {
        answerText = "The weakest curriculum topic is 'B-Tree & Bitmap Indexing' with an average quiz correctness of 62%, followed by 'Slowly Changing Dimensions (Type 2)' at 68%.";
      } else if (userQ.toLowerCase().includes('attention') || userQ.toLowerCase().includes('risk')) {
        answerText = "4 students are currently flagged as High/Critical Risk: Rahul Sharma (Risk Score: 72%), Ananya Roy (48%), and 2 others due to unsubmitted ETL assignments.";
      }

      setAiAnswers(prev => [{ question: userQ, answer: answerText, timestamp: new Date().toLocaleTimeString() }, ...prev]);
      setAsking(false);
    }, 600);
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={20} color="var(--accent-primary)" />
          AI Academic Advisor & Predictive Analytics
        </h3>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Automated intelligent risk detection and actionable instructional recommendations
        </span>
      </div>

      {/* Interactive AI Class Query Box */}
      <div className="glass-card" style={{ padding: 22, marginBottom: 24, background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.06))' }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          Ask AI Academic Advisor About Your Class
        </h4>

        <form onSubmit={handleAskAI} style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <input
            type="text"
            placeholder="Ask a question (e.g. 'Which students need attention?', 'Which topic is weakest?')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-glass)',
              color: 'var(--text-primary)',
              fontSize: '0.88rem',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={asking}
            className="admin-action-btn primary"
            style={{ padding: '10px 18px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Send size={15} /> {asking ? 'Thinking...' : 'Ask AI'}
          </button>
        </form>

        {/* Example Prompt Quick Buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>Suggested Prompts:</span>
          {['Which students need attention?', 'Summarize class performance.', 'Which topic is weakest?'].map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setQuery(p)}
              style={{
                padding: '4px 10px',
                borderRadius: 14,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-glass)',
                color: 'var(--accent-primary)',
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
            >
              "{p}"
            </button>
          ))}
        </div>

        {/* AI Answer Cards Stream */}
        {aiAnswers.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 18 }}>
            {aiAnswers.map((ans, i) => (
              <div key={i} style={{ padding: 14, borderRadius: 8, background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--accent-primary)', marginBottom: 4 }}>
                  Q: {ans.question}
                </div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {ans.answer}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grid: Automated Findings & Suggested Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
        {/* Automated Findings */}
        <div className="glass-card" style={{ padding: 20 }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '1.02rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Automated Academic Insights
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {insightsList.map((ins) => (
              <div
                key={ins.id}
                style={{
                  padding: 14, borderRadius: 8,
                  background: ins.severity === 'high' ? 'rgba(239, 68, 68, 0.08)' : ins.severity === 'medium' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                  border: ins.severity === 'high' ? '1px solid rgba(239, 68, 68, 0.25)' : ins.severity === 'medium' ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(16, 185, 129, 0.25)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  {ins.severity === 'high' && <AlertTriangle size={16} color="#EF4444" />}
                  {ins.severity === 'medium' && <TrendingUp size={16} color="#F59E0B" />}
                  {ins.severity === 'low' && <CheckCircle size={16} color="#10B981" />}
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{ins.title}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {ins.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Teacher Actions */}
        <div className="glass-card" style={{ padding: 20 }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '1.02rem', fontWeight: 600, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lightbulb size={18} /> Recommended Teacher Actions
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recommendations.map((rec, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: 8, background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '0.88rem' }}>{idx + 1}.</span>
                <span style={{ fontSize: '0.86rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
