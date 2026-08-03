import { useState, useEffect, useCallback } from 'react';
import { aiManagementApi } from '../../../services/aiManagement';
import { RefreshCw } from 'lucide-react';

export default function AIAuditLogViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState({
    action: '',
    entity_type: ''
  });

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter((entry) => entry[1] !== '')
      );
      const res = await aiManagementApi.getAuditLogs(cleanFilters);
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  if (loading && logs.length === 0) return <div>Loading audit logs...</div>;

  return (
    <div className="gov-panel">
      <div className="gov-panel-header">
        <h3>Governance Audit Trail</h3>
        <div className="gov-actions">
          <button onClick={() => loadLogs()} title="Refresh">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
        <select name="action" value={filters.action} onChange={handleFilterChange} className="gov-btn" style={{ background: 'var(--background)' }}>
          <option value="">All Actions</option>
          <option value="quota_policy_created">Quota Created</option>
          <option value="quota_policy_updated">Quota Updated</option>
          <option value="provider_updated">Provider Updated</option>
          <option value="feature_flag_changed">Feature Flag Changed</option>
          <option value="user_quota_reset">User Quota Reset</option>
        </select>
        
        <select name="entity_type" value={filters.entity_type} onChange={handleFilterChange} className="gov-btn" style={{ background: 'var(--background)' }}>
          <option value="">All Entities</option>
          <option value="quota_policy">Quota Policy</option>
          <option value="provider">AI Provider</option>
          <option value="model">AI Model</option>
          <option value="feature_flag">Feature Flag</option>
          <option value="user_quota">User Quota</option>
        </select>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="gov-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Admin User</th>
              <th>Action</th>
              <th>Description</th>
              <th>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id}>
                <td style={{ whiteSpace: 'nowrap' }}>{new Date(log.timestamp).toLocaleString()}</td>
                <td><strong>{log.admin_username}</strong></td>
                <td><span className="gov-badge default">{log.action_display}</span></td>
                <td>{log.description}</td>
                <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{log.ip_address || 'system'}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>No audit logs found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
