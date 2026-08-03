import { useState, useEffect } from 'react';
import { aiManagementApi } from '../../../services/aiManagement';
import { RefreshCw, Download } from 'lucide-react';

export default function AIUsageDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await aiManagementApi.getDashboardStats();
      setStats(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleExport = (type) => {
    // Last 30 days
    const end = new Date().toISOString().split('T')[0];
    const d = new Date();
    d.setDate(d.getDate() - 30);
    const start = d.toISOString().split('T')[0];
    
    window.location.href = aiManagementApi.getExportUrl(type, start, end);
  };

  if (loading) return <div>Loading dashboard...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!stats) return null;

  return (
    <div className="gov-panel">
      <div className="gov-panel-header">
        <h3>Today's AI Usage Overview</h3>
        <div className="gov-actions">
          <button onClick={() => loadStats()} title="Refresh">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="gov-stats-grid">
        <div className="gov-stat-card">
          <div className="gov-stat-title">Total Requests</div>
          <div className="gov-stat-value">{stats.total_requests_today}</div>
        </div>
        <div className="gov-stat-card">
          <div className="gov-stat-title">Total Tokens</div>
          <div className="gov-stat-value">{(stats.total_tokens_today || 0).toLocaleString()}</div>
        </div>
        <div className="gov-stat-card">
          <div className="gov-stat-title">Active Users</div>
          <div className="gov-stat-value">{stats.active_users_today}</div>
        </div>
        <div className="gov-stat-card">
          <div className="gov-stat-title">Avg Response Time</div>
          <div className="gov-stat-value">{stats.average_response_time_ms}ms</div>
        </div>
        <div className="gov-stat-card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <div className="gov-stat-title" style={{ color: '#ef4444' }}>Blocked / Throttled</div>
          <div className="gov-stat-value">{stats.blocked_requests_today}</div>
        </div>
        <div className="gov-stat-card">
          <div className="gov-stat-title">Most Used Model</div>
          <div className="gov-stat-value" style={{ fontSize: '1.2rem', marginTop: '10px' }}>
            {stats.most_used_model || 'N/A'}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h4 style={{ marginBottom: '16px' }}>Export Reports (CSV - Last 30 Days)</h4>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="gov-btn" onClick={() => handleExport('daily')} style={{ border: '1px solid var(--border)' }}>
            <Download size={16} /> Daily Usage
          </button>
          <button className="gov-btn" onClick={() => handleExport('role')} style={{ border: '1px solid var(--border)' }}>
            <Download size={16} /> Usage by Role
          </button>
          <button className="gov-btn" onClick={() => handleExport('user')} style={{ border: '1px solid var(--border)' }}>
            <Download size={16} /> Top Users
          </button>
          <button className="gov-btn" onClick={() => handleExport('tokens')} style={{ border: '1px solid var(--border)' }}>
            <Download size={16} /> Token Consumption
          </button>
        </div>
      </div>
    </div>
  );
}
