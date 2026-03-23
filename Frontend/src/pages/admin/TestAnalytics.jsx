import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';

export default function TestAnalytics() {
  const { id } = useParams();
  const [test, setTest] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/tests/${id}/`),
      api.get(`/attempts/?test=${id}`),
    ]).then(([testRes, attRes]) => {
      setTest(testRes.data);
      setAttempts(attRes.data.results || attRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="spinner" />;
  if (!test) return <p style={{ color: 'var(--text-muted)', padding: 40 }}>Test not found.</p>;

  const totalAttempts = attempts.length;
  const passed = attempts.filter(a => a.passed).length;
  const failed = totalAttempts - passed;
  const avgScore = totalAttempts ? (attempts.reduce((sum, a) => sum + (a.score || 0), 0) / totalAttempts).toFixed(1) : 0;
  const passRate = totalAttempts ? ((passed / totalAttempts) * 100).toFixed(0) : 0;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Test Analytics</h1>
        <p>{test.title}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Attempts</div>
          <div className="stat-value">{totalAttempts}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Passed</div>
          <div className="stat-value" style={{ WebkitTextFillColor: 'var(--success)' }}>{passed}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Failed</div>
          <div className="stat-value" style={{ WebkitTextFillColor: 'var(--danger)' }}>{failed}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Score</div>
          <div className="stat-value">{avgScore}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pass Rate</div>
          <div className="stat-value">{passRate}%</div>
        </div>
      </div>

      <div className="glass-card" style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 16, fontSize: '1rem' }}>📊 Score Distribution</h3>
        <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 120, padding: '0 8px' }}>
          {[...Array(10)].map((_, i) => {
            const low = i * 10;
            const high = low + 10;
            const count = attempts.filter(a => a.score >= low && a.score < high).length;
            const height = totalAttempts ? (count / totalAttempts) * 100 : 0;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{count}</span>
                <div style={{
                  width: '100%', height: `${Math.max(height, 3)}%`,
                  background: i >= 5 ? 'var(--accent-gradient)' : 'var(--danger)',
                  borderRadius: 4, minHeight: 4, transition: 'height 0.3s ease'
                }} />
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{low}-{high}</span>
              </div>
            );
          })}
        </div>
      </div>

      {totalAttempts > 0 && (
        <div className="glass-card" style={{ marginTop: 24 }}>
          <h3 style={{ marginBottom: 16, fontSize: '1rem' }}>📋 All Attempts</h3>
          <table className="data-table">
            <thead><tr><th>Student</th><th>Score</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {attempts.map(a => (
                <tr key={a.id}>
                  <td>{a.student_username || a.student}</td>
                  <td><b>{a.score}%</b></td>
                  <td>{a.passed ? <span className="badge badge-success">Passed</span> : <span className="badge badge-danger">Failed</span>}</td>
                  <td>{new Date(a.submitted_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
