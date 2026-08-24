import { useState, useEffect } from 'react';
import { Trophy, Award, Users, Activity } from 'lucide-react';
import api from '../../../services/api';

export default function AchievementOverview() {
  const [stats, setStats] = useState({
    total_badges: 0,
    total_awarded: 0,
    students_with_badges: 0,
    category_distribution: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/achievements/analytics/')
      .then(res => {
        setStats(res.data);
      })
      .catch(err => console.error("Error fetching achievement stats", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading overview...</div>;

  const statCards = [
    { title: 'Total Badges', value: stats.total_badges, icon: Award, color: '#3b82f6' },
    { title: 'Total Awarded', value: stats.total_awarded, icon: Trophy, color: '#f59e0b' },
    { title: 'Students With Badges', value: stats.students_with_badges, icon: Users, color: '#10b981' },
    { title: 'Active Rules', value: 'Dynamic', icon: Activity, color: '#8b5cf6' },
  ];

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Overview</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {statCards.map(card => (
          <div key={card.title} style={{
            background: 'var(--bg-card, rgba(255, 255, 255, 0.05))',
            borderRadius: '12px',
            padding: '1.5rem',
            border: '1px solid var(--border-color)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{ padding: '1rem', background: `${card.color}20`, borderRadius: '12px', color: card.color }}>
              <card.icon size={24} />
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>{card.title}</div>
              <div style={{ color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 'bold' }}>{card.value}</div>
            </div>
          </div>
        ))}
      </div>
      
      <div style={{ background: 'var(--bg-card, rgba(255, 255, 255, 0.05))', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Category Distribution</h3>
        {stats.category_distribution.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No category data available.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {stats.category_distribution.map(cat => (
              <li key={cat.category} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{cat.category}</span>
                <span style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>{cat.count} Badges</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
