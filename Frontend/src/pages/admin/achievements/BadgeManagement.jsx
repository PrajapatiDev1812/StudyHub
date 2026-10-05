import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import api from '../../../services/api';

export default function BadgeManagement() {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = () => {
    setLoading(true);
    api.get('/admin/achievements/badges/')
      .then(res => setBadges(res.data.results || res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading badges...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>Badge Management</h2>
        <button className="btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Plus size={18} /> Add Badge
        </button>
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-sidebar)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Badge</th>
              <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Category</th>
              <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>XP Reward</th>
              <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Status</th>
              <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {badges.map(badge => (
              <tr key={badge.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {badge.icon ? (
                    <img src={badge.icon} alt={badge.name} style={{ width: '40px', height: '40px', borderRadius: '8px' }} />
                  ) : (
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--border-color)' }} />
                  )}
                  <div>
                    <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{badge.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{badge.description}</div>
                  </div>
                </td>
                <td style={{ padding: '1rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{badge.category}</td>
                <td style={{ padding: '1rem', color: 'var(--accent-primary)', fontWeight: 'bold' }}>+{badge.xp_reward} XP</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '0.75rem', 
                    fontWeight: 'bold',
                    background: badge.status === 'active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                    color: badge.status === 'active' ? '#10b981' : 'var(--text-muted)',
                    textTransform: 'uppercase'
                  }}>
                    {badge.status}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginRight: '0.5rem' }}>
                    <Edit2 size={16} />
                  </button>
                  <button style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {badges.length === 0 && (
              <tr>
                <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No badges found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
