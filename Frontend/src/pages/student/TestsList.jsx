import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function TestsList() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tests/')
      .then(res => setTests(res.data.results || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Available Tests</h1>
        <p>Take quizzes and test your knowledge</p>
      </div>

      {tests.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No tests available right now.</p>
      ) : (
        <div className="courses-grid">
          {tests.map(test => (
            <div key={test.id} className="glass-card course-card">
              <h3>📝 {test.title}</h3>
              <p className="course-desc">{test.description?.slice(0, 100)}</p>
              <div className="course-meta">
                {test.time_limit_minutes && <span>⏱️ {test.time_limit_minutes} min</span>}
                <span>📊 Pass: {test.passing_score}%</span>
              </div>
              <Link to={`/student/tests/${test.id}`} className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
                Take Test
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
