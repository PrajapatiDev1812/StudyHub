import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { BarChart, Activity } from 'lucide-react';

export default function AchievementAnalytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/achievements/analytics/')
      .then(res => setStats(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading analytics...</div>;

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Achievement Analytics</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
            <BarChart size={20} />
            <h3 style={{ fontSize: '1.125rem' }}>Badge Distribution</h3>
          </div>
          {stats?.category_distribution?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {stats.category_distribution.map(cat => {
                const percentage = Math.min(100, Math.max(5, (cat.count / stats.total_badges) * 100));
                return (
                  <div key={cat.category}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', textTransform: 'capitalize' }}>{cat.category}</span>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{cat.count}</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${percentage}%`, height: '100%', background: 'var(--accent-primary)', borderRadius: '4px' }}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Not enough data to display.</p>
          )}
        </div>

        <div style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
            <Activity size={20} />
            <h3 style={{ fontSize: '1.125rem' }}>Engagement Insights</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            A total of <strong style={{ color: 'var(--text-primary)' }}>{stats?.total_awarded}</strong> badges have been awarded to <strong style={{ color: 'var(--text-primary)' }}>{stats?.students_with_badges}</strong> distinct students.
          </p>
          <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderLeft: '4px solid #3b82f6', borderRadius: '4px', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
            Tip: Create more consistency badges to encourage daily log-ins.
          </div>
        </div>
      </div>
    </div>
  );
}
