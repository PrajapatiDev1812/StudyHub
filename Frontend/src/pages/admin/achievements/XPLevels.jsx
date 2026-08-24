import { useState, useEffect } from 'react';
import api from '../../../services/api';

export default function XPLevels() {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/achievements/xp-levels/')
      .then(res => setLevels(res.data.results || res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading XP Levels...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>XP & Levels Configuration</h2>
        <button className="btn-primary">Add Level</button>
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
        {levels.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No level thresholds configured. Students will progress based on default calculation.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem' }}>Level</th>
                <th style={{ padding: '1rem' }}>Title</th>
                <th style={{ padding: '1rem' }}>XP Threshold</th>
              </tr>
            </thead>
            <tbody>
              {levels.map(level => (
                <tr key={level.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>Level {level.level}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{level.title || 'N/A'}</td>
                  <td style={{ padding: '1rem', color: 'var(--accent-primary)', fontWeight: 'bold' }}>{level.xp_threshold} XP</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
