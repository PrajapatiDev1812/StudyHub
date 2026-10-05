import { useState, useEffect } from 'react';
import api from '../../../services/api';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/achievements/audit-logs/')
      .then(res => setLogs(res.data.results || res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading audit logs...</div>;

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Achievement Audit Logs</h2>

      <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-sidebar)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Date</th>
              <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Actor</th>
              <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Action</th>
              <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Target</th>
              <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Reason</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{log.actor_name}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '0.75rem', 
                    background: 'var(--bg-active)',
                    color: 'var(--text-primary)',
                    textTransform: 'uppercase'
                  }}>
                    {log.action.replace('_', ' ')}
                  </span>
                </td>
                <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{log.target_user_name || '-'}</td>
                <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>{log.reason || '-'}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No audit logs found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
