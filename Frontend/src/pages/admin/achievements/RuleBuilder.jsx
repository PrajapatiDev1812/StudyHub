import { useState, useEffect } from 'react';
import api from '../../../services/api';

export default function RuleBuilder() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/achievements/rules/')
      .then(res => setRules(res.data.results || res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading rules...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>Achievement Rules Builder</h2>
        <button className="btn-primary">Create Rule</button>
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
        {rules.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No dynamic rules configured yet. Create a rule to automatically award badges based on student metrics.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem' }}>Badge ID</th>
                <th style={{ padding: '1rem' }}>Metric</th>
                <th style={{ padding: '1rem' }}>Operator</th>
                <th style={{ padding: '1rem' }}>Value</th>
              </tr>
            </thead>
            <tbody>
              {rules.map(rule => (
                <tr key={rule.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{rule.badge}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{rule.metric}</td>
                  <td style={{ padding: '1rem', color: 'var(--accent-primary)', fontWeight: 'bold' }}>{rule.operator}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{rule.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
