import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';

export default function TestResults() {
  const { id } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/attempts/${id}/`)
      .then(res => setAttempt(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="spinner" />;
  if (!attempt) return <p style={{ color: 'var(--text-muted)', padding: 40 }}>Attempt not found.</p>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Test Results</h1>
        <p>{attempt.test_title}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Score</div>
          <div className="stat-value">{attempt.score}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Status</div>
          <div className="stat-value" style={{ WebkitTextFillColor: attempt.passed ? 'var(--success)' : 'var(--danger)' }}>
            {attempt.passed ? '✅ Passed' : '❌ Failed'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Marks</div>
          <div className="stat-value">{attempt.marks_obtained}/{attempt.total_marks}</div>
        </div>
      </div>

      {attempt.answers?.map((ans, idx) => (
        <div key={idx} className="glass-card" style={{ marginBottom: 12 }}>
          <h4 style={{ marginBottom: 8 }}>
            Q{idx + 1}. {ans.question_text}
            <span style={{ float: 'right' }}>
              {ans.is_correct ? <span className="badge badge-success">✓ Correct</span> : <span className="badge badge-danger">✗ Wrong</span>}
            </span>
          </h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Your answer: <b>{ans.selected_option_text}</b>
          </p>
          {!ans.is_correct && (
            <p style={{ color: 'var(--success)', fontSize: '0.85rem' }}>
              Correct answer: <b>{ans.correct_option_text}</b>
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
