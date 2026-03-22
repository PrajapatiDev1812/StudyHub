import { useEffect, useState } from 'react';
import api from '../../services/api';
import '../student/Dashboard.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/courses/').catch(() => ({ data: { results: [] } })),
      api.get('/tests/').catch(() => ({ data: { results: [] } })),
    ]).then(([coursesRes, testsRes]) => {
      const courses = coursesRes.data.results || coursesRes.data || [];
      const tests = testsRes.data.results || testsRes.data || [];
      setStats({ courseCount: courses.length, testCount: tests.length, courses, tests });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Overview of your platform</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Courses</div>
          <div className="stat-value">{stats?.courseCount || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Tests</div>
          <div className="stat-value">{stats?.testCount || 0}</div>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 16, fontSize: '1rem' }}>📚 Recent Courses</h3>
        {stats?.courses?.length > 0 ? (
          <table className="data-table">
            <thead><tr><th>Name</th><th>Public</th></tr></thead>
            <tbody>
              {stats.courses.slice(0, 5).map(c => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.is_public ? <span className="badge badge-success">Yes</span> : <span className="badge badge-warning">No</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p style={{ color: 'var(--text-muted)' }}>No courses yet.</p>}
      </div>
    </div>
  );
}
