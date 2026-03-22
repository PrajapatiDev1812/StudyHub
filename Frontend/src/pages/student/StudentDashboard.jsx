import { useEffect, useState } from 'react';
import api from '../../services/api';
import './Dashboard.css';

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/')
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Student Dashboard</h1>
        <p>Your learning progress at a glance</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Enrolled Courses</div>
          <div className="stat-value">{data?.enrolled_courses_count || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Completed Content</div>
          <div className="stat-value">{data?.completed_content_count || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Content</div>
          <div className="stat-value">{data?.total_content_to_complete || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Overall Progress</div>
          <div className="stat-value">{data?.overall_progress_percentage || 0}%</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="glass-card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 12, fontSize: '1rem' }}>📈 Overall Progress</h3>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${data?.overall_progress_percentage || 0}%` }} />
        </div>
        <p style={{ marginTop: 8, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          {data?.completed_content_count || 0} of {data?.total_content_to_complete || 0} content items completed
        </p>
      </div>

      {/* Recent Activity */}
      <div className="glass-card">
        <h3 style={{ marginBottom: 16, fontSize: '1rem' }}>🕐 Recent Activity</h3>
        {data?.recent_activity?.length > 0 ? (
          <div className="activity-list">
            {data.recent_activity.map((item, i) => (
              <div key={i} className="activity-item">
                <span className="activity-icon">✅</span>
                <div>
                  <span className="activity-title">{item.content_title}</span>
                  <span className="activity-time">
                    {new Date(item.completed_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>No activity yet. Start learning!</p>
        )}
      </div>
    </div>
  );
}
