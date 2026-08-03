import { useState, useEffect, useCallback } from 'react';
import { aiManagementApi } from '../../../services/aiManagement';
import { RefreshCw } from 'lucide-react';

export default function AIRequestLogViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState({
    status: '',
    provider: '',
    user_id: ''
  });

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      // Clean empty filters
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter((entry) => entry[1] !== '')
      );
      const res = await aiManagementApi.getLogs(cleanFilters);
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

  if (loading && logs.length === 0) return <div>Loading logs...</div>;

  return (
    <div className="gov-panel">
      <div className="gov-panel-header">
        <h3>AI Request Logs</h3>
        <div className="gov-actions">
          <button onClick={() => loadLogs()} title="Refresh">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
        <select name="status" value={filters.status} onChange={handleFilterChange} className="gov-btn" style={{ background: 'var(--background)' }}>
          <option value="">All Statuses</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="throttled">Throttled / Rate Limited</option>
          <option value="blocked">Blocked</option>
        </select>
        
        <select name="provider" value={filters.provider} onChange={handleFilterChange} className="gov-btn" style={{ background: 'var(--background)' }}>
          <option value="">All Providers</option>
          <option value="google">Google Gemini</option>
          <option value="openai">OpenAI</option>
        </select>
        
        <input 
          type="text" 
          name="user_id" 
          placeholder="Filter by User ID" 
          value={filters.user_id}
          onChange={handleFilterChange}
          className="gov-btn"
          style={{ background: 'var(--background)', border: '1px solid var(--border)' }}
        />
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="gov-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Role</th>
              <th>Endpoint</th>
              <th>Model</th>
              <th>Tokens</th>
              <th>Time (ms)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id}>
                <td>{new Date(log.timestamp).toLocaleString()}</td>
                <td>{log.username}</td>
                <td><span className="gov-badge default">{log.role_snapshot || 'student'}</span></td>
                <td>{log.request_type}</td>
                <td>{log.model_name || log.provider}</td>
                <td>{log.total_tokens || 0}</td>
                <td>{log.response_time_ms}</td>
                <td>
                  <span className={`gov-badge ${
                    log.status === 'success' ? 'active' : 
                    log.status === 'failed' ? 'inactive' : 'default'
                  }`}>
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan="8" style={{textAlign: 'center', padding: '20px'}}>No logs found matching filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
