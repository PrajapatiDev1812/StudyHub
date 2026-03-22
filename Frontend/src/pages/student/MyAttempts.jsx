import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function MyAttempts() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/my-attempts/')
      .then(res => setAttempts(res.data.results || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>My Attempts</h1>
        <p>Your test history and scores</p>
      </div>

      {attempts.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--text-muted)' }}>No test attempts yet.</p>
        </div>
      ) : (
        <div className="glass-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Test</th>
                <th>Score</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map(a => (
                <tr key={a.id}>
                  <td>{a.test_title}</td>
                  <td><b>{a.score}%</b></td>
                  <td>
                    {a.passed
                      ? <span className="badge badge-success">Passed</span>
                      : <span className="badge badge-danger">Failed</span>}
                  </td>
                  <td>{new Date(a.submitted_at).toLocaleDateString()}</td>
                  <td><Link to={`/student/attempts/${a.id}`} className="btn btn-secondary btn-sm">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
